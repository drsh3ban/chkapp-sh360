import { createStore } from './index'
import { ImageStorageService } from '../services/imageStorage'
import { FirestoreService } from '../services/firestoreService'

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
            id: String(Date.now()),
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

        // Auto Firebase Sync - Always enabled (Photos + Movement Data)
        // Upload photos in background
        const uploadedUrls = [];
        Promise.all(movement.exitPhotos.map(async (photoPath) => {
            try {
                const base64 = await ImageStorageService.readAsBase64(photoPath);
                if (base64) {
                    const fileName = `exit_${movement.id}_${Date.now()}.jpg`;
                    const url = await ImageStorageService.uploadToFirebase(base64, fileName);
                    uploadedUrls.push(url);
                    return url;
                }
            } catch (e) {
                console.warn('Photo upload failed:', e);
            }
        })).then(async () => {
            // Save movement to Firestore with uploaded photo URLs
            try {
                await FirestoreService.saveMovement({
                    ...movement,
                    exitPhotoUrls: uploadedUrls
                });
                console.log('Movement synced to Firestore');
            } catch (e) {
                console.warn('Firestore sync failed:', e);
            }
        }).catch(e => console.warn('Background Firebase sync failed:', e));

        return movement
    },

    registerReturn: async (movementId, returnData) => {
        // 1. Save images to filesystem first
        const savedReturnPhotos = await savePhotos(returnData.returnPhotos, 'return');

        const state = movementsStore.getState();
        const updatedMovements = state.movements.map(m =>
            String(m.id) === String(movementId)
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

        // Get the updated movement for sync
        const updatedMovement = updatedMovements.find(m => String(m.id) === String(movementId));

        // Auto Firebase Sync - Always enabled (Photos + Movement Data)
        if (updatedMovement) {
            const photosToUpload = updatedMovement.returnPhotos || [];
            const uploadedUrls = [];

            Promise.all(photosToUpload.map(async (photoPath) => {
                try {
                    const base64 = await ImageStorageService.readAsBase64(photoPath);
                    if (base64) {
                        const fileName = `return_${movementId}_${Date.now()}.jpg`;
                        const url = await ImageStorageService.uploadToFirebase(base64, fileName);
                        uploadedUrls.push(url);
                        return url;
                    }
                } catch (e) {
                    console.warn('Photo upload failed:', e);
                }
            })).then(async () => {
                // Save movement to Firestore with uploaded photo URLs
                try {
                    await FirestoreService.saveMovement({
                        ...updatedMovement,
                        returnPhotoUrls: uploadedUrls
                    });
                    console.log('Return movement synced to Firestore');
                } catch (e) {
                    console.warn('Firestore sync failed:', e);
                }
            }).catch(e => console.warn('Background Firebase sync failed:', e));
        }
    },

    deleteMovement: (id) => {
        movementsStore.setState((state) => ({
            movements: state.movements.filter(m => String(m.id) !== String(id))
        }))
    },

    getActiveMovements: () => {
        return movementsStore.getState().movements.filter(m => m.status === 'active')
    },

    getMovementByCarId: (carId) => {
        return movementsStore.getState().movements.find(
            m => String(m.carId) === String(carId) && m.status === 'active'
        )
    },

    clearCompleted: () => {
        movementsStore.setState((state) => ({
            movements: state.movements.filter(m => m.status === 'active')
        }))
    },

    /**
     * Update movement with AI report data
     * @param {string} movementId - The movement ID to update
     * @param {Object} reportData - { exitConditionReport, returnConditionReport, damageComparisonReport }
     */
    updateAIReport: async (movementId, reportData) => {
        const state = movementsStore.getState();
        const updatedMovements = state.movements.map(m =>
            String(m.id) === String(movementId)
                ? { ...m, aiReports: { ...(m.aiReports || {}), ...reportData } }
                : m
        );

        movementsStore.setState({ movements: updatedMovements });

        // Sync to Firestore
        const updatedMovement = updatedMovements.find(m => String(m.id) === String(movementId));
        if (updatedMovement) {
            try {
                await FirestoreService.saveMovement(updatedMovement);
                console.log('AI Report synced to Firestore');
            } catch (e) {
                console.warn('Firestore AI report sync failed:', e);
            }
        }
    }
}
