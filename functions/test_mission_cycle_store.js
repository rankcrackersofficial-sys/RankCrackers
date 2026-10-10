/**
 * B2 Test Suite — Authoritative Mission Cycle Store (C1-R3 Invariants)
 * =============================================================================
 * Validates deriveCycleKey, buildCycleRecord, duplicate-cycle guard, draft
 * isolation, transactional creation, enrichment handoff payload, and direct
 * persistence authority/jurisdiction invariant locks.
 */

'use strict';

const assert = require('assert');
const {
  deriveCycleKey,
  assertSyllabusBindingMode,
  assertJurisdictionLevel,
  buildCycleRecord,
  buildEnrichmentHandoffPayload,
  assertCycleCreationAllowed,
  assertDraftCycleWriteIsolation,
  createMissionCycleWithDuplicateGuard,
} = require('./services/mission_cycle_store');
const { canonicalAuthorityRegistry } = require('./services/authority_intelligence/index');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const NOTIF = { sourceId: 'src_notif_1', versionRef: '2026-v1' };
const SYLL = { sourceId: 'src_syll_1', versionRef: '2026-v1' };
const RECORDED_AT = '2026-09-11T12:00:00Z';

// --- synthetic Firestore store ----------------------------------------------
function createFakeDb() {
  const docs = new Map();
  const writes = [];
  function refFor(segments) {
    const ref = { path: segments.join('/'), id: segments[segments.length - 1] };
    ref.get = async () => ({
      exists: docs.has(ref.path),
      data: () => (docs.has(ref.path) ? JSON.parse(JSON.stringify(docs.get(ref.path))) : null),
    });
    ref.set = (data) => { writes.push({ path: ref.path, data }); docs.set(ref.path, data); return Promise.resolve(); };
    ref.collection = (name) => collectionFor(segments.concat(name));
    ref.doc = (id) => refFor(segments.concat(id));
    return ref;
  }
  function collectionFor(segments) {
    return { doc: (id) => refFor(segments.concat(id)), path: segments.join('/') };
  }
  return {
    collection(name) { return collectionFor([name]); },
    doc(pathStr) { return refFor(pathStr.split('/')); },
    async runTransaction(updateFunction) {
      const txWrites = [];
      const tx = {
        async get(docRef) {
          const exists = docs.has(docRef.path);
          return { exists, data: () => (exists ? JSON.parse(JSON.stringify(docs.get(docRef.path))) : null) };
        },
        set(docRef, data) { txWrites.push({ path: docRef.path, data }); },
      };
      const result = await updateFunction(tx);
      for (const w of txWrites) {
        writes.push(w);
        docs.set(w.path, w.data);
      }
      return result;
    },
    _docs: docs,
    _writes: writes,
  };
}

// --- deriveCycleKey ---------------------------------------------------------

test('C1: deriveCycleKey returns bare year for ordinary annual cycles', () => {
  assert.strictEqual(deriveCycleKey({ targetYear: 2027 }), '2027');
  assert.strictEqual(deriveCycleKey({ targetYear: '2026' }), '2026');
});

test('C2: deriveCycleKey appends official discriminator deterministically', () => {
  assert.strictEqual(deriveCycleKey({ targetYear: 2027, cycleDiscriminator: 'phase1' }), '2027_phase1');
  assert.strictEqual(deriveCycleKey({ targetYear: 2027, cycleDiscriminator: 'advt03' }), '2027_advt03');
});

test('C3: deriveCycleKey rejects free-text discriminator and bad years', () => {
  assert.throws(() => deriveCycleKey({ targetYear: '2027', cycleDiscriminator: 'Phase 1!' }), /CYCLE_KEY_INVALID/);
  assert.throws(() => deriveCycleKey({ targetYear: '2027', cycleDiscriminator: 'first-attempt' }), /CYCLE_KEY_INVALID/);
  assert.throws(() => deriveCycleKey({ targetYear: 'invalid' }), /CYCLE_KEY_INVALID/);
  assert.throws(() => deriveCycleKey({ targetYear: 1899 }), /CYCLE_KEY_INVALID/);
});

// --- buildCycleRecord -------------------------------------------------------

test('C4: buildCycleRecord creates frozen INTERNAL_DRAFT record with PENDING_ENRICHMENT', () => {
  const key = deriveCycleKey({ targetYear: 2027 });
  const record = buildCycleRecord({
    cycleKey: key, targetYear: 2027, syllabusBindingMode: 'SEPARATE',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, syllabusBinding: SYLL, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(record.status, 'INTERNAL_DRAFT');
  assert.strictEqual(record.authorityKey, 'auth_in_ssc');
  assert.strictEqual(record.enrichmentStatus, 'PENDING_ENRICHMENT');
  assert.strictEqual(record.readiness.syllabusReady, false, 'syllabus readiness starts honestly false');
  assert.ok(Object.isFrozen(record));
  assert.strictEqual(record.createdAt, RECORDED_AT);
});

test('C5: SEPARATE mode requires a syllabus binding; other modes forbid it', () => {
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'SEPARATE',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  }), /CYCLE_SYLLABUS_BINDING_REQUIRED/);
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, syllabusBinding: SYLL, recordedAt: RECORDED_AT,
  }), /CYCLE_SYLLABUS_BINDING_FORBIDDEN/);
});

test('C6: binding mode and jurisdiction vocabulary are enforced', () => {
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PARTIAL',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  }), /CYCLE_BINDING_MODE_INVALID/);
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'GALACTIC', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  }), /CYCLE_JURISDICTION_INVALID/);
});

test('C7: jurisdiction/stateCode coupling is enforced (authority != jurisdiction)', () => {
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: 'RJ', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  }), /CYCLE_STATE_CODE_INVALID/);
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'STATE', authorityKey: 'auth_in_rj_rpsc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  }), /CYCLE_STATE_CODE_REQUIRED/);
  const state = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'STATE', stateCode: 'RJ', authorityKey: 'auth_in_rj_rpsc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(state.stateCode, 'RJ');
  assert.strictEqual(state.authorityKey, 'auth_in_rj_rpsc');
});

test('C8: notification binding is mandatory for every cycle', () => {
  assert.throws(() => buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_ssc', recordedAt: RECORDED_AT,
  }), /CYCLE_NOTIFICATION_BINDING_REQUIRED/);
});

// --- duplicate-cycle guard --------------------------------------------------

test('C9: duplicate-cycle guard fails closed when the cycle already exists', () => {
  assert.throws(
    () => assertCycleCreationAllowed({ existingCycleData: { cycleKey: '2027', status: 'INTERNAL_DRAFT' } }),
    /DUPLICATE_CYCLE_EXISTS/,
  );
  assert.doesNotThrow(() => assertCycleCreationAllowed({ existingCycleData: null }));
});

// --- projection isolation ---------------------------------------------------

test('C10: draft isolation forbids Student catalog and recruitment writes', () => {
  assert.throws(() => assertDraftCycleWriteIsolation('jee_main_2026', ['student_mission_catalog/jee_main_2026']), /DRAFT_CYCLE_ISOLATION_VIOLATION/);
  assert.throws(() => assertDraftCycleWriteIsolation('jee_main_2026', ['recruitments/jee_main_2026']), /DRAFT_CYCLE_ISOLATION_VIOLATION/);
});

test('C11: draft isolation forbids mission_realms ROOT document writes but allows cycles subcollection', () => {
  assert.throws(() => assertDraftCycleWriteIsolation('jee_main_2026', ['mission_realms/jee_main_2026']), /DRAFT_CYCLE_ISOLATION_VIOLATION/);
  assert.throws(() => assertDraftCycleWriteIsolation('jee_main_2026', ['mission_realms/jee_main_2026/official_documents/d1']), /DRAFT_CYCLE_ISOLATION_VIOLATION/);
  assert.doesNotThrow(() => assertDraftCycleWriteIsolation('jee_main_2026', ['mission_realms/jee_main_2026/cycles/2027']));
});

// --- transactional creation -------------------------------------------------

test('C12: transactional creation persists the draft cycle through the duplicate guard', async () => {
  const db = createFakeDb();
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'SEPARATE',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_nta', notificationBinding: NOTIF, syllabusBinding: SYLL, recordedAt: RECORDED_AT,
  });
  const result = await createMissionCycleWithDuplicateGuard({ db, missionId: 'jee_main_2026', cycle: record, recordedAt: RECORDED_AT });
  assert.strictEqual(result.created, true);
  assert.ok(db._docs.has('mission_realms/jee_main_2026/cycles/2027'));
  assert.strictEqual(db._docs.get('mission_realms/jee_main_2026/cycles/2027').enrichmentStatus, 'PENDING_ENRICHMENT');
  assert.strictEqual(db._docs.get('mission_realms/jee_main_2026/cycles/2027').authorityKey, 'auth_in_nta');
  // Only the cycle subcollection was written.
  assert.deepStrictEqual(db._writes.map(w => w.path), ['mission_realms/jee_main_2026/cycles/2027']);
});

test('C13: second creation of the same missionId+cycleKey fails closed (no merge, no duplicate)', async () => {
  const db = createFakeDb();
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_nta', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  await createMissionCycleWithDuplicateGuard({ db, missionId: 'jee_main_2026', cycle: record, recordedAt: RECORDED_AT });
  await assert.rejects(
    () => createMissionCycleWithDuplicateGuard({ db, missionId: 'jee_main_2026', cycle: record, recordedAt: RECORDED_AT }),
    /DUPLICATE_CYCLE_EXISTS/,
  );
  assert.strictEqual(db._writes.length, 1, 'no duplicate write may occur');
});

test('C14: distinct cycles of the same permanent mission coexist', async () => {
  const db = createFakeDb();
  const r2027 = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_nta', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  const r2028 = buildCycleRecord({
    cycleKey: '2028', targetYear: 2028, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_nta', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  await createMissionCycleWithDuplicateGuard({ db, missionId: 'jee_main_2026', cycle: r2027, recordedAt: RECORDED_AT });
  await createMissionCycleWithDuplicateGuard({ db, missionId: 'jee_main_2026', cycle: r2028, recordedAt: RECORDED_AT });
  assert.ok(db._docs.has('mission_realms/jee_main_2026/cycles/2027'));
  assert.ok(db._docs.has('mission_realms/jee_main_2026/cycles/2028'));
});

// --- worker handoff payload -------------------------------------------------

test('C15: enrichment handoff payload carries governed identity + deterministic task key', () => {
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_nta', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  const handoff = buildEnrichmentHandoffPayload({ missionId: 'jee_main_2026', cycle: record });
  assert.strictEqual(handoff.missionId, 'jee_main_2026');
  assert.strictEqual(handoff.cycleKey, '2027');
  assert.strictEqual(handoff.authorityKey, 'auth_in_nta');
  assert.strictEqual(handoff.syllabusBinding, null);
  assert.strictEqual(handoff.syllabusBindingMode, 'PENDING');
  assert.strictEqual(handoff.enrichmentStatus, 'PENDING_ENRICHMENT');
  assert.match(handoff.enrichmentTaskKey, /^[0-9a-f]{64}$/);
  assert.ok(Object.isFrozen(handoff));
});

test('C16: handoff task key is order-independent of source tokens and changes with identity', () => {
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_nta', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  const h1 = buildEnrichmentHandoffPayload({ missionId: 'jee_main_2026', cycle: record });
  const h2 = buildEnrichmentHandoffPayload({ missionId: 'neet_(ug)-2027', cycle: record });
  assert.notStrictEqual(h1.enrichmentTaskKey, h2.enrichmentTaskKey, 'different mission must yield different task key');
});

// --- C1-R3 INVARIANT TESTS --------------------------------------------------

test('C17: Exact six-authority canonical registry set equality', () => {
  const authorities = canonicalAuthorityRegistry.getAll();
  assert.strictEqual(authorities.length, 6, 'Must contain exactly 6 authorities');
  const actualKeys = authorities.map(a => a.authorityKey).sort();
  const expectedKeys = [
    'auth_in_dl_dsssb',
    'auth_in_nta',
    'auth_in_rj_rpsc',
    'auth_in_rj_rssb',
    'auth_in_ssc',
    'auth_in_upsc',
  ].sort();
  assert.deepStrictEqual(actualKeys, expectedKeys, 'Exact registry key set must match');
});

test('C18: Zero unapproved authorities (IBPS strictly absent from registry)', () => {
  assert.strictEqual(canonicalAuthorityRegistry.getByKey('auth_in_ibps', false), null);
  assert.strictEqual(canonicalAuthorityRegistry.getAll().some(a => a.authorityKey === 'auth_in_ibps'), false);
});

test('C19: buildCycleRecord missing authorityKey fails closed with CYCLE_AUTHORITY_KEY_REQUIRED', () => {
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'CENTRAL', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /CYCLE_AUTHORITY_KEY_REQUIRED/,
  );
});

test('C20: buildCycleRecord null or empty authorityKey fails closed', () => {
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'CENTRAL', authorityKey: null, notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /CYCLE_AUTHORITY_KEY_REQUIRED/,
  );
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'CENTRAL', authorityKey: '   ', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /CYCLE_AUTHORITY_KEY_REQUIRED/,
  );
});

test('C21: buildCycleRecord unknown authorityKey fails closed with AUTHORITY_NOT_FOUND', () => {
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'CENTRAL', authorityKey: 'auth_in_unknown', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /AUTHORITY_NOT_FOUND/,
  );
});

test('C22: buildCycleRecord jurisdiction contradiction fails closed', () => {
  // SSC (Central) with stateCode RJ -> FAIL
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'CENTRAL', stateCode: 'RJ', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /CYCLE_STATE_CODE_INVALID/,
  );
  // RPSC (State RJ) with CENTRAL -> FAIL
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'CENTRAL', stateCode: null, authorityKey: 'auth_in_rj_rpsc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /JURISDICTION_AUTHORITY_MISMATCH/,
  );
  // RPSC (State RJ) with stateCode DL -> FAIL
  assert.throws(
    () => buildCycleRecord({
      cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
      jurisdictionLevel: 'STATE', stateCode: 'DL', authorityKey: 'auth_in_rj_rpsc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
    }),
    /JURISDICTION_STATE_MISMATCH/,
  );
});

test('C23: Valid Central builder (auth_in_ssc + CENTRAL + null) PASSES', () => {
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: null, authorityKey: 'auth_in_ssc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(record.authorityKey, 'auth_in_ssc');
  assert.strictEqual(record.jurisdictionLevel, 'CENTRAL');
  assert.strictEqual(record.stateCode, null);
});

test('C24: Valid State builder (auth_in_rj_rpsc + STATE + RJ) PASSES', () => {
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'STATE', stateCode: 'RJ', authorityKey: 'auth_in_rj_rpsc', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(record.authorityKey, 'auth_in_rj_rpsc');
  assert.strictEqual(record.jurisdictionLevel, 'STATE');
  assert.strictEqual(record.stateCode, 'RJ');
});

test('C25: Valid UT builder (auth_in_dl_dsssb + UT + DL) PASSES', () => {
  const record = buildCycleRecord({
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'UT', stateCode: 'DL', authorityKey: 'auth_in_dl_dsssb', notificationBinding: NOTIF, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(record.authorityKey, 'auth_in_dl_dsssb');
  assert.strictEqual(record.jurisdictionLevel, 'UT');
  assert.strictEqual(record.stateCode, 'DL');
});

test('C26: buildEnrichmentHandoffPayload missing authorityKey fails closed', () => {
  const cycleWithoutAuth = {
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: null, notificationBinding: NOTIF,
  };
  assert.throws(
    () => buildEnrichmentHandoffPayload({ missionId: 'jee_main_2026', cycle: cycleWithoutAuth }),
    /HANDOFF_AUTHORITY_KEY_REQUIRED/,
  );
});

test('C27: buildEnrichmentHandoffPayload unknown authorityKey fails closed', () => {
  const cycleWithBadAuth = {
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: null, authorityKey: 'auth_in_unknown', notificationBinding: NOTIF,
  };
  assert.throws(
    () => buildEnrichmentHandoffPayload({ missionId: 'jee_main_2026', cycle: cycleWithBadAuth }),
    /AUTHORITY_NOT_FOUND/,
  );
});

test('C28: buildEnrichmentHandoffPayload jurisdiction mismatch fails closed', () => {
  const cycleWithMismatch = {
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: 'RJ', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF,
  };
  assert.throws(
    () => buildEnrichmentHandoffPayload({ missionId: 'jee_main_2026', cycle: cycleWithMismatch }),
    /JURISDICTION_STATE_MISMATCH/,
  );
});

test('C29: Direct createMissionCycleWithDuplicateGuard with authorityKey: null fails closed with 0 writes', async () => {
  const db = createFakeDb();
  const rawCycle = {
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: null, authorityKey: null, notificationBinding: NOTIF,
  };
  await assert.rejects(
    () => createMissionCycleWithDuplicateGuard({ db, missionId: 'ssc_cgl', cycle: rawCycle, recordedAt: RECORDED_AT }),
    /CYCLE_AUTHORITY_KEY_REQUIRED/,
  );
  assert.strictEqual(db._writes.length, 0, 'Must perform zero writes');
  assert.strictEqual(db._docs.has('mission_realms/ssc_cgl/cycles/2027'), false);
});

test('C30: Direct createMissionCycleWithDuplicateGuard with unknown authorityKey fails closed with 0 writes', async () => {
  const db = createFakeDb();
  const rawCycle = {
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: null, authorityKey: 'auth_in_unknown', notificationBinding: NOTIF,
  };
  await assert.rejects(
    () => createMissionCycleWithDuplicateGuard({ db, missionId: 'ssc_cgl', cycle: rawCycle, recordedAt: RECORDED_AT }),
    /AUTHORITY_NOT_FOUND/,
  );
  assert.strictEqual(db._writes.length, 0, 'Must perform zero writes');
});

test('C31: Direct createMissionCycleWithDuplicateGuard with jurisdiction mismatch fails closed with 0 writes', async () => {
  const db = createFakeDb();
  const rawCycle = {
    cycleKey: '2027', targetYear: 2027, syllabusBindingMode: 'PENDING',
    jurisdictionLevel: 'CENTRAL', stateCode: 'RJ', authorityKey: 'auth_in_ssc', notificationBinding: NOTIF,
  };
  await assert.rejects(
    () => createMissionCycleWithDuplicateGuard({ db, missionId: 'ssc_cgl', cycle: rawCycle, recordedAt: RECORDED_AT }),
    /JURISDICTION_STATE_MISMATCH/,
  );
  assert.strictEqual(db._writes.length, 0, 'Must perform zero writes');
});

// ---------------------------------------------------------------------------
let passCount = 0, failCount = 0;
(async () => {
  for (const { name, fn } of tests) {
    try {
      await fn();
      passCount += 1;
      console.log(`PASS  ${name}`);
    } catch (err) {
      failCount += 1;
      console.log(`FAIL  ${name} :: ${err.message}`);
    }
  }
  console.log('-------------------------------------------------------------------------------');
  console.log(`TEST_COUNT=${tests.length} PASS_COUNT=${passCount} FAIL_COUNT=${failCount}`);
  process.exit(failCount > 0 ? 1 : 0);
})();
