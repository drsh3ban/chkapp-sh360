import { authStore } from './store/authStore'
import { renderLoginScreen } from './pages/login'
import { renderMainApp } from './pages/main'
import { NotificationService } from './utils/notificationService'

export function initializeApp() {
    const app = document.getElementById('app')

    // Init core services
    NotificationService.init()

    // Subscribe to auth state changes to re-render automatically
    authStore.subscribe((state) => {
        if (state.user) {
            renderMainApp(app)
        } else {
            renderLoginScreen(app)
        }
    })

    // Initial check
    const currentUser = authStore.getState().user

    if (currentUser) {
        renderMainApp(app)
    } else {
        renderLoginScreen(app)
    }
}
