import { authStore } from '../store/authStore';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * AI Service for communicating with the backend AI routines
 */
export const aiService = {
    /**
     * Scan image for odometer reading
     * @param {string} imageBase64 
     */
    scanOdometer: async (imageBase64) => {
        try {
            const token = authStore.getState().token;
            const response = await fetch(`${API_BASE_URL}/ai/ocr-odometer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image: imageBase64 })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        } catch (error) {
            console.error('Scan Odometer Error:', error);
            throw error;
        }
    },

    /**
     * Scan image for plate number
     * @param {string} imageBase64 
     */
    scanPlate: async (imageBase64) => {
        try {
            const token = authStore.getState().token;
            const response = await fetch(`${API_BASE_URL}/ai/alpr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image: imageBase64 })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        } catch (error) {
            console.error('Scan Plate Error:', error);
            throw error;
        }
    },

    /**
     * Analyze image for external damage
     * @param {string} imageBase64 
     */
    analyzeDamage: async (imageBase64) => {
        try {
            const token = authStore.getState().token;
            const response = await fetch(`${API_BASE_URL}/ai/detect-damage`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ image: imageBase64 })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            return result.data;
        } catch (error) {
            console.error('Damage Analysis Error:', error);
            throw error;
        }
    }
};
