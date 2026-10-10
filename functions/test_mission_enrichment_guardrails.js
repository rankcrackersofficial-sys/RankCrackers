/**
 * RC_UNIFIED_WORKER_W1A — Constitutional Guardrails Test Suite
 * =============================================================================
 * Proves the pure guardrail layer in functions/services/mission_enrichment_guardrails.js.
 *
 * Pure Node: node built-in `assert` only. No Firebase emulator, no production
 * credentials, no network, no filesystem mutation, no Firestore.
 *
 * Run:  node functions/test_mission_enrichment_guardrails.js
 * Exit: 0 when all tests pass; 1 otherwise.
 */

const assert = require('assert');
const {
  assertMissionEnrichmentIdentity,
  assertNoLifecycleMutation,
  assertWorkerCannotInvokeLifecycleAction,
  buildMissionEnrichmentTaskKey,
  buildReadOnlyWorkerEvidenceEnvelope,
} = require('./services/mission_enrichment_guardrails');

// Public API contract (W1A-R1): the module exposes EXACTLY these five functions.
// CANONICAL_ID_PATTERN and EVIDENCE_ENVELOPE_KEYS are private implementation
// details and must never be imported or asserted here.
const AUTHORIZED_PUBLIC_API = [
  'assertMissionEnrichmentIdentity',
  'assertNoLifecycleMutation',
  'assertWorkerCannotInvokeLifecycleAction',
  'buildMissionEnrichmentTaskKey',
  'buildReadOnlyWorkerEvidenceEnvelope',
];

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// ---------------------------------------------------------------------------
// G1-G3 — mission identity validation (never generates an ID)
// ---------------------------------------------------------------------------

test('G1: mission identity accepts valid existing ID and trims whitespace', () => {
  assert.strictEqual(assertMissionEnrichmentIdentity('  jee_main_2026  '), 'jee_main_2026');
  assert.strictEqual(assertMissionEnrichmentIdentity('neet_(ug)-2027'), 'neet_(ug)-2027');
  assert.strictEqual(
    assertMissionEnrichmentIdentity('RPSC_FIRST_GRADE2026_2026_1782713222215'),
    'RPSC_FIRST_GRADE2026_2026_1782713222215',
  );
  assert.strictEqual(
    assertMissionEnrichmentIdentity('rec_rpsc_first_grade_2026_cycle_1'),
    'rec_rpsc_first_grade_2026_cycle_1',
  );
});

test('G2: mission identity rejects empty/null/non-string input', () => {
  assert.throws(() => assertMissionEnrichmentIdentity(''), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity('   '), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity(null), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity(undefined), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity(42), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity({ id: 'jee_main_2026' }), /MISSION_ID_INVALID/);
});

test('G3: mission identity never generates a fallback ID', () => {
  // Invalid values must throw — the function has no code path that returns a
  // synthesized/substituted ID.
  assert.throws(() => assertMissionEnrichmentIdentity('   '), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity('bad id with spaces'), /MISSION_ID_INVALID/);
  assert.throws(() => assertMissionEnrichmentIdentity('rec_fresh_2027!'), /MISSION_ID_INVALID/);
  // Character contract behavior: identifiers composed of the canonical charset
  // (alphanumerics, underscore, hyphen, parentheses — exercised in G1) are the
  // only accepted shape; anything else must throw. No fallback ID is returned.
  let returned = 'SENTINEL_UNSET';
  try {
    returned = assertMissionEnrichmentIdentity('   ');
  } catch (_) {
    returned = 'THREW';
  }
  assert.strictEqual(returned, 'THREW', 'no fallback ID may be returned for invalid input');
});

// ---------------------------------------------------------------------------
// G4-G8 — deterministic idempotency task key
// ---------------------------------------------------------------------------

const KEY_BASE = {
  missionId: 'jee_main_2026',
  sourceIdentityTokens: ['sentinel_drafts/abc123', 'sha256:deadbeef'],
  workerContractVersion: 'unified_worker_v1',
};

test('G4: task key deterministic for same source tokens', () => {
  const a = buildMissionEnrichmentTaskKey(KEY_BASE);
  const b = buildMissionEnrichmentTaskKey({ ...KEY_BASE });
  assert.strictEqual(a, b);
  assert.match(a, /^[0-9a-f]{64}$/, 'task key must be a sha256 hex digest');
});

test('G5: task key independent of source-token order', () => {
  const a = buildMissionEnrichmentTaskKey(KEY_BASE);
  const b = buildMissionEnrichmentTaskKey({
    ...KEY_BASE,
    sourceIdentityTokens: ['sha256:deadbeef', 'sentinel_drafts/abc123'],
  });
  assert.strictEqual(a, b);
});

test('G6: task key changes when missionId changes', () => {
  const a = buildMissionEnrichmentTaskKey(KEY_BASE);
  const b = buildMissionEnrichmentTaskKey({ ...KEY_BASE, missionId: 'neet_(ug)-2027' });
  assert.notStrictEqual(a, b);
});

test('G7: task key changes when source identity changes', () => {
  const a = buildMissionEnrichmentTaskKey(KEY_BASE);
  const b = buildMissionEnrichmentTaskKey({
    ...KEY_BASE,
    sourceIdentityTokens: ['sentinel_drafts/other_draft', 'sha256:deadbeef'],
  });
  assert.notStrictEqual(a, b);
});

test('G8: task key changes when worker contract version changes', () => {
  const a = buildMissionEnrichmentTaskKey(KEY_BASE);
  const b = buildMissionEnrichmentTaskKey({ ...KEY_BASE, workerContractVersion: 'unified_worker_v2' });
  assert.notStrictEqual(a, b);
});

// ---------------------------------------------------------------------------
// G9-G18 — publication/lifecycle mutation firewall (nested + dotted)
// ---------------------------------------------------------------------------

test('G9: nested visibility.studentVisible=true rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({ visibility: { studentVisible: true } }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G10: dotted visibility.studentVisible=true rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({ 'visibility.studentVisible': true }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G11: visibility.catalogVisible=true rejected (nested and dotted)', () => {
  assert.throws(() => assertNoLifecycleMutation({ visibility: { catalogVisible: true } }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ 'visibility.catalogVisible': true }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G12: cardVisible=true rejected (nested and dotted)', () => {
  assert.throws(() => assertNoLifecycleMutation({ cardVisible: true }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ 'cardVisible': true }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G13: userPanelVisible=true rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({ userPanelVisible: true }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ 'userPanelVisible': true }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G14: visibility.quickEntryEnabled=true rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({ visibility: { quickEntryEnabled: true } }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ 'visibility.quickEntryEnabled': true }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G15: visibility.smartEntryEnabled=true rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({ visibility: { smartEntryEnabled: true } }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ 'visibility.smartEntryEnabled': true }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G16: ACTIVE/published/live lifecycle status values rejected on status fields', () => {
  assert.throws(() => assertNoLifecycleMutation({ status: 'ACTIVE' }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ status: 'active' }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ catalogStatus: 'published' }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ studentPublicationState: 'LIVE' }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ studentPublicationState: 'Published' }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G17: archive lifecycle mutation rejected (any archived change)', () => {
  assert.throws(() => assertNoLifecycleMutation({ archived: true }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ archived: false }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('G18: completion/result lifecycle mutation rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({ completion_status: 'GRADUATED' }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ lifecycleMutation: { action: 'launch_realm' } }), /LIFECYCLE_MUTATION_BLOCKED/);
  assert.throws(() => assertNoLifecycleMutation({ publishStatus: 'published' }), /LIFECYCLE_MUTATION_BLOCKED/);
});

// ---------------------------------------------------------------------------
// G19-G20 — harmless enrichment/evidence writes allowed
// ---------------------------------------------------------------------------

test('G19: evidence-only update accepted (workerEvidence/provenance/readinessEvidence)', () => {
  const plan = {
    workerEvidence: { stage: 'HASH_BIND', digest: 'sha256:aa' },
    sourceEvidence: { sourceRef: 'sentinel_drafts/abc123' },
    provenance: { extractionMethod: 'NATIVE' },
    readinessEvidence: { checks: ['SOURCE_VERIFIED'] },
  };
  const returned = assertNoLifecycleMutation(plan);
  assert.strictEqual(returned, plan, 'validated plan is returned unchanged');
});

test('G20: missionVariables update accepted when it contains no lifecycle fields', () => {
  const plan = {
    missionVariables: {
      mediumPolicy: 'ENGLISH_ONLY',
      supportedMediums: ['ENGLISH'],
      date_variables: [{ label: 'application_start', value: '2026-11-01' }],
      vacancy_variables: [{ post: 'TA', count: 120 }],
    },
  };
  assert.doesNotThrow(() => assertNoLifecycleMutation(plan));
});

// ---------------------------------------------------------------------------
// G21-G28 — lifecycle-action firewall for worker invocations
// ---------------------------------------------------------------------------

test('G21: launch_realm action rejected', () => {
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('launch_realm'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('LAUNCH_REALM'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
});

test('G22: pause_realm rejected', () => {
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('pause_realm'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
});

test('G23: archive_realm rejected', () => {
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('archive_realm'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
});

test('G24: restore_realm rejected', () => {
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('restore_realm'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
});

test('G25: delete_realm_permanently rejected', () => {
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('delete_realm_permanently'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
});

test('G26: declare_result and manifest_realm rejected', () => {
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('declare_result'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
  assert.throws(() => assertWorkerCannotInvokeLifecycleAction('manifest_realm'), /WORKER_LIFECYCLE_ACTION_BLOCKED/);
});

test('G27: generic stage label SOURCE_RESOLVE accepted', () => {
  assert.strictEqual(assertWorkerCannotInvokeLifecycleAction('SOURCE_RESOLVE'), 'SOURCE_RESOLVE');
  assert.strictEqual(assertWorkerCannotInvokeLifecycleAction('manifest_learning'), 'manifest_learning');
});

test('G28: generic stage label HASH_BIND accepted', () => {
  assert.strictEqual(assertWorkerCannotInvokeLifecycleAction('HASH_BIND'), 'HASH_BIND');
  assert.strictEqual(assertWorkerCannotInvokeLifecycleAction('  VARIABLE_EXTRACTION  '), 'VARIABLE_EXTRACTION');
});

// ---------------------------------------------------------------------------
// G29-G30 — read-only evidence envelope
// ---------------------------------------------------------------------------

const ENVELOPE_BASE = {
  missionId: 'jee_main_2026',
  workerId: 'unified_mission_enrichment_worker',
  workerVersion: '0.1.0-w1a',
  stage: 'HASH_BIND',
  sourceIdentityTokens: ['sentinel_drafts/abc123', 'sha256:deadbeef'],
  inputDigest: 'sha256:input-digest',
  outputDigest: 'sha256:output-digest',
  status: 'COMPLETED',
  recordedAt: '2026-09-11T00:00:00Z',
};

test('G29: evidence envelope deterministic shape', () => {
  const a = buildReadOnlyWorkerEvidenceEnvelope(ENVELOPE_BASE);
  const b = buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE });
  assert.deepStrictEqual(a, b, 'same inputs must produce a deep-equal envelope');
  assert.deepStrictEqual(
    Object.keys(a).sort(),
    ['inputDigest', 'missionId', 'outputDigest', 'recordedAt', 'sourceIdentityTokens', 'stage', 'status', 'workerId', 'workerVersion'],
    'envelope key set must be the fixed, declared set',
  );
  // Token order must not change the envelope shape/content.
  const shuffled = buildReadOnlyWorkerEvidenceEnvelope({
    ...ENVELOPE_BASE,
    sourceIdentityTokens: ['sha256:deadbeef', 'sentinel_drafts/abc123'],
  });
  assert.deepStrictEqual(a, shuffled);
  // recordedAt is caller-supplied and reflected verbatim (no internal clock).
  const stamped = buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE, recordedAt: '2026-09-12T00:00:00Z' });
  assert.strictEqual(stamped.recordedAt, '2026-09-12T00:00:00Z');
});

test('G30: evidence envelope contains no lifecycle/publish fields', () => {
  const envelope = buildReadOnlyWorkerEvidenceEnvelope(ENVELOPE_BASE);
  const forbidden = [
    'status_realm', 'realmStatus', 'catalogStatus', 'studentPublicationState',
    'cardVisible', 'userPanelVisible', 'visibility', 'quickEntryEnabled', 'smartEntryEnabled',
    'archived', 'completion_status', 'lifecycleMutation', 'publishStatus', 'publishReady',
    'missionReady', 'publishEligible', 'published', 'isActive',
  ];
  for (const key of Object.keys(envelope)) {
    assert.ok(!forbidden.includes(key), `envelope must not carry lifecycle/publish field '${key}'`);
  }
  assert.strictEqual(typeof envelope.status, 'string');
  assert.notStrictEqual(envelope.status.toLowerCase(), 'published');
  assert.notStrictEqual(envelope.status.toLowerCase(), 'active');
  // A lifecycle action can never be smuggled in as the stage.
  assert.throws(
    () => buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE, stage: 'launch_realm' }),
    /WORKER_LIFECYCLE_ACTION_BLOCKED/,
  );
});

// ---------------------------------------------------------------------------
// Extra hardening tests (beyond the required 30)
// ---------------------------------------------------------------------------

test('X1: mixed nested+dotted plan with one violation is rejected', () => {
  assert.throws(() => assertNoLifecycleMutation({
    missionVariables: { mediumPolicy: 'ENGLISH_ONLY' },
    'visibility.quickEntryEnabled': true,
  }), /LIFECYCLE_MUTATION_BLOCKED/);
});

test('X2: non-lifecycle status values on status fields are allowed', () => {
  assert.doesNotThrow(() => assertNoLifecycleMutation({ status: 'review' }));
  assert.doesNotThrow(() => assertNoLifecycleMutation({ studentPublicationState: 'INTERNAL_DRAFT' }));
  assert.doesNotThrow(() => assertNoLifecycleMutation({ publishStatus: 'draft' }));
});

test('X3: visibility false values are allowed (only true is blocked)', () => {
  assert.doesNotThrow(() => assertNoLifecycleMutation({
    cardVisible: false,
    visibility: { studentVisible: false, quickEntryEnabled: false, smartEntryEnabled: false },
  }));
});

test('X4: task key treats a single string token list identically to a one-element array', () => {
  const asString = buildMissionEnrichmentTaskKey({
    missionId: 'jee_main_2026',
    sourceIdentityTokens: 'sentinel_drafts/abc123',
    workerContractVersion: 'unified_worker_v1',
  });
  const asArray = buildMissionEnrichmentTaskKey({
    missionId: 'jee_main_2026',
    sourceIdentityTokens: ['sentinel_drafts/abc123'],
    workerContractVersion: 'unified_worker_v1',
  });
  assert.strictEqual(asString, asArray);
});

test('X5: task key rejects empty/invalid inputs without generating anything', () => {
  assert.throws(() => buildMissionEnrichmentTaskKey({ ...KEY_BASE, missionId: '  ' }), /MISSION_ID_INVALID/);
  assert.throws(() => buildMissionEnrichmentTaskKey({ ...KEY_BASE, workerContractVersion: '  ' }), /TASK_KEY_INVALID/);
  assert.throws(() => buildMissionEnrichmentTaskKey({ ...KEY_BASE, sourceIdentityTokens: 7 }), /TASK_KEY_INVALID/);
});

test('X6: evidence envelope rejects missing required identity/worker fields', () => {
  assert.throws(() => buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE, missionId: '' }), /MISSION_ID_INVALID/);
  assert.throws(() => buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE, workerId: '  ' }), /EVIDENCE_ENVELOPE_INVALID/);
  assert.throws(() => buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE, inputDigest: '' }), /EVIDENCE_ENVELOPE_INVALID/);
  assert.throws(() => buildReadOnlyWorkerEvidenceEnvelope({ ...ENVELOPE_BASE, status: undefined }), /EVIDENCE_ENVELOPE_INVALID/);
});

test('X7: module is pure — no firebase/network/fs/env imports in guardrail source', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'services', 'mission_enrichment_guardrails.js'), 'utf8');
  assert.ok(!/require\(\s*['"]firebase-admin['"]\s*\)/.test(source), 'no firebase-admin import');
  assert.ok(!/require\(\s*['"]firebase-functions['"]\s*\)/.test(source), 'no firebase-functions import');
  assert.ok(!/require\(\s*['"](node-)?fetch|axios|http[s]?['"]\s*\)/.test(source), 'no network import');
  assert.ok(!/require\(\s*['"]fs['"]\s*\)|require\(\s*['"]fs\/promises['"]\s*\)/.test(source), 'no filesystem import');
  assert.ok(!/process\.env/.test(source), 'no environment dependency');
  assert.ok(!/Date\.now\(\)|new Date\(\)/.test(source), 'no internal clock reads');
  assert.ok(!/admin\.|firestore\./.test(source), 'no Firestore usage');
});

// ---------------------------------------------------------------------------
// X8 — PUBLIC API LOCK (W1A-R1): exactly five function exports, nothing else
// ---------------------------------------------------------------------------

test('X8: public API lock — exactly five authorized function exports', () => {
  const guardrails = require('./services/mission_enrichment_guardrails');
  const actualKeys = Object.keys(guardrails).sort();
  // A. exactly five keys — deep equality also proves E. no extra export can
  // silently appear (any addition or removal fails this comparison).
  assert.deepStrictEqual(actualKeys, AUTHORIZED_PUBLIC_API.slice().sort());
  // B. every public export is a function.
  for (const key of actualKeys) {
    assert.strictEqual(typeof guardrails[key], 'function', `export '${key}' must be a function`);
  }
  // C. CANONICAL_ID_PATTERN is NOT publicly exported.
  assert.ok(!Object.prototype.hasOwnProperty.call(guardrails, 'CANONICAL_ID_PATTERN'));
  // D. EVIDENCE_ENVELOPE_KEYS is NOT publicly exported.
  assert.ok(!Object.prototype.hasOwnProperty.call(guardrails, 'EVIDENCE_ENVELOPE_KEYS'));
  // PRIVATE_CONSTANT regression: no object/array/regexp value may appear.
  const nonFunctionExports = actualKeys.filter(key => typeof guardrails[key] !== 'function');
  assert.deepStrictEqual(nonFunctionExports, []);
});



// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passCount = 0;
let failCount = 0;
const failures = [];

for (const { name, fn } of tests) {
  try {
    fn();
    passCount += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failCount += 1;
    failures.push({ name, message: err.message });
    console.log(`FAIL  ${name} :: ${err.message}`);
  }
}

console.log('-------------------------------------------------------------------------------');
console.log(`TEST_COUNT=${tests.length} PASS_COUNT=${passCount} FAIL_COUNT=${failCount}`);

if (failCount > 0) {
  process.exit(1);
}
process.exit(0);
