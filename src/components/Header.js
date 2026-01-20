import { authStore } from '../store/authStore'
import { uiStore, uiActions } from '../store/uiStore'
import { notificationStore, notificationActions } from '../store/notificationStore'

export function renderHeader(container) {
  const { role } = authStore.getState()
  const { activeSection } = uiStore.getState()

  const titles = {
    'dashboard': 'لوحة التحكم',
    'cars': 'إدارة الأسطول',
    'exit': 'تسجيل خروج',
    'entry': 'تسجيل عودة',
    'logs': 'سجل الحركات'
  }

  const badgeText = role === 'admin' ? 'لوحة التحكم' : 'تشييك السيارات'
  const badgeClass = role === 'admin'
    ? 'bg-blue-100 text-blue-800 border-blue-200'
    : 'bg-orange-100 text-orange-800 border-orange-200'

  container.innerHTML = `
    <header class="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 px-6 flex justify-between items-center z-10 sticky top-0">
      <div class="flex items-center gap-4">
        <button id="openSidebar" class="md:hidden text-slate-600 hover:text-primary-600 transition">
          <i class="fas fa-bars text-xl"></i>
        </button>
        <h2 class="text-2xl font-bold text-slate-800" id="pageTitle">${titles[activeSection] || 'AutoCheck Pro'}</h2>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="hidden md:inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}">
          ${badgeText}
        </span>
        
        <div class="relative">
          <button id="notiBtn" class="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition relative">
            <i class="fas fa-bell"></i>
            <span id="notiBadge" class="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white hidden">0</span>
          </button>
          
          <!-- Dropdown -->
          <div id="notiDropdown" class="absolute left-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 transform origin-top-left hidden transition-all scale-95 opacity-0">
            <div class="p-4 border-b border-slate-50 flex justify-between items-center">
              <span class="font-bold text-slate-800">التنبيهات</span>
              <button id="markReadBtn" class="text-[10px] font-bold text-primary-600 hover:underline">تحديد الكل كمقروء</button>
            </div>
            <div id="notiList" class="max-h-80 overflow-y-auto divide-y divide-slate-50">
              <div class="p-8 text-center text-slate-400">
                <i class="fas fa-bell-slash mb-2 opacity-50 block text-2xl"></i>
                <p class="text-xs">لا توجد تنبيهات جديدة</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  `

  // Add mobile menu toggle
  document.getElementById('openSidebar')?.addEventListener('click', () => {
    uiActions.toggleSidebar()
  })

  // Subscribe to section changes
  uiStore.subscribe((state) => {
    const titleEl = document.getElementById('pageTitle')
    if (titleEl) {
      titleEl.textContent = titles[state.activeSection] || 'AutoCheck Pro'
    }
  })

  // Notification Logic
  const notiBtn = document.getElementById('notiBtn')
  const notiDropdown = document.getElementById('notiDropdown')
  const markReadBtn = document.getElementById('markReadBtn')

  notiBtn?.addEventListener('click', (e) => {
    e.stopPropagation()
    const isHidden = notiDropdown.classList.contains('hidden')
    if (isHidden) {
      notiDropdown.classList.remove('hidden')
      setTimeout(() => {
        notiDropdown.classList.remove('scale-95', 'opacity-0')
      }, 10)
    } else {
      closeNoti()
    }
  })

  document.addEventListener('click', () => closeNoti())
  notiDropdown?.addEventListener('click', (e) => e.stopPropagation())

  function closeNoti() {
    if (!notiDropdown) return
    notiDropdown.classList.add('scale-95', 'opacity-0')
    setTimeout(() => {
      notiDropdown.classList.add('hidden')
    }, 200)
  }

  markReadBtn?.addEventListener('click', () => {
    notificationActions.markAllAsRead()
  })

  // Subscribe to notifications
  notificationStore.subscribe(updateNotiUI)
  updateNotiUI()
}

function updateNotiUI() {
  const { notifications } = notificationStore.getState()
  const unread = notifications.filter(n => !n.read).length

  const badge = document.getElementById('notiBadge')
  const list = document.getElementById('notiList')

  if (badge) {
    if (unread > 0) {
      badge.textContent = unread
      badge.classList.remove('hidden')
    } else {
      badge.classList.add('hidden')
    }
  }

  if (list) {
    if (notifications.length === 0) {
      list.innerHTML = `
                <div class="p-8 text-center text-slate-400">
                    <i class="fas fa-bell-slash mb-2 opacity-50 block text-2xl"></i>
                    <p class="text-xs">لا توجد تنبيهات جديدة</p>
                </div>
            `
    } else {
      list.innerHTML = notifications.map(n => `
                <div class="p-4 hover:bg-slate-50 transition ${n.read ? '' : 'bg-blue-50/30'}">
                    <div class="flex justify-between items-start mb-1">
                        <span class="font-bold text-xs text-slate-800">${n.title}</span>
                        <span class="text-[9px] text-slate-400">${new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p class="text-xs text-slate-500 leading-relaxed">${n.body}</p>
                </div>
            `).join('')
    }
  }
}
