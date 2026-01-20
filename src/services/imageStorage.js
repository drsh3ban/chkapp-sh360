
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { storage } from './firebaseConfig';
import { ref, uploadString, getDownloadURL } from "firebase/storage";

export const ImageStorageService = {
    /**
     * Check and request permissions
     */
    checkPermissions: async () => {
        if (!Capacitor.isNativePlatform()) return true;

        try {
            const status = await Filesystem.checkPermissions();
            if (status.publicStorage !== 'granted') {
                const request = await Filesystem.requestPermissions();
                return request.publicStorage === 'granted';
            }
            return true;
        } catch (e) {
            console.error('Error checking permissions:', e);
            return false;
        }
    },

    /**
     * Save a base64 image to the filesystem
     * @param {string} base64Data - The base64 string of the image
     * @param {string} type - 'entry', 'exit', 'damage', etc.
     * @returns {Promise<string>} - The filepath of the saved image
     */
    saveImage: async (base64Data, type = 'img') => {
        // If running on web (not native), just return the base64 as the "path"
        if (!Capacitor.isNativePlatform()) {
            return base64Data;
        }

        try {
            // Pre-emptively check permissions
            const hasPermission = await ImageStorageService.checkPermissions();
            if (!hasPermission) {
                throw new Error('لم يتم منح صلاحيات الوصول للذاكرة. يرجى تفعيلها من إعدادات التطبيق.');
            }

            const fileName = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.jpg`;

            // Ensure we Strip the prefix if present (e.g. "data:image/jpeg;base64,")
            // Filesystem.writeFile expects pure base64 string for data
            const data = base64Data.includes(',')
                ? base64Data.split(',')[1]
                : base64Data;

            const savedFile = await Filesystem.writeFile({
                path: fileName,
                data: data,
                directory: Directory.Data
            });

            // Return the full URI to be stored in localStorage
            return savedFile.uri;
        } catch (e) {
            console.error('Error saving image to filesystem:', e);
            // On native, DO NOT return base64 as fallback, it crashes localStorage
            if (Capacitor.isNativePlatform()) {
                throw new Error('فشل حفظ الصورة في ذاكرة الجهاز: ' + e.message);
            }
            return base64Data;
        }
    },

    /**
     * Load an image for display
     * @param {string} pathOrBase64 - The filepath or base64 string
     * @returns {Promise<string>} - A displayable source (base64 or capacitor:// url)
     */
    loadImage: async (pathOrBase64) => {
        if (!pathOrBase64) return null;

        // If it looks like base64, return it as is
        if (pathOrBase64.startsWith('data:image')) {
            return pathOrBase64;
        }

        // If on web, and it's not base64, it might be a mock path, return null or placeholder
        if (!Capacitor.isNativePlatform()) {
            return pathOrBase64; // In web mock mode we might just store base64, so this case is rare
        }

        // If it's a native file path (starts with file:// or content:// or is just a filename)
        // We can use Capacitor.convertFileSrc to get a displayable URL for the WebView
        try {
            // If it's a full URI returned by writeFile
            return Capacitor.convertFileSrc(pathOrBase64);
        } catch (e) {
            console.error('Error loading image:', e);
            return null;
        }
    },

    /**
     * Delete an image file
     */
    deleteImage: async (path) => {
        if (!Capacitor.isNativePlatform() || !path || path.startsWith('data:image')) return;

        try {
            // Implementation of delete is non-critical for the crash fix
        } catch (e) {
            console.error("Failed to delete image", e);
        }
    },

    /**
     * Read image as raw base64 data (useful for PDF/scanners)
     * @param {string} pathOrBase64 - The filepath or base64 string
     * @returns {Promise<string|null>} - Pure base64 data without prefix, or null
     */
    readAsBase64: async (pathOrBase64) => {
        if (!pathOrBase64) return null;
        if (pathOrBase64.startsWith('data:image')) {
            return pathOrBase64.split(',')[1] || pathOrBase64;
        }

        if (!Capacitor.isNativePlatform()) {
            return pathOrBase64;
        }

        try {
            // Strip any protocol if present for native filesystem read
            // If it's a URI, extract the filename (the last part)
            const cleanPath = pathOrBase64.includes('://')
                ? pathOrBase64.split('://').pop()
                : pathOrBase64;
            const filename = cleanPath.includes('/')
                ? cleanPath.split('/').pop()
                : cleanPath;

            const result = await Filesystem.readFile({
                path: filename,
                directory: Directory.Data
            });
            return result.data; // Already base64 from Capacitor
        } catch (e) {
            console.error('Error reading base64 from filesystem:', e);
            return null;
        }
    },

    /**
     * Upload an image to Firebase Cloud Storage
     * @param {string} base64Data - The base64 string of the image (with or without prefix)
     * @param {string} fileName - The desired filename in storage
     * @returns {Promise<string>} - The download URL of the uploaded image
     */
    uploadToFirebase: async (base64Data, fileName) => {
        try {
            // Ensure data has the correct prefix for uploadString with "data_url" format
            let dataUrl = base64Data;
            if (!base64Data.startsWith('data:image')) {
                dataUrl = `data:image/jpeg;base64,${base64Data}`;
            }

            const storageRef = ref(storage, `movements/${fileName}`);
            const uploadResult = await uploadString(storageRef, dataUrl, 'data_url');
            const downloadURL = await getDownloadURL(uploadResult.ref);

            console.log('File uploaded to Firebase:', downloadURL);
            return downloadURL;
        } catch (e) {
            console.error('Firebase upload failed:', e);
            throw new Error('فشل رفع الصورة إلى Firebase: ' + e.message);
        }
    }
};
