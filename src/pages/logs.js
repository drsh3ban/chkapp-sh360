import { carsStore } from '../store/carsStore'
import { movementsStore, movementsActions } from '../store/movementsStore'
import { FTPService } from '../services/ftpStorage'
import { formatDateTime, formatTime, calculateDistance } from '../utils/helpers'
import { authStore } from '../store/authStore'
import { Toast } from '../components/Toast'
import { generateMovementReport } from '../utils/pdfGenerator'
import { ImageStorageService } from '../services/imageStorage'

export function renderLogs(container) {
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <div class="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100 gap-4">
        <h3 class="text-xl font-bold flex items-center gap-2 text-slate-800">
          <i class="fas fa-history text-primary-500"></i>
          سجل الحركات الشامل
        </h3>
        <div class="flex flex-wrap gap-3 w-full md:w-auto">
          <div class="relative flex-1 md:w-48">
            <i class="fas fa-search absolute right-3 top-3 text-slate-400"></i>
            <input type="text" id="searchLogs" placeholder="رقم اللوحة، الموديل، العقد..." 
              class="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm">
          </div>
          <div class="relative w-full md:w-40">
            <i class="fas fa-calendar-alt absolute right-3 top-3 text-slate-400"></i>
            <input type="date" id="searchDate" 
              class="w-full p-2.5 pr-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm">
          </div>
          <select id="filterType" class="p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition bg-slate-50 text-sm font-medium">
            <option value="all">الكل</option>
            <option value="completed">مكتملة</option>
            <option value="active">في الخارج</option>
          </select>
          <div class="role-admin">
            <button id="clearLogsBtn" class="bg-red-50 text-red-600 px-4 py-2.5 rounded-xl hover:bg-red-100 text-sm font-bold border border-red-100 transition flex items-center gap-2">
              <i class="fas fa-trash-alt"></i> مسح المكتمل
            </button>
          </div>
          <button id="syncAllFtpBtn" class="bg-primary-50 text-primary-600 px-4 py-2.5 rounded-xl hover:bg-primary-100 text-sm font-bold border border-primary-100 transition flex items-center gap-2">
            <i class="fas fa-sync"></i> مزامنة الكل
          </button>
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

  // Setup clear button
  const clearBtn = document.getElementById('clearLogsBtn')
  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearLogs)
  }

  // Setup FTP Sync All
  document.getElementById('syncAllFtpBtn')?.addEventListener('click', handleSyncAllFtp)

  // Subscribe to changes
  movementsStore.subscribe(renderMovementLogs)
  carsStore.subscribe(renderMovementLogs)
}

function renderMovementLogs() {
  const container = document.getElementById('logsContainer')
  if (!container) return

  const { movements } = movementsStore.getState()
  const { cars } = carsStore.getState()
  const searchTerm = document.getElementById('searchLogs')?.value.toLowerCase() || ''
  const searchDate = document.getElementById('searchDate')?.value || ''
  const filterType = document.getElementById('filterType')?.value || 'all'

  // Filter and sort movements
  let filteredMovements = movements

  // Type Filter
  if (filterType !== 'all') {
    filteredMovements = filteredMovements.filter(m =>
      filterType === 'completed' ? m.status === 'completed' : m.status !== 'completed'
    )
  }

  // Search Filter
  if (searchTerm) {
    filteredMovements = filteredMovements.filter(m => {
      const car = cars.find(c => c.id === m.carId)
      return (
        (car && car.plate.toLowerCase().includes(searchTerm)) ||
        (car && car.model.toLowerCase().includes(searchTerm)) ||
        (m.driver && m.driver.toLowerCase().includes(searchTerm)) ||
        (m.id.toString().includes(searchTerm))
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
      const id = parseInt(btn.dataset.movementId)
      const movement = movements.find(m => m.id === id)
      const car = cars.find(c => c.id === movement.carId)
      if (movement && car) {
        Toast.info('جاري تحضير تقرير PDF...')
        generateMovementReport(movement, car)
      }
    })
  })

  // Attach FTP Sync listeners
  container.querySelectorAll('.sync-ftp-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt(btn.dataset.movementId)
      const movement = movements.find(m => m.id === id)
      if (movement) {
        await handleSyncSingleFtp(movement, btn)
      }
    })
  })
}

function renderMovementCard(movement, cars, index) {
  const car = cars.find(c => c.id === movement.carId)
  const carName = car ? `${car.model} (${car.plate})` : 'مركبة محذوفة'
  const isCompleted = movement.status === 'completed'
  const distance = isCompleted ? calculateDistance(movement.exitMileage, movement.returnMileage) : 0

  return `
    <div class="bg-white rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
      <div class="flex justify-between items-center px-6 py-4 ${isCompleted ? 'bg-slate-800' : 'bg-gradient-to-r from-primary-600 to-primary-500'} text-white">
        <div class="font-bold flex items-center gap-3 text-lg">
          <span class="bg-white/20 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs border border-white/20 group-hover:scale-110 transition-transform">
            ${index}
          </span>
          <div class="bg-white/10 p-2 rounded-xl backdrop-blur-md hidden sm:block"><i class="fas fa-car-side text-sm"></i></div>
          <span class="truncate">${carName}</span>
        </div>
        <div class="flex items-center gap-3">
            <div class="flex items-center -space-x-2 space-x-reverse">
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
    </div>
  `
}

function renderFuelBar(val, color) {
  const pct = parseInt(val) || 0
  const bgClass = color === 'orange' ? 'bg-orange-500' : 'bg-emerald-500'
  const textClass = pct > 50 ? 'text-white' : 'text-slate-600'

  return `
    <div class="w-full h-4 bg-slate-100 rounded-lg overflow-hidden flex items-center relative border border-slate-200">
      <div class="${bgClass} h-full transition-all duration-500" style="width: ${pct}%"></div>
      <span class="absolute inset-0 flex items-center justify-center text-[10px] font-bold ${textClass}">${pct}%</span>
    </div>
  `
}

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

// Global helper for image preview (enhanced version with zoom support)
window.openImageModal = (src) => {
  const modal = document.createElement('div')
  modal.id = 'imageZoomModal'
  modal.className = 'fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in touch-none'

  modal.innerHTML = `
    <div class="relative w-full h-full flex items-center justify-center group">
      <!-- Controls -->
      <div class="absolute top-6 right-6 z-[110] flex gap-3">
        <button class="bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full backdrop-blur-xl flex items-center justify-center transition-all border border-white/20 shadow-2xl" 
                onclick="document.getElementById('imageZoomModal').remove()">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Image Container (Scrollable for zoom feel) -->
      <div class="w-full h-full overflow-auto flex items-center justify-center custom-scrollbar p-8">
        <img src="${src}" 
             id="zoomedImage"
             class="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-300 cursor-zoom-in"
             onclick="this.classList.toggle('max-w-none'); this.classList.toggle('max-h-none'); this.classList.toggle('cursor-zoom-out'); this.classList.toggle('cursor-zoom-in')"
             alt="Zoomed view">
      </div>

      <!-- Hint -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium tracking-widest uppercase pointer-events-none">
        Tap image to toggle full size
      </div>
    </div>
  `

  // Close on backdrop click (if not clicking the image)
  modal.onclick = (e) => {
    if (e.target === modal || e.target.id === 'imageZoomModal' || e.target.classList.contains('overflow-auto')) {
      modal.remove()
    }
  }

  document.body.appendChild(modal)
}

async function handleSyncSingleFtp(movement, btn) {
  const originalHtml = btn.innerHTML;
  try {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    btn.disabled = true;
    await FTPService.syncMovement(movement);
    Toast.success('تمت المزامنة مع FTP بنجاح');
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
  const config = FTPService.getConfig();

  if (!config.enabled) {
    Toast.warning('يجب تفعيل FTP من الإعدادات أولاً');
    return;
  }

  if (confirm(`هل تريد مزامنة ${movements.length} حركة مع FTP؟`)) {
    Toast.info('جاري بدء المزامنة الشاملة...');
    let successCount = 0;

    for (const m of movements) {
      try {
        await FTPService.syncMovement(m);
        successCount++;
      } catch (e) {
        console.error('Failed sync for', m.id, e);
      }
    }

    Toast.success(`اكتملت المزامنة. تم بنجاح: ${successCount} من ${movements.length}`);
  }
}
