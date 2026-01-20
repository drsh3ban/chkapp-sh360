import './styles/main.css'
import { initializeApp } from './app'
import { Toast } from './components/Toast'

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
    initializeApp()
    registerServiceWorker()
    setupConnectivityListeners()
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
