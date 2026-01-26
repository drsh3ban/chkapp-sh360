import { userStore, userActions } from '../store/userStore'
import { carsStore, carsActions } from '../store/carsStore'
import { movementsStore, movementsActions } from '../store/movementsStore'
import { authStore } from '../store/authStore'

const DEFAULT_COMPANY_ID = 'company_001'

export const MigrationService = {
    /**
     * Run all migrations for v3.0
     */
    runV3Migrations: async () => {
        console.log('Running v3.0 Data Migrations...');

        const results = {
            users: 0,
            cars: 0,
            movements: 0
        }

        // 1. Migrate Users
        const { users } = userStore.getState()
        const updatedUsers = users.map(u => {
            if (!u.companyId) {
                results.users++
                return { ...u, companyId: DEFAULT_COMPANY_ID, role: u.role || 'inspector' }
            }
            return u
        })
        if (results.users > 0) {
            userStore.setState({ users: updatedUsers })
        }

        // 2. Migrate Cars
        const { cars } = carsStore.getState()
        const updatedCars = cars.map(c => {
            if (!c.companyId) {
                results.cars++
                return { ...c, companyId: DEFAULT_COMPANY_ID }
            }
            return c
        })
        if (results.cars > 0) {
            carsStore.setState({ cars: updatedCars })
        }

        // 3. Migrate Movements
        const { movements } = movementsStore.getState()
        const updatedMovements = movements.map(m => {
            if (!m.companyId) {
                results.movements++
                return { ...m, companyId: DEFAULT_COMPANY_ID }
            }
            return m
        })
        if (results.movements > 0) {
            movementsStore.setState({ movements: updatedMovements })
        }

        console.log('Migration Complete:', results);
        return results;
    }
}
