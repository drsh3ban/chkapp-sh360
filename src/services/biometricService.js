import { Preferences } from '@capacitor/preferences';
import { NativeBiometric } from 'capacitor-native-biometric';

/**
 * Biometric Authentication Service
 * Securely stores and retrieves credentials using device biometric sensors
 */
export const BiometricService = {
    /**
     * Check if biometric authentication is available on this device
     * Returns details about availability
     */
    async isAvailable() {
        try {
            const result = await NativeBiometric.isAvailable();
            console.log('Biometric accessibility assessment:', result);
            return {
                available: result.isAvailable,
                strong: result.isStrong,
                error: null
            };
        } catch (e) {
            console.error('Biometric availability check failed:', e);
            return {
                available: false,
                error: e.message || 'المستشعر غير مستجيب'
            };
        }
    },

    /**
     * Enable biometric login by storing credentials securely
     * @param {string} username 
     * @param {string} password 
     */
    /**
     * Enable biometric login by storing credentials securely
     * @param {string} username 
     * @param {string} password 
     */
    async enableBiometric(username, password) {
        try {
            console.log('Verifying biometric support before enabling...');
            const available = await this.isAvailable();

            // Handle both object and legacy boolean returns just in case
            const isSupported = typeof available === 'object' ? available.available : available;

            if (!isSupported) {
                const errorDetail = available.error || 'يرجى تفعيل البصمة في إعدادات الهاتف أولاً';
                throw new Error(errorDetail);
            }

            // v2.1.2: Standardized stable alias for Android Keystore
            const VAULT_ALIAS = 'com.autocheck.pro.v1';

            // Stabilization delay (Hardware/TEE reset time)
            console.log('Stabilizing biometric secure module (1000ms)...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                console.log(`Attempting secure storage with alias: ${VAULT_ALIAS}`);

                // 1. Cleanup old alias artifacts
                try { await NativeBiometric.deleteCredentials({ server: VAULT_ALIAS }); } catch (e) { }
                await new Promise(resolve => setTimeout(resolve, 300));

                // 2. Set new credentials
                // Note: setCredentials handles the biometric prompt internally on Android
                await NativeBiometric.setCredentials({
                    username: String(username).trim(),
                    password: String(password).trim(),
                    server: VAULT_ALIAS
                });

                // 3. Persistent verification check
                const { value: storedAlias } = await Preferences.get({ key: 'biometric_active_alias' });

                await Preferences.set({ key: 'biometric_enabled', value: 'true' });
                await Preferences.set({ key: 'biometric_active_alias', value: VAULT_ALIAS });

                console.log('Biometric storage ENABLED and SAVED.');
                return true;
            } catch (err) {
                console.error(`Vault storage for ${VAULT_ALIAS} failed:`, err);
                throw err;
            }
        } catch (e) {
            console.error('Final Biometric Error Report (v2.1.2):', e);
            let errorMessage = e.message || e.toString();

            // Handle common Keystore / Cryptographic failures with user-friendly messages
            if (errorMessage.toLowerCase().includes('credentials') ||
                errorMessage.toLowerCase().includes('encrypt') ||
                errorMessage.toLowerCase().includes('null') ||
                errorMessage.toLowerCase().includes('failed')) {
                errorMessage = `فشل تشفير البيانات الآمنة. تأكد من أن هاتفك يحمي بكلمة مرور أو نمط (PIN/Pattern).`;
            }
            throw new Error(errorMessage);
        }
    },

    /**
     * Disable biometric login and clear stored credentials
     */
    async disableBiometric() {
        try {
            const ALIASES = ['com.autocheck.pro.vault', 'AC_Secure_Vault', 'auth_vault', 'com.autocheck.pro', 'ac_vault', 'vault', 'autocheck'];
            for (const alias of ALIASES) {
                try { await NativeBiometric.deleteCredentials({ server: alias }); } catch (e) { }
            }

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

            // Retrieve working alias from preferences
            const { value: activeAlias } = await Preferences.get({ key: 'biometric_active_alias' });

            // Retrieve stored credentials - try specialized alias first, then fallbacks
            let credentials;
            try {
                if (activeAlias) {
                    credentials = await NativeBiometric.getCredentials({ server: activeAlias });
                } else {
                    throw new Error('No active alias');
                }
            } catch (e) {
                try {
                    credentials = await NativeBiometric.getCredentials({ server: 'auth_vault' });
                } catch (e2) {
                    try {
                        credentials = await NativeBiometric.getCredentials({ server: 'com.autocheck.pro' });
                    } catch (e3) {
                        credentials = await NativeBiometric.getCredentials({ server: 'ac_vault' });
                    }
                }
            }

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
