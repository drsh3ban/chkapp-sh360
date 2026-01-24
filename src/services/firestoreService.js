import { db } from './firebaseConfig.js';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Firestore Database Service
 * Handles syncing cars, users, and movements to Firebase
 */
export const FirestoreService = {
    // ==================== CARS ====================

    /**
     * Save or update a car in Firestore
     */
    async saveCar(car) {
        try {
            const carId = String(car.id || car.plateNumber);
            const carRef = doc(db, 'cars', carId);
            await setDoc(carRef, {
                ...car,
                id: carId,
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log('Car saved to Firestore:', carId);
            return true;
        } catch (e) {
            console.error('Failed to save car:', e);
            throw new Error('فشل حفظ السيارة: ' + e.message);
        }
    },

    /**
     * Get all cars from Firestore
     */
    async getCars() {
        try {
            const carsRef = collection(db, 'cars');
            const snapshot = await getDocs(carsRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Failed to get cars:', e);
            return [];
        }
    },

    /**
     * Delete a car from Firestore
     */
    async deleteCar(carId) {
        try {
            await deleteDoc(doc(db, 'cars', carId));
            return true;
        } catch (e) {
            console.error('Failed to delete car:', e);
            return false;
        }
    },

    // ==================== USERS ====================

    /**
     * Save or update a user in Firestore
     */
    async saveUser(user) {
        try {
            const userId = String(user.id || user.username);
            const userRef = doc(db, 'users', userId);

            // Sync full user data including password to allow cross-device login
            await setDoc(userRef, {
                ...user,
                id: userId,
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log('User saved to Firestore:', userId);
            return true;
        } catch (e) {
            console.error('Failed to save user:', e);
            throw new Error('فشل حفظ المستخدم: ' + e.message);
        }
    },

    /**
     * Get all users from Firestore
     */
    async getUsers() {
        try {
            const usersRef = collection(db, 'users');
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Failed to get users:', e);
            return [];
        }
    },

    /**
     * Delete a user from Firestore
     */
    async deleteUser(userId) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            console.log('User deleted from Firestore:', userId);
            return true;
        } catch (e) {
            console.error('Failed to delete user:', e);
            return false;
        }
    },

    // ==================== MOVEMENTS ====================

    /**
     * Save a movement record to Firestore
     */
    async saveMovement(movement) {
        try {
            // Firestore requires string IDs
            const movementId = String(movement.id);
            const movementRef = doc(db, 'movements', movementId);
            await setDoc(movementRef, {
                ...movement,
                id: movementId,
                syncedAt: serverTimestamp()
            }, { merge: true });
            console.log('Movement saved to Firestore:', movementId);
            return true;
        } catch (e) {
            console.error('Failed to save movement:', e);
            throw new Error('فشل حفظ الحركة: ' + e.message);
        }
    },

    /**
     * Get all movements from Firestore
     */
    async getMovements() {
        try {
            const movementsRef = collection(db, 'movements');
            const q = query(movementsRef, orderBy('exitTime', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Failed to get movements:', e);
            return [];
        }
    },

    /**
     * Sync all local data to Firestore
     */
    async syncAll(cars, users, movements) {
        const results = { cars: 0, users: 0, movements: 0, errors: [] };

        // Sync cars
        for (const car of cars) {
            try {
                await this.saveCar(car);
                results.cars++;
            } catch (e) {
                results.errors.push(`Car ${car.plateNumber}: ${e.message}`);
            }
        }

        // Sync users
        for (const user of users) {
            try {
                await this.saveUser(user);
                results.users++;
            } catch (e) {
                results.errors.push(`User ${user.username}: ${e.message}`);
            }
        }

        // Sync movements
        for (const movement of movements) {
            try {
                await this.saveMovement(movement);
                results.movements++;
            } catch (e) {
                results.errors.push(`Movement ${movement.id}: ${e.message}`);
            }
        }

        console.log('Sync complete:', results);
        return results;
    }
};
