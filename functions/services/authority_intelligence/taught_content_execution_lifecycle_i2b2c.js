'use strict';

// I2B2-C is the pure execution-lifecycle layer.  It owns only status
// transitions and leases; persistence, server time and authority reads are
// injected so this module cannot initialize Firebase or use a local clock.
const i1 = require('./taught_content_authority_i1');
const i2b1 = require('./taught_content_executor_authorization_i2b1');
const coordinator = require('./taught_content_execution_coordinator_i2b2b');

const LEASE_DURATION_MS = 15 * 60 * 1000;
const RENEWAL_INTERVAL_MS = 5 * 60 * 1000;
const RENEWAL_GRACE_MS = 2 * 60 * 1000;
const RENEWAL_DEADLINE_MS = LEASE_DURATION_MS - RENEWAL_GRACE_MS;

const STATES = Object.freeze({
  RESERVED: 'RESERVED',
  CLAIMED: 'CLAIMED',
});

const OUTCOMES = Object.freeze({
  CLAIMED: 'CLAIMED',
  RENEWED: 'RENEWED',
  TAKEN_OVER: 'TAKEN_OVER',
});

const FAILURE_CODES = Object.freeze({
  ...coordinator.FAILURE_CODES,
  EXECUTION_FENCE_STALE: 'EXECUTION_FENCE_STALE',
  LIFECYCLE_DEPENDENCY_INVALID: 'LIFECYCLE_DEPENDENCY_INVALID',
  LIFECYCLE_TIME_INVALID: 'LIFECYCLE_TIME_INVALID',
});

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(code, message) {
  const error = new Error(`${code}: ${message || code}`);
  error.code = code;
  throw error;
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((out, key) => {
      out[key] = clone(value[key]);
      return out;
    }, {});
  }
  return value;
}

function canonical(value) {
  return i1.canonicalJson(value);
}

function createLifecycleDependencies(dependencies) {
  const value = dependencies || {};
  if (!value.transactionStore || typeof value.transactionStore.runTransaction !== 'function') {
    fail(FAILURE_CODES.LIFECYCLE_DEPENDENCY_INVALID, 'transactionStore.runTransaction is required');
  }
  if (!value.authorityReader || typeof value.authorityReader.readCurrentReservationAuthority !== 'function') {
    fail(FAILURE_CODES.LIFECYCLE_DEPENDENCY_INVALID, 'authorityReader.readCurrentReservationAuthority is required');
  }
  if (!value.serverTime || typeof value.serverTime.now !== 'function') {
    fail(FAILURE_CODES.LIFECYCLE_DEPENDENCY_INVALID, 'serverTime.now is required');
  }
  return Object.freeze({
    transactionStore: value.transactionStore,
    authorityReader: value.authorityReader,
    serverTime: value.serverTime,
  });
}

function isServerWorkerContext(context) {
  return Boolean(context && context.serverOnly === true &&
    context.principalType === i2b1.PRINCIPAL_TYPE &&
    requiredString(context.executorId) &&
    requiredString(context.executorVersion) &&
    requiredString(context.workerInstanceId));
}

function requestOf(input) {
  if (input && input.request && typeof input.request === 'object') return input.request;
  return input || {};
}

function lifecycleInput(input) {
  const value = input || {};
  return {
    request: requestOf(value),
    expectedStatusVersion: value.expectedStatusVersion,
    expectedFencingToken: value.expectedFencingToken === undefined ? value.fencingToken : value.expectedFencingToken,
    expectedLeaseGeneration: value.expectedLeaseGeneration === undefined ? value.leaseGeneration : value.expectedLeaseGeneration,
    expectedLeaseOwner: value.expectedLeaseOwner === undefined ? value.leaseOwner : value.expectedLeaseOwner,
  };
}

function validNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function validateExpectedVersion(value) {
  return validNonNegativeInteger(value);
}

function contextMatchesRequest(request, context) {
  return isServerWorkerContext(context) &&
    context.executorId === request.executorId &&
    context.executorVersion === request.executorVersion;
}

function unwrapSnapshot(value) {
  if (!value) return null;
  if (typeof value.data === 'function') return value.exists === false ? null : clone(value.data());
  return clone(value);
}

function authorityScope(authority) {
  if (!authority) return null;
  return {
    executorId: authority.executorId,
    executorVersion: authority.executorVersion,
    authorizationVersion: authority.authorizationVersion,
    issuerId: authority.issuerId,
    active: authority.active,
    revoked: authority.revoked,
    allowedOperations: authority.allowedOperations,
    allowedRealmIds: authority.allowedRealmIds,
    allowedMissionIds: authority.allowedMissionIds,
    allowedSubjectIds: authority.allowedSubjectIds,
  };
}

function authorityChangeCode(before, after) {
  const a = before && before.executorRegistry;
  const b = after && after.executorRegistry;
  if (!a || !b) return FAILURE_CODES.AUTHORITY_VERSION_CHANGED;
  if (a.active !== b.active) return b.active ? FAILURE_CODES.AUTHORITY_VERSION_CHANGED : i2b1.FAILURE_CODES.EXECUTOR_INACTIVE;
  if (a.revoked !== b.revoked) return b.revoked ? i2b1.FAILURE_CODES.EXECUTOR_REVOKED : FAILURE_CODES.AUTHORITY_VERSION_CHANGED;
  if (canonical(authorityScope(a).allowedOperations) !== canonical(authorityScope(b).allowedOperations) ||
      canonical(authorityScope(a).allowedRealmIds) !== canonical(authorityScope(b).allowedRealmIds) ||
      canonical(authorityScope(a).allowedMissionIds) !== canonical(authorityScope(b).allowedMissionIds) ||
      canonical(authorityScope(a).allowedSubjectIds) !== canonical(authorityScope(b).allowedSubjectIds)) {
    return FAILURE_CODES.AUTHORITY_SCOPE_CHANGED;
  }
  if (a.executorId !== b.executorId || a.executorVersion !== b.executorVersion ||
      a.authorizationVersion !== b.authorizationVersion || a.issuerId !== b.issuerId) {
    return FAILURE_CODES.AUTHORITY_VERSION_CHANGED;
  }
  return null;
}

async function readAuthority(dependencies, request, context) {
  try {
    return await dependencies.authorityReader.readCurrentReservationAuthority(clone(request), clone(context));
  } catch (error) {
    const wrapped = new Error(error && error.message ? error.message : FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE);
    wrapped.code = (error && error.code) || FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE;
    throw wrapped;
  }
}

function validateServerTime(value) {
  if (!Number.isFinite(value)) fail(FAILURE_CODES.LIFECYCLE_TIME_INVALID, 'serverTime.now must return finite milliseconds');
  return value;
}

function expectedStatusFields(status) {
  return {
    executionId: status.executionId,
    state: status.state,
    statusVersion: status.statusVersion,
    fencingToken: status.fencingToken,
    leaseGeneration: status.leaseGeneration,
    leaseOwner: status.leaseOwner,
    terminal: status.terminal,
  };
}

function readDocumentSet(tx, artifacts) {
  return Promise.all([
    tx.get(artifacts.paths.reservation),
    tx.get(artifacts.paths.shell),
    tx.get(artifacts.paths.status),
  ]).then(([reservation, shell, status]) => ({
    reservation: unwrapSnapshot(reservation),
    shell: unwrapSnapshot(shell),
    status: unwrapSnapshot(status),
  }));
}

function identityDocumentsMatch(existing, artifacts, validation) {
  const { reservation, shell, status } = existing;
  if (!reservation || !shell || !status) return false;
  if (reservation.executionId !== artifacts.executionId || shell.executionId !== artifacts.executionId || status.executionId !== artifacts.executionId) return false;
  if (reservation.idempotencyKey !== artifacts.idempotencyKey || shell.idempotencyKey !== artifacts.idempotencyKey) return false;
  if (reservation.requestFingerprint !== artifacts.requestFingerprint || shell.requestFingerprint !== artifacts.requestFingerprint) return false;
  if (shell.executorId !== validation.registry.executorId || shell.executorVersion !== validation.registry.executorVersion) return false;
  if (reservation.executorId !== shell.executorId || reservation.executorVersion !== shell.executorVersion) return false;
  if (status.schemaVersion !== artifacts.documents.status.schemaVersion) return false;
  return true;
}

function assertTransactionUpdate(tx) {
  if (!tx || typeof tx.update !== 'function') {
    fail(FAILURE_CODES.LIFECYCLE_DEPENDENCY_INVALID, 'transaction.update is required for status-only lifecycle mutations');
  }
}

async function updateStatus(tx, artifacts, currentStatus, patch) {
  assertTransactionUpdate(tx);
  const allowed = new Set([
    'state', 'statusVersion', 'fencingToken', 'leaseGeneration', 'leaseOwner',
    'leaseAcquiredAt', 'leaseExpiresAt', 'renewedAt', 'updatedAt', 'terminal',
  ]);
  if (Object.keys(patch).some((key) => !allowed.has(key))) {
    fail(FAILURE_CODES.I2B2_UNSAFE_LIFECYCLE_FIELD, 'status patch contains an unsafe field');
  }
  const expected = expectedStatusFields(currentStatus);
  await tx.update(artifacts.paths.status, clone(patch), { expected });
  return { ...currentStatus, ...clone(patch) };
}

function validateOperationAuthority(request, preflightSnapshot, txSnapshot) {
  const changed = authorityChangeCode(preflightSnapshot, txSnapshot);
  if (changed) fail(changed, 'authority changed between preflight and transaction');
  const validation = coordinator.validateAuthoritySnapshot(request, txSnapshot);
  if (!validation.ok) fail(validation.code, 'lifecycle authority validation failed');
  return validation;
}

function assertLifecycleIdentity(existing, artifacts, validation) {
  if (!identityDocumentsMatch(existing, artifacts, validation)) {
    fail(FAILURE_CODES.I2B2_IDENTITY_MISMATCH, 'stored lifecycle identity is inconsistent');
  }
  if (existing.shell.authorizationVersion !== validation.registry.authorizationVersion ||
      existing.shell.issuerId !== validation.registry.issuerId ||
      existing.reservation.authorizationVersion !== validation.registry.authorizationVersion ||
      existing.reservation.issuerId !== validation.registry.issuerId) {
    fail(FAILURE_CODES.AUTHORITY_VERSION_CHANGED, 'stored authority identity is stale');
  }
  if (existing.shell.authorizationSnapshotId !== validation.executorCheck.authorization.snapshotId) {
    fail(FAILURE_CODES.AUTHORITY_VERSION_CHANGED, 'stored authorization snapshot is stale');
  }
}

function assertRequestLifecycleInput(input, operation) {
  const life = lifecycleInput(input);
  if (!validateExpectedVersion(life.expectedStatusVersion)) {
    fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, `${operation} requires expectedStatusVersion`);
  }
  if (operation !== 'claim') {
    if (!validateExpectedVersion(life.expectedFencingToken) || !validateExpectedVersion(life.expectedLeaseGeneration)) {
      fail(FAILURE_CODES.EXECUTION_FENCE_STALE, `${operation} requires expected fencing state`);
    }
  }
  return life;
}

function assertCurrentStatus(status, operation, life, context, now) {
  if (!status || status.terminal === true) fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, 'terminal or missing status');
  if (status.executionId === undefined) fail(FAILURE_CODES.I2B2_IDENTITY_MISMATCH, 'status execution identity missing');
  if (operation === 'claim') {
    if (status.statusVersion !== life.expectedStatusVersion) fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, 'claim status version is stale');
    if (status.state !== STATES.RESERVED || status.statusVersion !== 0 || status.fencingToken !== 0 ||
        status.leaseGeneration !== 0 || status.leaseOwner !== null) {
      fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, 'execution is not claimable');
    }
    return;
  }
  if (status.statusVersion !== life.expectedStatusVersion || status.fencingToken !== life.expectedFencingToken ||
      status.leaseGeneration !== life.expectedLeaseGeneration || status.state !== STATES.CLAIMED) {
    fail(FAILURE_CODES.EXECUTION_FENCE_STALE, 'worker fence is stale');
  }
  if (operation === 'renew' && status.leaseOwner !== context.workerInstanceId) {
    fail(FAILURE_CODES.EXECUTION_FENCE_STALE, 'worker owner is stale');
  }
  if (operation === 'takeover' && status.leaseOwner === context.workerInstanceId) {
    fail(FAILURE_CODES.EXECUTION_FENCE_STALE, 'takeover worker already owns lease');
  }
  if (life.expectedLeaseOwner !== undefined && life.expectedLeaseOwner !== status.leaseOwner) {
    fail(FAILURE_CODES.EXECUTION_FENCE_STALE, 'lease owner does not match worker');
  }
  if (operation === 'renew') {
    if (!Number.isFinite(status.leaseExpiresAt)) fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, 'lease expiry is missing');
    if (!(now < status.leaseExpiresAt - RENEWAL_GRACE_MS)) fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, 'renewal deadline has passed');
  }
  if (operation === 'takeover' && !(now >= status.leaseExpiresAt)) {
    fail(FAILURE_CODES.EXECUTION_STATUS_CONFLICT, 'lease has not expired');
  }
}

function knownErrorCode(code) {
  const known = new Set([
    ...Object.values(FAILURE_CODES),
    ...Object.values(i1.FAILURE_CODES),
    ...Object.values(i2b1.FAILURE_CODES),
  ]);
  return known.has(code) ? code : FAILURE_CODES.RESERVATION_TRANSACTION_FAILED;
}

async function runLifecycleOperation(operation, input, authenticatedServerContext, dependencies) {
  const life = (() => {
    try { return assertRequestLifecycleInput(input, operation); }
    catch (error) { return { error }; }
  })();
  if (life.error) return Object.freeze({ ok: false, code: life.error.code, committed: false });
  const request = life.request;
  if (!contextMatchesRequest(request, authenticatedServerContext)) {
    return Object.freeze({ ok: false, code: i2b1.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH, committed: false });
  }
  let deps;
  try { deps = createLifecycleDependencies(dependencies); }
  catch (error) { return Object.freeze({ ok: false, code: error.code, committed: false }); }

  let preflightSnapshot;
  try {
    preflightSnapshot = await readAuthority(deps, request, authenticatedServerContext);
    const preflight = coordinator.validateAuthoritySnapshot(request, preflightSnapshot);
    if (!preflight.ok) return Object.freeze({ ok: false, code: preflight.code, committed: false });
  } catch (error) {
    return Object.freeze({ ok: false, code: knownErrorCode(error.code), committed: false });
  }

  try {
    const result = await deps.transactionStore.runTransaction(async (tx) => {
      const txSnapshot = await readAuthority(deps, request, authenticatedServerContext);
      const validation = validateOperationAuthority(request, preflightSnapshot, txSnapshot);
      const artifacts = coordinator.buildArtifacts(request, validation.registry);
      const existing = await readDocumentSet(tx, artifacts);
      assertLifecycleIdentity(existing, artifacts, validation);
      const now = validateServerTime(await deps.serverTime.now());
      assertCurrentStatus(existing.status, operation, life, authenticatedServerContext, now);

      let patch;
      let outcome;
      if (operation === 'claim') {
        patch = {
          state: STATES.CLAIMED,
          statusVersion: existing.status.statusVersion + 1,
          fencingToken: existing.status.fencingToken + 1,
          leaseGeneration: existing.status.leaseGeneration + 1,
          leaseOwner: authenticatedServerContext.workerInstanceId,
          leaseAcquiredAt: now,
          leaseExpiresAt: now + LEASE_DURATION_MS,
          terminal: false,
          updatedAt: now,
        };
        outcome = OUTCOMES.CLAIMED;
      } else if (operation === 'renew') {
        patch = {
          statusVersion: existing.status.statusVersion + 1,
          leaseExpiresAt: now + LEASE_DURATION_MS,
          renewedAt: now,
          updatedAt: now,
        };
        outcome = OUTCOMES.RENEWED;
      } else {
        patch = {
          state: STATES.CLAIMED,
          statusVersion: existing.status.statusVersion + 1,
          fencingToken: existing.status.fencingToken + 1,
          leaseGeneration: existing.status.leaseGeneration + 1,
          leaseOwner: authenticatedServerContext.workerInstanceId,
          leaseAcquiredAt: now,
          leaseExpiresAt: now + LEASE_DURATION_MS,
          terminal: false,
          updatedAt: now,
        };
        outcome = OUTCOMES.TAKEN_OVER;
      }
      const nextStatus = await updateStatus(tx, artifacts, existing.status, patch);
      return Object.freeze({ ok: true, outcome, committed: true, executionId: artifacts.executionId, status: nextStatus });
    });
    return Object.freeze(result);
  } catch (error) {
    const code = error && error.code === 'CAS_CONFLICT' ? FAILURE_CODES.EXECUTION_STATUS_CONFLICT : knownErrorCode(error && error.code);
    return Object.freeze({ ok: false, code, committed: false });
  }
}

async function claimTeachingExecution(input, authenticatedServerContext, dependencies) {
  return runLifecycleOperation('claim', input, authenticatedServerContext, dependencies);
}

async function renewTeachingExecution(input, authenticatedServerContext, dependencies) {
  return runLifecycleOperation('renew', input, authenticatedServerContext, dependencies);
}

async function takeoverTeachingExecution(input, authenticatedServerContext, dependencies) {
  return runLifecycleOperation('takeover', input, authenticatedServerContext, dependencies);
}

module.exports = Object.freeze({
  LEASE_DURATION_MS,
  RENEWAL_INTERVAL_MS,
  RENEWAL_GRACE_MS,
  RENEWAL_DEADLINE_MS,
  STATES,
  OUTCOMES,
  FAILURE_CODES,
  createLifecycleDependencies,
  claimTeachingExecution,
  renewTeachingExecution,
  takeoverTeachingExecution,
});
