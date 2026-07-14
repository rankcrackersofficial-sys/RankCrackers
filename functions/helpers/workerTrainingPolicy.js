const WORKER_MODES = Object.freeze({
  SAFE_AUTO: 'SAFE_AUTO',
  MANUAL_DEBUG: 'MANUAL_DEBUG',
  RETRY_FAILED: 'RETRY_FAILED',
  PRO_VERIFY: 'PRO_VERIFY',
  DISABLED: 'DISABLED'
});

const DEFAULT_WORKER_MODE = WORKER_MODES.MANUAL_DEBUG;

const AUTO_DETECT_POLICY = Object.freeze({
  DEFAULT_ALLOWED: false,
  REQUIRES_SEPARATE_APPROVAL: true,
  NEVER_MIX_WITH_NORMAL_BATCH: true,
  MUST_HAVE_EXPLICIT_AUDIT: true
});

const BATCH_POLICY = Object.freeze({
  MANUAL_DEBUG_LIMIT: 3,
  SAFE_AUTO_INITIAL_LIMIT: 3,
  MAX_RETRY_ATTEMPTS: 2,
  REQUIRE_READINESS_AUDIT: true,
  REQUIRE_POST_RUN_AUDIT: true
});

const SAFETY_REQUIREMENTS = Object.freeze({
  duplicatePageCheckRequired: true,
  sourceProofRequired: true,
  reviewLockRequired: true,
  emptyTextDetectionRequired: true,
  parentSideEffectBlockRequired: true,
  studentDeliveryBlockRequired: true,
  baselineDriftDetectionRequired: true,
  founderApprovalRequiredForPublish: true
});

const PRO_VERIFICATION_POLICY = Object.freeze({
  mandatoryCategories: Object.freeze([
    'syllabus',
    'PYQ',
    'notification',
    'answer_key',
    'cutoff',
    'result',
    'exam_rules',
    'low_confidence_output',
    'weak_or_empty_text',
    'duplicate_risk',
    'random_sample_per_run'
  ]),
  canBlock: true,
  canPublish: false,
  founderFinalApprovalRequired: true
});

module.exports = {
  WORKER_MODES,
  DEFAULT_WORKER_MODE,
  AUTO_DETECT_POLICY,
  BATCH_POLICY,
  SAFETY_REQUIREMENTS,
  PRO_VERIFICATION_POLICY
};