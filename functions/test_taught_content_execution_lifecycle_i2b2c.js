'use strict';

// R36 is intentionally offline.  This test file uses only deterministic
// in-memory transaction, authority and server-time fixtures.
const assert = require('assert');
const fs = require('fs');
const i1 = require('./services/authority_intelligence/taught_content_authority_i1');
const i2a = require('./services/authority_intelligence/taught_content_authority_i2a');
const i2b1 = require('./services/authority_intelligence/taught_content_executor_authorization_i2b1');
const i2b2a = require('./services/authority_intelligence/taught_content_reservation_foundation_i2b2a');
const coordinator = require('./services/authority_intelligence/taught_content_execution_coordinator_i2b2b');
const lifecycle = require('./services/authority_intelligence/taught_content_execution_lifecycle_i2b2c');

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

function context(workerInstanceId, overrides) {
  return {
    serverOnly: true, principalType: i2b1.PRINCIPAL_TYPE,
    executorId: 'executor-1', executorVersion: 'executor-v1', workerInstanceId,
    ...(overrides || {}),
  };
}

function deepClone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

class MemoryLifecycleStore {
  constructor() {
    this.records = new Map();
    this.attemptedUpdates = [];
    this.committedUpdates = [];
    this.rollbackCount = 0;
    this.failBeforeCommit = false;
    this.failOnUpdate = false;
    this.queue = Promise.resolve();
  }

  seed(path, document) { this.records.set(path, deepClone(document)); }
  read(path) { return deepClone(this.records.get(path) || null); }

  async runTransaction(callback) {
    const execute = async () => {
      const staged = new Map();
      const localUpdates = [];
      const tx = {
        get: async (path) => staged.has(path) ? deepClone(staged.get(path)) : deepClone(this.records.get(path) || null),
        update: async (path, patch, options) => {
          if (this.failOnUpdate) {
            const error = new Error('injected update failure'); error.code = 'INJECTED_UPDATE_FAILURE'; throw error;
          }
          const current = staged.has(path) ? staged.get(path) : this.records.get(path);
          if (!current) { const error = new Error('missing document'); error.code = 'NOT_FOUND'; throw error; }
          const expected = options && options.expected;
          if (expected && Object.keys(expected).some((key) => current[key] !== expected[key])) {
            const error = new Error('compare-and-set conflict'); error.code = 'CAS_CONFLICT'; throw error;
          }
          const next = { ...current, ...deepClone(patch) };
          localUpdates.push({ path, patch: deepClone(patch), expected: deepClone(expected) });
          this.attemptedUpdates.push({ path, patch: deepClone(patch), expected: deepClone(expected) });
          staged.set(path, next);
        },
      };
      try {
        const result = await callback(tx);
        if (this.failBeforeCommit) {
          const error = new Error('injected commit failure'); error.code = 'INJECTED_COMMIT_FAILURE'; throw error;
        }
        for (const item of localUpdates) {
          const current = staged.get(item.path);
          this.records.set(item.path, deepClone(current));
          this.committedUpdates.push(item);
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
  constructor(snapshots) {
    this.snapshots = Array.isArray(snapshots) ? snapshots : [snapshots];
    this.calls = 0;
  }
  async readCurrentReservationAuthority() {
    const index = Math.min(this.calls, this.snapshots.length - 1);
    this.calls += 1;
    return deepClone(this.snapshots[index]);
  }
}

class ServerTime {
  constructor(value) { this.value = value === undefined ? 1000000 : value; this.calls = 0; }
  set(value) { this.value = value; }
  async now() { this.calls += 1; return this.value; }
}

function makeEnvironment(options) {
  const value = options || {};
  const req = request(value.request);
  const seedSnapshot = authoritySnapshot();
  const snapshot = value.snapshots ? value.snapshots[0] : (value.authority ? authoritySnapshot(value.authority) : seedSnapshot);
  const registry = i2b2a.createExecutorRegistryReference(seedSnapshot.executorRegistry);
  const artifacts = coordinator.buildArtifacts(req, registry);
  const store = value.store || new MemoryLifecycleStore();
  const status = { ...artifacts.documents.status, ...(value.status || {}) };
  store.seed(artifacts.paths.reservation, artifacts.documents.reservation);
  store.seed(artifacts.paths.shell, artifacts.documents.shell);
  store.seed(artifacts.paths.status, status);
  const reader = new FixtureAuthorityReader(value.snapshots || snapshot);
  const clock = new ServerTime(value.now);
  return {
    request: req, snapshot, artifacts, store, reader, clock,
    dependencies: { transactionStore: store, authorityReader: reader, serverTime: clock },
  };
}

function claimInput(env, overrides) {
  return { request: env.request, expectedStatusVersion: 0, ...(overrides || {}) };
}

function renewInput(env, overrides) {
  return { request: env.request, expectedStatusVersion: 1, expectedFencingToken: 1, expectedLeaseGeneration: 1, ...(overrides || {}) };
}

function takeoverInput(env, overrides) {
  return { request: env.request, expectedStatusVersion: 1, expectedFencingToken: 1, expectedLeaseGeneration: 1, ...(overrides || {}) };
}

async function claim(env, worker, overrides) {
  return lifecycle.claimTeachingExecution(claimInput(env, overrides), context(worker), env.dependencies);
}

async function renew(env, worker, overrides) {
  return lifecycle.renewTeachingExecution(renewInput(env, overrides), context(worker), env.dependencies);
}

async function takeover(env, worker, overrides) {
  return lifecycle.takeoverTeachingExecution(takeoverInput(env, overrides), context(worker), env.dependencies);
}

function expectCode(result, code) {
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.code, code);
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// Claim: 1-10.
test('01 valid claim commits one status update', async () => {
  const e = makeEnvironment(); const r = await claim(e, 'worker-a');
  assert.strictEqual(r.ok, true); assert.strictEqual(r.outcome, lifecycle.OUTCOMES.CLAIMED);
  assert.strictEqual(e.store.committedUpdates.length, 1); assert.strictEqual(e.store.committedUpdates[0].path, e.artifacts.paths.status);
});
test('02 claim advances status version and fencing state', async () => {
  const e = makeEnvironment(); const r = await claim(e, 'worker-a');
  assert.deepStrictEqual({ state: r.status.state, statusVersion: r.status.statusVersion, fencingToken: r.status.fencingToken, leaseGeneration: r.status.leaseGeneration, leaseOwner: r.status.leaseOwner }, { state: 'CLAIMED', statusVersion: 1, fencingToken: 1, leaseGeneration: 1, leaseOwner: 'worker-a' });
});
test('03 claim records server-time acquisition and expiry', async () => {
  const e = makeEnvironment({ now: 123456 }); const r = await claim(e, 'worker-a');
  assert.strictEqual(r.status.leaseAcquiredAt, 123456); assert.strictEqual(r.status.leaseExpiresAt, 123456 + lifecycle.LEASE_DURATION_MS); assert.strictEqual(e.clock.calls, 1);
});
test('04 claim mutates status only', async () => {
  const e = makeEnvironment(); const before = e.store.read(e.artifacts.paths.shell); await claim(e, 'worker-a');
  assert.deepStrictEqual(e.store.read(e.artifacts.paths.shell), before); assert.strictEqual(e.store.committedUpdates.every((x) => x.path === e.artifacts.paths.status), true);
});
test('05 claim leaves immutable reservation unchanged', async () => {
  const e = makeEnvironment(); const before = e.store.read(e.artifacts.paths.reservation); await claim(e, 'worker-a');
  assert.deepStrictEqual(e.store.read(e.artifacts.paths.reservation), before);
});
test('06 double claim has one winner', async () => {
  const e = makeEnvironment(); const results = await Promise.all([claim(e, 'worker-a'), claim(e, 'worker-b')]);
  assert.strictEqual(results.filter((x) => x.ok).length, 1); assert.strictEqual(results.filter((x) => x.code === lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT).length, 1);
});
test('07 claim rejects stale expected status version', async () => { const e = makeEnvironment(); expectCode(await claim(e, 'worker-a', { expectedStatusVersion: 1 }), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('08 claim rejects terminal status', async () => { const e = makeEnvironment({ status: { terminal: true } }); expectCode(await claim(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('09 claim rejects missing status document', async () => { const e = makeEnvironment(); e.store.records.delete(e.artifacts.paths.status); expectCode(await claim(e, 'worker-a'), lifecycle.FAILURE_CODES.I2B2_IDENTITY_MISMATCH); });
test('10 claim requires worker context', async () => { const e = makeEnvironment(); const r = await lifecycle.claimTeachingExecution(claimInput(e), context(undefined), e.dependencies); expectCode(r, i2b1.FAILURE_CODES.EXECUTOR_IDENTITY_MISMATCH); });

// Renewal: 11-23.
test('11 valid renewal commits status-only update', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); e.clock.set(1100000); const r = await renew(e, 'worker-a'); assert.strictEqual(r.ok, true); assert.strictEqual(r.outcome, lifecycle.OUTCOMES.RENEWED); });
test('12 renewal increments only status version', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); const r = await renew(e, 'worker-a'); assert.strictEqual(r.status.statusVersion, 2); assert.strictEqual(r.status.fencingToken, 1); assert.strictEqual(r.status.leaseGeneration, 1); });
test('13 renewal extends lease by full duration', async () => { const e = makeEnvironment({ now: 1000000 }); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt - 200001); const r = await renew(e, 'worker-a'); assert.strictEqual(r.status.leaseExpiresAt, e.clock.value + lifecycle.LEASE_DURATION_MS); });
test('14 renewal rejects wrong owner', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); expectCode(await renew(e, 'worker-b'), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('15 renewal rejects wrong fencing token', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); expectCode(await renew(e, 'worker-a', { expectedFencingToken: 2 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('16 renewal rejects wrong lease generation', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); expectCode(await renew(e, 'worker-a', { expectedLeaseGeneration: 2 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('17 renewal rejects wrong status version', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); expectCode(await renew(e, 'worker-a', { expectedStatusVersion: 0 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('18 renewal succeeds before deadline', async () => { const e = makeEnvironment({ now: 1000000 }); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt - lifecycle.RENEWAL_GRACE_MS - 1); assert.strictEqual((await renew(e, 'worker-a')).ok, true); });
test('19 renewal rejects at exact deadline', async () => { const e = makeEnvironment({ now: 1000000 }); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt - lifecycle.RENEWAL_GRACE_MS); expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('20 renewal rejects after expiry', async () => { const e = makeEnvironment({ now: 1000000 }); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt + 1); expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('21 renewal rejects terminal state', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); e.store.records.get(e.artifacts.paths.status).terminal = true; expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('22 authority revocation during lease blocks renewal', async () => { const valid = authoritySnapshot(); const e = makeEnvironment({ snapshots: [valid, valid, valid, authoritySnapshot({ executorRegistry: executor({ revoked: true }) })] }); await claim(e, 'worker-a'); expectCode(await renew(e, 'worker-a'), i2b1.FAILURE_CODES.EXECUTOR_REVOKED); });
test('23 authority version change during lease blocks renewal', async () => { const valid = authoritySnapshot(); const e = makeEnvironment({ snapshots: [valid, valid, valid, authoritySnapshot({ executorRegistry: executor({ authorizationVersion: 'auth-v2' }) })] }); await claim(e, 'worker-a'); expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.AUTHORITY_VERSION_CHANGED); });

// Takeover: 24-32.
test('24 valid expired takeover commits', async () => { const e = makeEnvironment({ now: 1000000 }); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const r = await takeover(e, 'worker-b'); assert.strictEqual(r.ok, true); assert.strictEqual(r.outcome, lifecycle.OUTCOMES.TAKEN_OVER); });
test('25 takeover increments lease generation', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const r = await takeover(e, 'worker-b'); assert.strictEqual(r.status.leaseGeneration, 2); assert.strictEqual(r.status.statusVersion, 2); });
test('26 takeover increments fencing token', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const r = await takeover(e, 'worker-b'); assert.strictEqual(r.status.fencingToken, 2); });
test('27 takeover replaces owner with replacement worker', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const r = await takeover(e, 'worker-b'); assert.strictEqual(r.status.leaseOwner, 'worker-b'); });
test('28 takeover before expiry is rejected', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); expectCode(await takeover(e, 'worker-b'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('29 same worker cannot use takeover as renewal', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); expectCode(await takeover(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('30 takeover rejects stale expected fence', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); expectCode(await takeover(e, 'worker-b', { expectedFencingToken: 2 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('31 revoked authority blocks takeover', async () => { const valid = authoritySnapshot(); const e = makeEnvironment({ snapshots: [valid, valid, valid, authoritySnapshot({ executorRegistry: executor({ revoked: true }) })] }); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); expectCode(await takeover(e, 'worker-b'), i2b1.FAILURE_CODES.EXECUTOR_REVOKED); });
test('32 takeover writes status only', async () => { const e = makeEnvironment(); const shell = e.store.read(e.artifacts.paths.shell); const reservation = e.store.read(e.artifacts.paths.reservation); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); await takeover(e, 'worker-b'); assert.deepStrictEqual(e.store.read(e.artifacts.paths.shell), shell); assert.deepStrictEqual(e.store.read(e.artifacts.paths.reservation), reservation); assert.strictEqual(e.store.committedUpdates.every((x) => x.path === e.artifacts.paths.status), true); });

// Stale workers: 33-37.
test('33 old owner fails after takeover', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const t = await takeover(e, 'worker-b'); expectCode(await renew(e, 'worker-a', { expectedStatusVersion: t.status.statusVersion, expectedFencingToken: t.status.fencingToken, expectedLeaseGeneration: t.status.leaseGeneration }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('34 old fencing token fails after takeover', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); await takeover(e, 'worker-b'); expectCode(await renew(e, 'worker-b', { expectedFencingToken: 1 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('35 old generation fails after takeover', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); await takeover(e, 'worker-b'); expectCode(await renew(e, 'worker-b', { expectedLeaseGeneration: 1 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('36 old status version fails after takeover', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); await takeover(e, 'worker-b'); expectCode(await renew(e, 'worker-b', { expectedStatusVersion: 1 }), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });
test('37 terminal worker state fails closed', async () => { const e = makeEnvironment({ status: { terminal: true, state: 'CLAIMED', statusVersion: 1, fencingToken: 1, leaseGeneration: 1, leaseOwner: 'worker-a', leaseExpiresAt: 2000000 } }); expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });

// Authority: 38-46.
test('38 inactive executor blocks claim', async () => { const e = makeEnvironment({ authority: { executorRegistry: executor({ active: false }) } }); expectCode(await claim(e, 'worker-a'), i2b1.FAILURE_CODES.EXECUTOR_INACTIVE); });
test('39 revoked executor blocks claim', async () => { const e = makeEnvironment({ authority: { executorRegistry: executor({ revoked: true }) } }); expectCode(await claim(e, 'worker-a'), i2b1.FAILURE_CODES.EXECUTOR_REVOKED); });
test('40 realm scope change blocks claim', async () => { const e = makeEnvironment({ authority: { executorRegistry: executor({ allowedRealmIds: ['other'] }) } }); expectCode(await claim(e, 'worker-a'), i2b1.FAILURE_CODES.EXECUTOR_REALM_DENIED); });
test('41 mission scope change blocks claim', async () => { const e = makeEnvironment({ authority: { executorRegistry: executor({ allowedMissionIds: ['other'] }) } }); expectCode(await claim(e, 'worker-a'), i2b1.FAILURE_CODES.EXECUTOR_MISSION_DENIED); });
test('42 subject scope change blocks claim', async () => { const e = makeEnvironment({ authority: { executorRegistry: executor({ allowedSubjectIds: ['other'] }) } }); expectCode(await claim(e, 'worker-a'), i2b1.FAILURE_CODES.EXECUTOR_SUBJECT_DENIED); });
test('43 teacher revocation blocks claim', async () => { const e = makeEnvironment({ authority: { teacher: { ...authoritySnapshot().teacher, status: 'REVOKED' } } }); expectCode(await claim(e, 'worker-a'), i1.FAILURE_CODES.TEACHER_AUTHORITY_INVALID); });
test('44 pedagogy revocation blocks claim', async () => { const e = makeEnvironment({ authority: { pedagogy: { ...authoritySnapshot().pedagogy, status: 'REVOKED' } } }); expectCode(await claim(e, 'worker-a'), i1.FAILURE_CODES.PEDAGOGY_AUTHORITY_INVALID); });
test('45 atom verification failure blocks claim', async () => { const e = makeEnvironment({ authority: { atom: { verified: false, syllabusAtomId: 'atom-1', syllabusVersion: 'atom-v1' } } }); expectCode(await claim(e, 'worker-a'), i1.FAILURE_CODES.ATOM_NOT_VERIFIED); });
test('46 material version mismatch blocks claim', async () => { const e = makeEnvironment({ authority: { material: { materialId: 'material-1', version: 'material-v2', contentHash: 'A'.repeat(64) } } }); expectCode(await claim(e, 'worker-a'), i1.FAILURE_CODES.MATERIAL_VERSION_MISMATCH); });

// Races: 47-50.
test('47 concurrent claims have one CAS winner', async () => { const e = makeEnvironment(); const results = await Promise.all([claim(e, 'worker-a'), claim(e, 'worker-b')]); assert.strictEqual(results.filter((x) => x.ok).length, 1); assert.strictEqual(e.store.committedUpdates.length, 1); });
test('48 concurrent expired takeovers have one CAS winner', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const results = await Promise.all([takeover(e, 'worker-b'), takeover(e, 'worker-c')]); assert.strictEqual(results.filter((x) => x.ok).length, 1); assert.strictEqual(e.store.committedUpdates.length, 2); });
test('49 renewal wins a pre-expiry race and takeover observes live lease', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt - 300000); const results = await Promise.all([renew(e, 'worker-a'), takeover(e, 'worker-b')]); assert.strictEqual(results[0].ok, true); assert.strictEqual(results[1].ok, false); });
test('50 takeover wins an expired race and renewal becomes stale', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const results = await Promise.all([renew(e, 'worker-a'), takeover(e, 'worker-b')]); assert.strictEqual(results.filter((x) => x.ok).length, 1); assert.strictEqual(results.filter((x) => x.outcome === lifecycle.OUTCOMES.TAKEN_OVER).length, 1); });

// Time and boundary invariants: 51-60.
test('51 claim uses injected server time only', async () => { const e = makeEnvironment({ now: 777777 }); const r = await claim(e, 'worker-a'); assert.strictEqual(r.status.updatedAt, 777777); });
test('52 lifecycle source has no local clock authority', async () => { const source = fs.readFileSync(require.resolve('./services/authority_intelligence/taught_content_execution_lifecycle_i2b2c'), 'utf8'); assert.strictEqual(/Date\.now|new Date|performance\.now/.test(source), false); });
test('53 server-time provider is called inside each transaction', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); assert.strictEqual(e.clock.calls, 1); });
test('54 takeover at exact expiry is allowed', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); assert.strictEqual((await takeover(e, 'worker-b')).ok, true); });
test('55 renewal one millisecond before deadline is allowed', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt - lifecycle.RENEWAL_GRACE_MS - 1); assert.strictEqual((await renew(e, 'worker-a')).ok, true); });
test('56 renewal at deadline is rejected', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt - lifecycle.RENEWAL_GRACE_MS); expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('57 renewal one millisecond after expiry is rejected', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt + 1); expectCode(await renew(e, 'worker-a'), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('58 lease constants match accepted contract', async () => { assert.strictEqual(lifecycle.LEASE_DURATION_MS, 900000); assert.strictEqual(lifecycle.RENEWAL_INTERVAL_MS, 300000); assert.strictEqual(lifecycle.RENEWAL_DEADLINE_MS, 780000); });
test('59 claim requires expected status version', async () => { const e = makeEnvironment(); expectCode(await lifecycle.claimTeachingExecution({ request: e.request }, context('worker-a'), e.dependencies), lifecycle.FAILURE_CODES.EXECUTION_STATUS_CONFLICT); });
test('60 renewal requires expected fence and generation', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); expectCode(await lifecycle.renewTeachingExecution({ request: e.request, expectedStatusVersion: 1 }, context('worker-a'), e.dependencies), lifecycle.FAILURE_CODES.EXECUTION_FENCE_STALE); });

// Additional self-attack and safety cases: 61-70.
test('61 failed commit rolls back staged status update', async () => { const e = makeEnvironment(); const before = e.store.read(e.artifacts.paths.status); e.store.failBeforeCommit = true; const r = await claim(e, 'worker-a'); assert.strictEqual(r.ok, false); assert.deepStrictEqual(e.store.read(e.artifacts.paths.status), before); assert.strictEqual(e.store.committedUpdates.length, 0); assert.strictEqual(e.store.rollbackCount, 1); });
test('62 failed update rolls back with no committed writes', async () => { const e = makeEnvironment(); e.store.failOnUpdate = true; const r = await claim(e, 'worker-a'); assert.strictEqual(r.ok, false); assert.strictEqual(e.store.committedUpdates.length, 0); assert.strictEqual(e.store.rollbackCount, 1); });
test('63 missing update API fails closed', async () => { const e = makeEnvironment(); const broken = { runTransaction: async (callback) => callback({ get: (path) => e.store.read(path) }) }; const direct = await lifecycle.claimTeachingExecution(claimInput(e), context('worker-a'), { transactionStore: broken, authorityReader: e.reader, serverTime: e.clock }); expectCode(direct, lifecycle.FAILURE_CODES.LIFECYCLE_DEPENDENCY_INVALID); });
test('64 no event documents are written by lifecycle', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); assert.strictEqual([...e.store.records.keys()].some((x) => /event|outbox/i.test(x)), false); });
test('65 no Student paths are written', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); assert.strictEqual(e.store.committedUpdates.some((x) => /student|catalog/i.test(x.path)), false); });
test('66 no Founder or Domain-C paths are written', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); assert.strictEqual(e.store.committedUpdates.some((x) => /founder|evidence|projection|completion/i.test(x.path)), false); });
test('67 response preserves deterministic execution identity', async () => { const e = makeEnvironment(); const r = await claim(e, 'worker-a'); assert.strictEqual(r.executionId, e.artifacts.executionId); });
test('68 replacement worker receives a fresh lease owner', async () => { const e = makeEnvironment(); const c = await claim(e, 'worker-a'); e.clock.set(c.status.leaseExpiresAt); const r = await takeover(e, 'worker-b'); assert.notStrictEqual(r.status.leaseOwner, c.status.leaseOwner); });
test('69 authority is revalidated before and inside transaction', async () => { const e = makeEnvironment(); await claim(e, 'worker-a'); assert.strictEqual(e.reader.calls, 2); });
test('70 unknown transaction failure is not treated as success', async () => { const e = makeEnvironment(); e.store.failBeforeCommit = true; const r = await claim(e, 'worker-a'); assert.strictEqual(r.committed, false); assert.strictEqual(r.ok, false); });

let passed = 0;
(async () => {
  for (const item of tests) {
    try { await item.fn(); passed += 1; console.log(`PASS ${item.name}`); }
    catch (error) { console.error(`FAIL ${item.name}: ${error.code || error.message}`); process.exitCode = 1; }
  }
  console.log(JSON.stringify({ total: tests.length, passed, failed: tests.length - passed }));
})();
