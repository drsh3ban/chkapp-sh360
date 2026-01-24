import { Toast } from '../components/Toast'
import { authActions } from '../store/authStore'
import { FirestoreService } from '../services/firestoreService'
import { carsStore } from '../store/carsStore'
import { movementsStore } from '../store/movementsStore'
import { userStore } from '../store/userStore'

export function renderSettings(container) {
    container.innerHTML = `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
                    <h3 class="text-xl font-bold flex items-center gap-3">
                        <i class="fas fa-cog text-slate-400"></i> إعدادات النظام
                    </h3>
                </div>
                
                <div class="p-6 space-y-6">
                    <!-- Firebase Cloud Sync -->
                    <div class="space-y-4">
                        <h4 class="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                            <i class="fas fa-cloud text-orange-500"></i> المزامنة السحابية (Firebase)
                        </h4>
                        
                        <div class="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                    <i class="fas fa-cloud-upload-alt text-2xl text-orange-600"></i>
                                </div>
                                <div>
                                    <div class="font-bold text-orange-900">المزامنة السحابية</div>
                                    <div class="text-xs text-orange-700">حفظ البيانات والصور على السحابة</div>
                                </div>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="firebaseToggle" class="sr-only peer">
                                <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                            </label>
                        </div>
                        <div id="firebaseStatus" class="text-xs text-center p-3 bg-slate-50 text-slate-600 rounded-xl">
                            <i class="fas fa-info-circle"></i> المزامنة السحابية متوقفة
                        </div>
                        
                        <!-- Manual Sync Button -->
                        <button id="syncNowBtn" class="w-full bg-orange-600 text-white py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
                            <i class="fas fa-sync"></i> مزامنة البيانات الآن
                        </button>
                    </div>
                </div>
            </div>

            <!-- Biometric Login Section -->
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div class="bg-gradient-to-r from-emerald-700 to-emerald-800 p-6 text-white">
                    <h3 class="text-xl font-bold flex items-center gap-3">
                        <i class="fas fa-fingerprint text-emerald-400"></i> الأمان والدخول السريع
                    </h3>
                </div>
                
                <div class="p-6 space-y-4">
                    <div class="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                                <i class="fas fa-fingerprint text-2xl text-emerald-600"></i>
                            </div>
                            <div>
                                <div class="font-bold text-emerald-900">الدخول بالبصمة</div>
                                <div class="text-xs text-emerald-700">تسجيل الدخول السريع باستخدام البصمة</div>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="biometricToggle" class="sr-only peer">
                            <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>
                    <div id="biometricStatus" class="text-xs text-center p-3 bg-slate-50 text-slate-600 rounded-xl">
                        قم بتفعيل البصمة لتسجيل الدخول السريع
                    </div>
                </div>
            </div>

            <!-- App Info -->
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div class="bg-gradient-to-r from-primary-700 to-primary-800 p-6 text-white">
                    <h3 class="text-xl font-bold flex items-center gap-3">
                        <i class="fas fa-info-circle text-primary-400"></i> معلومات التطبيق
                    </h3>
                </div>
                
                <div class="p-6">
                    <div class="text-center space-y-2">
                        <div class="text-2xl font-bold text-primary-800">AutoCheck Pro</div>
                        <div class="text-slate-500">الإصدار 1.8.1</div>
                        <div class="text-xs text-slate-400 mt-4">© 2026 جميع الحقوق محفوظة</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Firebase Toggle
    const firebaseToggle = document.getElementById('firebaseToggle');
    const firebaseStatus = document.getElementById('firebaseStatus');

    const isFirebaseEnabled = localStorage.getItem('firebase_enabled') === 'true';
    if (firebaseToggle) {
        firebaseToggle.checked = isFirebaseEnabled;
        if (isFirebaseEnabled && firebaseStatus) {
            firebaseStatus.innerHTML = '<i class="fas fa-check-circle text-orange-600"></i> المزامنة السحابية مفعّلة';
            firebaseStatus.className = 'text-xs text-center p-3 bg-orange-50 text-orange-800 rounded-xl border border-orange-100';
        }
    }

    firebaseToggle?.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        localStorage.setItem('firebase_enabled', enabled);
        if (enabled) {
            if (firebaseStatus) {
                firebaseStatus.innerHTML = '<i class="fas fa-sync fa-spin text-orange-600"></i> جارِ المزامنة...';
                firebaseStatus.className = 'text-xs text-center p-3 bg-orange-50 text-orange-800 rounded-xl border border-orange-100';
            }

            try {
                const cars = carsStore.getState().cars || [];
                const movements = movementsStore.getState().movements || [];
                const users = userStore.getState().users || [];

                const results = await FirestoreService.syncAll(cars, users, movements);

                if (firebaseStatus) {
                    firebaseStatus.innerHTML = `<i class="fas fa-check-circle text-orange-600"></i> تمت المزامنة (${results.cars} سيارة، ${results.movements} حركة)`;
                }
                Toast.success('تم تفعيل المزامنة السحابية ومزامنة البيانات');
            } catch (error) {
                console.error('Sync error:', error);
                if (firebaseStatus) {
                    firebaseStatus.innerHTML = '<i class="fas fa-check-circle text-orange-600"></i> المزامنة السحابية مفعّلة';
                }
                Toast.success('تم تفعيل المزامنة السحابية');
            }
        } else {
            if (firebaseStatus) {
                firebaseStatus.innerHTML = '<i class="fas fa-info-circle"></i> المزامنة السحابية متوقفة';
                firebaseStatus.className = 'text-xs text-center p-3 bg-slate-50 text-slate-600 rounded-xl';
            }
            Toast.info('تم إيقاف المزامنة السحابية');
        }
    });

    // Manual Sync Button
    document.getElementById('syncNowBtn')?.addEventListener('click', async () => {
        const btn = document.getElementById('syncNowBtn');
        const originalText = btn.innerHTML;

        try {
            btn.innerHTML = '<i class="fas fa-sync fa-spin"></i> جارٍ المزامنة...';
            btn.disabled = true;

            const cars = carsStore.getState().cars || [];
            const movements = movementsStore.getState().movements || [];
            const users = userStore.getState().users || [];

            const results = await FirestoreService.syncAll(cars, users, movements);

            Toast.success(`تمت المزامنة: ${results.cars} سيارة، ${results.movements} حركة، ${results.users} مستخدم`);

            if (firebaseStatus) {
                firebaseStatus.innerHTML = `<i class="fas fa-check-circle text-orange-600"></i> آخر مزامنة: ${new Date().toLocaleTimeString('ar-SA')}`;
            }
        } catch (error) {
            console.error('Sync error:', error);
            Toast.error('فشلت المزامنة: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // Biometric Toggle
    const biometricToggle = document.getElementById('biometricToggle');
    const biometricStatus = document.getElementById('biometricStatus');

    authActions.checkBiometric().then(({ enabled }) => {
        if (biometricToggle) biometricToggle.checked = enabled;
        if (enabled && biometricStatus) {
            biometricStatus.textContent = '✅ تسجيل الدخول بالبصمة مفعّل';
            biometricStatus.classList.add('text-emerald-600');
        }
    });

    biometricToggle?.addEventListener('change', async (e) => {
        const isEnabling = e.target.checked;
        if (isEnabling) {
            // Get current logged-in user
            const { authStore } = await import('../store/authStore');
            const currentUser = authStore.getState().user;

            if (!currentUser) {
                e.target.checked = false;
                Toast.error('يجب تسجيل الدخول أولاً لتفعيل البصمة');
                return;
            }

            // Use session credentials if available to avoid prompt
            let password = authActions._sessionCredentials?.password;

            if (!password) {
                password = prompt('أدخل كلمة المرور لتأكيد تفعيل البصمة:');
            }

            if (!password) {
                e.target.checked = false;
                Toast.error('يجب إدخال كلمة المرور');
                return;
            }

            try {
                await authActions.enableBiometric(currentUser.username || currentUser.name, password);
                if (biometricStatus) {
                    biometricStatus.textContent = '✅ تسجيل الدخول بالبصمة مفعّل';
                    biometricStatus.classList.remove('text-slate-600');
                    biometricStatus.classList.add('text-emerald-600');
                }
                Toast.success('تم تفعيل الدخول بالبصمة بنجاح');
            } catch (error) {
                e.target.checked = false;
                if (biometricStatus) biometricStatus.textContent = '❌ فشل التفعيل: ' + (error.message || 'خطأ غير معروف');
                Toast.error(error.message || 'فشل تفعيل البصمة');
            }
        } else {
            try {
                await authActions.disableBiometric();
                if (biometricStatus) {
                    biometricStatus.textContent = 'قم بتفعيل البصمة لتسجيل الدخول السريع';
                    biometricStatus.classList.remove('text-emerald-600');
                    biometricStatus.classList.add('text-slate-600');
                }
                Toast.success('تم إلغاء تفعيل الدخول بالبصمة');
            } catch (error) {
                e.target.checked = true;
                Toast.error('فشل إلغاء التفعيل');
            }
        }
    });

    return () => { }
}
