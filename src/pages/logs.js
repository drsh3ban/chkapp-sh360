import { carsStore } from '../store/carsStore'
import { movementsStore, movementsActions } from '../store/movementsStore'
import { FirestoreService } from '../services/firestoreService'
import { formatDateTime, formatTime, calculateDistance } from '../utils/helpers'
import { authStore } from '../store/authStore'
import { Toast } from '../components/Toast'
import { generateMovementReport } from '../utils/pdfGenerator'
import { ImageStorageService } from '../services/imageStorage'

export function renderLogs(container) {
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col space-y-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 class="text-xl font-bold flex items-center gap-2 text-slate-800">
            <i class="fas fa-history text-primary-500"></i>
            سجل الحركات الشامل
          </h3>
          <div class="flex flex-wrap gap-2 role-admin">
            <button id="clearLogsBtn" class="bg-red-50 text-red-600 px-4 py-2 rounded-xl hover:bg-red-100 text-xs font-bold border border-red-100 transition flex items-center gap-2">
              <i class="fas fa-trash-alt"></i> مسح المكتمل
            </button>
            <button id="syncAllFtpBtn" class="bg-primary-50 text-primary-600 px-4 py-2 rounded-xl hover:bg-primary-100 text-xs font-bold border border-primary-100 transition flex items-center gap-2">
              <i class="fas fa-sync"></i> مزامنة الكل
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- Main Search -->
          <div class="relative">
            <i class="fas fa-search absolute right-3 top-3.5 text-slate-400"></i>
            <input type="text" id="searchLogs" placeholder="رقم اللوحة، الموديل، العقد..." 
              class="w-full p-3 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm">
          </div>

          <!-- Date Filter -->
          <div class="relative">
            <i class="fas fa-calendar-alt absolute right-3 top-3.5 text-slate-400"></i>
            <input type="date" id="searchDate" 
              class="w-full p-3 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm">
          </div>

          <!-- Status Filter -->
          <select id="filterType" class="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm font-medium">
            <option value="all">كل الحالات</option>
            <option value="completed">مكتملة</option>
            <option value="active">في الخارج</option>
          </select>

          <!-- Car Model Filter -->
          <select id="filterModel" class="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm font-medium">
            <option value="all">كل الموديلات</option>
          </select>

          <!-- Guard/User Filter -->
          <select id="filterGuard" class="p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm font-medium">
            <option value="all">كل الحراس</option>
          </select>
        </div>
      </div>

      <div id="logsContainer" class="space-y-6"></div>
    </div>
  `

  // Render logs
  renderMovementLogs()

  // Setup search
  document.getElementById('searchLogs').addEventListener('input', renderMovementLogs)
  document.getElementById('searchDate').addEventListener('input', renderMovementLogs)
  document.getElementById('filterType').addEventListener('change', renderMovementLogs)
  document.getElementById('filterModel').addEventListener('change', renderMovementLogs)
  document.getElementById('filterGuard').addEventListener('change', renderMovementLogs)

  // Setup clear button
  const clearBtn = document.getElementById('clearLogsBtn')
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearLogs)
  }

  // Setup FTP Sync All
  document.getElementById('syncAllFtpBtn')?.addEventListener('click', handleSyncAllFtp)

  // Initial populate filters
  populateFilterOptions()

  // Subscribe to changes
  movementsStore.subscribe(() => {
    populateFilterOptions()
    renderMovementLogs()
  })
  carsStore.subscribe(() => {
    populateFilterOptions()
    renderMovementLogs()
  })
}

function populateFilterOptions() {
  const modelSelect = document.getElementById('filterModel')
  const guardSelect = document.getElementById('filterGuard')
  if (!modelSelect || !guardSelect) return

  const { cars } = carsStore.getState()
  const { movements } = movementsStore.getState()

  // Populate Models
  const models = [...new Set(cars.map(c => c.model))].sort()
  const currentModel = modelSelect.value
  modelSelect.innerHTML = '<option value="all">كل الموديلات</option>'
  models.forEach(m => {
    const opt = document.createElement('option')
    opt.value = m
    opt.textContent = m
    modelSelect.appendChild(opt)
  })
  modelSelect.value = currentModel || 'all'

  // Populate Guards (unique names from movements)
  const guards = [...new Set(movements.map(m => m.user || 'Unknown'))].sort()
  const currentGuard = guardSelect.value
  guardSelect.innerHTML = '<option value="all">كل الحراس</option>'
  guards.forEach(g => {
    const opt = document.createElement('option')
    opt.value = g
    opt.textContent = g
    guardSelect.appendChild(opt)
  })
  guardSelect.value = currentGuard || 'all'
}

function renderMovementLogs() {
  const container = document.getElementById('logsContainer')
  if (!container) return

  const { movements } = movementsStore.getState()
  const { cars } = carsStore.getState()
  const searchTerm = document.getElementById('searchLogs')?.value.toLowerCase() || ''
  const searchDate = document.getElementById('searchDate')?.value || ''
  const filterType = document.getElementById('filterType')?.value || 'all'
  const filterModel = document.getElementById('filterModel')?.value || 'all'
  const filterGuard = document.getElementById('filterGuard')?.value || 'all'

  // Filter and sort movements
  let filteredMovements = movements

  // Type Filter
  if (filterType !== 'all') {
    filteredMovements = filteredMovements.filter(m =>
      filterType === 'completed' ? m.status === 'completed' : m.status !== 'completed'
    )
  }

  // Model Filter
  if (filterModel !== 'all') {
    filteredMovements = filteredMovements.filter(m => {
      const car = cars.find(c => String(c.id) === String(m.carId))
      return car && car.model === filterModel
    })
  }

  // Guard Filter
  if (filterGuard !== 'all') {
    filteredMovements = filteredMovements.filter(m => (m.user || 'Unknown') === filterGuard)
  }

  // Search Filter
  if (searchTerm) {
    filteredMovements = filteredMovements.filter(m => {
      const car = cars.find(c => String(c.id) === String(m.carId))
      return (
        (car && car.plate.toLowerCase().includes(searchTerm)) ||
        (car && car.model.toLowerCase().includes(searchTerm)) ||
        (m.driver && m.driver.toLowerCase().includes(searchTerm)) ||
        (m.user && m.user.toLowerCase().includes(searchTerm)) ||
        (String(m.id).includes(searchTerm))
      )
    })
  }

  // Date Filter
  if (searchDate) {
    filteredMovements = filteredMovements.filter(m => {
      const exitDate = new Date(m.exitTime).toISOString().split('T')[0]
      const returnDate = m.returnTime ? new Date(m.returnTime).toISOString().split('T')[0] : null
      return exitDate === searchDate || returnDate === searchDate
    })
  }

  // Sort by date (newest first)
  filteredMovements = filteredMovements.slice().sort((a, b) =>
    new Date(b.exitTime) - new Date(a.exitTime)
  )

  if (filteredMovements.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-300">
        <i class="fas fa-search fa-4x mb-4 opacity-50"></i>
        <p class="text-lg">${searchTerm ? 'لا توجد سجلات مطابقة' : 'لا توجد حركات مسجلة بعد'}</p>
      </div>
    `
    return
  }

  const totalCount = filteredMovements.length
  container.innerHTML = filteredMovements.map((movement, index) =>
    renderMovementCard(movement, cars, totalCount - index)
  ).join('')

  // Attach PDF listeners
  container.querySelectorAll('.download-pdf-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.movementId
      const movement = movements.find(m => String(m.id) === String(id))
      const car = movement ? cars.find(c => String(c.id) === String(movement.carId)) : null
      if (movement && car) {
        Toast.info('جاري تحضير تقرير PDF...')
        generateMovementReport(movement, car)
      } else if (movement && !car) {
        // Fallback for missing car data
        Toast.info('جاري تحضير تقرير PDF...')
        generateMovementReport(movement, { model: 'مركبة محذوفة', plate: '---' })
      }
    })
  })

  // Attach FTP Sync listeners
  container.querySelectorAll('.sync-ftp-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = btn.dataset.movementId
      const movement = movements.find(m => String(m.id) === String(id))
      if (movement) {
        await handleSyncSingleFtp(movement, btn)
      }
    })
  })
}

function renderMovementCard(movement, cars, index) {
  const car = cars.find(c => String(c.id) === String(movement.carId))
  const carName = car ? `${car.model} (${car.plate})` : 'مركبة محذوفة'
  const isCompleted = movement.status === 'completed'
  const distance = isCompleted ? calculateDistance(movement.exitMileage, movement.returnMileage) : 0

  return `
    <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div class="flex flex-col px-6 py-4 ${isCompleted ? 'bg-slate-800' : 'bg-gradient-to-r from-primary-600 to-primary-500'} text-white">
        <!-- Row 1: Car Info (Inline) -->
        <div class="font-bold flex items-center gap-2 text-base mb-2 flex-wrap">
          <span class="bg-white/20 text-white w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs border border-white/20">
            ${index}
          </span>
          <i class="fas fa-car-side text-sm opacity-70"></i>
          <span class="font-bold whitespace-nowrap">${car ? car.model : 'مركبة محذوفة'}</span>
          <span class="text-xs opacity-70 font-mono bg-white/10 px-2 py-0.5 rounded">${car ? car.plate : '---'}</span>
        </div>
        
        <!-- Row 2: Buttons -->
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
                <button 
                  data-movement-id="${movement.id}"
                  class="download-pdf-btn bg-white/10 hover:bg-white text-white hover:text-primary-600 p-2.5 rounded-xl backdrop-blur-md transition-all border border-white/20 hover:border-white shadow-sm"
                  title="تحميل تقرير PDF"
                >
                  <i class="fas fa-file-pdf"></i>
                </button>
                <button 
                  data-movement-id="${movement.id}"
                  class="sync-ftp-btn bg-white/10 hover:bg-white text-white hover:text-emerald-500 p-2.5 rounded-xl backdrop-blur-md transition-all border border-white/20 hover:border-white shadow-sm"
                  title="مزامنة مع FTP"
                >
                  <i class="fas fa-cloud-upload-alt"></i>
                </button>
            </div>
            <span class="text-[10px] font-black uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1.5 rounded-xl shadow-sm flex items-center gap-2 whitespace-nowrap">
            ${isCompleted ? '<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> مكتملة' : '<span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> في الخارج'}
            </span>
        </div>
      </div>
      
      <div class="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100 min-h-[200px]">
        
        <!-- Exit Section -->
        <div class="md:w-1/2 w-full p-6 flex flex-col bg-orange-50/30">
          <div class="border-b border-orange-100 pb-3 mb-4 flex items-center justify-between">
            <h4 class="font-bold text-orange-800 flex items-center gap-2"><i class="fas fa-sign-out-alt text-orange-500"></i> بيانات الخروج</h4>
            <span class="text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded border border-slate-100">${formatTime(movement.exitTime)}</span>
          </div>
          
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">رقم العقد</span>
              <span class="font-bold text-slate-700">${movement.driver}</span>
            </div>
            <div class="bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">العداد</span>
              <span class="font-bold text-slate-700 font-mono text-lg">${movement.exitMileage}</span>
            </div>
            <div class="col-span-2 bg-white p-3 rounded-xl border border-orange-100 shadow-sm">
              <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">الوقود</span>
              ${renderFuelBar(movement.exitFuel, 'orange')}
            </div>
          </div>
          
          ${renderPhotoGallery(movement.exitPhotos, 'orange')}
        </div>

        <!-- Return Section -->
        <div class="md:w-1/2 w-full p-6 flex flex-col ${isCompleted ? 'bg-emerald-50/30' : 'bg-slate-50 items-center justify-center text-center relative overflow-hidden'}">
          ${isCompleted ? `
            <div class="border-b border-emerald-100 pb-3 mb-4 flex items-center justify-between">
              <h4 class="font-bold text-emerald-800 flex items-center gap-2"><i class="fas fa-sign-in-alt text-emerald-500"></i> بيانات العودة</h4>
              <span class="text-xs text-slate-400 font-mono bg-white px-2 py-1 rounded border border-slate-100">${formatTime(movement.returnTime)}</span>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">المسافة</span>
                <span class="font-bold text-blue-600 font-mono text-lg">+${distance} KM</span>
              </div>
              <div class="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">العداد</span>
                <span class="font-bold text-slate-700 font-mono text-lg">${movement.returnMileage}</span>
              </div>
              <div class="col-span-2 bg-white p-3 rounded-xl border border-emerald-100 shadow-sm">
                <span class="text-[10px] uppercase font-bold text-slate-400 block mb-1">الوقود</span>
                ${renderFuelBar(movement.returnFuel, 'emerald')}
              </div>
            </div>
            
            ${renderPhotoGallery(movement.returnPhotos, 'emerald')}
          ` : `
            <div class="absolute inset-0 opacity-5 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]"></div>
            <div class="relative z-10">
              <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md text-slate-300">
                <i class="fas fa-road fa-3x"></i>
              </div>
              <h5 class="font-bold text-slate-600 mb-2 text-lg">السيارة لا تزال في الخارج</h5>
              <p class="text-slate-400 text-sm">لم يتم تسجيل العودة بعد</p>
            </div>
          `}
        </div>
      </div>
      
      ${movement.aiReports ? renderAIReportSection(movement) : ''}
    </div>
  `
}

function renderFuelBar(val, color) {
  const pct = parseInt(val) || 0
  const gradientClass = color === 'orange' ? 'from-orange-500 to-amber-500' : 'from-emerald-500 to-teal-500'
  const textClass = pct > 50 ? 'text-white drop-shadow-md' : 'text-slate-600'

  return `
    <div class="relative w-full h-5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
      <!-- Grid Lines / Ticks -->
      <div class="absolute inset-0 w-full h-full z-0 flex justify-between px-[1%]">
        <div class="w-px h-full bg-slate-300/50" style="margin-left: 25%"></div>
        <div class="w-px h-full bg-slate-300/80" style="margin-left: 25%"></div>
        <div class="w-px h-full bg-slate-300/50" style="margin-left: 25%"></div>
      </div>

      <!-- Fill Bar -->
      <div class="absolute top-0 left-0 h-full bg-gradient-to-r ${gradientClass} transition-all duration-700 ease-out z-10 relative" style="width: ${pct}%">
        <div class="absolute top-0 w-full h-[1px] bg-white/30"></div> <!-- Highlight -->
      </div>

      <!-- Text -->
      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-black tracking-wider z-20 ${textClass}">${pct}%</span>
    </div>
  `
}

/**
 * Render AI Report Section for movement card
 */
function renderAIReportSection(movement) {
  const reports = movement.aiReports || {};
  const exitCondition = reports.exitCondition;
  const returnCondition = reports.returnCondition;
  const comparison = reports.comparison;

  // Determine overall status
  const hasNewDamage = comparison && comparison.totalNewDamages > 0;
  const exitIssues = exitCondition?.totalIssues || 0;
  const returnIssues = returnCondition?.totalIssues || 0;

  const severityBg = hasNewDamage
    ? (comparison.overallSeverity === 'major' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200')
    : 'bg-blue-50 border-blue-200';

  const severityIcon = hasNewDamage
    ? '<i class="fas fa-exclamation-triangle text-red-500"></i>'
    : '<i class="fas fa-shield-check text-emerald-500"></i>';

  return `
    <div class="px-6 py-4 ${severityBg} border-t">
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-bold text-slate-700 flex items-center gap-2">
          <i class="fas fa-robot text-blue-500"></i>
          تقرير الذكاء الاصطناعي
        </h4>
        <button 
          onclick="window.showFullAIReport('${movement.id}')"
          class="text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-slate-600 font-bold"
        >
          <i class="fas fa-expand-alt ml-1"></i> عرض التفاصيل
        </button>
      </div>
      
      <div class="grid grid-cols-3 gap-3 text-sm">
        <div class="bg-white p-3 rounded-xl border border-orange-100 shadow-sm text-center">
          <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">بيان الخروج</div>
          <div class="font-bold ${exitIssues > 0 ? 'text-amber-600' : 'text-emerald-600'}">${exitIssues} ملاحظات</div>
        </div>
        <div class="bg-white p-3 rounded-xl border border-emerald-100 shadow-sm text-center">
          <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">بيان العودة</div>
          <div class="font-bold ${returnIssues > 0 ? 'text-amber-600' : 'text-emerald-600'}">${returnIssues} ملاحظات</div>
        </div>
        <div class="bg-white p-3 rounded-xl border ${hasNewDamage ? 'border-red-200' : 'border-emerald-100'} shadow-sm text-center">
          <div class="text-[10px] uppercase font-bold text-slate-400 mb-1">أضرار جديدة</div>
          <div class="font-bold flex items-center justify-center gap-1 ${hasNewDamage ? 'text-red-600' : 'text-emerald-600'}">
            ${severityIcon}
            ${hasNewDamage ? comparison.totalNewDamages : 0}
          </div>
        </div>
      </div>
      
      ${hasNewDamage ? `
        <div class="mt-3 p-3 bg-red-100 rounded-xl border border-red-200 text-red-800 text-sm">
          <strong>⚠️ تنبيه:</strong> تم اكتشاف ${comparison.totalNewDamages} ضرر جديد
          ${comparison.overallSeverity === 'major' ? '(درجة الخطورة: كبير)' : '(درجة الخطورة: بسيط)'}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Show full AI report modal - Called from onclick
 */
window.showFullAIReport = function (movementId) {
  const { movements } = movementsStore.getState();
  const movement = movements.find(m => String(m.id) === String(movementId));

  if (!movement || !movement.aiReports) {
    Toast.warning('لا يوجد تقرير AI متاح');
    return;
  }

  const reports = movement.aiReports;
  const exitCondition = reports.exitCondition;
  const returnCondition = reports.returnCondition;
  const comparison = reports.comparison;

  const modal = document.createElement('div');
  modal.id = 'fullAIReportModal';
  modal.className = 'fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in';

  modal.innerHTML = `
    <div class="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex-shrink-0">
        <h3 class="text-xl font-bold flex items-center gap-3">
          <i class="fas fa-robot"></i>
          تقرير الذكاء الاصطناعي الكامل
        </h3>
        <p class="text-sm opacity-80 mt-1">حركة رقم: ${movementId}</p>
      </div>
      
      <div class="p-6 overflow-y-auto flex-1 space-y-6">
        <!-- Exit Condition -->
        ${exitCondition ? `
          <div class="border border-orange-200 rounded-xl overflow-hidden">
            <div class="bg-orange-50 px-4 py-3 border-b border-orange-200">
              <h4 class="font-bold text-orange-800 flex items-center gap-2">
                <i class="fas fa-sign-out-alt"></i> بيان حالة الخروج
              </h4>
              <p class="text-xs text-slate-500 mt-1">الحالة العامة: ${exitCondition.overallCondition || 'غير محدد'}</p>
            </div>
            <div class="p-4 space-y-2">
              ${(exitCondition.findings || []).map(f => `
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div class="font-bold text-sm text-slate-700">${f.position}</div>
                  ${f.issues && f.issues.length > 0
      ? `<ul class="text-sm text-slate-600 mt-1 list-disc list-inside">${f.issues.map(i => `<li>${i}</li>`).join('')}</ul>`
      : '<div class="text-sm text-emerald-600">✓ لا توجد ملاحظات</div>'
    }
                </div>
              `).join('')}
              <div class="mt-3 p-3 bg-orange-50 rounded-lg text-sm text-orange-800">
                <strong>الملخص:</strong> ${exitCondition.summary || 'لا يوجد ملخص'}
              </div>
            </div>
          </div>
        ` : '<div class="p-4 bg-slate-50 rounded-xl text-slate-500 text-center">لم يتم تحليل حالة الخروج</div>'}

        <!-- Return Condition -->
        ${returnCondition ? `
          <div class="border border-emerald-200 rounded-xl overflow-hidden">
            <div class="bg-emerald-50 px-4 py-3 border-b border-emerald-200">
              <h4 class="font-bold text-emerald-800 flex items-center gap-2">
                <i class="fas fa-sign-in-alt"></i> بيان حالة العودة
              </h4>
              <p class="text-xs text-slate-500 mt-1">الحالة العامة: ${returnCondition.overallCondition || 'غير محدد'}</p>
            </div>
            <div class="p-4 space-y-2">
              ${(returnCondition.findings || []).map(f => `
                <div class="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div class="font-bold text-sm text-slate-700">${f.position}</div>
                  ${f.issues && f.issues.length > 0
        ? `<ul class="text-sm text-slate-600 mt-1 list-disc list-inside">${f.issues.map(i => `<li>${i}</li>`).join('')}</ul>`
        : '<div class="text-sm text-emerald-600">✓ لا توجد ملاحظات</div>'
      }
                </div>
              `).join('')}
              <div class="mt-3 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800">
                <strong>الملخص:</strong> ${returnCondition.summary || 'لا يوجد ملخص'}
              </div>
            </div>
          </div>
        ` : '<div class="p-4 bg-slate-50 rounded-xl text-slate-500 text-center">لم يتم تحليل حالة العودة</div>'}

        <!-- Comparison -->
        ${comparison ? `
          <div class="border ${comparison.totalNewDamages > 0 ? 'border-red-200' : 'border-blue-200'} rounded-xl overflow-hidden">
            <div class="${comparison.totalNewDamages > 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'} px-4 py-3 border-b">
              <h4 class="font-bold ${comparison.totalNewDamages > 0 ? 'text-red-800' : 'text-blue-800'} flex items-center gap-2">
                <i class="fas fa-balance-scale"></i> تقرير المقارنة
              </h4>
            </div>
            <div class="p-4">
              ${comparison.totalNewDamages > 0 ? `
                <div class="space-y-2">
                  ${(comparison.newDamages || []).map(d => `
                    <div class="p-3 ${d.severity === 'major' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'} rounded-lg border">
                      <div class="font-bold text-sm">${d.position}</div>
                      <div class="text-sm mt-1">${d.description}</div>
                      <div class="text-xs mt-2 opacity-70">الشدة: ${d.severity === 'major' ? 'كبير ⚠️' : 'بسيط'}</div>
                    </div>
                  `).join('')}
                </div>
              ` : `
                <div class="text-center p-6">
                  <i class="fas fa-check-circle text-5xl text-emerald-500 mb-3"></i>
                  <div class="font-bold text-emerald-700 text-lg">لا توجد أضرار جديدة</div>
                  <p class="text-slate-500 text-sm mt-1">السيارة عادت بنفس الحالة</p>
                </div>
              `}
            </div>
          </div>
        ` : '<div class="p-4 bg-slate-50 rounded-xl text-slate-500 text-center">لم يتم إجراء المقارنة</div>'}
      </div>

      <div class="p-4 border-t border-slate-100 flex-shrink-0">
        <button onclick="document.getElementById('fullAIReportModal').remove()" 
                class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition">
          إغلاق التقرير
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
};

function handleClearLogs() {
  const { role } = authStore.getState()
  if (role !== 'admin') {
    Toast.error('هذه الميزة متاحة للمدير فقط')
    return
  }

  if (confirm('هل أنت متأكد من مسح جميع السجلات المكتملة؟')) {
    movementsActions.clearCompleted()
    Toast.info('تم مسح جميع السجلات المكتملة')
  }
}

function renderPhotoGallery(photos, color) {
  if (!photos || photos.length === 0) return ''

  const borderColor = color === 'orange' ? 'border-orange-100' : 'border-emerald-100'
  const bgColor = color === 'orange' ? 'bg-orange-50' : 'bg-emerald-50'

  return `
    <div class="mt-4 pt-3 border-t ${borderColor}">
      <span class="text-[10px] uppercase font-bold text-slate-400 block mb-2 font-arabic">الصور المرفقة</span>
      <div class="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        ${photos.map((photo, i) => {
    // If it's an object with .data, use .data. If it's a string, it's the path/base64 directly.
    const src = typeof photo === 'string' ? photo : (photo.data || photo)

    // Use Capacitor's convertFileSrc if it's a path, or just return if it's base64
    // We can't await here, so we hope Capacitor.convertFileSrc is enough or it's base64.
    // Let's use a helper that doesn't need await if possible.
    let displaySrc = src
    if (src && !src.startsWith('data:image') && window.Capacitor && window.Capacitor.convertFileSrc) {
      displaySrc = window.Capacitor.convertFileSrc(src)
    }

    return `
            <div class="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-white cursor-pointer hover:scale-105 transition-transform" 
                 onclick="window.openImageModal('${displaySrc}')">
              <img src="${displaySrc}" class="w-full h-full object-cover" alt="Image ${i + 1}" loading="lazy">
            </div>
          `
  }).join('')}
      </div>
    </div>
  `
}

// Global helper for image preview with PINCH-TO-ZOOM
window.openImageModal = (src) => {
  const modal = document.createElement('div')
  modal.id = 'imageZoomModal'
  modal.className = 'fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in'

  modal.innerHTML = `
    <div class="relative w-full h-full flex items-center justify-center group">
      <!-- Close Button -->
      <div class="absolute top-6 right-6 z-[110] flex gap-3">
        <button id="closeZoomModal" class="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all border border-white/20 shadow-2xl">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Zoomable Image Container -->
      <div id="zoomContainer" class="w-full h-full overflow-hidden flex items-center justify-center touch-none">
        <img src="${src}" 
             id="zoomedImage"
             class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-100 origin-center"
             draggable="false"
             alt="Zoomed view">
      </div>

      <!-- Hint -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tracking-widest uppercase pointer-events-none">
        تكبير وتصغير بإصبعين
      </div>
    </div>
  `

  document.body.appendChild(modal)

  // Setup pinch-to-zoom
  const img = document.getElementById('zoomedImage')
  const container = document.getElementById('zoomContainer')
  let scale = 1
  let lastDist = 0

  const getDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    )
  }

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      lastDist = getDistance(e.touches)
    }
  }, { passive: false })

  container.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = getDistance(e.touches)
      const delta = dist / lastDist
      scale = Math.max(1, Math.min(scale * delta, 5)) // Clamp between 1x and 5x
      img.style.transform = `scale(${scale})`
      lastDist = dist
    }
  }, { passive: false })

  container.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
      lastDist = 0
      // Snap back to 1x if nearly there
      if (scale < 1.1) {
        scale = 1
        img.style.transform = 'scale(1)'
      }
    }
  })

  // Double-tap to reset
  let lastTap = 0
  container.addEventListener('click', (e) => {
    const now = Date.now()
    if (now - lastTap < 300) {
      scale = scale > 1 ? 1 : 2.5
      img.style.transform = `scale(${scale})`
    }
    lastTap = now
  })

  // Close button
  document.getElementById('closeZoomModal').addEventListener('click', () => modal.remove())

  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove()
  })
}

async function handleSyncSingleFtp(movement, btn) {
  const originalHtml = btn.innerHTML;
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    await FirestoreService.saveMovement(movement);
    Toast.success('تمت المزامنة مع Firebase بنجاح');
    btn.innerHTML = '<i class="fas fa-check"></i>';
  } catch (error) {
    Toast.error('فشل المزامنة: ' + error.message);
    btn.innerHTML = originalHtml;
  } finally {
    btn.disabled = false;
  }
}

async function handleSyncAllFtp() {
  const { movements } = movementsStore.getState();

  if (confirm(`هل تريد مزامنة ${movements.length} حركة مع Firebase؟`)) {
    Toast.info('جاري بدء المزامنة الشاملة...');
    let successCount = 0;

    for (const m of movements) {
      try {
        await FirestoreService.saveMovement(m);
        successCount++;
      } catch (e) {
        console.error('Failed sync for', m.id, e);
      }
    }

    Toast.success(`اكتملت المزامنة. تم بنجاح: ${successCount} من ${movements.length}`);
  }
}
