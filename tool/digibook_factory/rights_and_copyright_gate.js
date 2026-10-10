/**
 * RIGHTS AND COPYRIGHT GATE
 * Enforces copyright laws, licensing gates, and intellectual property compliance
 * across all DigiBook source intelligence pipelines.
 */

const RightsClassification = {
  PUBLIC_DOMAIN: 'PUBLIC_DOMAIN',
  OPEN_LICENSE_COMPATIBLE: 'OPEN_LICENSE_COMPATIBLE',
  LICENSED_FOR_USE: 'LICENSED_FOR_USE',
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PUBLIC_FACTUAL_REFERENCE_ONLY: 'PUBLIC_FACTUAL_REFERENCE_ONLY',
  RESTRICTED_COPYRIGHT: 'RESTRICTED_COPYRIGHT',
  UNKNOWN_RIGHTS: 'UNKNOWN_RIGHTS',
};

class RightsAndCopyrightGate {
  /**
   * Evaluates whether source content is eligible for ingestion.
   * Returns { allowed: boolean, reason: string, mode: 'VERBATIM_ALLOWED' | 'FACTUAL_SYNTHESIS_ONLY' | 'REJECTED' }
   */
  static evaluateSource(sourceRecord) {
    const rights = sourceRecord.rightsStatus;

    if (!rights || rights === RightsClassification.UNKNOWN_RIGHTS) {
      return {
        allowed: false,
        status: 'HELD_RIGHTS',
        mode: 'REJECTED',
        reason: 'Rights status is UNKNOWN. Must fail closed.',
      };
    }

    if (rights === RightsClassification.RESTRICTED_COPYRIGHT) {
      return {
        allowed: false,
        status: 'HELD_RIGHTS',
        mode: 'REJECTED',
        reason: 'Protected under restricted commercial copyright without permission.',
      };
    }

    if (rights === RightsClassification.PUBLIC_FACTUAL_REFERENCE_ONLY) {
      return {
        allowed: true,
        status: 'APPROVED_FACTUAL_SYNTHESIS',
        mode: 'FACTUAL_SYNTHESIS_ONLY',
        reason: 'Authorized for independent factual synthesis only. Verbatim reproduction forbidden.',
      };
    }

    if (
      rights === RightsClassification.PUBLIC_DOMAIN ||
      rights === RightsClassification.OPEN_LICENSE_COMPATIBLE ||
      rights === RightsClassification.LICENSED_FOR_USE ||
      rights === RightsClassification.PERMISSION_GRANTED
    ) {
      return {
        allowed: true,
        status: 'APPROVED_LICENSED',
        mode: 'VERBATIM_ALLOWED',
        reason: 'Authorized under compatible licence or public domain.',
      };
    }

    return {
      allowed: false,
      status: 'HELD_RIGHTS',
      mode: 'REJECTED',
      reason: 'Unrecognized rights classification.',
    };
  }

  /**
   * Verifies that generated DigiBook content does not contain verbatim copyright infringement.
   */
  static verifyContentSafety(candidateText, restrictedSourceText) {
    if (!candidateText || !restrictedSourceText) return true;

    // Check for large identical verbatim n-grams (e.g. 15+ consecutive words)
    const normalize = str => str.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(Boolean);
    const candidateWords = normalize(candidateText);
    const sourceWords = normalize(restrictedSourceText);

    if (candidateWords.length < 15 || sourceWords.length < 15) return true;

    const nGramSize = 15;
    const sourceGrams = new Set();
    for (let i = 0; i <= sourceWords.length - nGramSize; i++) {
      sourceGrams.add(sourceWords.slice(i, i + nGramSize).join(' '));
    }

    for (let i = 0; i <= candidateWords.length - nGramSize; i++) {
      const candidateGram = candidateWords.slice(i, i + nGramSize).join(' ');
      if (sourceGrams.has(candidateGram)) {
        return false; // Verbatim overlap detected!
      }
    }

    return true; // Factual independent synthesis verified
  }
}

module.exports = { RightsAndCopyrightGate, RightsClassification };
