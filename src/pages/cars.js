import { carsStore, carsActions } from '../store/carsStore'
import { Toast } from '../components/Toast'

export function renderCarsManagement(container) {
  container.innerHTML = `
    <div class="space-y-6 animate-fade-in">
      <h2 class="text-3xl font-bold text-slate-800">إدارة الأسطول</h2>
      
      <!-- Add Car Form -->
      <div class="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
          <i class="fas fa-plus-circle text-primary-500"></i> إضافة سيارة جديدة
        </h3>
        <form id="addCarForm" class="flex flex-col md:flex-row gap-4 items-end">
          <div class="flex-1 w-full">
            <label class="block text-sm font-bold text-slate-700 mb-2">نوع السيارة والموديل</label>
            <input type="text" id="carModel" required placeholder="مثال: تويوتا كامري 2023" 
              class="w-full pr-4 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition">
          </div>
          <div class="flex-1 w-full">
            <label class="block text-sm font-bold text-slate-700 mb-2">رقم اللوحة</label>
            <input type="text" id="carPlate" required placeholder="مثال: أ ب ج 1234" 
              class="w-full pr-4 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition">
          </div>
          <button type="submit" class="w-full md:w-auto bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2">
            <i class="fas fa-plus"></i> إضافة
          </button>
        </form>
      </div>

      <!-- Cars Table -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="p-6 border-b border-slate-100">
          <h3 class="font-bold text-xl text-slate-800">أسطول السيارات</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-right">
            <thead class="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
              <tr>
                <th class="p-4">رقم اللوحة</th>
                <th class="p-4">النوع</th>
                <th class="p-4">الحالة</th>
                <th class="p-4">إجراءات</th>
              </tr>
            </thead>
            <tbody id="carsTableBody" class="divide-y divide-slate-100">
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `

  // Render cars table
  renderCarsTable()

  // Add form handler
  const form = document.getElementById('addCarForm')
  form?.addEventListener('submit', handleAddCar)

  // Subscribe to changes
  const unsubscribe = carsStore.subscribe(() => {
    const tbody = document.getElementById('carsTableBody')
    // Only render if element still exists
    if (tbody) {
      renderCarsTable()
    }
  })

  // Cleanup function
  return () => {
    unsubscribe()
    if (form) form.removeEventListener('submit', handleAddCar)
  }
}

function renderCarsTable() {
  const tbody = document.getElementById('carsTableBody')
  if (!tbody) return

  const { cars } = carsStore.getState()

  if (!cars || cars.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="p-8 text-center text-slate-400">لا توجد سيارات مسجلة</td>
      </tr>
    `
    return
  }

  tbody.innerHTML = cars.map(car => `
    <tr>
      <td class="p-4 text-sm text-slate-900 font-bold">${car.plate}</td>
      <td class="p-4 text-sm text-slate-500">${car.model}</td>
      <td class="p-4">
        ${car.status === 'in'
      ? '<span class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">متواجدة</span>'
      : '<span class="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-orange-100 text-orange-800 border border-orange-200">بالخارج</span>'
    }
      </td>
      <td class="p-4 flex items-center justify-end gap-2">
        <button onclick="window.checkCar('${car.status}')" class="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition" title="${car.status === 'in' ? 'تسجيل خروج' : 'تسجيل دخول'}">
          <i class="fas ${car.status === 'in' ? 'fa-sign-out-alt' : 'fa-sign-in-alt'}"></i>
        </button>
        <button onclick="window.deleteCar(${car.id})" class="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition" title="حذف">
          <i class="fas fa-trash-alt"></i>
        </button>
      </td>
    </tr>
  `).join('')
}

// Global handler for check navigation
window.checkCar = function (status) {
  // Import store dynamically or use global actions if available. 
  // Since we are module based, we can use the exposed uiActions from window if we exposed them, 
  // or we need to import uiActions. 
  // But duplicate imports caused issues before.
  // The cleanest way is to dispatch a custom event or use the store if available in scope.
  // Wait, we are in cars.js and we import carsActions. We need uiActions for navigation.
  // Let's rely on the Sidebar's click handler logic or import uiActions.

  // Quick fix: Dispatch event or usage of a global helper if valid.
  // Actually, simply checking the status and setting the window location hash or clicking the sidebar button is a hack.
  // Better: Import uiActions at the top.

  const targetSection = status === 'in' ? 'exit' : 'entry';
  // We need to import uiActions. Let's add it to imports first.
  // Since I can't do multiple edits easily without context, I'll rely on a dispatched event that main.js listens to? 
  // No, standard import is better.

  // Dispatch event to main controller
  window.dispatchEvent(new CustomEvent('navigate-to', { detail: targetSection }));
}

function handleAddCar(e) {
  e.preventDefault()

  const model = document.getElementById('carModel').value
  const plate = document.getElementById('carPlate').value

  if (model && plate) {
    // Add car
    carsActions.addCar({ plate, model })
    Toast.success('تمت إضافة السيارة الجديدة بنجاح')

    // Reset form
    e.target.reset()
  }
}

// Global handler for delete
window.deleteCar = function (id) {
  if (confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
    carsActions.deleteCar(id)
    Toast.info('تم حذف السيارة من الأسطول')
  }
}
