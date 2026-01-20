import { aiService } from '../utils/aiService'
import { carsStore, carsActions } from '../store/carsStore'
import { movementsStore, movementsActions } from '../store/movementsStore'
import { uiActions } from '../store/uiStore'
import { formatDateTime, calculateDistance } from '../utils/helpers'
import { PhotoCapture } from '../components/PhotoCapture'
import { Toast } from '../components/Toast'
import { NotificationService } from '../utils/notificationService'

export function renderEntryRegistration(container) {
  // ... rest of the code
  container.innerHTML = `
    <div class="max-w-5xl mx-auto animate-fade-in">
      <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div class="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white flex justify-between items-center">
          <h3 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-sign-in-alt text-emerald-200"></i> تسجيل حركة عودة
          </h3>
        </div>
        <div class="p-6 md:p-8">
          <form id="entryForm" class="space-y-8">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">السيارة العائدة</label>
              <select id="entryCarSelect" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                <option value="">-- اختر السيارة المتواجدة بالخارج --</option>
              </select>
            </div>
            
            <div id="exitInfoCard" class="hidden bg-blue-50/50 p-4 rounded-2xl text-sm text-blue-800 border border-blue-100 space-y-2"></div>

            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-tachometer-alt text-emerald-500"></i> بيانات العودة
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-2">الكيلومترات (KM)</label>
                  <input type="number" id="entryMileage" required min="0" class="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-mono text-lg" placeholder="000000">
                  <p id="distanceInfo" class="text-xs text-slate-500 mt-1 hidden"></p>
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-2">مستوى الوقود (%)</label>
                  <input type="range" id="entryFuel" min="0" max="100" step="1" value="100" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                  <div class="text-center mt-2"><span id="entryFuelDisplay" class="text-sm font-bold text-emerald-600">100%</span></div>
                </div>
              </div>
            </div>

            <!-- Photo Capture Section -->
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-camera text-emerald-500"></i> صور توثيقية للعودة
              </h4>
              <div id="entryPhotosContainer"></div>
              <p class="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <i class="fas fa-info-circle"></i>
                التقط صور توثيقية للعداد ومستوى الوقود والحالة العامة
              </p>
            </div>

            <button type="submit" class="w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-600 transition shadow-xl shadow-emerald-500/20 flex justify-center items-center gap-3 transform hover:-translate-y-0.5">
              <i class="fas fa-check-double text-xl"></i>
              إغلاق الحركة وتسجيل العودة
            </button>
          </form>
        </div>
      </div>
    </div>
  `

  // Populate car select
  populateEntryCarSelect()

  // Initialize photo capture
  window.entryPhotoCapture = new PhotoCapture({
    containerId: 'entryPhotosContainer',
    label: 'صور العودة (7 صور)',
    slots: [
      { id: 'front', label: 'الأمامية' },
      { id: 'back', label: 'الخلفية' },
      { id: 'right1', label: 'الجانب الأيمن (1)' },
      { id: 'right2', label: 'الجانب الأيمن (2)' },
      { id: 'left1', label: 'الجانب الأيسر (1)' },
      { id: 'left2', label: 'الجانب الأيسر (2)' },
      { id: 'interior', label: 'الداخلية' }
    ],
    sequentialMode: true,
    onPhotoTaken: (photos) => {
      console.log('Entry photos:', photos.length)
    },
    onScan: async (photo, index) => {
      try {
        Toast.info('جاري تحليل الصورة بالذكاء الاصطناعي...', 2000);

        // Try Odometer reading
        const odoResult = await aiService.scanOdometer(photo.data);
        if (odoResult && odoResult.reading) {
          const mileageInput = document.getElementById('entryMileage');
          if (mileageInput && (!mileageInput.value || confirm(`هل تريد اعتماد قراءة العداد المستخرجة: ${odoResult.reading}؟`))) {
            mileageInput.value = odoResult.reading;
            // Trigger distance calculation manually
            const event = new Event('input', { bubbles: true });
            mileageInput.dispatchEvent(event);
            Toast.success('تم استخراج قراءة العداد بنجاح');
            return;
          }
        }

        // We don't usually need plate scan on entry because the car is already selected,
        // but we could use it for verification.
        const plateResult = await aiService.scanPlate(photo.data);
        if (plateResult && plateResult.plate) {
          Toast.info(`اللوحة التي تم رصدها: ${plateResult.plate}`);
        } else {
          Toast.warning('لم نتمكن من استخراج بيانات واضحة من هذه الصورة');
        }
      } catch (error) {
        Toast.error('فشل في تحليل الصورة: ' + error.message);
      }
    },
    onDamageScan: async (photo, index) => {
      try {
        Toast.info('جاري فحص جسم السيارة عند العودة...', 3000);
        const result = await aiService.analyzeDamage(photo.data);

        if (result.hasDamage) {
          Toast.warning(`⚠️ تنبيه: تم رصد ضرر جديد محتمل: ${result.summary}`);
        } else {
          Toast.success('✅ الفحص البصري سليم: لا توجد أضرار جديدة واضحة');
        }
      } catch (error) {
        Toast.error('فشل في فحص الأضرار: ' + error.message);
      }
    }
  })

  const photosContainer = document.getElementById('entryPhotosContainer')
  if (photosContainer) {
    window.entryPhotoCapture.render(photosContainer)
  }

  // Setup fuel slider
  const fuelInput = document.getElementById('entryFuel')
  const fuelDisplay = document.getElementById('entryFuelDisplay')
  fuelInput.addEventListener('input', (e) => {
    fuelDisplay.textContent = e.target.value + '%'
  })

  // Handle car selection change
  document.getElementById('entryCarSelect').addEventListener('change', handleCarSelection)

  // Handle mileage input to show distance
  document.getElementById('entryMileage').addEventListener('input', calculateTraveledDistance)

  // Handle form submission
  document.getElementById('entryForm').addEventListener('submit', handleEntrySubmit)

  // Subscribe to changes
  const unsubCars = carsStore.subscribe(populateEntryCarSelect)
  const unsubMovements = movementsStore.subscribe(populateEntryCarSelect)

  // Cleanup
  return () => {
    unsubCars()
    unsubMovements()
    // Other cleanups if needed
    if (window.entryPhotoCapture) {
      window.entryPhotoCapture.clear() // Optional: clear memory
    }
    const form = document.getElementById('entryForm')
    if (form) form.removeEventListener('submit', handleEntrySubmit)
  }
}

function populateEntryCarSelect() {
  const select = document.getElementById('entryCarSelect')
  if (!select) return

  const { cars } = carsStore.getState()
  const { movements } = movementsStore.getState()

  // Get cars that are out with active movements
  const activeCars = movements
    .filter(m => m.status === 'active')
    .map(m => m.carId)

  const carsOut = cars.filter(c => activeCars.includes(c.id))

  const currentValue = select.value

  select.innerHTML = '<option value="">-- اختر السيارة المتواجدة بالخارج --</option>'

  carsOut.forEach(car => {
    const option = document.createElement('option')
    option.value = car.id
    option.textContent = `${car.model} - ${car.plate}`
    select.appendChild(option)
  })

  if (currentValue) {
    select.value = currentValue
  }

  if (carsOut.length === 0) {
    select.innerHTML = '<option value="">لا توجد سيارات بالخارج</option>'
    select.disabled = true
  } else {
    select.disabled = false
  }
}

function handleCarSelection() {
  const carId = parseInt(document.getElementById('entryCarSelect').value)
  const infoCard = document.getElementById('exitInfoCard')

  if (!carId) {
    infoCard.classList.add('hidden')
    return
  }

  const { movements } = movementsStore.getState()
  const movement = movements.find(m => m.carId === carId && m.status === 'active')

  if (movement) {
    infoCard.innerHTML = `
      <div class="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <span class="text-xs text-blue-400 font-bold uppercase block">رقم العقد</span>
          <span class="font-bold text-lg">${movement.driver}</span>
        </div>
        <div>
          <span class="text-xs text-blue-400 font-bold uppercase block">وقت الخروج</span>
          <span class="font-mono text-xs font-bold">${formatDateTime(movement.exitTime)}</span>
        </div>
        <div>
          <span class="text-xs text-blue-400 font-bold uppercase block">عداد الخروج</span>
          <span class="font-mono font-bold text-lg text-orange-600">${movement.exitMileage} KM</span>
        </div>
        <div>
          <span class="text-xs text-blue-400 font-bold uppercase block">وقود الخروج</span>
          <span class="font-bold">${movement.exitFuel}%</span>
        </div>
      </div>
    `
    infoCard.classList.remove('hidden')

    // Auto-fill fuel to match exit for convenience (can be changed)
    // const fuelInput = document.getElementById('entryFuel')
    // if(fuelInput) fuelInput.value = movement.exitFuel
  } else {
    infoCard.innerHTML = '<div class="text-red-500 font-bold">خطأ: لا توجد بيانات خروج لهذه السيارة</div>';
    infoCard.classList.remove('hidden')
  }
}

function calculateTraveledDistance() {
  const carId = parseInt(document.getElementById('entryCarSelect').value)
  const returnMileage = parseInt(document.getElementById('entryMileage').value)
  const distanceInfo = document.getElementById('distanceInfo')

  if (!carId || !returnMileage) {
    distanceInfo.classList.add('hidden')
    return
  }

  const { movements } = movementsStore.getState()
  const movement = movements.find(m => m.carId === carId && m.status === 'active')

  if (movement) {
    const distance = calculateDistance(movement.exitMileage, returnMileage)

    if (distance < 0) {
      distanceInfo.textContent = '⚠️ قراءة العداد أقل من قراءة الخروج!'
      distanceInfo.classList.remove('text-slate-500')
      distanceInfo.classList.add('text-red-600')
    } else {
      distanceInfo.textContent = `المسافة المقطوعة: ${distance} كم`
      distanceInfo.classList.remove('text-red-600')
      distanceInfo.classList.add('text-slate-500')
    }
    distanceInfo.classList.remove('hidden')
  }
}

async function handleEntrySubmit(e) {
  e.preventDefault()

  const carId = parseInt(document.getElementById('entryCarSelect').value)
  const mileage = parseInt(document.getElementById('entryMileage').value)
  const fuel = parseInt(document.getElementById('entryFuel').value)

  // Validation
  if (!carId) {
    Toast.warning('الرجاء اختيار سيارة')
    return
  }

  if (isNaN(mileage) || mileage < 0) {
    Toast.warning('الرجاء إدخال قراءة عداد صحيحة')
    return
  }

  // Find active movement
  const { movements } = movementsStore.getState()
  const movement = movements.find(m => m.carId === carId && m.status === 'active')

  if (!movement) {
    Toast.error('خطأ: لا توجد حركة خروج نشطة لهذه السيارة')
    return
  }

  // Check mileage
  if (mileage < movement.exitMileage) {
    if (!confirm('تحذير: قراءة العداد أقل من قراءة الخروج. هل تريد المتابعة؟')) {
      return
    }
  }

  // Get photos
  const photos = window.entryPhotoCapture ? window.entryPhotoCapture.getPhotos() : []
  const capturedCount = window.entryPhotoCapture ? window.entryPhotoCapture.getCapturedCount() : 0
  const totalSlots = window.entryPhotoCapture ? window.entryPhotoCapture.slots.length : 0

  if (capturedCount < totalSlots) {
    if (!confirm(`⚠️ تنبيه: تم التقاط ${capturedCount} من أصل ${totalSlots} صور فقط. هل تريد المتابعة وحفظ البيانات بدون باقي الصور؟`)) {
      return;
    }
  }

  try {
    // Register return
    await movementsActions.registerReturn(movement.id, {
      returnMileage: mileage,
      returnFuel: fuel,
      returnPhotos: photos
    })

    // Update car status to 'in'
    carsActions.updateCar(carId, { status: 'in' })

    const distance = calculateDistance(movement.exitMileage, mileage)

    // Show success message
    Toast.success(`تم تسجيل عودة السيارة بنجاح! المسافة: ${distance} كم`)

    // Send System Notification
    const car = carsStore.getState().cars.find(c => c.id === carId);
    NotificationService.send('تم عودة سيارة', `السيارة ${car?.model} عادت الآن. المسافة المقطوعة: ${distance} كم`);

    // Reset form
    e.target.reset()
    document.getElementById('entryFuelDisplay').textContent = '100%'
    document.getElementById('exitInfoCard').classList.add('hidden')
    document.getElementById('distanceInfo').classList.add('hidden')

    // Clear photos
    if (window.entryPhotoCapture) {
      window.entryPhotoCapture.clear()
      const photosContainer = document.getElementById('entryPhotosContainer')
      if (photosContainer) {
        window.entryPhotoCapture.render(photosContainer)
      }
    }

    // Navigate to logs
    uiActions.setActiveSection('logs')

  } catch (error) {
    console.error('Save Error:', error);
    Toast.error('حدث خطأ أثناء حفظ البيانات: ' + (error.message || 'خطأ غير معروف'));
  }
}
