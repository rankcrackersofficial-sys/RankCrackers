/**
 * RC_UNIFIED_WORKER_W1B — Pure Mission Enrichment Orchestrator Kernel
 * =============================================================================
 * Generic execution mechanics for the future Unified Mission Enrichment Worker.
 *
 * The kernel knows NOTHING about what a stage "means". It accepts opaque stage
 * definitions, executes them sequentially in dependency-respecting order,
 * records immutable per-stage evidence, and fails closed. It never creates
 * mission identity, never persists anything, never performs any external I/O,
 * and never assumes any domain schema (no source, document, geography,
 * timeline, or lifecycle-release concepts appear in this file).
 *
 * Purity contract:
 *   - Dependencies: Node built-in 'crypto' ONLY + the accepted guardrail module
 *     (./mission_enrichment_guardrails, five frozen public functions).
 *   - No external I/O of any kind; no environment reads; no clock reads
 *     (the caller supplies the recordedAt value); no nondeterminism.
 *   - Stage outcomes are restricted to exactly: PASS | FAIL | BLOCKED | NOT_TESTED.
 *   - Overall verdict precedence (frozen): FAIL > BLOCKED > NOT_TESTED > PASS.
 *   - Frozen dependency law: a stage whose dependency ended FAIL or BLOCKED
 *     becomes BLOCKED without executing; a stage whose dependency ended
 *     NOT_TESTED becomes NOT_TESTED without executing (an upstream stage that
 *     was not evaluated did not fail, so the downstream stage is likewise
 *     recorded as not evaluated).
 *   - Fail-closed law: unexpected exception -> FAIL; invalid handler result ->
 *     FAIL; unknown status -> FAIL; missing handler -> FAIL. No silent
 *     continuation. The overall run is never PASS if any stage is FAIL or
 *     BLOCKED.
 *   - Lifecycle firewall: a handler result carrying a proposedWrite plan is
 *     validated through assertNoLifecycleMutation; any violation fails the
 *     stage and the plan is never persisted (the kernel persists nothing).
 *   - Action firewall: stage IDs are validated through
 *     assertWorkerCannotInvokeLifecycleAction, so lifecycle action names can
 *     never enter the graph even as opaque labels.
 *   - Input immutability: caller input, stage definitions, and prior stage
 *     outputs are never mutated. Handlers receive a deep-frozen context whose
 *     priorStageResults are normalized deep-frozen copies.
 */

const crypto = require('crypto');

const {
  assertMissionEnrichmentIdentity,
  assertNoLifecycleMutation,
  assertWorkerCannotInvokeLifecycleAction,
  buildReadOnlyWorkerEvidenceEnvelope,
} = require('./mission_enrichment_guardrails');

// ---------------------------------------------------------------------------
// Private constants (never exported)
// ---------------------------------------------------------------------------

const ALLOWED_STAGE_STATUSES = ['PASS', 'FAIL', 'BLOCKED', 'NOT_TESTED'];
const VERDICT_PRECEDENCE = ['FAIL', 'BLOCKED', 'NOT_TESTED', 'PASS'];
const NOT_TESTED_DEPENDENCY_LAW =
  'A stage whose dependency ended NOT_TESTED becomes NOT_TESTED without executing its handler.';

// ---------------------------------------------------------------------------
// Deterministic serialization + digests (private)
// ---------------------------------------------------------------------------

function stableStringify(value) {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') {
    const primitive = JSON.stringify(value);
    return primitive === undefined ? 'null' : primitive;
  }
  if (Array.isArray(value)) {
    return '[' + value.map(item => stableStringify(item)).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  const body = keys.map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',');
  return '{' + body + '}';
}

function digestOf(value) {
  return crypto.createHash('sha256').update(stableStringify(value)).digest('hex');
}

function deepFreeze(value) {
  if (value !== null && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      deepFreeze(value[key]);
    }
    Object.freeze(value);
  }
  return value;
}

function jsonNormalizedCopy(value) {
  return JSON.parse(stableStringify(value));
}

function requireNonEmptyString(value, code, label) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${code}: ${label} must be a non-empty string.`);
  }
  return value.trim();
}

// ---------------------------------------------------------------------------
// Stage validation (public)
// ---------------------------------------------------------------------------

/**
 * validateMissionEnrichmentStages(stages)
 *
 * Validates an ordered list of generic stage definitions:
 *   { stageId: string, execute?: function, dependsOn?: string[], retryable?: boolean }
 *
 * Rejects: non-array/empty list, duplicate stageId, lifecycle action names as
 * stage IDs, missing dependency references, self-dependency, circular
 * dependency graphs. execute is NOT required here — a missing handler is an
 * execution-time fail-closed condition, not a structural one.
 *
 * Returns a frozen array of frozen normalized stage descriptors (copies — the
 * caller's objects are never retained or mutated).
 */
function validateMissionEnrichmentStages(stages) {
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error('KERNEL_STAGES_INVALID: at least one stage definition is required.');
  }

  const seen = new Set();
  const normalized = [];

  for (const stage of stages) {
    if (stage === null || typeof stage !== 'object' || Array.isArray(stage)) {
      throw new Error('KERNEL_STAGE_INVALID: each stage definition must be a plain object.');
    }
    const stageId = requireNonEmptyString(stage.stageId, 'KERNEL_STAGE_INVALID', 'stageId');
    if (seen.has(stageId)) {
      throw new Error(`KERNEL_STAGE_DUPLICATE: duplicate stageId '${stageId}'.`);
    }
    // Action firewall: lifecycle action names can never enter the graph.
    try {
      assertWorkerCannotInvokeLifecycleAction(stageId);
    } catch (err) {
      throw new Error(`KERNEL_STAGE_ID_FORBIDDEN: stageId '${stageId}' is a forbidden lifecycle action name.`);
    }
    seen.add(stageId);

    let dependsOn = [];
    if (stage.dependsOn !== undefined && stage.dependsOn !== null) {
      if (!Array.isArray(stage.dependsOn)) {
        throw new Error(`KERNEL_STAGE_DEPENDS_INVALID: dependsOn of stage '${stageId}' must be an array of stage IDs.`);
      }
      dependsOn = stage.dependsOn.map(dep => requireNonEmptyString(dep, 'KERNEL_STAGE_DEPENDS_INVALID', `dependsOn entry of stage '${stageId}'`));
    }

    if (stage.execute !== undefined && stage.execute !== null && typeof stage.execute !== 'function') {
      throw new Error(`KERNEL_STAGE_EXECUTE_INVALID: execute of stage '${stageId}' must be a function when provided.`);
    }

    if (stage.retryable !== undefined && stage.retryable !== null && typeof stage.retryable !== 'boolean') {
      throw new Error(`KERNEL_STAGE_RETRYABLE_INVALID: retryable of stage '${stageId}' must be a boolean when provided.`);
    }

    normalized.push({
      stageId,
      dependsOn,
      retryable: stage.retryable === true,
      execute: typeof stage.execute === 'function' ? stage.execute : null,
    });
  }

  const ids = new Set(normalized.map(stage => stage.stageId));

  for (const stage of normalized) {
    for (const dep of stage.dependsOn) {
      if (dep === stage.stageId) {
        throw new Error(`KERNEL_STAGE_SELF_DEPENDENCY: stage '${stage.stageId}' cannot depend on itself.`);
      }
      if (!ids.has(dep)) {
        throw new Error(`KERNEL_DEPENDENCY_MISSING: stage '${stage.stageId}' depends on unknown stage '${dep}'.`);
      }
    }
  }

  // Circular dependency detection (iterative DFS with node states).
  const state = new Map();
  const stack = [];
  const visit = (stageId) => {
    const nodeState = state.get(stageId);
    if (nodeState === 'done') return;
    if (nodeState === 'visiting') {
      throw new Error(`KERNEL_DEPENDENCY_CIRCULAR: circular dependency detected at '${stack.join(' -> ')} -> ${stageId}'.`);
    }
    state.set(stageId, 'visiting');
    stack.push(stageId);
    const stage = normalized.find(candidate => candidate.stageId === stageId);
    for (const dep of stage.dependsOn) {
      visit(dep);
    }
    stack.pop();
    state.set(stageId, 'done');
  };
  for (const stage of normalized) {
    visit(stage.stageId);
  }

  return deepFreeze(normalized.map(stage => deepFreeze({ ...stage })));
}

// ---------------------------------------------------------------------------
// Run construction (public)
// ---------------------------------------------------------------------------

/**
 * createMissionEnrichmentRun({ missionId, taskKey, workerId, workerVersion, stages })
 *
 * Validates the authoritative inputs and builds a frozen, replayable run
 * descriptor with a deterministic run identity. The mission ID is validated
 * through the accepted guardrail and preserved exactly — the kernel never
 * generates, infers, or alters identity.
 */
function createMissionEnrichmentRun({ missionId, taskKey, workerId, workerVersion, stages }) {
  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);
  const normalizedTaskKey = requireNonEmptyString(taskKey, 'KERNEL_TASK_KEY_INVALID', 'taskKey');
  const normalizedWorkerId = requireNonEmptyString(workerId, 'KERNEL_WORKER_ID_INVALID', 'workerId');
  const normalizedWorkerVersion = requireNonEmptyString(workerVersion, 'KERNEL_WORKER_VERSION_INVALID', 'workerVersion');
  const normalizedStages = validateMissionEnrichmentStages(stages);

  const runId = digestOf({
    missionId: normalizedMissionId,
    taskKey: normalizedTaskKey,
    workerId: normalizedWorkerId,
    workerVersion: normalizedWorkerVersion,
    stageIds: normalizedStages.map(stage => stage.stageId),
  });

  return deepFreeze({
    runId,
    missionId: normalizedMissionId,
    taskKey: normalizedTaskKey,
    workerId: normalizedWorkerId,
    workerVersion: normalizedWorkerVersion,
    stages: normalizedStages,
  });
}

// ---------------------------------------------------------------------------
// Execution (public)
// ---------------------------------------------------------------------------

function buildStageContext(run, stageId, priorStageResults, input) {
  return deepFreeze({
    missionId: run.missionId,
    taskKey: run.taskKey,
    workerId: run.workerId,
    workerVersion: run.workerVersion,
    stageId,
    priorStageResults,
    input,
  });
}

function makeEvidence(run, stageId, status, inputDigest, outputDigest, recordedAt) {
  return buildReadOnlyWorkerEvidenceEnvelope({
    missionId: run.missionId,
    workerId: run.workerId,
    workerVersion: run.workerVersion,
    stage: stageId,
    sourceIdentityTokens: [run.taskKey],
    inputDigest,
    outputDigest,
    status,
    recordedAt,
  });
}

function evaluateStage(handler, context) {
  let raw;
  try {
    if (typeof handler !== 'function') {
      return { status: 'FAIL', result: null, failure: { reason: 'MISSING_HANDLER', errorName: null, errorMessage: 'stage defines no execute handler' } };
    }
    raw = handler(context);
  } catch (err) {
    return {
      status: 'FAIL',
      result: null,
      failure: { reason: 'HANDLER_THROWN', errorName: err && err.name ? String(err.name) : 'Error', errorMessage: err && err.message ? String(err.message) : 'handler threw' },
    };
  }

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return { status: 'FAIL', result: null, failure: { reason: 'INVALID_RESULT', errorName: null, errorMessage: 'handler must return a result object with an allowed status' } };
  }
  if (!ALLOWED_STAGE_STATUSES.includes(raw.status)) {
    return { status: 'FAIL', result: null, failure: { reason: 'UNKNOWN_STATUS', errorName: null, errorMessage: `handler status must be one of ${ALLOWED_STAGE_STATUSES.join('|')}` } };
  }

  if (raw.proposedWrite !== undefined && raw.proposedWrite !== null) {
    try {
      assertNoLifecycleMutation(raw.proposedWrite);
    } catch (err) {
      return {
        status: 'FAIL',
        result: null,
        failure: { reason: 'LIFECYCLE_WRITE_BLOCKED', errorName: err && err.name ? String(err.name) : 'Error', errorMessage: err && err.message ? String(err.message) : 'proposedWrite violated the lifecycle firewall' },
      };
    }
  }

  return { status: raw.status, result: raw, failure: null };
}

function resolveOverallVerdict(statuses) {
  for (const verdict of VERDICT_PRECEDENCE) {
    if (statuses.includes(verdict)) return verdict;
  }
  return 'PASS';
}

/**
 * executeMissionEnrichmentRun(run, { input, recordedAt })
 *
 * Executes a run's stages sequentially in dependency-respecting order with
 * fail-closed semantics, and returns a frozen orchestration result containing
 * the overall verdict and per-stage immutable evidence. Nothing is persisted.
 * Same inputs + deterministic handlers produce a deep-equal result.
 */
function executeMissionEnrichmentRun(run, execution = {}) {
  if (run === null || typeof run !== 'object' || Array.isArray(run)) {
    throw new Error('KERNEL_RUN_INVALID: run must be a run descriptor created by createMissionEnrichmentRun.');
  }
  if (typeof run.runId !== 'string' || run.runId.length === 0) {
    throw new Error('KERNEL_RUN_INVALID: run.runId is missing.');
  }
  const stages = validateMissionEnrichmentStages(run.stages);
  const input = execution.input === undefined ? null : execution.input;
  if (!('recordedAt' in execution)) {
    throw new Error('KERNEL_EXECUTION_INVALID: recordedAt must be supplied by the caller.');
  }
  const { recordedAt } = execution;

  const stageById = new Map(stages.map(stage => [stage.stageId, stage]));
  const results = new Map();
  const inputDigest = digestOf({ input });

  const ensureExecuted = (stageId) => {
    if (results.has(stageId)) return results.get(stageId);

    const stage = stageById.get(stageId);

    // Dependencies first (declaration order of the graph, memoized).
    for (const dep of stage.dependsOn) {
      ensureExecuted(dep);
    }

    const dependencyStatuses = stage.dependsOn.map(dep => ({ stageId: dep, status: results.get(dep).status }));
    const failingDeps = dependencyStatuses.filter(dep => dep.status === 'FAIL' || dep.status === 'BLOCKED');
    const notEvaluatedDeps = dependencyStatuses.filter(dep => dep.status === 'NOT_TESTED');

    let evaluation;
    let blockedBy = [];
    if (failingDeps.length > 0) {
      blockedBy = failingDeps.map(dep => dep.stageId);
      evaluation = { status: 'BLOCKED', result: null, failure: null };
    } else if (notEvaluatedDeps.length > 0) {
      // Frozen law: upstream not evaluated (no failure) -> downstream NOT_TESTED.
      blockedBy = notEvaluatedDeps.map(dep => dep.stageId);
      evaluation = { status: 'NOT_TESTED', result: null, failure: null };
    } else {
      const priorStageResults = {};
      for (const dep of stage.dependsOn) {
        const depResult = results.get(dep);
        priorStageResults[dep] = { status: depResult.status, result: jsonNormalizedCopy(depResult.result === null ? null : depResult.result) };
      }
      const context = buildStageContext(run, stage.stageId, deepFreeze(priorStageResults), input);
      evaluation = evaluateStage(stage.execute, context);
    }

    const outputDigest = evaluation.status === 'BLOCKED' || evaluation.status === 'NOT_TESTED'
      ? digestOf({ stageId: stage.stageId, outcomeStatus: evaluation.status, blockedBy })
      : digestOf({ stageId: stage.stageId, outcomeStatus: evaluation.status, result: jsonNormalizedCopy(evaluation.result === null ? null : evaluation.result) });

    const evidence = makeEvidence(run, stage.stageId, evaluation.status, inputDigest, outputDigest, recordedAt);

    const record = deepFreeze({
      stageId: stage.stageId,
      status: evaluation.status,
      result: evaluation.result,
      failure: evaluation.failure,
      blockedBy,
      evidence,
    });
    results.set(stageId, record);
    return record;
  };

  for (const stage of stages) {
    ensureExecuted(stage.stageId);
  }

  const stageResults = stages.map(stage => results.get(stage.stageId));
  const overallStatus = resolveOverallVerdict(stageResults.map(record => record.status));

  return deepFreeze({
    runId: run.runId,
    missionId: run.missionId,
    taskKey: run.taskKey,
    workerId: run.workerId,
    workerVersion: run.workerVersion,
    recordedAt,
    overallStatus,
    inputDigest,
    stageResults,
  });
}

// Public API: exactly three functions. No constants, no classes, no mutable state.
module.exports = {
  createMissionEnrichmentRun,
  executeMissionEnrichmentRun,
  validateMissionEnrichmentStages,
};
