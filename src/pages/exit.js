import { aiService } from '../utils/aiService'
import { normalizePlate, extractPlateNumbers, platesMatch } from '../utils/plateUtils'
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
            <i class="fas fa-sign-out-alt text-orange-200"></i> تشييك الخروج
          </h3>
        </div>
        <div class="p-6 md:p-8">
          <form id="exitForm" class="space-y-8">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-bold text-slate-700">السيارة المغادرة</label>
                  <button type="button" id="scanPlateBtn" class="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-bold hover:bg-orange-100 transition border border-orange-100 flex items-center gap-2">
                    <i class="fas fa-barcode"></i>
                    تصوير اللوحة (AI)
                  </button>
                </div>
                <div class="relative mb-2">
                  <input type="text" id="plateSearchInput" placeholder="ابحث برقم اللوحة (مثال: 1179)" 
                    class="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none text-sm">
                  <i class="fas fa-search absolute right-3 top-3.5 text-slate-400"></i>
                </div>
                <div class="relative">
                  <select id="exitCarSelect" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none appearance-none cursor-pointer">
                    <option value="">-- اختر السيارة المتواجدة بالداخل --</option>
                  </select>
                  <i class="fas fa-chevron-down absolute left-4 top-4 text-slate-400 pointer-events-none"></i>
                </div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-2">
                  <label class="block text-sm font-bold text-slate-700">رقم العقد</label>
                   <button type="button" id="scanAgreementBtn" class="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-orange-100 transition border border-orange-100 flex items-center gap-1">
                    <i class="fas fa-camera"></i>
                    تصوير العقد (AI)
                  </button>
                </div>
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
                  
                  <!-- Percentage Display Above -->
                  <div class="text-center mb-1"><span id="exitFuelDisplay" class="text-lg font-bold text-orange-600">100%</span></div>
                  
                  <!-- Tick Marks Above Slider -->
                  <div class="w-full mb-1">
                    <!-- Numbers Row -->
                    <div class="flex justify-between text-[9px] text-slate-400 font-mono px-1 mb-0.5">
                      <span>0</span>
                      <span>25</span>
                      <span>50</span>
                      <span>75</span>
                      <span>100</span>
                    </div>
                    <!-- Tick Lines Row -->
                    <div class="flex justify-between h-2 px-1">
                      <div class="w-0.5 h-full bg-slate-300 rounded"></div>
                      <div class="w-0.5 h-full bg-slate-300 rounded"></div>
                      <div class="w-0.5 h-full bg-slate-400 rounded"></div>
                      <div class="w-0.5 h-full bg-slate-300 rounded"></div>
                      <div class="w-0.5 h-full bg-slate-300 rounded"></div>
                    </div>
                  </div>
                  
                  <!-- Native Slider -->
                  <input type="range" id="exitFuel" min="0" max="100" step="5" value="100" 
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500">
                </div>
              </div>
            </div>

            <!-- Mandatory Photos -->
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-camera text-orange-500"></i> الصور الأساسية (حتمية)
              </h4>
              <div id="exitPhotosContainer"></div>
            </div>

            <!-- Optional Photos -->
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-plus-circle text-orange-500"></i> تفاصيل إضافية (اختيارية)
              </h4>
              <div id="exitAdditionalContainer"></div>
              <p class="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <i class="fas fa-info-circle"></i>
                اختياري: التقط صور للطبلون أو عداد الوقود للتوثيق الإضافي
              </p>
            </div>

            <button type="submit" class="w-full bg-gradient-to-l from-orange-600 to-orange-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-orange-700 hover:to-orange-600 transition shadow-xl shadow-orange-500/20 flex justify-center items-center gap-3 transform hover:-translate-y-0.5">
              <i class="fas fa-check-circle text-xl"></i>
              تأكيد تشييك الخروج
            </button>
          </form>
        </div>
      </div>
    </div>
  `

  // Populate car select
  populateExitCarSelect()

  // Initialize Mandatory Photos
  window.exitPhotoCapture = new PhotoCapture({
    containerId: 'exitPhotosContainer',
    label: 'صور جسم السيارة والداخلية',
    slots: [
      { id: 'front', label: 'الجهة الأمامية' },
      { id: 'left1', label: 'الجانب الأيسر (أمام)' },
      { id: 'left2', label: 'الجانب الأيسر (خلف)' },
      { id: 'back', label: 'الجهة الخلفية' },
      { id: 'right2', label: 'الجانب الأيمن (خلف)' },
      { id: 'right1', label: 'الجانب الأيمن (أمام)' },
      { id: 'dash', label: 'طبلون السيارة' }
    ],
    sequentialMode: true,
    onPhotoTaken: (photos) => console.log('Mandatory photos:', photos.length),
    onScan: handleExitAIAnalysis,
    onDamageScan: handleExitDamageAnalysis
  })

  // Initialize Optional Photos
  window.exitAdditionalPhotos = new PhotoCapture({
    containerId: 'exitAdditionalContainer',
    label: 'صور إضافية توثيقية',
    slots: [
      { id: 'extra1', label: 'إضافية (1)' },
      { id: 'extra2', label: 'إضافية (2)' },
      { id: 'extra3', label: 'إضافية (3)' },
      { id: 'extra4', label: 'إضافية (4)' },
      { id: 'extra5', label: 'إضافية (5)' }
    ],
    onPhotoTaken: (photos) => console.log('Optional photos:', photos.length),
    onScan: handleExitAIAnalysis
  })

  const photosMain = document.getElementById('exitPhotosContainer')
  if (photosMain) window.exitPhotoCapture.render(photosMain)

  const photosExtra = document.getElementById('exitAdditionalContainer')
  if (photosExtra) window.exitAdditionalPhotos.render(photosExtra)

  // Setup fuel slider
  const fuelInput = document.getElementById('exitFuel')
  const fuelDisplay = document.getElementById('exitFuelDisplay')
  const fuelBarVisual = document.getElementById('exitFuelBarVisual')

  const updateFuelVisual = (val) => {
    if (fuelDisplay) fuelDisplay.textContent = val + '%'
    if (fuelBarVisual) fuelBarVisual.style.width = val + '%'
    // Optional: Dynamic Color 
    if (fuelDisplay) {
      if (val > 50) fuelDisplay.className = "text-sm font-bold text-orange-600"
      else if (val > 20) fuelDisplay.className = "text-sm font-bold text-amber-600"
      else fuelDisplay.className = "text-sm font-bold text-red-600"
    }
  }

  fuelInput?.addEventListener('input', (e) => {
    const val = e.target.value
    updateFuelVisual(val)
  })

  // Initial update
  updateFuelVisual(fuelInput?.value || 100)

  // Handle AI Plate Scan
  document.getElementById('scanPlateBtn')?.addEventListener('click', handlePlateScan)

  // Handle AI Agreement Scan
  document.getElementById('scanAgreementBtn')?.addEventListener('click', handleAgreementScan)

  // Handle Plate Search Input
  document.getElementById('plateSearchInput')?.addEventListener('input', handlePlateSearch)

  // Handle form submission
  const form = document.getElementById('exitForm')
  form.addEventListener('submit', handleExitSubmit)

  // Subscribe to car changes
  // Subscribe to car changes
  const unsubCars = carsStore.subscribe(populateExitCarSelect)

  return () => {
    unsubCars()
    if (window.exitPhotoCapture) window.exitPhotoCapture.clear()
    if (window.exitAdditionalPhotos) window.exitAdditionalPhotos.clear()
    const form = document.getElementById('exitForm')
    if (form) form.removeEventListener('submit', handleExitSubmit)
  }
}

async function handlePlateScan() {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: 60,
      width: 1024,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    if (image && image.base64String) {
      Toast.info('جاري التعرف على اللوحة...', 3000);
      const result = await aiService.scanPlate(image.base64String);

      if (result && result.plate) {
        const plate = result.plate;
        const select = document.getElementById('exitCarSelect');
        const options = Array.from(select.options).filter(opt => opt.value); // Filter out empty options

        console.log('AI Recognized Plate:', plate);
        console.log('Available options:', options.map(o => ({ value: o.value, text: o.textContent })));

        // Find car by plate number (using imported platesMatch for comprehensive matching)
        const foundOption = options.find(opt => {
          const optText = opt.textContent;
          const match = platesMatch(plate, optText);
          console.log(`Comparing "${plate}" with "${optText}": ${match}`);
          return match;
        });

        if (foundOption) {
          console.log('Found matching option:', foundOption.value, foundOption.textContent);
          select.value = foundOption.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          Toast.success(`تم اختيار السيارة: ${foundOption.textContent}`);
        } else {
          // Fallback: Try number-only matching
          const plateNumbers = extractPlateNumbers(plate);
          console.log('No match found. Trying number-only fallback with:', plateNumbers);

          const numericMatch = options.find(opt => {
            const optNumbers = extractPlateNumbers(opt.textContent);
            return plateNumbers.length >= 3 && (optNumbers.includes(plateNumbers) || plateNumbers.includes(optNumbers));
          });

          if (numericMatch) {
            console.log('Numeric match found:', numericMatch.value, numericMatch.textContent);
            select.value = numericMatch.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            Toast.success(`تم اختيار السيارة: ${numericMatch.textContent}`);
          } else {
            Toast.warning(`تم التعرف على اللوحة (${plate}) ولكنها غير موجودة بالداخل حالياً`);
          }
        }
      }
    }
  } catch (e) {
    console.error('Plate Scan Error:', e);
    Toast.error('فشل التعرف على اللوحة: ' + (e.message || 'خطأ غير معروف'));
  }
}

// Handle manual plate search/filter
function handlePlateSearch(e) {
  const searchValue = e.target.value.trim();
  const select = document.getElementById('exitCarSelect');
  const { cars } = carsStore.getState();
  const availableCars = cars.filter(c => c.status === 'in');

  // Reset and repopulate
  select.innerHTML = '<option value="">-- اختر السيارة المتواجدة بالداخل --</option>';

  if (!searchValue) {
    // No search - show all
    availableCars.forEach(car => {
      const option = document.createElement('option');
      option.value = car.id;
      option.textContent = `${car.model} - ${car.plate || car.plateNumber}`;
      select.appendChild(option);
    });
  } else {
    // Filter by search
    const searchNumbers = extractPlateNumbers(searchValue);
    const normalizedSearch = normalizePlate(searchValue);

    const filteredCars = availableCars.filter(car => {
      const currentPlate = car.plate || car.plateNumber || '';
      const carNumbers = extractPlateNumbers(currentPlate);
      const normalizedCar = normalizePlate(currentPlate);

      // Match by numbers or normalized text
      return normalizedCar.includes(normalizedSearch) ||
        normalizedSearch.includes(normalizedCar) ||
        (searchNumbers.length >= 2 && carNumbers.includes(searchNumbers)) ||
        (searchNumbers.length >= 2 && searchNumbers.includes(carNumbers));
    });

    if (filteredCars.length === 0) {
      select.innerHTML = '<option value="">لا توجد نتائج مطابقة</option>';
    } else {
      filteredCars.forEach(car => {
        const option = document.createElement('option');
        option.value = car.id;
        option.textContent = `${car.model} - ${car.plate || car.plateNumber}`;
        select.appendChild(option);
      });

      // Auto-select if only one match
      if (filteredCars.length === 1) {
        select.value = filteredCars[0].id;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        Toast.success(`تم اختيار: ${filteredCars[0].model} - ${filteredCars[0].plate}`);
      }
    }
  }

  select.disabled = select.options.length <= 1 && !select.options[0]?.value;
}
async function handleExitAIAnalysis(photo, index) {
  try {
    Toast.info('جاري تحليل الصورة...', 2000);
    const odoResult = await aiService.scanOdometer(photo.data);
    if (odoResult && odoResult.reading) {
      const mileageInput = document.getElementById('exitMileage');
      if (mileageInput && (!mileageInput.value || confirm(`هل تريد اعتماد قراءة العداد: ${odoResult.reading}؟`))) {
        mileageInput.value = odoResult.reading;
        Toast.success('تم استخراج قراءة العداد بنجاح');
      }
    }
  } catch (e) { console.error(e) }
}

async function handleExitDamageAnalysis(photo, index) {
  try {
    Toast.info('جاري فحص الأضرار...', 2000);
    const result = await aiService.analyzeDamage(photo.data);
    if (result.hasDamage) Toast.warning(`⚠️ تنبيه: ضرر محتمل (${result.summary})`);
  } catch (e) { console.error(e) }
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
    option.textContent = `${car.model} - ${car.plate || car.plateNumber}`
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

async function handleAgreementScan() {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    const image = await Camera.getPhoto({
      quality: 60,
      width: 1024,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    });

    if (image && image.base64String) {
      Toast.info('جاري قراءة رقم العقد...', 3000);
      const result = await aiService.scanAgreement(image.base64String);

      if (result && result.agreementNumber) {
        document.getElementById('exitDriver').value = result.agreementNumber;
        Toast.success(`تم التعرف على رقم العقد: ${result.agreementNumber}`);
      } else {
        Toast.error('لم نتمكن من العثور على رقم العقد في الصورة');
      }
    }
  } catch (error) {
    console.error('Agreement Scan UI Error:', error);
    Toast.error('فشل تصوير العقد');
  }
}

async function handleExitSubmit(e) {
  e.preventDefault()

  const carId = document.getElementById('exitCarSelect').value
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

  // Validation - Only check Mandatory
  const mandatoryPhotos = window.exitPhotoCapture ? window.exitPhotoCapture.getPhotos() : []
  const optionalPhotos = window.exitAdditionalPhotos ? window.exitAdditionalPhotos.getPhotos() : []

  const capturedCount = window.exitPhotoCapture ? window.exitPhotoCapture.getCapturedCount() : 0
  const totalSlots = window.exitPhotoCapture ? window.exitPhotoCapture.slots.length : 0

  if (capturedCount < totalSlots) {
    if (!confirm(`⚠️ تنبيه: تم التقاط ${capturedCount} من أصل ${totalSlots} صور أساسية فقط. هل تريد المتابعة؟`)) {
      return;
    }
  }

  const photos = [...mandatoryPhotos, ...optionalPhotos]

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
    await carsActions.updateCar(carId, { status: 'out' })

    // Show success message
    Toast.success(`تم تسجيل خروج السيارة بنجاح! رقم الحركة: ${movement.id}`)

    // Send System Notification
    const car = carsStore.getState().cars.find(c => c.id === carId);
    NotificationService.send('تم خروج سيارة', `السيارة ${car?.model} مغادرة الآن مع ${driver}`);

    // Run AI Condition Analysis in Background
    runExitConditionAnalysis(movement.id, mandatoryPhotos);

    // Reset form
    e.target.reset()
    document.getElementById('exitFuelDisplay').textContent = '100%'

    // Clear photos
    if (window.exitPhotoCapture) {
      window.exitPhotoCapture.clear()
      const photosContainer = document.getElementById('exitPhotosContainer')
      if (photosContainer) window.exitPhotoCapture.render(photosContainer)
    }
    if (window.exitAdditionalPhotos) {
      window.exitAdditionalPhotos.clear()
      const extraContainer = document.getElementById('exitAdditionalContainer')
      if (extraContainer) window.exitAdditionalPhotos.render(extraContainer)
    }

    // Navigate to logs
    uiActions.setActiveSection('logs')
  } catch (error) {
    console.error('Save Error:', error);
    Toast.error('حدث خطأ أثناء حفظ البيانات: ' + (error.message || 'خطأ غير معروف'));
  }
}

/**
 * Run AI condition analysis for exit photos in background
 */
async function runExitConditionAnalysis(movementId, photos) {
  // Filter photos with data
  const photosWithData = photos.filter(p => p && p.data);

  if (photosWithData.length === 0) {
    console.log('No photos to analyze for exit condition');
    return;
  }

  try {
    Toast.info('🔍 جاري تحليل حالة السيارة...', 3000);

    const conditionReport = await aiService.analyzeCondition(photosWithData, 'exit');

    // Save to movement
    await movementsActions.updateAIReport(movementId, {
      exitCondition: conditionReport
    });

    // Show result notification
    if (conditionReport.totalIssues > 0) {
      Toast.warning(`📋 بيان الخروج: ${conditionReport.totalIssues} ملاحظات مسجلة`);
      NotificationService.send('تحليل الخروج', `تم رصد ${conditionReport.totalIssues} ملاحظات عند الخروج`);
    } else {
      Toast.success('✅ بيان الخروج: السيارة في حالة ممتازة');
    }

    console.log('Exit condition analysis completed:', conditionReport);
  } catch (error) {
    console.error('Exit condition analysis failed:', error);
    // Non-blocking - don't show error to user as main operation succeeded
  }
}
