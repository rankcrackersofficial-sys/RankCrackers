'use strict';

const assert = require('assert');
const {
  assertTranslationRequest,
  buildTranslationIssue,
  normalizeMissionTranslationPolicy,
  resolveStudentDelivery,
  validateTranslationCandidate,
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

const candidate = validateTranslationCandidate(requested, {
  sourceHash: 'sha-1',
  sourceVersion: 'v1',
  targetLanguage: 'HINDI',
  provider: 'approved-provider',
  providerReady: true,
  glossaryVersion: 'glossary-v1',
  semanticStructureValid: true,
  text: 'हिंदी अध्ययन सामग्री',
});
assert.strictEqual(candidate.reviewStatus, 'PENDING');
assert.strictEqual(candidate.publicationState, 'REVIEW_REQUIRED');

assert.throws(
  () => validateTranslationCandidate(requested, { ...candidate, providerReady: false }),
  error => error.code === 'TRANSLATION_PROVIDER_NOT_READY',
);
assert.throws(
  () => validateTranslationCandidate(requested, { ...candidate, semanticStructureValid: false }),
  error => error.code === 'SEMANTIC_STRUCTURE_INVALID',
);

const issue = buildTranslationIssue(requested, {
  code: 'GLOSSARY_MISMATCH',
  message: 'Term differs from the approved glossary.',
});
assert.strictEqual(issue.status, 'OPEN');
assert.strictEqual(issue.sourceVersion, 'v1');

assert.throws(
  () => normalizeMissionTranslationPolicy({ missionId: 'm', cycleId: 'c', paperId: 'p' }),
  error => error.code === 'TRANSLATION_BINDING_REQUIRED',
);

assert.throws(
  () => assertTranslationRequest(policy({ assessmentLanguageSection: true }), { sourceHash: 's', sourceVersion: 'v' }),
  error => error.code === 'ASSESSMENT_LANGUAGE_EXCLUDED',
);

assert.throws(
  () => assertTranslationRequest(policy({ examFamily: 'SSC_CGL', sectionType: 'LANGUAGE_ASSESSMENT' }), {
    sourceHash: 's',
    sourceVersion: 'v',
  }),
  error => error.code === 'EXAM_LANGUAGE_SECTION_EXCLUDED',
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
