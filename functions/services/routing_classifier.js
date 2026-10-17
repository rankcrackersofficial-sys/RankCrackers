'use strict';

/**
 * Mission-agnostic PDF page routing.
 * A page is classified exclusively by structural/text-layer evidence,
 * never by an exam name, authority, school subject or page offset.
 */
function classifyRouting(pageNumber, nativeText, totalPages) {
  if (!Number.isSafeInteger(pageNumber) || !Number.isSafeInteger(totalPages)
      || totalPages < 1 || pageNumber < 1 || pageNumber > totalPages) return 'INVALID';
  if (typeof nativeText !== 'string') return nativeText == null ? 'SCANNED' : 'INVALID';
  const trimmed = nativeText.trim();
  if (!trimmed) return 'SCANNED';

  // Only generic page-counter furniture may be ignored. Do not strip
  // organization names, bulletin titles, paper names or academic content.
  const content = trimmed
    .replace(/^\s*(?:--\s*)?(?:page\s*)?\d+\s+(?:of|\/)\s+\d+\s*(?:--)?\s*$/gim, '')
    .replace(/\s+/g, ' ')
    .trim();
  const letters = content.match(/\p{L}/gu) || [];
  if (letters.length === 0) return 'SCANNED';
  const words = content.split(/\s+/).filter(Boolean);
  // Official PDFs frequently contain short but valid index, table, or
  // section-heading pages. Once a real text layer is present, routing must
  // not fail closed merely because the page is concise; empty text is the
  // only native-layer signal that requires OCR routing.
  const structuredHeading = words.length >= 5 && letters.length >= 20;
  if (content.length < 100 && !structuredHeading) return 'AMBIGUOUS';
  return 'NATIVE';
}

module.exports = { classifyRouting };
