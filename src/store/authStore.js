import { createStore } from './index'
import { BiometricService } from '../services/biometricService'
import { FirestoreService } from '../services/firestoreService'
import { db, auth } from '../services/firebaseConfig'
import { collection, getDocs, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'

const initialState = {
    user: null,
    role: null, // 'super_admin', 'company_admin', or 'inspector'
    companyId: null,
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
    setAuth: async (data) => {
        const { user, token } = data
        authStore.setState({
            user,
            role: user.role,
            companyId: user.companyId || null,
            token,
            isAuthenticated: true
        })

        // Auto-sync user to Firestore
        try {
            await FirestoreService.saveUser({
                ...user,
                lastLogin: new Date().toISOString()
            });
            console.log('User synced to Firestore');
        } catch (e) {
            console.warn('Failed to sync user to Firestore:', e);
        }

        return true
    },

    // Temporary session storage for biometric setup (not persisted)
    _sessionCredentials: null,

    login: async (username, password) => {
        // 1. Normalize inputs
        const normalizedUsername = username.trim().toLowerCase();
        const normalizedPassword = password.trim();

        // 2. Mock Login for Testing (Admin)
        if (normalizedUsername === 'admin' && normalizedPassword === 'admin') {
            console.log('Using mock login');
            authActions._sessionCredentials = { username: 'admin', password: 'admin' };
            return authActions.setAuth({
                user: {
                    id: '1',
                    name: 'Admin User',
                    role: 'super_admin',
                    username: 'admin',
                    companyId: 'company_001'
                },
                token: 'mock-jwt-token-123456'
            });
        }

        try {
            const savedUsers = localStorage.getItem('autocheck_users');
            if (savedUsers) {
                const users = JSON.parse(savedUsers);
                const matchedUser = users.find(u => u.username === normalizedUsername && u.password === normalizedPassword);

                if (matchedUser) {
                    console.log('Login success via Local Storage user');
                    authActions._sessionCredentials = { username: normalizedUsername, password: normalizedPassword };
                    return authActions.setAuth({
                        user: matchedUser,
                        token: `local-token-${Date.now()}`
                    });
                }
            }
        } catch (e) {
            console.error('Local login check failed:', e);
        }

        // 4. Firebase Auth Login (Standard & Secure)
        try {
            console.log('Attempting Firebase Auth login:', normalizedUsername);

            let userCredential;
            try {
                userCredential = await signInWithEmailAndPassword(auth, normalizedUsername, normalizedPassword);
            } catch (authError) {
                // Auto-Registration Logic (For seeded users not in Auth yet)
                if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential') {
                    console.log('User not found in Auth, attempting auto-registration...');
                    try {
                        await createUserWithEmailAndPassword(auth, normalizedUsername, normalizedPassword);
                        userCredential = await signInWithEmailAndPassword(auth, normalizedUsername, normalizedPassword);
                        console.log('Auto-registration successful');
                    } catch (regError) {
                        console.error('Registration failed:', regError);
                        throw authError;
                    }
                } else {
                    throw authError;
                }
            }

            const { user } = userCredential;

            // 5. Find User Profile (Securely)
            const companiesSnapshot = await getDocs(collection(db, 'companies'));

            for (const companyDoc of companiesSnapshot.docs) {
                const usersRef = collection(db, 'companies', companyDoc.id, 'users');
                // Query must be exact, but our portal fix ensures they are stored in lowercase
                const userQuery = query(usersRef, where('email', '==', user.email));
                const userSnapshot = await getDocs(userQuery);

                if (!userSnapshot.empty) {
                    const userDoc = userSnapshot.docs[0];
                    const userData = userDoc.data();
                    let finalUserId = userDoc.id;

                    // CHECK FOR ID MISMATCH (Migration Logic)
                    if (userDoc.id !== user.uid) {
                        console.log('Detected ID mismatch in App. Migrating...');
                        try {
                            const newProfileRef = doc(db, 'companies', companyDoc.id, 'users', user.uid);
                            await setDoc(newProfileRef, {
                                ...userData,
                                id: user.uid,
                                migratedAt: new Date().toISOString(),
                                originalId: userDoc.id
                            });
                            await deleteDoc(userDoc.ref);
                            console.log('Migration successful.');
                            finalUserId = user.uid;
                        } catch (migrationError) {
                            console.error('Migration failed:', migrationError);
                        }
                    }

                    console.log('Login success via Firebase Auth');
                    const appUser = {
                        id: finalUserId,
                        name: userData.name || 'مستخدم',
                        email: userData.email,
                        role: userData.role || 'inspector',
                        companyId: companyDoc.id,
                        companyName: companyDoc.data().name
                    };

                    authActions._sessionCredentials = { username: normalizedUsername, password: normalizedPassword };
                    return authActions.setAuth({
                        user: appUser,
                        token: await user.getIdToken()
                    });
                }
            }

            console.error('Profile not found for authenticated user:', user.email);
            // Throw specific error instead of returning false
            const error = new Error('الحساب موجود ولكن غير مرتبط بأي شركة. يرجى مراجعة المدير.');
            error.code = 'auth/profile-not-found';
            throw error;

        } catch (e) {
            console.error('Login error:', e);
            throw e; // Propagate error to be handled by UI
        }
    },

    logout: () => {
        authStore.reset()
        // Clear other stores to prevent data leak
        import('./carsStore').then(m => m.carsStore.reset());
        import('./movementsStore').then(m => m.movementsStore.reset());
        localStorage.removeItem('autocheck_auth');
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
