/**
 * Toast Notification Component
 * Displays sleek, non-blocking messages to the user
 */
export class Toast {
    static container = null;

    static init() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'fixed top-6 inset-x-0 mx-auto z-[9999] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4';
        document.body.appendChild(this.container);
    }

    /**
     * Show a toast message
     * @param {Object} options { message, type: 'success'|'error'|'warning'|'info', duration: 3000 }
     */
    static show(options) {
        if (!this.container) this.init();

        const { message, type = 'success', duration = 3000 } = options;

        const toast = document.createElement('div');
        toast.className = `
      toast-item pointer-events-auto
      flex items-center gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md
      transform transition-all duration-500 translate-y-[-20px] opacity-0
      ${this.getTypeStyles(type)}
    `;

        const icon = this.getIcon(type);

        toast.innerHTML = `
      <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-white/20">
        <i class="fas ${icon} text-lg"></i>
      </div>
      <div class="flex-1 text-sm font-bold">${message}</div>
      <button class="toast-close opacity-50 hover:opacity-100 transition-opacity">
        <i class="fas fa-times"></i>
      </button>
    `;

        this.container.appendChild(toast);

        // Fade in
        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-[-20px]', 'opacity-0');
        });

        // Close on click
        toast.querySelector('.toast-close').addEventListener('click', () => this.hide(toast));

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }
    }

    static hide(toast) {
        toast.classList.add('translate-y-[-20px]', 'opacity-0', 'scale-95');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 500);
    }

    static getTypeStyles(type) {
        switch (type) {
            case 'success': return 'bg-emerald-500/90 border-emerald-400 text-white';
            case 'error': return 'bg-red-500/90 border-red-400 text-white';
            case 'warning': return 'bg-orange-500/90 border-orange-400 text-white';
            case 'info': return 'bg-blue-600/90 border-blue-400 text-white';
            default: return 'bg-slate-800/90 border-slate-700 text-white';
        }
    }

    static getIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-bell';
        }
    }

    // Helper methods for easy access
    static success(msg, dur) { this.show({ message: msg, type: 'success', duration: dur }); }
    static error(msg, dur) { this.show({ message: msg, type: 'error', duration: dur }); }
    static warning(msg, dur) { this.show({ message: msg, type: 'warning', duration: dur }); }
    static info(msg, dur) { this.show({ message: msg, type: 'info', duration: dur }); }
}
