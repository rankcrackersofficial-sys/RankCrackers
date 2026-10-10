/**
 * 🔱 RANKCRACKERS CAREER SIGNAL MODELS & NORMALIZATION ENGINE
 * Gate 48CS2R2 — Official-Rule-Safe Career Signal Domain Models
 *
 * Implements deterministic pure normalization for:
 *   - Canonical 12-State RecruitmentCycle (no competing legacy enums)
 *   - Full 18-Type Source-Backed Event Taxonomy
 *   - Deterministic Event Identity binding (cycleId + docSha + eventType + semanticKey)
 *   - Four Decoupled Entities:
 *       1. NotificationCandidate (Discovery / Staging candidate)
 *       2. CareerSignalEvent (Canonical official source-backed event)
 *       3. CareerSignalView (Personalized user view receiving canonical eventId)
 *       4. NotificationEvent (User delivery transport)
 *   - CareerProfile with strict Unknown Semantics (no defaulting of category, PwBD, experience)
 *   - Separate EligibilityStatus vs VacancyApplicabilityStatus
 */

'use strict';

const crypto = require('crypto');

// 1. Canonical 12-State Cycle Vocabulary (Exact, no competing enum members)
const CANONICAL_RECRUITMENT_CYCLE_STATUS = Object.freeze({
  ANNOUNCED: 'ANNOUNCED',
  APPLICATION_OPEN: 'APPLICATION_OPEN',
  APPLICATION_CLOSED: 'APPLICATION_CLOSED',
  EXAM_SCHEDULED: 'EXAM_SCHEDULED',
  EXAM_COMPLETED: 'EXAM_COMPLETED',
  ANSWER_KEY_STAGE: 'ANSWER_KEY_STAGE',
  RESULT_STAGE: 'RESULT_STAGE',
  INTERVIEW_OR_DV_STAGE: 'INTERVIEW_OR_DV_STAGE',
  FINAL_RESULT_DECLARED: 'FINAL_RESULT_DECLARED',
  CYCLE_CLOSED: 'CYCLE_CLOSED',
  CANCELLED: 'CANCELLED',
  STATUS_UNRESOLVED: 'STATUS_UNRESOLVED'
});

// Alias for canonical cycle status (legacy members completely removed)
const RECRUITMENT_CYCLE_STATUS = CANONICAL_RECRUITMENT_CYCLE_STATUS;

/**
 * Normalizes legacy cycle status strings at the input boundary only.
 * Output is guaranteed to be one of CANONICAL_RECRUITMENT_CYCLE_STATUS.
 */
function normalizeCycleStatus(rawStatus) {
  if (!rawStatus) return CANONICAL_RECRUITMENT_CYCLE_STATUS.STATUS_UNRESOLVED;
  const s = String(rawStatus).trim().toUpperCase();

  if (CANONICAL_RECRUITMENT_CYCLE_STATUS[s]) {
    return CANONICAL_RECRUITMENT_CYCLE_STATUS[s];
  }

  // Boundary normalization of legacy aliases
  switch (s) {
    case 'UPCOMING':
      return CANONICAL_RECRUITMENT_CYCLE_STATUS.ANNOUNCED;
    case 'ACTIVE':
      return CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN;
    case 'IN_SELECTION':
      return CANONICAL_RECRUITMENT_CYCLE_STATUS.EXAM_SCHEDULED;
    case 'CLOSED':
      return CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED;
    default:
      return CANONICAL_RECRUITMENT_CYCLE_STATUS.STATUS_UNRESOLVED;
  }
}

function isUpcoming(status) {
  const norm = normalizeCycleStatus(status);
  return norm === CANONICAL_RECRUITMENT_CYCLE_STATUS.ANNOUNCED;
}

function isActiveApplication(status) {
  const norm = normalizeCycleStatus(status);
  return norm === CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN;
}

// 2. Governed Opportunity Kinds
const OPPORTUNITY_KIND = Object.freeze({
  JOB_RECRUITMENT: 'JOB_RECRUITMENT',
  ADMISSION_ENTRANCE: 'ADMISSION_ENTRANCE',
  OTHER_OFFICIAL_OPPORTUNITY: 'OTHER_OFFICIAL_OPPORTUNITY'
});

// 3. Full 18-Type Source-Backed Event Taxonomy
const CAREER_SIGNAL_EVENT_TYPE = Object.freeze({
  NEW_NOTIFICATION: 'NEW_NOTIFICATION',
  APPLICATION_OPEN: 'APPLICATION_OPEN',
  APPLICATION_DEADLINE: 'APPLICATION_DEADLINE',
  APPLICATION_DEADLINE_CHANGED: 'APPLICATION_DEADLINE_CHANGED',
  VACANCY_ANNOUNCED: 'VACANCY_ANNOUNCED',
  VACANCY_CHANGED: 'VACANCY_CHANGED',
  ELIGIBILITY_CHANGED: 'ELIGIBILITY_CHANGED',
  AGE_RULE_CHANGED: 'AGE_RULE_CHANGED',
  FEE_CHANGED: 'FEE_CHANGED',
  EXAM_DATE_ANNOUNCED: 'EXAM_DATE_ANNOUNCED',
  EXAM_DATE_CHANGED: 'EXAM_DATE_CHANGED',
  ADMIT_CARD_RELEASED: 'ADMIT_CARD_RELEASED',
  ANSWER_KEY_RELEASED: 'ANSWER_KEY_RELEASED',
  RESULT_DECLARED: 'RESULT_DECLARED',
  INTERVIEW_OR_DV_NOTICE: 'INTERVIEW_OR_DV_NOTICE',
  FINAL_RESULT_DECLARED: 'FINAL_RESULT_DECLARED',
  RECRUITMENT_CANCELLED: 'RECRUITMENT_CANCELLED',
  CORRIGENDUM_OR_AMENDMENT: 'CORRIGENDUM_OR_AMENDMENT',
  // Backward compatibility aliases mapped to canonical values
  DEADLINE_EXTENSION: 'APPLICATION_DEADLINE_CHANGED',
  EXAM_SCHEDULED: 'EXAM_DATE_ANNOUNCED',
  EXAM_COMPLETED: 'EXAM_COMPLETED',
  FINAL_RESULT: 'FINAL_RESULT_DECLARED',
  CANCELLED_RECRUITMENT: 'RECRUITMENT_CANCELLED',
  CORRIGENDUM_OTHER: 'CORRIGENDUM_OR_AMENDMENT'
});

// Map legacy event types to canonical taxonomy at boundary
function normalizeEventType(rawType) {
  if (!rawType) return null;
  const t = String(rawType).trim().toUpperCase();
  if (CAREER_SIGNAL_EVENT_TYPE[t]) return CAREER_SIGNAL_EVENT_TYPE[t];

  switch (t) {
    case 'DEADLINE_EXTENSION':
      return CAREER_SIGNAL_EVENT_TYPE.APPLICATION_DEADLINE_CHANGED;
    case 'EXAM_SCHEDULED':
      return CAREER_SIGNAL_EVENT_TYPE.EXAM_DATE_ANNOUNCED;
    case 'EXAM_COMPLETED':
      return 'EXAM_COMPLETED';
    case 'FINAL_RESULT':
      return CAREER_SIGNAL_EVENT_TYPE.FINAL_RESULT_DECLARED;
    case 'CANCELLED_RECRUITMENT':
      return CAREER_SIGNAL_EVENT_TYPE.RECRUITMENT_CANCELLED;
    case 'CORRIGENDUM_OTHER':
      return CAREER_SIGNAL_EVENT_TYPE.CORRIGENDUM_OR_AMENDMENT;
    default:
      return null;
  }
}

// 4. Governed Verification States
const VERIFICATION_STATE = Object.freeze({
  VERIFIED_SOURCE: 'VERIFIED_SOURCE',
  UNVERIFIED_STAGING: 'UNVERIFIED_STAGING',
  REJECTED: 'REJECTED'
});

// 5. User Participation States
const PARTICIPATION_STATE = Object.freeze({
  DISCOVERED: 'DISCOVERED',
  INTERESTED: 'INTERESTED',
  APPLIED: 'APPLIED',
  APPLICATION_SUBMITTED: 'APPLICATION_SUBMITTED',
  EXAM_APPEARED: 'EXAM_APPEARED',
  WAITING_RESULT: 'WAITING_RESULT',
  NOT_INTERESTED: 'NOT_INTERESTED'
});

// 6. Separate Match Result & Vacancy Applicability States
const ELIGIBILITY_STATUS = Object.freeze({
  ELIGIBLE: 'ELIGIBLE',
  LIKELY_ELIGIBLE: 'LIKELY_ELIGIBLE',
  MORE_INFORMATION_NEEDED: 'MORE_INFORMATION_NEEDED',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
  NOT_EVALUATED: 'NOT_EVALUATED'
});

const MATCH_RESULT_STATE = ELIGIBILITY_STATUS; // Backward compatibility alias

const VACANCY_APPLICABILITY_STATUS = Object.freeze({
  VACANCIES_AVAILABLE: 'VACANCIES_AVAILABLE',
  NO_APPLICABLE_VACANCIES: 'NO_APPLICABLE_VACANCIES',
  VACANCIES_UNSPECIFIED: 'VACANCIES_UNSPECIFIED',
  VACANCIES_PENDING_RESERVATION_DATA: 'VACANCIES_PENDING_RESERVATION_DATA'
});

// 7. Reservation Categories
const VERTICAL_CATEGORY = Object.freeze({
  UR: 'UR',
  SC: 'SC',
  ST: 'ST',
  OBC_NCL: 'OBC_NCL',
  OBC_CL: 'OBC_CL',
  EWS: 'EWS'
});

const HORIZONTAL_CATEGORY = Object.freeze({
  NONE: 'NONE',
  WOMEN: 'WOMEN',
  PWBD: 'PWBD',
  EX_SERVICEMAN: 'EX_SERVICEMAN'
});

// 8. Rule Absence Semantics & Resolution States
const RULE_RESOLUTION_STATE = Object.freeze({
  RULE_PRESENT_VERIFIED: 'RULE_PRESENT_VERIFIED',
  RULE_ABSENCE_VERIFIED: 'RULE_ABSENCE_VERIFIED',
  RULE_UNRESOLVED: 'RULE_UNRESOLVED'
});

// 9. Age Relaxation Resolution States
const AGE_RELAXATION_RESOLUTION = Object.freeze({
  RELAXATION_PRESENT_VERIFIED: 'RELAXATION_PRESENT_VERIFIED',
  RELAXATION_NONE_VERIFIED: 'RELAXATION_NONE_VERIFIED',
  RELAXATION_UNRESOLVED: 'RELAXATION_UNRESOLVED'
});

// 10. Rulebook Completeness Families & Statuses
const RULE_FAMILY = Object.freeze({
  AGE: 'AGE',
  EDUCATION: 'EDUCATION',
  DISCIPLINE: 'DISCIPLINE',
  DOMICILE: 'DOMICILE',
  EXPERIENCE: 'EXPERIENCE',
  REGISTRATION: 'REGISTRATION',
  PHYSICAL_STANDARD: 'PHYSICAL_STANDARD',
  CATEGORY_OR_RESERVATION: 'CATEGORY_OR_RESERVATION',
  SPECIAL_CERTIFICATE: 'SPECIAL_CERTIFICATE',
  OTHER_OFFICIAL_CONDITION: 'OTHER_OFFICIAL_CONDITION'
});

const RULE_FAMILY_STATUS = Object.freeze({
  VERIFIED_COMPLETE: 'VERIFIED_COMPLETE',
  NOT_APPLICABLE_VERIFIED: 'NOT_APPLICABLE_VERIFIED',
  UNRESOLVED: 'UNRESOLVED'
});

// 11. Vacancy Matrix Completeness
const VACANCY_MATRIX_COMPLETENESS = Object.freeze({
  VACANCY_MATRIX_COMPLETE: 'VACANCY_MATRIX_COMPLETE',
  VACANCY_MATRIX_PARTIAL: 'VACANCY_MATRIX_PARTIAL',
  VACANCY_MATRIX_UNRESOLVED: 'VACANCY_MATRIX_UNRESOLVED'
});

// 12. Amendment Chain Completeness
const AMENDMENT_CHAIN_STATUS = Object.freeze({
  CURRENT_CHAIN_VERIFIED: 'CURRENT_CHAIN_VERIFIED',
  CHAIN_PARTIAL: 'CHAIN_PARTIAL',
  CHAIN_UNRESOLVED: 'CHAIN_UNRESOLVED'
});

// 13. Discrete 5-Tier Document Evidence Levels (Never collapse!)
const DOCUMENT_EVIDENCE_LEVEL = Object.freeze({
  URL_FOUND: 'URL_FOUND',
  EXACT_DOCUMENT_RESOLVED: 'EXACT_DOCUMENT_RESOLVED',
  BYTES_ACQUIRED: 'BYTES_ACQUIRED',
  SHA256_VERIFIED: 'SHA256_VERIFIED',
  TEXT_EXTRACTED_AND_BOUND: 'TEXT_EXTRACTED_AND_BOUND'
});

// 14. Discrete 4-Tier Fact Verification Levels
const FACT_VERIFICATION_LEVEL = Object.freeze({
  SOURCE_LOCATED: 'SOURCE_LOCATED',
  BYTE_VERIFIED: 'BYTE_VERIFIED',
  TEXT_VERIFIED: 'TEXT_VERIFIED',
  RULE_VERIFIED: 'RULE_VERIFIED'
});

// 15. Real-World Rule Types Formalization
const RULE_TYPE = Object.freeze({
  AGE_MAX: 'AGE_MAX',
  AGE_MIN: 'AGE_MIN',
  AGE_LIMIT: 'AGE_LIMIT',
  MINIMUM_AGE: 'MINIMUM_AGE',
  UPPER_AGE_LIMIT: 'UPPER_AGE_LIMIT',
  AGE_RELAXATION: 'AGE_RELAXATION',
  QUALIFICATION_MIN: 'QUALIFICATION_MIN',
  QUALIFYING_EXAM_YEAR: 'QUALIFYING_EXAM_YEAR',
  EDUCATION_CUTOFF_DATE: 'EDUCATION_CUTOFF_DATE',
  DISCIPLINE_REQUIRED: 'DISCIPLINE_REQUIRED',
  QUALIFYING_SUBJECTS: 'QUALIFYING_SUBJECTS',
  DOMICILE_REQUIRED: 'DOMICILE_REQUIRED',
  STATE_ELIGIBILITY: 'STATE_ELIGIBILITY',
  EXPERIENCE_REQUIRED: 'EXPERIENCE_REQUIRED',
  CATEGORY_RESERVATION: 'CATEGORY_RESERVATION'
});

// Explicit deterministic mapping of Rule Types to Canonical Rule Families (NO substring heuristics)
const RULE_TYPE_TO_FAMILY_MAP = Object.freeze({
  [RULE_TYPE.AGE_MAX]: RULE_FAMILY.AGE,
  [RULE_TYPE.AGE_MIN]: RULE_FAMILY.AGE,
  [RULE_TYPE.AGE_LIMIT]: RULE_FAMILY.AGE,
  [RULE_TYPE.MINIMUM_AGE]: RULE_FAMILY.AGE,
  [RULE_TYPE.UPPER_AGE_LIMIT]: RULE_FAMILY.AGE,
  [RULE_TYPE.AGE_RELAXATION]: RULE_FAMILY.AGE,
  [RULE_TYPE.QUALIFICATION_MIN]: RULE_FAMILY.EDUCATION,
  [RULE_TYPE.QUALIFYING_EXAM_YEAR]: RULE_FAMILY.EDUCATION,
  [RULE_TYPE.EDUCATION_CUTOFF_DATE]: RULE_FAMILY.EDUCATION,
  [RULE_TYPE.DISCIPLINE_REQUIRED]: RULE_FAMILY.DISCIPLINE,
  [RULE_TYPE.QUALIFYING_SUBJECTS]: RULE_FAMILY.DISCIPLINE,
  [RULE_TYPE.DOMICILE_REQUIRED]: RULE_FAMILY.DOMICILE,
  [RULE_TYPE.STATE_ELIGIBILITY]: RULE_FAMILY.DOMICILE,
  [RULE_TYPE.EXPERIENCE_REQUIRED]: RULE_FAMILY.EXPERIENCE,
  [RULE_TYPE.CATEGORY_RESERVATION]: RULE_FAMILY.CATEGORY_OR_RESERVATION
});

/**
 * Normalizes RulebookCompleteness model.
 */
function normalizeRulebookCompleteness(raw = {}) {
  const requiredFamilies = Array.isArray(raw.requiredFamilies) && raw.requiredFamilies.length > 0
    ? raw.requiredFamilies
    : [
        RULE_FAMILY.AGE,
        RULE_FAMILY.EDUCATION,
        RULE_FAMILY.DISCIPLINE,
        RULE_FAMILY.DOMICILE,
        RULE_FAMILY.CATEGORY_OR_RESERVATION
      ];

  const familyStatuses = {};
  let isComplete = true;
  const unresolvedFamilies = [];

  for (const family of requiredFamilies) {
    const status = raw.familyStatuses?.[family] || RULE_FAMILY_STATUS.UNRESOLVED;
    familyStatuses[family] = status;
    if (status !== RULE_FAMILY_STATUS.VERIFIED_COMPLETE && status !== RULE_FAMILY_STATUS.NOT_APPLICABLE_VERIFIED) {
      isComplete = false;
      unresolvedFamilies.push(family);
    }
  }

  return {
    requiredFamilies,
    familyStatuses,
    isComplete,
    unresolvedFamilies,
    auditedAt: raw.auditedAt || new Date().toISOString(),
    auditedByDocRef: raw.auditedByDocRef || null
  };
}

/**
 * Normalizes AmendmentChain model.
 */
function normalizeAmendmentChain(raw = {}) {
  const baseNotificationDocId = String(raw.baseNotificationDocId || '').trim();
  const amendmentSearchStatus = AMENDMENT_CHAIN_STATUS[raw.amendmentSearchStatus] || AMENDMENT_CHAIN_STATUS.CHAIN_UNRESOLVED;
  const applicableCorrigenda = Array.isArray(raw.applicableCorrigenda) ? raw.applicableCorrigenda : [];
  const latestKnownOfficialNoticeDocId = raw.latestKnownOfficialNoticeDocId || baseNotificationDocId;

  return {
    baseNotificationDocId,
    latestKnownOfficialNoticeDocId,
    applicableCorrigenda,
    amendmentSearchStatus,
    lastCheckedAt: raw.lastCheckedAt || new Date().toISOString()
  };
}


function canonicalJsonStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  const pairs = keys.map(k => JSON.stringify(k) + ':' + canonicalJsonStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

function computeSemanticHash(obj) {
  const canonical = canonicalJsonStringify(obj);
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Computes deterministic CareerSignalEvent identity.
 * Binds: cycleId + documentSha256 + eventType + semanticEventKey.
 */
function computeCareerSignalEventId({ cycleId, documentSha256, eventType, semanticEventKey = 'primary' }) {
  if (!cycleId || !documentSha256 || !eventType) {
    throw new Error('EVENT_ID_PARAMS_REQUIRED: cycleId, documentSha256, and eventType are mandatory.');
  }
  const composite = [
    String(cycleId).trim(),
    String(documentSha256).trim().toLowerCase(),
    String(eventType).trim().toUpperCase(),
    String(semanticEventKey).trim()
  ].join(':');

  const sha16 = crypto.createHash('sha256').update(composite).digest('hex').substring(0, 16);
  return 'evt_' + sha16;
}

function normalizeSourceProvenance(raw = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const officialSourceIdentity = typeof raw.officialSourceIdentity === 'string' && raw.officialSourceIdentity.trim()
    ? raw.officialSourceIdentity.trim() : null;

  const authorityBinding = typeof raw.authorityBinding === 'string' && raw.authorityBinding.trim()
    ? raw.authorityBinding.trim() : null;

  const documentIdentity = typeof raw.documentIdentity === 'string' && raw.documentIdentity.trim()
    ? raw.documentIdentity.trim() : null;

  const documentSha256 = typeof raw.documentSha256 === 'string' && raw.documentSha256.trim()
    ? raw.documentSha256.trim().toLowerCase() : null;

  let verificationState = VERIFICATION_STATE.UNVERIFIED_STAGING;
  if (raw.verificationState === VERIFICATION_STATE.VERIFIED_SOURCE) {
    verificationState = VERIFICATION_STATE.VERIFIED_SOURCE;
  } else if (raw.verificationState === VERIFICATION_STATE.REJECTED) {
    verificationState = VERIFICATION_STATE.REJECTED;
  }

  if (!officialSourceIdentity || !authorityBinding || !documentIdentity || !documentSha256) {
    return null;
  }

  // Discrete 5-Tier Document Evidence Level Tracking (Never collapse!)
  const isUrlFound = raw.isUrlFound !== undefined ? Boolean(raw.isUrlFound) : Boolean(raw.officialSourceUrl || officialSourceIdentity);
  const isExactDocumentResolved = raw.isExactDocumentResolved !== undefined ? Boolean(raw.isExactDocumentResolved) : Boolean(documentIdentity);
  const isBytesAcquired = raw.isBytesAcquired !== undefined ? Boolean(raw.isBytesAcquired) : Boolean(documentSha256);
  const isShaVerified = raw.isShaVerified !== undefined ? Boolean(raw.isShaVerified) : Boolean(documentSha256 && verificationState === VERIFICATION_STATE.VERIFIED_SOURCE);
  const isTextExtractedAndBound = raw.isTextExtractedAndBound !== undefined ? Boolean(raw.isTextExtractedAndBound) : false;

  let evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.URL_FOUND;
  if (isTextExtractedAndBound) evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.TEXT_EXTRACTED_AND_BOUND;
  else if (isShaVerified) evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.SHA256_VERIFIED;
  else if (isBytesAcquired) evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.BYTES_ACQUIRED;
  else if (isExactDocumentResolved) evidenceLevel = DOCUMENT_EVIDENCE_LEVEL.EXACT_DOCUMENT_RESOLVED;

  return {
    officialSourceIdentity,
    authorityBinding,
    documentIdentity,
    documentSha256,
    verificationState,
    evidenceLevel,
    isUrlFound,
    isExactDocumentResolved,
    isBytesAcquired,
    isShaVerified,
    isTextExtractedAndBound,
    ingestedAt: raw.ingestedAt || new Date().toISOString()
  };
}

/**
 * ENTITY 1: NotificationCandidate (Discovery / Staging candidate)
 */
function normalizeNotificationCandidate(raw = {}) {
  const candidateId = String(raw.candidateId || '').trim();
  if (!candidateId) throw new Error('CANDIDATE_ID_REQUIRED');

  return {
    candidateId,
    authorityKey: String(raw.authorityKey || '').trim(),
    sourceDocumentRef: raw.sourceDocumentRef || null,
    stagedAt: raw.stagedAt || new Date().toISOString(),
    status: raw.status || 'STAGED_FOR_REVIEW',
    extractedCyclePayload: raw.extractedCyclePayload || null
  };
}

/**
 * ENTITY 2: CareerSignalEvent (Canonical official source-backed event)
 */
function normalizeCareerSignalEvent(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('INVALID_EVENT_OBJECT: raw event must be an object.');
  }

  const cycleId = String(raw.cycleId || '').trim();
  if (!cycleId) {
    throw new Error('CYCLE_ID_REQUIRED: cycleId is mandatory for CareerSignalEvent.');
  }

  const authorityKey = String(raw.authorityKey || '').trim();
  if (!authorityKey) {
    throw new Error('AUTHORITY_KEY_REQUIRED: authorityKey is mandatory for CareerSignalEvent.');
  }

  const canonicalEventType = normalizeEventType(raw.eventType);
  if (!canonicalEventType) {
    throw new Error('INVALID_EVENT_TYPE: Event type ' + raw.eventType + ' is not in CAREER_SIGNAL_EVENT_TYPE.');
  }

  const provenance = normalizeSourceProvenance(raw.documentProvenance || raw.sourceProvenance);
  if (!provenance || provenance.verificationState !== VERIFICATION_STATE.VERIFIED_SOURCE) {
    throw new Error('UNVERIFIED_PROVENANCE: CareerSignalEvent requires verified source document provenance.');
  }

  const semanticEventKey = String(raw.semanticEventKey || raw.officialNoticeNumber || 'primary').trim();

  // Deterministic ID binding cycleId + docSha256 + eventType + semanticEventKey
  const eventId = raw.eventId && String(raw.eventId).trim()
    ? String(raw.eventId).trim()
    : computeCareerSignalEventId({
        cycleId,
        documentSha256: provenance.documentSha256,
        eventType: canonicalEventType,
        semanticEventKey
      });

  const permanentMissionId = typeof raw.permanentMissionId === 'string' && raw.permanentMissionId.trim()
    ? raw.permanentMissionId.trim() : null;

  const opportunityKind = OPPORTUNITY_KIND[raw.opportunityKind] || OPPORTUNITY_KIND.JOB_RECRUITMENT;
  const effectiveDate = typeof raw.effectiveDate === 'string' && raw.effectiveDate.trim()
    ? raw.effectiveDate.trim() : null;

  const emittedAt = typeof raw.emittedAt === 'string' && raw.emittedAt.trim()
    ? raw.emittedAt.trim()
    : (raw.timestamp || new Date().toISOString());

  const payload = raw.payload && typeof raw.payload === 'object' ? raw.payload : {};

  return {
    eventId,
    cycleId,
    permanentMissionId, // Nullable for one-off recruitments
    authorityKey,
    opportunityKind,
    eventType: canonicalEventType,
    semanticEventKey,
    effectiveDate,
    emittedAt,
    documentProvenance: provenance,
    payload,
    schemaVersion: '2.0.0'
  };
}

/**
 * ENTITY 3: CareerSignalView (Personalized user-specific view)
 * Must receive the real canonical eventId. Does NOT synthesize fake IDs.
 */
function normalizeCareerSignalView(raw = {}) {
  const userId = String(raw.userId || '').trim();
  const eventId = String(raw.eventId || '').trim();
  if (!userId) throw new Error('USER_ID_REQUIRED: userId is mandatory for CareerSignalView.');
  if (!eventId) throw new Error('EVENT_ID_REQUIRED: CareerSignalView must receive canonical eventId.');

  const viewId = raw.viewId || (userId + '_' + eventId);

  const eligibilityStatus = ELIGIBILITY_STATUS[raw.eligibilityStatus] ||
    ELIGIBILITY_STATUS[raw.matchResultState] ||
    ELIGIBILITY_STATUS.NOT_EVALUATED;

  const vacancyApplicabilityStatus = VACANCY_APPLICABILITY_STATUS[raw.vacancyApplicabilityStatus] ||
    VACANCY_APPLICABILITY_STATUS.VACANCIES_UNSPECIFIED;

  return {
    viewId,
    userId,
    eventId,
    cycleId: raw.cycleId,
    permanentMissionId: raw.permanentMissionId || null,
    opportunityKind: raw.opportunityKind || OPPORTUNITY_KIND.JOB_RECRUITMENT,
    eligibilityStatus,
    vacancyApplicabilityStatus,
    matchResultState: eligibilityStatus, // Backward compat alias
    relevanceScore: typeof raw.relevanceScore === 'number' ? raw.relevanceScore : 0,
    priority: raw.priority || 'STANDARD_PUBLIC_UPDATE',
    academicMatch: raw.academicMatch !== undefined ? raw.academicMatch : null,
    qualificationMatch: raw.qualificationMatch !== undefined ? raw.qualificationMatch : null,
    locationMatch: raw.locationMatch !== undefined ? raw.locationMatch : null,
    preferenceMatch: raw.preferenceMatch !== undefined ? raw.preferenceMatch : null,
    passedRuleIds: Array.isArray(raw.passedRuleIds) ? raw.passedRuleIds : [],
    failedRuleIds: Array.isArray(raw.failedRuleIds) ? raw.failedRuleIds : [],
    missingProfileFields: Array.isArray(raw.missingProfileFields) ? raw.missingProfileFields : [],
    unresolvedRuleIds: Array.isArray(raw.unresolvedRuleIds) ? raw.unresolvedRuleIds : [],
    applicableVacancyRows: Array.isArray(raw.applicableVacancyRows) ? raw.applicableVacancyRows : [],
    totalApplicableVacancies: typeof raw.totalApplicableVacancies === 'number' ? raw.totalApplicableVacancies : 0,
    reasonCodes: Array.isArray(raw.reasonCodes) ? raw.reasonCodes : [],
    explainability: raw.explainability && typeof raw.explainability === 'object' ? raw.explainability : null,
    rulebookCompleteness: raw.rulebookCompleteness ? normalizeRulebookCompleteness(raw.rulebookCompleteness) : null,
    amendmentChain: raw.amendmentChain ? normalizeAmendmentChain(raw.amendmentChain) : null,
    vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS[raw.vacancyMatrixCompleteness] || VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_UNRESOLVED,
    unresolvedRuleFamilies: Array.isArray(raw.unresolvedRuleFamilies) ? raw.unresolvedRuleFamilies : [],
    generatedAt: raw.generatedAt || new Date().toISOString()
  };
}

/**
 * ENTITY 4: NotificationEvent (User delivery transport)
 */
function normalizeNotificationEvent(raw = {}) {
  const notificationId = String(raw.notificationId || '').trim();
  const userId = String(raw.userId || '').trim();
  const viewId = String(raw.viewId || '').trim();
  if (!notificationId || !userId || !viewId) throw new Error('NOTIFICATION_IDS_REQUIRED');

  return {
    notificationId,
    userId,
    viewId,
    deliveryChannel: raw.deliveryChannel || 'IN_APP',
    sentAt: raw.sentAt || new Date().toISOString(),
    readAt: raw.readAt || null,
    dismissedAt: raw.dismissedAt || null
  };
}

/**
 * Normalizes RecruitmentCycle.
 */
function normalizeRecruitmentCycle(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    throw new Error('INVALID_CYCLE_OBJECT: raw cycle must be an object.');
  }

  const cycleId = String(raw.cycleId || '').trim();
  if (!cycleId) {
    throw new Error('CYCLE_ID_REQUIRED: cycleId is mandatory for RecruitmentCycle.');
  }

  const authorityKey = String(raw.authorityKey || '').trim();
  if (!authorityKey) {
    throw new Error('AUTHORITY_KEY_REQUIRED: authorityKey is mandatory for RecruitmentCycle.');
  }

  const title = String(raw.title || '').trim();
  if (!title) {
    throw new Error('TITLE_REQUIRED: title is mandatory for RecruitmentCycle.');
  }

  const status = normalizeCycleStatus(raw.status);

  const cycleYear = typeof raw.cycleYear === 'number' && Number.isInteger(raw.cycleYear)
    ? raw.cycleYear : null;

  const permanentMissionId = typeof raw.permanentMissionId === 'string' && raw.permanentMissionId.trim()
    ? raw.permanentMissionId.trim() : null;

  const opportunityKind = OPPORTUNITY_KIND[raw.opportunityKind] || OPPORTUNITY_KIND.JOB_RECRUITMENT;
  const advertisementNumber = typeof raw.advertisementNumber === 'string' ? raw.advertisementNumber.trim() : null;

  const applicationWindow = {
    startDate: raw.applicationWindow?.startDate || null,
    endDate: raw.applicationWindow?.endDate || null,
    isExtended: Boolean(raw.applicationWindow?.isExtended),
    extensionHistory: Array.isArray(raw.applicationWindow?.extensionHistory)
      ? raw.applicationWindow.extensionHistory.map(h => ({
          previousEndDate: h.previousEndDate || '',
          newEndDate: h.newEndDate || '',
          amendmentEventId: h.amendmentEventId || '',
          timestamp: h.timestamp || ''
        }))
      : []
  };

  const examDates = Array.isArray(raw.examDates)
    ? raw.examDates.map(d => ({
        stageName: d.stageName || 'DEFAULT',
        scheduledDate: d.scheduledDate || null,
        isTentative: Boolean(d.isTentative),
        announcementDocRef: d.announcementDocRef || null
      }))
    : [];

  const totalVacancies = typeof raw.totalVacancies === 'number' && raw.totalVacancies >= 0
    ? raw.totalVacancies : null;

  const opportunitySignalActive = Boolean(raw.opportunitySignalActive);
  const processUpdateSignalActive = Boolean(raw.processUpdateSignalActive);

  const sourceProvenance = normalizeSourceProvenance(raw.sourceProvenance);
  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString();
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt;

  return {
    cycleId,
    permanentMissionId, // Nullable for one-off recruitments
    authorityKey,
    title,
    cycleYear,
    opportunityKind,
    advertisementNumber,
    status,
    applicationWindow,
    examDates,
    totalVacancies,
    opportunitySignalActive,
    processUpdateSignalActive,
    sourceProvenance,
    createdAt,
    updatedAt
  };
}

/**
 * Normalizes CareerProfile.
 * CRITICAL 48CS2R2 HARDENING:
 * Absent user data remains null or UNKNOWN.
 * NEVER default reservationCategory to UR, isPwBD to false, or experience to 0.
 */
function normalizeCareerProfile(raw = {}) {
  const userId = String(raw.userId || raw.uid || '').trim();
  if (!userId) throw new Error('USER_ID_REQUIRED');

  // Category must NOT default to UR
  let reservationCategory = null;
  if (raw.reservationCategory !== undefined && raw.reservationCategory !== null) {
    const catStr = String(raw.reservationCategory).trim();
    if (Object.values(VERTICAL_CATEGORY).includes(catStr)) {
      reservationCategory = catStr;
    } else if (catStr === 'UNKNOWN') {
      reservationCategory = 'UNKNOWN';
    }
  }

  // isPwBD must NOT default to false
  let isPwBD = null;
  if (typeof raw.isPwBD === 'boolean') {
    isPwBD = raw.isPwBD;
  }

  // isExServiceman must NOT default to false
  let isExServiceman = null;
  if (typeof raw.isExServiceman === 'boolean') {
    isExServiceman = raw.isExServiceman;
  }

  // experienceMonths must NOT default to 0
  let experienceMonths = null;
  if (typeof raw.experienceMonths === 'number' && !isNaN(raw.experienceMonths)) {
    experienceMonths = raw.experienceMonths;
  }

  return {
    userId,
    dateOfBirth: typeof raw.dateOfBirth === 'string' && raw.dateOfBirth.trim() ? raw.dateOfBirth.trim() : null,
    gender: ['MALE', 'FEMALE', 'TRANSGENDER', 'OTHER'].includes(raw.gender) ? raw.gender : null,
    reservationCategory, // null or UNKNOWN if not supplied
    domicileState: typeof raw.domicileState === 'string' && raw.domicileState.trim() ? raw.domicileState.trim().toUpperCase() : null,
    highestQualification: ['10TH', '12TH', 'DIPLOMA', 'GRADUATION', 'POST_GRADUATION', 'DOCTORATE'].includes(raw.highestQualification)
      ? raw.highestQualification : null,
    degree: typeof raw.degree === 'string' && raw.degree.trim() ? raw.degree.trim() : null,
    subjectOrDiscipline: typeof raw.subjectOrDiscipline === 'string' && raw.subjectOrDiscipline.trim() ? raw.subjectOrDiscipline.trim() : null,
    passingStatus: ['PASSED', 'APPEARING', 'PURSUING'].includes(raw.passingStatus) ? raw.passingStatus : null,
    passingYear: typeof raw.passingYear === 'number' ? raw.passingYear : null,
    percentageOrCgpa: typeof raw.percentageOrCgpa === 'number' ? raw.percentageOrCgpa : null,
    experienceMonths, // null if not supplied
    isPwBD, // null if not supplied
    pwbdType: typeof raw.pwbdType === 'string' && raw.pwbdType.trim() ? raw.pwbdType.trim() : null,
    pwbdPercentage: typeof raw.pwbdPercentage === 'number' ? raw.pwbdPercentage : null,
    isExServiceman, // null if not supplied
    exServicemanServiceYears: typeof raw.exServicemanServiceYears === 'number' ? raw.exServicemanServiceYears : null,
    extensions: raw.extensions && typeof raw.extensions === 'object' ? raw.extensions : {},
    updatedAt: raw.updatedAt || new Date().toISOString()
  };
}

module.exports = {
  CANONICAL_RECRUITMENT_CYCLE_STATUS,
  RECRUITMENT_CYCLE_STATUS,
  OPPORTUNITY_KIND,
  CAREER_SIGNAL_EVENT_TYPE,
  VERIFICATION_STATE,
  PARTICIPATION_STATE,
  ELIGIBILITY_STATUS,
  MATCH_RESULT_STATE,
  VACANCY_APPLICABILITY_STATUS,
  VERTICAL_CATEGORY,
  HORIZONTAL_CATEGORY,
  normalizeCycleStatus,
  normalizeEventType,
  isUpcoming,
  isActiveApplication,
  canonicalJsonStringify,
  computeSemanticHash,
  computeCareerSignalEventId,
  normalizeSourceProvenance,
  normalizeNotificationCandidate,
  normalizeCareerSignalEvent,
  normalizeCareerSignalView,
  normalizeNotificationEvent,
  normalizeRecruitmentCycle,
  normalizeCareerProfile,
  RULE_RESOLUTION_STATE,
  AGE_RELAXATION_RESOLUTION,
  RULE_FAMILY,
  RULE_FAMILY_STATUS,
  VACANCY_MATRIX_COMPLETENESS,
  AMENDMENT_CHAIN_STATUS,
  normalizeRulebookCompleteness,
  normalizeAmendmentChain,
  DOCUMENT_EVIDENCE_LEVEL,
  FACT_VERIFICATION_LEVEL,
  RULE_TYPE,
  RULE_TYPE_TO_FAMILY_MAP
};
