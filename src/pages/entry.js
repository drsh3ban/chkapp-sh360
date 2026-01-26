import { aiService } from '../utils/aiService'
import { normalizePlate, extractPlateNumbers, platesMatch } from '../utils/plateUtils'
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
            <i class="fas fa-sign-in-alt text-emerald-200"></i> تشييك العودة
          </h3>
        </div>
        <div class="p-6 md:p-8">
          <form id="entryForm" class="space-y-8">
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-bold text-slate-700">السيارة العائدة</label>
                <div class="flex items-center gap-2">
                  <button type="button" id="scanPlateBtn" class="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-emerald-100 transition border border-emerald-100 flex items-center gap-1">
                    <i class="fas fa-car"></i>
                    تصوير اللوحة (AI)
                  </button>
                  <button type="button" id="scanAgreementBtn" class="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-[10px] font-bold hover:bg-emerald-100 transition border border-emerald-100 flex items-center gap-1">
                    <i class="fas fa-file-contract"></i>
                    تصوير العقد (AI)
                  </button>
                </div>
              </div>
              <div class="relative mb-2">
                <input type="text" id="plateSearchInput" placeholder="ابحث برقم اللوحة (مثال: 1179)" 
                  class="w-full p-3 pr-10 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm">
                <i class="fas fa-search absolute right-3 top-3.5 text-slate-400"></i>
              </div>
              <div class="relative">
                <select id="entryCarSelect" required class="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none appearance-none cursor-pointer">
                  <option value="">-- اختر السيارة المتواجدة بالخارج --</option>
                </select>
                <i class="fas fa-chevron-down absolute left-4 top-4 text-slate-400 pointer-events-none"></i>
              </div>
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
                  
                  <!-- Percentage Display Above -->
                  <div class="text-center mb-1"><span id="entryFuelDisplay" class="text-lg font-bold text-emerald-600">100%</span></div>
                  
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
                  <input type="range" id="entryFuel" min="0" max="100" step="5" value="100" 
                    class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500">
                </div>
              </div>
            </div>

            <!-- Mandatory Photos -->
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-camera text-emerald-500"></i> الصور الأساسية (حتمية)
              </h4>
              <div id="entryPhotosContainer"></div>
            </div>

            <!-- Optional Photos -->
            <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h4 class="font-bold text-slate-700 mb-4 flex items-center gap-2">
                <i class="fas fa-plus-circle text-emerald-500"></i> تفاصيل إضافية (اختيارية)
              </h4>
              <div id="entryAdditionalContainer"></div>
              <p class="text-xs text-slate-500 mt-3 flex items-center gap-2">
                <i class="fas fa-info-circle"></i>
                اختياري: التقط صور للطبلون أو عداد الوقود للتوثيق الإضافي عند العودة
              </p>
            </div>

            <button type="submit" class="w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-600 transition shadow-xl shadow-emerald-500/20 flex justify-center items-center gap-3 transform hover:-translate-y-0.5">
              <i class="fas fa-check-double text-xl"></i>
              إغلاق الحركة وتأكيد تشييك العودة
            </button>
          </form>
        </div>
      </div>
    </div>
  `

  // Populate car select
  populateEntryCarSelect()

  // Initialize Mandatory Photos
  window.entryPhotoCapture = new PhotoCapture({
    containerId: 'entryPhotosContainer',
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
    onPhotoTaken: (photos) => console.log('Mandatory entry photos:', photos.length),
    onScan: handleEntryAIAnalysis,
    onDamageScan: handleEntryDamageAnalysis
  })

  // Initialize Optional Photos
  window.entryAdditionalPhotos = new PhotoCapture({
    containerId: 'entryAdditionalContainer',
    label: 'صور إضافية توثيقية',
    slots: [
      { id: 'extra1', label: 'إضافية (1)' },
      { id: 'extra2', label: 'إضافية (2)' },
      { id: 'extra3', label: 'إضافية (3)' },
      { id: 'extra4', label: 'إضافية (4)' },
      { id: 'extra5', label: 'إضافية (5)' }
    ],
    onPhotoTaken: (photos) => console.log('Optional entry photos:', photos.length),
    onScan: handleEntryAIAnalysis
  })

  const photosMain = document.getElementById('entryPhotosContainer')
  if (photosMain) window.entryPhotoCapture.render(photosMain)

  const photosExtra = document.getElementById('entryAdditionalContainer')
  if (photosExtra) window.entryAdditionalPhotos.render(photosExtra)

  // Setup fuel slider
  const fuelInput = document.getElementById('entryFuel')
  const fuelDisplay = document.getElementById('entryFuelDisplay')
  const fuelBarVisual = document.getElementById('entryFuelBarVisual')

  const updateEntryFuelVisual = (val) => {
    if (fuelDisplay) fuelDisplay.textContent = val + '%'
    if (fuelBarVisual) fuelBarVisual.style.width = val + '%'
  }

  fuelInput?.addEventListener('input', (e) => {
    updateEntryFuelVisual(e.target.value)
  })

  // Initial
  updateEntryFuelVisual(fuelInput?.value || 100)

  // Handle car selection change
  document.getElementById('entryCarSelect').addEventListener('change', handleCarSelection)

  // Handle AI Plate Scan
  document.getElementById('scanPlateBtn')?.addEventListener('click', handlePlateScan)

  // Handle AI Agreement Scan
  document.getElementById('scanAgreementBtn')?.addEventListener('click', handleAgreementScan)

  // Handle Plate Search Input
  document.getElementById('plateSearchInput')?.addEventListener('input', handlePlateSearch)

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
    if (window.entryPhotoCapture) window.entryPhotoCapture.clear()
    if (window.entryAdditionalPhotos) window.entryAdditionalPhotos.clear()
    const form = document.getElementById('entryForm')
    if (form) form.removeEventListener('submit', handleEntrySubmit)
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
        const agreementNum = result.agreementNumber;
        const { movements } = movementsStore.getState();

        // Find movement by agreement number
        const movement = movements.find(m =>
          m.status === 'active' &&
          m.exitDriver &&
          (m.exitDriver.includes(agreementNum) || agreementNum.includes(m.exitDriver))
        );

        if (movement) {
          const select = document.getElementById('entryCarSelect');
          select.value = movement.carId;
          handleCarSelection();
          Toast.success(`تم العثور على العقد واختيار السيارة بنجاح`);
        } else {
          Toast.warning(`تم التعرف على الرقم ${agreementNum} ولكن لم يتم العثور على سيارة مرتبطة به بالخارج`);
        }
      } else {
        Toast.error('لم نتمكن من العثور على رقم العقد في الصورة');
      }
    }
  } catch (error) {
    console.error('Agreement Scan UI Error:', error);
    Toast.error('فشل تصوير العقد');
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
        const select = document.getElementById('entryCarSelect');
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
          handleCarSelection();
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
            handleCarSelection();
            Toast.success(`تم اختيار السيارة: ${numericMatch.textContent}`);
          } else {
            Toast.warning(`تم التعرف على اللوحة (${plate}) ولكنها غير موجودة في قائمة الخارج الآن`);
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
  const select = document.getElementById('entryCarSelect');
  const { cars } = carsStore.getState();
  const availableCars = cars.filter(c => c.status === 'out');

  // Reset and repopulate
  select.innerHTML = '<option value="">-- اختر السيارة المتواجدة بالخارج --</option>';

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
        handleCarSelection();
        Toast.success(`تم اختيار: ${filteredCars[0].model} - ${filteredCars[0].plate}`);
      }
    }
  }

  select.disabled = select.options.length <= 1 && !select.options[0]?.value;
}

// AI Analysis Helpers
async function handleEntryAIAnalysis(photo, index) {
  try {
    Toast.info('جاري تحليل الصورة...', 2000);
    const odoResult = await aiService.scanOdometer(photo.data);
    if (odoResult && odoResult.reading) {
      const mileageInput = document.getElementById('entryMileage');
      if (mileageInput && (!mileageInput.value || confirm(`هل تريد اعتماد قراءة العداد: ${odoResult.reading}؟`))) {
        mileageInput.value = odoResult.reading;
        const event = new Event('input', { bubbles: true });
        mileageInput.dispatchEvent(event);
        Toast.success('تم استخراج قراءة العداد بنجاح');
      }
    }
  } catch (e) { console.error(e) }
}

async function handleEntryDamageAnalysis(photo, index) {
  try {
    Toast.info('جاري فحص الأضرار...', 2000);
    const result = await aiService.analyzeDamage(photo.data);
    if (result.hasDamage) Toast.warning(`⚠️ تنبيه: ضرر جديد محتمل (${result.summary})`);
  } catch (e) { console.error(e) }
}

function populateEntryCarSelect() {
  const select = document.getElementById('entryCarSelect')
  if (!select) return

  const { cars } = carsStore.getState()
  const { movements } = movementsStore.getState()

  // Get cars that are out with active movements
  const activeCars = movements
    .filter(m => m.status === 'active')
    .map(m => String(m.carId))

  const carsOut = cars.filter(c => activeCars.includes(String(c.id)))

  const currentValue = select.value

  select.innerHTML = '<option value="">-- اختر السيارة المتواجدة بالخارج --</option>'

  carsOut.forEach(car => {
    const option = document.createElement('option')
    option.value = car.id
    option.textContent = `${car.model} - ${car.plate || car.plateNumber}`
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
  const carId = document.getElementById('entryCarSelect').value
  const infoCard = document.getElementById('exitInfoCard')

  if (!carId) {
    infoCard.classList.add('hidden')
    return
  }

  const { movements } = movementsStore.getState()
  const movement = movements.find(m => String(m.carId) === String(carId) && m.status === 'active')

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
          <span class="text-xs text-blue-400 font-bold uppercase block mb-1">وقود الخروج</span>
          <div class="w-32">
             ${renderFuelBar(movement.exitFuel, 'orange')}
          </div>
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
  const carId = document.getElementById('entryCarSelect').value
  const returnMileage = parseInt(document.getElementById('entryMileage').value)
  const distanceInfo = document.getElementById('distanceInfo')

  if (!carId || !returnMileage) {
    distanceInfo.classList.add('hidden')
    return
  }

  const { movements } = movementsStore.getState()
  const movement = movements.find(m => String(m.carId) === String(carId) && m.status === 'active')

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

  const carId = document.getElementById('entryCarSelect').value
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
  const movement = movements.find(m => String(m.carId) === String(carId) && m.status === 'active')

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

  // Validation - Only Mandatory
  const mandatoryPhotos = window.entryPhotoCapture ? window.entryPhotoCapture.getPhotos() : []
  const optionalPhotos = window.entryAdditionalPhotos ? window.entryAdditionalPhotos.getPhotos() : []

  const capturedCount = window.entryPhotoCapture ? window.entryPhotoCapture.getCapturedCount() : 0
  const totalSlots = window.entryPhotoCapture ? window.entryPhotoCapture.slots.length : 0

  if (capturedCount < totalSlots) {
    if (!confirm(`⚠️ تنبيه: تم التقاط ${capturedCount} من أصل ${totalSlots} صور أساسية فقط. هل تريد المتابعة؟`)) {
      return;
    }
  }

  const photos = [...mandatoryPhotos, ...optionalPhotos]

  try {
    // Register return
    await movementsActions.registerReturn(movement.id, {
      returnMileage: mileage,
      returnFuel: fuel,
      returnPhotos: photos
    })

    // Update car status to 'in'
    await carsActions.updateCar(carId, { status: 'in' })

    const distance = calculateDistance(movement.exitMileage, mileage)

    // Show success message
    Toast.success(`تم تسجيل عودة السيارة بنجاح! المسافة: ${distance} كم`)

    // Send System Notification
    const car = carsStore.getState().cars.find(c => c.id === carId);
    NotificationService.send('تم عودة سيارة', `السيارة ${car?.model} عادت الآن. المسافة المقطوعة: ${distance} كم`);

    // AI Damage Comparison (Run in background)
    if (movement.exitPhotos && movement.exitPhotos.length > 0 && mandatoryPhotos.length > 0) {
      Toast.info('🔍 جاري فحص وتحليل الأضرار بالذكاء الاصطناعي...');
      // Run both analyses in parallel
      runReturnConditionAnalysis(movement.id, mandatoryPhotos);
      runDamageComparison(movement.id, movement.exitPhotos, mandatoryPhotos, car);
    }

    // Reset form
    e.target.reset()
    document.getElementById('entryFuelDisplay').textContent = '100%'
    document.getElementById('exitInfoCard').classList.add('hidden')
    document.getElementById('distanceInfo').classList.add('hidden')

    // Clear photos
    if (window.entryPhotoCapture) {
      window.entryPhotoCapture.clear()
      const photosContainer = document.getElementById('entryPhotosContainer')
      if (photosContainer) window.entryPhotoCapture.render(photosContainer)
    }
    if (window.entryAdditionalPhotos) {
      window.entryAdditionalPhotos.clear()
      const extraContainer = document.getElementById('entryAdditionalContainer')
      if (extraContainer) window.entryAdditionalPhotos.render(extraContainer)
    }

    // Navigate to logs
    uiActions.setActiveSection('logs')

  } catch (error) {
    console.error('Save Error:', error);
    Toast.error('حدث خطأ أثناء حفظ البيانات: ' + (error.message || 'خطأ غير معروف'));
  }
}

// Helper to render fuel bar (Same as logs.js)
function renderFuelBar(val, color) {
  const pct = parseInt(val) || 0
  const gradientClass = color === 'orange' ? 'from-orange-500 to-amber-500' : 'from-emerald-500 to-teal-500'
  const textClass = pct > 50 ? 'text-white drop-shadow-md' : 'text-slate-600'

  return `
    <div class="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner">
      <div class="absolute inset-0 w-full h-full z-0 flex justify-between px-[1%]">
        <div class="w-px h-full bg-slate-300/50" style="margin-left: 25%"></div>
        <div class="w-px h-full bg-slate-300/80" style="margin-left: 25%"></div>
        <div class="w-px h-full bg-slate-300/50" style="margin-left: 25%"></div>
      </div>
      <div class="absolute top-0 left-0 h-full bg-gradient-to-r ${gradientClass} transition-all duration-700 ease-out z-10 relative" style="width: ${pct}%">
        <div class="absolute top-0 w-full h-[1px] bg-white/30"></div>
      </div>
      <span class="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-wider z-20 ${textClass}">${pct}%</span>
    </div>
  `
}

/**
 * Run AI damage comparison in background and show results
 * @param {string} movementId - Movement ID to save report
 * @param {Array} exitPhotos - Exit photos (paths)
 * @param {Array} returnPhotos - Return photos with data
 * @param {Object} car - Car object
 */
async function runDamageComparison(movementId, exitPhotos, returnPhotos, car) {
  try {
    // For comparison, we need base64 data of exit photos too
    // But exitPhotos are saved as paths, so we need to read them
    // For now, we pass returnPhotos which have .data

    const results = await aiService.compareAllPhotos(exitPhotos, returnPhotos);

    // Filter only those with differences
    const damages = results.filter(r => r.hasDifference);

    // Build comparison report
    const comparisonReport = {
      analyzedAt: new Date().toISOString(),
      newDamages: damages.map(d => ({
        position: d.label,
        severity: d.severity,
        description: d.description
      })),
      totalNewDamages: damages.length,
      overallSeverity: damages.some(d => d.severity === 'major') ? 'major'
        : damages.length > 0 ? 'minor' : 'none'
    };

    // Save to Firestore
    await movementsActions.updateAIReport(movementId, {
      comparison: comparisonReport
    });

    if (damages.length === 0) {
      Toast.success('✅ لم يتم اكتشاف أي أضرار جديدة!', 5000);
      return;
    }

    // Show damage report modal
    const severityColors = {
      minor: 'bg-amber-100 text-amber-800 border-amber-300',
      major: 'bg-red-100 text-red-800 border-red-300',
      unknown: 'bg-slate-100 text-slate-800 border-slate-300'
    };

    const modal = document.createElement('div');
    modal.id = 'damageReportModal';
    modal.className = 'fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in';

    modal.innerHTML = `
      <div class="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div class="bg-gradient-to-r from-red-500 to-orange-500 p-6 text-white">
          <h3 class="text-xl font-bold flex items-center gap-3">
            <i class="fas fa-exclamation-triangle"></i>
            تقرير الأضرار - ${car?.model || 'السيارة'}
          </h3>
          <p class="text-sm opacity-80 mt-1">تم اكتشاف ${damages.length} فرق محتمل</p>
        </div>
        <div class="p-6 overflow-y-auto max-h-[50vh] space-y-4">
          ${damages.map(d => `
            <div class="p-4 rounded-xl border ${severityColors[d.severity] || severityColors.unknown}">
              <div class="font-bold mb-1">${d.label}</div>
              <div class="text-sm">${d.description || 'فرق ملاحظ'}</div>
              <div class="text-xs mt-2 opacity-70">الشدة: ${d.severity === 'major' ? 'كبير ⚠️' : d.severity === 'minor' ? 'بسيط' : 'غير محدد'}</div>
            </div>
          `).join('')}
        </div>
        <div class="p-4 border-t border-slate-100">
          <button onclick="document.getElementById('damageReportModal').remove()" 
                  class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition">
            فهمت، إغلاق التقرير
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Also send notification
    NotificationService.send('⚠️ تنبيه أضرار', `تم اكتشاف ${damages.length} فرق في السيارة ${car?.model}`);

  } catch (error) {
    console.error('Damage comparison failed:', error);
    Toast.warning('تعذر إكمال فحص الأضرار: ' + error.message, 5000);
  }
}

/**
 * Run AI condition analysis for return photos in background
 * @param {string} movementId - Movement ID to save report
 * @param {Array} photos - Return photos with data
 */
async function runReturnConditionAnalysis(movementId, photos) {
  // Filter photos with data
  const photosWithData = photos.filter(p => p && p.data);

  if (photosWithData.length === 0) {
    console.log('No photos to analyze for return condition');
    return;
  }

  try {
    const conditionReport = await aiService.analyzeCondition(photosWithData, 'return');

    // Save to movement
    await movementsActions.updateAIReport(movementId, {
      returnCondition: conditionReport
    });

    // Show result notification
    if (conditionReport.totalIssues > 0) {
      console.log(`Return condition: ${conditionReport.totalIssues} issues found`);
    }

    console.log('Return condition analysis completed:', conditionReport);
  } catch (error) {
    console.error('Return condition analysis failed:', error);
  }
}
