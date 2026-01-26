import { createStore } from './index'
import { authStore } from './authStore'
import { FirestoreService } from '../services/firestoreService'

const defaultCars = [
    { id: '1', plate: 'أ ب ج 1111', model: 'تويوتا هايلكس', status: 'in' },
    { id: '2', plate: 'س ص ع 2222', model: 'هيونداي النترا', status: 'in' },
    { id: '3', plate: 'د ذ ر 3333', model: 'فورد تورس', status: 'in' }
]

const savedCars = localStorage.getItem('autocheck_cars')
let initialCars = defaultCars
try {
    initialCars = savedCars ? JSON.parse(savedCars) : defaultCars
    if (!Array.isArray(initialCars)) initialCars = defaultCars
} catch (e) {
    console.error('Failed to parse cars from localStorage', e)
    initialCars = defaultCars
}

export const carsStore = createStore({
    cars: initialCars,
    loading: false,
    error: null
})

// Auto-save to localStorage
carsStore.subscribe((state) => {
    localStorage.setItem('autocheck_cars', JSON.stringify(state.cars))
})

// Cars actions
export const carsActions = {
    // Load cars from Firestore for current company
    loadCars: async () => {
        const companyId = authStore.getState().companyId;
        if (!companyId) {
            console.warn('No companyId, cannot load cars');
            return;
        }

        carsStore.setState({ loading: true });
        try {
            const cars = await FirestoreService.getCars(companyId);
            carsStore.setState({ cars, loading: false });
            console.log('Loaded', cars.length, 'cars for company', companyId);
        } catch (e) {
            console.error('Failed to load cars:', e);
            carsStore.setState({ loading: false, error: e.message });
        }
    },

    addCar: async (carData) => {
        const companyId = authStore.getState().companyId;
        if (!companyId) throw new Error('لا يمكن إضافة سيارة بدون شركة');

        const newCar = {
            id: String(Date.now()),
            ...carData,
            companyId: companyId,
            status: 'in'
        }
        carsStore.setState((state) => ({
            cars: [...state.cars, newCar]
        }))

        // Sync to Firestore
        try {
            await FirestoreService.saveCar(companyId, newCar);
            console.log('Car synced to Firestore');
        } catch (e) {
            console.warn('Car sync failed:', e);
        }
    },

    updateCar: async (id, updates) => {
        const companyId = authStore.getState().companyId;
        if (!companyId) return;

        const state = carsStore.getState();
        const updatedCars = state.cars.map(car =>
            String(car.id) === String(id) ? { ...car, ...updates } : car
        );

        carsStore.setState({ cars: updatedCars });

        // Background sync
        try {
            const updatedCar = updatedCars.find(car => String(car.id) === String(id));
            if (updatedCar) {
                await FirestoreService.saveCar(companyId, updatedCar);
                console.log('Car update synced to Firestore');
            }
        } catch (e) {
            console.warn('Car update sync failed:', e);
        }
    },

    deleteCar: async (id) => {
        const companyId = authStore.getState().companyId;
        if (!companyId) return;

        carsStore.setState((state) => ({
            cars: state.cars.filter(car => String(car.id) !== String(id))
        }))

        // Sync to Firestore
        try {
            await FirestoreService.deleteCar(companyId, String(id));
            console.log('Car deleted from Firestore');
        } catch (e) {
            console.warn('Car deletion sync failed:', e);
        }
    },

    getCarById: (id) => {
        return carsStore.getState().cars.find(car => String(car.id) === String(id))
    },

    getCarsInside: () => {
        const companyId = authStore.getState().companyId;
        return carsStore.getState().cars.filter(car =>
            (car.status === 'in' || car.status === 'available') && car.companyId === companyId
        )
    },

    getCarsOutside: () => {
        const companyId = authStore.getState().companyId;
        return carsStore.getState().cars.filter(car =>
            car.status === 'out' && car.companyId === companyId
        )
    }
}
