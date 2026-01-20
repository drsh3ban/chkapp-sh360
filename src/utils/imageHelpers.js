import imageCompression from 'browser-image-compression'

/**
 * Compress image file to reduce storage size
 */
export async function compressImage(file, options = {}) {
    const defaultOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.7
    }

    try {
        const compressedFile = await imageCompression(file, {
            ...defaultOptions,
            ...options
        })

        // Convert to base64
        return fileToBase64(compressedFile)
    } catch (error) {
        console.error('Error compressing image:', error)
        throw error
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
    })
}

/**
 * Create image element from base64
 */
export function createImageElement(base64, className = '') {
    const img = document.createElement('img')
    img.src = base64
    img.className = className
    return img
}

/**
 * Validate image file
 */
export function validateImageFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
        throw new Error('نوع الملف غير مدعوم. الرجاء استخدام JPG أو PNG')
    }

    if (file.size > maxSize) {
        throw new Error('حجم الملف كبير جداً. الحد الأقصى 10MB')
    }

    return true
}
