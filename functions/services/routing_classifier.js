/**
 * Governed Multi-Signal Routing Classifier
 * Responsibility: Classifies a PDF page into NATIVE, SCANNED, AMBIGUOUS, or INVALID
 */
function classifyRouting(pageNumber, nativeText, totalPages) {
  if (typeof pageNumber !== 'number' || typeof totalPages !== 'number') {
    return 'INVALID';
  }
  if (pageNumber < 1 || pageNumber > totalPages) {
    return 'INVALID';
  }

  const trimmedText = (nativeText || '').trim();
  if (!trimmedText) {
    return 'SCANNED'; // No text layer at all
  }

  // 1. Clean out the standard template header and footer blocks
  const cleanedText = trimmedText
    .replace(/राष्ट्रीय परीक्षा एजेंसी/g, '')
    .replace(/National Testing Agency/g, '')
    .replace(/Excellence in Assessment/g, '')
    .replace(/INFORMATION BULLETIN NEET \(UG\)-2026\s*\d*/gi, '')
    .replace(/File No\..*$/gim, '')
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '') // Clean "-- 1 of 1 --"
    .replace(/\s+/g, ' ')
    .trim();

  // 2. Extract alphabetical/word characters to verify if there is a genuine text layer
  const lettersOnly = cleanedText.replace(/[^a-zA-Z\u0900-\u097F]/g, '');
  const bodyLength = cleanedText.length;

  // 3. Classify based on genuine text presence and length
  if (lettersOnly.length === 0) {
    return 'SCANNED'; // Only template artifacts/numbers/punctuation remain
  }

  if (bodyLength < 100) {
    return 'AMBIGUOUS'; // Very short text layer (held for verification)
  }

  return 'NATIVE';
}

module.exports = {
  classifyRouting
};
