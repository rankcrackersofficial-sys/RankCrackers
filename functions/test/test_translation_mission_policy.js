'use strict';

const assert = require('assert');
const {
  assertTranslationRequest,
  normalizeMissionTranslationPolicy,
  resolveStudentDelivery,
} = require('../services/translation_mission_policy');

function policy(overrides = {}) {
  return normalizeMissionTranslationPolicy({
    missionId: 'mission-1',
    cycleId: 'cycle-1',
    paperId: 'paper-1',
    sectionId: 'section-1',
    ...overrides,
  });
}

const requested = assertTranslationRequest(policy(), {
  sourceHash: 'sha-1',
  sourceVersion: 'v1',
});
assert.strictEqual(requested.targetLanguage, 'HINDI');
assert.strictEqual(requested.status, 'REQUESTED');

assert.throws(
  () => normalizeMissionTranslationPolicy({ missionId: 'm', cycleId: 'c', paperId: 'p' }),
  error => error.code === 'TRANSLATION_BINDING_REQUIRED',
);

assert.throws(
  () => assertTranslationRequest(policy({ assessmentLanguageSection: true }), { sourceHash: 's', sourceVersion: 'v' }),
  error => error.code === 'ASSESSMENT_LANGUAGE_EXCLUDED',
);

const approved = resolveStudentDelivery(
  { ...requested, sourceHash: 'sha-1', sourceVersion: 'v1' },
  {
    sourceHash: 'sha-1',
    sourceVersion: 'v1',
    publicationState: 'STUDENT_READY',
    reviewStatus: 'APPROVED',
    text: 'हिंदी अध्ययन सामग्री',
    englishText: 'English study material',
  },
);
assert.deepStrictEqual(approved, { language: 'HINDI', text: 'हिंदी अध्ययन सामग्री', fallback: false });

const stale = resolveStudentDelivery(
  { ...requested, sourceHash: 'sha-1', sourceVersion: 'v1' },
  {
    sourceHash: 'sha-old',
    sourceVersion: 'v0',
    publicationState: 'STUDENT_READY',
    reviewStatus: 'APPROVED',
    text: 'पुराना अनुवाद',
    englishText: 'English study material',
  },
);
assert.deepStrictEqual(stale, { language: 'ENGLISH', text: 'English study material', fallback: true });

console.log('translation mission policy tests: PASS');
