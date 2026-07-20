const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DECISION = 'APPROVE_210_CONCEPT_READY_CANONICAL_WRITE_AND_HOLD_12_DUPLICATES';
const HOLD_PATH = path.join('docs', 'patch_safety', 'FUP_2C_QCELL2_HOLD1_hold_resolution.json');

function fail(verdict, details) {
  const out = { phase: 'FUP-2C-QCELL2-DECISION1', verdict, details };
  console.log(JSON.stringify(out, null, 2));
  console.log(verdict);
  process.exit(1);
}

if (!fs.existsSync(HOLD_PATH)) {
  execFileSync(process.execPath, ['functions/audit_syllabus_atom_canonical_key_hold_resolution.js'], { stdio: 'pipe' });
}
if (!fs.existsSync(HOLD_PATH)) {
  fail('DECISION_POLICY_BLOCKED_MISSING_HOLD1_OUTPUT', { missing: HOLD_PATH });
}

const hold = JSON.parse(fs.readFileSync(HOLD_PATH, 'utf8'));
const input = hold.input || {};
const readiness = hold.futureCanonicalWriteReadiness || {};
const manifest = hold.futureWriteManifest || {};
const duplicates = hold.duplicateDisambiguation || {};
const rejected = hold.rejectedAtomPolicy || {};

const expected = {
  totalAtoms: 430,
  canonicalKeyPresent: 206,
  canonicalKeyMissing: 224,
  directCanonicalWriteReady: 1,
  founderApprovalNeeded: 210,
  duplicateDisambiguationNeeded: 12,
  rejectedExclude: 1,
  missingTitleBlocked: 0,
  sourceReviewBlocked: 0,
};

const actual = {
  totalAtoms: input.totalAtoms,
  canonicalKeyPresent: input.canonicalKeyPresent,
  canonicalKeyMissing: input.canonicalKeyMissing,
  directCanonicalWriteReady: readiness.CANONICAL_WRITE_READY,
  founderApprovalNeeded: readiness.CANONICAL_WRITE_READY_NEEDS_FOUNDER_APPROVAL,
  duplicateDisambiguationNeeded: readiness.BLOCKED_DUPLICATE_DISAMBIGUATION,
  rejectedExclude: readiness.EXCLUDE_REJECTED,
  missingTitleBlocked: readiness.BLOCKED_MISSING_REQUIRED_FIELDS,
  sourceReviewBlocked: readiness.REVIEW_REQUIRED_BEFORE_CANONICAL,
};

const drift = Object.entries(expected)
  .filter(([key, value]) => actual[key] !== value)
  .map(([key, value]) => ({ key, expected: value, actual: actual[key] }));

if (drift.length) {
  fail('DECISION_POLICY_BLOCKED_DRIFT', { expected, actual, drift });
}

const direct = actual.directCanonicalWriteReady;
const founderApprovedConcept = actual.founderApprovalNeeded;
const duplicateHeld = actual.duplicateDisambiguationNeeded;
const rejectedExcluded = actual.rejectedExclude;
const finalFutureCanonicalPreflightCount = direct + founderApprovedConcept;

const sample = (key) => ((manifest.samples || {})[key] || []).slice(0, 5).map((item) => ({
  dryRun: true,
  atomId: item.atomId,
  subject: item.subject,
  currentTitle: item.currentTitle || '',
  derivedTitle: item.derivedTitle || '',
  proposedCanonicalKey: item.proposedCanonicalKey || '',
  writeAllowedNow: false,
  studentVisible: false,
  questionCellAllowedNow: false,
  digiBookAllowedNow: false,
  crucibleAllowedNow: false,
  reason: item.reason || [],
}));

const approvedSamples = [
  ...sample('canonicalWriteReady').map((item) => ({
    ...item,
    decisionGroup: 'approvedForCanonicalWritePreflight',
    founderDecision: 'APPROVED_SCHEMA_CANONICAL_PREFLIGHT',
  })),
  ...sample('founderApprovalNeeded').map((item) => ({
    ...item,
    decisionGroup: 'approvedForCanonicalWritePreflight',
    founderDecision: 'APPROVED_SCHEMA_CANONICAL_PREFLIGHT',
  })),
];

const duplicateSamples = sample('duplicateDisambiguationNeeded').map((item) => ({
  ...item,
  decisionGroup: 'heldForDuplicateDisambiguation',
  founderDecision: 'HOLD_DUPLICATE_DISAMBIGUATION',
}));

const rejectedSamples = sample('excludedRejected').map((item) => ({
  ...item,
  decisionGroup: 'excludedRejected',
  founderDecision: 'EXCLUDE_REJECTED',
}));

const out = {
  phase: 'FUP-2C-QCELL2-DECISION1',
  founderDecisionApplied: {
    decisionPhrase: DECISION,
    approvedConceptReadyAtoms: founderApprovedConcept,
    directSafeCandidate: direct,
    finalFutureCanonicalPreflightCount,
    duplicateAtomsHeld: duplicateHeld,
    rejectedAtomsExcluded: rejectedExcluded,
    writeAllowedNow: false,
  },
  hold1InputVerification: {
    ...actual,
    inputDrift: false,
  },
  decisionGroups: {
    approvedForCanonicalWritePreflight: finalFutureCanonicalPreflightCount,
    heldForDuplicateDisambiguation: duplicateHeld,
    excludedRejected: rejectedExcluded,
    needsFurtherReview: 0,
    samples: {
      approvedForCanonicalWritePreflight: approvedSamples,
      heldForDuplicateDisambiguation: duplicateSamples,
      excludedRejected: rejectedSamples,
    },
  },
  countingInterpretation: {
    only210: false,
    twoHundredTenPlusOne: true,
    directCandidateIncludedIn210: false,
    finalCountExplanation: 'HOLD1 reports CANONICAL_WRITE_READY=1 and CANONICAL_WRITE_READY_NEEDS_FOUNDER_APPROVAL=210 as separate buckets, so QCELL3 preflight should plan 211 future canonicalKey candidates while holding 12 duplicates and excluding 1 rejected atom.',
  },
  duplicateHoldPolicy: {
    duplicatePhysicsAtoms: duplicateHeld,
    duplicateGroups: duplicates.duplicateGroups || 0,
    deterministicDisambiguationRequired: true,
    randomSuffixAllowed: false,
    timestampSuffixAllowed: false,
    atomIdFallbackAllowedNow: false,
    futureFounderApprovalRequired: true,
  },
  rejectedAtomPolicy: {
    rejectedCount: rejected.rejectedAtomCount || rejectedExcluded,
    rejectedAtomIds: rejected.rejectedAtomIds || [],
    canonicalKeyWriteAllowed: false,
    questionCellAllowed: false,
    digiBookAllowed: false,
    crucibleAllowed: false,
    futureRestorePath: rejected.futureRestorePath || 'Founder must explicitly restore status in a separate review phase.',
  },
  digiBookCrucibleUsagePolicy: {
    canonicalKeyMeansContentApproval: false,
    cellsCanBeBackendInfrastructure: true,
    digiBookCanUseMappedQuestionsAfterApproval: true,
    crucibleCanUseVerifiedCellCounts: true,
    autoGenerationAllowed: false,
    studentPublishAllowed: false,
  },
  recommendedNextPhase: 'READY_FOR_QCELL3_CANONICAL_WRITE_PREFLIGHT',
  confirmations: {
    noFirestoreWrite: true,
    noCanonicalKeyWrite: true,
    noQuestionCellWrite: true,
    noQuestionMappingWrite: true,
    noQuestionBankMigration: true,
    noSyllabusAtomsMutation: true,
    noTopicNodesPublish: true,
    noStudentDeliveryChange: true,
    noAiOrOcr: true,
    noProAiCall: true,
    noExtractionApply: true,
    noDeploy: true,
    noCrucibleGeneration: true,
    noDigiBookGeneration: true,
    noVestaCityTouch: true,
  },
  verdict: 'FUP_2C_QCELL2_DECISION1_POLICY_LOCKED',
};

console.log(JSON.stringify(out, null, 2));
console.log(out.verdict);

