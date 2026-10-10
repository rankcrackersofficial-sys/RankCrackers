/**
 * RC_UNIFIED_WORKER_W1C — Canonical Stage Graph Test Suite
 * =============================================================================
 * Pure Node assert only. No emulator, no network, no filesystem mutation, no
 * credentials. The only file read is the stage-graph production source itself
 * (read-only) for the purity scan.
 *
 * Run:  node functions/test_mission_enrichment_stage_graph.js
 * Exit: 0 when all tests pass; 1 otherwise.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { createMissionEnrichmentRun, executeMissionEnrichmentRun, validateMissionEnrichmentStages } = require('./services/mission_enrichment_orchestrator_kernel');
const graphModule = require('./services/mission_enrichment_stage_graph');

const { buildCanonicalMissionEnrichmentStages, getCanonicalMissionEnrichmentGraph } = graphModule;

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const RECORDED_AT = '2026-09-11T14:00:00Z';
const EXPECTED_ORDER = ['SOURCE_RESOLVE', 'HASH_BIND', 'ROLE_CLASSIFY', 'VARIABLE_EXTRACTION', 'SYLLABUS_HANDOFF', 'EVIDENCE_FINALIZE'];
const EXPECTED_DEPS = {
  SOURCE_RESOLVE: [],
  HASH_BIND: ['SOURCE_RESOLVE'],
  ROLE_CLASSIFY: ['HASH_BIND'],
  VARIABLE_EXTRACTION: ['ROLE_CLASSIFY'],
  SYLLABUS_HANDOFF: ['ROLE_CLASSIFY'],
  EVIDENCE_FINALIZE: ['VARIABLE_EXTRACTION', 'SYLLABUS_HANDOFF'],
};

function makeHandlers(overrides = {}, spy = null) {
  const handlers = {};
  for (const stageId of EXPECTED_ORDER) {
    if (overrides[stageId] !== undefined) {
      handlers[stageId] = overrides[stageId];
    } else {
      handlers[stageId] = (ctx) => {
        if (spy) spy.push(ctx.stageId);
        return { status: 'PASS', result: { stage: ctx.stageId } };
      };
    }
  }
  return handlers;
}

function runGraph(handlers, input = null) {
  const stages = buildCanonicalMissionEnrichmentStages(handlers);
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026',
    taskKey: 'w1c-stage-graph-task',
    workerId: 'unified_mission_enrichment_worker',
    workerVersion: '0.1.0-w1c',
    stages,
  });
  return executeMissionEnrichmentRun(run, { input, recordedAt: RECORDED_AT });
}

function statusOf(result, stageId) {
  return result.stageResults.find(record => record.stageId === stageId).status;
}

// ---------------------------------------------------------------------------
// S1-S3 — exact canonical topology
// ---------------------------------------------------------------------------

test('S1: exact canonical stage count = 6', () => {
  const metadata = getCanonicalMissionEnrichmentGraph();
  assert.strictEqual(metadata.stageIds.length, 6);
  const stages = buildCanonicalMissionEnrichmentStages(makeHandlers());
  assert.strictEqual(stages.length, 6);
});

test('S2: exact stage IDs', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().stageIds, EXPECTED_ORDER);
});

test('S3: exact canonical order retained by the builder', () => {
  const stages = buildCanonicalMissionEnrichmentStages(makeHandlers());
  assert.deepStrictEqual(stages.map(s => s.stageId), EXPECTED_ORDER);
});

// ---------------------------------------------------------------------------
// S4-S9 — exact dependency topology
// ---------------------------------------------------------------------------

test('S4: SOURCE_RESOLVE depends on none', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().dependencies.SOURCE_RESOLVE, []);
});

test('S5: HASH_BIND depends on SOURCE_RESOLVE', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().dependencies.HASH_BIND, ['SOURCE_RESOLVE']);
});

test('S6: ROLE_CLASSIFY depends on HASH_BIND', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().dependencies.ROLE_CLASSIFY, ['HASH_BIND']);
});

test('S7: VARIABLE_EXTRACTION depends on ROLE_CLASSIFY', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().dependencies.VARIABLE_EXTRACTION, ['ROLE_CLASSIFY']);
});

test('S8: SYLLABUS_HANDOFF depends on ROLE_CLASSIFY', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().dependencies.SYLLABUS_HANDOFF, ['ROLE_CLASSIFY']);
});

test('S9: EVIDENCE_FINALIZE depends on VARIABLE_EXTRACTION + SYLLABUS_HANDOFF', () => {
  assert.deepStrictEqual(getCanonicalMissionEnrichmentGraph().dependencies.EVIDENCE_FINALIZE, ['VARIABLE_EXTRACTION', 'SYLLABUS_HANDOFF']);
});

// ---------------------------------------------------------------------------
// S10-S12 — no lifecycle, publication, or mission-specific stage IDs
// ---------------------------------------------------------------------------

test('S10: no lifecycle stage ID in the canonical graph', () => {
  const lifecycleNames = ['launch_realm', 'pause_realm', 'archive_realm', 'restore_realm', 'delete_realm_permanently', 'declare_result', 'manifest_realm', 'launch_exam_mission'];
  for (const stageId of EXPECTED_ORDER) {
    assert.ok(!lifecycleNames.includes(stageId), `${stageId} must not be a lifecycle action name`);
  }
});

test('S11: no publication stage ID in the canonical graph', () => {
  for (const stageId of EXPECTED_ORDER) {
    assert.ok(!stageId.includes('PUBLISH'), `${stageId} must not be a publication stage`);
    assert.ok(!stageId.includes('LAUNCH'), `${stageId} must not be a launch stage`);
  }
});

test('S12: no mission-specific stage ID in the canonical graph', () => {
  const missionTokens = ['UPSC', 'RPSC', 'REET', 'NEET', 'JEE', 'RAJASTHAN', 'DELHI', 'CENTRAL'];
  for (const stageId of EXPECTED_ORDER) {
    for (const token of missionTokens) {
      assert.ok(!stageId.includes(token), `${stageId} must not embed mission token ${token}`);
    }
  }
});

// ---------------------------------------------------------------------------
// S13-S15 — handler injection discipline
// ---------------------------------------------------------------------------

test('S13: handlers injected by stage ID and executed once each', () => {
  const spy = [];
  const result = runGraph(makeHandlers({}, spy));
  assert.deepStrictEqual(Object.keys(spy).length, 6);
  for (const stageId of EXPECTED_ORDER) {
    assert.strictEqual(spy.filter(id => id === stageId).length, 1, `${stageId} handler must execute exactly once`);
  }
  assert.strictEqual(result.overallStatus, 'PASS');
});

test('S14: missing handlers retained as missing/null per W1B contract', () => {
  const partial = buildCanonicalMissionEnrichmentStages({
    SOURCE_RESOLVE: () => ({ status: 'PASS', result: null }),
  });
  const resolved = partial.find(s => s.stageId === 'SOURCE_RESOLVE');
  assert.strictEqual(typeof resolved.execute, 'function');
  for (const stageId of EXPECTED_ORDER.slice(1)) {
    const descriptor = partial.find(s => s.stageId === stageId);
    assert.strictEqual(descriptor.execute, null, `${stageId} without handler must be normalized to execute:null`);
  }
  // Execution of the full graph with all-but-one handlers missing fails closed.
  const result = runGraph({});
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.stageResults[0].failure.reason, 'MISSING_HANDLER');
});

test('S15: caller handler object is not mutated by the builder', () => {
  const handlers = makeHandlers();
  const snapshot = { ...handlers };
  buildCanonicalMissionEnrichmentStages(handlers);
  assert.deepStrictEqual({ ...handlers }, snapshot);
  assert.strictEqual(Object.keys(handlers).length, Object.keys(snapshot).length);
});

// ---------------------------------------------------------------------------
// S16-S18 — immutability
// ---------------------------------------------------------------------------

test('S16: graph descriptors are immutable', () => {
  const stages = buildCanonicalMissionEnrichmentStages(makeHandlers());
  assert.ok(Object.isFrozen(stages));
  for (const descriptor of stages) {
    assert.ok(Object.isFrozen(descriptor), `${descriptor.stageId} descriptor must be frozen`);
  }
  const first = stages[0];
  const before = first.stageId;
  try { first.stageId = 'TAMPERED'; } catch (_) { /* frozen */ }
  assert.strictEqual(first.stageId, before);
});

test('S17: dependency arrays are immutable', () => {
  const stages = buildCanonicalMissionEnrichmentStages(makeHandlers());
  for (const descriptor of stages) {
    assert.ok(Object.isFrozen(descriptor.dependsOn), `${descriptor.stageId} dependsOn must be frozen`);
  }
});

test('S18: graph metadata is immutable and stable across calls', () => {
  const m1 = getCanonicalMissionEnrichmentGraph();
  const m2 = getCanonicalMissionEnrichmentGraph();
  assert.deepStrictEqual(m1, m2);
  assert.ok(Object.isFrozen(m1));
  assert.ok(Object.isFrozen(m1.stageIds));
  for (const key of Object.keys(m1.dependencies)) {
    assert.ok(Object.isFrozen(m1.dependencies[key]));
  }
});

// ---------------------------------------------------------------------------
// S19-S20 — kernel validator compatibility
// ---------------------------------------------------------------------------

test('S19: W1B kernel validator accepts the canonical graph', () => {
  const validated = validateMissionEnrichmentStages(buildCanonicalMissionEnrichmentStages(makeHandlers()));
  assert.strictEqual(validated.length, 6);
  assert.deepStrictEqual(validated.map(s => s.stageId), EXPECTED_ORDER);
});

test('S20: kernel detects no cycle in the canonical graph', () => {
  let threw = null;
  try {
    validateMissionEnrichmentStages(buildCanonicalMissionEnrichmentStages(makeHandlers()));
  } catch (err) {
    threw = err;
  }
  assert.strictEqual(threw, null, 'canonical graph must be acyclic per the kernel validator');
});

// ---------------------------------------------------------------------------
// S21-S28 — fail-closed dependency propagation through the canonical graph
// ---------------------------------------------------------------------------

test('S21: full graph all PASS gives overall PASS', () => {
  const result = runGraph(makeHandlers());
  assert.strictEqual(result.overallStatus, 'PASS');
  for (const record of result.stageResults) {
    assert.strictEqual(record.status, 'PASS');
  }
});

test('S22: SOURCE_RESOLVE FAIL blocks the entire downstream chain', () => {
  const result = runGraph(makeHandlers({
    SOURCE_RESOLVE: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'unresolvable' } }),
  }));
  assert.strictEqual(statusOf(result, 'SOURCE_RESOLVE'), 'FAIL');
  for (const stageId of EXPECTED_ORDER.slice(1)) {
    assert.strictEqual(statusOf(result, stageId), 'BLOCKED', `${stageId} must be blocked`);
  }
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('S23: HASH_BIND FAIL blocks ROLE_CLASSIFY and everything below', () => {
  const result = runGraph(makeHandlers({
    HASH_BIND: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'no binding' } }),
  }));
  assert.strictEqual(statusOf(result, 'SOURCE_RESOLVE'), 'PASS');
  assert.strictEqual(statusOf(result, 'HASH_BIND'), 'FAIL');
  for (const stageId of ['ROLE_CLASSIFY', 'VARIABLE_EXTRACTION', 'SYLLABUS_HANDOFF', 'EVIDENCE_FINALIZE']) {
    assert.strictEqual(statusOf(result, stageId), 'BLOCKED', `${stageId} must be blocked`);
  }
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('S24: ROLE_CLASSIFY FAIL blocks both VARIABLE_EXTRACTION and SYLLABUS_HANDOFF', () => {
  const result = runGraph(makeHandlers({
    ROLE_CLASSIFY: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'no roles' } }),
  }));
  assert.strictEqual(statusOf(result, 'ROLE_CLASSIFY'), 'FAIL');
  assert.strictEqual(statusOf(result, 'VARIABLE_EXTRACTION'), 'BLOCKED');
  assert.strictEqual(statusOf(result, 'SYLLABUS_HANDOFF'), 'BLOCKED');
  assert.strictEqual(statusOf(result, 'EVIDENCE_FINALIZE'), 'BLOCKED');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('S25: VARIABLE_EXTRACTION FAIL blocks EVIDENCE_FINALIZE only downstream', () => {
  const result = runGraph(makeHandlers({
    VARIABLE_EXTRACTION: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'no variables' } }),
  }));
  assert.strictEqual(statusOf(result, 'VARIABLE_EXTRACTION'), 'FAIL');
  assert.strictEqual(statusOf(result, 'SYLLABUS_HANDOFF'), 'PASS', 'sibling branch stays independent');
  assert.strictEqual(statusOf(result, 'EVIDENCE_FINALIZE'), 'BLOCKED');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('S26: SYLLABUS_HANDOFF FAIL blocks EVIDENCE_FINALIZE only downstream', () => {
  const result = runGraph(makeHandlers({
    SYLLABUS_HANDOFF: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'no handoff' } }),
  }));
  assert.strictEqual(statusOf(result, 'SYLLABUS_HANDOFF'), 'FAIL');
  assert.strictEqual(statusOf(result, 'VARIABLE_EXTRACTION'), 'PASS', 'sibling branch stays independent');
  assert.strictEqual(statusOf(result, 'EVIDENCE_FINALIZE'), 'BLOCKED');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('S27: VARIABLE_EXTRACTION NOT_TESTED gives deterministic NOT_TESTED final stage', () => {
  let finalizeExecuted = false;
  const result = runGraph(makeHandlers({
    VARIABLE_EXTRACTION: () => ({ status: 'NOT_TESTED' }),
    EVIDENCE_FINALIZE: () => { finalizeExecuted = true; return { status: 'PASS', result: null }; },
  }));
  // Frozen W1B law: NOT_TESTED upstream propagates NOT_TESTED downstream.
  assert.strictEqual(statusOf(result, 'VARIABLE_EXTRACTION'), 'NOT_TESTED');
  assert.strictEqual(statusOf(result, 'SYLLABUS_HANDOFF'), 'PASS');
  assert.strictEqual(statusOf(result, 'EVIDENCE_FINALIZE'), 'NOT_TESTED');
  assert.strictEqual(finalizeExecuted, false, 'finalize handler must not execute');
  assert.strictEqual(result.overallStatus, 'NOT_TESTED');
});

test('S28: SYLLABUS_HANDOFF NOT_TESTED gives the symmetric deterministic outcome', () => {
  let finalizeExecuted = false;
  const result = runGraph(makeHandlers({
    SYLLABUS_HANDOFF: () => ({ status: 'NOT_TESTED' }),
    EVIDENCE_FINALIZE: () => { finalizeExecuted = true; return { status: 'PASS', result: null }; },
  }));
  assert.strictEqual(statusOf(result, 'VARIABLE_EXTRACTION'), 'PASS');
  assert.strictEqual(statusOf(result, 'SYLLABUS_HANDOFF'), 'NOT_TESTED');
  assert.strictEqual(statusOf(result, 'EVIDENCE_FINALIZE'), 'NOT_TESTED');
  assert.strictEqual(finalizeExecuted, false);
  assert.strictEqual(result.overallStatus, 'NOT_TESTED');
});

// ---------------------------------------------------------------------------
// S29 — deterministic replay
// ---------------------------------------------------------------------------

test('S29: deterministic replay using the canonical graph', () => {
  const r1 = runGraph(makeHandlers(), { opaque: 'payload', list: [2, 1] });
  const r2 = runGraph(makeHandlers(), { opaque: 'payload', list: [2, 1] });
  assert.deepStrictEqual(r1, r2, 'same graph + same handlers + same input must replay deep-equal');
  assert.strictEqual(r1.overallStatus, 'PASS');
});

// ---------------------------------------------------------------------------
// S30 — lifecycle write firewall remains effective through the graph
// ---------------------------------------------------------------------------

test('S30: lifecycle write attempt inside a canonical stage fails that stage', () => {
  const result = runGraph(makeHandlers({
    VARIABLE_EXTRACTION: () => ({ status: 'PASS', proposedWrite: { cardVisible: true } }),
  }));
  const ve = result.stageResults.find(r => r.stageId === 'VARIABLE_EXTRACTION');
  assert.strictEqual(ve.status, 'FAIL');
  assert.strictEqual(ve.failure.reason, 'LIFECYCLE_WRITE_BLOCKED');
  assert.strictEqual(statusOf(result, 'EVIDENCE_FINALIZE'), 'BLOCKED');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

// ---------------------------------------------------------------------------
// S31-S32 — lifecycle action names cannot be injected as handlers/stages
// ---------------------------------------------------------------------------

test('S31: launch_realm cannot be injected into the graph', () => {
  assert.throws(() => buildCanonicalMissionEnrichmentStages({
    SOURCE_RESOLVE: () => ({ status: 'PASS', result: null }),
    launch_realm: () => ({ status: 'PASS', result: null }),
  }), /STAGE_GRAPH_HANDLER_KEY_INVALID/);
});

test('S32: launch_exam_mission cannot be injected into the graph', () => {
  assert.throws(() => buildCanonicalMissionEnrichmentStages({
    SOURCE_RESOLVE: () => ({ status: 'PASS', result: null }),
    launch_exam_mission: () => ({ status: 'PASS', result: null }),
  }), /STAGE_GRAPH_HANDLER_KEY_INVALID/);
});

// ---------------------------------------------------------------------------
// S33-S39 — production module purity
// ---------------------------------------------------------------------------

const GRAPH_SOURCE = fs.readFileSync(path.join(__dirname, 'services', 'mission_enrichment_stage_graph.js'), 'utf8');

test('S33: no firebase dependency in production module', () => {
  assert.ok(!GRAPH_SOURCE.includes('firebase-admin'));
  assert.ok(!GRAPH_SOURCE.includes('firebase-functions'));
  const requires = [...GRAPH_SOURCE.matchAll(/require\((['"])([^'"]+)\1\)/g)].map(m => m[2]).sort();
  assert.deepStrictEqual(requires, ['./mission_enrichment_orchestrator_kernel']);
});

test('S34: no Firestore usage or collection names in production module', () => {
  assert.ok(!GRAPH_SOURCE.includes('firestore'));
  assert.ok(!GRAPH_SOURCE.includes('Firestore'));
  assert.ok(!GRAPH_SOURCE.includes('collection('));
});

test('S35: no network dependency in production module', () => {
  for (const needle of ['axios', 'node-fetch', 'fetch(', 'http://', 'https://', '.get(', 'XMLHttpRequest']) {
    assert.ok(!GRAPH_SOURCE.includes(needle), `production module must not contain '${needle}'`);
  }
  assert.ok(!/\bhttp\b/.test(GRAPH_SOURCE));
  assert.ok(!/\bhttps\b/.test(GRAPH_SOURCE));
});

test('S36: no fs, env, clock, or randomness in production module', () => {
  assert.ok(!/(^|[^a-zA-Z0-9_])fs([^a-zA-Z0-9_]|$)/.test(GRAPH_SOURCE), 'no standalone fs usage');
  assert.ok(!GRAPH_SOURCE.includes('process.env'));
  assert.ok(!GRAPH_SOURCE.includes('Date.now'));
  assert.ok(!GRAPH_SOURCE.includes('new Date'));
  assert.ok(!GRAPH_SOURCE.includes('Math.random'));
  assert.ok(!GRAPH_SOURCE.includes('randomUUID'));
});

test('S37: no authority-specific token in production module', () => {
  for (const token of ['UPSC', 'RPSC']) {
    assert.ok(!GRAPH_SOURCE.includes(token), `production module must not contain '${token}'`);
  }
});

test('S38: no exam-specific token in production module', () => {
  for (const token of ['REET', 'NEET', 'JEE']) {
    assert.ok(!GRAPH_SOURCE.includes(token), `production module must not contain '${token}'`);
  }
});

test('S39: no state-specific branching in production module', () => {
  for (const token of ['Rajasthan', 'Delhi', 'CENTRAL', 'Central']) {
    assert.ok(!GRAPH_SOURCE.includes(token), `production module must not contain '${token}'`);
  }
  assert.ok(!/\bUT\b/.test(GRAPH_SOURCE), 'no standalone UT token');
  assert.ok(!/\bif\s*\(\s*(state|jurisdiction)\b/i.test(GRAPH_SOURCE), 'no geography branching');
});

// ---------------------------------------------------------------------------
// S40-S42 — public API lock and canonical execution order
// ---------------------------------------------------------------------------

test('S40: exact public API lock — two functions, nothing else', () => {
  const actualKeys = Object.keys(graphModule).sort();
  assert.deepStrictEqual(actualKeys, ['buildCanonicalMissionEnrichmentStages', 'getCanonicalMissionEnrichmentGraph']);
  for (const key of actualKeys) {
    assert.strictEqual(typeof graphModule[key], 'function', `export '${key}' must be a function`);
  }
  const nonFunctions = actualKeys.filter(key => typeof graphModule[key] !== 'function');
  assert.deepStrictEqual(nonFunctions, []);
});

test('S41: canonical execution order is dependency-respecting and finalize-last', () => {
  const spy = [];
  runGraph(makeHandlers({}, spy));
  assert.strictEqual(spy[0], 'SOURCE_RESOLVE');
  assert.strictEqual(spy[1], 'HASH_BIND');
  assert.strictEqual(spy[2], 'ROLE_CLASSIFY');
  assert.ok(spy.indexOf('VARIABLE_EXTRACTION') < spy.indexOf('EVIDENCE_FINALIZE'));
  assert.ok(spy.indexOf('SYLLABUS_HANDOFF') < spy.indexOf('EVIDENCE_FINALIZE'));
  assert.strictEqual(spy[spy.length - 1], 'EVIDENCE_FINALIZE');
  assert.strictEqual(spy.length, 6);
});

test('S42: metadata mirrors the frozen canonical topology exactly', () => {
  const metadata = getCanonicalMissionEnrichmentGraph();
  assert.deepStrictEqual(metadata.stageIds, EXPECTED_ORDER);
  assert.deepStrictEqual(metadata.dependencies, EXPECTED_DEPS);
  // Handler-free metadata: no execute functions anywhere.
  const serialized = JSON.stringify(metadata);
  assert.ok(!serialized.includes('execute'));
});

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passCount = 0;
let failCount = 0;

for (const { name, fn } of tests) {
  try {
    fn();
    passCount += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failCount += 1;
    console.log(`FAIL  ${name} :: ${err.message}`);
  }
}

console.log('-------------------------------------------------------------------------------');
console.log(`TEST_COUNT=${tests.length} PASS_COUNT=${passCount} FAIL_COUNT=${failCount}`);

if (failCount > 0) {
  process.exit(1);
}
process.exit(0);
