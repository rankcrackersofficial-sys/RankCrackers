'use strict';

const assert = require('assert');
const fs = require('fs');
const i1 = require('./services/authority_intelligence/taught_content_authority_i1');
const i2a = require('./services/authority_intelligence/taught_content_authority_i2a');
const i2b1 = require('./services/authority_intelligence/taught_content_executor_authorization_i2b1');
const i2b2a = require('./services/authority_intelligence/taught_content_reservation_foundation_i2b2a');
const coordinator = require('./services/authority_intelligence/taught_content_execution_coordinator_i2b2b');

const identity = i2a.createMissionRealmIdentity({
  missionId: 'realm-1', realmId: 'realm-1', sourceMissionId: 'realm-1',
  sourceType: 'mission_realms', missionRealmPath: 'mission_realms/realm-1',
  missionIdentityVersion: 'identity-v1',
});

function executor(overrides) {
  return {
    executorId: 'executor-1', executorVersion: 'executor-v1', authorizationVersion: 'auth-v1',
    issuerId: 'issuer-1', principalType: i2b1.PRINCIPAL_TYPE, active: true, revoked: false,
    allowedOperations: [i2b2a.RESERVE_OPERATION], allowedRealmIds: ['realm-1'],
    allowedMissionIds: ['realm-1'], allowedSubjectIds: ['subject-1'], ...(overrides || {}),
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
    requestedAction: i2b2a.RESERVE_OPERATION, ...(overrides || {}),
  };
}

function authoritySnapshot(overrides) {
  return {
    executorRegistry: executor(),
    mission: { active: true, identity },
    atom: { verified: true, syllabusAtomId: 'atom-1', syllabusVersion: 'atom-v1' },
    material: { materialId: 'material-1', version: 'material-v1', contentHash: 'A'.repeat(64) },
    teacher: { authorityId: 'teacher-1', version: 'teacher-v1', subjectId: 'subject-1', missionId: 'realm-1', status: 'ACTIVE' },
    pedagogy: { pedagogyId: 'pedagogy-1', version: 'pedagogy-v1', pedagogyHash: 'B'.repeat(64), subjectId: 'subject-1', teacherAuthorityId: 'teacher-1', status: 'ACTIVE' },
    ...(overrides || {}),
  };
}

function context(overrides) {
  return { serverOnly: true, principalType: i2b1.PRINCIPAL_TYPE, executorId: 'executor-1', executorVersion: 'executor-v1', ...(overrides || {}) };
}

function deepClone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

class MemoryTransactionStore {
  constructor() {
    this.records = new Map();
    this.attemptedCreates = [];
    this.committedCreates = [];
    this.rollbackCount = 0;
    this.failOnCreateNumber = null;
    this.queue = Promise.resolve();
  }

  seed(path, document) { this.records.set(path, deepClone(document)); }
  clear() { this.records.clear(); }

  async runTransaction(callback) {
    const execute = async () => {
      const staged = new Map();
      const localCreates = [];
      const tx = {
        get: async (path) => staged.has(path) ? deepClone(staged.get(path)) : deepClone(this.records.get(path) || null),
        create: async (path, document) => {
          if (staged.has(path) || this.records.has(path)) {
            const error = new Error('already exists');
            error.code = 'ALREADY_EXISTS';
            throw error;
          }
          localCreates.push({ path, document: deepClone(document) });
          this.attemptedCreates.push({ path, document: deepClone(document) });
          if (this.failOnCreateNumber === localCreates.length) {
            const error = new Error(`injected failure at create ${localCreates.length}`);
            error.code = 'INJECTED_TRANSACTION_FAILURE';
            throw error;
          }
          staged.set(path, deepClone(document));
        },
      };
      try {
        const result = await callback(tx);
        for (const item of localCreates) {
          this.records.set(item.path, deepClone(item.document));
          this.committedCreates.push(item);
        }
        return result;
      } catch (error) {
        this.rollbackCount += 1;
        throw error;
      }
    };
    const next = this.queue.then(execute);
    this.queue = next.catch(() => undefined);
    return next;
  }
}

class FixtureAuthorityReader {
  constructor(snapshots) { this.snapshots = Array.isArray(snapshots) ? snapshots : [snapshots]; this.calls = 0; }
  async readCurrentReservationAuthority() {
    const index = Math.min(this.calls, this.snapshots.length - 1);
    this.calls += 1;
    return deepClone(this.snapshots[index]);
  }
}

function deps(store, snapshots) {
  return { transactionStore: store, authorityReader: new FixtureAuthorityReader(snapshots || authoritySnapshot()) };
}

async function reserve(overrides, store, snapshots, ctx) {
  return coordinator.reserveTeachingExecution(request(overrides), ctx || context(), deps(store || new MemoryTransactionStore(), snapshots));
}

function artifacts() { return coordinator.buildArtifacts(request(), i2b2a.createExecutorRegistryReference(executor())); }

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
async function expectCode(promise, code) { const result = await promise; assert.strictEqual(result.ok, false); assert.strictEqual(result.code, code); return result; }

test('valid NEW_RESERVATION commits exactly three records', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store);
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.outcome, coordinator.OUTCOMES.NEW_RESERVATION);
  assert.strictEqual(result.committed, true);
  assert.strictEqual(store.records.size, 3);
  assert.strictEqual(store.committedCreates.length, 3);
});

test('immutable shell identity and canonical path are correct', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store);
  const shell = result.artifacts.documents.shell;
  assert.strictEqual(result.artifacts.paths.shell, `mission_realms/realm-1/teaching_executions/${shell.executionId}`);
  assert.strictEqual(shell.realmId, 'realm-1');
  assert.strictEqual(shell.executionId, result.artifacts.executionId);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(shell, 'leaseOwner'), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(shell, 'fencingToken'), false);
});

test('RESERVED status has the required initial fencing state', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store);
  const status = result.artifacts.documents.status;
  assert.deepStrictEqual({ state: status.state, statusVersion: status.statusVersion, fencingToken: status.fencingToken, leaseGeneration: status.leaseGeneration, leaseOwner: status.leaseOwner, terminal: status.terminal }, { state: 'RESERVED', statusVersion: 0, fencingToken: 0, leaseGeneration: 0, leaseOwner: null, terminal: false });
});

test('reservation identity binds key fingerprint execution and authority', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store);
  const doc = result.artifacts.documents.reservation;
  assert.strictEqual(doc.idempotencyKey, result.artifacts.idempotencyKey);
  assert.strictEqual(doc.requestFingerprint, result.artifacts.requestFingerprint);
  assert.strictEqual(doc.executionId, result.artifacts.executionId);
  assert.strictEqual(doc.issuerId, 'issuer-1');
  assert.strictEqual(doc.authorizationVersion, 'auth-v1');
});

test('safe replay creates zero duplicates and returns canonical identity', async () => {
  const store = new MemoryTransactionStore();
  const first = await reserve({}, store);
  const committed = store.committedCreates.length;
  const second = await reserve({}, store);
  assert.strictEqual(second.ok, true);
  assert.strictEqual(second.outcome, coordinator.OUTCOMES.SAFE_IDEMPOTENT_REPLAY);
  assert.strictEqual(second.committed, false);
  assert.strictEqual(store.committedCreates.length, committed);
  assert.strictEqual(second.artifacts.executionId, first.artifacts.executionId);
});

test('same key with a different fingerprint fails as idempotency conflict', async () => {
  const store = new MemoryTransactionStore();
  const first = await reserve({}, store);
  const result = await reserve({ idempotencyKey: first.artifacts.idempotencyKey, requestFingerprint: 'different' }, store);
  assert.strictEqual(result.code, coordinator.FAILURE_CODES.EXECUTION_IDEMPOTENCY_CONFLICT);
  assert.strictEqual(store.records.size, 3);
});

test('conflicting execution reservation fails closed', async () => {
  const store = new MemoryTransactionStore();
  const a = artifacts();
  store.seed(a.paths.reservation, { ...a.documents.reservation, executionId: 'execution_other' });
  const result = await reserve({}, store);
  assert.strictEqual(result.code, coordinator.FAILURE_CODES.EXECUTION_RESERVATION_CONFLICT);
  assert.strictEqual(store.records.size, 1);
});

test('cross-realm request rejected', async () => await expectCode(reserve({ realmId: 'realm-2' }), i1.FAILURE_CODES.CROSS_SCOPE_REFERENCE));
test('cross-mission request rejected', async () => await expectCode(reserve({ missionId: 'mission-2' }), i1.FAILURE_CODES.CROSS_SCOPE_REFERENCE));
test('cross-subject request rejected', async () => await expectCode(reserve({ subjectId: 'subject-2' }), i2b1.FAILURE_CODES.EXECUTOR_SUBJECT_DENIED));
test('inactive mission rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ mission: { active: false, identity } })), i1.FAILURE_CODES.MISSION_INACTIVE));
test('unverified atom rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ atom: { verified: false, syllabusAtomId: 'atom-1', syllabusVersion: 'atom-v1' } })), i1.FAILURE_CODES.ATOM_NOT_VERIFIED));
test('material version mismatch rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ material: { materialId: 'material-1', version: 'material-v2', contentHash: 'A'.repeat(64) } })), i1.FAILURE_CODES.MATERIAL_VERSION_MISMATCH));
test('material hash mismatch rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ material: { materialId: 'material-1', version: 'material-v1', contentHash: 'C'.repeat(64) } })), i1.FAILURE_CODES.MATERIAL_HASH_MISMATCH));
test('invalid teacher authority rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ teacher: { ...authoritySnapshot().teacher, status: 'REVOKED' } })), i1.FAILURE_CODES.TEACHER_AUTHORITY_INVALID));
test('invalid pedagogy authority rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ pedagogy: { ...authoritySnapshot().pedagogy, status: 'REVOKED' } })), i1.FAILURE_CODES.PEDAGOGY_AUTHORITY_INVALID));
test('inactive executor rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ executorRegistry: executor({ active: false }) })), i2b1.FAILURE_CODES.EXECUTOR_INACTIVE));
test('revoked executor rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ executorRegistry: executor({ revoked: true }) })), i2b1.FAILURE_CODES.EXECUTOR_REVOKED));
test('executor scope mismatch rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ executorRegistry: executor({ allowedRealmIds: ['other-realm'] }) })), i2b1.FAILURE_CODES.EXECUTOR_REALM_DENIED));
test('executor version changed rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ executorRegistry: executor({ executorVersion: 'executor-v2' }) })), i2b1.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH));
test('authorization version changed rejected', async () => await expectCode(reserve({ authorizationVersion: 'auth-old' }), coordinator.FAILURE_CODES.AUTHORITY_VERSION_CHANGED));
test('issuer mismatch rejected', async () => await expectCode(reserve({ issuerId: 'issuer-old' }), coordinator.FAILURE_CODES.AUTHORITY_VERSION_CHANGED));
test('wildcard executor authority rejected', async () => await expectCode(reserve({}, new MemoryTransactionStore(), authoritySnapshot({ executorRegistry: executor({ allowedSubjectIds: ['*'] }) })), i2b1.FAILURE_CODES.EXECUTOR_SCOPE_INVALID));

for (const [label, seedKey] of [['reservation exists/shell missing', 'reservation'], ['reservation exists/status missing', 'reservation'], ['shell exists/reservation missing', 'shell'], ['status exists/shell missing', 'status']]) {
  test(`${label} fails closed`, async () => {
    const store = new MemoryTransactionStore(); const a = artifacts();
    if (seedKey === 'reservation') store.seed(a.paths.reservation, a.documents.reservation);
    if (seedKey === 'shell') store.seed(a.paths.shell, a.documents.shell);
    if (seedKey === 'status') store.seed(a.paths.status, a.documents.status);
    const result = await reserve({}, store);
    assert.strictEqual(result.code, coordinator.FAILURE_CODES.EXECUTION_STATUS_CONFLICT);
  });
}

test('status identity mismatch fails closed', async () => {
  const store = new MemoryTransactionStore(); const a = artifacts();
  store.seed(a.paths.status, { ...a.documents.status, executionId: 'different-execution' });
  const result = await reserve({}, store);
  assert.strictEqual(result.code, coordinator.FAILURE_CODES.EXECUTION_STATUS_CONFLICT);
});

for (const n of [1, 2, 3]) {
  test(`transaction failure at create ${n} rolls back all writes`, async () => {
    const store = new MemoryTransactionStore(); store.failOnCreateNumber = n;
    const result = await reserve({}, store);
    assert.strictEqual(result.ok, false);
    assert.strictEqual(result.code, coordinator.FAILURE_CODES.RESERVATION_TRANSACTION_FAILED);
    assert.strictEqual(store.records.size, 0);
    assert.strictEqual(store.committedCreates.length, 0);
    assert.strictEqual(store.rollbackCount, 1);
  });
}

test('identical concurrent requests have one deterministic winner', async () => {
  const store = new MemoryTransactionStore();
  const results = await Promise.all([reserve({}, store), reserve({}, store)]);
  assert.deepStrictEqual(results.map((result) => result.outcome).sort(), [coordinator.OUTCOMES.NEW_RESERVATION, coordinator.OUTCOMES.SAFE_IDEMPOTENT_REPLAY].sort());
  assert.strictEqual(store.records.size, 3);
  assert.strictEqual(store.committedCreates.length, 3);
});

test('same-key conflicting concurrent request fails deterministically', async () => {
  const store = new MemoryTransactionStore();
  const key = artifacts().idempotencyKey;
  const results = await Promise.all([
    reserve({}, store),
    reserve({ idempotencyKey: key, requestFingerprint: 'conflicting' }, store),
  ]);
  assert.strictEqual(results.filter((result) => result.outcome === coordinator.OUTCOMES.NEW_RESERVATION).length, 1);
  assert.strictEqual(results.filter((result) => result.code === coordinator.FAILURE_CODES.EXECUTION_IDEMPOTENCY_CONFLICT).length, 1);
  assert.strictEqual(store.records.size, 3);
});

test('authority revoked between preflight and transaction prevents commit', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store, [authoritySnapshot(), authoritySnapshot({ executorRegistry: executor({ revoked: true }) })]);
  assert.strictEqual(result.code, i2b1.FAILURE_CODES.EXECUTOR_REVOKED);
  assert.strictEqual(store.records.size, 0);
});

test('authority version changed between preflight and transaction prevents commit', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store, [authoritySnapshot(), authoritySnapshot({ executorRegistry: executor({ authorizationVersion: 'auth-v2' }) })]);
  assert.strictEqual(result.code, coordinator.FAILURE_CODES.AUTHORITY_VERSION_CHANGED);
  assert.strictEqual(store.records.size, 0);
});

test('server-time placeholders are used and local clock is not authoritative', async () => {
  const store = new MemoryTransactionStore(); const result = await reserve({}, store);
  assert.strictEqual(result.artifacts.documents.shell.createdAt.kind, i2b2a.SCHEMA_VERSIONS.serverTimePlaceholder);
  assert.strictEqual(result.artifacts.documents.status.updatedAt.kind, i2b2a.SCHEMA_VERSIONS.serverTimePlaceholder);
  const source = fs.readFileSync(require.resolve('./services/authority_intelligence/taught_content_execution_coordinator_i2b2b'), 'utf8');
  assert.strictEqual(/Date\.now|new Date|performance\.now/.test(source), false);
});

test('no Student writes occur', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  assert.strictEqual(store.committedCreates.some((item) => /student|catalog/i.test(item.path)), false);
});

test('no Founder writes occur', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  assert.strictEqual(store.committedCreates.some((item) => /founder/i.test(item.path)), false);
});

test('no evidence writes occur', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  assert.strictEqual(store.committedCreates.some((item) => /evidence/i.test(item.path)), false);
});

test('no projection writes occur', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  assert.strictEqual(store.committedCreates.some((item) => /projection/i.test(item.path)), false);
});

test('no claim runtime is exported or activated', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  assert.strictEqual(typeof coordinator.claimTeachingExecution, 'undefined');
});

test('no lease runtime is exported or activated', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  assert.strictEqual(typeof coordinator.renewTeachingExecution, 'undefined');
  assert.strictEqual(typeof coordinator.takeoverTeachingExecution, 'undefined');
});

test('reserved transaction does not advance runtime fencing', async () => {
  const store = new MemoryTransactionStore(); await reserve({}, store);
  const status = [...store.records.values()].find((value) => value.state === 'RESERVED');
  assert.strictEqual(status.fencingToken, 0);
  assert.strictEqual(status.leaseGeneration, 0);
});

test('non-server Founder/Student transport contexts are denied with zero writes', async () => {
  const store = new MemoryTransactionStore();
  const founder = await reserve({}, store, undefined, context({ serverOnly: false, requesterRole: 'FOUNDER' }));
  const student = await reserve({}, store, undefined, context({ serverOnly: false, requesterRole: 'STUDENT' }));
  assert.strictEqual(founder.code, i2b1.FAILURE_CODES.EXECUTOR_OPERATION_DENIED);
  assert.strictEqual(student.code, i2b1.FAILURE_CODES.EXECUTOR_OPERATION_DENIED);
  assert.strictEqual(store.records.size, 0);
});

test('mismatched authenticated executor context is denied', async () => {
  const store = new MemoryTransactionStore();
  const result = await reserve({}, store, undefined, context({ executorId: 'other-executor' }));
  assert.strictEqual(result.code, i2b1.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH);
  assert.strictEqual(store.records.size, 0);
});

let passed = 0;
(async () => {
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}: ${error.code || error.message}`); process.exitCode = 1; }
  }
  console.log(JSON.stringify({ total: tests.length, passed, failed: tests.length - passed }));
})();
