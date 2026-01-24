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

            // NUCLEAR FIX (v1.1.30): 
            // 1. Re-add identity verification but with 'useFallback'. 
            console.log('Requesting identity verification to prepare Keystore...');
            await NativeBiometric.verifyIdentity({
                reason: 'يرجى تأكيد هويتك لتفعيل التشفير الآمن',
                title: 'تفعيل الدخول السريع',
                subtitle: 'تأمين البيانات',
                description: 'استخدم البصمة للسماح بحفظ بيانات الدخول مشفرة',
                useFallback: true
            });

            // 2. Extra stabilization delay (Hardware reset time)
            console.log('Stabilizing biometric module (1000ms)...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 3. Simplified, robust storage attempt using multiple aliases
            // We use generic names that are less likely to be blocked by vendor-specific security policies
            const ALIAS_LIST = ['autocheck_vault', 'generic_vault', 'com.autocheck.pro', 'biometric_data'];
            let lastErr = null;
            let successAlias = null;

            for (const alias of ALIAS_LIST) {
                try {
                    console.log(`Attempting storage with alias: ${alias}`);

                    // Pre-cleanup (ignore errors)
                    try { await NativeBiometric.deleteCredentials({ server: alias }); } catch (e) { }
                    await new Promise(resolve => setTimeout(resolve, 200));

                    await NativeBiometric.setCredentials({
                        username: String(username).trim(),
                        password: String(password).trim(),
                        server: alias
                    });

                    // Verification: Try to read it back immediately
                    // This confirms the keystore actually persisted the data
                    const verify = await NativeBiometric.getCredentials({ server: alias });
                    if (verify && verify.username === username) {
                        console.log(`Storage VERIFIED for alias: ${alias}`);
                        successAlias = alias;
                        break; // Stop on first success matching verification
                    }
                } catch (err) {
                    lastErr = err;
                    console.warn(`Alias ${alias} failed:`, err.message);
                    await new Promise(resolve => setTimeout(resolve, 300));
                }
            }

            if (successAlias) {
                await Preferences.set({ key: 'biometric_enabled', value: 'true' });
                await Preferences.set({ key: 'biometric_active_alias', value: successAlias });
                return true;
            }

            if (lastErr) throw lastErr;
            throw new Error('All storage attempts exhausted');
        } catch (e) {
            console.error('Final Biometric Error Report:', e);
            let errorMessage = e.message || e.toString();

            if (errorMessage.toLowerCase().includes('credentials') || errorMessage.toLowerCase().includes('encrypt')) {
                errorMessage = `فشل تشفير الخزنة: (تأكد من قفل الشاشة والبصمة). تقني: ${errorMessage.slice(0, 40)}`;
            }
            throw new Error(`فشل تفعيل البصمة: ${errorMessage}`);
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
