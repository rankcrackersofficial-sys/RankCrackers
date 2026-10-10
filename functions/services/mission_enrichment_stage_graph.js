/**
 * RC_UNIFIED_WORKER_W1C — Canonical Mission Enrichment Stage Graph
 * =============================================================================
 * ONE reusable execution topology for EVERY supported mission. This module
 * freezes generic orchestration order only:
 *
 *   SOURCE_RESOLVE -> HASH_BIND -> ROLE_CLASSIFY -> VARIABLE_EXTRACTION
 *   -> {SYLLABUS_HANDOFF, VARIABLE_EXTRACTION} -> EVIDENCE_FINALIZE
 *
 * It contains NO business extraction logic, NO runtime wiring, NO persistence,
 * NO identity creation, and NO domain-specific branching of any kind. Stage
 * differences across missions remain data supplied by callers; a stage that is
 * not applicable to a particular case simply reports NOT_TESTED through its
 * injected handler — the graph is never reshaped per mission.
 *
 * Business handlers are INJECTED by the caller, keyed by canonical stage ID.
 * This module only combines canonical stage IDs + canonical dependency lists
 * + externally supplied execute functions, and validates the resulting graph
 * with the accepted W1B orchestrator kernel validator before returning.
 * Missing handlers are retained as missing (execute: null) — their behavior at
 * execution time remains governed by the kernel's fail-closed law.
 *
 * Purity contract:
 *   - Only dependency: ./mission_enrichment_orchestrator_kernel (accepted W1B).
 *   - No runtime platform, database, queue, network, filesystem, environment,
 *     clock, or randomness usage of any kind.
 *   - Public API: exactly two functions, both pure; no exported constants,
 *     classes, or mutable state. All returned structures are deeply frozen.
 */

const { validateMissionEnrichmentStages } = require('./mission_enrichment_orchestrator_kernel');

// ---------------------------------------------------------------------------
// Private canonical topology (never exported; the metadata reader returns
// frozen copies of it). Exactly six generic stages in canonical order.
// ---------------------------------------------------------------------------

const CANONICAL_STAGE_TOPOLOGY = deepFreezeTopology([
  { stageId: 'SOURCE_RESOLVE', dependsOn: [] },
  { stageId: 'HASH_BIND', dependsOn: ['SOURCE_RESOLVE'] },
  { stageId: 'ROLE_CLASSIFY', dependsOn: ['HASH_BIND'] },
  { stageId: 'VARIABLE_EXTRACTION', dependsOn: ['ROLE_CLASSIFY'] },
  { stageId: 'SYLLABUS_HANDOFF', dependsOn: ['ROLE_CLASSIFY'] },
  { stageId: 'EVIDENCE_FINALIZE', dependsOn: ['VARIABLE_EXTRACTION', 'SYLLABUS_HANDOFF'] },
]);

function deepFreezeTopology(topology) {
  for (const entry of topology) {
    Object.freeze(entry.dependsOn);
    Object.freeze(entry);
  }
  Object.freeze(topology);
  return topology;
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

// ---------------------------------------------------------------------------
// Metadata reader (public)
// ---------------------------------------------------------------------------

/**
 * getCanonicalMissionEnrichmentGraph()
 *
 * Returns a deeply frozen, handler-free metadata snapshot of the canonical
 * graph: { stageIds: [...six canonical IDs in order...], dependencies: { stageId: [...deps...] } }.
 * Pure: builds a fresh frozen copy on every call; no handler exposure.
 */
function getCanonicalMissionEnrichmentGraph() {
  const stageIds = CANONICAL_STAGE_TOPOLOGY.map(entry => entry.stageId);
  const dependencies = {};
  for (const entry of CANONICAL_STAGE_TOPOLOGY) {
    dependencies[entry.stageId] = [...entry.dependsOn];
  }
  return deepFreeze({ stageIds, dependencies });
}

// ---------------------------------------------------------------------------
// Graph builder (public)
// ---------------------------------------------------------------------------

/**
 * buildCanonicalMissionEnrichmentStages(handlers)
 *
 * Builds the canonical stage descriptor list for the W1B orchestrator kernel:
 *   - canonical stage IDs in exact canonical order;
 *   - canonical dependency lists copied from the frozen topology;
 *   - execute functions injected from the caller's handler map, keyed by
 *     canonical stage ID (handlers are never mutated; unknown keys are
 *     rejected — a lifecycle action name can never enter the graph);
 *   - missing handlers retained as missing (execute absent -> kernel
 *     normalizes to execute: null; execution behavior is the kernel's
 *     fail-closed MISSING_HANDLER law, never invented business behavior);
 *   - the resulting graph is validated by the W1B kernel validator
 *     (duplicate/unknown/self/circular dependency rules) before return.
 *
 * Returns the kernel-validated, deeply frozen stage descriptor array.
 */
function buildCanonicalMissionEnrichmentStages(handlers) {
  if (handlers === null || typeof handlers !== 'object' || Array.isArray(handlers)) {
    throw new Error('STAGE_GRAPH_HANDLERS_INVALID: handlers must be an object keyed by canonical stage ID.');
  }

  const knownStageIds = new Set(CANONICAL_STAGE_TOPOLOGY.map(entry => entry.stageId));
  for (const key of Object.keys(handlers)) {
    if (!knownStageIds.has(key)) {
      throw new Error(`STAGE_GRAPH_HANDLER_KEY_INVALID: '${key}' is not a canonical stage ID. Only canonical stage IDs may be injected.`);
    }
    const handler = handlers[key];
    if (handler !== undefined && handler !== null && typeof handler !== 'function') {
      throw new Error(`STAGE_GRAPH_HANDLER_INVALID: handler for '${key}' must be a function when provided.`);
    }
  }

  const descriptors = CANONICAL_STAGE_TOPOLOGY.map(entry => {
    const descriptor = { stageId: entry.stageId, dependsOn: [...entry.dependsOn] };
    const handler = handlers[entry.stageId];
    if (typeof handler === 'function') {
      descriptor.execute = handler;
    }
    return descriptor;
  });

  // W1B kernel validation is authoritative: duplicates, unknown/self/circular
  // dependencies, and lifecycle action names cannot pass. Output is frozen.
  return validateMissionEnrichmentStages(descriptors);
}

// Public API: exactly two pure functions. No constants, classes, or mutable state.
module.exports = {
  buildCanonicalMissionEnrichmentStages,
  getCanonicalMissionEnrichmentGraph,
};
