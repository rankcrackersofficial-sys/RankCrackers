'use strict';

function assertExternalOcrAllowed(environment = process.env) {
  const projectIds = [environment.GCLOUD_PROJECT, environment.GOOGLE_CLOUD_PROJECT,
    environment.FIREBASE_PROJECT_ID].filter(value => typeof value === 'string');
  if (environment.FIRESTORE_EMULATOR_HOST || environment.FIREBASE_STORAGE_EMULATOR_HOST
      || projectIds.some(id => id.startsWith('demo-'))) {
    throw new Error('RC_MISSION_OCR_EXTERNAL_PROVIDER_FORBIDDEN_IN_EMULATOR');
  }
  return true;
}

// Official notification/syllabus OCR is a transcription draft. A generic
// mission worker must not silently apply NEET-specific formulas or call an
// unconstrained generative correction model before Founder source review.
function buildGovernedOcrDraft(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('RC_MISSION_OCR_EMPTY_TRANSCRIPTION');
  }
  if (/simulated text|placeholder/i.test(rawText)) {
    throw new Error('RC_MISSION_OCR_SYNTHETIC_TRANSCRIPTION_FORBIDDEN');
  }
  return Object.freeze({
    correctedText: rawText,
    corrections: [],
    correctionState: 'UNMODIFIED_AWAITING_FOUNDER_REVIEW',
  });
}

module.exports = { assertExternalOcrAllowed, buildGovernedOcrDraft };
