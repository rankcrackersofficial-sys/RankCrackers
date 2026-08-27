'use strict';

const crypto = require('crypto');

const VARIABLE_PACK_KEYS = Object.freeze([
  'vacancy_variables',
  'eligibility_variables',
  'paper_variables',
  'category_variables',
  'subject_variables',
  'department_variables',
  'fee_variables',
  'date_variables',
  'relaxation_variables',
  'link_variables',
  'amendment_variables',
]);

const MEDIUM_KEYS = Object.freeze([
  'mediumPolicy',
  'supportedMediums',
  'defaultMedium',
]);

const ALLOWED_KEYS = new Set([...VARIABLE_PACK_KEYS, ...MEDIUM_KEYS]);
const ITEM_STATUSES = new Set(['pending', 'approved', 'edited', 'sent_back']);
const MEDIUM_POLICIES = new Set(['ENGLISH_ONLY', 'HINDI_ONLY', 'BILINGUAL']);
const MEDIUMS = new Set(['ENGLISH', 'HINDI']);
const PUBLISHED_STATES = new Set([
  'PUBLISHED',
  'STUDENT_READY',
  'STUDENT_REACHABLE',
  'LIVE',
]);

function fail(code, message) {
  const error = new Error(`${code}: ${message}`);
  error.code = code;
  throw error;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertFounderVariableAuthority(auth, userData = {}) {
  if (!auth) fail('UNAUTHENTICATED', 'Authentication is required.');
  if (auth.token?.founder !== true) {
    fail('PERMISSION_DENIED', 'Mission variables are Founder-only.');
  }
  if (userData.status !== 'ACTIVE') {
    fail('ACCOUNT_INACTIVE', 'Founder account must be ACTIVE.');
  }
}

function normalizeMediums(input) {
  const policy = String(input.mediumPolicy || '').trim().toUpperCase();
  const supported = Array.isArray(input.supportedMediums)
    ? [...new Set(input.supportedMediums.map(v => String(v).trim().toUpperCase()).filter(Boolean))]
    : [];
  const defaultMedium = String(input.defaultMedium || '').trim().toUpperCase();

  if (!MEDIUM_POLICIES.has(policy)) {
    fail('INVALID_MEDIUM_POLICY', `Unsupported mediumPolicy '${policy}'.`);
  }
  if (supported.length === 0 || supported.some(value => !MEDIUMS.has(value))) {
    fail('INVALID_SUPPORTED_MEDIUMS', 'supportedMediums must contain only ENGLISH/HINDI.');
  }
  if (!MEDIUMS.has(defaultMedium) || !supported.includes(defaultMedium)) {
    fail('INVALID_DEFAULT_MEDIUM', 'defaultMedium must be included in supportedMediums.');
  }
  if (policy === 'ENGLISH_ONLY' && (supported.length !== 1 || supported[0] !== 'ENGLISH')) {
    fail('INCOMPATIBLE_MEDIUMS', 'ENGLISH_ONLY requires exactly ENGLISH.');
  }
  if (policy === 'HINDI_ONLY' && (supported.length !== 1 || supported[0] !== 'HINDI')) {
    fail('INCOMPATIBLE_MEDIUMS', 'HINDI_ONLY requires exactly HINDI.');
  }
  if (policy === 'BILINGUAL' && !(supported.includes('ENGLISH') && supported.includes('HINDI'))) {
    fail('INCOMPATIBLE_MEDIUMS', 'BILINGUAL requires ENGLISH and HINDI.');
  }
  return { mediumPolicy: policy, supportedMediums: supported, defaultMedium };
}

function normalizePackItem(item, packKey, index) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    fail('INVALID_PACK_ITEM', `${packKey}[${index}] must be an object.`);
  }
  const requiredStrings = ['key', 'label', 'source_document_id', 'source_text_excerpt'];
  for (const key of requiredStrings) {
    if (!isNonEmptyString(item[key])) {
      fail('SOURCE_PROOF_REQUIRED', `${packKey}[${index}].${key} is required.`);
    }
  }
  if (!Object.prototype.hasOwnProperty.call(item, 'value')) {
    fail('VARIABLE_VALUE_REQUIRED', `${packKey}[${index}].value is required.`);
  }
  if (!Object.prototype.hasOwnProperty.call(item, 'normalized_value')) {
    fail('NORMALIZED_VALUE_REQUIRED', `${packKey}[${index}].normalized_value is required.`);
  }
  if (!Number.isInteger(item.source_page_number) || item.source_page_number < 1) {
    fail('INVALID_SOURCE_PAGE', `${packKey}[${index}].source_page_number must be >= 1.`);
  }
  if (typeof item.confidence !== 'number' || item.confidence < 0 || item.confidence > 1) {
    fail('INVALID_CONFIDENCE', `${packKey}[${index}].confidence must be between 0 and 1.`);
  }
  const status = String(item.founder_verification_status || '').trim().toLowerCase();
  if (!ITEM_STATUSES.has(status)) {
    fail('INVALID_VERIFICATION_STATUS', `${packKey}[${index}] has unsupported founder_verification_status.`);
  }
  if (!isNonEmptyString(item.notes)) {
    fail('FOUNDER_NOTES_REQUIRED', `${packKey}[${index}].notes is required.`);
  }
  return { ...clone(item), founder_verification_status: status };
}

function normalizeMissionVariables(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    fail('INVALID_VARIABLES', 'missionVariables must be an object.');
  }
  const unknown = Object.keys(input).filter(key => !ALLOWED_KEYS.has(key));
  if (unknown.length > 0) fail('UNSUPPORTED_VARIABLE_KEY', unknown.join(', '));

  const normalized = normalizeMediums(input);
  for (const packKey of VARIABLE_PACK_KEYS) {
    const pack = input[packKey];
    if (pack === undefined || pack === null) continue;
    if (!Array.isArray(pack)) fail('INVALID_VARIABLE_PACK', `${packKey} must be an array.`);
    normalized[packKey] = pack.map((item, index) => normalizePackItem(item, packKey, index));
  }
  if (!Array.isArray(normalized.paper_variables) || normalized.paper_variables.length === 0) {
    fail('REQUIRED_PACK_MISSING', 'paper_variables must contain at least one source-backed item.');
  }
  if (!Array.isArray(normalized.subject_variables) || normalized.subject_variables.length === 0) {
    fail('REQUIRED_PACK_MISSING', 'subject_variables must contain at least one source-backed item.');
  }
  if (Buffer.byteLength(JSON.stringify(normalized), 'utf8') > 750000) {
    fail('VARIABLE_PAYLOAD_TOO_LARGE', 'missionVariables exceeds the safe Firestore payload budget.');
  }
  return normalized;
}

function assertMissionIdentity({ missionId, mission, recruitment, expectedExamYear, expectedExamCategory }) {
  if (!isNonEmptyString(missionId)) fail('MISSION_ID_REQUIRED', 'missionId is required.');
  if (!mission || !recruitment) fail('MISSION_NOT_FOUND', 'Mission realm and recruitment must both exist.');
  const realmId = String(mission.realm_id || mission.id || missionId);
  const recruitmentId = String(recruitment.id || missionId);
  if (realmId !== missionId || recruitmentId !== missionId) {
    fail('MISSION_IDENTITY_MISMATCH', 'Canonical mission identity does not match both records.');
  }
  const missionYear = Number(mission.exam_year || recruitment.year || 0);
  if (!Number.isInteger(missionYear) || missionYear < 2000) fail('INVALID_EXAM_YEAR', 'Mission exam year is invalid.');
  if (Number(expectedExamYear) !== missionYear) fail('STALE_EXAM_YEAR', 'Expected exam year does not match the mission.');
  const category = String(mission.exam_category || recruitment.examCategory || '').trim().toLowerCase();
  if (!category || String(expectedExamCategory || '').trim().toLowerCase() !== category) {
    fail('STALE_EXAM_CATEGORY', 'Expected exam category does not match the mission.');
  }
  return { missionYear, category };
}

function hasPublishedContent(catalog = {}) {
  if (PUBLISHED_STATES.has(String(catalog.studentPublicationState || '').toUpperCase())) return true;
  const locks = catalog.contentLocks || {};
  return Object.values(locks).some(value => value === true);
}

function assertPostPublicationSafety(catalog, currentVariables, nextVariables) {
  if (hasPublishedContent(catalog) && JSON.stringify(currentVariables || {}) !== JSON.stringify(nextVariables || {})) {
    fail('IMMUTABLE_AFTER_PUBLICATION', 'Mission variables cannot change after any Student content lock is published.');
  }
}

function referencedDocumentIds(variables) {
  const ids = new Set();
  for (const key of VARIABLE_PACK_KEYS) {
    for (const item of variables[key] || []) ids.add(item.source_document_id);
  }
  return [...ids].sort();
}

function assertSourceDocumentBinding({ missionId, missionYear, variables, documentsById }) {
  for (const packKey of VARIABLE_PACK_KEYS) {
    for (const item of variables[packKey] || []) {
      const document = documentsById[item.source_document_id];
      if (!document) fail('SOURCE_DOCUMENT_NOT_FOUND', `${item.source_document_id} is not bound to this mission.`);
      if (String(document.missionId || '') !== missionId) fail('SOURCE_MISSION_MISMATCH', item.source_document_id);
      if (document.examYear != null && Number(document.examYear) !== missionYear) fail('SOURCE_YEAR_MISMATCH', item.source_document_id);
      if (!String(item.source_document_id).startsWith('hash_')) fail('IMMUTABLE_SOURCE_ID_REQUIRED', item.source_document_id);
      if (document.fileHash && `hash_${document.fileHash}` !== item.source_document_id) fail('SOURCE_HASH_MISMATCH', item.source_document_id);
      const review = String(document.reviewStatus || '').toUpperCase();
      if (!['APPROVED', 'VERIFIED'].includes(review)) fail('SOURCE_NOT_VERIFIED', item.source_document_id);
      if (String(document.publishStatus || '').toLowerCase() === 'archived') fail('SOURCE_ARCHIVED', item.source_document_id);
    }
  }
}

function canonicalDigest(variables) {
  return crypto.createHash('sha256').update(JSON.stringify(variables)).digest('hex');
}

module.exports = {
  ALLOWED_KEYS,
  MEDIUM_KEYS,
  VARIABLE_PACK_KEYS,
  assertFounderVariableAuthority,
  assertMissionIdentity,
  assertPostPublicationSafety,
  assertSourceDocumentBinding,
  canonicalDigest,
  hasPublishedContent,
  normalizeMissionVariables,
  referencedDocumentIds,
};
