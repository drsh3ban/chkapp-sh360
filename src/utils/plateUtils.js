/**
 * Saudi Arabia License Plate Letter Mapping
 * Complete mapping of all Arabic letters used on Saudi plates to their English equivalents
 * 
 * Usage Guide for Adding Cars:
 * ---------------------------
 * When adding a new car, enter the plate number in either format:
 * - Arabic: ب و ه 1179
 * - English: B U H 1179
 * - Mixed: بوه 1179 or BUH1179
 * 
 * The AI will recognize the plate in any format and match it automatically.
 */

// Complete Saudi Plate Arabic to English Letter Mapping
export const SAUDI_PLATE_LETTERS = {
    // Standard Letters (17 letters used on Saudi plates)
    'ا': 'A',  // Alif
    'ب': 'B',  // Ba
    'ح': 'J',  // Ha (mapped to J in Saudi system)
    'د': 'D',  // Dal
    'ر': 'R',  // Ra
    'س': 'S',  // Sin
    'ص': 'X',  // Sad (mapped to X)
    'ط': 'T',  // Ta
    'ع': 'E',  // Ain (mapped to E)
    'ق': 'G',  // Qaf (mapped to G)
    'ك': 'K',  // Kaf
    'ل': 'L',  // Lam
    'م': 'M',  // Mim
    'ن': 'N',  // Nun
    'ه': 'H',  // Ha
    'و': 'U',  // Waw (mapped to U)
    'ى': 'V',  // Ya (mapped to V)
    'ي': 'Z',  // Ya with dots (mapped to Z)
};

// Reverse mapping (English to Arabic)
export const ENGLISH_TO_ARABIC_PLATE = Object.fromEntries(
    Object.entries(SAUDI_PLATE_LETTERS).map(([ar, en]) => [en, ar])
);

/**
 * Normalize a plate string for comparison
 * - Removes spaces
 * - Converts Arabic letters to English
 * - Converts to uppercase
 */
export function normalizePlate(plateText) {
    if (!plateText) return '';

    let normalized = plateText.toUpperCase().replace(/\s+/g, '');

    Object.keys(SAUDI_PLATE_LETTERS).forEach(arabicLetter => {
        normalized = normalized.replace(new RegExp(arabicLetter, 'g'), SAUDI_PLATE_LETTERS[arabicLetter]);
    });

    return normalized;
}

/**
 * Extract only numbers from a plate string
 */
export function extractPlateNumbers(plateText) {
    if (!plateText) return '';
    return plateText.replace(/[^0-9]/g, '');
}

/**
 * Check if two plates match (fuzzy matching)
 * Handles Arabic/English variations, spacing, and number matching
 */
export function platesMatch(plate1, plate2) {
    const norm1 = normalizePlate(plate1);
    const norm2 = normalizePlate(plate2);
    const nums1 = extractPlateNumbers(plate1);
    const nums2 = extractPlateNumbers(plate2);

    // Exact normalized match
    if (norm1 === norm2) return true;

    // One contains the other
    if (norm1.includes(norm2) || norm2.includes(norm1)) return true;

    // Number-based matching (at least 3 digits)
    if (nums1.length >= 3 && nums2.length >= 3) {
        if (nums1.includes(nums2) || nums2.includes(nums1)) return true;
    }

    return false;
}
