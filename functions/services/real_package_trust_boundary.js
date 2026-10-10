'use strict';

const EVIDENCE_LEVEL = Object.freeze({
  URL_FOUND: 'URL_FOUND',
  EXACT_DOCUMENT_RESOLVED: 'EXACT_DOCUMENT_RESOLVED',
  BYTES_ACQUIRED: 'BYTES_ACQUIRED',
  SHA256_VERIFIED: 'SHA256_VERIFIED',
  TEXT_EXTRACTED_AND_BOUND: 'TEXT_EXTRACTED_AND_BOUND'
});

const FACT_VERIFICATION_LEVEL = Object.freeze({
  SOURCE_LOCATED: 'SOURCE_LOCATED',
  BYTE_VERIFIED: 'BYTE_VERIFIED',
  TEXT_VERIFIED: 'TEXT_VERIFIED',
  RULE_VERIFIED: 'RULE_VERIFIED'
});

const CANONICAL_RULE_FAMILY = Object.freeze({
  AGE: 'AGE',
  EDUCATION: 'EDUCATION',
  DISCIPLINE: 'DISCIPLINE',
  QUALIFYING_STATE: 'QUALIFYING_STATE',
  DOMICILE: 'DOMICILE',
  CATEGORY_OR_RESERVATION: 'CATEGORY_OR_RESERVATION',
  EXPERIENCE: 'EXPERIENCE'
});

const RULE_TYPE_NORMALIZATION = Object.freeze({
  EDUCATION: CANONICAL_RULE_FAMILY.EDUCATION,
  QUALIFICATION_MIN: CANONICAL_RULE_FAMILY.EDUCATION,
  AGE_LIMIT: CANONICAL_RULE_FAMILY.AGE,
  AGE_MIN: CANONICAL_RULE_FAMILY.AGE,
  AGE_MAX: CANONICAL_RULE_FAMILY.AGE,
  MINIMUM_AGE: CANONICAL_RULE_FAMILY.AGE,
  UPPER_AGE_LIMIT: CANONICAL_RULE_FAMILY.AGE,
  AGE_RELAXATION: CANONICAL_RULE_FAMILY.AGE,
  QUALIFYING_EXAM_YEAR: CANONICAL_RULE_FAMILY.EDUCATION,
  EDUCATION_CUTOFF_DATE: CANONICAL_RULE_FAMILY.EDUCATION,
  QUALIFYING_SUBJECTS: CANONICAL_RULE_FAMILY.DISCIPLINE,
  DISCIPLINE_REQUIRED: CANONICAL_RULE_FAMILY.DISCIPLINE,
  STATE_ELIGIBILITY: CANONICAL_RULE_FAMILY.QUALIFYING_STATE,
  DOMICILE_REQUIRED: CANONICAL_RULE_FAMILY.DOMICILE,
  CATEGORY_RESERVATION: CANONICAL_RULE_FAMILY.CATEGORY_OR_RESERVATION,
  EXPERIENCE_REQUIRED: CANONICAL_RULE_FAMILY.EXPERIENCE
});

function normalizeRealRuleType(ruleType) {
  const type = typeof ruleType === 'string' ? ruleType.trim() : '';
  if (!Object.prototype.hasOwnProperty.call(RULE_TYPE_NORMALIZATION, type)) {
    return { isRecognized: false, ruleType: type || null, canonicalRuleFamily: null, failureCode: 'UNKNOWN_RULE_TYPE' };
  }
  return { isRecognized: true, ruleType: type, canonicalRuleFamily: RULE_TYPE_NORMALIZATION[type], failureCode: null };
}

function normalizeEvidenceLevels(raw = {}) {
  const sourceState = raw.sourceState || null;
  const validSha = typeof raw.documentSha256 === 'string' && /^[a-f0-9]{64}$/i.test(raw.documentSha256);
  const textBinding = raw.textBinding && typeof raw.textBinding === 'object' ? raw.textBinding : {};
  const levels = {
    URL_FOUND: Boolean(raw.officialSourceUrl),
    EXACT_DOCUMENT_RESOLVED: Boolean(raw.exactDocumentResolved || raw.documentIdentity),
    BYTES_ACQUIRED: Boolean(raw.bytesAcquired || sourceState === 'BYTES_INGESTED' || sourceState === 'SHA_VERIFIED'),
    SHA256_VERIFIED: Boolean(validSha && (raw.sha256Verified || sourceState === 'SHA_VERIFIED')),
    TEXT_EXTRACTED_AND_BOUND: Boolean(
      raw.textExtractedAndBound &&
      validSha &&
      typeof textBinding.extractedTextSha256 === 'string' && /^[a-f0-9]{64}$/i.test(textBinding.extractedTextSha256) &&
      Array.isArray(textBinding.pageBindings) && textBinding.pageBindings.length > 0
    )
  };
  return Object.freeze(levels);
}

function deriveFactVerificationLevel(rawFact = {}, sourceDocument = {}) {
  const levels = normalizeEvidenceLevels(sourceDocument);
  const normalized = normalizeRealRuleType(rawFact.ruleType);
  const hasEvidenceRefs = Array.isArray(rawFact.evidenceRefs) && rawFact.evidenceRefs.some(Boolean);
  if (levels.TEXT_EXTRACTED_AND_BOUND && normalized.isRecognized && hasEvidenceRefs) {
    return FACT_VERIFICATION_LEVEL.RULE_VERIFIED;
  }
  if (levels.TEXT_EXTRACTED_AND_BOUND) return FACT_VERIFICATION_LEVEL.TEXT_VERIFIED;
  if (levels.BYTES_ACQUIRED && levels.SHA256_VERIFIED) return FACT_VERIFICATION_LEVEL.BYTE_VERIFIED;
  if (levels.URL_FOUND || levels.EXACT_DOCUMENT_RESOLVED) return FACT_VERIFICATION_LEVEL.SOURCE_LOCATED;
  return null;
}

function auditRealPackageAuthority(pkg = {}) {
  const evidenceLevels = normalizeEvidenceLevels(pkg.baseNotification || {});
  const rules = Array.isArray(pkg.eligibilityRules) ? pkg.eligibilityRules : [];
  const ruleAudits = rules.map(rule => {
    const normalization = normalizeRealRuleType(rule.ruleType);
    const verificationLevel = deriveFactVerificationLevel(rule, pkg.baseNotification || {});
    return { ruleId: rule.ruleId || null, ...normalization, verificationLevel };
  });
  const unknownRuleTypes = ruleAudits.filter(a => !a.isRecognized).map(a => a.ruleType);
  const nonRuleVerifiedRuleIds = ruleAudits.filter(a => a.verificationLevel !== FACT_VERIFICATION_LEVEL.RULE_VERIFIED).map(a => a.ruleId);
  const priorCycleViolation = pkg.permanentMissionId === 'neet_(ug)-2027' && pkg.cycleId === 'NEET-UG-2026-EVIDENCE-BASE' && pkg.isPriorCycleReference !== true;
  const opportunityModelViolation = pkg.opportunityKind === 'ADMISSION_ENTRANCE' &&
    (pkg.vacancyMatrix?.model === 'JOB_VACANCY' || (Array.isArray(pkg.vacancyMatrix?.rows) && pkg.vacancyMatrix.rows.some(r => r.vacancies !== undefined)));
  return {
    evidenceLevels,
    ruleAudits,
    unknownRuleTypes,
    nonRuleVerifiedRuleIds,
    priorCycleViolation,
    opportunityModelViolation,
    hasByteAuthority: evidenceLevels.BYTES_ACQUIRED && evidenceLevels.SHA256_VERIFIED,
    hasTextAuthority: evidenceLevels.TEXT_EXTRACTED_AND_BOUND,
    hasRuleAuthority: rules.length > 0 && unknownRuleTypes.length === 0 && nonRuleVerifiedRuleIds.length === 0
  };
}

module.exports = {
  EVIDENCE_LEVEL,
  FACT_VERIFICATION_LEVEL,
  CANONICAL_RULE_FAMILY,
  RULE_TYPE_NORMALIZATION,
  normalizeRealRuleType,
  normalizeEvidenceLevels,
  deriveFactVerificationLevel,
  auditRealPackageAuthority
};
