import { authStore, authActions } from '../store/authStore'
import { uiStore, uiActions } from '../store/uiStore'
import { renderSidebar } from '../components/Sidebar'
import { renderHeader } from '../components/Header'
import { renderDashboard } from './dashboard'
import { renderCarsManagement } from './cars'
import { renderExitRegistration } from './exit'
import { renderEntryRegistration } from './entry'
import { renderLogs } from './logs'
import { renderUsersPage } from './users'
import { renderSettings } from './settings'

export function renderMainApp(container) {
    const state = authStore.getState();
    const role = state.role;

    // DEBUG: Trace routing
    // alert(`Debug: Role=${role}, User=${state.user?.name}`);

    container.innerHTML = `
    <div class="h-screen flex overflow-hidden bg-slate-50">
      <div id="overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-20 hidden md:hidden"></div>
      <div id="sidebar"></div>
      <main class="flex-1 flex flex-col h-screen overflow-hidden relative w-full bg-slate-50">
        <div id="header"></div>
        <div id="content" class="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth"></div>
      </main>
    </div>
  `

    // Render components
    renderSidebar(document.getElementById('sidebar'))
    renderHeader(document.getElementById('header'))

    // Set initial section based on role
    const initialSection = role === 'admin' ? 'dashboard' : 'exit'
    // alert(`Debug: InitialSection=${initialSection}`);
    uiActions.setActiveSection(initialSection)

    // Subscribe to section changes
    uiStore.subscribe((state) => {
        // alert(`Debug: UiStore Update=${state.activeSection}`);
        renderCurrentSection(state.activeSection)
        updateOverlay(state.sidebarOpen)
    })

    // Initial render
    renderCurrentSection(initialSection)

    // Setup overlay click handler
    const overlay = document.getElementById('overlay')
    overlay.addEventListener('click', () => {
        uiActions.toggleSidebar()
    })

    // Listen for custom navigation events
    window.addEventListener('navigate-to', (e) => {
        const section = e.detail;
        if (section) {
            uiActions.setActiveSection(section);
        }
    })
}

let currentCleanup = null;

function renderCurrentSection(section) {
    const contentEl = document.getElementById('content')
    if (!contentEl) return;

    // Cleanup previous section
    if (currentCleanup) {
        if (typeof currentCleanup === 'function') {
            currentCleanup();
        }
        currentCleanup = null;
    }

    console.log('Rendering Section:', section);

    switch (section) {
        case 'dashboard':
            currentCleanup = renderDashboard(contentEl)
            break
        case 'cars':
            currentCleanup = renderCarsManagement(contentEl)
            break
        case 'exit':
            currentCleanup = renderExitRegistration(contentEl) // Assuming these return cleanup too or will be ignored if undefined
            break
        case 'entry':
            currentCleanup = renderEntryRegistration(contentEl)
            break
        case 'logs':
            currentCleanup = renderLogs(contentEl)
            break
        case 'users':
            currentCleanup = renderUsersPage(contentEl)
            break
        case 'settings':
            currentCleanup = renderSettings(contentEl)
            break
        default:
            contentEl.innerHTML = `<div class="text-center py-12 text-slate-500">الصفحة غير موجودة (${section})</div>`
    }
}

function updateOverlay(sidebarOpen) {
    const overlay = document.getElementById('overlay')
    if (sidebarOpen) {
        overlay.classList.remove('hidden')
    } else {
        overlay.classList.add('hidden')
    }
}
