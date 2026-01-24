import { authActions } from '../store/authStore'
import { Toast } from '../components/Toast'
import { initializeApp } from '../app'

export function renderLoginScreen(container) {
  container.innerHTML = `
    <div class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')">
      <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
      
      <div class="relative z-10 text-center mb-10 animate-fade-in">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary-600 to-primary-400 shadow-2xl shadow-primary-500/30 mb-6">
          <i class="fas fa-car-side text-4xl text-white"></i>
        </div>
        <h1 class="text-4xl font-extrabold text-white tracking-tight mb-2">AutoCheck Pro</h1>
        <p class="text-slate-300 text-sm font-light">نظام ذكي لإدارة حركة المركبات</p>
      </div>
      
      <div class="relative z-10 w-full max-w-md px-6 animate-fade-in">
        <form id="loginForm" class="bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
          <div class="space-y-5">
            <div>
              <label class="block text-slate-300 text-xs font-bold mb-2 mr-1">اسم المستخدم</label>
              <div class="relative">
                <i class="fas fa-user absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input type="text" id="username" required class="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-3.5 pr-12 pl-4 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none text-sm" placeholder="أدخل اسم المستخدم">
              </div>
            </div>
            
            <div>
              <label class="block text-slate-300 text-xs font-bold mb-2 mr-1">كلمة المرور</label>
              <div class="relative">
                <i class="fas fa-lock absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"></i>
                <input type="password" id="password" required class="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-3.5 pr-12 pl-4 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all outline-none text-sm" placeholder="••••••••">
              </div>
            </div>

            <button type="submit" id="submitBtn" class="w-full bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              <span>تسجيل الدخول</span>
              <i class="fas fa-arrow-left text-xs"></i>
            </button>
          </div>

          <!-- Biometric Login Button -->
          <button type="button" id="biometricBtn" class="w-full mt-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all hidden items-center justify-center gap-3">
            <i class="fas fa-fingerprint text-2xl text-primary-400"></i>
            <span>تسجيل الدخول بالبصمة</span>
          </button>

          <div class="mt-8 pt-6 border-t border-white/5 flex justify-center gap-4 text-[10px] text-slate-400 font-medium">
             <div class="flex items-center gap-1">
               <i class="fas fa-check-circle text-primary-500"></i>
               <span>نظام سحابي أمن</span>
             </div>
             <div class="flex items-center gap-1">
               <i class="fas fa-check-circle text-primary-500"></i>
               <span>دعم فني 24/7</span>
             </div>
          </div>
        </form>
      </div>
      
      <p class="relative z-10 mt-10 text-slate-500 text-[10px] tracking-widest uppercase">AutoCheck Pro v7.0 • Multi-Tenant</p>
    </div>
  `

  // Attach event listener
  const loginForm = document.getElementById('loginForm')
  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault()

    const username = document.getElementById('username').value
    const password = document.getElementById('password').value
    const submitBtn = document.getElementById('submitBtn')

    // Loading state
    const originalContent = submitBtn.innerHTML
    submitBtn.disabled = true
    submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> جاري التحقق...'

    try {
      const success = await authActions.login(username, password)

      if (success) {
        Toast.success('تم تسجيل الدخول بنجاح')
        initializeApp()
      } else {
        Toast.error('خطأ في اسم المستخدم أو كلمة المرور')
        submitBtn.disabled = false
        submitBtn.innerHTML = originalContent
      }
    } catch (err) {
      Toast.error('فشل الاتصال بالخادم')
      submitBtn.disabled = false
      submitBtn.innerHTML = originalContent
    }
  })

  // Biometric login button
  const biometricBtn = document.getElementById('biometricBtn')
  biometricBtn?.addEventListener('click', async () => {
    const originalContent = biometricBtn.innerHTML
    biometricBtn.disabled = true
    biometricBtn.innerHTML = '<i class="fas fa-fingerprint fa-pulse text-2xl text-primary-400"></i> <span>جاري التحقق...</span>'

    try {
      const success = await authActions.biometricLogin()
      if (success) {
        Toast.success('تم تسجيل الدخول بنجاح')
        initializeApp()
      } else {
        Toast.error('فشل التحقق البيومتري')
        biometricBtn.disabled = false
        biometricBtn.innerHTML = originalContent
      }
    } catch (err) {
      Toast.error(err.message || 'فشل التحقق البيومتري')
      biometricBtn.disabled = false
      biometricBtn.innerHTML = originalContent
    }
  })

  // Check if biometric is enabled and show button
  authActions.checkBiometric().then(({ available, enabled }) => {
    if (available && enabled) {
      biometricBtn?.classList.remove('hidden')
      biometricBtn?.classList.add('flex')
    }
  }).catch(() => {
    // Silently fail if biometric check fails
  })
}
