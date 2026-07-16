const PRO_VERIFICATION_STATUSES = Object.freeze({
  PENDING: 'PENDING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  NEEDS_HUMAN_REVIEW: 'NEEDS_HUMAN_REVIEW',
  BLOCKED_SOURCE_MISMATCH: 'BLOCKED_SOURCE_MISMATCH'
});

const PRO_VERIFICATION_DECISIONS = Object.freeze({
  PASS_TO_FOUNDER_REVIEW: 'PASS_TO_FOUNDER_REVIEW',
  SEND_BACK_TO_WORKER: 'SEND_BACK_TO_WORKER',
  BLOCK_PUBLICATION: 'BLOCK_PUBLICATION',
  REQUIRE_HUMAN_REVIEW: 'REQUIRE_HUMAN_REVIEW'
});

const PRO_VERIFICATION_REQUIRED_CATEGORIES = Object.freeze([
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
]);

const PRO_VERIFIER_PERMISSIONS = Object.freeze({
  canBlock: true,
  canPublish: false,
  founderFinalApprovalRequired: true
});

const PRO_VERIFICATION_OUTPUT_SCHEMA = Object.freeze({
  requiredFields: Object.freeze([
    'verificationStatus',
    'riskScore',
    'issues',
    'sampledPages',
    'sourceAgreement',
    'recommendation',
    'verifiedAt',
    'verifierModel',
    'decision',
    'founderReviewRequired'
  ])
});

const RISK_POLICY = Object.freeze({
  LOW: Object.freeze({ min: 0, max: 20 }),
  MEDIUM: Object.freeze({ min: 21, max: 50 }),
  HIGH: Object.freeze({ min: 51, max: 80 }),
  CRITICAL: Object.freeze({ min: 81, max: 100 })
});

const PRO_VERIFICATION_TRIGGER_RULES = Object.freeze({
  officialDocumentsRequireProVerificationBeforePublish: true,
  randomSampleRequiredPerExtractionRun: true,
  lowConfidenceRequiresProVerification: true,
  sourceMismatchBlocksPublication: true,
  proVerifierCannotWriteStudentDelivery: true
});

module.exports = {
  PRO_VERIFICATION_STATUSES,
  PRO_VERIFICATION_DECISIONS,
  PRO_VERIFICATION_REQUIRED_CATEGORIES,
  PRO_VERIFIER_PERMISSIONS,
  PRO_VERIFICATION_OUTPUT_SCHEMA,
  RISK_POLICY,
  PRO_VERIFICATION_TRIGGER_RULES
};