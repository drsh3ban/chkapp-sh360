import { FTPService } from '../services/ftpStorage'
import { Toast } from '../components/Toast'
import { authActions } from '../store/authStore'

export function renderSettings(container) {
    const config = FTPService.getConfig();

    container.innerHTML = `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div class="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white">
                    <h3 class="text-xl font-bold flex items-center gap-3">
                        <i class="fas fa-cog text-slate-400"></i> إعدادات النظام
                    </h3>
                </div>
                
                <div class="p-6 space-y-6">
                    <!-- FTP Configuration -->
                    <div class="space-y-4">
                        <h4 class="font-bold text-slate-700 flex items-center gap-2 border-b pb-2">
                            <i class="fas fa-server text-primary-500"></i> إعدادات الربط مع الكمبيوتر (FTP)
                        </h4>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">عنوان الخادم (IP/Host)</label>
                                <input type="text" id="ftpHost" value="${config.host}" placeholder="192.168.1.10" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">المنفذ (Port)</label>
                                <input type="number" id="ftpPort" value="${config.port}" placeholder="21" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">اسم المستخدم</label>
                                <input type="text" id="ftpUser" value="${config.username}" placeholder="admin" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 mb-1">كلمة المرور</label>
                                <input type="password" id="ftpPass" value="${config.password}" placeholder="******" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-500 mb-1">المجلد البعيد</label>
                            <input type="text" id="ftpPath" value="${config.remotePath}" placeholder="/car_checks/" class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>

                        <div class="flex items-center gap-3 p-4 bg-primary-50 rounded-2xl border border-primary-100">
                            <input type="checkbox" id="ftpEnabled" ${config.enabled ? 'checked' : ''} class="w-5 h-5 accent-primary-600">
                            <label for="ftpEnabled" class="text-sm font-bold text-primary-900">تفعيل المزامنة التلقائية مع الكمبيوتر</label>
                        </div>
                    </div>

                    <div class="pt-4 flex gap-3">
                        <button id="saveFtpSettings" class="flex-1 bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition shadow-lg shadow-primary-500/20">
                            حفظ الإعدادات
                        </button>
                        <button id="testFtpConnection" class="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition">
                            فحص الاتصال
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
                                <p class="text-sm font-bold text-emerald-900">تسجيل الدخول بالبصمة</p>
                                <p class="text-xs text-emerald-700">استخدم بصمة الإصبع أو التعرف على الوجه</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="biometricToggle" class="sr-only peer">
                            <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
                        </label>
                    </div>

                    <p id="biometricStatus" class="text-xs text-slate-600 text-center p-3 bg-slate-50 rounded-xl"></p>
                </div>
            </div>

            <!-- Firebase Storage Section -->
            <div class="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden mt-6">
                <div class="bg-gradient-to-r from-orange-600 to-orange-700 p-6 text-white">
                    <h3 class="text-xl font-bold flex items-center gap-3">
                        <i class="fas fa-cloud text-orange-200"></i> التخزين السحابي (Firebase)
                    </h3>
                </div>
                
                <div class="p-6 space-y-4">
                    <div class="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                                <i class="fas fa-cloud-upload-alt text-2xl text-orange-600"></i>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-orange-900">المزامنة مع Firebase</p>
                                <p class="text-xs text-orange-700">رفع الصور تلقائياً إلى السحابة</p>
                            </div>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="firebaseToggle" class="sr-only peer">
                            <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-orange-600"></div>
                        </label>
                    </div>

                    <div id="firebaseStatus" class="text-xs text-center p-3 bg-slate-50 rounded-xl transition-colors duration-300">
                        <i class="fas fa-info-circle mr-1"></i>
                        يرجى تزويد ملف الإعدادات لتفعيل المزامنة السحابية.
                    </div>
                </div>
            </div>

           <div class="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p class="text-xs text-blue-800 leading-relaxed">
                    <i class="fas fa-info-circle mr-1"></i>
                    هذه الميزة تتيح لك إرسال صور التقارير مباشرة إلى جهاز الكمبيوتر الخاص بك عبر شبكة الواي فاي. تأكد من تشغيل خادم FTP على جهازك (مثل FileZilla أو IIS) وأن الهاتف والكمبيوتر على نفس الشبكة.
                </p>
            </div>
        </div>
    `;

    // FTP Event Listeners
    document.getElementById('saveFtpSettings').addEventListener('click', () => {
        const newConfig = {
            host: document.getElementById('ftpHost').value.trim(),
            port: parseInt(document.getElementById('ftpPort').value) || 21,
            username: document.getElementById('ftpUser').value.trim(),
            password: document.getElementById('ftpPass').value,
            remotePath: document.getElementById('ftpPath').value.trim(),
            enabled: document.getElementById('ftpEnabled').checked
        };

        FTPService.saveConfig(newConfig);
        Toast.success('تم حفظ إعدادات FTP بنجاح');
    });

    document.getElementById('testFtpConnection').addEventListener('click', async () => {
        const btn = document.getElementById('testFtpConnection');
        const originalText = btn.innerHTML;

        try {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الاتصال...';
            btn.disabled = true;

            const tempConfig = {
                host: document.getElementById('ftpHost').value.trim(),
                port: parseInt(document.getElementById('ftpPort').value) || 21,
                username: document.getElementById('ftpUser').value.trim(),
                password: document.getElementById('ftpPass').value,
                remotePath: document.getElementById('ftpPath').value.trim(),
                enabled: true
            };
            FTPService.saveConfig(tempConfig);

            await FTPService.connect();
            Toast.success('✅ تم الاتصال بخادم FTP بنجاح!');
        } catch (error) {
            Toast.error('❌ فشل الاتصال: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // Biometric Toggle
    const biometricToggle = document.getElementById('biometricToggle');
    const biometricStatus = document.getElementById('biometricStatus');

    authActions.checkBiometric().then(({ available, enabled }) => {
        if (!available) {
            if (biometricToggle) biometricToggle.disabled = true;
            if (biometricStatus) {
                biometricStatus.textContent = '❌ البصمة غير متوفرة على هذا الجهاز';
                biometricStatus.classList.add('text-red-600');
            }
        } else if (enabled) {
            if (biometricToggle) biometricToggle.checked = true;
            if (biometricStatus) {
                biometricStatus.textContent = '✅ تسجيل الدخول بالبصمة مفعّل';
                biometricStatus.classList.add('text-emerald-600');
            }
        } else if (biometricStatus) {
            biometricStatus.textContent = 'قم بتفعيل البصمة لتسجيل الدخول السريع';
        }
    });

    biometricToggle?.addEventListener('change', async (e) => {
        const isEnabling = e.target.checked;
        if (isEnabling) {
            const username = prompt('أدخل اسم المستخدم لتفعيل البصمة:');
            const password = prompt('أدخل كلمة المرور:');
            if (!username || !password) {
                e.target.checked = false;
                Toast.error('يجب إدخال اسم المستخدم وكلمة المرور');
                return;
            }
            try {
                await authActions.enableBiometric(username, password);
                if (biometricStatus) {
                    biometricStatus.textContent = '✅ تسجيل الدخول بالبصمة مفعّل';
                    biometricStatus.classList.remove('text-slate-600');
                    biometricStatus.classList.add('text-emerald-600');
                }
                Toast.success('تم تفعيل الدخول بالبصمة بنجاح');
            } catch (error) {
                e.target.checked = false;
                if (biometricStatus) biometricStatus.textContent = '❌ فشل التفعيل';
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

    firebaseToggle?.addEventListener('change', (e) => {
        const enabled = e.target.checked;
        localStorage.setItem('firebase_enabled', enabled);
        if (enabled) {
            if (firebaseStatus) {
                firebaseStatus.innerHTML = '<i class="fas fa-check-circle text-orange-600"></i> المزامنة السحابية مفعّلة';
                firebaseStatus.className = 'text-xs text-center p-3 bg-orange-50 text-orange-800 rounded-xl border border-orange-100';
            }
            Toast.success('تم تفعيل المزامنة السحابية');
        } else {
            if (firebaseStatus) {
                firebaseStatus.innerHTML = '<i class="fas fa-info-circle"></i> المزامنة السحابية متوقفة';
                firebaseStatus.className = 'text-xs text-center p-3 bg-slate-50 text-slate-600 rounded-xl';
            }
            Toast.info('تم إيقاف المزامنة السحابية');
        }
    });

    return () => { }
}
