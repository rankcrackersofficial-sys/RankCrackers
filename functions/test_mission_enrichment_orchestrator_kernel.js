/**
 * RC_UNIFIED_WORKER_W1B — Pure Orchestrator Kernel Test Suite
 * =============================================================================
 * Pure Node assert only. No emulator, no network, no filesystem mutation, no
 * Firestore, no credentials. The only file read is the kernel source itself
 * (read-only) for the purity scan.
 *
 * Run:  node functions/test_mission_enrichment_orchestrator_kernel.js
 * Exit: 0 when all tests pass; 1 otherwise.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const kernel = require('./services/mission_enrichment_orchestrator_kernel');

const { createMissionEnrichmentRun, executeMissionEnrichmentRun, validateMissionEnrichmentStages } = kernel;

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

const RECORDED_AT = '2026-09-11T12:00:00Z';

function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) deepFreeze(value[key]);
    Object.freeze(value);
  }
  return value;
}

function makePassHandler(output) {
  return () => ({ status: 'PASS', result: output === undefined ? { ok: true } : output });
}

// ---------------------------------------------------------------------------
// K1-K4 — happy path and identity discipline
// ---------------------------------------------------------------------------

test('K1: valid one-stage PASS run', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026',
    taskKey: 'task-key-001',
    workerId: 'unified_mission_enrichment_worker',
    workerVersion: '0.1.0-w1b',
    stages: [{ stageId: 'SOURCE_RESOLVE', execute: makePassHandler() }],
  });
  const result = executeMissionEnrichmentRun(run, { input: { any: 'value' }, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'PASS');
  assert.strictEqual(result.stageResults.length, 1);
  assert.strictEqual(result.stageResults[0].status, 'PASS');
  assert.strictEqual(result.stageResults[0].stageId, 'SOURCE_RESOLVE');
});

test('K2: existing missionId preserved exactly', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'neet_(ug)-2027',
    taskKey: 'task-key-002',
    workerId: 'w',
    workerVersion: '1',
    stages: [{ stageId: 'HASH_BIND', execute: makePassHandler() }],
  });
  assert.strictEqual(run.missionId, 'neet_(ug)-2027');
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.missionId, 'neet_(ug)-2027');
});

test('K3: missing missionId rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: makePassHandler() }],
  }), /MISSION_ID_INVALID/);
  assert.throws(() => createMissionEnrichmentRun({
    missionId: null, taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: makePassHandler() }],
  }), /MISSION_ID_INVALID/);
});

test('K4: no fallback mission ID generation', () => {
  let captured = 'SENTINEL_UNSET';
  try {
    captured = createMissionEnrichmentRun({
      missionId: '   ', taskKey: 'k', workerId: 'w', workerVersion: '1',
      stages: [{ stageId: 'A', execute: makePassHandler() }],
    });
  } catch (err) {
    captured = 'THREW';
  }
  assert.strictEqual(captured, 'THREW', 'kernel must never synthesize a mission identity');
  let captured2 = 'SENTINEL_UNSET';
  try {
    captured2 = createMissionEnrichmentRun({
      missionId: 'bad id!', taskKey: 'k', workerId: 'w', workerVersion: '1',
      stages: [{ stageId: 'A', execute: makePassHandler() }],
    });
  } catch (err) {
    captured2 = 'THREW';
  }
  assert.strictEqual(captured2, 'THREW');
  assert.strictEqual(typeof captured2, 'string'); // still only 'THREW', never an ID
});

// ---------------------------------------------------------------------------
// K5-K8 — structural stage validation
// ---------------------------------------------------------------------------

test('K5: duplicate stageId rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: makePassHandler() },
      { stageId: 'A', execute: makePassHandler() },
    ],
  }), /KERNEL_STAGE_DUPLICATE/);
});

test('K6: missing dependency rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'B', dependsOn: ['A'], execute: makePassHandler() }],
  }), /KERNEL_DEPENDENCY_MISSING/);
});

test('K7: self dependency rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', dependsOn: ['A'], execute: makePassHandler() }],
  }), /KERNEL_STAGE_SELF_DEPENDENCY/);
});

test('K8: circular dependency rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', dependsOn: ['C'], execute: makePassHandler() },
      { stageId: 'B', dependsOn: ['A'], execute: makePassHandler() },
      { stageId: 'C', dependsOn: ['B'], execute: makePassHandler() },
    ],
  }), /KERNEL_DEPENDENCY_CIRCULAR/);
});

// ---------------------------------------------------------------------------
// K9 — dependency ordering honored regardless of declaration order
// ---------------------------------------------------------------------------

test('K9: dependency ordering honored', () => {
  const order = [];
  const mk = (id) => () => { order.push(id); return { status: 'PASS', result: { id } }; };
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'C', dependsOn: ['B'], execute: mk('C') },
      { stageId: 'B', dependsOn: ['A'], execute: mk('B') },
      { stageId: 'A', execute: mk('A') },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.deepStrictEqual(order, ['A', 'B', 'C'], 'dependencies must execute before dependents');
  assert.strictEqual(result.overallStatus, 'PASS');
});

// ---------------------------------------------------------------------------
// K10-K13 — all four handler outcomes recorded verbatim
// ---------------------------------------------------------------------------

test('K10: handler PASS accepted', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'PASS', result: { v: 1 } }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'PASS');
  assert.deepStrictEqual(result.stageResults[0].result, { status: 'PASS', result: { v: 1 } });
  assert.strictEqual(result.stageResults[0].failure, null);
});

test('K11: handler FAIL accepted', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'declared' } }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'FAIL');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('K12: handler BLOCKED accepted', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'BLOCKED', failure: { reason: 'STAGE_REPORTED', errorMessage: 'gate closed' } }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'BLOCKED');
  assert.strictEqual(result.overallStatus, 'BLOCKED');
});

test('K13: handler NOT_TESTED accepted', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'NOT_TESTED' }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'NOT_TESTED');
  assert.strictEqual(result.overallStatus, 'NOT_TESTED');
});

// ---------------------------------------------------------------------------
// K14-K16 — fail-closed conversions
// ---------------------------------------------------------------------------

test('K14: thrown exception becomes FAIL without leaking stack traces', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => { throw new Error('boom'); } }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'FAIL');
  assert.strictEqual(result.stageResults[0].failure.reason, 'HANDLER_THROWN');
  assert.strictEqual(result.stageResults[0].failure.errorMessage, 'boom');
  const serialized = JSON.stringify(result);
  assert.ok(!serialized.includes('    at '), 'no raw stack frames in canonical output');
  assert.ok(!serialized.includes('\n'), 'failure record stays single-line');
});

test('K15: unknown status becomes FAIL', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'MOSTLY_PASS' }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'FAIL');
  assert.strictEqual(result.stageResults[0].failure.reason, 'UNKNOWN_STATUS');
});

test('K16: missing execute handler becomes FAIL', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A' }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'FAIL');
  assert.strictEqual(result.stageResults[0].failure.reason, 'MISSING_HANDLER');
});

// ---------------------------------------------------------------------------
// K17-K19 — dependency outcome propagation (frozen laws)
// ---------------------------------------------------------------------------

test('K17: FAIL dependency blocks child without executing it', () => {
  let childExecuted = false;
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'x' } }) },
      { stageId: 'B', dependsOn: ['A'], execute: () => { childExecuted = true; return { status: 'PASS' }; } },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[1].status, 'BLOCKED');
  assert.deepStrictEqual(result.stageResults[1].blockedBy, ['A']);
  assert.strictEqual(result.stageResults[1].result, null);
  assert.strictEqual(childExecuted, false, 'dependent handler must not execute');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('K18: BLOCKED dependency blocks child and the whole chain', () => {
  let executed = 0;
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => { executed += 1; return { status: 'BLOCKED', failure: { reason: 'STAGE_REPORTED', errorMessage: 'gate' } }; } },
      { stageId: 'B', dependsOn: ['A'], execute: () => { executed += 1; return { status: 'PASS' }; } },
      { stageId: 'C', dependsOn: ['B'], execute: () => { executed += 1; return { status: 'PASS' }; } },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'BLOCKED');
  assert.strictEqual(result.stageResults[1].status, 'BLOCKED');
  assert.deepStrictEqual(result.stageResults[1].blockedBy, ['A']);
  assert.strictEqual(result.stageResults[2].status, 'BLOCKED');
  assert.deepStrictEqual(result.stageResults[2].blockedBy, ['B']);
  assert.strictEqual(executed, 1, 'only the first handler executes');
  assert.strictEqual(result.overallStatus, 'BLOCKED');
});

test('K19: NOT_TESTED dependency law — dependent becomes NOT_TESTED without executing', () => {
  let childExecuted = false;
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'NOT_TESTED' }) },
      { stageId: 'B', dependsOn: ['A'], execute: () => { childExecuted = true; return { status: 'PASS' }; } },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  // FROZEN LAW: an upstream stage that was not evaluated did not fail, so the
  // downstream stage is recorded as NOT_TESTED (not BLOCKED), handler not run.
  assert.strictEqual(result.stageResults[1].status, 'NOT_TESTED');
  assert.deepStrictEqual(result.stageResults[1].blockedBy, ['A']);
  assert.strictEqual(childExecuted, false);
  assert.strictEqual(result.overallStatus, 'NOT_TESTED');
});

// ---------------------------------------------------------------------------
// K20-K23 — overall verdict precedence: FAIL > BLOCKED > NOT_TESTED > PASS
// ---------------------------------------------------------------------------

test('K20: overall PASS when all stages PASS', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: makePassHandler() },
      { stageId: 'B', execute: makePassHandler() },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'PASS');
});

test('K21: overall FAIL dominates BLOCKED, NOT_TESTED and PASS', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'x' } }) },
      { stageId: 'B', dependsOn: ['A'], execute: makePassHandler() }, // becomes BLOCKED
      { stageId: 'C', execute: () => ({ status: 'NOT_TESTED' }) },
      { stageId: 'D', execute: makePassHandler() },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.deepStrictEqual(result.stageResults.map(r => r.status), ['FAIL', 'BLOCKED', 'NOT_TESTED', 'PASS']);
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('K22: overall BLOCKED dominates NOT_TESTED and PASS (no FAIL present)', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'BLOCKED', failure: { reason: 'STAGE_REPORTED', errorMessage: 'gate' } }) },
      { stageId: 'B', dependsOn: ['A'], execute: makePassHandler() }, // becomes BLOCKED
      { stageId: 'C', execute: () => ({ status: 'NOT_TESTED' }) },
      { stageId: 'D', execute: makePassHandler() },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'BLOCKED');
});

test('K23: overall NOT_TESTED dominates PASS (no FAIL or BLOCKED present)', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'NOT_TESTED' }) },
      { stageId: 'B', execute: makePassHandler() },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'NOT_TESTED');
});

// ---------------------------------------------------------------------------
// K24-K25 — determinism and purity
// ---------------------------------------------------------------------------

test('K24: deterministic replay — same inputs produce deep-equal results', () => {
  const buildRun = () => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'task-key-024', workerId: 'unified_mission_enrichment_worker', workerVersion: '0.1.0-w1b',
    stages: [
      { stageId: 'SOURCE_RESOLVE', execute: (ctx) => ({ status: 'PASS', result: { resolved: ctx.missionId } }) },
      { stageId: 'HASH_BIND', dependsOn: ['SOURCE_RESOLVE'], execute: (ctx) => ({ status: 'PASS', result: { bound: ctx.priorStageResults.SOURCE_RESOLVE.result.resolved } }) },
    ],
  });
  const input = { tokens: ['b', 'a'], nested: { n: 1 } };
  const r1 = executeMissionEnrichmentRun(buildRun(), { input, recordedAt: RECORDED_AT });
  const r2 = executeMissionEnrichmentRun(buildRun(), { input, recordedAt: RECORDED_AT });
  assert.deepStrictEqual(r1, r2, 'replay must be deep-equal');
  assert.strictEqual(r1.runId, r2.runId);
  assert.strictEqual(r1.overallStatus, 'PASS');
});

test('K25: kernel purity — no clock, no randomness, no env, no I/O, no domain words', () => {
  const source = fs.readFileSync(path.join(__dirname, 'services', 'mission_enrichment_orchestrator_kernel.js'), 'utf8');
  const forbiddenExact = [
    'Date.now', 'Math.random', 'randomUUID', 'process.env',
    'firebase-admin', 'firebase-functions', 'firestore', 'Firestore',
    "require('fs')", 'require("fs")', 'axios', 'node-fetch', 'https.get', 'http.get',
    'collection(',
    'notification', 'syllabus', 'jurisdiction', 'authority', 'vacancy', 'eligibility',
    'publication', 'paper', 'subject',
  ];
  for (const needle of forbiddenExact) {
    assert.ok(!source.includes(needle), `kernel source must not contain '${needle}'`);
  }
  // Only two requires are allowed: crypto + the accepted guardrail module.
  const requires = [...source.matchAll(/require\((['"])([^'"]+)\1\)/g)].map(m => m[2]).sort();
  assert.deepStrictEqual(requires, ['./mission_enrichment_guardrails', 'crypto']);
});

// ---------------------------------------------------------------------------
// K26-K28 — immutability discipline
// ---------------------------------------------------------------------------

test('K26: caller input is not mutated by the kernel', () => {
  const input = deepFreeze({ list: [1, 2, 3], nested: { a: 'b' } });
  const snapshot = JSON.parse(JSON.stringify(input));
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{
      stageId: 'A',
      execute: (ctx) => {
        try { ctx.input.list.push(4); } catch (_) { /* frozen */ }
        return { status: 'PASS', result: null };
      },
    }],
  });
  const result = executeMissionEnrichmentRun(run, { input, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'PASS');
  assert.deepStrictEqual(input, snapshot, 'caller input must be byte-value identical after the run');
});

test('K27: stage definitions are not mutated by the kernel', () => {
  const stages = [
    { stageId: 'A', retryable: true, execute: makePassHandler() },
    { stageId: 'B', dependsOn: ['A'], retryable: false, execute: makePassHandler() },
  ];
  const snapshot = stages.map(s => ({ stageId: s.stageId, dependsOn: s.dependsOn, retryable: s.retryable }));
  deepFreeze(stages);
  const run = createMissionEnrichmentRun({ missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1', stages });
  executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.deepStrictEqual(
    stages.map(s => ({ stageId: s.stageId, dependsOn: s.dependsOn, retryable: s.retryable })),
    snapshot,
    'stage definitions must be untouched',
  );
});

test('K28: priorStageResults are immutable to later handlers', () => {
  let observedBefore = null;
  let observedAfter = null;
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'PASS', result: { value: 7 } }) },
      {
        stageId: 'B',
        dependsOn: ['A'],
        execute: (ctx) => {
          observedBefore = ctx.priorStageResults.A.status;
          try { ctx.priorStageResults.A.status = 'FAIL'; } catch (_) { /* frozen */ }
          observedAfter = ctx.priorStageResults.A.status;
          return { status: 'PASS', result: null };
        },
      },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(observedBefore, 'PASS');
  assert.strictEqual(observedAfter, 'PASS', 'prior stage results must be frozen for handlers');
  assert.strictEqual(result.stageResults[0].status, 'PASS');
});

// ---------------------------------------------------------------------------
// K29-K31 — lifecycle write firewall on proposedWrite
// ---------------------------------------------------------------------------

test('K29: lifecycle write attempt in proposedWrite fails the stage', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'PASS', proposedWrite: { cardVisible: true } }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'FAIL');
  assert.strictEqual(result.stageResults[0].failure.reason, 'LIFECYCLE_WRITE_BLOCKED');
  assert.strictEqual(result.stageResults[0].result, null, 'the rejected plan must not be carried into the record');
  assert.strictEqual(result.overallStatus, 'FAIL');
});

test('K30: dotted visibility activation in proposedWrite fails the stage', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'PASS', proposedWrite: { 'visibility.quickEntryEnabled': true } }) }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'FAIL');
  assert.strictEqual(result.stageResults[0].failure.reason, 'LIFECYCLE_WRITE_BLOCKED');
});

test('K31: safe evidence write plan accepted', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{
      stageId: 'A',
      execute: () => ({
        status: 'PASS',
        proposedWrite: {
          workerEvidence: { digest: 'sha256:aa' },
          sourceEvidence: { ref: 'opaque-token' },
          readinessEvidence: { checks: ['X'] },
        },
      }),
    }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults[0].status, 'PASS');
  assert.deepStrictEqual(result.stageResults[0].result.proposedWrite.workerEvidence, { digest: 'sha256:aa' });
  assert.strictEqual(result.overallStatus, 'PASS');
});

// ---------------------------------------------------------------------------
// K32-K35 — action firewall on stage IDs (opaque labels only)
// ---------------------------------------------------------------------------

test('K32: launch_realm stage ID rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'launch_realm', execute: makePassHandler() }],
  }), /KERNEL_STAGE_ID_FORBIDDEN/);
});

test('K33: launch_exam_mission stage ID rejected', () => {
  assert.throws(() => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'launch_exam_mission', execute: makePassHandler() }],
  }), /KERNEL_STAGE_ID_FORBIDDEN/);
});

test('K34: SOURCE_RESOLVE stage label allowed as opaque unit of work', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'SOURCE_RESOLVE', execute: makePassHandler() }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'PASS');
});

test('K35: HASH_BIND stage label allowed as opaque unit of work', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'HASH_BIND', execute: makePassHandler() }],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(result.overallStatus, 'PASS');
});

// ---------------------------------------------------------------------------
// K36-K38 — evidence generation (reuses the guardrail envelope)
// ---------------------------------------------------------------------------

test('K36: evidence envelope generated per stage with guardrail contract', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'task-key-036', workerId: 'unified_mission_enrichment_worker', workerVersion: '0.1.0-w1b',
    stages: [
      { stageId: 'SOURCE_RESOLVE', execute: makePassHandler() },
      { stageId: 'HASH_BIND', dependsOn: ['SOURCE_RESOLVE'], execute: makePassHandler() },
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: { x: 1 }, recordedAt: RECORDED_AT });
  assert.strictEqual(result.stageResults.length, 2);
  for (const record of result.stageResults) {
    const env = record.evidence;
    assert.deepStrictEqual(
      Object.keys(env).sort(),
      ['inputDigest', 'missionId', 'outputDigest', 'recordedAt', 'sourceIdentityTokens', 'stage', 'status', 'workerId', 'workerVersion'],
    );
    assert.strictEqual(env.stage, record.stageId);
    assert.strictEqual(env.missionId, 'jee_main_2026');
    assert.strictEqual(env.status, record.status);
    assert.deepStrictEqual(env.sourceIdentityTokens, ['task-key-036']);
    assert.strictEqual(env.recordedAt, RECORDED_AT);
    assert.match(env.inputDigest, /^[0-9a-f]{64}$/);
    assert.match(env.outputDigest, /^[0-9a-f]{64}$/);
  }
});

test('K37: evidence contains no lifecycle or publication fields', () => {
  const run = createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'k', workerId: 'w', workerVersion: '1',
    stages: [
      { stageId: 'A', execute: () => ({ status: 'FAIL', failure: { reason: 'STAGE_REPORTED', errorMessage: 'x' } }) },
      { stageId: 'B', dependsOn: ['A'], execute: makePassHandler() }, // BLOCKED
    ],
  });
  const result = executeMissionEnrichmentRun(run, { input: null, recordedAt: RECORDED_AT });
  const forbidden = ['status_realm', 'realmStatus', 'catalogStatus', 'studentPublicationState', 'cardVisible',
    'userPanelVisible', 'visibility', 'quickEntryEnabled', 'smartEntryEnabled', 'archived',
    'completion_status', 'lifecycleMutation', 'publishStatus', 'publishEligible', 'missionReady'];
  for (const record of result.stageResults) {
    for (const key of Object.keys(record.evidence)) {
      assert.ok(!forbidden.includes(key), `evidence must not carry lifecycle field '${key}'`);
    }
  }
});

test('K38: same run emits stable evidence across replays', () => {
  const buildRun = () => createMissionEnrichmentRun({
    missionId: 'jee_main_2026', taskKey: 'task-key-038', workerId: 'w', workerVersion: '1',
    stages: [{ stageId: 'A', execute: () => ({ status: 'PASS', result: { n: 1 } }) }],
  });
  const r1 = executeMissionEnrichmentRun(buildRun(), { input: { a: 1 }, recordedAt: RECORDED_AT });
  const r2 = executeMissionEnrichmentRun(buildRun(), { input: { a: 1 }, recordedAt: RECORDED_AT });
  assert.deepStrictEqual(
    r1.stageResults.map(r => r.evidence),
    r2.stageResults.map(r => r.evidence),
  );
});

// ---------------------------------------------------------------------------
// K39 — run identity is taskKey-sensitive
// ---------------------------------------------------------------------------

test('K39: taskKey change changes the run identity', () => {
  const base = { missionId: 'jee_main_2026', workerId: 'w', workerVersion: '1', stages: [{ stageId: 'A', execute: makePassHandler() }] };
  const runA = createMissionEnrichmentRun({ ...base, taskKey: 'task-key-A' });
  const runB = createMissionEnrichmentRun({ ...base, taskKey: 'task-key-B' });
  assert.notStrictEqual(runA.runId, runB.runId);
  const resA = executeMissionEnrichmentRun(runA, { input: null, recordedAt: RECORDED_AT });
  const resB = executeMissionEnrichmentRun(runB, { input: null, recordedAt: RECORDED_AT });
  assert.strictEqual(resA.taskKey, 'task-key-A');
  assert.strictEqual(resB.taskKey, 'task-key-B');
  assert.notStrictEqual(resA.runId, resB.runId);
});

// ---------------------------------------------------------------------------
// K40 — public API exact lock (functions only, exactly three)
// ---------------------------------------------------------------------------

test('K40: public API lock — exactly three function exports, nothing else', () => {
  const actualKeys = Object.keys(kernel).sort();
  assert.deepStrictEqual(actualKeys, ['createMissionEnrichmentRun', 'executeMissionEnrichmentRun', 'validateMissionEnrichmentStages']);
  for (const key of actualKeys) {
    assert.strictEqual(typeof kernel[key], 'function', `export '${key}' must be a function`);
  }
  const nonFunctions = actualKeys.filter(key => typeof kernel[key] !== 'function');
  assert.deepStrictEqual(nonFunctions, []);
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
