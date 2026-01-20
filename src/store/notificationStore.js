import { createStore } from './index'

/**
 * Notifications Store
 * Manages the list of system notifications
 */
export const notificationStore = createStore({
    notifications: []
})

export const notificationActions = {
    add: (notification) => {
        const { notifications } = notificationStore.getState()
        const newNotification = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        }

        notificationStore.setState({
            notifications: [newNotification, ...notifications].slice(0, 50) // Keep last 50
        })
    },

    markAllAsRead: () => {
        const { notifications } = notificationStore.getState()
        notificationStore.setState({
            notifications: notifications.map(n => ({ ...n, read: true }))
        })
    },

    clear: () => {
        notificationStore.setState({ notifications: [] })
    }
}
