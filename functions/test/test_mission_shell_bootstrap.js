'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assertBootstrapRequestReplay,
  assertExistingShellReplay,
  buildMissionShellBootstrapPlan,
  executeMissionShellBootstrap,
} = require('../services/mission_shell_bootstrap');

const payload = {
  requestId: 'codex-ssc-cgl-2027-01',
  examName: 'SSC CGL',
  examCategory: 'government',
  organization: 'Staff Selection Commission',
  authorityKey: 'auth_in_ssc',
  jurisdictionLevel: 'CENTRAL',
  syllabusBindingMode: 'SEPARATE',
  year: '2027',
};

function fakeStore(seed = {}) {
  const docs = new Map(Object.entries(seed));
  const writes = [];
  const db = { collection: name => ({ doc: id => ({ path: `${name}/${id}` }) }) };
  const transaction = {
    async get(ref) {
      const value = docs.get(ref.path);
      return { exists: value !== undefined, data: () => value };
    },
    create(ref, value) {
      if (docs.has(ref.path)) throw new Error('ALREADY_EXISTS');
      writes.push(ref.path);
      docs.set(ref.path, value);
    },
  };
  return { db, transaction, docs, writes };
}

function plan(overrides = {}) {
  return buildMissionShellBootstrapPlan({
    payload: { ...payload, ...overrides },
    actorId: 'founder-1',
    recordedAt: '2026-10-11T08:00:00.000Z',
  });
}

test('creates a canonical passive shell, records the intended cycle, and leaves sources absent', () => {
  const result = plan();
  assert.equal(result.missionId, 'ssc_cgl');
  assert.equal(result.cycleKey, '2027');
  assert.equal(result.realm.status, 'PASSIVE');
  assert.equal(result.realm.studentVisible, false);
  assert.equal(result.realm.userPanelVisible, false);
  assert.equal(result.realm.cardVisible, false);
  assert.equal(result.realm.missionSetupStatus, 'AWAITING_OFFICIAL_SOURCE_PAIR');
  assert.equal(result.realm.missionSetup.sourcePairStatus, 'MISSING');
  assert.equal(result.realm.missionSetup.sourcePairRequired, true);
  assert.equal(result.realm.cycles, undefined);
});

test('same idempotency request is stable; changed identity or cycle gets a different setup digest', () => {
  assert.equal(plan().setupDigest, plan().setupDigest);
  assert.notEqual(plan({ year: '2028' }).setupDigest, plan().setupDigest);
  assert.throws(() => plan({ missionId: 'ssc_cgl_other' }), /CANONICAL_ID_MISMATCH/);
});

test('supports governed separate or embedded source binding and canonical cycle year', () => {
  assert.equal(plan({ syllabusBindingMode: 'EMBEDDED' }).realm.missionSetup.syllabusBindingMode, 'EMBEDDED');
  assert.throws(() => plan({ syllabusBindingMode: 'PENDING' }), /SOURCE_BINDING_MODE_UNSUPPORTED|BINDING_MODE/);
  assert.throws(() => plan({ year: '2027-28' }), /CYCLE_KEY_INVALID/);
  assert.throws(() => plan({ requestId: 'x' }), /REQUEST_ID_INVALID/);

  const regional = {
    ...payload,
    requestId: 'rpsc-ras-2027-01',
    examName: 'RPSC RAS – Prelims',
    organization: 'Rajasthan Public Service Commission',
    authorityKey: 'auth_in_rj_rpsc',
    jurisdictionLevel: 'STATE',
    stateCode: 'RJ',
  };
  assert.equal(buildMissionShellBootstrapPlan({
    payload: regional,
    actorId: 'founder-1',
    recordedAt: '2026-10-11T08:00:00.000Z',
  }).missionId, 'rpsc_ras_prelims');
  assert.throws(() => buildMissionShellBootstrapPlan({
    payload: { ...regional, stateCode: 'UP' },
    actorId: 'founder-1',
    recordedAt: '2026-10-11T08:00:00.000Z',
  }), /AUTHORITY_STATE_MISMATCH/);
});

test('request replay must match exactly', () => {
  const current = plan();
  assert.equal(assertBootstrapRequestReplay(current.requestRecord, current), true);
  assert.throws(() => assertBootstrapRequestReplay({ ...current.requestRecord, identityDigest: 'wrong' }, current), /IDEMPOTENCY_CONFLICT/);
});

test('existing shell can only be reused for the exact hidden bootstrap identity', () => {
  const current = plan();
  assert.equal(assertExistingShellReplay(current.realm, current), true);
  assert.throws(() => assertExistingShellReplay({ ...current.realm, missionSetup: {} }, current), /REUSE_REVIEW/);
  assert.throws(() => assertExistingShellReplay({ ...current.realm, studentVisible: true }, current), /VISIBILITY_CONFLICT/);
  assert.throws(() => assertExistingShellReplay({ ...current.realm, catalogVisible: true }, current), /VISIBILITY_CONFLICT/);
  assert.throws(() => assertExistingShellReplay({ ...current.realm, userPanelVisible: true }, current), /VISIBILITY_CONFLICT/);
  assert.throws(() => assertExistingShellReplay({ ...current.realm, catalogDiscoverable: true }, current), /VISIBILITY_CONFLICT/);
});

test('transaction creates hidden shell and idempotency record exactly once', async () => {
  const store = fakeStore({ 'users/founder-1': { status: 'ACTIVE' } });
  const auth = { uid: 'founder-1', token: { founder: true } };
  const args = { transaction: store.transaction, db: store.db, payload, auth, recordedAt: '2026-10-11T08:00:00.000Z' };
  const created = await executeMissionShellBootstrap(args);
  assert.equal(created.idempotent, false);
  assert.deepEqual(new Set(store.writes), new Set([
    `mission_realms/${created.missionId}`,
    `mission_bootstrap_requests/${plan().requestKeyHash}`,
  ]));
  const replay = await executeMissionShellBootstrap(args);
  assert.equal(replay.idempotent, true);
  assert.equal(store.writes.length, 2);
});

test('inactive founder and reused request with changed cycle fail before writes', async () => {
  const inactive = fakeStore({ 'users/founder-1': { status: 'DISABLED' } });
  await assert.rejects(
    () => executeMissionShellBootstrap({
      transaction: inactive.transaction, db: inactive.db, payload,
      auth: { uid: 'founder-1', token: { founder: true } }, recordedAt: 'now',
    }),
    /ACCOUNT_INACTIVE/,
  );
  assert.equal(inactive.writes.length, 0);

  const unauthorized = fakeStore({ 'users/founder-1': { status: 'ACTIVE' } });
  await assert.rejects(
    () => executeMissionShellBootstrap({
      transaction: unauthorized.transaction, db: unauthorized.db, payload,
      auth: { uid: 'founder-1', token: { founder: false } }, recordedAt: 'now',
    }),
    /PERMISSION_DENIED/,
  );
  assert.equal(unauthorized.writes.length, 0);

  const store = fakeStore({ 'users/founder-1': { status: 'ACTIVE' } });
  const auth = { uid: 'founder-1', token: { founder: true } };
  const args = { transaction: store.transaction, db: store.db, payload, auth, recordedAt: 'now' };
  await executeMissionShellBootstrap(args);
  await assert.rejects(
    () => executeMissionShellBootstrap({ ...args, payload: { ...payload, year: '2028' } }),
    /IDEMPOTENCY_CONFLICT/,
  );
  assert.equal(store.writes.length, 2);
});

test('existing mission with unrelated or visible authority is never overwritten', async () => {
  const current = plan();
  const store = fakeStore({
    'users/founder-1': { status: 'ACTIVE' },
    [`mission_realms/${current.missionId}`]: { ...current.realm, missionSetup: undefined, userPanelVisible: true },
  });
  await assert.rejects(
    () => executeMissionShellBootstrap({
      transaction: store.transaction, db: store.db, payload,
      auth: { uid: 'founder-1', token: { founder: true } }, recordedAt: 'now',
    }),
    /REUSE_REVIEW/,
  );
  assert.equal(store.writes.length, 0);

  const visibleStudent = fakeStore({
    'users/founder-1': { status: 'ACTIVE' },
    [`mission_realms/${current.missionId}`]: { ...current.realm, studentVisible: true },
  });
  await assert.rejects(
    () => executeMissionShellBootstrap({
      transaction: visibleStudent.transaction, db: visibleStudent.db, payload,
      auth: { uid: 'founder-1', token: { founder: true } }, recordedAt: 'now',
    }),
    /VISIBILITY_CONFLICT/,
  );
  assert.equal(visibleStudent.writes.length, 0);

  const visibleCatalog = fakeStore({
    'users/founder-1': { status: 'ACTIVE' },
    [`mission_realms/${current.missionId}`]: { ...current.realm, catalogVisible: true },
  });
  await assert.rejects(
    () => executeMissionShellBootstrap({
      transaction: visibleCatalog.transaction, db: visibleCatalog.db, payload,
      auth: { uid: 'founder-1', token: { founder: true } }, recordedAt: 'now',
    }),
    /VISIBILITY_CONFLICT/,
  );
  assert.equal(visibleCatalog.writes.length, 0);
});
