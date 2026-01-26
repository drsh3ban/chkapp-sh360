import { FirestoreService } from './firestoreService.js';
import { carsStore } from '../store/carsStore.js';
import { movementsStore } from '../store/movementsStore.js';
import { authStore } from '../store/authStore';

/**
 * Firebase Data Sync Service
 * Handles loading and syncing data with Firestore
 */
export const FirebaseSyncService = {
    /**
     * Load all data from Firestore and merge with local storage
     * Called on app startup to restore data
     */
    async loadFromFirestore() {
        const companyId = authStore.getState().companyId;
        if (!companyId) {
            console.warn('Sync skipped: No companyId available yet');
            return { cars: 0, movements: 0, users: 0 };
        }

        console.log('Loading data from Firestore for company:', companyId);

        try {
            // Load cars from Firestore
            const firestoreCars = await FirestoreService.getCars(companyId);
            if (firestoreCars.length > 0) {
                const localCars = carsStore.getState().cars || [];
                const mergedCars = this.mergeData(firestoreCars, localCars, 'id');
                carsStore.setState({ cars: mergedCars });
                console.log(`Loaded ${firestoreCars.length} cars from Firestore`);
            }

            // Load movements from Firestore
            const firestoreMovements = await FirestoreService.getMovements(companyId);
            if (firestoreMovements.length > 0) {
                // Convert Firebase photo URLs to displayable format
                const processedMovements = firestoreMovements.map(m => ({
                    ...m,
                    exitPhotos: m.exitPhotoUrls || m.exitPhotos || [],
                    returnPhotos: m.returnPhotoUrls || m.returnPhotos || []
                }));

                const localMovements = movementsStore.getState().movements || [];
                const mergedMovements = this.mergeData(processedMovements, localMovements, 'id');
                movementsStore.setState({ movements: mergedMovements });
                console.log(`Loaded ${firestoreMovements.length} movements from Firestore`);
            }

            // Load users from Firestore
            const firestoreUsers = await FirestoreService.getUsers(companyId);
            if (firestoreUsers.length > 0) {
                const localUsers = JSON.parse(localStorage.getItem('autocheck_users') || '[]');
                const mergedUsers = this.mergeData(firestoreUsers, localUsers, 'id');
                localStorage.setItem('autocheck_users', JSON.stringify(mergedUsers));
                console.log(`Loaded ${firestoreUsers.length} users from Firestore`);
            }

            console.log('Firestore data sync complete');

            // Run consistency check to fix status mismatches
            this.validateConsistency();

            return {
                cars: firestoreCars.length,
                movements: firestoreMovements.length,
                users: firestoreUsers.length
            };
        } catch (e) {
            console.error('Failed to load from Firestore:', e);
            return { cars: 0, movements: 0, users: 0, error: e.message };
        }
    },

    /**
     * Merge Firestore data with local data
     * Firestore takes priority for existing items
     */
    mergeData(firestoreData, localData, idField) {
        const firestoreMap = new Map();
        firestoreData.forEach(item => {
            const id = String(item[idField] || item.username || item.plateNumber);
            firestoreMap.set(id, item);
        });

        // Add local items that don't exist in Firestore
        localData.forEach(item => {
            const id = String(item[idField] || item.username || item.plateNumber);
            if (!firestoreMap.has(id)) {
                firestoreMap.set(id, item);
            }
        });

        return Array.from(firestoreMap.values());
    },

    /**
     * Check if data needs to be synced from Firestore
     * Called on app startup
     */
    async initializeSync() {
        try {
            const result = await this.loadFromFirestore();
            if (result.cars > 0 || result.movements > 0 || result.users > 0) {
                console.log(`Restored: ${result.cars} cars, ${result.movements} movements, ${result.users} users`);
            }
            return result;
        } catch (e) {
            console.warn('Firestore sync skipped:', e.message);
            return null;
        }
    },

    /**
     * Ensure car status matches the movements record
     * If an active movement exists, the car MUST be 'out'
     */
    validateConsistency() {
        const { cars } = carsStore.getState();
        const { movements } = movementsStore.getState();
        let changed = false;

        const updatedCars = cars.map(car => {
            const activeMovement = movements.find(m => String(m.carId) === String(car.id) && m.status === 'active');

            if (activeMovement && car.status === 'in') {
                console.log(`Consistency fix: Car ${car.plate} status corrected to 'out' (active movement found)`);
                changed = true;
                return { ...car, status: 'out' };
            }

            if (!activeMovement && car.status === 'out') {
                console.log(`Consistency fix: Car ${car.plate} status corrected to 'in' (no active movement found)`);
                changed = true;
                return { ...car, status: 'in' };
            }

            return car;
        });

        if (changed) {
            carsStore.setState({ cars: updatedCars });
        }
    }
};
