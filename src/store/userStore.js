import { createStore } from './index'
import { authStore } from './authStore'
import { FirestoreService } from '../services/firestoreService'

const savedUsers = localStorage.getItem('autocheck_users')
let initialUsers = []
try {
    initialUsers = savedUsers ? JSON.parse(savedUsers) : []
    if (!Array.isArray(initialUsers)) initialUsers = []
} catch (e) {
    console.error('Failed to parse users from localStorage', e)
}

const initialState = {
    users: initialUsers,
    loading: false,
    error: null
}

export const userStore = createStore(initialState)

// Auto-save to localStorage
userStore.subscribe((state) => {
    localStorage.setItem('autocheck_users', JSON.stringify(state.users))
})

export const userActions = {
    fetchUsers: async () => {
        userStore.setState({ loading: true, error: null })
        try {
            console.log('Fetching users from Firestore...');
            const users = await FirestoreService.getUsers();

            if (users && users.length > 0) {
                userStore.setState({ users, loading: false });
            } else {
                // If firestore empty, keep local but stop loading
                userStore.setState({ loading: false });
            }
            return true;
        } catch (e) {
            userStore.setState({ error: 'Failed to fetch users from cloud', loading: false })
            return false
        }
    },

    addUser: async (userData) => {
        userStore.setState({ loading: true, error: null })

        const currentUsers = userStore.getState().users;
        const companyId = authStore.getState().companyId;

        const newUser = {
            id: String(Date.now()),
            ...userData,
            companyId: companyId,
            created_at: new Date().toISOString()
        };

        userStore.setState({
            users: [newUser, ...currentUsers],
            loading: false
        });

        // Background sync to Firestore
        try {
            await FirestoreService.saveUser(newUser);
            console.log('User synced to Firestore on creation');
        } catch (e) {
            console.warn('Background user sync failed:', e);
        }

        return true;
    },

    /* Backend Code (Disabled for Mock)
    try {
        const token = authStore.getState().token
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(userData)
        })
        const data = await response.json()

        if (data.success) {
            const currentUsers = userStore.getState().users
            userStore.setState({
                users: [data.data, ...currentUsers],
                loading: false
            })
            return true
        } else {
            userStore.setState({ error: data.message, loading: false })
            return false
        }
    } catch (e) {
        userStore.setState({ error: 'Failed to add user', loading: false })
        return false
    }
    */

    deleteUser: async (id) => {
        try {
            // Remove from Firestore
            await FirestoreService.deleteUser(id);

            // Remove from local state
            const currentUsers = userStore.getState().users
            userStore.setState({
                users: currentUsers.filter(u => String(u.id) !== String(id))
            })
            return true
        } catch (e) {
            console.error('Delete user failed:', e);
            return false
        }
    }
}
