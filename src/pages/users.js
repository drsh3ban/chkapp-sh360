import { userStore, userActions } from '../store/userStore'
import { authStore } from '../store/authStore'
import { Toast } from '../components/Toast'

export function renderUsersPage(container) {
    // Initial fetch
    userActions.fetchUsers()

    container.innerHTML = `
        <div class="space-y-6 animate-fade-in pb-20">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-white">إدارة المستخدمين</h2>
                    <p class="text-slate-400 text-sm mt-1">إدارة الحسابات والصلاحيات للنظام</p>
                </div>
                <button id="addUserBtn" class="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-600/20 transition flex items-center gap-2">
                    <i class="fas fa-plus"></i>
                    <span>إضافة مستخدم</span>
                </button>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 p-6 rounded-2xl">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="text-slate-400 text-xs mb-1">إجمالي المستخدمين</p>
                            <h3 class="text-3xl font-bold text-white" id="totalUsers">0</h3>
                        </div>
                        <div class="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <i class="fas fa-users text-blue-400"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Users Table -->
            <div class="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-2xl overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-right">
                        <thead class="bg-slate-900/50 text-slate-400 text-xs uppercase">
                            <tr>
                                <th class="px-6 py-4 font-medium">الاسم</th>
                                <th class="px-6 py-4 font-medium">اسم المستخدم</th>
                                <th class="px-6 py-4 font-medium">الصلاحية</th>
                                <th class="px-6 py-4 font-medium">تاريخ الإنشاء</th>
                                <th class="px-6 py-4 font-medium text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody id="usersList" class="divide-y divide-slate-700/50 text-slate-300 text-sm">
                            <tr>
                                <td colspan="5" class="px-6 py-8 text-center text-slate-500">
                                    <i class="fas fa-circle-notch fa-spin ml-2"></i> جاري التحميل...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add User Modal -->
        <div id="userModal" class="fixed inset-0 z-50 flex items-center justify-center px-4 opacity-0 pointer-events-none transition-opacity duration-300">
            <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" id="closeModalBg"></div>
            <div class="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 transform scale-95 transition-transform duration-300" id="modalContent">
                <div class="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-white">إضافة مستخدم جديد</h3>
                    <button id="closeModalBtn" class="text-slate-400 hover:text-white transition">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="addUserForm" class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-slate-300 text-xs font-bold mb-2">الاسم الكامل</label>
                            <input type="text" name="name" required class="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition">
                        </div>
                        <div>
                            <label class="block text-slate-300 text-xs font-bold mb-2">اسم المستخدم</label>
                            <input type="text" name="username" required class="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition">
                        </div>
                        <div>
                            <label class="block text-slate-300 text-xs font-bold mb-2">الصلاحية</label>
                            <select name="role" required class="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition">
                                <option value="guard">حارس أمن</option>
                                <option value="admin">مدير</option>
                            </select>
                        </div>
                        <div class="col-span-2">
                            <label class="block text-slate-300 text-xs font-bold mb-2">كلمة المرور</label>
                            <input type="password" name="password" required class="w-full bg-slate-900/50 border border-slate-600 text-white rounded-xl px-4 py-3 focus:border-primary-500 outline-none transition">
                        </div>
                    </div>

                    <div class="pt-4 flex justify-end gap-3">
                        <button type="button" id="cancelBtn" class="px-6 py-2.5 rounded-xl text-slate-300 hover:bg-slate-700 transition font-medium">إلغاء</button>
                        <button type="submit" id="saveUserBtn" class="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary-600/20 transition">
                            حفظ المستخدم
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `

    // DOM Elements
    const addUserBtn = document.getElementById('addUserBtn')
    const userModal = document.getElementById('userModal')
    const modalContent = document.getElementById('modalContent')
    const closeModalBtn = document.getElementById('closeModalBtn')
    const closeModalBg = document.getElementById('closeModalBg')
    const cancelBtn = document.getElementById('cancelBtn')
    const addUserForm = document.getElementById('addUserForm')
    const usersList = document.getElementById('usersList')
    const totalUsers = document.getElementById('totalUsers')

    // Functions
    const toggleModal = (show) => {
        if (show) {
            userModal.classList.remove('opacity-0', 'pointer-events-none')
            modalContent.classList.remove('scale-95')
            modalContent.classList.add('scale-100')
        } else {
            userModal.classList.add('opacity-0', 'pointer-events-none')
            modalContent.classList.remove('scale-100')
            modalContent.classList.add('scale-95')
            addUserForm.reset()
        }
    }

    const renderRows = (users) => {
        if (!users || users.length === 0) {
            usersList.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                        <div class="flex flex-col items-center gap-3">
                            <div class="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                <i class="fas fa-users-slash text-xl"></i>
                            </div>
                            <p>لا يوجد مستخدمين</p>
                        </div>
                    </td>
                </tr>
            `
            return
        }

        const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' }
        const currentUserId = authStore.getState().user?.id

        usersList.innerHTML = users.map(user => `
            <tr class="hover:bg-slate-800/50 transition group">
                <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full ${user.role === 'admin' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'} flex items-center justify-center font-bold text-xs uppercase">
                            ${user.name.charAt(0)}
                        </div>
                        <span class="font-bold text-white">${user.name}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-slate-400 font-mono text-xs">${user.username}</td>
                <td class="px-6 py-4">
                    <span class="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'bg-green-500/10 text-green-400 border border-green-500/20'
            }">
                        ${user.role === 'admin' ? 'مدير' : 'حارس'}
                    </span>
                </td>
                <td class="px-6 py-4 text-slate-400">
                    ${new Date(user.created_at).toLocaleDateString('ar-EG', dateOptions)}
                </td>
                <td class="px-6 py-4 text-center">
                    ${user.id !== currentUserId ? `
                        <button class="delete-btn text-slate-500 hover:text-red-400 transition p-2 rounded-lg hover:bg-red-500/10" data-id="${user.id}">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    ` : '<span class="text-xs text-slate-600">أنت</span>'}
                </td>
            </tr>
        `).join('')

        // Attach delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id
                if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
                    const success = await userActions.deleteUser(id)
                    if (success) {
                        Toast.success('تم حذف المستخدم')
                    } else {
                        Toast.error('حدث خطأ أثناء الحذف')
                    }
                }
            })
        })
    }

    // Event Listeners
    addUserBtn.addEventListener('click', () => toggleModal(true))
    closeModalBtn.addEventListener('click', () => toggleModal(false))
    closeModalBg.addEventListener('click', () => toggleModal(false))
    cancelBtn.addEventListener('click', () => toggleModal(false))

    addUserForm.addEventListener('submit', async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const data = Object.fromEntries(formData.entries())

        const saveBtn = document.getElementById('saveUserBtn')
        const originalText = saveBtn.innerHTML
        saveBtn.disabled = true
        saveBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'

        const success = await userActions.addUser(data)

        saveBtn.disabled = false
        saveBtn.innerHTML = originalText

        if (success) {
            Toast.success('تم إضافة المستخدم بنجاح')
            toggleModal(false)
        } else {
            Toast.error(userStore.getState().error || 'فشل إضافة المستخدم')
        }
    })

    // Store Subscription
    const unsubscribe = userStore.subscribe(state => {
        const totalUsers = document.getElementById('totalUsers')
        if (totalUsers) totalUsers.textContent = state.users.length
        if (!state.loading) {
            renderRows(state.users)
        }
    })

    return () => {
        unsubscribe()
        if (addUserBtn) addUserBtn.removeEventListener('click', () => toggleModal(true))
        // ... clean up other listeners if critical, though strict equality makes anonymous listeners hard to remove specific references. 
        // Main concern is the store subscription.
    }
}
