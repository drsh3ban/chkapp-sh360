import { createStore } from './index'
import { ImageStorageService } from '../services/imageStorage'
import { FTPService } from '../services/ftpStorage'

// Migration: Clear large base64 strings from historical movements to free up localStorage
const migrateMovements = (movements) => {
    let migrated = false;
    const cleanMovements = movements.map(m => {
        let entryMigrated = false;
        const newM = { ...m };

        // If photos are still base64 and too long, we can't easily move them to files now
        // without knowing which car/date etc, so we'll just truncate or remove them
        // to save the app from crashing.
        if (newM.exitPhotos && Array.isArray(newM.exitPhotos)) {
            newM.exitPhotos = newM.exitPhotos.map(p => {
                if (typeof p === 'string' && p.startsWith('data:image') && p.length > 5000) {
                    entryMigrated = true;
                    return 'removed_to_free_space';
                }
                return p;
            });
        }
        if (newM.returnPhotos && Array.isArray(newM.returnPhotos)) {
            newM.returnPhotos = newM.returnPhotos.map(p => {
                if (typeof p === 'string' && p.startsWith('data:image') && p.length > 5000) {
                    entryMigrated = true;
                    return 'removed_to_free_space';
                }
                return p;
            });
        }

        if (entryMigrated) migrated = true;
        return newM;
    });
    return { cleanMovements, migrated };
};

const savedMovementsStr = localStorage.getItem('autocheck_movements')
let initialMovements = []
try {
    initialMovements = savedMovementsStr ? JSON.parse(savedMovementsStr) : []
    if (!Array.isArray(initialMovements)) initialMovements = []
} catch (e) {
    console.error('Failed to parse movements from localStorage', e)
    initialMovements = []
}

// Run migration on load
const { cleanMovements, migrated } = migrateMovements(initialMovements);
if (migrated) {
    initialMovements = cleanMovements;
    try {
        localStorage.setItem('autocheck_movements', JSON.stringify(initialMovements));
    } catch (e) {
        console.error('Failed to save migrated movements', e);
    }
}

export const movementsStore = createStore({
    movements: initialMovements,
    filters: {
        search: '',
        status: 'all' // 'all', 'active', 'completed'
    }
})

// Auto-save with safety
movementsStore.subscribe((state) => {
    try {
        localStorage.setItem('autocheck_movements', JSON.stringify(state.movements))
    } catch (e) {
        console.error('CRITICAL: Failed to save movements to localStorage:', e);
        // If we still hit quota, maybe clear very old completed ones?
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.warn('Handling QuotaExceededError by clearing oldest completed movements');
            const activeOnly = state.movements.filter(m => m.status === 'active');
            localStorage.setItem('autocheck_movements', JSON.stringify(activeOnly));
        }
    }
})

// Helper to save array of photos
const savePhotos = async (photos, prefix) => {
    if (!photos || !Array.isArray(photos)) return [];

    // Process in parallel
    const savedPaths = await Promise.all(photos.map(async (photoItem) => {
        const data = typeof photoItem === 'string' ? photoItem : (photoItem.data || '');

        // If it's already a path (not base64), just return the path
        if (data.length < 500 && !data.startsWith('data:')) return data;

        return await ImageStorageService.saveImage(data, prefix);
    }));

    return savedPaths;
};

// Movements actions
export const movementsActions = {
    // Made async to handle file saving
    registerExit: async (exitData) => {
        // 1. Save images to filesystem first
        const savedExitPhotos = await savePhotos(exitData.exitPhotos, 'exit');

        const movement = {
            id: Date.now(),
            ...exitData,
            exitPhotos: savedExitPhotos, // Store paths instead of base64
            exitTime: new Date().toISOString(),
            status: 'active',
            returnTime: null,
            returnMileage: null,
            returnFuel: null,
            returnPhotos: null
        }

        movementsStore.setState((state) => ({
            movements: [...state.movements, movement]
        }))

        // Optional Firebase Sync
        if (localStorage.getItem('firebase_enabled') === 'true') {
            Promise.all(movement.exitPhotos.map(async (photoPath) => {
                const base64 = await ImageStorageService.readAsBase64(photoPath);
                if (base64) {
                    const fileName = photoPath.split('/').pop() || `exit_${Date.now()}.jpg`;
                    return ImageStorageService.uploadToFirebase(base64, fileName);
                }
            })).catch(e => console.warn('Background Firebase sync failed:', e));
        }

        // Optional FTP Sync
        FTPService.syncMovement(movement).catch(e => console.warn('Background FTP sync failed:', e));

        return movement
    },

    registerReturn: async (movementId, returnData) => {
        // 1. Save images to filesystem first
        const savedReturnPhotos = await savePhotos(returnData.returnPhotos, 'return');

        const state = movementsStore.getState();
        const updatedMovements = state.movements.map(m =>
            m.id === movementId
                ? {
                    ...m,
                    ...returnData,
                    returnPhotos: savedReturnPhotos, // Store paths
                    returnTime: new Date().toISOString(),
                    status: 'completed'
                }
                : m
        );

        movementsStore.setState({
            movements: updatedMovements
        });

        // Optional Firebase Sync
        if (localStorage.getItem('firebase_enabled') === 'true' && updatedMovement) {
            const photosToUpload = updatedMovement.returnPhotos || [];
            Promise.all(photosToUpload.map(async (photoPath) => {
                const base64 = await ImageStorageService.readAsBase64(photoPath);
                if (base64) {
                    const fileName = photoPath.split('/').pop() || `return_${Date.now()}.jpg`;
                    return ImageStorageService.uploadToFirebase(base64, fileName);
                }
            })).catch(e => console.warn('Background Firebase sync failed:', e));
        }

        // Optional FTP Sync
        if (updatedMovement) {
            FTPService.syncMovement(updatedMovement).catch(e => console.warn('Background FTP sync failed:', e));
        }
    },

    deleteMovement: (id) => {
        movementsStore.setState((state) => ({
            movements: state.movements.filter(m => m.id !== id)
        }))
    },

    getActiveMovements: () => {
        return movementsStore.getState().movements.filter(m => m.status === 'active')
    },

    getMovementByCarId: (carId) => {
        return movementsStore.getState().movements.find(
            m => m.carId === carId && m.status === 'active'
        )
    },

    clearCompleted: () => {
        movementsStore.setState((state) => ({
            movements: state.movements.filter(m => m.status === 'active')
        }))
    }
}
