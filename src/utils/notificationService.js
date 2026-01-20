/**
 * Notification Service
 * Handles local and push notifications for Web and Android (Capacitor)
 */
import { notificationActions } from '../store/notificationStore'

export const NotificationService = {
    /**
     * Initialize notification system
     */
    init: async () => {
        const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

        if (isNative) {
            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                const { PushNotifications } = await import('@capacitor/push-notifications');

                // Request permissions
                const perm = await LocalNotifications.requestPermissions();
                console.log('Local Notification Permission:', perm.display);

                // Setup Push Notifications (Requires FCM configured on server/firebase)
                // For now we setup the listeners for when FCM is added
                await PushNotifications.requestPermissions();

            } catch (err) {
                console.warn('Native Notifications Init Failed:', err);
            }
        } else {
            // Web Notification API
            if ('Notification' in window) {
                if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
                    await Notification.requestPermission();
                }
            }
        }
    },

    /**
     * Send a local notification
     * @param {string} title 
     * @param {string} body 
     */
    send: async (title, body) => {
        const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

        // Save to local store
        notificationActions.add({ title, body });

        if (isNative) {
            try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: title,
                            body: body,
                            id: Math.floor(Math.random() * 10000),
                            schedule: { at: new Date(Date.now() + 1000) },
                            sound: null,
                            attachments: null,
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
            } catch (err) {
                console.error('Schedule Local Notification Failed:', err);
            }
        } else {
            // Web Fallback
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification(title, { body });
            } else {
                console.log('Toast Fallback:', title, body);
            }
        }
    }
};
