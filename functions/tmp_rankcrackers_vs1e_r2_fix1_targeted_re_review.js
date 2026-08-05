const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const timestamp = '20260805180500';
const blueprintPath = path.join(repoRoot, 'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ASSESSMENT_BLUEPRINT_V1.json');
const itemPackPath = path.join(repoRoot, 'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ORIGINAL_ITEM_DRAFT_PACK_V1.json');
const contractPath = path.join(repoRoot, 'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ANSWER_SOLUTION_CONTRACT_V1.json');
const outJson = path.join(repoRoot, 'docs/patch_safety', `RANKCRACKERS_VS1E_R2_FIX1_targeted_re_review_${timestamp}.json`);
const outMd = path.join(repoRoot, 'docs/patch_safety', `RANKCRACKERS_VS1E_R2_FIX1_targeted_re_review_${timestamp}.md`);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}
function assert(condition, message, failures) {
  if (!condition) failures.push(message);
}
function findBy(arr, key, value) {
  return arr.find((item) => item[key] === value);
}

const blueprint = readJson(blueprintPath);
const itemPack = readJson(itemPackPath);
const contract = readJson(contractPath);
const failures = [];
const warnings = [];

const as05 = findBy(blueprint.slots, 'slotId', 'AS_05');
const mf05 = findBy(itemPack.items, 'itemId', 'MF_ASI_05');
const asr05 = findBy(contract.records, 'answerRecordId', 'MF_ASR_05');
const mf09 = findBy(itemPack.items, 'itemId', 'MF_ASI_09');
const asr09 = findBy(contract.records, 'answerRecordId', 'MF_ASR_09');

assert(Boolean(as05), 'AS_05 missing from blueprint', failures);
assert(Boolean(mf05), 'MF_ASI_05 missing from item pack', failures);
assert(Boolean(asr05), 'MF_ASR_05 missing from answer solution contract', failures);
assert(Boolean(mf09), 'MF_ASI_09 missing from item pack', failures);
assert(Boolean(asr09), 'MF_ASR_09 missing from answer solution contract', failures);

if (as05 && mf05 && asr05) {
  assert(as05.scoringApproach === 'BINARY', `AS_05 blueprint scoringApproach expected BINARY, found ${as05.scoringApproach}`, failures);
  assert(as05.maxPoints === 2, `AS_05 blueprint maxPoints expected 2, found ${as05.maxPoints}`, failures);
  assert(as05.partialCreditAllowed === false, `AS_05 blueprint partialCreditAllowed expected false, found ${as05.partialCreditAllowed}`, failures);
  assert(mf05.pointValue === 2, `MF_ASI_05 pointValue expected 2, found ${mf05.pointValue}`, failures);
  assert(mf05.responseConstraints === 'Select exactly one option.', `MF_ASI_05 response constraint expected single option, found ${mf05.responseConstraints}`, failures);
  assert(mf05.partialCreditAnchors === 'NOT_APPLICABLE', `MF_ASI_05 partialCreditAnchors expected NOT_APPLICABLE, found ${mf05.partialCreditAnchors}`, failures);
  assert(asr05.pointValue === 2, `MF_ASR_05 pointValue expected 2, found ${asr05.pointValue}`, failures);
  assert(asr05.partialCreditRubric === 'NOT_APPLICABLE', `MF_ASR_05 partialCreditRubric expected NOT_APPLICABLE, found ${asr05.partialCreditRubric}`, failures);
  assert((asr05.operationalScoring || '').includes('2 points') && (asr05.operationalScoring || '').includes('0 points'), 'MF_ASR_05 operationalScoring must explicitly state 2/0 binary scoring', failures);
  assert(as05.authorizedAtomId === mf05.primaryAuthorizedAtomId, 'AS_05 atom mismatch between blueprint and item pack', failures);
  assert(mf05.primaryAuthorizedAtomId === asr05.primaryAuthorizedAtomId, 'MF_ASI_05 atom mismatch between item pack and contract', failures);
  assert(as05.conceptId === mf05.conceptId, 'AS_05 concept mismatch between blueprint and item pack', failures);
  assert(mf05.provisionalKeyCandidate === asr05.provisionalKeyCandidate, 'MF_ASI_05 key mismatch between item pack and contract', failures);
}

if (mf09 && asr09) {
  const expectedVariants = ['9', '9.0'];
  assert(mf09.responseConstraints === 'Numeric value only, rounded to one decimal place. Do not include units in your answer box.', `MF_ASI_09 responseConstraints expected numeric-only no-units, found ${mf09.responseConstraints}`, failures);
  assert(asr09.normalizedAcceptedResponse === '9.0', `MF_ASR_09 normalizedAcceptedResponse expected 9.0, found ${asr09.normalizedAcceptedResponse}`, failures);
  assert(JSON.stringify(asr09.acceptedResponseVariants) === JSON.stringify(expectedVariants), `MF_ASR_09 accepted variants expected ${JSON.stringify(expectedVariants)}, found ${JSON.stringify(asr09.acceptedResponseVariants)}`, failures);
  assert(!asr09.acceptedResponseVariants.some((variant) => /[a-zA-Z]/.test(variant)), 'MF_ASR_09 accepted variants must not include unit-bearing strings', failures);
  assert((asr09.answerDerivation || '').includes('Unit-bearing strings') && (asr09.answerDerivation || '').includes('rejected'), 'MF_ASR_09 answerDerivation must explain unit-bearing string rejection', failures);
  assert(mf09.provisionalKeyCandidate === asr09.provisionalKeyCandidate, 'MF_ASI_09 key mismatch between item pack and contract', failures);
}

const blueprintStudentFlags = blueprint.slots.filter((slot) => slot.safetyFlags?.studentPublishReady !== false).map((slot) => slot.slotId);
const itemStudentFlags = itemPack.items.filter((item) => item.studentPublishReady !== false || (item.safetyFlags && item.safetyFlags.studentPublishReady !== false)).map((item) => item.itemId);
const contractStudentFlags = contract.records.filter((record) => record.studentPublishReady !== false || record.safetyFlags?.studentPublishReady !== false).map((record) => record.answerRecordId);

assert(blueprint.safetyFlags.studentPublishReady === false, 'Blueprint top-level studentPublishReady must be false', failures);
assert(itemPack.safetyFlags.studentPublishReady === false, 'Item pack top-level studentPublishReady must be false', failures);
assert(contract.safetyFlags.studentPublishReady === false, 'Contract top-level studentPublishReady must be false', failures);
assert(contract.officialAnswerKey === false, 'Contract top-level officialAnswerKey must be false', failures);
assert(contract.status === 'DRAFT_FOR_INDEPENDENT_REVIEW', `Contract status expected DRAFT_FOR_INDEPENDENT_REVIEW, found ${contract.status}`, failures);
assert(contract.safetyFlags.answerReviewStatus === 'PENDING_INDEPENDENT_REVIEW', `Contract answerReviewStatus expected PENDING_INDEPENDENT_REVIEW, found ${contract.safetyFlags.answerReviewStatus}`, failures);
assert(contract.safetyFlags.solutionReviewStatus === 'PENDING_INDEPENDENT_REVIEW', `Contract solutionReviewStatus expected PENDING_INDEPENDENT_REVIEW, found ${contract.safetyFlags.solutionReviewStatus}`, failures);
assert(contract.safetyFlags.studentReadiness === 'NOT_READY', `Contract studentReadiness expected NOT_READY, found ${contract.safetyFlags.studentReadiness}`, failures);
assert(blueprintStudentFlags.length === 0, `Blueprint slot studentPublishReady violations: ${blueprintStudentFlags.join(', ')}`, failures);
assert(itemStudentFlags.length === 0, `Item studentPublishReady violations: ${itemStudentFlags.join(', ')}`, failures);
assert(contractStudentFlags.length === 0, `Contract record studentPublishReady violations: ${contractStudentFlags.join(', ')}`, failures);

if (blueprint.slots.length !== itemPack.items.length || itemPack.items.length !== contract.records.length) {
  failures.push(`Count mismatch: blueprint=${blueprint.slots.length}, itemPack=${itemPack.items.length}, contract=${contract.records.length}`);
}

function normalizeAnswerText(value) {
  return String(value || '')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/\s+/g, ' ')
    .trim();
}
function keyAlignedForReview(item, record) {
  if (!item || !record) return false;
  if (normalizeAnswerText(item.provisionalKeyCandidate) === normalizeAnswerText(record.provisionalKeyCandidate)) return true;
  const openFormats = new Set(['SHORT_REASONED_RESPONSE']);
  return openFormats.has(item.itemFormat) && record.answerMatch === true && Boolean(record.acceptableEvidence);
}

const crossMap = blueprint.slots.map((slot) => {
  const item = itemPack.items.find((candidate) => candidate.blueprintSlotId === slot.slotId);
  const record = item ? contract.records.find((candidate) => candidate.itemId === item.itemId) : null;
  return {
    slotId: slot.slotId,
    itemId: item?.itemId || null,
    answerRecordId: record?.answerRecordId || null,
    atomAligned: Boolean(item && record && slot.authorizedAtomId.includes(item.primaryAuthorizedAtomId) && item.primaryAuthorizedAtomId === record.primaryAuthorizedAtomId),
    pointAligned: Boolean(item && record && slot.maxPoints === item.pointValue && item.pointValue === record.pointValue),
    keyAligned: keyAlignedForReview(item, record),
    studentLocked: Boolean(slot.safetyFlags?.studentPublishReady === false && item?.studentPublishReady === false && record?.studentPublishReady === false)
  };
});

for (const row of crossMap) {
  assert(row.itemId, `Missing item for slot ${row.slotId}`, failures);
  assert(row.answerRecordId, `Missing answer record for slot ${row.slotId}`, failures);
  assert(row.atomAligned, `Atom alignment failed for ${row.slotId}/${row.itemId}/${row.answerRecordId}`, failures);
  assert(row.pointAligned, `Point alignment failed for ${row.slotId}/${row.itemId}/${row.answerRecordId}`, failures);
  assert(row.keyAligned, `Key alignment failed for ${row.slotId}/${row.itemId}/${row.answerRecordId}`, failures);
  assert(row.studentLocked, `Student lock failed for ${row.slotId}/${row.itemId}/${row.answerRecordId}`, failures);
}

const evidence = {
  phase: 'RANKCRACKERS_VS1E_R2_FIX1_TARGETED_RE_REVIEW',
  verdict: failures.length === 0
    ? 'RANKCRACKERS_VS1E_R2_FIX1_TARGETED_RE_REVIEW_PASS_READY_FOR_INDEPENDENT_REVIEW'
    : 'RANKCRACKERS_VS1E_R2_FIX1_TARGETED_RE_REVIEW_BLOCKED',
  authoritativeHeadBeforeReview: 'cb7980cfdb620dfa53a89e6199d26eb19c1d65d5',
  linkedCommits: {
    blueprintCorrectionVS1DFIX3: 'a88d03f56ec7d860d6424ec0bdb1273aa394642b',
    itemPackCorrectionVS1EAFIX3: '89410c6d362c345223527138981d6952cb7b7bf0',
    contractCorrectionVS1ER2FIX1: 'cb7980cfdb620dfa53a89e6199d26eb19c1d65d5'
  },
  filesAudited: [
    'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ASSESSMENT_BLUEPRINT_V1.json',
    'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ORIGINAL_ITEM_DRAFT_PACK_V1.json',
    'docs/assessment/internal/JEE_MAIN_2026_PHYSICS_MECHANICS_FOUNDATIONS_ANSWER_SOLUTION_CONTRACT_V1.json'
  ],
  targetedChecks: {
    as05BinaryScoring: failures.filter((failure) => failure.includes('AS_05') || failure.includes('MF_ASI_05') || failure.includes('MF_ASR_05')).length === 0,
    mfAsi09NumericOnlyNormalization: failures.filter((failure) => failure.includes('MF_ASI_09') || failure.includes('MF_ASR_09')).length === 0,
    slotItemAnswerCrossAlignment: crossMap.every((row) => row.atomAligned && row.pointAligned && row.keyAligned),
    studentSafetyLocksPreserved: blueprintStudentFlags.length === 0 && itemStudentFlags.length === 0 && contractStudentFlags.length === 0,
    independentReviewPendingPreserved: contract.safetyFlags.answerReviewStatus === 'PENDING_INDEPENDENT_REVIEW' && contract.safetyFlags.solutionReviewStatus === 'PENDING_INDEPENDENT_REVIEW',
    notReadyPreserved: contract.safetyFlags.studentReadiness === 'NOT_READY'
  },
  as05Correction: as05 && mf05 && asr05 ? {
    blueprint: {
      scoringApproach: as05.scoringApproach,
      maxPoints: as05.maxPoints,
      partialCreditAllowed: as05.partialCreditAllowed
    },
    itemPack: {
      itemId: mf05.itemId,
      pointValue: mf05.pointValue,
      responseConstraints: mf05.responseConstraints,
      partialCreditAnchors: mf05.partialCreditAnchors,
      provisionalKeyCandidate: mf05.provisionalKeyCandidate
    },
    contract: {
      answerRecordId: asr05.answerRecordId,
      pointValue: asr05.pointValue,
      partialCreditRubric: asr05.partialCreditRubric,
      operationalScoring: asr05.operationalScoring,
      acceptedResponseVariants: asr05.acceptedResponseVariants
    }
  } : null,
  mfAsi09Correction: mf09 && asr09 ? {
    itemPack: {
      responseConstraints: mf09.responseConstraints,
      provisionalKeyCandidate: mf09.provisionalKeyCandidate
    },
    contract: {
      normalizedAcceptedResponse: asr09.normalizedAcceptedResponse,
      acceptedResponseVariants: asr09.acceptedResponseVariants,
      unitBearingAccepted: asr09.acceptedResponseVariants.some((variant) => /[a-zA-Z]/.test(variant))
    }
  } : null,
  counts: {
    blueprintSlots: blueprint.slots.length,
    itemPackItems: itemPack.items.length,
    answerContractRecords: contract.records.length,
    crossMapRows: crossMap.length,
    failures: failures.length,
    warnings: warnings.length
  },
  crossMap,
  failures,
  warnings,
  safetyLocks: {
    studentPublishReady: false,
    officialAnswerKey: false,
    firestoreMaterializationAuthorized: false,
    studentReadiness: 'NOT_READY',
    answerReviewStatus: 'PENDING_INDEPENDENT_REVIEW',
    solutionReviewStatus: 'PENDING_INDEPENDENT_REVIEW',
    founderApprovalStatus: 'PENDING',
    proReviewStatus: 'PENDING'
  },
  notDone: [
    'NO_STUDENT_PUBLISH',
    'NO_FIRESTORE_MATERIALIZATION',
    'NO_QUESTION_PACK_ATTACHMENT',
    'NO_CRUCIBLE_READY_FLAG',
    'NO_FOUNDER_APPROVAL',
    'NO_PRO_REVIEW_APPROVAL'
  ],
  nextRecommendedPhase: failures.length === 0
    ? 'RANKCRACKERS_VS1E_R3_INDEPENDENT_ANSWER_SOLUTION_REVIEW_PRECHECK'
    : 'RANKCRACKERS_VS1E_R2_FIX2_TARGETED_CORRECTION'
};

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(evidence, null, 2) + '\n');

const md = `# RANKCRACKERS VS1E-R2-FIX1 Targeted Re-Review

Verdict: **${evidence.verdict}**

## Purpose

This targeted re-review verifies the synchronized correction chain across the Mechanics Foundations assessment blueprint, original item draft pack, and answer/solution contract. The review focuses on the two corrected risk areas: AS_05 single-choice scoring feasibility and MF_ASI_09 numeric-only answer normalization.

## Linked Correction Commits

- VS1D-FIX3 Blueprint Correction: \`${evidence.linkedCommits.blueprintCorrectionVS1DFIX3}\`
- VS1E-A-FIX3 Item-Pack Correction: \`${evidence.linkedCommits.itemPackCorrectionVS1EAFIX3}\`
- VS1E-R2-FIX1 Contract Correction: \`${evidence.linkedCommits.contractCorrectionVS1ER2FIX1}\`

## Files Audited

${evidence.filesAudited.map((file) => `- \`${file}\``).join('\n')}

## Targeted Check Results

- AS_05 binary scoring aligned: ${evidence.targetedChecks.as05BinaryScoring}
- MF_ASI_09 numeric-only normalization aligned: ${evidence.targetedChecks.mfAsi09NumericOnlyNormalization}
- Slot-item-answer cross alignment: ${evidence.targetedChecks.slotItemAnswerCrossAlignment}
- Student safety locks preserved: ${evidence.targetedChecks.studentSafetyLocksPreserved}
- Independent review pending preserved: ${evidence.targetedChecks.independentReviewPendingPreserved}
- NOT_READY preserved: ${evidence.targetedChecks.notReadyPreserved}

## AS_05 Correction Lock

- Blueprint scoringApproach: ${evidence.as05Correction?.blueprint.scoringApproach}
- Blueprint maxPoints: ${evidence.as05Correction?.blueprint.maxPoints}
- Blueprint partialCreditAllowed: ${evidence.as05Correction?.blueprint.partialCreditAllowed}
- Item pointValue: ${evidence.as05Correction?.itemPack.pointValue}
- Item response constraint: ${evidence.as05Correction?.itemPack.responseConstraints}
- Item partialCreditAnchors: ${evidence.as05Correction?.itemPack.partialCreditAnchors}
- Contract operational scoring: ${evidence.as05Correction?.contract.operationalScoring}

## MF_ASI_09 Normalization Lock

- Item response constraint: ${evidence.mfAsi09Correction?.itemPack.responseConstraints}
- Contract normalized response: ${evidence.mfAsi09Correction?.contract.normalizedAcceptedResponse}
- Contract accepted variants: ${JSON.stringify(evidence.mfAsi09Correction?.contract.acceptedResponseVariants)}
- Unit-bearing variants accepted: ${evidence.mfAsi09Correction?.contract.unitBearingAccepted}

## Counts

- Blueprint slots: ${evidence.counts.blueprintSlots}
- Item-pack items: ${evidence.counts.itemPackItems}
- Answer/solution records: ${evidence.counts.answerContractRecords}
- Cross-map rows: ${evidence.counts.crossMapRows}
- Failures: ${evidence.counts.failures}
- Warnings: ${evidence.counts.warnings}

## Safety Locks

- studentPublishReady = false
- officialAnswerKey = false
- firestoreMaterializationAuthorized = false
- studentReadiness = NOT_READY
- answerReviewStatus = PENDING_INDEPENDENT_REVIEW
- solutionReviewStatus = PENDING_INDEPENDENT_REVIEW
- founderApprovalStatus = PENDING
- proReviewStatus = PENDING

## Not Done

${evidence.notDone.map((item) => `- ${item}`).join('\n')}

## Failures

${evidence.failures.length === 0 ? '- None' : evidence.failures.map((failure) => `- ${failure}`).join('\n')}

## Next Recommended Phase

${evidence.nextRecommendedPhase}
`;

fs.writeFileSync(outMd, md);
console.log(JSON.stringify({ verdict: evidence.verdict, failures: failures.length, json: path.relative(repoRoot, outJson), md: path.relative(repoRoot, outMd) }, null, 2));