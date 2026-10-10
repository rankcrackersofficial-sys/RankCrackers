'use strict';

// I2B-1 is intentionally pure. The executor authority record is injected by
// the caller; this module does not resolve a registry, authenticate transport,
// access Firebase, or create a reservation.
const i2a = require('./taught_content_authority_i2a');
const i1 = i2a.I1;

const PRINCIPAL_TYPE = 'GOVERNED_SERVER_EXECUTOR';
const RESERVE_OPERATION = 'RESERVE_TEACHING_EXECUTION';

const FAILURE_CODES = Object.freeze({
  EXECUTOR_AUTHORIZATION_INPUT_INVALID: 'EXECUTOR_AUTHORIZATION_INPUT_INVALID',
  EXECUTOR_AUTHORITY_MISSING: 'EXECUTOR_AUTHORITY_MISSING',
  EXECUTOR_IDENTITY_MISMATCH: 'EXECUTOR_IDENTITY_MISMATCH',
  EXECUTOR_TYPE_INVALID: 'EXECUTOR_TYPE_INVALID',
  EXECUTOR_VERSION_MISMATCH: 'EXECUTOR_VERSION_MISMATCH',
  EXECUTOR_INACTIVE: 'EXECUTOR_INACTIVE',
  EXECUTOR_REVOKED: 'EXECUTOR_REVOKED',
  EXECUTOR_AUTHORIZATION_VERSION_INVALID: 'EXECUTOR_AUTHORIZATION_VERSION_INVALID',
  EXECUTOR_OPERATION_DENIED: 'EXECUTOR_OPERATION_DENIED',
  EXECUTOR_REALM_DENIED: 'EXECUTOR_REALM_DENIED',
  EXECUTOR_MISSION_DENIED: 'EXECUTOR_MISSION_DENIED',
  EXECUTOR_SUBJECT_DENIED: 'EXECUTOR_SUBJECT_DENIED',
  EXECUTOR_SCOPE_EMPTY: 'EXECUTOR_SCOPE_EMPTY',
  EXECUTOR_SCOPE_INVALID: 'EXECUTOR_SCOPE_INVALID',
  I2A_MISSION_REALM_IDENTITY_INVALID: i2a.FAILURE_CODES.I2A_MISSION_REALM_IDENTITY_INVALID,
  CROSS_SCOPE_REFERENCE: i1.FAILURE_CODES.CROSS_SCOPE_REFERENCE,
});

function requiredString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function fail(code, message) {
  const error = new Error(`${code}: ${message || code}`);
  error.code = code;
  throw error;
}

function requireString(value, field, code) {
  if (!requiredString(value)) fail(code || FAILURE_CODES.EXECUTOR_AUTHORIZATION_INPUT_INVALID, `${field} is required`);
  return value.trim();
}

function requireBoolean(value, field) {
  if (typeof value !== 'boolean') fail(FAILURE_CODES.EXECUTOR_AUTHORIZATION_INPUT_INVALID, `${field} must be boolean`);
  return value;
}

function rejectWildcard(value) {
  return /^(?:\*|ANY|ALL)$/i.test(value.trim());
}

function canonicalScope(value, field) {
  if (!Array.isArray(value) || value.length === 0) fail(FAILURE_CODES.EXECUTOR_SCOPE_EMPTY, `${field} must be non-empty`);
  const values = value.map((entry) => requireString(entry, `${field} entry`));
  if (values.some(rejectWildcard)) fail(FAILURE_CODES.EXECUTOR_SCOPE_INVALID, `${field} cannot contain wildcard authority`);
  const unique = new Set(values);
  if (unique.size !== values.length) fail(FAILURE_CODES.EXECUTOR_SCOPE_INVALID, `${field} cannot contain duplicates`);
  return Object.freeze([...values].sort());
}

function createExecutorAuthority(input) {
  const value = input || {};
  const authorizationVersion = requireString(
    value.authorizationVersion,
    'authorizationVersion',
    FAILURE_CODES.EXECUTOR_AUTHORIZATION_VERSION_INVALID,
  );
  return Object.freeze({
    executorId: requireString(value.executorId, 'executorId'),
    executorVersion: requireString(value.executorVersion, 'executorVersion'),
    principalType: requireString(value.principalType, 'principalType'),
    authorizationVersion,
    issuer: requireString(value.issuer, 'issuer'),
    active: requireBoolean(value.active, 'active'),
    revoked: requireBoolean(value.revoked, 'revoked'),
    allowedOperations: canonicalScope(value.allowedOperations, 'allowedOperations'),
    allowedRealmIds: canonicalScope(value.allowedRealmIds, 'allowedRealmIds'),
    allowedMissionIds: canonicalScope(value.allowedMissionIds, 'allowedMissionIds'),
    allowedSubjectIds: canonicalScope(value.allowedSubjectIds, 'allowedSubjectIds'),
  });
}

function createExecutorContext(input) {
  const value = input || {};
  return Object.freeze({
    executorId: requireString(value.executorId, 'executorContext.executorId'),
    executorVersion: requireString(value.executorVersion, 'executorContext.executorVersion'),
  });
}

function createAuthorizationRequest(input) {
  const value = input || {};
  const identity = i2a.assertMissionRealmIdentity(value.missionIdentity);
  const realmId = requireString(value.realmId, 'realmId');
  const missionId = requireString(value.missionId, 'missionId');
  if (identity.realmId !== realmId || identity.missionId !== missionId) {
    fail(FAILURE_CODES.CROSS_SCOPE_REFERENCE, 'request mission and realm do not match I2A identity');
  }
  return Object.freeze({
    operation: requireString(value.operation, 'operation'),
    realmId,
    missionId,
    subjectId: requireString(value.subjectId, 'subjectId'),
    missionIdentity: identity,
    // Requester metadata is deliberately non-authoritative and excluded from
    // the authorization snapshot.
    requesterRole: value.requesterRole === undefined || value.requesterRole === null
      ? null : requireString(value.requesterRole, 'requesterRole'),
  });
}

function snapshotPayload(authority, request) {
  return {
    executorId: authority.executorId,
    executorVersion: authority.executorVersion,
    principalType: authority.principalType,
    authorizationVersion: authority.authorizationVersion,
    issuer: authority.issuer,
    operation: request.operation,
    realmId: request.realmId,
    missionId: request.missionId,
    subjectId: request.subjectId,
  };
}

function createAuthorizationSnapshot(authorityInput, requestInput) {
  const authority = createExecutorAuthority(authorityInput);
  const request = createAuthorizationRequest(requestInput);
  const payload = snapshotPayload(authority, request);
  return Object.freeze({
    ...payload,
    snapshotId: i1.identity('executor_authorization', payload),
  });
}

function safeFailure(code, request, context) {
  return Object.freeze({
    authorized: false,
    failureCode: code,
    ...(context && requiredString(context.executorId) ? { executorId: context.executorId.trim() } : {}),
    ...(context && requiredString(context.executorVersion) ? { executorVersion: context.executorVersion.trim() } : {}),
    ...(request && requiredString(request.operation) ? { operation: request.operation.trim() } : {}),
    ...(request && requiredString(request.realmId) ? { realmId: request.realmId.trim() } : {}),
    ...(request && requiredString(request.missionId) ? { missionId: request.missionId.trim() } : {}),
    ...(request && requiredString(request.subjectId) ? { subjectId: request.subjectId.trim() } : {}),
  });
}

function authorizeExecutor(input) {
  const value = input || {};
  let request;
  let context;
  let authority;
  try {
    request = createAuthorizationRequest(value.request);
    context = createExecutorContext(value.executorContext);
  } catch (error) {
    return safeFailure(error.code || FAILURE_CODES.EXECUTOR_AUTHORIZATION_INPUT_INVALID);
  }
  if (!value.executorAuthority) return safeFailure(FAILURE_CODES.EXECUTOR_AUTHORITY_MISSING, request, context);
  try {
    authority = createExecutorAuthority(value.executorAuthority);
  } catch (error) {
    return safeFailure(error.code || FAILURE_CODES.EXECUTOR_AUTHORIZATION_INPUT_INVALID, request, context);
  }
  if (context.executorId !== authority.executorId) return safeFailure(FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH, request, context);
  if (authority.principalType !== PRINCIPAL_TYPE) return safeFailure(FAILURE_CODES.EXECUTOR_TYPE_INVALID, request, context);
  if (context.executorVersion !== authority.executorVersion) return safeFailure(FAILURE_CODES.EXECUTOR_VERSION_MISMATCH, request, context);
  if (authority.active !== true) return safeFailure(FAILURE_CODES.EXECUTOR_INACTIVE, request, context);
  if (authority.revoked === true) return safeFailure(FAILURE_CODES.EXECUTOR_REVOKED, request, context);
  if (!requiredString(authority.authorizationVersion)) {
    return safeFailure(FAILURE_CODES.EXECUTOR_AUTHORIZATION_VERSION_INVALID, request, context);
  }
  if (!authority.allowedOperations.includes(request.operation)) return safeFailure(FAILURE_CODES.EXECUTOR_OPERATION_DENIED, request, context);
  if (!authority.allowedRealmIds.includes(request.realmId)) return safeFailure(FAILURE_CODES.EXECUTOR_REALM_DENIED, request, context);
  if (!authority.allowedMissionIds.includes(request.missionId)) return safeFailure(FAILURE_CODES.EXECUTOR_MISSION_DENIED, request, context);
  if (!authority.allowedSubjectIds.includes(request.subjectId)) return safeFailure(FAILURE_CODES.EXECUTOR_SUBJECT_DENIED, request, context);
  try {
    const snapshot = createAuthorizationSnapshot(authority, request);
    return Object.freeze({
      authorized: true,
      failureCode: null,
      ...snapshot,
    });
  } catch (error) {
    return safeFailure(error.code || FAILURE_CODES.EXECUTOR_AUTHORIZATION_INPUT_INVALID, request, context);
  }
}

module.exports = Object.freeze({
  PRINCIPAL_TYPE,
  RESERVE_OPERATION,
  FAILURE_CODES,
  createExecutorAuthority,
  createExecutorContext,
  createAuthorizationRequest,
  createAuthorizationSnapshot,
  authorizeExecutor,
});
