/**
 * Format timestamp to Arabic locale
 */
export function formatTime(isoString) {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Format date to Arabic locale
 */
export function formatDate(isoString) {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

/**
 * Format full date and time
 */
export function formatDateTime(isoString) {
    if (!isoString) return '-'
    const d = new Date(isoString)
    return d.toLocaleString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

/**
 * Calculate distance traveled
 */
export function calculateDistance(exitMileage, returnMileage) {
    if (!exitMileage || !returnMileage) return 0
    return Math.max(0, returnMileage - exitMileage)
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

/**
 * Generate unique ID
 */
export function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9)
}
