import { authStore, authActions } from '../store/authStore'
import { uiStore, uiActions } from '../store/uiStore'
import { initializeApp } from '../app'

export function renderSidebar(container) {
  const { role, user } = authStore.getState()
  const { sidebarOpen } = uiStore.getState()

  const sidebarClass = sidebarOpen ? '' : 'translate-x-full md:translate-x-0'

  container.innerHTML = `
    <aside class="w-72 bg-slate-900 text-white flex flex-col shadow-2xl transition-all duration-300 absolute inset-y-0 right-0 z-30 md:relative ${sidebarClass}" id="sidebar-content">
      <!-- Logo Area -->
      <div class="p-8 pb-4 flex flex-col items-center gap-4">
        <div class="flex items-center gap-3 w-full">
          <div class="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-600/30">
            <i class="fas fa-car-side"></i>
          </div>
          <h1 class="text-xl font-bold tracking-wide">AutoCheck Pro</h1>
          <button id="closeSidebar" class="md:hidden text-slate-400 hover:text-white transition mr-auto">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="w-full mt-2 p-3 bg-slate-800/80 rounded-xl border border-primary-500/20 flex items-center gap-3 overflow-hidden">
          <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
            <i class="fas fa-building text-slate-400 text-xs"></i>
          </div>
          <span class="text-xs font-bold text-slate-200 truncate">${user?.company?.name || 'شركة غير معرفة'}</span>
        </div>
      </div>
      <!-- User Info -->
      <div class="px-6 py-4 mx-4 mb-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
            <i class="fas ${role === 'admin' ? 'fa-user-shield' : 'fa-user-lock'} text-slate-300"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-white">${user?.name || 'مستخدم'}</p>
            <button id="logoutBtn" class="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 mt-0.5 transition">
              <i class="fas fa-sign-out-alt"></i> تسجيل خروج
            </button>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 space-y-1 overflow-y-auto" id="nav-links">
        ${renderNavLinks(role)}
      </nav>
      
      <!-- Footer -->
      <div class="p-6 border-t border-slate-800 text-xs text-slate-500">
        <p>AutoCheck Pro v3.0</p>
      </div>
    </aside>
  `

  // Add event listeners
  document.getElementById('closeSidebar')?.addEventListener('click', () => {
    uiActions.toggleSidebar()
  })

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    authActions.logout()
    initializeApp()
  })

  // Navigation clicks
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const section = e.currentTarget.dataset.section
      uiActions.setActiveSection(section)

      // Close sidebar on mobile
      if (window.innerWidth < 768) {
        uiActions.toggleSidebar()
      }
    })
  })

  // Subscribe to UI changes
  uiStore.subscribe((state) => {
    updateSidebarClass(state.sidebarOpen)
    updateActiveNav(state.activeSection)
  })
}

function renderNavLinks(role) {
  const adminLinks = `
    <p class="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">الإدارة</p>
    <button data-section="dashboard" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
      <i class="fas fa-chart-pie ml-3 w-6 text-center text-slate-400 group-hover:text-primary-400 transition"></i> 
      <span class="group-hover:text-white text-slate-300">لوحة التحكم</span>
    </button>
    <button data-section="cars" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
      <i class="fas fa-car ml-3 w-6 text-center text-slate-400 group-hover:text-primary-400 transition"></i>
      <span class="group-hover:text-white text-slate-300">إدارة السيارات</span>
    </button>
    <button data-section="users" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
      <i class="fas fa-users ml-3 w-6 text-center text-slate-400 group-hover:text-primary-400 transition"></i>
      <span class="group-hover:text-white text-slate-300">المستخدمين</span>
    </button>
  `

  const guardLinks = `
    <p class="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">العمليات</p>
    <button data-section="exit" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
      <i class="fas fa-sign-out-alt ml-3 w-6 text-center text-slate-400 group-hover:text-orange-400 transition"></i>
      <span class="group-hover:text-white text-slate-300">تسجيل خروج</span>
    </button>
    <button data-section="entry" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
      <i class="fas fa-sign-in-alt ml-3 w-6 text-center text-slate-400 group-hover:text-emerald-400 transition"></i>
      <span class="group-hover:text-white text-slate-300">تسجيل عودة</span>
    </button>
  `

  const commonLinks = `
    <div class="pt-4 mt-4 border-t border-slate-800/50">
      <button data-section="logs" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
        <i class="fas fa-history ml-3 w-6 text-center text-slate-400 group-hover:text-purple-400 transition"></i>
        <span class="group-hover:text-white text-slate-300">سجل الحركات</span>
      </button>
      <button data-section="settings" class="nav-btn w-full text-right px-4 py-3 rounded-xl hover:bg-slate-800 transition-all flex items-center group">
        <i class="fas fa-cog ml-3 w-6 text-center text-slate-400 group-hover:text-slate-300 transition"></i>
        <span class="group-hover:text-white text-slate-300">الإعدادات</span>
      </button>
    </div>
  `

  // Admin sees everything
  if (role === 'admin') {
    return adminLinks + guardLinks + commonLinks
  }
  // Guard sees only operations + common
  return guardLinks + commonLinks
}

function updateSidebarClass(isOpen) {
  const sidebar = document.getElementById('sidebar-content')
  if (sidebar) {
    if (isOpen) {
      sidebar.classList.remove('translate-x-full')
    } else {
      sidebar.classList.add('translate-x-full')
      sidebar.classList.add('md:translate-x-0')
    }
  }
}

function updateActiveNav(activeSection) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.section === activeSection) {
      btn.classList.add('bg-slate-800', 'text-white', 'shadow-inner')
      btn.querySelector('i')?.classList.add('text-primary-400')
      btn.querySelector('span')?.classList.remove('text-slate-300')
      btn.querySelector('span')?.classList.add('text-white')
    } else {
      btn.classList.remove('bg-slate-800', 'text-white', 'shadow-inner')
      btn.querySelector('i')?.classList.remove('text-primary-400')
      btn.querySelector('span')?.classList.add('text-slate-300')
      btn.querySelector('span')?.classList.remove('text-white')
    }
  })
}
