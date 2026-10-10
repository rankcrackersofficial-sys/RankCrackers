'use strict';

const assert = require('assert');
const i2a = require('./services/authority_intelligence/taught_content_authority_i2a');
const authorization = require('./services/authority_intelligence/taught_content_executor_authorization_i2b1');

const identity = {
  schemaVersion: i2a.SCHEMA_VERSIONS.missionIdentity,
  missionId: 'realm-1',
  realmId: 'realm-1',
  sourceMissionId: 'realm-1',
  sourceType: 'mission_realms',
  missionRealmPath: 'mission_realms/realm-1',
  missionIdentityVersion: 'identity-v1',
};

function request(overrides) {
  return {
    operation: authorization.RESERVE_OPERATION,
    realmId: 'realm-1',
    missionId: 'realm-1',
    subjectId: 'subject-1',
    missionIdentity: identity,
    ...(overrides || {}),
  };
}

function authority(overrides) {
  return {
    executorId: 'executor-1',
    executorVersion: 'executor-v1',
    principalType: authorization.PRINCIPAL_TYPE,
    authorizationVersion: 'auth-v1',
    issuer: 'governed-test-issuer',
    active: true,
    revoked: false,
    allowedOperations: [authorization.RESERVE_OPERATION, 'AUDIT_TEACHING_EXECUTION'],
    allowedRealmIds: ['realm-1', 'realm-2'],
    allowedMissionIds: ['realm-1', 'realm-2'],
    allowedSubjectIds: ['subject-1', 'subject-2'],
    ...(overrides || {}),
  };
}

function context(overrides) {
  return { executorId: 'executor-1', executorVersion: 'executor-v1', ...(overrides || {}) };
}

function authorize(overrides) {
  const value = overrides || {};
  return authorization.authorizeExecutor({
    request: value.request || request(),
    executorContext: value.executorContext || context(),
    executorAuthority: value.executorAuthority === undefined ? authority() : value.executorAuthority,
  });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

test('valid governed executor with exact scope is allowed', () => {
  const result = authorize();
  assert.strictEqual(result.authorized, true);
  assert.strictEqual(result.failureCode, null);
  assert.ok(result.snapshotId);
});

test('missing executor authority is denied', () => {
  assert.strictEqual(authorize({ executorAuthority: null }).failureCode, authorization.FAILURE_CODES.EXECUTOR_AUTHORITY_MISSING);
});

test('executor identity mismatch is denied', () => {
  assert.strictEqual(authorize({ executorContext: context({ executorId: 'other' }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH);
});

test('wrong principal type is denied', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ principalType: 'FOUNDER' }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_TYPE_INVALID);
});

test('executor version mismatch is denied', () => {
  assert.strictEqual(authorize({ executorContext: context({ executorVersion: 'executor-v2' }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_VERSION_MISMATCH);
});

test('inactive executor is denied', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ active: false }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_INACTIVE);
});

test('revoked executor is denied', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ revoked: true }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_REVOKED);
});

test('missing authorization version is denied', () => {
  const value = authority();
  delete value.authorizationVersion;
  assert.strictEqual(authorize({ executorAuthority: value }).failureCode, authorization.FAILURE_CODES.EXECUTOR_AUTHORIZATION_VERSION_INVALID);
});

test('unauthorized operation is denied', () => {
  assert.strictEqual(authorize({ request: request({ operation: 'UNAUTHORIZED_OPERATION' }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_OPERATION_DENIED);
});

test('wrong realm is denied', () => {
  const value = request({ realmId: 'realm-2', missionId: 'realm-2', missionIdentity: { ...identity, realmId: 'realm-2', missionId: 'realm-2', sourceMissionId: 'realm-2', missionRealmPath: 'mission_realms/realm-2' } });
  assert.strictEqual(authorize({ request: value, executorAuthority: authority({ allowedRealmIds: ['realm-1'] }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_REALM_DENIED);
});

test('wrong mission is denied', () => {
  assert.strictEqual(authorize({ request: request({ missionId: 'mission-not-allowed' }) }).failureCode, authorization.FAILURE_CODES.CROSS_SCOPE_REFERENCE);
});

test('wrong subject is denied', () => {
  assert.strictEqual(authorize({ request: request({ subjectId: 'subject-not-allowed' }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SUBJECT_DENIED);
});

test('empty operation scope does not allow all', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ allowedOperations: [] }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SCOPE_EMPTY);
});

test('empty realm scope does not allow all', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ allowedRealmIds: [] }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SCOPE_EMPTY);
});

test('empty mission scope does not allow all', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ allowedMissionIds: [] }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SCOPE_EMPTY);
});

test('empty subject scope does not allow all', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ allowedSubjectIds: [] }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SCOPE_EMPTY);
});

test('wildcard scope is rejected', () => {
  assert.strictEqual(authorize({ executorAuthority: authority({ allowedSubjectIds: ['*'] }) }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SCOPE_INVALID);
});

test('missing required scope fails closed', () => {
  const value = authority();
  delete value.allowedSubjectIds;
  assert.strictEqual(authorize({ executorAuthority: value }).failureCode, authorization.FAILURE_CODES.EXECUTOR_SCOPE_EMPTY);
});

test('cross-realm mission identity mismatch fails closed', () => {
  assert.strictEqual(authorize({ request: request({ realmId: 'realm-2' }) }).failureCode, authorization.FAILURE_CODES.CROSS_SCOPE_REFERENCE);
});

test('Founder requester cannot authorize an invalid executor', () => {
  assert.strictEqual(authorize({ request: request({ requesterRole: 'FOUNDER' }), executorContext: context({ executorId: 'invalid' }) }).authorized, false);
});

test('Student requester cannot authorize an invalid executor', () => {
  assert.strictEqual(authorize({ request: request({ requesterRole: 'STUDENT' }), executorContext: context({ executorId: 'invalid' }) }).authorized, false);
});

test('same semantic authorization snapshot is deterministic', () => {
  assert.strictEqual(authorize().snapshotId, authorize().snapshotId);
});

test('changed executor version changes snapshot identity', () => {
  const first = authorize();
  const second = authorize({ executorContext: context({ executorVersion: 'executor-v2' }), executorAuthority: authority({ executorVersion: 'executor-v2' }) });
  assert.notStrictEqual(first.snapshotId, second.snapshotId);
});

test('changed authorization version changes snapshot identity', () => {
  const first = authorize();
  const second = authorize({ executorAuthority: authority({ authorizationVersion: 'auth-v2' }) });
  assert.notStrictEqual(first.snapshotId, second.snapshotId);
});

test('changed realm changes snapshot identity', () => {
  const secondIdentity = { ...identity, realmId: 'realm-2', missionId: 'realm-2', sourceMissionId: 'realm-2', missionRealmPath: 'mission_realms/realm-2' };
  const first = authorize();
  const second = authorize({ request: request({ realmId: 'realm-2', missionId: 'realm-2', missionIdentity: secondIdentity }) });
  assert.notStrictEqual(first.snapshotId, second.snapshotId);
});

test('changed mission changes snapshot identity', () => {
  const secondIdentity = { ...identity, realmId: 'realm-2', missionId: 'realm-2', sourceMissionId: 'realm-2', missionRealmPath: 'mission_realms/realm-2' };
  const first = authorize();
  const second = authorize({ request: request({ realmId: 'realm-2', missionId: 'realm-2', missionIdentity: secondIdentity }) });
  assert.notStrictEqual(first.snapshotId, second.snapshotId);
});

test('changed subject changes snapshot identity', () => {
  const first = authorize();
  const second = authorize({ request: request({ subjectId: 'subject-2' }) });
  assert.notStrictEqual(first.snapshotId, second.snapshotId);
});

test('changed operation changes snapshot identity', () => {
  const first = authorize();
  const second = authorize({ request: request({ operation: 'AUDIT_TEACHING_EXECUTION' }) });
  assert.notStrictEqual(first.snapshotId, second.snapshotId);
});

test('no Firebase dependency is loaded', () => {
  assert.strictEqual(Object.keys(require.cache).some((name) => /firebase/i.test(name)), false);
});

test('no Firestore dependency is loaded', () => {
  assert.strictEqual(Object.keys(require.cache).some((name) => /firestore/i.test(name)), false);
});

test('no network dependency is loaded', () => {
  assert.strictEqual(Object.keys(require.cache).some((name) => /(?:^|[\\/])(http|https|net)(?:\.js)?$/i.test(name)), false);
});

test('no filesystem dependency is loaded for authorization', () => {
  assert.strictEqual(Object.keys(require.cache).some((name) => /(?:^|[\\/])fs(?:\.js)?$/i.test(name)), false);
});

test('authority is injected and not environment-backed', () => {
  const result = authorize({ executorAuthority: authority() });
  assert.strictEqual(result.authorized, true);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(result, 'environment'), false);
});

test('no reservation behavior is exported or returned', () => {
  assert.strictEqual(typeof authorization.reserveTeachingExecution, 'undefined');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(authorize(), 'reservationState'), false);
});

test('no lease or fencing behavior is exported or returned', () => {
  assert.strictEqual(typeof authorization.claimTeachingExecution, 'undefined');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(authorize(), 'fencingToken'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(authorize(), 'leaseOwner'), false);
});

let passed = 0;
for (const item of tests) {
  try {
    item.fn();
    passed += 1;
    console.log(`PASS ${item.name}`);
  } catch (error) {
    console.error(`FAIL ${item.name}: ${error.message}`);
    process.exitCode = 1;
  }
}

console.log(JSON.stringify({ total: tests.length, passed, failed: tests.length - passed }));
