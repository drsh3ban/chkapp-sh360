import './styles/main.css'
import { initializeApp } from './app.js'
import { Toast } from './components/Toast.js'
import { FirebaseSyncService } from './services/firebaseSyncService.js'

// Initialize app
// DEBUG: Global Error Handler for Android
window.onerror = function (msg, url, line, col, error) {
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);color:white;z-index:9999;padding:20px;overflow:auto;font-family:monospace;direction:ltr;text-align:left;';
    errorContainer.innerHTML = '<h3>Critical Error</h3><p>' + msg + '</p><p>' + url + ':' + line + ':' + col + '</p><pre>' + (error ? error.stack : 'No stacktrace') + '</pre><button onclick="this.parentElement.remove()" style="padding:10px;margin-top:20px;color:black;">Close</button>';
    document.body.appendChild(errorContainer);
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    Toast.init()

    // 1. Initialize UI immediately
    initializeApp()
    registerServiceWorker()
    setupConnectivityListeners()

    // 2. Run background services (non-blocking)
    const runBackgroundServices = async () => {
        // Load data from Firebase
        try {
            const syncResult = await FirebaseSyncService.initializeSync();
            if (syncResult && (syncResult.cars > 0 || syncResult.movements > 0)) {
                Toast.success(`تم استعادة البيانات: ${syncResult.cars} سيارة، ${syncResult.movements} حركة`, 5000);
            }
        } catch (e) {
            console.warn('Firebase sync on startup failed:', e);
        }

        // Run migrations
        try {
            const { MigrationService } = await import('./services/migrationService.js');
            await MigrationService.runV3Migrations();
        } catch (e) {
            console.error('Migration failed:', e);
        }
    };

    runBackgroundServices();

    // 3. Hide splash screen
    const hideSplash = () => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 600);
        }
    };

    // Hide after short delay or via failsafe
    setTimeout(hideSplash, 500);

    // Failsafe: Ensure splash is gone even if something hangs
    window.onload = () => setTimeout(hideSplash, 2000);
})

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('sw.js')
                .then(reg => console.log('Service Worker Registered'))
                .catch(err => console.log('Service Worker Error:', err))
        })
    }
}

function setupConnectivityListeners() {
    window.addEventListener('online', () => {
        Toast.success('تم استعادة الاتصال بالإنترنت', 5000)
    })

    window.addEventListener('offline', () => {
        Toast.warning('فقدت الاتصال بالإنترنت. يمكنك الاستمرار في العمل وسنقوم بالمزامنة لاحقاً.', 0)
    })
}
