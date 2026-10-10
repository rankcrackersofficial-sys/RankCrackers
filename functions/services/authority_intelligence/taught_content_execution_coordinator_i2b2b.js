'use strict';

// I2B2-B owns only server-side reservation. Persistence is injected so this
// module remains offline-testable and cannot initialize Firebase on import.
const i1 = require('./taught_content_authority_i1');
const i2a = require('./taught_content_authority_i2a');
const i2b1 = require('./taught_content_executor_authorization_i2b1');
const i2b2a = require('./taught_content_reservation_foundation_i2b2a');

const FAILURE_CODES = Object.freeze({
  ...i2b2a.FAILURE_CODES,
  RESERVATION_TRANSACTION_FAILED: 'RESERVATION_TRANSACTION_FAILED',
  RESERVATION_DEPENDENCY_INVALID: 'RESERVATION_DEPENDENCY_INVALID',
  RESERVATION_AUTHORITY_UNAVAILABLE: 'RESERVATION_AUTHORITY_UNAVAILABLE',
});

const OUTCOMES = Object.freeze({
  NEW_RESERVATION: 'NEW_RESERVATION',
  SAFE_IDEMPOTENT_REPLAY: 'SAFE_IDEMPOTENT_REPLAY',
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
  if (value && typeof value === 'object') return Object.keys(value).reduce((out, key) => {
    out[key] = clone(value[key]);
    return out;
  }, {});
  return value;
}

function createTransactionStoreContract(store) {
  if (!store || typeof store.runTransaction !== 'function') {
    fail(FAILURE_CODES.RESERVATION_DEPENDENCY_INVALID, 'runTransaction is required');
  }
  return Object.freeze({
    runTransaction: (callback) => store.runTransaction(callback),
    contract: 'I2B2B_CREATE_ONLY_TRANSACTION_V1',
  });
}

function createAuthorityReaderContract(reader) {
  if (!reader || typeof reader.readCurrentReservationAuthority !== 'function') {
    fail(FAILURE_CODES.RESERVATION_DEPENDENCY_INVALID, 'readCurrentReservationAuthority is required');
  }
  return Object.freeze({
    readCurrentReservationAuthority: (request, context) => reader.readCurrentReservationAuthority(clone(request), clone(context)),
    contract: 'I2B2B_SERVER_AUTHORITY_READER_V1',
  });
}

function serverOnlyContext(context) {
  return Boolean(context && context.serverOnly === true && context.principalType === i2b1.PRINCIPAL_TYPE);
}

function requestWithRegistry(request, registry) {
  return { ...(request || {}), executorRegistry: registry };
}

function identityEqual(a, b) {
  return i1.canonicalJson(a) === i1.canonicalJson(b);
}

function authorityScopeEqual(a, b) {
  if (!a || !b) return false;
  return identityEqual({
    executorId: a.executorId,
    executorVersion: a.executorVersion,
    authorizationVersion: a.authorizationVersion,
    issuerId: a.issuerId,
    active: a.active,
    revoked: a.revoked,
    allowedOperations: a.allowedOperations,
    allowedRealmIds: a.allowedRealmIds,
    allowedMissionIds: a.allowedMissionIds,
    allowedSubjectIds: a.allowedSubjectIds,
  }, {
    executorId: b.executorId,
    executorVersion: b.executorVersion,
    authorizationVersion: b.authorizationVersion,
    issuerId: b.issuerId,
    active: b.active,
    revoked: b.revoked,
    allowedOperations: b.allowedOperations,
    allowedRealmIds: b.allowedRealmIds,
    allowedMissionIds: b.allowedMissionIds,
    allowedSubjectIds: b.allowedSubjectIds,
  });
}

function authorityChangeCode(before, after) {
  if (!before || !after || !before.executorRegistry || !after.executorRegistry) {
    return FAILURE_CODES.AUTHORITY_VERSION_CHANGED;
  }
  const a = before.executorRegistry;
  const b = after.executorRegistry;
  if (a.active !== b.active) return b.active ? FAILURE_CODES.AUTHORITY_VERSION_CHANGED : i2b1.FAILURE_CODES.EXECUTOR_INACTIVE;
  if (a.revoked !== b.revoked) return b.revoked ? i2b1.FAILURE_CODES.EXECUTOR_REVOKED : FAILURE_CODES.AUTHORITY_VERSION_CHANGED;
  if (a.allowedOperations.join('|') !== b.allowedOperations.join('|') ||
      a.allowedRealmIds.join('|') !== b.allowedRealmIds.join('|') ||
      a.allowedMissionIds.join('|') !== b.allowedMissionIds.join('|') ||
      a.allowedSubjectIds.join('|') !== b.allowedSubjectIds.join('|')) {
    return FAILURE_CODES.AUTHORITY_SCOPE_CHANGED;
  }
  if (a.executorId !== b.executorId || a.executorVersion !== b.executorVersion ||
      a.authorizationVersion !== b.authorizationVersion || a.issuerId !== b.issuerId) {
    return FAILURE_CODES.AUTHORITY_VERSION_CHANGED;
  }
  return null;
}

function domainFailure(code) {
  return { ok: false, code };
}

function validateDomainAuthority(request, snapshot) {
  if (!snapshot || !snapshot.mission || !snapshot.atom || !snapshot.material ||
      !snapshot.teacher || !snapshot.pedagogy) return domainFailure(FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE);
  if (snapshot.mission.active !== true) return domainFailure(i1.FAILURE_CODES.MISSION_INACTIVE);
  try {
    const currentIdentity = i2a.assertMissionRealmIdentity(snapshot.mission.identity || snapshot.mission.missionIdentity);
    if (!identityEqual(currentIdentity, request.missionIdentity)) return domainFailure(i1.FAILURE_CODES.CROSS_SCOPE_REFERENCE);
  } catch (error) {
    return domainFailure(error.code || i1.FAILURE_CODES.CROSS_SCOPE_REFERENCE);
  }
  if (snapshot.atom.verified !== true || snapshot.atom.syllabusAtomId !== request.syllabusAtomId ||
      snapshot.atom.syllabusVersion !== request.syllabusVersion) return domainFailure(i1.FAILURE_CODES.ATOM_NOT_VERIFIED);
  const materialCheck = i1.compareMaterialVersion({
    materialId: request.materialId, version: request.materialVersion, contentHash: request.materialHash,
  }, {
    materialId: snapshot.material.materialId,
    version: snapshot.material.version,
    contentHash: snapshot.material.contentHash,
  });
  if (!materialCheck.ok) return materialCheck;
  const teacher = snapshot.teacher;
  const teacherCheck = i1.validateTeacherAuthority(teacher, {
    missionId: request.missionId, subjectId: request.subjectId,
  });
  if (!teacherCheck.ok || teacher.authorityId !== request.teacherAuthorityId || teacher.version !== request.teacherAuthorityVersion) {
    return domainFailure(i1.FAILURE_CODES.TEACHER_AUTHORITY_INVALID);
  }
  const pedagogy = snapshot.pedagogy;
  const pedagogyCheck = i1.validatePedagogyAuthority(pedagogy, {
    subjectId: request.subjectId, teacherAuthorityId: teacher.authorityId,
  });
  if (!pedagogyCheck.ok || pedagogy.pedagogyId !== request.pedagogyId ||
      pedagogy.version !== request.pedagogyVersion || pedagogy.pedagogyHash !== request.pedagogyHash) {
    return domainFailure(i1.FAILURE_CODES.PEDAGOGY_AUTHORITY_INVALID);
  }
  return { ok: true };
}

function validateAuthoritySnapshot(request, snapshot) {
  try {
    if (!snapshot || !snapshot.executorRegistry) return domainFailure(FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE);
    const registry = i2b2a.createExecutorRegistryReference(snapshot.executorRegistry);
    const canonicalRequest = requestWithRegistry(request, registry);
    const executorCheck = i2b2a.validateReservationRequest(canonicalRequest, registry);
    if (!executorCheck.ok) {
      if (executorCheck.code === i2b2a.FAILURE_CODES.I2B2_REQUEST_FINGERPRINT_MISMATCH ||
          executorCheck.code === i2b2a.FAILURE_CODES.I2B2_IDEMPOTENCY_KEY_MISMATCH) {
        return domainFailure(FAILURE_CODES.EXECUTION_IDEMPOTENCY_CONFLICT);
      }
      return executorCheck;
    }
    const domainCheck = validateDomainAuthority(request, snapshot);
    if (!domainCheck.ok) return domainCheck;
    return { ok: true, registry, canonicalRequest, executorCheck };
  } catch (error) {
    return domainFailure(error.code || FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE);
  }
}

function buildArtifacts(request, registry) {
  const canonicalRequest = requestWithRegistry(request, registry);
  const reservation = i2b2a.buildIdempotencyReservation(canonicalRequest, registry);
  const shell = i2b2a.buildExecutionShell(canonicalRequest, registry);
  const status = i2b2a.buildReservedStatus(canonicalRequest, registry);
  return Object.freeze({
    paths: Object.freeze({ reservation: reservation.path, shell: shell.path, status: status.path }),
    documents: Object.freeze({ reservation: reservation.document, shell: shell.document, status: status.document }),
    executionId: shell.document.executionId,
    idempotencyKey: reservation.document.idempotencyKey,
    requestFingerprint: reservation.document.requestFingerprint,
  });
}

function immutableReservationIdentity(document) {
  if (!document) return null;
  return {
    schemaVersion: document.schemaVersion,
    idempotencyKey: document.idempotencyKey,
    requestFingerprint: document.requestFingerprint,
    executionId: document.executionId,
    missionRealmIdentity: document.missionRealmIdentity,
    realmId: document.realmId,
    missionId: document.missionId,
    subjectId: document.subjectId,
    executorId: document.executorId,
    executorVersion: document.executorVersion,
    authorizationSnapshotId: document.authorizationSnapshotId,
    authorizationVersion: document.authorizationVersion,
    issuerId: document.issuerId,
    requestedAction: document.requestedAction,
    status: document.status,
  };
}

function immutableShellIdentity(document) {
  if (!document) return null;
  const copy = { ...document };
  delete copy.createdAt;
  return copy;
}

function reservedStatusIdentity(document) {
  if (!document) return null;
  const copy = { ...document };
  delete copy.updatedAt;
  return copy;
}

function existingMatches(existing, artifacts) {
  return identityEqual(immutableReservationIdentity(existing.reservation), immutableReservationIdentity(artifacts.documents.reservation)) &&
    identityEqual(immutableShellIdentity(existing.shell), immutableShellIdentity(artifacts.documents.shell)) &&
    identityEqual(reservedStatusIdentity(existing.status), reservedStatusIdentity(artifacts.documents.status));
}

function partialStateCode(existing, artifacts) {
  if (existing.reservation && (existing.reservation.executionId !== artifacts.executionId ||
      existing.reservation.idempotencyKey !== artifacts.idempotencyKey)) {
    return FAILURE_CODES.EXECUTION_RESERVATION_CONFLICT;
  }
  if (existing.shell && existing.shell.executionId !== artifacts.executionId) return FAILURE_CODES.EXECUTION_RESERVATION_CONFLICT;
  if (existing.status && existing.status.executionId !== artifacts.executionId) return FAILURE_CODES.EXECUTION_STATUS_CONFLICT;
  return FAILURE_CODES.EXECUTION_STATUS_CONFLICT;
}

async function readAuthority(reader, request, context) {
  try {
    const snapshot = await reader.readCurrentReservationAuthority(request, context);
    return snapshot;
  } catch (error) {
    const wrapped = new Error(error.message || FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE);
    wrapped.code = error.code || FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE;
    throw wrapped;
  }
}

async function reserveTeachingExecution(request, authenticatedServerContext, dependencies) {
  if (!serverOnlyContext(authenticatedServerContext)) {
    return Object.freeze({ ok: false, code: i2b1.FAILURE_CODES.EXECUTOR_OPERATION_DENIED, committed: false });
  }
  if (!request || authenticatedServerContext.executorId !== request.executorId ||
      authenticatedServerContext.executorVersion !== request.executorVersion) {
    return Object.freeze({ ok: false, code: i2b1.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH, committed: false });
  }
  let store;
  let authorityReader;
  try {
    store = createTransactionStoreContract(dependencies && dependencies.transactionStore);
    authorityReader = createAuthorityReaderContract(dependencies && dependencies.authorityReader);
  } catch (error) {
    return Object.freeze({ ok: false, code: error.code || FAILURE_CODES.RESERVATION_DEPENDENCY_INVALID, committed: false });
  }
  let preflightSnapshot;
  let preflight;
  try {
    preflightSnapshot = await readAuthority(authorityReader, request, authenticatedServerContext);
    preflight = validateAuthoritySnapshot(request, preflightSnapshot);
  } catch (error) {
    return Object.freeze({ ok: false, code: error.code || FAILURE_CODES.RESERVATION_AUTHORITY_UNAVAILABLE, committed: false });
  }
  if (!preflight.ok) return Object.freeze({ ok: false, code: preflight.code, committed: false });
  try {
    const result = await store.runTransaction(async (tx) => {
      const txSnapshot = await readAuthority(authorityReader, request, authenticatedServerContext);
      const changed = authorityChangeCode(preflightSnapshot, txSnapshot);
      if (changed) fail(changed, 'authority changed between preflight and transaction');
      const txValidation = validateAuthoritySnapshot(request, txSnapshot);
      if (!txValidation.ok) fail(txValidation.code, 'transaction authority validation failed');
      const artifacts = buildArtifacts(request, txValidation.registry);
      const existing = {
        reservation: await tx.get(artifacts.paths.reservation),
        shell: await tx.get(artifacts.paths.shell),
        status: await tx.get(artifacts.paths.status),
      };
      const present = [existing.reservation, existing.shell, existing.status].filter(Boolean).length;
      if (present === 3) {
        if (!existingMatches(existing, artifacts)) {
          fail(existing.reservation && existing.reservation.idempotencyKey === artifacts.idempotencyKey
            ? FAILURE_CODES.EXECUTION_IDEMPOTENCY_CONFLICT : FAILURE_CODES.EXECUTION_RESERVATION_CONFLICT,
            'existing authoritative identity conflicts');
        }
        return Object.freeze({ ok: true, outcome: OUTCOMES.SAFE_IDEMPOTENT_REPLAY, committed: false, artifacts, existing });
      }
      if (present !== 0) fail(partialStateCode(existing, artifacts), 'partial reservation state is not repairable');
      await tx.create(artifacts.paths.reservation, artifacts.documents.reservation);
      await tx.create(artifacts.paths.shell, artifacts.documents.shell);
      await tx.create(artifacts.paths.status, artifacts.documents.status);
      return Object.freeze({ ok: true, outcome: OUTCOMES.NEW_RESERVATION, committed: true, artifacts });
    });
    return Object.freeze(result);
  } catch (error) {
    const knownCodes = new Set([
      ...Object.values(FAILURE_CODES),
      ...Object.values(i1.FAILURE_CODES),
      ...Object.values(i2b1.FAILURE_CODES),
    ]);
    const code = knownCodes.has(error.code) ? error.code : FAILURE_CODES.RESERVATION_TRANSACTION_FAILED;
    return Object.freeze({ ok: false, code, committed: false });
  }
}

module.exports = Object.freeze({
  FAILURE_CODES,
  OUTCOMES,
  createTransactionStoreContract,
  createAuthorityReaderContract,
  validateDomainAuthority,
  validateAuthoritySnapshot,
  buildArtifacts,
  reserveTeachingExecution,
});
