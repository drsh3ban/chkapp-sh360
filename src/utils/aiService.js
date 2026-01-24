import { CapacitorHttp } from '@capacitor/core';

// Cloud Proxy URL - Deployed on Google Cloud Run
const AI_PROXY_URL = "https://autocheck-ai-proxy-431562244942.europe-west1.run.app";

/**
 * AI Service for communicating with Gemini AI via Secure Cloud Proxy
 * v1.1.25 - ULTIMATE CLOUD PROXY SOLUTION
 */
export const aiService = {
    /**
     * Scan image for plate number via Cloud Proxy
     */
    scanPlate: async (imageBase64) => {
        try {
            const response = await CapacitorHttp.post({
                url: `${AI_PROXY_URL}/api/scan-plate`,
                headers: { 'Content-Type': 'application/json' },
                data: { imageBase64 }
            });

            if (response.status !== 200) {
                const msg = response.data?.error || `HTTP ${response.status}`;
                throw new Error(`فشل التعرف على اللوحة: ${msg}`);
            }

            return { plate: response.data.plate };
        } catch (error) {
            console.error('Plate Scan (Proxy) Error:', error);
            throw new Error(`فشل التعرف على اللوحة: ${error.message}`);
        }
    },

    /**
     * Scan image for odometer reading via Cloud Proxy
     */
    scanOdometer: async (imageBase64) => {
        try {
            const response = await CapacitorHttp.post({
                url: `${AI_PROXY_URL}/api/scan-odometer`,
                headers: { 'Content-Type': 'application/json' },
                data: { imageBase64 }
            });

            if (response.status !== 200) {
                const msg = response.data?.error || `HTTP ${response.status}`;
                throw new Error(`فشل قراءة العداد: ${msg}`);
            }

            return { reading: response.data.reading || "0" };
        } catch (error) {
            console.error('Odometer Scan (Proxy) Error:', error);
            throw new Error(`فشل قراءة العداد: ${error.message}`);
        }
    },

    /**
     * Analyze image for external damage via Cloud Proxy
     */
    analyzeDamage: async (imageBase64) => {
        try {
            const prompt = "Analyze this car image for any external body damage (dents, scratches, broken lights). Return a JSON object with 'hasDamage': boolean and 'summary': string (brief summary in Arabic).";

            const response = await CapacitorHttp.post({
                url: `${AI_PROXY_URL}/api/vision`,
                headers: { 'Content-Type': 'application/json' },
                data: { imageBase64, prompt }
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'AI processing failed');
            }

            const text = response.data.text;
            try {
                const jsonStr = text.match(/\{.*\}/s)?.[0] || '{"hasDamage": false, "summary": ""}';
                return JSON.parse(jsonStr);
            } catch (e) {
                return {
                    hasDamage: text.toLowerCase().includes('yes') || text.toLowerCase().includes('damage'),
                    summary: text.slice(0, 100)
                };
            }
        } catch (error) {
            console.error('Damage Analysis (Proxy) Error:', error);
            throw new Error(`فشل تحليل الأضرار: ${error.message}`);
        }
    },

    /**
     * Analyze all car photos for comprehensive condition report
     * @param {Array} photos - Array of {id, data} objects
     * @param {string} type - 'exit' or 'return'
     * @returns {Object} { findings, summary, overallCondition, totalIssues }
     */
    analyzeCondition: async (photos, type) => {
        try {
            const slotLabels = {
                front: 'الأمامية',
                back: 'الخلفية',
                right1: 'اليمين (1)',
                right2: 'اليمين (2)',
                left1: 'اليسار (1)',
                left2: 'اليسار (2)',
                interior: 'الداخلية',
                dash: 'الطبلون'
            };

            // Transform photos to API format
            const photoData = photos.map(p => ({
                position: slotLabels[p.id] || p.id,
                base64: p.data
            }));

            const response = await CapacitorHttp.post({
                url: `${AI_PROXY_URL}/api/analyze-condition`,
                headers: { 'Content-Type': 'application/json' },
                data: { photos: photoData, type }
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'فشل تحليل الحالة');
            }

            return {
                analyzedAt: response.data.analyzedAt || new Date().toISOString(),
                findings: response.data.findings || [],
                summary: response.data.summary || '',
                overallCondition: response.data.overallCondition || 'unknown',
                totalIssues: response.data.totalIssues || 0
            };
        } catch (error) {
            console.error('Condition Analysis Error:', error);
            throw new Error(`فشل تحليل حالة السيارة: ${error.message}`);
        }
    },

    /**
     * Compare two photos (exit vs return) to detect new damage
     * @param {string} exitPhotoBase64 - Base64 of the exit photo
     * @param {string} returnPhotoBase64 - Base64 of the return photo  
     * @param {string} position - Position label (e.g., "الأمامية", "الخلفية")
     * @returns {Object} { hasDifference, severity, description }
     */
    compareDamage: async (exitPhotoBase64, returnPhotoBase64, position) => {
        try {
            const response = await CapacitorHttp.post({
                url: `${AI_PROXY_URL}/api/compare-damage`,
                headers: { 'Content-Type': 'application/json' },
                data: {
                    exitImageBase64: exitPhotoBase64,
                    returnImageBase64: returnPhotoBase64,
                    position
                }
            });

            if (response.status !== 200) {
                throw new Error(response.data?.error || 'فشل المقارنة');
            }

            return {
                hasDifference: response.data.hasDifference || false,
                severity: response.data.severity || 'none',
                description: response.data.description || ''
            };
        } catch (error) {
            console.error('Damage Comparison Error:', error);
            throw new Error(`فشل مقارنة الصور: ${error.message}`);
        }
    },

    /**
     * Compare all matching photo pairs between exit and return
     * @param {Array} exitPhotos - Array of exit photos with slot ids
     * @param {Array} returnPhotos - Array of return photos with slot ids
     * @returns {Array} Array of comparison results
     */
    compareAllPhotos: async (exitPhotos, returnPhotos) => {
        const results = [];
        const slotLabels = {
            front: 'الأمامية',
            back: 'الخلفية',
            right1: 'اليمين (1)',
            right2: 'اليمين (2)',
            left1: 'اليسار (1)',
            left2: 'اليسار (2)',
            interior: 'الداخلية',
            dash: 'الطبلون'
        };

        for (const exitPhoto of exitPhotos) {
            // Find matching return photo by slot ID
            const returnPhoto = returnPhotos.find(p => p.id === exitPhoto.id);

            if (returnPhoto) {
                try {
                    const result = await aiService.compareDamage(
                        exitPhoto.data,
                        returnPhoto.data,
                        slotLabels[exitPhoto.id] || exitPhoto.id
                    );

                    results.push({
                        slot: exitPhoto.id,
                        label: slotLabels[exitPhoto.id] || exitPhoto.id,
                        ...result
                    });
                } catch (e) {
                    console.error(`Comparison failed for ${exitPhoto.id}:`, e);
                    results.push({
                        slot: exitPhoto.id,
                        label: slotLabels[exitPhoto.id] || exitPhoto.id,
                        hasDifference: false,
                        severity: 'error',
                        description: 'فشل في المقارنة'
                    });
                }
            }
        }

        return results;
    }
};
