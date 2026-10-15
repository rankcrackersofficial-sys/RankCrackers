'use strict';

// Pure policy boundary for English-canonical, Hindi-required study delivery.
// This module performs no provider calls and no Firestore writes.

const ENGLISH = 'ENGLISH';
const HINDI = 'HINDI';
const PUBLISHED_STATES = new Set(['PUBLISHED', 'STUDENT_READY', 'STUDENT_REACHABLE', 'LIVE']);

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
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
    regionalLanguages: 'DEFERRED',
  });
}

function assertTranslationRequest(policy, request = {}) {
  if (!policy || policy.sourceLanguage !== ENGLISH || policy.requiredStudyLanguage !== HINDI) {
    fail('TRANSLATION_POLICY_INVALID', 'A valid English-canonical/Hindi-required policy is required.');
  }
  if (policy.assessmentLanguageSection) {
    fail('ASSESSMENT_LANGUAGE_EXCLUDED', 'Language-assessment sections must not be auto-translated.');
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
  if (!policy.assessmentLanguageSection && sourceMatches && published && approved && text(translation.text) !== '') {
    return Object.freeze({ language: HINDI, text: translation.text, fallback: false });
  }
  return Object.freeze({ language: ENGLISH, text: text(translation.englishText), fallback: true });
}

module.exports = {
  ENGLISH,
  HINDI,
  assertTranslationRequest,
  normalizeMissionTranslationPolicy,
  resolveStudentDelivery,
};
