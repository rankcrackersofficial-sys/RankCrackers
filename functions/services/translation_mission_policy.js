'use strict';

// Pure policy boundary for English-canonical, Hindi-required study delivery.
// This module performs no provider calls and no Firestore writes.

const ENGLISH = 'ENGLISH';
const HINDI = 'HINDI';
const PUBLISHED_STATES = new Set(['PUBLISHED', 'STUDENT_READY', 'STUDENT_REACHABLE', 'LIVE']);
const LANGUAGE_SECTION_TYPES = new Set([
  'ENGLISH_LANGUAGE',
  'HINDI_LANGUAGE',
  'LANGUAGE_ASSESSMENT',
]);

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function upperText(value) {
  return text(value).toUpperCase();
}

function isExcludedLanguageSection(policy) {
  return policy.assessmentLanguageSection || LANGUAGE_SECTION_TYPES.has(policy.sectionType);
}

function normalizeMissionTranslationPolicy(input = {}) {
  const missionId = text(input.missionId);
  const cycleId = text(input.cycleId);
  const paperId = text(input.paperId);
  const sectionId = text(input.sectionId);
  if (!missionId || !cycleId || !paperId || !sectionId) {
    fail('TRANSLATION_BINDING_REQUIRED', 'missionId, cycleId, paperId and sectionId are required.');
  }

  const sourceLanguage = text(input.sourceLanguage).toUpperCase() || ENGLISH;
  if (sourceLanguage !== ENGLISH) fail('CANONICAL_SOURCE_MUST_BE_ENGLISH', 'English is the canonical source language.');

  const assessmentLanguageSection = input.assessmentLanguageSection === true || input.languageAssessment === true;
  return Object.freeze({
    missionId,
    cycleId,
    paperId,
    sectionId,
    sourceLanguage: ENGLISH,
    requiredStudyLanguage: HINDI,
    assessmentLanguageSection,
    examFamily: upperText(input.examFamily) || 'GENERAL',
    sectionType: upperText(input.sectionType) || 'CONTENT',
    regionalLanguages: 'DEFERRED',
  });
}

function assertTranslationRequest(policy, request = {}) {
  if (!policy || policy.sourceLanguage !== ENGLISH || policy.requiredStudyLanguage !== HINDI) {
    fail('TRANSLATION_POLICY_INVALID', 'A valid English-canonical/Hindi-required policy is required.');
  }
  if (isExcludedLanguageSection(policy)) {
    fail(
      policy.assessmentLanguageSection ? 'ASSESSMENT_LANGUAGE_EXCLUDED' : 'EXAM_LANGUAGE_SECTION_EXCLUDED',
      'Language-assessment sections must not be auto-translated.',
    );
  }
  if (text(request.sourceHash) === '' || text(request.sourceVersion) === '') {
    fail('SOURCE_PROVENANCE_REQUIRED', 'sourceHash and sourceVersion are required.');
  }
  return Object.freeze({
    ...policy,
    sourceHash: text(request.sourceHash),
    sourceVersion: text(request.sourceVersion),
    targetLanguage: HINDI,
    status: 'REQUESTED',
  });
}

// Provider/review metadata is deliberately validated before a candidate can
// enter the human-review queue. This keeps provider calls and persistence out
// of the pure policy boundary while preventing unverified text from publishing.
function validateTranslationCandidate(policy, candidate = {}) {
  if (!policy || policy.sourceLanguage !== ENGLISH || policy.requiredStudyLanguage !== HINDI) {
    fail('TRANSLATION_POLICY_INVALID', 'A valid English-canonical/Hindi-required policy is required.');
  }
  if (isExcludedLanguageSection(policy)) {
    fail('TRANSLATION_CANDIDATE_EXCLUDED', 'Language-assessment sections cannot enter translation review.');
  }
  if (text(candidate.sourceHash) !== text(policy.sourceHash) ||
      text(candidate.sourceVersion) !== text(policy.sourceVersion)) {
    fail('SOURCE_PROVENANCE_MISMATCH', 'Candidate provenance must match the requested English source.');
  }
  if (upperText(candidate.targetLanguage) !== HINDI) {
    fail('TARGET_LANGUAGE_INVALID', 'The candidate target language must be Hindi.');
  }
  if (!text(candidate.provider)) fail('TRANSLATION_PROVIDER_REQUIRED', 'A translation provider is required.');
  if (candidate.providerReady !== true) fail('TRANSLATION_PROVIDER_NOT_READY', 'Provider readiness was not verified.');
  if (!text(candidate.glossaryVersion)) fail('GLOSSARY_REQUIRED', 'A glossary version is required.');
  if (candidate.semanticStructureValid !== true) {
    fail('SEMANTIC_STRUCTURE_INVALID', 'Semantic structure validation must pass before review.');
  }
  if (!text(candidate.text)) fail('TRANSLATION_TEXT_REQUIRED', 'Candidate translation text is required.');
  return Object.freeze({
    ...candidate,
    sourceHash: text(candidate.sourceHash),
    sourceVersion: text(candidate.sourceVersion),
    targetLanguage: HINDI,
    reviewStatus: 'PENDING',
    publicationState: 'REVIEW_REQUIRED',
  });
}

function buildTranslationIssue(policy, issue = {}) {
  if (!policy || !text(policy.sourceHash) || !text(policy.sourceVersion)) {
    fail('SOURCE_PROVENANCE_REQUIRED', 'Issues must be bound to a source hash and version.');
  }
  if (!text(issue.code) || !text(issue.message)) {
    fail('TRANSLATION_ISSUE_REQUIRED', 'Issue code and message are required.');
  }
  return Object.freeze({
    issueId: text(issue.issueId) || `${policy.missionId}:${policy.sectionId}:${text(issue.code)}`,
    missionId: policy.missionId,
    sectionId: policy.sectionId,
    sourceHash: policy.sourceHash,
    sourceVersion: policy.sourceVersion,
    code: upperText(issue.code),
    message: text(issue.message),
    status: 'OPEN',
  });
}

function resolveStudentDelivery(policy, translation = {}) {
  if (!policy || policy.sourceLanguage !== ENGLISH || policy.requiredStudyLanguage !== HINDI) {
    fail('TRANSLATION_POLICY_INVALID', 'A valid translation policy is required.');
  }
  const sourceMatches = text(translation.sourceHash) !== '' &&
    text(translation.sourceVersion) !== '' &&
    text(translation.sourceHash) === text(policy.sourceHash) &&
    text(translation.sourceVersion) === text(policy.sourceVersion);
  const published = PUBLISHED_STATES.has(text(translation.publicationState).toUpperCase());
  const approved = text(translation.reviewStatus).toUpperCase() === 'APPROVED';
  if (!isExcludedLanguageSection(policy) && sourceMatches && published && approved && text(translation.text) !== '') {
    return Object.freeze({ language: HINDI, text: translation.text, fallback: false });
  }
  return Object.freeze({ language: ENGLISH, text: text(translation.englishText), fallback: true });
}

module.exports = {
  ENGLISH,
  HINDI,
  assertTranslationRequest,
  buildTranslationIssue,
  normalizeMissionTranslationPolicy,
  resolveStudentDelivery,
  validateTranslationCandidate,
};
