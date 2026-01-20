import { createStore } from './index'
import { authStore } from './authStore'

const initialState = {
    users: [],
    loading: false,
    error: null
}

export const userStore = createStore(initialState)

export const userActions = {
    fetchUsers: async () => {
        userStore.setState({ loading: true, error: null })
        try {
            const token = authStore.getState().token
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const data = await response.json()

            if (data.success) {
                userStore.setState({ users: data.data, loading: false })
                return true
            } else {
                userStore.setState({ error: data.message, loading: false })
                return false
            }
        } catch (e) {
            userStore.setState({ error: 'Failed to fetch users', loading: false })
            return false
        }
    },

    addUser: async (userData) => {
        userStore.setState({ loading: true, error: null })

        // Mock Add User (Since backend is unavailable)
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const currentUsers = userStore.getState().users;
        const newUser = {
            id: Math.floor(Math.random() * 10000),
            ...userData,
            created_at: new Date().toISOString()
        };

        userStore.setState({
            users: [newUser, ...currentUsers],
            loading: false
        });
        return true;

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
    },

    deleteUser: async (id) => {
        try {
            const token = authStore.getState().token
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const currentUsers = userStore.getState().users
                userStore.setState({
                    users: currentUsers.filter(u => u.id !== id)
                })
                return true
            }
            return false
        } catch (e) {
            return false
        }
    }
}
