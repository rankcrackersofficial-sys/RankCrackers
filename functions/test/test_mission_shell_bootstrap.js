'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  assertBootstrapRequestReplay,
  assertExistingShellReplay,
  buildMissionShellBootstrapPlan,
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

test('requires distinct official notification and syllabus mode and canonical cycle year', () => {
  assert.throws(() => plan({ syllabusBindingMode: 'EMBEDDED' }), /REQUIRES_SEPARATE/);
  assert.throws(() => plan({ year: '2027-28' }), /CYCLE_KEY_INVALID/);
  assert.throws(() => plan({ requestId: 'x' }), /REQUEST_ID_INVALID/);
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
  assert.throws(() => assertExistingShellReplay({ ...current.realm, userPanelVisible: true }, current), /VISIBILITY_CONFLICT/);
});
