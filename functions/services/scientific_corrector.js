'use strict';

/**
 * Compatibility-only, mission-neutral transcription boundary.
 *
 * Legacy page-numbered NEET/JEE scientific substitutions and unrestricted
 * generative rewrites are retired. Never silently change official source
 * wording: any proposed scientific correction needs separate source-bound
 * evidence and Founder approval.
 */
async function correctScientificText(rawOcrText, _pageNumber) {
  return {
    correctedText: rawOcrText,
    corrections: [],
    correctionState: 'UNMODIFIED_AWAITING_FOUNDER_REVIEW'
  };
}

module.exports = { correctScientificText };
