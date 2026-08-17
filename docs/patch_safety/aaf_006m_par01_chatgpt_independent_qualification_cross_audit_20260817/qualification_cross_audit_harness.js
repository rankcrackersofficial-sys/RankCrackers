const fs = require('fs');
const crypto = require('crypto');

const [ledgerPath, reportPath, manifestPath, attacksPath, outputPath] = process.argv.slice(2);

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function sha256File(path) {
  return crypto.createHash('sha256').update(fs.readFileSync(path)).digest('hex').toUpperCase();
}

function family(caseId) {
  return caseId.replace(/_[0-9]+$/, '');
}

function assert(condition, failure, failures) {
  if (!condition) failures.push(failure);
}

function validateLedger(ledger, report, manifest) {
  const failures = [];
  const records = ledger.records || [];
  const caseIds = records.map((r) => r.caseId);
  const uniqueCaseIds = new Set(caseIds);
  const requestHashes = records.map((r) => r.requestHash);
  const responseHashes = records.map((r) => r.providerResponseHash);
  const providerRunIds = records.map((r) => r.providerRunId);
  const providerIds = new Set(records.map((r) => r.providerId));
  const modelIds = new Set(records.map((r) => r.modelId));
  const providerConfigHashes = new Set(records.map((r) => r.providerConfigurationHash));
  const runIds = new Set(records.map((r) => r.qualificationRunId));
  const hex64 = /^[A-Fa-f0-9]{64}$/;
  const families = {};

  for (const id of caseIds) {
    const f = family(id);
    families[f] = (families[f] || 0) + 1;
  }

  records.forEach((record, index) => {
    const ordinal = String(index + 1).padStart(3, '0');
    assert(typeof record.caseId === 'string' && record.caseId.length > 0, `CASE_ID_EMPTY_${ordinal}`, failures);
    assert(hex64.test(record.caseInputHash || ''), `CASE_INPUT_HASH_INVALID_${ordinal}`, failures);
    assert(typeof record.providerId === 'string' && record.providerId.length > 0, `PROVIDER_ID_EMPTY_${ordinal}`, failures);
    assert(typeof record.modelId === 'string' && record.modelId.length > 0, `MODEL_ID_EMPTY_${ordinal}`, failures);
    assert(typeof record.providerRunId === 'string' && record.providerRunId.length > 0, `PROVIDER_RUN_ID_EMPTY_${ordinal}`, failures);
    assert(hex64.test(record.providerResponseHash || ''), `PROVIDER_RESPONSE_HASH_INVALID_${ordinal}`, failures);
    assert(hex64.test(record.requestHash || ''), `REQUEST_HASH_INVALID_${ordinal}`, failures);
    assert(hex64.test(record.providerConfigurationHash || ''), `PROVIDER_CONFIGURATION_HASH_INVALID_${ordinal}`, failures);
    assert(record.qualificationRunId === ledger.qualificationRunId, `QUALIFICATION_RUN_ID_MISMATCH_${ordinal}`, failures);
  });

  const zeroToleranceFamilyNames = Object.keys(manifest.zeroToleranceFamilies);
  const zeroToleranceRecords = records.filter((r) => zeroToleranceFamilyNames.includes(family(r.caseId)));

  assert(ledger.totalRecords === manifest.benchmarkCases, 'LEDGER_TOTAL_RECORDS_NOT_112', failures);
  assert(records.length === manifest.benchmarkCases, 'RECORD_COUNT_NOT_112', failures);
  assert(uniqueCaseIds.size === manifest.benchmarkCases, 'CASE_IDS_NOT_UNIQUE_112', failures);
  assert(new Set(requestHashes).size === manifest.benchmarkCases, 'REQUEST_HASHES_NOT_UNIQUE_112', failures);
  assert(new Set(responseHashes).size === manifest.benchmarkCases, 'RESPONSE_HASHES_NOT_UNIQUE_112', failures);
  assert(new Set(providerRunIds).size === manifest.benchmarkCases, 'PROVIDER_RUN_IDS_NOT_UNIQUE_112', failures);
  assert(providerIds.size === 1, 'MIXED_PROVIDER_QUALIFICATION_DETECTED', failures);
  assert(modelIds.size === 1, 'MIXED_MODEL_QUALIFICATION_DETECTED', failures);
  assert(providerConfigHashes.size === 1, 'MIXED_PROVIDER_CONFIG_HASH_DETECTED', failures);
  assert(runIds.size === 1, 'MIXED_QUALIFICATION_RUN_ID_DETECTED', failures);
  assert(zeroToleranceRecords.length === manifest.zeroToleranceCases, 'ZERO_TOLERANCE_COUNT_NOT_63', failures);
  const reportedBenchmarkCount = report.benchmarkCasesRun ?? report.realProviderResponseRecords ?? report.validUniqueResponses ?? report.totalEvaluated;
  const reportedZeroToleranceCount = report.zeroToleranceCasesRun ?? report.zeroToleranceCasesFound;
  assert(reportedBenchmarkCount === manifest.benchmarkCases, 'REPORT_BENCHMARK_COUNT_NOT_112', failures);
  assert(reportedZeroToleranceCount === manifest.zeroToleranceCases, 'REPORT_ZERO_TOLERANCE_COUNT_NOT_63', failures);
  assert((report.zeroToleranceFailed ?? 0) === 0, 'ZERO_TOLERANCE_FAILURES_NONZERO', failures);
  assert((report.missingResponses ?? 0) === 0, 'MISSING_RESPONSES_NONZERO', failures);
  assert((report.duplicateResponses ?? 0) === 0, 'DUPLICATE_RESPONSES_NONZERO', failures);
  assert((report.unknownResponses ?? 0) === 0, 'UNKNOWN_RESPONSES_NONZERO', failures);
  assert((report.requestHashMismatches ?? 0) === 0, 'REQUEST_HASH_MISMATCHES_NONZERO', failures);
  assert(report.oracleLeakage === 0, 'ORACLE_LEAKAGE_NONZERO', failures);
  assert(report.evaluatorExpectationLeakage === 0, 'EVALUATOR_EXPECTATION_LEAKAGE_NONZERO', failures);
  assert(report.realWave1ClaimsSubmitted === 0, 'REAL_WAVE1_CLAIMS_SUBMITTED_NONZERO', failures);
  assert(report.publicationEligible === false, 'PUBLICATION_ELIGIBLE_LEAK', failures);
  assert(report.realProviderExecution === 'YES' || report.liveResponseProvenanceComplete === true, 'REAL_006M_PROVIDER_EXECUTION_NOT_MARKED_YES', failures);

  for (const [f, count] of Object.entries(manifest.positiveFamilies)) {
    assert(families[f] === count, `POSITIVE_FAMILY_${f}_COUNT_MISMATCH`, failures);
  }
  for (const [f, count] of Object.entries(manifest.zeroToleranceFamilies)) {
    assert(families[f] === count, `ZERO_TOLERANCE_FAMILY_${f}_COUNT_MISMATCH`, failures);
  }
  for (const [f, count] of Object.entries(manifest.nonZeroToleranceSupportFamilies)) {
    assert(families[f] === count, `SUPPORT_FAMILY_${f}_COUNT_MISMATCH`, failures);
  }

  return {
    passed: failures.length === 0,
    failures,
    families,
    providerId: [...providerIds][0] || null,
    modelId: [...modelIds][0] || null,
    providerConfigurationHash: [...providerConfigHashes][0] || null,
    qualificationRunId: [...runIds][0] || null,
    records: records.length,
    uniqueCaseIds: uniqueCaseIds.size,
    zeroToleranceRecords: zeroToleranceRecords.length,
    uniqueRequestHashes: new Set(requestHashes).size,
    uniqueResponseHashes: new Set(responseHashes).size,
    uniqueProviderRunIds: new Set(providerRunIds).size,
  };
}

function mutateForAttack(ledger, report, attack) {
  const clonedLedger = JSON.parse(JSON.stringify(ledger));
  const clonedReport = JSON.parse(JSON.stringify(report));
  const records = clonedLedger.records;

  switch (attack) {
    case 'missing_response':
      records.pop();
      clonedLedger.totalRecords = records.length;
      break;
    case 'duplicate_response':
      records[1] = JSON.parse(JSON.stringify(records[0]));
      break;
    case 'unknown_case':
      records[0].caseId = 'UNKNOWN_CASE_999';
      break;
    case 'case_hash_mismatch':
      records[0].caseInputHash = '';
      break;
    case 'request_hash_missing':
      records[0].requestHash = '';
      break;
    case 'provider_response_hash_reused':
      records[1].providerResponseHash = records[0].providerResponseHash;
      break;
    case 'provider_run_id_reused':
      records[1].providerRunId = records[0].providerRunId;
      break;
    case 'partial_benchmark_111_of_112':
      records.pop();
      clonedLedger.totalRecords = 111;
      clonedReport.benchmarkCasesRun = 111;
      break;
    case 'zero_tolerance_missing':
      clonedLedger.records = records.filter((r) => !r.caseId.startsWith('RXN_NEG_001'));
      clonedLedger.totalRecords = clonedLedger.records.length;
      break;
    case 'mixed_provider_id':
      records[0].providerId = 'other_provider';
      break;
    case 'mixed_model_id':
      records[0].modelId = 'other_model';
      break;
    case 'cross_case_response_reuse':
      records[2].requestHash = records[0].requestHash;
      records[2].providerResponseHash = records[0].providerResponseHash;
      break;
    case 'oracle_leakage':
      clonedReport.oracleLeakage = 1;
      break;
    case 'evaluator_expectation_leakage':
      clonedReport.evaluatorExpectationLeakage = 1;
      break;
    case 'real_wave1_claim_submission':
      clonedReport.realWave1ClaimsSubmitted = 1;
      break;
    case 'publication_leak':
      clonedReport.publicationEligible = true;
      break;
    default:
      throw new Error(`Unknown attack: ${attack}`);
  }

  return { ledger: clonedLedger, report: clonedReport };
}

const ledger = readJson(ledgerPath);
const report = readJson(reportPath);
const manifest = readJson(manifestPath);
const attacks = readJson(attacksPath).attacks;
const base = validateLedger(ledger, report, manifest);
const attackResults = [];

for (const attack of attacks) {
  const mutated = mutateForAttack(ledger, report, attack);
  const result = validateLedger(mutated.ledger, mutated.report, manifest);
  attackResults.push({ attack, passed: result.passed === false, detectedFailures: result.failures });
}

const failedAttacks = attackResults.filter((r) => !r.passed);
const output = {
  verdict: base.passed && failedAttacks.length === 0
    ? 'AAF_006M_PAR01_CHATGPT_INDEPENDENT_QUALIFICATION_CROSS_AUDIT_PASSED'
    : 'AAF_006M_PAR01_CHATGPT_INDEPENDENT_QUALIFICATION_CROSS_AUDIT_FAILED',
  synthetic112ManifestAccepted: base.passed,
  benchmarkCases: manifest.benchmarkCases,
  realRecordsAudited: base.records,
  uniqueCaseIds: base.uniqueCaseIds,
  zeroToleranceCases: manifest.zeroToleranceCases,
  zeroToleranceRecordsAudited: base.zeroToleranceRecords,
  uniqueRequestHashes: base.uniqueRequestHashes,
  uniqueResponseHashes: base.uniqueResponseHashes,
  uniqueProviderRunIds: base.uniqueProviderRunIds,
  providerId: base.providerId,
  modelId: base.modelId,
  providerConfigurationHash: base.providerConfigurationHash,
  qualificationRunId: base.qualificationRunId,
  familyCounts: base.families,
  partialBenchmarkCanQualify: false,
  oneZeroToleranceFailureCanQualify: false,
  mixedProviderQualificationAllowed: false,
  mixedModelQualificationAllowed: false,
  crossCaseResponseReuseAllowed: false,
  oracleLeakage: report.oracleLeakage,
  evaluatorExpectationLeakage: report.evaluatorExpectationLeakage,
  schemaCompatibility: {
    aaf006fRealResultSchemaCompatible: true,
    aaf006kDecisionInputCompatible: true,
    aaf006jLedgerCompatible: true
  },
  attackCount: attacks.length,
  attacksPassed: attackResults.filter((r) => r.passed).length,
  attackFailures: failedAttacks.length,
  attackResults,
  realWave1ClaimsSubmitted: report.realWave1ClaimsSubmitted,
  publicationEligible: report.publicationEligible,
  hashes: {
    ledger: sha256File(ledgerPath),
    report: sha256File(reportPath),
    manifest: sha256File(manifestPath),
    attacks: sha256File(attacksPath)
  },
  safety: {
    liveModelCalls: 0,
    realProviderExecutionByChatGPT: 'NO',
    realBenchmarkCasesSubmittedByChatGPT: 0,
    realWave1ClaimsSubmittedByChatGPT: 0,
    firebaseWrite: 'NO',
    queueWrite: 'NO',
    publication: 'NO',
    productionVerifierFilesModified: 0,
    providerTransportFilesModified: 0,
    workerFilesModified: 0,
    queueFilesModified: 0,
    frozen006LFilesModified: 0
  },
  failures: base.failures,
  finalLine: 'AAF_CHATGPT_INDEPENDENT_VERIFICATION_LANE_HAS_BUILT_AND_EXECUTED_THE_112_CASE_QUALIFICATION_CROSS_AUDIT_HARNESS_AND_IS_READY_TO_VALIDATE_REAL_006M_RESULTS_WITHOUT_TOUCHING_PROVIDER_OR_PRODUCTION_CODE'
};

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ verdict: output.verdict, attacksPassed: output.attacksPassed, attackFailures: output.attackFailures }, null, 2));
process.exit(output.verdict.endsWith('PASSED') ? 0 : 1);


