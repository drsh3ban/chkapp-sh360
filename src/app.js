import { authStore } from './store/authStore'
import { carsActions } from './store/carsStore'
import { movementsActions } from './store/movementsStore'
import { renderLoginScreen } from './pages/login'
import { renderMainApp } from './pages/main'
import { NotificationService } from './utils/notificationService'

export function initializeApp() {
    const app = document.getElementById('app')

    // Init core services
    NotificationService.init()

    // Helper to load data
    const loadCompanyData = () => {
        const state = authStore.getState();
        if (state.user && state.companyId) {
            console.log('Loading data for company:', state.companyId);
            carsActions.loadCars();
            movementsActions.loadMovements();
        }
    };

    // Subscribe to auth state changes to re-render automatically
    authStore.subscribe((state) => {
        if (state.user) {
            loadCompanyData();
            renderMainApp(app)
        } else {
            renderLoginScreen(app)
        }
    })

    // Initial check
    const currentUser = authStore.getState().user

    if (currentUser) {
        loadCompanyData();
        renderMainApp(app)
    } else {
        renderLoginScreen(app)
    }
}
