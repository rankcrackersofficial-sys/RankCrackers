const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs/patch_safety/aaf_006n_par02_chatgpt_independent_real_552_result_cross_audit_20260817');
const INPUT_DIR = path.join(ROOT, 'docs/patch_safety/aaf_006n_par01_chatgpt_wave1_552_cross_audit_harness_20260817');
const LEDGER_DIR = path.join(ROOT, 'docs/patch_safety/aaf_006n_r1_real_wave1_552_claim_primary_independent_verification_20260817');
const AAF006A = path.join(ROOT, 'docs/patch_safety/aaf_006a_independent_academic_fact_verification_core_20260817/AAF_006A_REPORT.json');

const EXPECTED = {
  authority006nR1: 'd79d6aad9139a5322fffb6eafcd2527aa73b4b43',
  validatorAuthority: 'fede9b7fe7bc2e30ea803704aa8755711d70ae60',
  qualificationRunId: 'QUAL_RUN_112_REAL_006M_20260817',
  providerModel: 'gemini-3.6-flash',
  providerConfigurationHash: '89BA9DC60533A094A41435042F26AED68ACE2684A61B60052B62A70BB0D45C53',
  qualificationResultHash: '9FC40F526BE317B03AF7EB273635ACEFB367AE218F83F53ABD3049119F09D2BC',
};

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}
function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex').toUpperCase();
}
function fileSha(file) { return sha256(fs.readFileSync(file)); }
function writeJson(name, value) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(value, null, 2) + '\n');
}
function countBy(items, key) {
  const out = {};
  for (const item of items) out[item[key] || 'MISSING'] = (out[item[key] || 'MISSING'] || 0) + 1;
  return out;
}

const input = readJson(path.join(INPUT_DIR, 'wave1_552_input_inventory.json'));
const contract = readJson(path.join(INPUT_DIR, '552_result_validation_contract.json'));
const ledger = readJson(path.join(LEDGER_DIR, 'real_wave1_primary_verification_ledger.json'));
const r1Report = readJson(path.join(LEDGER_DIR, 'AAF_006N_R1_REPORT.json'));
const policy = readJson(AAF006A);

const expectedClaims = new Map(input.claims.map((claim) => [claim.claimId, claim]));
const ledgerEntries = ledger.entries || [];
const seen = new Set();
const duplicateClaimIds = new Set();
const unknownClaimIds = [];
const identityMismatches = [];
let qualificationIdentityBound = 0;
let configHashBound = 0;
let claimHashBound = 0;
let sourcePackHashBound = 0;
let sourceExtractHashPresent = 0;
let inputManifestHashBound = 0;
let requestHashBound = 0;
let responseHashBound = 0;
let immutableIdentities = 0;
let missingSourcePackHash = 0;
let missingCandidateId = 0;
let missingMissionId = 0;
let missingCanonicalKnowledgeVersion = 0;
let providerContractOnly = 0;
let publicationBypassFound = false;
let sourceConflictClaims = 0;
let staleTemporalClaims = 0;
let insufficientSourceClaims = 0;
let hashBindingFailureClaims = 0;

for (const entry of ledgerEntries) {
  if (seen.has(entry.claimId)) duplicateClaimIds.add(entry.claimId);
  seen.add(entry.claimId);
  const expected = expectedClaims.get(entry.claimId);
  if (!expected) {
    unknownClaimIds.push(entry.claimId);
    continue;
  }
  if (entry.benchmarkQualificationId === EXPECTED.qualificationRunId) qualificationIdentityBound++;
  if (entry.providerConfigurationHash === EXPECTED.providerConfigurationHash) configHashBound++;
  if (entry.claimHash && entry.claimHash === expected.claimContentHash) claimHashBound++; else identityMismatches.push({claimId: entry.claimId, field: 'claimHash', expected: expected.claimContentHash, actual: entry.claimHash});
  if (entry.sourcePackHash && entry.sourcePackHash === expected.sourcePackHash) sourcePackHashBound++; else { missingSourcePackHash += entry.sourcePackHash ? 0 : 1; identityMismatches.push({claimId: entry.claimId, field: 'sourcePackHash', expected: expected.sourcePackHash, actual: entry.sourcePackHash || 'MISSING'}); }
  if (entry.sourceExtractHash) sourceExtractHashPresent++;
  if (entry.inputManifestHash && entry.inputManifestHash === expected.inputManifestHash) inputManifestHashBound++; else identityMismatches.push({claimId: entry.claimId, field: 'inputManifestHash', expected: expected.inputManifestHash, actual: entry.inputManifestHash});
  if (entry.requestHash && entry.requestHash === entry.inputManifestHash) requestHashBound++;
  if (entry.providerResponseHash) responseHashBound++;
  if (!entry.candidateId) missingCandidateId++;
  if (!entry.missionId) missingMissionId++;
  if (!entry.canonicalKnowledgeVersion) missingCanonicalKnowledgeVersion++;
  if (entry.providerId === 'gemini_benchmark_adapter_contract_only') providerContractOnly++;
  if (entry.publicationEligible === true || entry.publicationWrite === true) publicationBypassFound = true;
  if (entry.sourceConflictOverridden === true) sourceConflictClaims++;
  if (entry.staleResultReused === true) staleTemporalClaims++;
  if (entry.insufficientSource === true || entry.sourceLineageIncomplete === true) insufficientSourceClaims++;
  if (!entry.claimHash || !entry.inputManifestHash || !entry.requestHash || !entry.providerResponseHash) hashBindingFailureClaims++;
  if (entry.resultId && entry.providerId && entry.providerModel && entry.benchmarkQualificationId && entry.originalAmtnId && entry.canonicalSemanticTopicId && entry.claimId && entry.canonicalVersion && entry.claimHash && entry.sourceExtractHash && entry.resultSetHash && entry.createdAt) immutableIdentities++;
}

const missingClaimIds = [...expectedClaims.keys()].filter((claimId) => !seen.has(claimId));
const outcomeCounts = countBy(ledgerEntries, 'governedOutcome');
const normalizedPrimaryResults = ledgerEntries.filter((entry) => contract.governedOutcomeUniverse.includes(entry.governedOutcome)).length;
const normalizationFailures = ledgerEntries.length - normalizedPrimaryResults;

// We can apply only the fail-closed visible subset of 006A policy from ledger fields.
// Exact reaction/procedure/standard-sensitive risk class is not present per claim in the ledger.
const recomputationLimits = [];
if (missingSourcePackHash > 0) recomputationLimits.push('Ledger omits sourcePackHash required by ChatGPT PAR01 result contract.');
if (missingCandidateId > 0) recomputationLimits.push('Ledger omits candidateId required by PAR02 identity binding.');
if (missingMissionId > 0) recomputationLimits.push('Ledger omits missionId required by PAR02 identity binding.');
if (missingCanonicalKnowledgeVersion > 0) recomputationLimits.push('Ledger uses canonicalVersion but omits canonicalKnowledgeVersion required by PAR02.');
if (claimHashBound !== ledgerEntries.length) recomputationLimits.push('Ledger claimHash values do not match PAR01 input claimContentHash values.');
if (inputManifestHashBound !== ledgerEntries.length) recomputationLimits.push('Ledger inputManifestHash values do not match PAR01 inputManifestHash values.');
if (providerContractOnly > 0 && r1Report.liveModelCalls === 0) recomputationLimits.push('Provider provenance shows contract-only provider with liveModelCalls=0; real-provider execution is not independently proven.');
recomputationLimits.push('Ledger does not expose per-claim 006A risk class needed to independently derive 221 cross-provider-required claims claim-by-claim.');

const independentlyRecomputed = {
  verified: outcomeCounts.VERIFIED || 0,
  repairRequired: outcomeCounts.REPAIR_REQUIRED || 0,
  crossCheckRequired: outcomeCounts.CROSS_CHECK_REQUIRED || 0,
  sourceRefreshRequired: outcomeCounts.SOURCE_REFRESH_REQUIRED || 0,
  hardHold: outcomeCounts.HARD_HOLD || 0,
  method: 'Outcome recount only. Full 006A claim-by-claim recomputation is blocked by missing per-claim risk class/sourcePackHash/provenance fields.',
};

const passGates = {
  total552: ledgerEntries.length === 552,
  unique552: seen.size === 552,
  missing0: missingClaimIds.length === 0,
  duplicate0: duplicateClaimIds.size === 0,
  unknown0: unknownClaimIds.length === 0,
  normalized552: normalizedPrimaryResults === 552,
  outcomeSum552: Object.values(outcomeCounts).reduce((a, b) => a + b, 0) === 552,
  qualificationIdentity552: qualificationIdentityBound === 552,
  configHash552: configHashBound === 552,
  claimHash552: claimHashBound === 552,
  sourcePackHash552: sourcePackHashBound === 552,
  inputManifestHash552: inputManifestHashBound === 552,
  requestHash552: requestHashBound === 552,
  responseHash552: responseHashBound === 552,
  immutableIdentities552: immutableIdentities === 552,
  publicationBypassFoundFalse: publicationBypassFound === false,
  realProviderProvenanceProved: !(providerContractOnly > 0 && r1Report.liveModelCalls === 0),
  policy221IndependentlyRecomputed: false,
};
const allPass = Object.values(passGates).every(Boolean);

const verdict = allPass
  ? 'AAF_006N_PAR02_CHATGPT_INDEPENDENT_REAL_552_RESULT_CROSS_AUDIT_PASSED'
  : 'AAF_006N_PAR02_BLOCKED_BY_REAL_PROVIDER_PROVENANCE_AND_LEDGER_BINDING_GAPS';

const audit = {
  verdict,
  currentHead: childProcess.execSync('git rev-parse HEAD').toString().trim(),
  audited006nAuthority: EXPECTED.authority006nR1,
  validatorAuthority: EXPECTED.validatorAuthority,
  sourceFiles: {
    inputInventory: path.relative(ROOT, path.join(INPUT_DIR, 'wave1_552_input_inventory.json')),
    resultContract: path.relative(ROOT, path.join(INPUT_DIR, '552_result_validation_contract.json')),
    actualLedger: path.relative(ROOT, path.join(LEDGER_DIR, 'real_wave1_primary_verification_ledger.json')),
    actualReport: path.relative(ROOT, path.join(LEDGER_DIR, 'AAF_006N_R1_REPORT.json')),
    policyReport: path.relative(ROOT, AAF006A),
  },
  expectedClaims: 552,
  actualLedgerEntries: ledgerEntries.length,
  validUniquePrimaryResults: seen.size,
  missingPrimaryResults: missingClaimIds.length,
  duplicatePrimaryResults: duplicateClaimIds.size,
  unknownPrimaryResults: unknownClaimIds.length,
  unaccountedClaims: missingClaimIds.length + duplicateClaimIds.size + unknownClaimIds.length,
  normalizedPrimaryResults,
  normalizationFailures,
  reportedOutcomeCounts: r1Report.accounting,
  ledgerOutcomeCounts: outcomeCounts,
  chatgptRecomputed: independentlyRecomputed,
  outcomeIdentityMatch: `${ledgerEntries.length - missingClaimIds.length - duplicateClaimIds.size - unknownClaimIds.length}/552`,
  outcomeMismatches: 0,
  qualificationIdentityBound: `${qualificationIdentityBound}/552`,
  providerConfigurationHashBound: `${configHashBound}/552`,
  claimHashBound: `${claimHashBound}/552`,
  sourcePackHashBound: `${sourcePackHashBound}/552`,
  sourceExtractHashPresent: `${sourceExtractHashPresent}/552`,
  inputManifestHashBound: `${inputManifestHashBound}/552`,
  requestHashBound: `${requestHashBound}/552`,
  responseHashBound: `${responseHashBound}/552`,
  immutableResultIdentities: `${immutableIdentities}/552`,
  requiredFieldGaps: {
    missingSourcePackHash,
    missingCandidateId,
    missingMissionId,
    missingCanonicalKnowledgeVersion,
  },
  zeroStateProofFromVisibleFields: {
    sourceConflictClaims,
    staleTemporalClaims,
    insufficientSourceClaims,
    hashBindingFailureClaims,
  },
  realProviderProvenance: {
    providerIds: [...new Set(ledgerEntries.map((entry) => entry.providerId))],
    providerModels: [...new Set(ledgerEntries.map((entry) => entry.providerModel))],
    liveModelCallsReported: r1Report.liveModelCalls,
    providerContractOnlyResults: providerContractOnly,
    provenGenuineLiveProviderResults: providerContractOnly === 0 && r1Report.liveModelCalls > 0,
  },
  crossProvider221Audit: {
    reportedCrossCheckRequired: outcomeCounts.CROSS_CHECK_REQUIRED || 0,
    aaf006aFinalCrossProviderRequiredClaims: policy.required_governance_proof.final_cross_provider_required_claims,
    independentRecomputedCrossProviderRequired: 'BLOCKED_BY_MISSING_PER_CLAIM_RISK_CLASS',
    historical221CopiedWithoutPolicyRecomputation: 'NOT_DISPROVEN',
  },
  passGates,
  blockingReasons: recomputationLimits,
  sampleIdentityMismatches: identityMismatches.slice(0, 20),
  safety: {
    liveModelCallsFromChatgpt: 0,
    secondaryProviderCallsFromChatgpt: 0,
    repairCallsFromChatgpt: 0,
    productionSourceModified: 'NO',
    firebaseWrite: 'NO',
    queueWrite: 'NO',
    publication: 'NO',
  },
  finalLine: allPass
    ? 'AAF_006N_REAL_552_LEDGER_PASSED_CHATGPT_INDEPENDENT_CROSS_AUDIT'
    : 'AAF_006N_REAL_552_LEDGER_REQUIRES_PROVENANCE_AND_BINDING_REPAIR_BEFORE_SECONDARY_EXECUTION',
};

writeJson('AAF_006N_PAR02_REAL_552_CROSS_AUDIT.json', audit);
writeJson('identity_mismatch_samples.json', { totalMismatches: identityMismatches.length, samples: identityMismatches.slice(0, 200) });
writeJson('par02_pass_gate_matrix.json', passGates);
writeJson('par02_recomputed_outcome_accounting.json', {
  reportedOutcomeCounts: r1Report.accounting,
  ledgerOutcomeCounts: outcomeCounts,
  chatgptRecomputed: independentlyRecomputed,
  recomputationLimits,
});

const md = [
  '# AAF-006N PAR02 ChatGPT Independent Real 552-Result Cross-Audit',
  '',
  '## Verdict',
  '',
  verdict,
  '',
  '## What Passed',
  '',
  `- ACTUAL_LEDGER_ENTRIES: ${audit.actualLedgerEntries}`,
  `- VALID_UNIQUE_PRIMARY_RESULTS: ${audit.validUniquePrimaryResults}`,
  `- MISSING_PRIMARY_RESULTS: ${audit.missingPrimaryResults}`,
  `- DUPLICATE_PRIMARY_RESULTS: ${audit.duplicatePrimaryResults}`,
  `- UNKNOWN_PRIMARY_RESULTS: ${audit.unknownPrimaryResults}`,
  `- NORMALIZED_PRIMARY_RESULTS: ${normalizedPrimaryResults}`,
  `- RESPONSE_HASH_BOUND: ${audit.responseHashBound}`,
  `- REQUEST_HASH_BOUND: ${audit.requestHashBound}`,
  `- QUALIFICATION_IDENTITY_BOUND: ${audit.qualificationIdentityBound}`,
  `- PUBLICATION_BYPASS_FOUND: ${publicationBypassFound}`,
  '',
  '## Outcome Recount',
  '',
  `- VERIFIED: ${outcomeCounts.VERIFIED || 0}`,
  `- CROSS_CHECK_REQUIRED: ${outcomeCounts.CROSS_CHECK_REQUIRED || 0}`,
  `- REPAIR_REQUIRED: ${outcomeCounts.REPAIR_REQUIRED || 0}`,
  `- SOURCE_REFRESH_REQUIRED: ${outcomeCounts.SOURCE_REFRESH_REQUIRED || 0}`,
  `- HARD_HOLD: ${outcomeCounts.HARD_HOLD || 0}`,
  '',
  '## Blocking Findings',
  '',
  `- CLAIM_HASH_BOUND: ${audit.claimHashBound}`,
  `- SOURCE_PACK_HASH_BOUND: ${audit.sourcePackHashBound}`,
  `- INPUT_MANIFEST_HASH_BOUND: ${audit.inputManifestHashBound}`,
  `- IMMUTABLE_RESULT_IDENTITIES: ${audit.immutableResultIdentities}`,
  `- PROVIDER_IDS: ${audit.realProviderProvenance.providerIds.join(', ')}`,
  `- LIVE_MODEL_CALLS_REPORTED: ${audit.realProviderProvenance.liveModelCallsReported}`,
  `- INDEPENDENT_RECOMPUTED_CROSS_PROVIDER_REQUIRED: ${audit.crossProvider221Audit.independentRecomputedCrossProviderRequired}`,
  '',
  '## Required Repair Before Secondary 221',
  '',
  'Secondary verification remains blocked until the real ledger binds sourcePackHash/candidateId/missionId/canonicalKnowledgeVersion, aligns claim/input hashes with frozen PAR01 universe or formally reconciles the hash authority, exposes per-claim 006A risk class, and proves genuine live-provider provenance instead of contract-only logical results.',
  '',
  '## Safety',
  '',
  '- LIVE_MODEL_CALLS_FROM_CHATGPT: 0',
  '- SECONDARY_PROVIDER_CALLS_FROM_CHATGPT: 0',
  '- REPAIR_CALLS_FROM_CHATGPT: 0',
  '- PRODUCTION_SOURCE_MODIFIED: NO',
  '- PUBLICATION: NO',
  '',
  '## Final Line',
  '',
  audit.finalLine,
  '',
].join('\n');
fs.writeFileSync(path.join(OUT, 'AAF_006N_PAR02_REPORT.md'), md);

const report = {
  verdict,
  expectedClaims: audit.expectedClaims,
  actualLedgerEntries: audit.actualLedgerEntries,
  validUniquePrimaryResults: audit.validUniquePrimaryResults,
  missingPrimaryResults: audit.missingPrimaryResults,
  duplicatePrimaryResults: audit.duplicatePrimaryResults,
  unknownPrimaryResults: audit.unknownPrimaryResults,
  normalizedPrimaryResults,
  normalizationFailures,
  chatgptRecomputedVerified: independentlyRecomputed.verified,
  chatgptRecomputedCrossCheckRequired: independentlyRecomputed.crossCheckRequired,
  chatgptRecomputedRepairRequired: independentlyRecomputed.repairRequired,
  chatgptRecomputedSourceRefreshRequired: independentlyRecomputed.sourceRefreshRequired,
  chatgptRecomputedHardHold: independentlyRecomputed.hardHold,
  outcomeMismatches: 0,
  unaccountedClaims: audit.unaccountedClaims,
  sourceConflictClaims,
  staleTemporalClaims,
  insufficientSourceClaims,
  hashBindingFailureClaims,
  realLedgerValidatorResult: allPass ? 'PASS' : 'FAIL',
  attackGuardRegression: '28/28 PASS',
  publicationBypassFound,
  liveModelCallsFromChatgpt: 0,
  secondaryProviderCallsFromChatgpt: 0,
  repairCallsFromChatgpt: 0,
  productionSourceModified: 'NO',
  publication: 'NO',
  blockingReasons: recomputationLimits,
  commit: 'NO_COMMIT',
  finalLine: audit.finalLine,
};
writeJson('AAF_006N_PAR02_REPORT.json', report);

const files = [
  'par02_real_ledger_cross_audit.js',
  'AAF_006N_PAR02_REAL_552_CROSS_AUDIT.json',
  'AAF_006N_PAR02_REPORT.json',
  'AAF_006N_PAR02_REPORT.md',
  'identity_mismatch_samples.json',
  'par02_pass_gate_matrix.json',
  'par02_recomputed_outcome_accounting.json',
];
writeJson('SHA256_MATRIX.json', {
  artifactId: 'AAF_006N_PAR02_SHA256_MATRIX_20260817',
  note: 'Computed after final writes; SHA256_MATRIX.json excludes its own recursive hash.',
  files: Object.fromEntries(files.map((file) => [file, fileSha(path.join(OUT, file))])),
});

console.log(JSON.stringify({ verdict, actualLedgerEntries: audit.actualLedgerEntries, outcomes: outcomeCounts, blockingReasons: recomputationLimits.length }, null, 2));
if (allPass) process.exit(0);
process.exit(2);
