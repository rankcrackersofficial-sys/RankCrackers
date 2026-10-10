/**
 * RC_UNIFIED_WORKER_W1A — Mission Enrichment Guardrails (Constitutional Safety Primitives)
 * =============================================================================
 * PURE reusable safety layer for the future Unified Mission Enrichment Worker.
 *
 * Constitutional laws frozen here (Worker lane):
 *   WORKER MAY ENRICH / WRITE EVIDENCE / PREPARE REVIEWABLE DATA.
 *   WORKER MAY NOT PUBLISH, ACTIVATE STUDENT VISIBILITY, ENABLE QUICK/SMART START,
 *   ARCHIVE/RESTORE/PAUSE/LAUNCH REALM, INVOKE LIFECYCLE ACTIONS, OR REDEFINE
 *   CANONICAL MISSION IDENTITY.
 *
 * Purity contract of this module:
 *   - No firebase-admin / Firestore / network / filesystem imports.
 *   - No environment dependency. No internal clock reads (caller passes time).
 *   - No persisted schema invented: every accepted/rejected field below is an
 *     EXISTING physical field observed in the deployed runtime
 *     (functions/callable/handle_sentinel_action.js, functions/services/mission_lifecycle_governance.js).
 *   - Contract-neutral: NO officialSource/isOfficial/language/jurisdictionLevel/
 *     stateCode/cycleId/syllabusMode/documentRole/permanentMissionId concepts.
 *     Source identity tokens are opaque strings used only for deterministic hashing.
 *
 * Identity charset intentionally matches the existing canonical validator
 * (functions/canonical_mission_registry.js — validateOrResolveId). This module
 * NEVER generates, infers, or alters a mission ID; it validates and returns
 * the caller-supplied existing ID only.
 */

const crypto = require('crypto');

/**
 * Character contract inherited from the existing canonical ID validator.
 * canonical_mission_registry.js rejects any ID failing:
 *   /^[a-zA-Z0-9_\-()]+$/
 */
const CANONICAL_ID_PATTERN = /^[a-zA-Z0-9_\-()]+$/;

/**
 * A. assertMissionEnrichmentIdentity(missionId)
 *
 * Validates an EXISTING canonical mission ID and returns it trimmed.
 * Rejects empty / non-string / whitespace-only / charset-invalid values by
 * throwing. Never generates a fallback ID. Never infers or alters the ID.
 */
function assertMissionEnrichmentIdentity(missionId) {
  if (typeof missionId !== 'string') {
    throw new Error('MISSION_ID_INVALID: canonical mission ID must be a non-empty string.');
  }
  const normalized = missionId.trim();
  if (normalized.length === 0) {
    throw new Error('MISSION_ID_INVALID: canonical mission ID must be a non-empty string.');
  }
  if (!CANONICAL_ID_PATTERN.test(normalized)) {
    throw new Error(`MISSION_ID_INVALID: canonical mission ID '${normalized}' fails the canonical character contract.`);
  }
  return normalized;
}

/**
 * B. buildMissionEnrichmentTaskKey({ missionId, sourceIdentityTokens, workerContractVersion })
 *
 * Deterministic idempotency key over:
 *   canonical mission ID + opaque source identity tokens + worker contract version.
 *
 * - Tokens are OPAQUE strings: trimmed, empties dropped, sorted lexicographically,
 *   so identical logical input in any array order yields the same key.
 * - A single string is tolerated and treated as one token.
 * - SHA256 hex output. Pure: nothing persisted, no year/cycle/authority/exam logic.
 */
function buildMissionEnrichmentTaskKey({ missionId, sourceIdentityTokens, workerContractVersion }) {
  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);

  let tokenList;
  if (Array.isArray(sourceIdentityTokens)) {
    tokenList = sourceIdentityTokens;
  } else if (typeof sourceIdentityTokens === 'string') {
    tokenList = [sourceIdentityTokens];
  } else {
    throw new Error('TASK_KEY_INVALID: sourceIdentityTokens must be an array of opaque strings or a single string.');
  }

  const normalizedTokens = tokenList
    .map(token => (typeof token === 'string' ? token.trim() : ''))
    .filter(token => token.length > 0)
    .sort();

  const versionText = typeof workerContractVersion === 'string'
    ? workerContractVersion.trim()
    : String(workerContractVersion ?? '');
  if (versionText.length === 0) {
    throw new Error('TASK_KEY_INVALID: workerContractVersion must be a non-empty value.');
  }

  const canonicalPayload = JSON.stringify({
    contractVersion: versionText,
    missionId: normalizedMissionId,
    sourceTokens: normalizedTokens,
  });

  return crypto.createHash('sha256').update(canonicalPayload).digest('hex');
}

/**
 * C. assertNoLifecycleMutation(writePlan)
 *
 * Publication/lifecycle firewall for a proposed mission/catalog update object.
 * Accepts nested objects AND Firestore-style dotted keys (both are flattened to
 * canonical dotted paths and checked identically).
 *
 * Blocks (fail closed):
 *   - status / catalogStatus / studentPublicationState set to an activation or
 *     publication value ('active' | 'published' | 'live', case-insensitive).
 *   - cardVisible / userPanelVisible / visibility.{studentVisible,catalogVisible,
 *     userPanelVisible,quickEntryEnabled,smartEntryEnabled} set to true.
 *   - ANY change to: archived, completion_status, lifecycleMutation.
 *   - publishStatus set to a publication-implying value ('published').
 *
 * Allows harmless enrichment/evidence namespaces (missionVariables,
 * workerEvidence, sourceEvidence, provenance, readinessEvidence) as long as no
 * protected lifecycle path appears anywhere in the flattened plan.
 *
 * Returns the validated plan on success; throws on any violation.
 */
const ACTIVATION_STATUS_VALUES = new Set(['active', 'published', 'live']);
const PUBLICATION_PUBLISHSTATUS_VALUES = new Set(['published']);
const VISIBILITY_TRUE_PATHS = new Set([
  'cardVisible',
  'userPanelVisible',
  'visibility.studentVisible',
  'visibility.catalogVisible',
  'visibility.userPanelVisible',
  'visibility.quickEntryEnabled',
  'visibility.smartEntryEnabled',
]);
const ALWAYS_BLOCKED_PATHS = new Set(['archived', 'completion_status', 'lifecycleMutation']);
const STATUS_STYLE_PATHS = new Set(['status', 'catalogStatus', 'studentPublicationState']);

function flattenWritePlan(value, prefix, out) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return out;
  }
  for (const key of Object.keys(value)) {
    const path = prefix.length > 0 ? `${prefix}.${key}` : key;
    const child = value[key];
    if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
      flattenWritePlan(child, path, out);
    } else {
      out.push({ path, value: child });
    }
  }
  return out;
}

function assertNoLifecycleMutation(writePlan) {
  if (writePlan === null || typeof writePlan !== 'object' || Array.isArray(writePlan)) {
    throw new Error('WRITE_PLAN_INVALID: write plan must be a plain object.');
  }

  const leaves = flattenWritePlan(writePlan, '', []);

  const isAlwaysBlockedPath = (path) => {
    for (const blocked of ALWAYS_BLOCKED_PATHS) {
      if (path === blocked || path.startsWith(`${blocked}.`)) return true;
    }
    return false;
  };

  for (const { path, value } of leaves) {
    if (isAlwaysBlockedPath(path)) {
      throw new Error(`LIFECYCLE_MUTATION_BLOCKED: '${path}' may not be mutated by worker code (got ${JSON.stringify(value)}).`);
    }

    if (STATUS_STYLE_PATHS.has(path)) {
      const statusText = String(value ?? '').trim().toLowerCase();
      if (ACTIVATION_STATUS_VALUES.has(statusText)) {
        throw new Error(`LIFECYCLE_MUTATION_BLOCKED: '${path}' may not be set to activation/publication value '${value}' by worker code.`);
      }
    }

    if (path === 'publishStatus' && PUBLICATION_PUBLISHSTATUS_VALUES.has(String(value ?? '').trim().toLowerCase())) {
      throw new Error(`LIFECYCLE_MUTATION_BLOCKED: 'publishStatus' may not be set to '${value}' by worker code.`);
    }

    if (VISIBILITY_TRUE_PATHS.has(path) && value === true) {
      throw new Error(`LIFECYCLE_MUTATION_BLOCKED: '${path}=true' (student visibility / quick or smart entry) may not be set by worker code.`);
    }
  }

  return writePlan;
}

/**
 * D. assertWorkerCannotInvokeLifecycleAction(action)
 *
 * Rejects mission lifecycle actions a worker must never invoke
 * (case-insensitive, trimmed). The block list is the minimum constitutional
 * set plus launch_exam_mission (creation is a Founder action).
 * Ordinary worker stage labels (e.g. SOURCE_RESOLVE, HASH_BIND) pass.
 *
 * Returns the normalized action when allowed; throws when blocked.
 */
const FORBIDDEN_WORKER_LIFECYCLE_ACTIONS = new Set([
  'launch_realm',
  'pause_realm',
  'archive_realm',
  'restore_realm',
  'delete_realm_permanently',
  'declare_result',
  'manifest_realm',
  'launch_exam_mission',
]);

function assertWorkerCannotInvokeLifecycleAction(action) {
  if (typeof action !== 'string') {
    throw new Error('WORKER_ACTION_INVALID: action must be a string.');
  }
  const normalized = action.trim();
  if (normalized.length === 0) {
    throw new Error('WORKER_ACTION_INVALID: action must be a non-empty string.');
  }
  if (FORBIDDEN_WORKER_LIFECYCLE_ACTIONS.has(normalized.toLowerCase())) {
    throw new Error(`WORKER_LIFECYCLE_ACTION_BLOCKED: workers may never invoke lifecycle action '${normalized}'.`);
  }
  return normalized;
}

/**
 * E. buildReadOnlyWorkerEvidenceEnvelope({ missionId, workerId, workerVersion,
 *      stage, sourceIdentityTokens, inputDigest, outputDigest, status, recordedAt })
 *
 * Builds a PURE in-memory evidence object with a fixed, deterministic key set:
 *   inputDigest, missionId, outputDigest, recordedAt, sourceIdentityTokens,
 *   stage, status, workerId, workerVersion
 * (sorted alphabetically for shape stability; keys sorted for determinism).
 *
 * - `recordedAt` MUST be supplied by the caller (timestamp-like value); this
 *   module never reads a clock.
 * - `status` is the worker-stage EXECUTION status (opaque string), never a
 *   mission lifecycle/publication declaration.
 * - `stage` is validated through the lifecycle-action firewall so an evidence
 *   envelope can never carry a forbidden lifecycle action as its stage.
 * - No publish/readiness truth is declared; no persisted schema is invented.
 */
const EVIDENCE_ENVELOPE_KEYS = [
  'inputDigest',
  'missionId',
  'outputDigest',
  'recordedAt',
  'sourceIdentityTokens',
  'stage',
  'status',
  'workerId',
  'workerVersion',
];

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`EVIDENCE_ENVELOPE_INVALID: '${fieldName}' must be a non-empty string.`);
  }
  return value.trim();
}

function buildReadOnlyWorkerEvidenceEnvelope({
  missionId,
  workerId,
  workerVersion,
  stage,
  sourceIdentityTokens = [],
  inputDigest = '',
  outputDigest = '',
  status,
  recordedAt,
} = {}) {
  const normalizedMissionId = assertMissionEnrichmentIdentity(missionId);
  const normalizedStage = assertWorkerCannotInvokeLifecycleAction(stage);

  const tokens = Array.isArray(sourceIdentityTokens)
    ? sourceIdentityTokens.map(token => String(token)).filter(token => token.trim().length > 0).sort()
    : [];
  if (typeof sourceIdentityTokens === 'string' && sourceIdentityTokens.trim().length > 0) {
    tokens.push(sourceIdentityTokens.trim());
    tokens.sort();
  }

  const envelope = {
    inputDigest: requireNonEmptyString(inputDigest, 'inputDigest'),
    missionId: normalizedMissionId,
    outputDigest: requireNonEmptyString(outputDigest, 'outputDigest'),
    recordedAt,
    sourceIdentityTokens: tokens,
    stage: normalizedStage,
    status: requireNonEmptyString(status, 'status'),
    workerId: requireNonEmptyString(workerId, 'workerId'),
    workerVersion: requireNonEmptyString(workerVersion, 'workerVersion'),
  };

  return envelope;
}

// CANONICAL_ID_PATTERN and EVIDENCE_ENVELOPE_KEYS are PRIVATE implementation
// details of this module and are intentionally NOT exported. The public API is
// exactly the five safety functions below (locked by the W1A-R1 API-lock test).

module.exports = {
  assertMissionEnrichmentIdentity,
  assertNoLifecycleMutation,
  assertWorkerCannotInvokeLifecycleAction,
  buildMissionEnrichmentTaskKey,
  buildReadOnlyWorkerEvidenceEnvelope,
};
