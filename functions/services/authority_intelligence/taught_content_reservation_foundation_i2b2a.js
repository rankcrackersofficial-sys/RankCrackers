'use strict';

// I2B2-A is pure. It defines the reservation identity and document contracts
// consumed by a future server-only persistence coordinator. It must not load
// Firebase, Firestore, network, filesystem, environment or clock authority.
const i2a = require('./taught_content_authority_i2a');
const i2b1 = require('./taught_content_executor_authorization_i2b1');
const i1 = i2a.I1;

const SCHEMA_VERSIONS = Object.freeze({
  identity: 'i2b2-reservation-identity-v1',
  shell: 'i2b2-teaching-execution-shell-v1',
  status: 'i2b2-teaching-execution-status-v1',
  reservation: 'i2b2-idempotency-reservation-v1',
  serverTimePlaceholder: 'I2B2_SERVER_TIME_REQUIRED',
});

const STATES = Object.freeze({ RESERVED: 'RESERVED' });
const RESERVE_OPERATION = i2b1.RESERVE_OPERATION;

const FAILURE_CODES = Object.freeze({
  ...i2b1.FAILURE_CODES,
  EXECUTION_IDEMPOTENCY_CONFLICT: 'EXECUTION_IDEMPOTENCY_CONFLICT',
  EXECUTION_RESERVATION_CONFLICT: 'EXECUTION_RESERVATION_CONFLICT',
  AUTHORITY_SCOPE_CHANGED: 'AUTHORITY_SCOPE_CHANGED',
  AUTHORITY_VERSION_CHANGED: 'AUTHORITY_VERSION_CHANGED',
  EXECUTION_STATUS_CONFLICT: 'EXECUTION_STATUS_CONFLICT',
  I2B2_FIELD_MISSING: 'I2B2_FIELD_MISSING',
  I2B2_IDENTITY_MISMATCH: 'I2B2_IDENTITY_MISMATCH',
  I2B2_REQUEST_FINGERPRINT_MISMATCH: 'I2B2_REQUEST_FINGERPRINT_MISMATCH',
  I2B2_IDEMPOTENCY_KEY_MISMATCH: 'I2B2_IDEMPOTENCY_KEY_MISMATCH',
  I2B2_REGISTRY_REFERENCE_INVALID: 'I2B2_REGISTRY_REFERENCE_INVALID',
  I2B2_AUTHORITY_SNAPSHOT_MISMATCH: 'I2B2_AUTHORITY_SNAPSHOT_MISMATCH',
  I2B2_UNSAFE_LIFECYCLE_FIELD: 'I2B2_UNSAFE_LIFECYCLE_FIELD',
});

const MUTABLE_LIFECYCLE_FIELDS = Object.freeze([
  'currentOwner', 'leaseOwner', 'leaseExpiry', 'expiresAt', 'statusVersion',
  'fencingToken', 'leaseGeneration', 'retryState', 'terminal', 'failureCode',
]);

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(code, message) {
  const error = new Error(`${code}: ${message || code}`);
  error.code = code;
  throw error;
}

function requireString(value, field, code) {
  if (!requiredString(value)) fail(code || FAILURE_CODES.I2B2_FIELD_MISSING, `${field} is required`);
  return value.trim();
}

function serverTimePlaceholder(field) {
  return Object.freeze({
    kind: SCHEMA_VERSIONS.serverTimePlaceholder,
    field: requireString(field, 'field'),
    authority: 'I2B2-B_SERVER_TRANSACTION',
  });
}

function safeSegment(value, field) {
  const segment = requireString(value, field);
  if (segment === '.' || segment === '..' || /[\\/\u0000-\u001f\u007f]/.test(segment)) {
    fail(i2a.FAILURE_CODES.I2A_UNSAFE_PATH_SEGMENT, `${field} contains an unsafe path segment`);
  }
  return segment;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function clone(value) {
  if (Array.isArray(value)) return value.map(clone);
  if (isObject(value)) return Object.keys(value).reduce((out, key) => {
    out[key] = clone(value[key]);
    return out;
  }, {});
  return value;
}

function identityInput(input) {
  const value = input || {};
  const identity = i2a.assertMissionRealmIdentity(value.missionIdentity || value.identity);
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.identity,
    missionIdentity: identity,
    realmId: requireString(value.realmId === undefined ? identity.realmId : value.realmId, 'realmId'),
    missionId: requireString(value.missionId === undefined ? identity.missionId : value.missionId, 'missionId'),
    subjectId: requireString(value.subjectId, 'subjectId'),
    syllabusAtomId: requireString(value.syllabusAtomId, 'syllabusAtomId'),
    syllabusVersion: requireString(value.syllabusVersion, 'syllabusVersion'),
    syllabusCanonicalKey: requireString(value.syllabusCanonicalKey, 'syllabusCanonicalKey'),
    materialId: requireString(value.materialId, 'materialId'),
    materialVersion: requireString(value.materialVersion, 'materialVersion'),
    materialHash: requireString(value.materialHash, 'materialHash').toLowerCase(),
    teacherAuthorityId: requireString(value.teacherAuthorityId, 'teacherAuthorityId'),
    teacherAuthorityVersion: requireString(value.teacherAuthorityVersion, 'teacherAuthorityVersion'),
    pedagogyId: requireString(value.pedagogyId, 'pedagogyId'),
    pedagogyVersion: requireString(value.pedagogyVersion, 'pedagogyVersion'),
    pedagogyHash: requireString(value.pedagogyHash, 'pedagogyHash'),
    executorId: requireString(value.executorId, 'executorId'),
    executorVersion: requireString(value.executorVersion, 'executorVersion'),
  });
}

function createExecutorRegistryReference(input) {
  const value = input || {};
  const executorId = safeSegment(value.executorId, 'executorId');
  const executorVersion = requireString(value.executorVersion, 'executorVersion');
  const authorizationVersion = requireString(value.authorizationVersion, 'authorizationVersion');
  const issuerId = safeSegment(value.issuerId || value.issuer, 'issuerId');
  const principalType = requireString(value.principalType || i2b1.PRINCIPAL_TYPE, 'principalType');
  const active = value.active;
  const revoked = value.revoked;
  if (typeof active !== 'boolean' || typeof revoked !== 'boolean') {
    fail(FAILURE_CODES.I2B2_REGISTRY_REFERENCE_INVALID, 'active and revoked must be boolean');
  }
  const allowedOperations = Array.isArray(value.allowedOperations) ? value.allowedOperations.slice() : value.allowedOperations;
  const allowedRealmIds = Array.isArray(value.allowedRealmIds) ? value.allowedRealmIds.slice() : value.allowedRealmIds;
  const allowedMissionIds = Array.isArray(value.allowedMissionIds) ? value.allowedMissionIds.slice() : value.allowedMissionIds;
  const allowedSubjectIds = Array.isArray(value.allowedSubjectIds) ? value.allowedSubjectIds.slice() : value.allowedSubjectIds;
  const authority = i2b1.createExecutorAuthority({
    executorId, executorVersion, authorizationVersion, issuer: issuerId,
    principalType, active, revoked, allowedOperations, allowedRealmIds,
    allowedMissionIds, allowedSubjectIds,
  });
  const registryPath = `governed_server_executors/${executorId}/versions/${authorizationVersion}`;
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.identity,
    executorId,
    executorVersion,
    authorizationVersion,
    issuerId,
    principalType,
    active,
    revoked,
    allowedOperations: authority.allowedOperations,
    allowedRealmIds: authority.allowedRealmIds,
    allowedMissionIds: authority.allowedMissionIds,
    allowedSubjectIds: authority.allowedSubjectIds,
    registryPath,
    authoritySnapshotReference: Object.freeze({
      executorId, executorVersion, authorizationVersion, issuerId, registryPath,
    }),
  });
}

function createRegistryReaderContract(reader) {
  if (!reader || typeof reader.getCurrentExecutorAuthorization !== 'function') {
    fail(FAILURE_CODES.I2B2_REGISTRY_REFERENCE_INVALID, 'reader must provide getCurrentExecutorAuthorization');
  }
  return Object.freeze({
    getCurrentExecutorAuthorization: (request) => reader.getCurrentExecutorAuthorization(clone(request)),
    authoritySource: 'INJECTED_SERVER_REGISTRY',
    persistence: 'UNRESOLVED_TO_I2B2-B',
  });
}

function buildAuthorizationRequest(identity) {
  return {
    operation: identity.requestedAction,
    realmId: identity.realmId,
    missionId: identity.missionId,
    subjectId: identity.subjectId,
    missionIdentity: identity.missionIdentity,
    requesterRole: null,
  };
}

function deriveIdentity(input) {
  const identity = identityInput(input);
  if (identity.realmId !== identity.missionIdentity.realmId || identity.missionId !== identity.missionIdentity.missionId) {
    fail(FAILURE_CODES.CROSS_SCOPE_REFERENCE, 'realm and mission must match mission identity');
  }
  return identity;
}

function deriveExecutionId(input) {
  const identity = deriveIdentity(input);
  return i2a.deterministicExecutionId({ identity: identity.missionIdentity, ...identity });
}

function deriveRequestFingerprint(input, registry) {
  const identity = deriveIdentity(input);
  const authority = registry || createExecutorRegistryReference(input.executorRegistry || input);
  const executionId = input.executionId || i2a.deterministicExecutionId({ identity: identity.missionIdentity, ...identity });
  return i1.sha256({
    schemaVersion: 'i2b2-reservation-request-v1',
    executionId,
    identity,
    requestedAction: requireString(input.requestedAction, 'requestedAction'),
    authorizationSnapshotId: input.authorizationSnapshotId || null,
    authorizationVersion: authority.authorizationVersion,
    issuerId: authority.issuerId,
  });
}

function deriveIdempotencyKey(input, registry) {
  const identity = deriveIdentity(input);
  const executionId = input.executionId || i2a.deterministicExecutionId({ identity: identity.missionIdentity, ...identity });
  const requestFingerprint = input.requestFingerprint || deriveRequestFingerprint(input, registry);
  return i1.identity('i2b_reservation', {
    schemaVersion: 'i2b2-idempotency-key-v1',
    realmId: identity.realmId,
    executionId,
    requestFingerprint,
  });
}

function validateReservationRequest(input, registryInput) {
  const value = input || {};
  let identity;
  let registry;
  try {
    identity = deriveIdentity(value);
    registry = registryInput || createExecutorRegistryReference(value.executorRegistry || value);
    if (identity.executorId !== registry.executorId || identity.executorVersion !== registry.executorVersion) {
      return { ok: false, code: FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH };
    }
    const requestedAction = requireString(value.requestedAction, 'requestedAction');
    const authorization = i2b1.authorizeExecutor({
      request: buildAuthorizationRequest({ ...identity, requestedAction }),
      executorContext: { executorId: identity.executorId, executorVersion: identity.executorVersion },
      executorAuthority: {
        executorId: registry.executorId,
        executorVersion: registry.executorVersion,
        principalType: registry.principalType,
        authorizationVersion: registry.authorizationVersion,
        issuer: registry.issuerId,
        active: registry.active,
        revoked: registry.revoked,
        allowedOperations: registry.allowedOperations,
        allowedRealmIds: registry.allowedRealmIds,
        allowedMissionIds: registry.allowedMissionIds,
        allowedSubjectIds: registry.allowedSubjectIds,
      },
    });
    if (!authorization.authorized) return { ok: false, code: authorization.failureCode };
    if (value.issuerId !== undefined && value.issuerId !== registry.issuerId) {
      return { ok: false, code: FAILURE_CODES.AUTHORITY_VERSION_CHANGED };
    }
    if (value.authorizationVersion !== undefined && value.authorizationVersion !== registry.authorizationVersion) {
      return { ok: false, code: FAILURE_CODES.AUTHORITY_VERSION_CHANGED };
    }
    const expectedExecutionId = i2a.deterministicExecutionId({ identity: identity.missionIdentity, ...identity });
    if (value.executionId !== undefined && value.executionId !== expectedExecutionId) {
      return { ok: false, code: FAILURE_CODES.I2B2_IDENTITY_MISMATCH };
    }
    const executionId = expectedExecutionId;
    const expectedFingerprint = deriveRequestFingerprint({ ...value, executionId }, registry);
    if (value.requestFingerprint !== undefined && value.requestFingerprint !== expectedFingerprint) {
      return { ok: false, code: FAILURE_CODES.I2B2_REQUEST_FINGERPRINT_MISMATCH };
    }
    const expectedKey = deriveIdempotencyKey({ ...value, executionId, requestFingerprint: expectedFingerprint }, registry);
    if (value.idempotencyKey !== undefined && value.idempotencyKey !== expectedKey) {
      return { ok: false, code: FAILURE_CODES.I2B2_IDEMPOTENCY_KEY_MISMATCH };
    }
    if (value.authorizationSnapshotId !== undefined && value.authorizationSnapshotId !== authorization.snapshotId) {
      return { ok: false, code: FAILURE_CODES.I2B2_AUTHORITY_SNAPSHOT_MISMATCH };
    }
    return Object.freeze({
      ok: true,
      identity,
      registry,
      authorization,
      executionId,
      requestFingerprint: expectedFingerprint,
      idempotencyKey: expectedKey,
      requestedAction,
    });
  } catch (error) {
    return { ok: false, code: error.code || FAILURE_CODES.I2B2_FIELD_MISSING };
  }
}

function validatedOrThrow(input, registry) {
  const result = validateReservationRequest(input, registry);
  if (!result.ok) fail(result.code, 'reservation request rejected');
  return result;
}

function buildExecutionShell(input, registry) {
  const checked = validatedOrThrow(input, registry);
  const identity = checked.identity;
  const path = i2a.buildTeachingExecutionPath({ identity: identity.missionIdentity, realmId: identity.realmId, executionId: checked.executionId });
  const reservationRef = i2a.buildIdempotencyPath({ identity: identity.missionIdentity, realmId: identity.realmId, idempotencyKey: checked.idempotencyKey });
  const document = Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.shell,
    executionId: checked.executionId,
    idempotencyKey: checked.idempotencyKey,
    requestFingerprint: checked.requestFingerprint,
    missionRealmIdentity: identity.missionIdentity,
    realmId: identity.realmId,
    missionId: identity.missionId,
    subjectId: identity.subjectId,
    syllabusAtomId: identity.syllabusAtomId,
    syllabusVersion: identity.syllabusVersion,
    syllabusCanonicalKey: identity.syllabusCanonicalKey,
    materialId: identity.materialId,
    materialVersion: identity.materialVersion,
    materialHash: identity.materialHash,
    teacherAuthorityId: identity.teacherAuthorityId,
    teacherAuthorityVersion: identity.teacherAuthorityVersion,
    pedagogyId: identity.pedagogyId,
    pedagogyVersion: identity.pedagogyVersion,
    pedagogyHash: identity.pedagogyHash,
    executorId: identity.executorId,
    executorVersion: identity.executorVersion,
    authorizationSnapshotId: checked.authorization.snapshotId,
    authorizationVersion: checked.registry.authorizationVersion,
    issuerId: checked.registry.issuerId,
    requestedAction: checked.requestedAction,
    createdAt: serverTimePlaceholder('createdAt'),
    reservationRef,
  });
  if (Object.keys(document).some((key) => MUTABLE_LIFECYCLE_FIELDS.includes(key))) {
    fail(FAILURE_CODES.I2B2_UNSAFE_LIFECYCLE_FIELD, 'immutable shell contains mutable lifecycle field');
  }
  return Object.freeze({ path, document });
}

function buildReservedStatus(input, registry) {
  const checked = validatedOrThrow(input, registry);
  const path = i2a.buildExecutionStatusPath({ identity: checked.identity.missionIdentity, realmId: checked.identity.realmId, executionId: checked.executionId });
  const document = Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.status,
    executionId: checked.executionId,
    state: STATES.RESERVED,
    statusVersion: 0,
    fencingToken: 0,
    leaseGeneration: 0,
    leaseOwner: null,
    terminal: false,
    updatedAt: serverTimePlaceholder('updatedAt'),
  });
  return Object.freeze({ path, document });
}

function buildIdempotencyReservation(input, registry) {
  const checked = validatedOrThrow(input, registry);
  const identity = checked.identity;
  const path = i2a.buildIdempotencyPath({ identity: identity.missionIdentity, realmId: identity.realmId, idempotencyKey: checked.idempotencyKey });
  const document = Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.reservation,
    idempotencyKey: checked.idempotencyKey,
    requestFingerprint: checked.requestFingerprint,
    executionId: checked.executionId,
    missionRealmIdentity: identity.missionIdentity,
    realmId: identity.realmId,
    missionId: identity.missionId,
    subjectId: identity.subjectId,
    executorId: identity.executorId,
    executorVersion: identity.executorVersion,
    authorizationSnapshotId: checked.authorization.snapshotId,
    authorizationVersion: checked.registry.authorizationVersion,
    issuerId: checked.registry.issuerId,
    requestedAction: checked.requestedAction,
    status: STATES.RESERVED,
  });
  return Object.freeze({ path, document });
}

function classifyReplay(input, existing) {
  const checked = validateReservationRequest(input, input && input.executorRegistry);
  if (!checked.ok) return Object.freeze({ outcome: checked.code });
  if (!existing) return Object.freeze({ outcome: 'NEW_RESERVATION', checked });
  const sameKey = existing.idempotencyKey === checked.idempotencyKey;
  const sameFingerprint = existing.requestFingerprint === checked.requestFingerprint;
  const sameExecution = existing.executionId === checked.executionId;
  if (sameKey && sameFingerprint && sameExecution) return Object.freeze({ outcome: 'SAFE_IDEMPOTENT_REPLAY', checked });
  if (sameKey && (!sameFingerprint || !sameExecution)) return Object.freeze({ outcome: FAILURE_CODES.EXECUTION_IDEMPOTENCY_CONFLICT, checked });
  if (sameExecution || existing.realmId === checked.identity.realmId && existing.missionId !== checked.identity.missionId) {
    return Object.freeze({ outcome: FAILURE_CODES.EXECUTION_RESERVATION_CONFLICT, checked });
  }
  return Object.freeze({ outcome: 'NEW_RESERVATION', checked });
}

module.exports = Object.freeze({
  SCHEMA_VERSIONS,
  STATES,
  RESERVE_OPERATION,
  FAILURE_CODES,
  MUTABLE_LIFECYCLE_FIELDS,
  serverTimePlaceholder,
  createExecutorRegistryReference,
  createRegistryReaderContract,
  deriveIdentity,
  deriveExecutionId,
  deriveRequestFingerprint,
  deriveIdempotencyKey,
  validateReservationRequest,
  buildExecutionShell,
  buildReservedStatus,
  buildIdempotencyReservation,
  classifyReplay,
});
