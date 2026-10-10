'use strict';

const assert = require('assert');
const fs = require('fs');
const i2a = require('./services/authority_intelligence/taught_content_authority_i2a');
const i2b1 = require('./services/authority_intelligence/taught_content_executor_authorization_i2b1');
const foundation = require('./services/authority_intelligence/taught_content_reservation_foundation_i2b2a');

const identity = i2a.createMissionRealmIdentity({
  missionId: 'realm-1', realmId: 'realm-1', sourceMissionId: 'realm-1',
  sourceType: 'mission_realms', missionRealmPath: 'mission_realms/realm-1',
  missionIdentityVersion: 'identity-v1',
});

function authority(overrides) {
  return {
    executorId: 'executor-1', executorVersion: 'executor-v1',
    authorizationVersion: 'auth-v1', issuerId: 'issuer-1',
    principalType: i2b1.PRINCIPAL_TYPE, active: true, revoked: false,
    allowedOperations: [foundation.RESERVE_OPERATION],
    allowedRealmIds: ['realm-1'], allowedMissionIds: ['realm-1'],
    allowedSubjectIds: ['subject-1'], ...(overrides || {}),
  };
}

function request(overrides) {
  return {
    missionIdentity: identity, realmId: 'realm-1', missionId: 'realm-1', subjectId: 'subject-1',
    syllabusAtomId: 'atom-1', syllabusVersion: 'atom-v1', syllabusCanonicalKey: 'realm-1.atom-1',
    materialId: 'material-1', materialVersion: 'material-v1', materialHash: 'A'.repeat(64),
    teacherAuthorityId: 'teacher-1', teacherAuthorityVersion: 'teacher-v1',
    pedagogyId: 'pedagogy-1', pedagogyVersion: 'pedagogy-v1', pedagogyHash: 'B'.repeat(64),
    executorId: 'executor-1', executorVersion: 'executor-v1',
    requestedAction: foundation.RESERVE_OPERATION, executorRegistry: authority(), ...(overrides || {}),
  };
}

function valid(overrides) {
  return foundation.validateReservationRequest(request(overrides), (overrides && overrides.executorRegistry) || authority());
}

function derivedKey(overrides) {
  const value = request(overrides);
  if (overrides && (overrides.executorId || overrides.executorVersion || overrides.executorRegistry)) {
    value.executorRegistry = authority({
      ...(overrides.executorRegistry || {}),
      ...(overrides.executorId ? { executorId: overrides.executorId } : {}),
      ...(overrides.executorVersion ? { executorVersion: overrides.executorVersion } : {}),
    });
  }
  return foundation.deriveIdempotencyKey(value, value.executorRegistry);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function different(field, value) { return request({ [field]: value }); }

test('same request derives deterministic execution, fingerprint and idempotency key', () => {
  const a = request(); const b = request();
  assert.strictEqual(foundation.deriveExecutionId(a), foundation.deriveExecutionId(b));
  assert.strictEqual(foundation.deriveRequestFingerprint(a, authority()), foundation.deriveRequestFingerprint(b, authority()));
  assert.strictEqual(foundation.deriveIdempotencyKey(a, authority()), foundation.deriveIdempotencyKey(b, authority()));
});

for (const [name, field, value] of [
  ['subject', 'subjectId', 'subject-2'],
  ['atom version', 'syllabusVersion', 'atom-v2'], ['material version', 'materialVersion', 'material-v2'],
  ['material hash', 'materialHash', 'C'.repeat(64)], ['teacher authority', 'teacherAuthorityVersion', 'teacher-v2'],
  ['pedagogy authority', 'pedagogyVersion', 'pedagogy-v2'], ['executor', 'executorId', 'executor-2'],
  ['executor version', 'executorVersion', 'executor-v2'], ['authorization version', 'executorRegistry', authority({ authorizationVersion: 'auth-v2' })],
  ['issuer', 'executorRegistry', authority({ issuerId: 'issuer-2' })], ['operation', 'requestedAction', 'AUDIT_TEACHING_EXECUTION'],
  ['request fingerprint input', 'requestFingerprint', 'tampered'],
]) {
  test(`${name} cannot alias the same reservation`, () => {
    const base = foundation.deriveIdempotencyKey(request(), authority());
    const changed = field === 'requestFingerprint'
      ? foundation.deriveIdempotencyKey(request({ requestFingerprint: value }), authority())
      : derivedKey({ [field]: value });
    assert.notStrictEqual(base, changed);
  });
}

function alternateRealmRequest() {
  const alternateIdentity = i2a.createMissionRealmIdentity({
    ...identity, missionId: 'realm-2', realmId: 'realm-2', sourceMissionId: 'realm-2',
    missionRealmPath: 'mission_realms/realm-2',
  });
  return request({
    missionIdentity: alternateIdentity,
    realmId: 'realm-2', missionId: 'realm-2',
    executorRegistry: authority({ allowedRealmIds: ['realm-2'], allowedMissionIds: ['realm-2'] }),
  });
}

test('realm change changes the deterministic reservation key', () => {
  assert.notStrictEqual(
    foundation.deriveIdempotencyKey(request(), authority()),
    foundation.deriveIdempotencyKey(alternateRealmRequest(), alternateRealmRequest().executorRegistry),
  );
});

test('canonical mission identity change changes the deterministic reservation key', () => {
  const alternate = alternateRealmRequest();
  assert.notStrictEqual(
    foundation.deriveRequestFingerprint(request(), authority()),
    foundation.deriveRequestFingerprint(alternate, alternate.executorRegistry),
  );
});

test('cross-realm identity rejected', () => {
  const other = i2a.createMissionRealmIdentity({ ...identity, missionId: 'realm-2', realmId: 'realm-2', sourceMissionId: 'realm-2', missionRealmPath: 'mission_realms/realm-2' });
  const result = valid({ missionIdentity: other, realmId: 'realm-2', missionId: 'realm-2', executorRegistry: authority({ allowedRealmIds: ['realm-2'], allowedMissionIds: ['realm-2'] }) });
  assert.strictEqual(result.ok, true);
  assert.notStrictEqual(result.executionId, foundation.deriveExecutionId(request()));
});

test('explicit empty realm fails closed', () => assert.strictEqual(valid({ realmId: '' }).code, foundation.FAILURE_CODES.I2B2_FIELD_MISSING));
test('explicit empty mission fails closed', () => assert.strictEqual(valid({ missionId: '' }).code, foundation.FAILURE_CODES.I2B2_FIELD_MISSING));
test('cross-realm request mismatch rejected', () => assert.strictEqual(valid({ realmId: 'realm-2' }).code, i2b1.FAILURE_CODES.CROSS_SCOPE_REFERENCE));
test('wildcard authority rejected', () => assert.strictEqual(valid({ executorRegistry: authority({ allowedSubjectIds: ['*'] }) }).code, i2b1.FAILURE_CODES.EXECUTOR_SCOPE_INVALID));
test('revoked authority rejected', () => assert.strictEqual(valid({ executorRegistry: authority({ revoked: true }) }).code, i2b1.FAILURE_CODES.EXECUTOR_REVOKED));
test('inactive authority rejected', () => assert.strictEqual(valid({ executorRegistry: authority({ active: false }) }).code, i2b1.FAILURE_CODES.EXECUTOR_INACTIVE));
test('issuer mismatch rejected', () => assert.strictEqual(valid({ issuerId: 'wrong' }).code, foundation.FAILURE_CODES.AUTHORITY_VERSION_CHANGED));
test('executor version mismatch rejected', () => assert.strictEqual(valid({ executorVersion: 'wrong' }).code, i2b1.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH));
test('authorization version mismatch rejected', () => assert.strictEqual(valid({ authorizationVersion: 'wrong' }).code, foundation.FAILURE_CODES.AUTHORITY_VERSION_CHANGED));

test('immutable shell excludes lifecycle fields', () => {
  const shell = foundation.buildExecutionShell(request());
  assert.ok(shell.path.endsWith(`/teaching_executions/${shell.document.executionId}`));
  for (const field of foundation.MUTABLE_LIFECYCLE_FIELDS) assert.strictEqual(Object.prototype.hasOwnProperty.call(shell.document, field), false, field);
});

test('reserved status starts at fence zero and unclaimed', () => {
  const status = foundation.buildReservedStatus(request()).document;
  assert.strictEqual(status.state, foundation.STATES.RESERVED);
  assert.strictEqual(status.statusVersion, 0);
  assert.strictEqual(status.fencingToken, 0);
  assert.strictEqual(status.leaseGeneration, 0);
  assert.strictEqual(status.leaseOwner, null);
  assert.strictEqual(status.terminal, false);
});

test('builders use server-time placeholders, never local clock authority', () => {
  const shell = foundation.buildExecutionShell(request()).document;
  const status = foundation.buildReservedStatus(request()).document;
  assert.strictEqual(shell.createdAt.kind, foundation.SCHEMA_VERSIONS.serverTimePlaceholder);
  assert.strictEqual(status.updatedAt.kind, foundation.SCHEMA_VERSIONS.serverTimePlaceholder);
  assert.strictEqual(/Date\.now|new Date|performance\.now/.test(fs.readFileSync(require.resolve('./services/authority_intelligence/taught_content_reservation_foundation_i2b2a'), 'utf8')), false);
});

test('idempotency reservation binds identity, authority and RESERVED state', () => {
  const reservation = foundation.buildIdempotencyReservation(request()).document;
  assert.strictEqual(reservation.status, foundation.STATES.RESERVED);
  assert.strictEqual(reservation.authorizationVersion, 'auth-v1');
  assert.strictEqual(reservation.issuerId, 'issuer-1');
  assert.strictEqual(reservation.executionId, foundation.deriveExecutionId(request()));
});

test('safe replay is classified without persistence', () => {
  const built = foundation.buildIdempotencyReservation(request()).document;
  assert.strictEqual(foundation.classifyReplay(request(), built).outcome, 'SAFE_IDEMPOTENT_REPLAY');
});
test('same key with changed fingerprint is idempotency conflict', () => {
  const built = foundation.buildIdempotencyReservation(request()).document;
  const result = foundation.classifyReplay(request({ requestFingerprint: 'tampered' }), built);
  assert.strictEqual(result.outcome, foundation.FAILURE_CODES.I2B2_REQUEST_FINGERPRINT_MISMATCH);
});
test('conflicting execution identity is reservation conflict', () => {
  const first = foundation.buildIdempotencyReservation(request()).document;
  const secondInput = request({ syllabusVersion: 'atom-v2' });
  const result = foundation.classifyReplay(secondInput, first);
  assert.strictEqual(result.outcome, 'NEW_RESERVATION');
  const conflict = foundation.classifyReplay(request(), { ...first, idempotencyKey: 'other-key', requestFingerprint: 'other-fingerprint' });
  assert.strictEqual(conflict.outcome, foundation.FAILURE_CODES.EXECUTION_RESERVATION_CONFLICT);
});

test('registry reader contract is injected and transport-neutral', () => {
  let seen = null;
  const contract = foundation.createRegistryReaderContract({ getCurrentExecutorAuthorization(input) { seen = input; return authority(); } });
  assert.strictEqual(contract.authoritySource, 'INJECTED_SERVER_REGISTRY');
  assert.strictEqual(contract.getCurrentExecutorAuthorization({ realmId: 'realm-1' }).executorId, 'executor-1');
  assert.deepStrictEqual(seen, { realmId: 'realm-1' });
});

test('source has no prohibited runtime dependencies', () => {
  const source = fs.readFileSync(require.resolve('./services/authority_intelligence/taught_content_reservation_foundation_i2b2a'), 'utf8');
  assert.strictEqual(/require\(['"](?:firebase|@google-cloud\/firestore|fs|net|http|https|child_process|os|process)/i.test(source), false);
  assert.strictEqual(/(?:fetch|Date\.now|new Date|http\.request|https\.request)\s*\(/i.test(source), false);
});

let passed = 0;
for (const item of tests) {
  try { item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
  catch (error) { console.error(`FAIL ${item.name}: ${error.code || error.message}`); process.exitCode = 1; }
}
console.log(JSON.stringify({ total: tests.length, passed, failed: tests.length - passed }));
