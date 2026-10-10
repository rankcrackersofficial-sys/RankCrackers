'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const {Firestore, FieldValue, Timestamp} = require('@google-cloud/firestore');
const i2a = require('./services/authority_intelligence/taught_content_authority_i2a');
const i2b1 = require('./services/authority_intelligence/taught_content_executor_authorization_i2b1');
const i2b2a = require('./services/authority_intelligence/taught_content_reservation_foundation_i2b2a');
const coordinator = require('./services/authority_intelligence/taught_content_execution_coordinator_i2b2b');
const lifecycle = require('./services/authority_intelligence/taught_content_execution_lifecycle_i2b2c');
const adapterModule = require('./services/authority_intelligence/taught_content_firestore_adapter_i2b2d');

const db = new Firestore({projectId: 'r39-i2b2d', host: '127.0.0.1', port: 8188, ssl: false});
let fixtureNumber = 0;
const results = [];
const runTag = process.env.R39_RUN_TAG || 'local';

function pass(name, detail) {
  results.push({name, result: 'PASS', detail: detail || ''});
}

async function check(name, fn) {
  try {
    await fn();
    pass(name);
  } catch (error) {
    results.push({name, result: 'FAIL', code: error.code || 'ASSERTION_FAILED', detail: error.message});
  }
}

function fixture(label, dbOverride, authorityOverride) {
  const suffix = `${runTag}-${label}-${++fixtureNumber}`;
  const realmId = `r39-${suffix}`;
  const subjectId = `subject-${suffix}`;
  const identity = i2a.createMissionRealmIdentity({
    missionId: realmId,
    realmId,
    sourceMissionId: realmId,
    sourceType: 'mission_realms',
    missionRealmPath: `mission_realms/${realmId}`,
    missionIdentityVersion: 'identity-v1',
  });
  const request = {
    missionIdentity: identity,
    realmId,
    missionId: realmId,
    subjectId,
    syllabusAtomId: 'atom-1',
    syllabusVersion: 'atom-v1',
    syllabusCanonicalKey: `${realmId}.atom-1`,
    materialId: 'material-1',
    materialVersion: 'material-v1',
    materialHash: 'A'.repeat(64),
    teacherAuthorityId: 'teacher-1',
    teacherAuthorityVersion: 'teacher-v1',
    pedagogyId: 'pedagogy-1',
    pedagogyVersion: 'pedagogy-v1',
    pedagogyHash: 'B'.repeat(64),
    executorId: 'executor-1',
    executorVersion: 'executor-v1',
    requestedAction: i2b2a.RESERVE_OPERATION,
  };
  const snapshot = {
    executorRegistry: {
      executorId: 'executor-1',
      executorVersion: 'executor-v1',
      authorizationVersion: 'auth-v1',
      issuerId: 'issuer-1',
      principalType: i2b1.PRINCIPAL_TYPE,
      active: true,
      revoked: false,
      allowedOperations: [i2b2a.RESERVE_OPERATION],
      allowedRealmIds: [realmId],
      allowedMissionIds: [realmId],
      allowedSubjectIds: [subjectId],
    },
    mission: {active: true, identity},
    atom: {verified: true, syllabusAtomId: 'atom-1', syllabusVersion: 'atom-v1'},
    material: {materialId: 'material-1', version: 'material-v1', contentHash: 'A'.repeat(64)},
    teacher: {authorityId: 'teacher-1', version: 'teacher-v1', subjectId, missionId: realmId, status: 'ACTIVE'},
    pedagogy: {pedagogyId: 'pedagogy-1', version: 'pedagogy-v1', pedagogyHash: 'B'.repeat(64), subjectId, teacherAuthorityId: 'teacher-1', status: 'ACTIVE'},
    ...(authorityOverride || {}),
  };
  const state = {snapshot};
  const authorityReader = {readCurrentReservationAuthority: async () => state.snapshot};
  const adapter = adapterModule.createAdapter({db: dbOverride || db, FieldValue, authorityReader});
  const context = workerInstanceId => ({
    serverOnly: true,
    principalType: i2b1.PRINCIPAL_TYPE,
    executorId: 'executor-1',
    executorVersion: 'executor-v1',
    workerInstanceId: workerInstanceId || 'worker-1',
  });
  return {realmId, subjectId, identity, request, state, adapter, context};
}

function statusArtifacts(fx) {
  const registry = i2b2a.createExecutorRegistryReference(fx.state.snapshot.executorRegistry);
  return coordinator.buildArtifacts(fx.request, registry);
}

async function documentData(path) {
  const snapshot = await db.doc(path).get();
  return snapshot.exists ? snapshot.data() : null;
}

function lifecycleInput(fx, status, owner) {
  return {
    request: fx.request,
    expectedStatusVersion: status.statusVersion,
    expectedFencingToken: status.fencingToken,
    expectedLeaseGeneration: status.leaseGeneration,
    expectedLeaseOwner: owner === undefined ? status.leaseOwner : owner,
  };
}

function dbAfterFirstCommit(after) {
  let count = 0;
  return {
    doc: path => db.doc(path),
    runTransaction: async (callback, options) => {
      const result = await db.runTransaction(callback, options);
      count += 1;
      if (count === 1) await after();
      return result;
    },
  };
}

function dbFaultOnCreate(createNumber) {
  return {
    doc: path => db.doc(path),
    runTransaction: async (callback, options) => db.runTransaction(raw => {
      let count = 0;
      const tx = {
        get: ref => raw.get(ref),
        create: (ref, data) => {
          count += 1;
          if (count === createNumber) {
            const error = new Error(`synthetic create failure ${createNumber}`);
            error.code = 'R39_INJECTED_CREATE_FAILURE';
            throw error;
          }
          return raw.create(ref, data);
        },
        set: (ref, data, setOptions) => raw.set(ref, data, setOptions),
        update: (ref, patch) => raw.update(ref, patch),
        delete: ref => raw.delete(ref),
      };
      return callback(tx);
    }, options),
  };
}

async function expectCode(action, code) {
  let caught = null;
  try { await action(); } catch (error) { caught = error; }
  assert.ok(caught, `expected ${code} but operation succeeded`);
  assert.equal(caught.code, code);
}

async function main() {
  const adapterSource = fs.readFileSync(require.resolve('./services/authority_intelligence/taught_content_firestore_adapter_i2b2d'), 'utf8');
  assert.equal(/Date\.now\s*\(|Timestamp\.now\s*\(|new Date\s*\(/.test(adapterSource), false);
  pass('adapter_has_no_local_clock_authority');
  assert.equal(/admin\.initializeApp\s*\(/.test(adapterSource), false);
  pass('adapter_does_not_initialize_firebase');

  await check('valid_atomic_reservation_commits_three_records', async () => {
    const fx = fixture('reservation');
    const result = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    assert.equal(result.ok, true);
    assert.equal(result.outcome, coordinator.OUTCOMES.NEW_RESERVATION);
    assert.equal((await documentData(result.artifacts.paths.reservation)) !== null, true);
    assert.equal((await documentData(result.artifacts.paths.shell)) !== null, true);
    assert.equal((await documentData(result.artifacts.paths.status)) !== null, true);
  });

  await check('reservation_safe_replay_has_no_duplicate_writes', async () => {
    const fx = fixture('replay');
    const first = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const second = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    assert.equal(first.ok, true);
    assert.equal(second.outcome, coordinator.OUTCOMES.SAFE_IDEMPOTENT_REPLAY);
    assert.equal(second.committed, false);
  });

  await check('reservation_same_key_conflict_fails_closed', async () => {
    const fx = fixture('key-conflict');
    const first = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const result = await fx.adapter.reserveTeachingExecution({
      ...fx.request,
      idempotencyKey: first.artifacts.idempotencyKey,
      requestFingerprint: 'conflicting-fingerprint',
    }, fx.context());
    assert.equal(result.ok, false);
    assert.equal(result.code, coordinator.FAILURE_CODES.EXECUTION_IDEMPOTENCY_CONFLICT);
  });

  await check('reservation_partial_state_fails_closed', async () => {
    const fx = fixture('partial');
    const artifacts = statusArtifacts(fx);
    await db.doc(artifacts.paths.status).create(artifacts.documents.status);
    const result = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    assert.equal(result.ok, false);
    assert.equal(result.code, coordinator.FAILURE_CODES.EXECUTION_STATUS_CONFLICT);
    assert.equal((await documentData(artifacts.paths.reservation)) === null, true);
  });

  for (const createNumber of [1, 2, 3]) {
    await check(`reservation_rollback_create_${createNumber}`, async () => {
      const fx = fixture(`rollback-${createNumber}`, dbFaultOnCreate(createNumber));
      const artifacts = statusArtifacts(fx);
      const result = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
      assert.equal(result.ok, false);
      assert.equal((await documentData(artifacts.paths.reservation)) === null, true);
      assert.equal((await documentData(artifacts.paths.shell)) === null, true);
      assert.equal((await documentData(artifacts.paths.status)) === null, true);
    });
  }

  await check('time_intent_server_timestamp_resolves', async () => {
    const fx = fixture('intent-resolution');
    const intent = await fx.adapter.createLifecycleTimeIntent('claim', {request: fx.request, expectedStatusVersion: 0}, fx.context());
    assert.equal(intent.authoritativeTime instanceof Timestamp, true);
    assert.equal(Number.isFinite(intent.authoritativeTimeMs), true);
    assert.equal(intent.created, true);
  });

  await check('time_intent_is_deterministic_and_replayed', async () => {
    const fx = fixture('intent-replay');
    const input = {request: fx.request, expectedStatusVersion: 0};
    const first = await fx.adapter.createLifecycleTimeIntent('claim', input, fx.context());
    const second = await fx.adapter.createLifecycleTimeIntent('claim', input, fx.context());
    assert.equal(first.path, second.path);
    assert.equal(first.document.intentId, second.document.intentId);
    assert.equal(second.created, false);
    assert.equal(second.authoritativeTimeMs, first.authoritativeTimeMs);
  });

  await check('conflicting_existing_intent_fails_closed', async () => {
    const fx = fixture('intent-conflict');
    const input = {request: fx.request, expectedStatusVersion: 0};
    const first = await fx.adapter.createLifecycleTimeIntent('claim', input, fx.context());
    await db.doc(first.path).update({immutableFingerprint: 'tampered'});
    await expectCode(() => fx.adapter.createLifecycleTimeIntent('claim', input, fx.context()), adapterModule.FAILURE_CODES.LIFECYCLE_TIME_INTENT_CONFLICT);
  });

  await check('unresolved_intent_timestamp_fails_closed', async () => {
    const fx = fixture('intent-unresolved');
    const first = await fx.adapter.createLifecycleTimeIntent('claim', {request: fx.request, expectedStatusVersion: 0}, fx.context());
    await db.doc(first.path).set({...first.document, authoritativeTime: {kind: 'UNRESOLVED_SERVER_TIMESTAMP'}});
    await expectCode(() => fx.adapter.readResolvedLifecycleTimeIntent(first.path), adapterModule.FAILURE_CODES.LIFECYCLE_TIME_UNRESOLVED);
  });

  await check('malformed_intent_timestamp_fails_closed', async () => {
    const fx = fixture('intent-malformed');
    const first = await fx.adapter.createLifecycleTimeIntent('claim', {request: fx.request, expectedStatusVersion: 0}, fx.context());
    await db.doc(first.path).set({...first.document, authoritativeTime: {seconds: 'not-a-timestamp'}});
    await expectCode(() => fx.adapter.readResolvedLifecycleTimeIntent(first.path), adapterModule.FAILURE_CODES.LIFECYCLE_TIME_UNRESOLVED);
  });

  await check('phase_one_intent_grants_no_claim_authority', async () => {
    const fx = fixture('abandoned');
    const reservation = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    await fx.adapter.createLifecycleTimeIntent('claim', {request: fx.request, expectedStatusVersion: 0}, fx.context());
    const status = await documentData(reservation.artifacts.paths.status);
    assert.equal(status.state, lifecycle.STATES.RESERVED);
    assert.equal(status.statusVersion, 0);
    assert.equal(status.fencingToken, 0);
  });

  await check('abandoned_intent_retry_does_not_deadlock', async () => {
    const fx = fixture('abandoned-retry');
    await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const input = {request: fx.request, expectedStatusVersion: 0};
    const first = await fx.adapter.createLifecycleTimeIntent('claim', input, fx.context());
    const result = await fx.adapter.claimTeachingExecution(input, fx.context());
    assert.equal(result.ok, true);
    assert.equal(result.outcome, lifecycle.OUTCOMES.CLAIMED);
    const replay = await fx.adapter.createLifecycleTimeIntent('claim', input, fx.context());
    assert.equal(replay.path, first.path);
    assert.equal(replay.created, false);
  });

  await check('valid_claim_uses_two_phase_final_cas_and_fifteen_minute_lease', async () => {
    const fx = fixture('claim');
    const reservation = await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const result = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    assert.equal(result.ok, true);
    assert.equal(result.outcome, lifecycle.OUTCOMES.CLAIMED);
    assert.equal(result.status.statusVersion, 1);
    assert.equal(result.status.fencingToken, 1);
    assert.equal(result.status.leaseGeneration, 1);
    assert.equal(result.status.leaseOwner, 'worker-1');
    assert.equal(result.status.leaseExpiresAt - result.status.leaseAcquiredAt, lifecycle.LEASE_DURATION_MS);
    assert.equal((await documentData(reservation.artifacts.paths.status)).state, lifecycle.STATES.CLAIMED);
  });

  await check('status_changed_between_phases_fails_closed', async () => {
    const fxBase = fixture('status-between');
    const artifacts = statusArtifacts(fxBase);
    await fxBase.adapter.reserveTeachingExecution(fxBase.request, fxBase.context());
    const dbProxy = dbAfterFirstCommit(async () => {
      await db.doc(artifacts.paths.status).update({statusVersion: 7});
    });
    const fx = fixture('status-between-run', dbProxy);
    fx.request = fxBase.request;
    fx.state.snapshot = fxBase.state.snapshot;
    const result = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    assert.equal(result.ok, false);
  });

  await check('authority_changed_between_phases_fails_closed', async () => {
    const holder = fixture('authority-between');
    await holder.adapter.reserveTeachingExecution(holder.request, holder.context());
    let fx;
    const dbProxy = dbAfterFirstCommit(async () => {
      fx.state.snapshot = {...fx.state.snapshot, executorRegistry: {...fx.state.snapshot.executorRegistry, authorizationVersion: 'auth-revoked'}};
    });
    fx = fixture('authority-between-run', dbProxy);
    fx.request = holder.request;
    fx.state.snapshot = holder.state.snapshot;
    const result = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    assert.equal(result.ok, false);
  });

  await check('terminal_changed_between_phases_fails_closed', async () => {
    const holder = fixture('terminal-between');
    const reservation = await holder.adapter.reserveTeachingExecution(holder.request, holder.context());
    const dbProxy = dbAfterFirstCommit(async () => {
      await db.doc(reservation.artifacts.paths.status).update({terminal: true});
    });
    const fx = fixture('terminal-between-run', dbProxy);
    fx.request = holder.request;
    fx.state.snapshot = holder.state.snapshot;
    const result = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    assert.equal(result.ok, false);
  });

  await check('double_claim_has_one_winner', async () => {
    const fx = fixture('double-claim');
    await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const [a, b] = await Promise.all([
      fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context('worker-a')),
      fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context('worker-b')),
    ]);
    assert.equal([a, b].filter(item => item.ok).length, 1);
    assert.equal([a, b].filter(item => !item.ok).length, 1);
  });

  await check('valid_renewal_preserves_owner_fence_generation', async () => {
    const fx = fixture('renew');
    await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const claim = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    const result = await fx.adapter.renewTeachingExecution(lifecycleInput(fx, claim.status), fx.context());
    assert.equal(result.ok, true);
    assert.equal(result.status.statusVersion, 2);
    assert.equal(result.status.fencingToken, 1);
    assert.equal(result.status.leaseGeneration, 1);
    assert.equal(result.status.leaseOwner, 'worker-1');
  });

  await check('renewal_deadline_is_enforced_by_authoritative_intent_time', async () => {
    const fx = fixture('renew-deadline');
    await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const claim = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    const artifacts = statusArtifacts(fx);
    await db.doc(artifacts.paths.status).update({leaseExpiresAt: claim.status.leaseAcquiredAt + 120000});
    const result = await fx.adapter.renewTeachingExecution(lifecycleInput(fx, {...claim.status, leaseExpiresAt: claim.status.leaseAcquiredAt + 120000}), fx.context());
    assert.equal(result.ok, false);
  });

  for (const [label, overrides] of [
    ['wrong-owner', {expectedLeaseOwner: 'worker-other'}],
    ['wrong-fence', {expectedFencingToken: 99}],
    ['wrong-generation', {expectedLeaseGeneration: 99}],
    ['wrong-version', {expectedStatusVersion: 99}],
  ]) {
    await check(`renewal_${label}_fails_closed`, async () => {
      const fx = fixture(`renew-${label}`);
      await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
      const claim = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
      const result = await fx.adapter.renewTeachingExecution({...lifecycleInput(fx, claim.status), ...overrides}, fx.context());
      assert.equal(result.ok, false);
    });
  }

  await check('takeover_before_authoritative_expiry_rejected', async () => {
    const fx = fixture('takeover-before');
    await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const claim = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    const result = await fx.adapter.takeoverTeachingExecution(lifecycleInput(fx, claim.status), fx.context('worker-2'));
    assert.equal(result.ok, false);
  });

  async function expiredFixture(label) {
    const fx = fixture(label);
    await fx.adapter.reserveTeachingExecution(fx.request, fx.context());
    const claim = await fx.adapter.claimTeachingExecution({request: fx.request, expectedStatusVersion: 0}, fx.context());
    const artifacts = statusArtifacts(fx);
    const expired = {...claim.status, leaseExpiresAt: claim.status.leaseAcquiredAt - 1};
    await db.doc(artifacts.paths.status).update({leaseExpiresAt: expired.leaseExpiresAt});
    return {fx, status: expired};
  }

  await check('takeover_after_authoritative_expiry_succeeds', async () => {
    const {fx, status} = await expiredFixture('takeover-after');
    const result = await fx.adapter.takeoverTeachingExecution(lifecycleInput(fx, status, 'worker-1'), fx.context('worker-2'));
    assert.equal(result.ok, true);
    assert.equal(result.outcome, lifecycle.OUTCOMES.TAKEN_OVER);
    assert.equal(result.status.leaseOwner, 'worker-2');
    assert.equal(result.status.fencingToken, 2);
    assert.equal(result.status.leaseGeneration, 2);
    assert.equal(result.status.statusVersion, 2);
  });

  await check('two_takeovers_have_one_winner_and_old_worker_is_stale', async () => {
    const {fx, status} = await expiredFixture('takeover-race');
    const [a, b] = await Promise.all([
      fx.adapter.takeoverTeachingExecution(lifecycleInput(fx, status, 'worker-1'), fx.context('worker-a')),
      fx.adapter.takeoverTeachingExecution(lifecycleInput(fx, status, 'worker-1'), fx.context('worker-b')),
    ]);
    assert.equal([a, b].filter(item => item.ok).length, 1);
    const winner = a.ok ? a : b;
    const stale = await fx.adapter.renewTeachingExecution(lifecycleInput(fx, winner.status, 'worker-1'), fx.context('worker-1'));
    assert.equal(stale.ok, false);
  });

  await check('transaction_failure_rolls_back_all_adapter_writes', async () => {
    const fx = fixture('adapter-rollback');
    const path = `mission_realms/${fx.realmId}/rollback_probe/doc`;
    await assert.rejects(() => fx.adapter.runTransaction(async tx => {
      await tx.create(path, {probe: true});
      throw Object.assign(new Error('synthetic rollback'), {code: 'R39_ROLLBACK'});
    }), error => error.code === 'R39_ROLLBACK');
    assert.equal((await documentData(path)) === null, true);
  });

  const total = results.length;
  const passed = results.filter(item => item.result === 'PASS').length;
  const failed = total - passed;
  process.stdout.write(JSON.stringify({total, passed, failed, results}, null, 2));
  await db.terminate();
  if (failed > 0) process.exitCode = 1;
}

main().catch(async error => {
  process.stderr.write(`${error.stack || error}\n`);
  try { await db.terminate(); } catch (_) { /* best effort */ }
  process.exitCode = 1;
});
