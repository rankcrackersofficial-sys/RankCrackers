'use strict';

// I2A is intentionally pure. It defines schema, identity, path and structural
// contracts only. It must not initialize Firebase or perform persistence.
const i1 = require('./taught_content_authority_i1');

const SCHEMA_VERSIONS = Object.freeze({
  missionIdentity: 'i2a-mission-identity-v1',
  teachingExecution: 'i2a-teaching-execution-v1',
  executionStatus: 'i2a-execution-status-v1',
  executionEvidence: 'i2a-execution-evidence-v1',
  taughtAuthorityProjection: 'i2a-taught-authority-projection-v1',
  idempotencyReservation: 'i2a-idempotency-reservation-v1',
  executionEvent: 'i2a-execution-event-v1',
});

const FAILURE_CODES = Object.freeze({
  ...i1.FAILURE_CODES,
  I2A_SCHEMA_VERSION_UNSUPPORTED: 'I2A_SCHEMA_VERSION_UNSUPPORTED',
  I2A_FIELD_MISSING: 'I2A_FIELD_MISSING',
  I2A_MISSION_REALM_IDENTITY_INVALID: 'I2A_MISSION_REALM_IDENTITY_INVALID',
  I2A_PARENT_REALM_MISMATCH: 'I2A_PARENT_REALM_MISMATCH',
  I2A_UNSAFE_PATH_SEGMENT: 'I2A_UNSAFE_PATH_SEGMENT',
  I2A_IDENTITY_MISMATCH: 'I2A_IDENTITY_MISMATCH',
  I2A_RETENTION_CLASS_INVALID: 'I2A_RETENTION_CLASS_INVALID',
  I2A_EVIDENCE_BINDING_INVALID: 'I2A_EVIDENCE_BINDING_INVALID',
  I2A_REQUEST_FINGERPRINT_MISMATCH: 'I2A_REQUEST_FINGERPRINT_MISMATCH',
  I2A_STUDENT_STATE_FORBIDDEN: 'I2A_STUDENT_STATE_FORBIDDEN',
});

const EVENT_TYPES = Object.freeze(new Set([
  'VALIDATION',
  'INVALIDATION',
  'SUPERSESSION',
  'EXECUTION_SEALED',
]));

const SUPPORTED_SCHEMA_VALUES = Object.freeze(new Set(Object.values(SCHEMA_VERSIONS)));

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(code, message) {
  const error = new Error(`${code}: ${message || code}`);
  error.code = code;
  throw error;
}

function requireString(value, field) {
  if (!requiredString(value)) fail(FAILURE_CODES.I2A_FIELD_MISSING, `${field} is required`);
  return value.trim();
}

function requireSchema(value, kind) {
  const expected = SCHEMA_VERSIONS[kind];
  if (value !== expected || !SUPPORTED_SCHEMA_VALUES.has(value)) {
    fail(FAILURE_CODES.I2A_SCHEMA_VERSION_UNSUPPORTED, `${kind} must use ${expected}`);
  }
}

function assertSafeSegment(value, field) {
  const segment = requireString(value, field);
  if (segment === '.' || segment === '..' || /[\\/\u0000-\u001f\u007f]/.test(segment)) {
    fail(FAILURE_CODES.I2A_UNSAFE_PATH_SEGMENT, `${field} contains an unsafe path segment`);
  }
  return segment;
}

function assertRetentionClassId(value) {
  const retentionClassId = requireString(value, 'retentionClassId');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(retentionClassId)) {
    fail(FAILURE_CODES.I2A_RETENTION_CLASS_INVALID, 'retentionClassId must be a governed identifier');
  }
  return retentionClassId;
}

function assertMissionRealmIdentity(input) {
  const value = input || {};
  requireSchema(value.schemaVersion, 'missionIdentity');
  const missionId = assertSafeSegment(value.missionId, 'missionId');
  const realmId = assertSafeSegment(value.realmId, 'realmId');
  const sourceMissionId = assertSafeSegment(value.sourceMissionId, 'sourceMissionId');
  const sourceType = requireString(value.sourceType, 'sourceType');
  const missionRealmPath = requireString(value.missionRealmPath, 'missionRealmPath');
  const missionIdentityVersion = requireString(value.missionIdentityVersion, 'missionIdentityVersion');
  if (sourceType !== 'mission_realms' || missionId !== realmId || realmId !== sourceMissionId ||
      missionRealmPath !== `mission_realms/${realmId}`) {
    fail(FAILURE_CODES.I2A_MISSION_REALM_IDENTITY_INVALID,
      'missionId, realmId, sourceMissionId and missionRealmPath must describe one canonical realm');
  }
  return Object.freeze({
    schemaVersion: value.schemaVersion,
    missionId,
    realmId,
    sourceMissionId,
    sourceType,
    missionRealmPath,
    missionIdentityVersion,
  });
}

function createMissionRealmIdentity(input) {
  return assertMissionRealmIdentity({ ...input, schemaVersion: input && input.schemaVersion || SCHEMA_VERSIONS.missionIdentity });
}

function assertParentRealm(identity, parentRealmId) {
  const expected = assertMissionRealmIdentity(identity);
  if (expected.realmId !== assertSafeSegment(parentRealmId, 'parentRealmId')) {
    fail(FAILURE_CODES.I2A_PARENT_REALM_MISMATCH, 'parent realm does not match identity');
  }
  return expected;
}

function pathRoot(identity) {
  const checked = assertMissionRealmIdentity(identity);
  return `mission_realms/${checked.realmId}`;
}

function buildTeachingExecutionPath({ identity, realmId, executionId }) {
  const checked = identity ? assertParentRealm(identity, realmId || identity.realmId) : null;
  const root = checked ? pathRoot(checked) : `mission_realms/${assertSafeSegment(realmId, 'realmId')}`;
  return `${root}/teaching_executions/${assertSafeSegment(executionId, 'executionId')}`;
}

function buildExecutionStatusPath({ identity, realmId, executionId }) {
  const checked = identity ? assertParentRealm(identity, realmId || identity.realmId) : null;
  const root = checked ? pathRoot(checked) : `mission_realms/${assertSafeSegment(realmId, 'realmId')}`;
  return `${root}/teaching_execution_status/${assertSafeSegment(executionId, 'executionId')}`;
}

function buildEvidencePath({ identity, realmId, executionId, evidenceId }) {
  return `${buildTeachingExecutionPath({ identity, realmId, executionId })}/evidence/${assertSafeSegment(evidenceId, 'evidenceId')}`;
}

function buildTaughtAuthorityPath({ identity, realmId, authorityId }) {
  const checked = identity ? assertParentRealm(identity, realmId || identity.realmId) : null;
  const root = checked ? pathRoot(checked) : `mission_realms/${assertSafeSegment(realmId, 'realmId')}`;
  return `${root}/taught_content_authority/${assertSafeSegment(authorityId, 'authorityId')}`;
}

function buildIdempotencyPath({ identity, realmId, idempotencyKey }) {
  const checked = identity ? assertParentRealm(identity, realmId || identity.realmId) : null;
  const root = checked ? pathRoot(checked) : `mission_realms/${assertSafeSegment(realmId, 'realmId')}`;
  return `${root}/teaching_execution_idempotency/${assertSafeSegment(idempotencyKey, 'idempotencyKey')}`;
}

function buildExecutionEventPath({ identity, realmId, executionId, eventId }) {
  return `${buildTeachingExecutionPath({ identity, realmId, executionId })}/events/${assertSafeSegment(eventId, 'eventId')}`;
}

function identityPayload(input) {
  const identity = assertMissionRealmIdentity(input.identity);
  return {
    missionId: identity.missionId,
    realmId: identity.realmId,
    sourceMissionId: identity.sourceMissionId,
    sourceType: identity.sourceType,
    missionRealmPath: identity.missionRealmPath,
    missionIdentityVersion: identity.missionIdentityVersion,
    subjectId: requireString(input.subjectId, 'subjectId'),
    syllabusAtomId: requireString(input.syllabusAtomId, 'syllabusAtomId'),
    syllabusVersion: requireString(input.syllabusVersion, 'syllabusVersion'),
    syllabusCanonicalKey: requireString(input.syllabusCanonicalKey, 'syllabusCanonicalKey'),
    materialId: requireString(input.materialId, 'materialId'),
    materialVersion: requireString(input.materialVersion, 'materialVersion'),
    materialHash: requireString(input.materialHash, 'materialHash').toLowerCase(),
    teacherAuthorityId: requireString(input.teacherAuthorityId, 'teacherAuthorityId'),
    teacherAuthorityVersion: requireString(input.teacherAuthorityVersion, 'teacherAuthorityVersion'),
    pedagogyId: requireString(input.pedagogyId, 'pedagogyId'),
    pedagogyVersion: requireString(input.pedagogyVersion, 'pedagogyVersion'),
    pedagogyHash: requireString(input.pedagogyHash, 'pedagogyHash'),
    executorId: requireString(input.executorId, 'executorId'),
    executorVersion: requireString(input.executorVersion, 'executorVersion'),
  };
}

function executionIdentityPayload(input) {
  return identityPayload(input);
}

function deterministicExecutionId(input) {
  return i1.identity('execution', executionIdentityPayload(input));
}

function requestFingerprint(input) {
  return i1.sha256({
    identity: executionIdentityPayload(input),
    requestedAction: input.requestedAction || 'TEACHING_EXECUTION',
  });
}

function createTeachingExecutionModel(input) {
  const value = input || {};
  requireSchema(value.schemaVersion || SCHEMA_VERSIONS.teachingExecution, 'teachingExecution');
  const identity = assertMissionRealmIdentity(value.identity);
  const payload = identityPayload(value);
  const executionId = value.executionId || deterministicExecutionId(value);
  if (executionId !== deterministicExecutionId(value)) fail(FAILURE_CODES.I2A_IDENTITY_MISMATCH, 'executionId is not deterministic');
  const i1Execution = i1.createTeachingExecution({
    ...payload,
    executionId,
    idempotencyKey: requireString(value.idempotencyKey, 'idempotencyKey'),
    status: value.status || i1.STATES.EXECUTION_PENDING,
    evidenceRef: value.evidenceRef,
    evidenceHash: value.evidenceHash,
  });
  const retentionClassId = assertRetentionClassId(value.retentionClassId);
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.teachingExecution,
    ...identity,
    ...i1Execution,
    syllabusCanonicalKey: payload.syllabusCanonicalKey,
    pedagogyHash: payload.pedagogyHash,
    retentionClassId,
    createdAt: value.createdAt,
    completedAt: value.completedAt,
  });
}

function createExecutionStatusModel(input) {
  const value = input || {};
  requireSchema(value.schemaVersion || SCHEMA_VERSIONS.executionStatus, 'executionStatus');
  const executionId = assertSafeSegment(value.executionId, 'executionId');
  const state = requireString(value.state, 'state');
  if (!Object.values(i1.STATES).includes(state)) fail(FAILURE_CODES.I2A_IDENTITY_MISMATCH, 'unsupported execution state');
  if (value.statusVersion !== undefined && (!Number.isInteger(value.statusVersion) || value.statusVersion < 0)) {
    fail(FAILURE_CODES.I2A_IDENTITY_MISMATCH, 'statusVersion must be a non-negative integer');
  }
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.executionStatus,
    executionId,
    state,
    statusVersion: value.statusVersion,
    fencingToken: value.fencingToken,
    sourceExecutionRef: value.sourceExecutionRef,
    updatedAt: value.updatedAt,
    invalidationRef: value.invalidationRef,
    supersededBy: value.supersededBy,
  });
}

function evidenceHashInput(value) {
  const { evidenceHash, ...withoutHash } = value;
  return withoutHash;
}

function canonicalEvidenceEnvelope(value) {
  return i1.canonicalJson(evidenceHashInput(value));
}

function deterministicEvidenceHash(value) {
  return i1.sha256(evidenceHashInput(value));
}

function createEvidenceEnvelope(input) {
  const value = input || {};
  requireSchema(value.schemaVersion || SCHEMA_VERSIONS.executionEvidence, 'executionEvidence');
  const identity = assertMissionRealmIdentity(value.identity);
  const executionId = assertSafeSegment(value.executionId, 'executionId');
  if (value.artifactRef && !requiredString(value.artifactDigest)) {
    fail(FAILURE_CODES.I2A_EVIDENCE_BINDING_INVALID, 'artifactRef requires artifactDigest');
  }
  const envelope = {
    schemaVersion: SCHEMA_VERSIONS.executionEvidence,
    evidenceId: assertSafeSegment(value.evidenceId, 'evidenceId'),
    evidenceType: requireString(value.evidenceType, 'evidenceType'),
    producerId: requireString(value.producerId, 'producerId'),
    producerVersion: requireString(value.producerVersion, 'producerVersion'),
    ...identity,
    executionId,
    syllabusAtomId: requireString(value.syllabusAtomId, 'syllabusAtomId'),
    materialId: requireString(value.materialId, 'materialId'),
    materialVersion: requireString(value.materialVersion, 'materialVersion'),
    materialHash: requireString(value.materialHash, 'materialHash').toLowerCase(),
    teacherAuthorityId: requireString(value.teacherAuthorityId, 'teacherAuthorityId'),
    teacherAuthorityVersion: requireString(value.teacherAuthorityVersion, 'teacherAuthorityVersion'),
    pedagogyId: requireString(value.pedagogyId, 'pedagogyId'),
    pedagogyVersion: requireString(value.pedagogyVersion, 'pedagogyVersion'),
    pedagogyHash: requireString(value.pedagogyHash, 'pedagogyHash'),
    result: value.result === undefined ? null : value.result,
    artifactRef: value.artifactRef || null,
    artifactDigest: value.artifactDigest || null,
    completedAt: value.completedAt,
    retentionClassId: assertRetentionClassId(value.retentionClassId),
  };
  if (value.evidenceHash && value.evidenceHash !== deterministicEvidenceHash(envelope)) {
    fail(FAILURE_CODES.I2A_EVIDENCE_BINDING_INVALID, 'evidenceHash does not match canonical envelope');
  }
  return Object.freeze({ ...envelope, evidenceHash: deterministicEvidenceHash(envelope) });
}

function createTaughtAuthorityProjection(input) {
  const value = input || {};
  requireSchema(value.schemaVersion || SCHEMA_VERSIONS.taughtAuthorityProjection, 'taughtAuthorityProjection');
  const execution = value.execution;
  const evidence = value.evidence;
  if (!execution || !evidence || execution.executionId !== evidence.executionId || execution.evidenceHash !== evidence.evidenceHash) {
    fail(FAILURE_CODES.I2A_EVIDENCE_BINDING_INVALID, 'projection source execution/evidence binding is incomplete');
  }
  const derived = i1.deriveTaughtContentAuthority(execution);
  if (!derived.ok) fail(derived.code, 'I1 derivation rejected projection');
  const identity = assertMissionRealmIdentity(value.identity || execution);
  const authorityId = value.authorityId || derived.authority.authorityId;
  if (authorityId !== derived.authority.authorityId) fail(FAILURE_CODES.I2A_IDENTITY_MISMATCH, 'authorityId must reuse I1 derivation');
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.taughtAuthorityProjection,
    authorityId,
    sourceExecutionRef: requireString(value.sourceExecutionRef, 'sourceExecutionRef'),
    sourceEvidenceId: evidence.evidenceId,
    sourceEvidenceHash: evidence.evidenceHash,
    ...identity,
    subjectId: derived.authority.subjectId,
    syllabusAtomId: derived.authority.syllabusAtomId,
    materialId: derived.authority.materialId,
    materialVersion: derived.authority.materialVersion,
    materialHash: derived.authority.materialHash,
    teacherAuthorityId: requireString(value.teacherAuthorityId || execution.teacherAuthorityId, 'teacherAuthorityId'),
    teacherAuthorityVersion: requireString(value.teacherAuthorityVersion || execution.teacherAuthorityVersion, 'teacherAuthorityVersion'),
    pedagogyId: requireString(value.pedagogyId || execution.pedagogyId, 'pedagogyId'),
    pedagogyVersion: requireString(value.pedagogyVersion || execution.pedagogyVersion, 'pedagogyVersion'),
    pedagogyHash: requireString(value.pedagogyHash || execution.pedagogyHash, 'pedagogyHash'),
    validationVersion: requireString(value.validationVersion, 'validationVersion'),
    currentValidity: value.currentValidity === undefined ? 'VALID' : requireString(value.currentValidity, 'currentValidity'),
    projectionFingerprint: requireString(value.projectionFingerprint, 'projectionFingerprint'),
    invalidationRef: value.invalidationRef,
    supersessionRef: value.supersessionRef,
  });
}

function createIdempotencyReservation(input) {
  const value = input || {};
  requireSchema(value.schemaVersion || SCHEMA_VERSIONS.idempotencyReservation, 'idempotencyReservation');
  const identity = assertMissionRealmIdentity(value.identity);
  const expected = requestFingerprint(value.request || value);
  const fingerprint = value.requestFingerprint || expected;
  if (fingerprint !== expected) fail(FAILURE_CODES.I2A_REQUEST_FINGERPRINT_MISMATCH, 'request fingerprint is not deterministic');
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.idempotencyReservation,
    idempotencyKey: assertSafeSegment(value.idempotencyKey, 'idempotencyKey'),
    requestFingerprint: fingerprint,
    executionId: assertSafeSegment(value.executionId, 'executionId'),
    ...identity,
    status: requireString(value.status, 'status'),
  });
}

function createExecutionEvent(input) {
  const value = input || {};
  requireSchema(value.schemaVersion || SCHEMA_VERSIONS.executionEvent, 'executionEvent');
  const identity = assertMissionRealmIdentity(value.identity);
  const eventType = requireString(value.eventType, 'eventType');
  if (!EVENT_TYPES.has(eventType)) fail(FAILURE_CODES.I2A_IDENTITY_MISMATCH, 'unsupported event type');
  const eventIdPayload = {
    eventType,
    executionId: assertSafeSegment(value.executionId, 'executionId'),
    authorityId: value.authorityId || null,
    statusVersion: value.statusVersion === undefined ? null : value.statusVersion,
    reasonCode: value.reasonCode || null,
    sourceRef: value.sourceRef || null,
  };
  const eventId = value.eventId || i1.identity('event', eventIdPayload);
  if (eventId !== i1.identity('event', eventIdPayload)) fail(FAILURE_CODES.I2A_IDENTITY_MISMATCH, 'eventId is not deterministic');
  return Object.freeze({
    schemaVersion: SCHEMA_VERSIONS.executionEvent,
    eventId,
    eventType,
    ...eventIdPayload,
    ...identity,
    actorId: requireString(value.actorId, 'actorId'),
    actorVersion: requireString(value.actorVersion, 'actorVersion'),
    timestamp: value.timestamp,
  });
}

module.exports = Object.freeze({
  SCHEMA_VERSIONS,
  FAILURE_CODES,
  STATES: i1.STATES,
  I1: i1,
  createMissionRealmIdentity,
  assertMissionRealmIdentity,
  assertParentRealm,
  buildTeachingExecutionPath,
  buildExecutionStatusPath,
  buildEvidencePath,
  buildTaughtAuthorityPath,
  buildIdempotencyPath,
  buildExecutionEventPath,
  deterministicExecutionId,
  requestFingerprint,
  createTeachingExecutionModel,
  createExecutionStatusModel,
  canonicalEvidenceEnvelope,
  deterministicEvidenceHash,
  createEvidenceEnvelope,
  createTaughtAuthorityProjection,
  createIdempotencyReservation,
  createExecutionEvent,
});
