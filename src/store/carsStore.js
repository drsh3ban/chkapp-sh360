import { createStore } from './index'

const defaultCars = [
    { id: 1, plate: 'أ ب ج 1111', model: 'تويوتا هايلكس', status: 'in' },
    { id: 2, plate: 'س ص ع 2222', model: 'هيونداي النترا', status: 'in' },
    { id: 3, plate: 'د ذ ر 3333', model: 'فورد تورس', status: 'in' }
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
    addCar: (carData) => {
        const newCar = {
            id: Date.now(),
            ...carData,
            status: 'in'
        }
        carsStore.setState((state) => ({
            cars: [...state.cars, newCar]
        }))
    },

    updateCar: (id, updates) => {
        carsStore.setState((state) => ({
            cars: state.cars.map(car =>
                car.id === id ? { ...car, ...updates } : car
            )
        }))
    },

    deleteCar: (id) => {
        carsStore.setState((state) => ({
            cars: state.cars.filter(car => car.id !== id)
        }))
    },

    getCarById: (id) => {
        return carsStore.getState().cars.find(car => car.id === id)
    },

    getCarsInside: () => {
        return carsStore.getState().cars.filter(car => car.status === 'in')
    },

    getCarsOutside: () => {
        return carsStore.getState().cars.filter(car => car.status === 'out')
    }
}
