/**
 * Lightweight Arabic Reshaper for jsPDF
 * Maps Arabic characters to their positional forms (Isolated, Initial, Medial, Final)
 */

const ARABIC_FORMS = {
    // Char: [Isolated, End, Middle, Beginning]
    '\u0627': ['\uFE8D', '\uFE8E', '\uFE8E', '\uFE8D'], // Alif
    '\u0628': ['\uFE8F', '\uFE90', '\uFE92', '\uFE91'], // Ba
    '\u062A': ['\uFE95', '\uFE96', '\uFE98', '\uFE97'], // Ta
    '\u062B': ['\uFE99', '\uFE9A', '\uFE9C', '\uFE9B'], // Tha
    '\u062C': ['\uFE9D', '\uFE9E', '\uFEA0', '\uFE9F'], // Jeem
    '\u062D': ['\uFEA1', '\uFEA2', '\uFEA4', '\uFEA3'], // Ha
    '\u062E': ['\uFEA5', '\uFEA6', '\uFEA8', '\uFEA7'], // Kha
    '\u062F': ['\uFEA9', '\uFEAA', '\uFEAA', '\uFEA9'], // Dal
    '\u0630': ['\uFEAB', '\uFEAC', '\uFEAC', '\uFEAB'], // Thal
    '\u0631': ['\uFEAD', '\uFEAE', '\uFEAE', '\uFEAD'], // Ra
    '\u0632': ['\uFEAF', '\uFEB0', '\uFEB0', '\uFEAF'], // Zay
    '\u0633': ['\uFEB1', '\uFEB2', '\uFEB4', '\uFEB3'], // Seen
    '\u0634': ['\uFEB5', '\uFEB6', '\uFEB8', '\uFEB7'], // Sheen
    '\u0635': ['\uFEB9', '\uFEBA', '\uFEBC', '\uFEBB'], // Sad
    '\u0636': ['\uFEBD', '\uFEBE', '\uFEC0', '\uFEBF'], // Dad
    '\u0637': ['\uFEC1', '\uFEC2', '\uFEC4', '\uFEC3'], // Tah
    '\u0638': ['\uFEC5', '\uFEC6', '\uFEC8', '\uFEC7'], // Zah
    '\u0639': ['\uFEC9', '\uFECA', '\uFECC', '\uFECB'], // Ain
    '\u063A': ['\uFECD', '\uFECE', '\uFED0', '\uFECF'], // Ghain
    '\u0641': ['\uFED1', '\uFED2', '\uFED4', '\uFED3'], // Fa
    '\u0642': ['\uFED5', '\uFED6', '\uFED8', '\uFED7'], // Qaf
    '\u0643': ['\uFED9', '\uFEDA', '\uFEDC', '\uFEDB'], // Kaf
    '\u0644': ['\uFEDD', '\uFEDE', '\uFEE0', '\uFEDF'], // Lam
    '\u0645': ['\uFEE1', '\uFEE2', '\uFEE4', '\uFEE3'], // Meem
    '\u0646': ['\uFEE5', '\uFEE6', '\uFEE8', '\uFEE7'], // Noon
    '\u0647': ['\uFEE9', '\uFEEA', '\uFEEC', '\uFEEB'], // Heh
    '\u0648': ['\uFEED', '\uFEEE', '\uFEEE', '\uFEED'], // Waw
    '\u064A': ['\uFEF1', '\uFEF2', '\uFEF4', '\uFEF3'], // Yeh
    '\u0622': ['\uFE81', '\uFE82', '\uFE82', '\uFE81'], // Alif Mad
    '\u0623': ['\uFE83', '\uFE84', '\uFE84', '\uFE83'], // Alif Hamza Above
    '\u0624': ['\uFE85', '\uFE86', '\uFE86', '\uFE85'], // Waw Hamza
    '\u0625': ['\uFE87', '\uFE88', '\uFE88', '\uFE87'], // Alif Hamza Below
    '\u0626': ['\uFE89', '\uFE8A', '\uFE8C', '\uFE8B'], // Yeh Hamza
    '\u0629': ['\uFE93', '\uFE94', '\uFE94', '\uFE93'], // Teh Marbuta
    '\u0649': ['\uFEEF', '\uFEF0', '\uFEF0', '\uFEEF'], // Alif Maksura
    '\u0640': ['\u0640', '\u0640', '\u0640', '\u0640'], // Tatweel
    // Lam-Alif Ligatures (Isolated forms, as they don't connect further)
    '\uFEFB': ['\uFEFB', '\uFEFC', '\uFEFC', '\uFEFB'], // Lam + Alif
    '\uFEF5': ['\uFEF5', '\uFEF6', '\uFEF6', '\uFEF5'], // Lam + Alif Mad
    '\uFEF7': ['\uFEF7', '\uFEF8', '\uFEF8', '\uFEF7'], // Lam + Alif Hamza Above
    '\uFEF9': ['\uFEF9', '\uFEFA', '\uFEFA', '\uFEF9'], // Lam + Alif Hamza Below
};

const CONNECT_BEFORE = ['\u0627', '\u0622', '\u0623', '\u0625', '\u0624', '\u062F', '\u0630', '\u0631', '\u0632', '\u0648', '\u0629', '\u0649', '\uFEFB', '\uFEF5', '\uFEF7', '\uFEF9'];

export function reshapeArabic(text) {
    if (!text) return '';

    // Regex to find Arabic blocks (including some punctuation/spaces that belong to the Arabic flow)
    // We'll be simpler: find continuous blocks of Arabic characters
    const arabicRegex = /[\u0600-\u06FF\uFE70-\uFEFF]+/g;

    return text.replace(arabicRegex, (match) => {
        // Pre-process Lam-Alif ligatures for this block
        let processed = match
            .replace(/\u0644\u0627/g, '\uFEFB') // Lam + Alif
            .replace(/\u0644\u0622/g, '\uFEF5') // Lam + Alif Mad
            .replace(/\u0644\u0623/g, '\uFEF7') // Lam + Alif Hamza Above
            .replace(/\u0644\u0625/g, '\uFEF9'); // Lam + Alif Hamza Below

        let reshaped = '';
        for (let i = 0; i < processed.length; i++) {
            const char = processed[i];
            const forms = ARABIC_FORMS[char];

            if (!forms) {
                reshaped += char;
                continue;
            }

            const prev = i > 0 ? processed[i - 1] : null;
            const next = i < processed.length - 1 ? processed[i + 1] : null;

            const prevConnects = prev && ARABIC_FORMS[prev] && !CONNECT_BEFORE.includes(prev);
            const nextConnects = next && ARABIC_FORMS[next];

            if (prevConnects && nextConnects) {
                reshaped += forms[2]; // Medial
            } else if (prevConnects) {
                reshaped += forms[1]; // Final
            } else if (nextConnects) {
                reshaped += forms[3]; // Initial
            } else {
                reshaped += forms[0]; // Isolated
            }
        }

        // Reverse reshaped Arabic segment for LTR display
        return reshaped.split('').reverse().join('');
    });
}
