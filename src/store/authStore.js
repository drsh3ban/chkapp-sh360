import { createStore } from './index'
import { BiometricService } from '../services/biometricService'

const initialState = {
    user: null,
    role: null, // 'admin' or 'guard'
    token: null,
    isAuthenticated: false
}

// Load from localStorage on init
const savedAuth = localStorage.getItem('autocheck_auth')
const parsedAuth = savedAuth ? JSON.parse(savedAuth) : initialState

export const authStore = createStore(parsedAuth)

// Subscribe to changes and persist to localStorage
authStore.subscribe((state) => {
    localStorage.setItem('autocheck_auth', JSON.stringify(state))
})

// Auth actions
export const authActions = {
    setAuth: (data) => {
        const { user, token } = data
        authStore.setState({
            user,
            role: user.role,
            token,
            isAuthenticated: true
        })
        return true
    },

    login: async (username, password) => {
        // Mock Login for Testing
        if (username === 'admin' && password === 'admin') {
            console.log('Using mock login');
            return authActions.setAuth({
                user: { id: 1, name: 'Admin User', role: 'admin' },
                token: 'mock-jwt-token-123456'
            });
        }

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            const data = await response.json()
            if (data.success) {
                return authActions.setAuth(data)
            }
            return false
        } catch (e) {
            console.error('Login error:', e)
            return false
        }
    },

    logout: () => {
        authStore.reset()
        localStorage.removeItem('autocheck_auth')
    },

    /**
     * Enable biometric login for the current user
     */
    enableBiometric: async (username, password) => {
        try {
            const available = await BiometricService.isAvailable();
            if (!available) {
                throw new Error('البصمة غير متاحة على هذا الجهاز');
            }

            await BiometricService.enableBiometric(username, password);
            return true;
        } catch (e) {
            console.error('Enable biometric error:', e);
            throw e;
        }
    },

    /**
     * Disable biometric login
     */
    disableBiometric: async () => {
        try {
            await BiometricService.disableBiometric();
            return true;
        } catch (e) {
            console.error('Disable biometric error:', e);
            return false;
        }
    },

    /**
     * Login using biometric authentication
     */
    biometricLogin: async () => {
        try {
            const enabled = await BiometricService.isEnabled();
            if (!enabled) {
                throw new Error('الدخول بالبصمة غير مفعل');
            }

            const credentials = await BiometricService.authenticate();
            return authActions.login(credentials.username, credentials.password);
        } catch (e) {
            console.error('Biometric login error:', e);
            throw e;
        }
    },

    /**
     * Check if biometric is available and enabled
     */
    checkBiometric: async () => {
        try {
            const available = await BiometricService.isAvailable();
            const enabled = await BiometricService.isEnabled();
            return { available, enabled };
        } catch (e) {
            return { available: false, enabled: false };
        }
    }
}
