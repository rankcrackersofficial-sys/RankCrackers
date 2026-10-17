/**
 * Governed syllabus decomposition policy.
 *
 * This module deliberately does not publish content. It creates bounded,
 * provenance-aware candidates. AI/domain knowledge may suggest candidates,
 * but it can never make a candidate student-visible by itself.
 */

const crypto = require('crypto');

const SOURCE_ROLES = Object.freeze({
  OFFICIAL_SYLLABUS: 'official_syllabus',
  OFFICIAL_PYQ: 'official_pyq',
  APPROVED_CURRICULUM: 'approved_curriculum',
  EXPERT_TAXONOMY: 'expert_taxonomy',
  AI_CANDIDATE: 'ai_candidate',
});

const CANDIDATE_STATES = Object.freeze({
  DRAFT: 'DRAFT_DERIVED',
  EVIDENCE_PENDING: 'EVIDENCE_PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
});

const PUBLICATION_STATES = Object.freeze({
  INTERNAL_ONLY: 'INTERNAL_ONLY',
  STUDENT_READY: 'STUDENT_READY',
});

const NOTIFICATION_CONTAMINATION = /reservation|vacanc(?:y|ies)|eligibility|age limit|application fee|scribe|medical|document verification|pay level|salary|category[- ]wise|sc\s*[/\\-]\s*st|\bobc\b|\bews\b|online application|correction window/i;

function stableId(parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 24);
}

function normalize(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sourceIsAllowedForLevel(sourceRole, level) {
  if (level === 'subject' || level === 'unit' || level === 'topic') {
    return [SOURCE_ROLES.OFFICIAL_SYLLABUS, SOURCE_ROLES.APPROVED_CURRICULUM, SOURCE_ROLES.EXPERT_TAXONOMY].includes(sourceRole);
  }
  if (level === 'micro_topic') {
    return [SOURCE_ROLES.OFFICIAL_PYQ, SOURCE_ROLES.APPROVED_CURRICULUM, SOURCE_ROLES.EXPERT_TAXONOMY].includes(sourceRole);
  }
  if (level === 'atomic_topic') {
    return [SOURCE_ROLES.OFFICIAL_PYQ, SOURCE_ROLES.APPROVED_CURRICULUM, SOURCE_ROLES.EXPERT_TAXONOMY].includes(sourceRole);
  }
  return false;
}

function makeCandidate({ missionId, subject, unit, topic, microTopic, atomicTopic, sourceRefs = [], sourceRole, derivationMethod, confidence = 0 }) {
  const level = atomicTopic ? 'atomic_topic' : microTopic ? 'micro_topic' : topic ? 'topic' : unit ? 'unit' : 'subject';
  const title = normalize(atomicTopic || microTopic || topic || unit || subject);
  const refs = sourceRefs.filter((ref) => ref && ref.sourceId && ref.sourcePage);
  const contaminated = refs.some((ref) => NOTIFICATION_CONTAMINATION.test(`${ref.title || ''} ${ref.excerpt || ''}`));
  const sourceBound = refs.length > 0 && !contaminated;
  const sourcePermitted = sourceIsAllowedForLevel(sourceRole, level);
  const safeConfidence = Math.max(0, Math.min(1, Number(confidence) || 0));
  const verified = sourceBound && sourcePermitted && safeConfidence >= 0.8 && derivationMethod;

  return {
    id: `tax_${stableId([missionId, subject, unit, topic, microTopic, atomicTopic])}`,
    missionId,
    level,
    subject: normalize(subject),
    unit: normalize(unit),
    topic: normalize(topic),
    microTopic: normalize(microTopic),
    atomicTopic: normalize(atomicTopic),
    sourceRole,
    sourceRefs: refs,
    derivationMethod: normalize(derivationMethod),
    confidence: safeConfidence,
    candidateState: verified ? CANDIDATE_STATES.VERIFIED : (sourceBound ? CANDIDATE_STATES.EVIDENCE_PENDING : CANDIDATE_STATES.DRAFT),
    publicationState: verified ? PUBLICATION_STATES.STUDENT_READY : PUBLICATION_STATES.INTERNAL_ONLY,
    isStudentVisible: verified,
    isPyqBacked: refs.some((ref) => ref.sourceRole === SOURCE_ROLES.OFFICIAL_PYQ),
    notificationContaminationDetected: contaminated,
  };
}

function validateCandidate(candidate) {
  const errors = [];
  if (!candidate.missionId) errors.push('MISSION_ID_REQUIRED');
  if (!candidate.subject) errors.push('SUBJECT_REQUIRED');
  if (!candidate.level) errors.push('LEVEL_REQUIRED');
  if (!candidate.sourceRole) errors.push('SOURCE_ROLE_REQUIRED');
  if (!sourceIsAllowedForLevel(candidate.sourceRole, candidate.level)) errors.push('SOURCE_ROLE_NOT_ALLOWED_FOR_LEVEL');
  if (!Array.isArray(candidate.sourceRefs) || candidate.sourceRefs.length === 0) errors.push('PROVENANCE_REQUIRED');
  if (candidate.notificationContaminationDetected) errors.push('NOTIFICATION_CONTAMINATION');
  if (candidate.isStudentVisible && candidate.candidateState !== CANDIDATE_STATES.VERIFIED) errors.push('UNVERIFIED_CANDIDATE_CANNOT_BE_VISIBLE');
  if (candidate.isStudentVisible && candidate.confidence < 0.8) errors.push('CONFIDENCE_BELOW_PUBLICATION_THRESHOLD');
  return { valid: errors.length === 0, errors };
}

function missionMode({ hasPyq, hasApprovedCurriculum, hasExpertReview }) {
  if (hasPyq) return 'PYQ_BACKED_CURRICULUM';
  if (hasApprovedCurriculum) return 'APPROVED_CURRICULUM_MODE';
  if (hasExpertReview) return 'EXPERT_TAXONOMY_MODE';
  return 'OFFICIAL_SYLLABUS_ONLY';
}

module.exports = {
  SOURCE_ROLES,
  CANDIDATE_STATES,
  PUBLICATION_STATES,
  NOTIFICATION_CONTAMINATION,
  makeCandidate,
  validateCandidate,
  missionMode,
  sourceIsAllowedForLevel,
};
