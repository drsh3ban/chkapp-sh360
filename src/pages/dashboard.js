import { carsStore } from '../store/carsStore'
import { movementsStore } from '../store/movementsStore'
import { uiActions } from '../store/uiStore'
import { formatTime, formatDate } from '../utils/helpers'
import Chart from 'chart.js/auto'

export function renderDashboard(container) {
  container.innerHTML = `
    <div class="space-y-8 animate-fade-in">
      <div class="flex justify-between items-center">
        <h2 class="text-3xl font-bold text-slate-800">لوحة التحكم</h2>
        <div class="role-admin">
          <button id="exportDataBtn" class="bg-primary-50 text-primary-600 px-4 py-2 rounded-xl hover:bg-primary-100 text-sm font-bold border border-primary-100 transition flex items-center gap-2">
            <i class="fas fa-download"></i> نسخة احتياطية
          </button>
        </div>
      </div>
      
      <!-- Quick Actions for Guards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button id="quickExitBtn" class="bg-gradient-to-br from-orange-400 to-orange-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-200 hover:shadow-orange-300 transform hover:-translate-y-1 transition-all flex items-center justify-between group">
          <div class="text-right">
            <h3 class="text-2xl font-bold mb-1">تسجيل خروج</h3>
            <p class="text-orange-100 text-sm opacity-90">تسجيل مغادرة سيارة جديدة</p>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
            <i class="fas fa-sign-out-alt"></i>
          </div>
        </button>

        <button id="quickEntryBtn" class="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white p-6 rounded-3xl shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transform hover:-translate-y-1 transition-all flex items-center justify-between group">
          <div class="text-right">
            <h3 class="text-2xl font-bold mb-1">تسجيل عودة</h3>
            <p class="text-emerald-100 text-sm opacity-90">تسجيل عودة سيارة للمقر</p>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
            <i class="fas fa-sign-in-alt"></i>
          </div>
        </button>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- ... existing stat cards ... -->
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p class="text-slate-500 text-sm font-medium mb-1">إجمالي السيارات</p>
            <h3 class="text-4xl font-extrabold text-slate-800" id="totalCarsCount">0</h3>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-2xl">
            <i class="fas fa-car"></i>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p class="text-slate-500 text-sm font-medium mb-1">بالداخل الآن</p>
            <h3 class="text-4xl font-extrabold text-slate-800" id="carsInCount">0</h3>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl">
            <i class="fas fa-parking"></i>
          </div>
        </div>
        
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-lg transition-shadow">
          <div>
            <p class="text-slate-500 text-sm font-medium mb-1">بالخارج الآن</p>
            <h3 class="text-4xl font-extrabold text-slate-800" id="carsOutCount">0</h3>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl">
            <i class="fas fa-road"></i>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 class="font-bold text-lg text-slate-800 mb-6">توزيع الأسطول السحابي</h4>
          <div class="h-64 relative">
            <canvas id="fleetChart"></canvas>
          </div>
        </div>
        <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h4 class="font-bold text-lg text-slate-800 mb-6">نشاط الحركات الأسبوعي</h4>
          <div class="h-64 relative">
            <canvas id="movementChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Recent Activity Table ... -->

      <!-- Recent Activity Table -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 class="font-bold text-xl text-slate-800">آخر الحركات المسجلة</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead class="bg-slate-50/50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th class="p-4 rounded-tr-xl">المركبة</th>
                <th class="p-4">نوع الحركة</th>
                <th class="p-4">الوقت</th>
                <th class="p-4 rounded-tl-xl">رقم العقد</th>
              </tr>
            </thead>
            <tbody id="recentMovesTable" class="divide-y divide-slate-100 text-sm">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `

  // Update statistics
  updateDashboardStats()

  // Subscribe to changes
  const unsubCars = carsStore.subscribe(updateDashboardStats)
  const unsubMovements = movementsStore.subscribe(updateDashboardStats)

  // Quick Actions Listeners
  const quickExitBtn = document.getElementById('quickExitBtn')
  const quickEntryBtn = document.getElementById('quickEntryBtn')

  const handleQuickExit = () => uiActions.setActiveSection('exit')
  const handleQuickEntry = () => uiActions.setActiveSection('entry')

  if (quickExitBtn) quickExitBtn.addEventListener('click', handleQuickExit)
  if (quickEntryBtn) quickEntryBtn.addEventListener('click', handleQuickEntry)

  // Backup listener
  const exportBtn = document.getElementById('exportDataBtn')
  const handleExport = handleExportData // Reference to function for removal

  if (exportBtn) {
    exportBtn.addEventListener('click', handleExport)
  }

  // Return cleanup function
  return () => {
    unsubCars()
    unsubMovements()
    if (exportBtn) {
      exportBtn.removeEventListener('click', handleExport)
    }
    if (quickExitBtn) quickExitBtn.removeEventListener('click', handleQuickExit)
    if (quickEntryBtn) quickEntryBtn.removeEventListener('click', handleQuickEntry)

    if (fleetChartInstance) {
      fleetChartInstance.destroy()
      fleetChartInstance = null
    }
    if (movementChartInstance) {
      movementChartInstance.destroy()
      movementChartInstance = null
    }
  }
}

function handleExportData() {
  const data = {
    cars: carsStore.getState().cars,
    movements: movementsStore.getState().movements,
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `autocheck-backup-${new Date().toISOString().split('T')[0]}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function updateDashboardStats() {
  const { cars } = carsStore.getState()
  const { movements } = movementsStore.getState()

  // Update counts
  const totalCars = cars.length
  const carsIn = cars.filter(c => c.status === 'in').length
  const carsOut = cars.filter(c => c.status === 'out').length

  document.getElementById('totalCarsCount').textContent = totalCars
  document.getElementById('carsInCount').textContent = carsIn
  document.getElementById('carsOutCount').textContent = carsOut

  // Initialize/Update Charts
  initFleetChart(carsIn, carsOut)
  initMovementChart(movements)

  // Update recent movements table
  // ... rest of the code
  const recentMovements = movements.slice().reverse().slice(0, 5)
  const tbody = document.getElementById('recentMovesTable')

  if (!tbody) return

  if (recentMovements.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="p-8 text-center text-slate-400">لا توجد حركات مسجلة بعد</td>
      </tr>
    `
    return
  }

  tbody.innerHTML = recentMovements.map(m => {
    const car = cars.find(c => String(c.id) === String(m.carId))
    const isCompleted = m.status === 'completed'
    const typeText = isCompleted ? 'تشييك عودة' : 'تشييك خروج'
    const typeClass = isCompleted
      ? 'bg-emerald-100 text-emerald-700'
      : 'bg-orange-100 text-orange-700'
    const time = isCompleted ? m.returnTime : m.exitTime

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="p-4 font-bold text-slate-700">
          ${car ? car.model : 'غير معروف'}
          <span class="text-xs font-normal text-slate-400 block mt-1">${car ? car.plate : '-'}</span>
        </td>
        <td class="p-4">
          <span class="${typeClass} px-3 py-1 rounded-full text-xs font-bold border border-opacity-10">
            ${typeText}
          </span>
        </td>
        <td class="p-4 text-slate-500 font-mono text-xs" dir="ltr">${formatTime(time)}</td>
        <td class="p-4 text-slate-600 font-medium">${m.driver || '-'}</td>
      </tr>
    `
  }).join('')
}

let fleetChartInstance = null
function initFleetChart(carsIn, carsOut) {
  const ctx = document.getElementById('fleetChart')
  if (!ctx) return

  if (fleetChartInstance) fleetChartInstance.destroy()

  fleetChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['متواجدة', 'بالخارج'],
      datasets: [{
        data: [carsIn, carsOut],
        backgroundColor: ['#10b981', '#f59e0b'],
        borderWidth: 0,
        hoverOffset: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      },
      cutout: '70%'
    }
  })
}

let movementChartInstance = null
function initMovementChart(movements) {
  const ctx = document.getElementById('movementChart')
  if (!ctx) return

  if (movementChartInstance) movementChartInstance.destroy()

  // Calculate movements per day for last 7 days
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const counts = last7Days.map(date => {
    return movements.filter(m =>
      m.exitTime.startsWith(date) || (m.returnTime && m.returnTime.startsWith(date))
    ).length
  })

  movementChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: last7Days.map(d => formatDate(d)),
      datasets: [{
        label: 'عدد الحركات',
        data: counts,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } },
        x: { grid: { display: false } }
      }
    }
  })
}
