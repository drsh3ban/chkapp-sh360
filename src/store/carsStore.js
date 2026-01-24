import { createStore } from './index'
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
    addCar: async (carData) => {
        const newCar = {
            id: String(Date.now()),
            ...carData,
            status: 'in'
        }
        carsStore.setState((state) => ({
            cars: [...state.cars, newCar]
        }))

        // Background sync to Firestore
        try {
            await FirestoreService.saveCar(newCar);
            console.log('Car synced to Firestore on creation');
        } catch (e) {
            console.warn('Background car sync failed:', e);
        }
    },

    updateCar: async (id, updates) => {
        const state = carsStore.getState();
        const updatedCars = state.cars.map(car =>
            String(car.id) === String(id) ? { ...car, ...updates } : car
        );

        carsStore.setState({ cars: updatedCars });

        // Background sync
        try {
            const updatedCar = updatedCars.find(car => String(car.id) === String(id));
            if (updatedCar) {
                await FirestoreService.saveCar(updatedCar);
                console.log('Car update synced to Firestore');
            }
        } catch (e) {
            console.warn('Car update sync failed:', e);
        }
    },

    deleteCar: async (id) => {
        carsStore.setState((state) => ({
            cars: state.cars.filter(car => String(car.id) !== String(id))
        }))

        // Sync to Firestore
        try {
            await FirestoreService.deleteCar(String(id));
            console.log('Car deleted from Firestore');
        } catch (e) {
            console.warn('Car deletion sync failed:', e);
        }
    },

    getCarById: (id) => {
        return carsStore.getState().cars.find(car => String(car.id) === String(id))
    },

    getCarsInside: () => {
        return carsStore.getState().cars.filter(car => car.status === 'in')
    },

    getCarsOutside: () => {
        return carsStore.getState().cars.filter(car => car.status === 'out')
    }
}
