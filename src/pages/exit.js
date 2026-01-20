import { aiService } from '../utils/aiService'
import { carsStore, carsActions } from '../store/carsStore'
import { movementsActions } from '../store/movementsStore'
import { uiActions } from '../store/uiStore'
import { PhotoCapture } from '../components/PhotoCapture'
import { Toast } from '../components/Toast'
import { NotificationService } from '../utils/notificationService'

export function renderExitRegistration(container) {
  // ... (rest of the HTML remains the same)
  container.innerHTML = `
    <div class="max-w-5xl mx-auto animate-fade-in">
      <div class="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
        <div class="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white flex justify-between items-center">
          <h3 class="text-2xl font-bold flex items-center gap-3">
            <i class="fas fa-sign-out-alt text-orange-200"></i> تسجيل حركة خروج
          </h3>
        </div>
        <div class="p-6 md:p-8">
          <form id="exitForm" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">السيارة المغادرة</label>
                <select id="exitCarSelect" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer">
                  <option value="">-- اختر السيارة المتواجدة بالداخل --</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">رقم العقد</label>
                <input type="text" id="exitDriver" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none" placeholder="ادخل رقم العقد">
              </div>
            </div>

            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-tachometer-alt text-orange-500"></i> القراءات
              </h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-2">الكيلومترات (KM)</label>
                  <input type="number" id="exitMileage" required min="0" class="w-full p-3 bg-white border border-slate-200 rounded-xl focus:border-orange-500 outline-none font-mono text-lg" placeholder="000000">
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-500 mb-2">مستوى الوقود (%)</label>
                  <input type="range" id="exitFuel" min="0" max="100" step="1" value="100" class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500">
                  <div class="text-center mt-2"><span id="exitFuelDisplay" class="text-sm font-bold text-orange-600">100%</span></div>
                </div>
              </div>
            </div>

            <!-- Photo Capture Section -->
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-camera text-orange-500"></i> صور توثيقية
              </h4>
              <div id="exitPhotosContainer"></div>
              <p class="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <i class="fas fa-info-circle"></i>
                التقط صور توثيقية للعداد ومستوى الوقود
              </p>
            </div>

            <button type="submit" class="w-full bg-gradient-to-l from-orange-600 to-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-700 hover:to-orange-600 transition shadow-xl shadow-orange-500/20 flex justify-center items-center gap-3 transform hover:-translate-y-0.5">
              <i class="fas fa-check-circle text-xl"></i>
              تأكيد تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </div>
  `

  // Populate car select
  populateExitCarSelect()

  // Initialize photo capture
  window.exitPhotoCapture = new PhotoCapture({
    containerId: 'exitPhotosContainer',
    label: 'صور الخروج (7 صور)',
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
      console.log('Exit photos:', photos.length)
    },
    onScan: async (photo, index) => {
      try {
        Toast.info('جاري تحليل الصورة بالذكاء الاصطناعي...', 2000);

        // Try Odometer first as it's the most common need in this form
        const odoResult = await aiService.scanOdometer(photo.data);
        if (odoResult && odoResult.reading) {
          const mileageInput = document.getElementById('exitMileage');
          if (mileageInput && (!mileageInput.value || confirm(`هل تريد اعتماد قراءة العداد المستخرجة: ${odoResult.reading}؟`))) {
            mileageInput.value = odoResult.reading;
            Toast.success('تم استخراج قراءة العداد بنجاح');
            return;
          }
        }

        // If no odometer found, try plate
        const plateResult = await aiService.scanPlate(photo.data);
        if (plateResult && plateResult.plate) {
          const select = document.getElementById('exitCarSelect');
          const options = Array.from(select.options);
          const matchingOption = options.find(opt => opt.text.includes(plateResult.plate));

          if (matchingOption) {
            if (confirm(`تم التعرف على اللوحة: ${plateResult.plate}. هل هي السيارة المطلوبة؟`)) {
              select.value = matchingOption.value;
              Toast.success('تم اختيار السيارة تلقائياً');
              return;
            }
          }
        }

        Toast.warning('لم نتمكن من استخراج بيانات واضحة من هذه الصورة');
      } catch (error) {
        Toast.error('فشل في تحليل الصورة: ' + error.message);
      }
    },
    onDamageScan: async (photo, index) => {
      try {
        Toast.info('جاري فحص جسم السيارة بحثاً عن أضرار...', 3000);
        const result = await aiService.analyzeDamage(photo.data);

        if (result.hasDamage) {
          if (confirm(`⚠️ تحذير: تم رصد أضرار محتملة (${result.summary}). هل تريد تسجيل ملاحظة بذلك؟`)) {
            // Logic to add note or highlight the car part
            Toast.success('تم تسجيل تنبيه بوجود ضرر');
          }
        } else {
          Toast.success('✅ الفحص السريع: لم يتم رصد أضرار واضحة');
        }
      } catch (error) {
        Toast.error('فشل في فحص الأضرار: ' + error.message);
      }
    }
  })

  const photosContainer = document.getElementById('exitPhotosContainer')
  if (photosContainer) {
    window.exitPhotoCapture.render(photosContainer)
  }

  // Setup fuel slider
  const fuelInput = document.getElementById('exitFuel')
  const fuelDisplay = document.getElementById('exitFuelDisplay')
  fuelInput.addEventListener('input', (e) => {
    fuelDisplay.textContent = e.target.value + '%'
  })

  // Handle form submission
  const form = document.getElementById('exitForm')
  form.addEventListener('submit', handleExitSubmit)

  // Subscribe to car changes
  // Subscribe to car changes
  const unsubCars = carsStore.subscribe(populateExitCarSelect)

  return () => {
    unsubCars()
    if (window.exitPhotoCapture) window.exitPhotoCapture.clear()
    const form = document.getElementById('exitForm')
    if (form) form.removeEventListener('submit', handleExitSubmit)
  }
}

function populateExitCarSelect() {
  const select = document.getElementById('exitCarSelect')
  if (!select) return

  const { cars } = carsStore.getState()
  const availableCars = cars.filter(c => c.status === 'in')

  const currentValue = select.value

  select.innerHTML = '<option value="">-- اختر السيارة المتواجدة بالداخل --</option>'

  availableCars.forEach(car => {
    const option = document.createElement('option')
    option.value = car.id
    option.textContent = `${car.model} - ${car.plate}`
    select.appendChild(option)
  })

  // Restore selection if possible
  if (currentValue) {
    select.value = currentValue
  }

  if (availableCars.length === 0) {
    select.innerHTML = '<option value="">لا توجد سيارات متواجدة بالداخل</option>'
    select.disabled = true
  } else {
    select.disabled = false
  }
}

async function handleExitSubmit(e) {
  e.preventDefault()

  const carId = parseInt(document.getElementById('exitCarSelect').value)
  const driver = document.getElementById('exitDriver').value.trim()
  const mileage = parseInt(document.getElementById('exitMileage').value)
  const fuel = parseInt(document.getElementById('exitFuel').value)

  // Validation
  if (!carId) {
    Toast.warning('الرجاء اختيار سيارة')
    return
  }

  if (!driver) {
    Toast.warning('الرجاء إدخال رقم العقد')
    return
  }

  if (isNaN(mileage) || mileage < 0) {
    Toast.warning('الرجاء إدخال قراءة عداد صحيحة')
    return
  }

  // Get photos
  const photos = window.exitPhotoCapture ? window.exitPhotoCapture.getPhotos() : []
  const capturedCount = window.exitPhotoCapture ? window.exitPhotoCapture.getCapturedCount() : 0
  const totalSlots = window.exitPhotoCapture ? window.exitPhotoCapture.slots.length : 0

  if (capturedCount < totalSlots) {
    if (!confirm(`⚠️ تنبيه: تم التقاط ${capturedCount} من أصل ${totalSlots} صور فقط. هل تريد المتابعة وحفظ البيانات بدون باقي الصور؟`)) {
      return;
    }
  }

  // Show loading state if needed, or just toast

  try {
    // Register exit movement
    const movement = await movementsActions.registerExit({
      carId,
      driver,
      exitMileage: mileage,
      exitFuel: fuel,
      exitPhotos: photos
    })

    // Update car status to 'out'
    carsActions.updateCar(carId, { status: 'out' })

    // Show success message
    Toast.success(`تم تسجيل خروج السيارة بنجاح! رقم الحركة: ${movement.id}`)

    // Send System Notification
    const car = carsStore.getState().cars.find(c => c.id === carId);
    NotificationService.send('تم خروج سيارة', `السيارة ${car?.model} مغادرة الآن مع ${driver}`);

    // Reset form
    e.target.reset()
    document.getElementById('exitFuelDisplay').textContent = '100%'

    // Clear photos
    if (window.exitPhotoCapture) {
      window.exitPhotoCapture.clear()
      const photosContainer = document.getElementById('exitPhotosContainer')
      if (photosContainer) {
        window.exitPhotoCapture.render(photosContainer)
      }
    }

    // Navigate to logs
    uiActions.setActiveSection('logs')
  } catch (error) {
    console.error('Save Error:', error);
    Toast.error('حدث خطأ أثناء حفظ البيانات: ' + (error.message || 'خطأ غير معروف'));
  }
}
