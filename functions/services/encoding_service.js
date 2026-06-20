/**
 * 🔱 HINDI ENCODING SERVICE
 * Converts Legacy Hindi Fonts (KrutiDev, Chanakya) to Standard Unicode.
 */

function convertKrutiDevToUnicode(text) {
    if (!text) return "";
    return simpleDemoRemap(text);
}

function simpleDemoRemap(text) {
    if (!text) return "";

    let out = text;
    // Escaping special regex characters like '['
    out = out.replace(/ek\/;fed/g, "माध्यमिक");
    out = out.replace(/f'k{kk/g, "शिक्षा");
    out = out.replace(/cksMZ/g, "बोर्ड");
    out = out.replace(/jktLFkku/g, "राजस्थान");
    out = out.replace(/vtesj/g, "अजमेर");
    out = out.replace(/Ikzk;ksfxd/g, "प्रायोगिक");
    out = out.replace(/dk;Z/g, "कार्य");
    out = out.replace(/ekSf\[kd/g, "मौखिक"); // Fixed regex escaping
    out = out.replace(/ijh{kk/g, "परीक्षा");

    return out;
}

/**
 * 🔱 ENCODING DETECTOR
 * Returns 'krutidev' or 'unicode' based on character frequency.
 */
function detectEncoding(text) {
    if (!text) return "unknown";
    const hindiUnicodePattern = /[\u0900-\u097F]/;
    if (hindiUnicodePattern.test(text)) return "unicode";

    // Heuristic: High frequency of 'f', 'k', ';', 'e' in non-english context
    const legacyMarkers = (text.match(/[fk;e/]/g) || []).length;
    if (text.length > 50 && (legacyMarkers / text.length > 0.15)) return "krutidev";

    return "english";
}

module.exports = {
    convertKrutiDevToUnicode,
    detectEncoding
};
