'use strict';

// A PDF's physical page index comes from the verified parent PDF bytes.
// Printed folio numbers are optional editorial evidence and MUST NOT be
// inferred from an exam name or a fixed cover-page offset.
function assessPrintedPageEvidence(rawText, expectedPrintedPageNumber = null) {
  if (expectedPrintedPageNumber != null &&
      (!Number.isSafeInteger(expectedPrintedPageNumber) || expectedPrintedPageNumber < 1)) {
    throw new Error('SCANNED_PRINTED_PAGE_EXPECTATION_INVALID');
  }

  const lines = String(rawText || '').trim().split(/\r?\n/).slice(-4);
  const detectedNumbers = lines.map(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:page\s*)?(\d{1,5})\s*$/i)
      || trimmed.match(/^\d{1,5}\s+of\s+\d{1,5}$/i);
    if (!match) return null;
    return Number(match[1] || trimmed.split(/\s+/)[0]);
  }).filter(value => Number.isSafeInteger(value) && value > 0);

  const detected = detectedNumbers.length ? detectedNumbers[0] : null;
  if (expectedPrintedPageNumber == null) {
    return Object.freeze({ status: 'UNMAPPED', expected: null, detected });
  }
  return Object.freeze({
    status: detectedNumbers.includes(expectedPrintedPageNumber) ? 'MATCH' :
      (detectedNumbers.length ? 'MISMATCH' : 'MISSING'),
    expected: expectedPrintedPageNumber, detected,
  });
}

module.exports = { assessPrintedPageEvidence };
