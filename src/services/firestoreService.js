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
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';

/**
 * Multi-Tenant Firestore Service
 * All data is scoped to /companies/{companyId}/...
 * 
 * Structure:
 * /companies/{companyId}/
 *   ├── users/      (employees)
 *   ├── cars/       (fleet vehicles)
 *   └── movements/  (exit/entry records)
 */
export const FirestoreService = {

    // ==================== CARS (Company-Scoped) ====================

    /**
     * Save or update a car in company subcollection
     */
    async saveCar(companyId, car) {
        if (!companyId) throw new Error('companyId مطلوب');
        try {
            const carId = String(car.id || car.plateNumber);
            const carRef = doc(db, 'companies', companyId, 'cars', carId);
            await setDoc(carRef, {
                ...car,
                id: carId,
                companyId,
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log('Car saved:', companyId, carId);
            return true;
        } catch (e) {
            console.error('Failed to save car:', e);
            throw new Error('فشل حفظ السيارة: ' + e.message);
        }
    },

    /**
     * Get all cars for a company
     */
    async getCars(companyId) {
        if (!companyId) return [];
        try {
            const carsRef = collection(db, 'companies', companyId, 'cars');
            const snapshot = await getDocs(carsRef);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                companyId: companyId // Resilience: Ensure companyId is always present
            }));
        } catch (e) {
            console.error('Failed to get cars:', e);
            return [];
        }
    },

    /**
     * Delete a car from company
     */
    async deleteCar(companyId, carId) {
        if (!companyId) return false;
        try {
            await deleteDoc(doc(db, 'companies', companyId, 'cars', carId));
            console.log('Car deleted:', companyId, carId);
            return true;
        } catch (e) {
            console.error('Failed to delete car:', e);
            return false;
        }
    },

    // ==================== USERS (Company-Scoped) ====================

    /**
     * Save or update a user in company subcollection
     */
    async saveUser(companyId, user) {
        if (!companyId) throw new Error('companyId مطلوب');
        try {
            const userId = String(user.id || user.email);
            const userRef = doc(db, 'companies', companyId, 'users', userId);
            await setDoc(userRef, {
                ...user,
                id: userId,
                companyId,
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log('User saved:', companyId, userId);
            return true;
        } catch (e) {
            console.error('Failed to save user:', e);
            throw new Error('فشل حفظ المستخدم: ' + e.message);
        }
    },

    /**
     * Get all users for a company
     */
    async getUsers(companyId) {
        if (!companyId) return [];
        try {
            const usersRef = collection(db, 'companies', companyId, 'users');
            const snapshot = await getDocs(usersRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Failed to get users:', e);
            return [];
        }
    },

    /**
     * Delete a user from company
     */
    async deleteUser(companyId, userId) {
        if (!companyId) return false;
        try {
            await deleteDoc(doc(db, 'companies', companyId, 'users', userId));
            console.log('User deleted:', companyId, userId);
            return true;
        } catch (e) {
            console.error('Failed to delete user:', e);
            return false;
        }
    },

    // ==================== MOVEMENTS (Company-Scoped) ====================

    /**
     * Save a movement record
     */
    async saveMovement(companyId, movement) {
        if (!companyId) throw new Error('companyId مطلوب');
        try {
            const movementId = String(movement.id);
            const movementRef = doc(db, 'companies', companyId, 'movements', movementId);
            await setDoc(movementRef, {
                ...movement,
                id: movementId,
                companyId,
                syncedAt: serverTimestamp()
            }, { merge: true });
            console.log('Movement saved:', companyId, movementId);
            return true;
        } catch (e) {
            console.error('Failed to save movement:', e);
            throw new Error('فشل حفظ الحركة: ' + e.message);
        }
    },

    /**
     * Get all movements for a company
     */
    async getMovements(companyId) {
        if (!companyId) return [];
        try {
            const movementsRef = collection(db, 'companies', companyId, 'movements');
            const q = query(movementsRef, orderBy('exitTime', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Failed to get movements:', e);
            return [];
        }
    },

    /**
     * Delete a movement
     */
    async deleteMovement(companyId, movementId) {
        if (!companyId) return false;
        try {
            await deleteDoc(doc(db, 'companies', companyId, 'movements', movementId));
            return true;
        } catch (e) {
            console.error('Failed to delete movement:', e);
            return false;
        }
    },

    // ==================== COMPANIES ====================

    /**
     * Save or update a company
     */
    async saveCompany(company) {
        try {
            const companyId = String(company.id);
            const companyRef = doc(db, 'companies', companyId);
            await setDoc(companyRef, {
                ...company,
                updatedAt: serverTimestamp()
            }, { merge: true });
            return true;
        } catch (e) {
            console.error('Failed to save company:', e);
            throw new Error('فشل حفظ الشركة: ' + e.message);
        }
    },

    /**
     * Get all companies (Super Admin)
     */
    async getCompanies() {
        try {
            const companiesRef = collection(db, 'companies');
            const snapshot = await getDocs(companiesRef);
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error('Failed to get companies:', e);
            return [];
        }
    },

    // ==================== SYNC ALL (Company-Scoped) ====================

    /**
     * Sync all local data to Firestore for a company
     */
    async syncAll(companyId, cars, users, movements) {
        if (!companyId) throw new Error('companyId مطلوب للمزامنة');

        const results = { cars: 0, users: 0, movements: 0, errors: [] };

        for (const car of cars) {
            try {
                await this.saveCar(companyId, car);
                results.cars++;
            } catch (e) {
                results.errors.push(`Car ${car.plateNumber}: ${e.message}`);
            }
        }

        for (const user of users) {
            try {
                await this.saveUser(companyId, user);
                results.users++;
            } catch (e) {
                results.errors.push(`User ${user.email}: ${e.message}`);
            }
        }

        for (const movement of movements) {
            try {
                await this.saveMovement(companyId, movement);
                results.movements++;
            } catch (e) {
                results.errors.push(`Movement ${movement.id}: ${e.message}`);
            }
        }

        console.log('Sync complete:', results);
        return results;
    }
};
