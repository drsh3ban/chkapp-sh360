import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from '@capacitor-community/native-biometric';

/**
 * Biometric Authentication Service
 * Securely stores and retrieves credentials using device biometric sensors
 */
export const BiometricService = {
    /**
     * Check if biometric authentication is available on this device
     */
    async isAvailable() {
        try {
            const result = await NativeBiometric.isAvailable();
            return result.isAvailable;
        } catch (e) {
            console.error('Biometric check failed:', e);
            return false;
        }
    },

    /**
     * Enable biometric login by storing credentials securely
     * @param {string} username 
     * @param {string} password 
     */
    async enableBiometric(username, password) {
        try {
            // Store credentials in device's secure storage
            await NativeBiometric.setCredentials({
                username,
                password,
                server: 'autocheck-pro'
            });

            // Mark biometric as enabled in preferences
            await Preferences.set({
                key: 'biometric_enabled',
                value: 'true'
            });

            return true;
        } catch (e) {
            console.error('Failed to enable biometric:', e);
            throw new Error('فشل تفعيل البصمة');
        }
    },

    /**
     * Disable biometric login and clear stored credentials
     */
    async disableBiometric() {
        try {
            await NativeBiometric.deleteCredentials({
                server: 'autocheck-pro'
            });

            await Preferences.set({
                key: 'biometric_enabled',
                value: 'false'
            });

            return true;
        } catch (e) {
            console.error('Failed to disable biometric:', e);
            return false;
        }
    },

    /**
     * Check if biometric login is currently enabled
     */
    async isEnabled() {
        try {
            const { value } = await Preferences.get({ key: 'biometric_enabled' });
            return value === 'true';
        } catch (e) {
            return false;
        }
    },

    /**
     * Authenticate user with biometric and retrieve stored credentials
     * @returns {Promise<{username: string, password: string}>}
     */
    async authenticate() {
        try {
            // Verify with biometric sensor
            await NativeBiometric.verifyIdentity({
                reason: 'الرجاء تأكيد هويتك لتسجيل الدخول',
                title: 'تسجيل الدخول',
                subtitle: 'AutoCheck Pro',
                description: 'استخدم بصمة الإصبع أو التعرف على الوجه'
            });

            // Retrieve stored credentials
            const credentials = await NativeBiometric.getCredentials({
                server: 'autocheck-pro'
            });

            return {
                username: credentials.username,
                password: credentials.password
            };
        } catch (e) {
            console.error('Biometric authentication failed:', e);
            throw new Error('فشل التحقق البيومتري');
        }
    }
};
