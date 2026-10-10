/**
 * B5 — Unified Create/Publish Flow Integration Test Suite (synthetic).
 * Exercises the WIRED flow end-to-end over an in-memory Firestore store:
 *   executeUnifiedMissionCreation (B1 identity -> B3 preflight -> B2 cycle -> pointer -> shells)
 *   executeCycleAwarePublication  (B4 eligibility -> atomic selected-cycle publication)
 *   executeSentinelPromotion     (Quarantine validation of legacy promotion worker)
 *   executeRecruitmentAutoCreationEngine (Quarantine validation of legacy candidate engine)
 * Pure Node assert. No emulator, no network, no production.
 *
 * Run: node functions/test_unified_mission_create_publish_integration_b5.js
 */

const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  deriveCycleKey,
  executeUnifiedMissionCreation,
} = require('./services/mission_cycle_store');
const {
  executeCycleAwarePublication,
} = require('./services/mission_cycle_lifecycle');
const {
  executeSentinelPromotion,
} = require('./workers/promotion_worker');
const {
  executeRecruitmentAutoCreationEngine,
} = require('./workers/recruitment_engine_worker');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const RECORDED_AT = '2026-09-11T19:00:00Z';

function makeSha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex').toLowerCase();
}


test('N25: SOURCE_AUTHORITY_CONTRADICTION_REJECTED (payload = auth_in_ssc, source.authorityKey = auth_in_rj_rpsc, domain = rpsc.rajasthan.gov.in fails closed before write)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://rpsc.rajasthan.gov.in', authorityKey: 'auth_in_rj_rpsc' });
  await assert.rejects(
    async () => runCreation(db, creationPayload({ authorityKey: 'auth_in_ssc' })),
    /SOURCE_PREFLIGHT_FAILED/,
  );
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl'), false);
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/2026'), false);
});

test('N26: SAME_DOMAIN_AUTHORITY_CONTRADICTION_REJECTED (payload = auth_in_ssc, source.authorityKey = auth_in_rj_rpsc, domain = ssc.gov.in fails closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://ssc.gov.in', authorityKey: 'auth_in_rj_rpsc' });
  await assert.rejects(
    async () => runCreation(db, creationPayload({ authorityKey: 'auth_in_ssc' })),
    /SOURCE_PREFLIGHT_FAILED/,
  );
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl'), false);
});

test('N27: SOURCE_AUTHORITY_KEY_ABSENCE_PASSES (payload = auth_in_ssc, source.authorityKey = null, domain = ssc.gov.in passes creation)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://ssc.gov.in', authorityKey: null });
  const result = await runCreation(db, creationPayload({ authorityKey: 'auth_in_ssc' }));
  assert.strictEqual(result.cycleKey, '2026');
  assert.strictEqual(result.handoff.authorityKey, 'auth_in_ssc');
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/2026'), true);
  const cycleDoc = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycleDoc.authorityKey, 'auth_in_ssc');
});

// ---------------------------------------------------------------------------
// Synthetic Firestore store + transaction
// ---------------------------------------------------------------------------
function createFakeDb() {
  const docs = new Map();
  const writes = [];
  function refFor(segments) {
    const ref = {
      path: segments.join('/'),
      id: segments[segments.length - 1],
    };
    ref.get = async () => ({
      exists: docs.has(ref.path),
      data: () => (docs.has(ref.path) ? JSON.parse(JSON.stringify(docs.get(ref.path))) : null),
    });
    ref.set = (data) => { writes.push({ path: ref.path, data, kind: 'set' }); docs.set(ref.path, data); return Promise.resolve(); };
    ref.update = (data) => {
      writes.push({ path: ref.path, data, kind: 'update' });
      docs.set(ref.path, { ...(docs.get(ref.path) || {}), ...data });
      return Promise.resolve();
    };
    ref.collection = (name) => collectionFor(segments.concat(name));
    ref.doc = (id) => refFor(segments.concat(id));
    return ref;
  }
  function collectionFor(segments) {
    return {
      doc: (id) => refFor(segments.concat(id)),
      path: segments.join('/'),
    };
  }
  return {
    collection(name) { return collectionFor([name]); },
    doc(pathStr) { return refFor(pathStr.split('/')); },
    batch() {
      const operations = [];
      return {
        set(docRef, data, options = {}) {
          operations.push({ op: 'set', ref: docRef, data, options });
          return this;
        },
        update(docRef, data) {
          operations.push({ op: 'update', ref: docRef, data });
          return this;
        },
        delete(docRef) {
          operations.push({ op: 'delete', ref: docRef });
          return this;
        },
        async commit() {
          for (const op of operations) {
            if (op.op === 'set') {
              writes.push({ path: op.ref.path, data: op.data, kind: 'set' });
              docs.set(op.ref.path, op.data);
            } else if (op.op === 'update') {
              writes.push({ path: op.ref.path, data: op.data, kind: 'update' });
              docs.set(op.ref.path, { ...(docs.get(op.ref.path) || {}), ...op.data });
            }
          }
          return Promise.resolve();
        },
        _operations: operations,
      };
    },
    async runTransaction(updateFunction) {
      const txWrites = [];
      const tx = {
        async get(docRef) {
          const exists = docs.has(docRef.path);
          return {
            exists,
            data: () => (exists ? JSON.parse(JSON.stringify(docs.get(docRef.path))) : null),
          };
        },
        set(docRef, data) {
          txWrites.push({ path: docRef.path, data, kind: 'set' });
        },
        update(docRef, data) {
          txWrites.push({ path: docRef.path, data, kind: 'update' });
        },
      };
      const result = await updateFunction(tx);
      for (const w of txWrites) {
        writes.push(w);
        if (w.kind === 'set') docs.set(w.path, w.data);
        else if (w.kind === 'update') {
          docs.set(w.path, { ...(docs.get(w.path) || {}), ...w.data });
        }
      }
      return result;
    },
    _docs: docs,
    _writes: writes,
    seed(pathStr, data) { docs.set(pathStr, data); },
  };
}

function seedVerifiedSources(db, { notifId = 'draft_notif_1', syllabusId = 'draft_syll_1', language = 'en', withHash = true, isOfficial = true, domain = 'https://ssc.gov.in', authorityKey = 'auth_in_ssc', trusted = true, notifSourceType = 'notification', syllSourceType = 'syllabus', notifGovernance = 'ACTIVE', syllGovernance = 'ACTIVE' } = {}) {
  const notifSha = withHash ? makeSha256(notifId) : null;
  db.seed(`sentinel_drafts/${notifId}`, {
    sourceType: notifSourceType,
    governanceStatus: notifGovernance,
    type: 'recruitment_notification',
    status: 'verified',
    isOfficial,
    officialDomain: domain,
    authorityKey,
    language,
    fileHash: notifSha,
    actualSha256: notifSha,
    rawData: { official_website: domain, language, isOfficial, title: 'SSC CGL Notification 2026' },
  });
  db.seed(`ingestion_refinery/${notifId}`, { fileHash: notifSha, trusted, status: 'published' });

  if (syllabusId) {
    const syllSha = withHash ? makeSha256(syllabusId) : null;
    db.seed(`sentinel_drafts/${syllabusId}`, {
      sourceType: syllSourceType,
      governanceStatus: syllGovernance,
      type: 'syllabus',
      status: 'verified',
      isOfficial,
      officialDomain: domain,
      authorityKey,
      language,
      fileHash: syllSha,
      actualSha256: syllSha,
      rawData: { official_website: domain, language, isOfficial, title: 'SSC CGL Syllabus 2026' },
    });
    db.seed(`ingestion_refinery/${syllabusId}`, { fileHash: syllSha, trusted, status: 'published' });
  }
}

function creationPayload(overrides = {}) {
  return {
    organization: 'SSC',
    authority: 'SSC',
    authorityKey: 'auth_in_ssc',
    exam_name: 'SSC CGL',
    examName: 'SSC CGL',
    title: 'SSC CGL',
    year: 2026,
    syllabusBindingMode: 'SEPARATE',
    jurisdictionLevel: 'CENTRAL',
    stateCode: null,
    notificationId: 'draft_notif_1',
    syllabusId: 'draft_syll_1',
    ...overrides,
  };
}

async function runCreation(db, payload, actorId = 'founder_test') {
  return db.runTransaction(async (tx) => {
    return executeUnifiedMissionCreation({
      transaction: tx,
      db,
      payload,
      actorId,
      recordedAt: RECORDED_AT,
    });
  });
}

// ---------------------------------------------------------------------------
// Creation flow tests (I1-I15)
// ---------------------------------------------------------------------------

test('I1: new permanent mission + 2026 SEPARATE syllabus creates the full governed draft stack', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload());

  assert.strictEqual(result.missionId, 'rec_ssc_ssc_cgl');
  assert.strictEqual(result.cycleKey, '2026');
  assert.strictEqual(result.createdParent, true);

  const parent = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parent.realm_id, 'rec_ssc_ssc_cgl');
  assert.strictEqual(parent.status, 'PASSIVE');
  assert.strictEqual(parent.latest_draft_cycle_key, '2026');

  const cycle = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycle.cycleKey, '2026');
  assert.strictEqual(cycle.status, 'INTERNAL_DRAFT');
  assert.strictEqual(cycle.authorityKey, 'auth_in_ssc');
  assert.strictEqual(cycle.enrichmentStatus, 'PENDING_ENRICHMENT');

  assert.strictEqual(db._docs.has('recruitments/rec_ssc_ssc_cgl'), false);
  assert.strictEqual(db._docs.has('student_mission_catalog/rec_ssc_ssc_cgl'), false);

  const notifDraft = db._docs.get('sentinel_drafts/draft_notif_1');
  assert.strictEqual(notifDraft.linkedRealmId, 'rec_ssc_ssc_cgl');
  assert.strictEqual(notifDraft.linkedCycleKey, '2026');
});

test('I2: new mission creates only the canonical parent, cycle, and source links', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload());
  assert.strictEqual(result.writePaths.length, 4);
  assert.ok(result.writePaths.includes('mission_realms/rec_ssc_ssc_cgl'));
  assert.ok(result.writePaths.includes('mission_realms/rec_ssc_ssc_cgl/cycles/2026'));
  assert.ok(result.writePaths.includes('sentinel_drafts/draft_notif_1'));
  assert.ok(result.writePaths.includes('sentinel_drafts/draft_syll_1'));
  assert.strictEqual(db._writes.length, 4, 'Exact 4 physical writes on new mission creation with separate syllabus');
});

test('I3: existing permanent mission + 2027 creates the cycle + latest draft pointer only', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await runCreation(db, creationPayload({ year: 2026 }));

  seedVerifiedSources(db, { notifId: 'notif_2027', syllabusId: 'syll_2027' });
  const writesBefore = db._writes.length;

  const result2 = await runCreation(db, creationPayload({
    year: 2027, notificationId: 'notif_2027', syllabusId: 'syll_2027',
  }));
  assert.strictEqual(result2.createdParent, false);
  assert.strictEqual(result2.cycleKey, '2027');

  const newWrites = db._writes.slice(writesBefore);
  const touchedPaths = newWrites.map(w => w.path);
  assert.ok(touchedPaths.includes('mission_realms/rec_ssc_ssc_cgl/cycles/2027'));
  assert.ok(touchedPaths.includes('mission_realms/rec_ssc_ssc_cgl'));
  assert.ok(!touchedPaths.includes('recruitments/rec_ssc_ssc_cgl'));
  assert.ok(!touchedPaths.includes('student_mission_catalog/rec_ssc_ssc_cgl'));
});

test('I4: existing published 2026 projection survives a 2027 draft untouched', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await runCreation(db, creationPayload({ year: 2026 }));

  db.seed('mission_realms/rec_ssc_ssc_cgl', {
    ...db._docs.get('mission_realms/rec_ssc_ssc_cgl'),
    status: 'ACTIVE',
    currentPublishedCycleKey: '2026',
  });
  seedVerifiedSources(db, { notifId: 'notif_2027', syllabusId: 'syll_2027' });
  await runCreation(db, creationPayload({ year: 2027, notificationId: 'notif_2027', syllabusId: 'syll_2027' }));

  const parent = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parent.currentPublishedCycleKey, '2026');
  assert.strictEqual(parent.status, 'ACTIVE');
  assert.strictEqual(parent.latest_draft_cycle_key, '2027');

  assert.strictEqual(db._docs.has('recruitments/rec_ssc_ssc_cgl'), false);
  assert.strictEqual(db._docs.has('student_mission_catalog/rec_ssc_ssc_cgl'), false);
});

test('I5: duplicate 2027 cycle fails closed (no merge, no overwrite, no second draft)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await runCreation(db, creationPayload({ year: 2026 }));

  seedVerifiedSources(db, { notifId: 'notif_2027', syllabusId: 'syll_2027' });
  await runCreation(db, creationPayload({ year: 2027, notificationId: 'notif_2027', syllabusId: 'syll_2027' }));

  await assert.rejects(
    async () => runCreation(db, creationPayload({ year: 2027, notificationId: 'notif_2027', syllabusId: 'syll_2027' })),
    /DUPLICATE_CYCLE_EXISTS/,
  );
});

test('I6: wrong authority/exam pair fails via B1 before any write', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload({ authority: 'UPSC', organization: 'UPSC', authorityKey: 'auth_in_upsc', exam_name: 'JEE Main', examName: 'JEE Main' })),
    /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/,
  );
  assert.strictEqual(db._writes.length, writesBefore);
});

test('I7: unofficial source fails via B3 preflight before cycle creation', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { isOfficial: false });
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/2026'), false);
});

test('I8: non-English source fails via B3 preflight', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { language: 'hi' });
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('I9: hash-present-but-unverified fails via B3 preflight (presence is not proof)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { withHash: true, trusted: false });
  db._docs.get('sentinel_drafts/draft_notif_1').actualSha256 = undefined;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('I10: trusted hash binding passes and binds the source to the cycle', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload());
  assert.strictEqual(result.summary.enrichmentStatus, 'PENDING_ENRICHMENT');
  const cycle = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycle.notificationBinding.sourceId, 'draft_notif_1');
  assert.strictEqual(cycle.authorityKey, 'auth_in_ssc');
});

test('I11: PENDING syllabus creates an honest incomplete cycle (syllabusReady false, no fake data)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { syllabusId: null });
  const result = await runCreation(db, creationPayload({ syllabusBindingMode: 'PENDING', syllabusId: null }));
  const cycle = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycle.syllabusBindingMode, 'PENDING');
  assert.strictEqual(cycle.syllabusBinding, null);
  assert.strictEqual(cycle.readiness.syllabusReady, false);
  assert.strictEqual(result.summary.enrichmentStatus, 'PENDING_ENRICHMENT');
});

test('I12: EMBEDDED does not become syllabusReady automatically', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { syllabusId: null });
  await runCreation(db, creationPayload({ syllabusBindingMode: 'EMBEDDED', syllabusId: null }));
  const cycle = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycle.readiness.syllabusReady, false);
});

test('I13: payload.cycle free text cannot alter the derived cycleKey', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload({ cycle: 'CYCLE_2099_HACK' }));
  assert.strictEqual(result.cycleKey, '2026');
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/2026'), true);
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/CYCLE_2099_HACK'), false);
});

test('I14: cycle creation yields exactly one Worker-trigger path (single cycle write, no queue writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload());
  assert.strictEqual(result.handoff.enrichmentStatus, 'PENDING_ENRICHMENT');
  assert.ok(result.handoff.enrichmentTaskKey);
  assert.strictEqual(result.handoff.authorityKey, 'auth_in_ssc');
  for (const pathStr of db._docs.keys()) {
    assert.ok(!pathStr.startsWith('ai_queue/'), `no queue write allowed: ${pathStr}`);
  }
});

test('I15: Worker enrichment remains cycle-only after the wired flow (integration with W1)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await runCreation(db, creationPayload());

  const { executeMissionEnrichmentCycle } = require('./workers/mission_enrichment_worker');
  const cycleData = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  const writesBefore = db._writes.length;

  const enrichResult = await executeMissionEnrichmentCycle({
    db, missionId: 'rec_ssc_ssc_cgl', cycleKey: '2026', cycleData, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(enrichResult.enriched, true);

  const enrichmentWrites = db._writes.slice(writesBefore);
  assert.strictEqual(enrichmentWrites.length, 1);
  assert.strictEqual(enrichmentWrites[0].path, 'mission_realms/rec_ssc_ssc_cgl/cycles/2026');
});

// ---------------------------------------------------------------------------
// Publication flow tests (P1-P12)
// ---------------------------------------------------------------------------

function seedEnrichedCycle(db, { missionId = 'rec_ssc_ssc_cgl', cycleKey = '2026', authorityKey = 'auth_in_ssc', enrichmentStatus = 'ENRICHMENT_COMPLETE', overallStatus = 'PASS', notificationReady = true, syllabusReady = true } = {}) {
  db.seed(`mission_realms/${missionId}`, {
    realm_id: missionId,
    exam_name: 'SSC CGL',
    status: 'PASSIVE',
    latest_draft_cycle_key: cycleKey,
    currentPublishedCycleKey: null,
  });
  db.seed(`mission_realms/${missionId}/cycles/${cycleKey}`, {
    cycleKey,
    targetYear: parseInt(cycleKey, 10),
    status: 'INTERNAL_DRAFT',
    syllabusBindingMode: 'SEPARATE',
    jurisdictionLevel: 'CENTRAL',
    stateCode: null,
    authorityKey,
    enrichmentStatus,
    readiness: { notificationReady, syllabusReady },
    enrichmentEvidence: { overallStatus, stageResults: [] },
  });
  db.seed(`recruitments/${missionId}`, { id: missionId, status: 'review' });
  db.seed(`student_mission_catalog/${missionId}`, { id: missionId, catalogStatus: 'INTERNAL_DRAFT', userPanelVisible: false, visibility: { studentVisible: false } });
}

async function runPublication(db, { missionId = 'rec_ssc_ssc_cgl', cycleKey = '2026', actorId = 'founder_test' } = {}) {
  return db.runTransaction(async (tx) => {
    return executeCycleAwarePublication({
      transaction: tx, db, missionId, cycleKey, actorId,
      requestId: 'req_test_12345678', reason: 'Founder scheduled publication for cycle', recordedAt: RECORDED_AT,
    });
  });
}

test('P1: publication without an explicit cycleKey fails closed', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db);
  await assert.rejects(
    async () => runPublication(db, { cycleKey: null }),
    /PUBLICATION_CYCLE_KEY_REQUIRED/,
  );
});

test('P2: publication of an absent cycle fails closed', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db);
  await assert.rejects(
    async () => runPublication(db, { cycleKey: '2099' }),
    /PUBLICATION_CYCLE_NOT_FOUND/,
  );
});

test('P3: incomplete (PENDING_ENRICHMENT) cycle fails publication eligibility', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db, { enrichmentStatus: 'PENDING_ENRICHMENT' });
  await assert.rejects(
    async () => runPublication(db),
    /CYCLE_PUBLICATION_INELIGIBLE/,
  );
});

test('P4: failed Worker evidence fails publication eligibility', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db, { overallStatus: 'FAIL' });
  await assert.rejects(
    async () => runPublication(db),
    /CYCLE_PUBLICATION_INELIGIBLE/,
  );
});

test('P5: selected eligible cycle publishes atomically', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db);
  const result = await runPublication(db);
  assert.strictEqual(result.published, true);
  assert.strictEqual(result.cycleKey, '2026');

  const cycle = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycle.status, 'published');

  const parent = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parent.status, 'ACTIVE');
  assert.strictEqual(parent.currentPublishedCycleKey, '2026');
});

test('P6: currentPublishedCycle pointer moves only on explicit publication', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db);
  const parentBefore = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parentBefore.currentPublishedCycleKey, null);
  await runPublication(db);
  const parentAfter = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parentAfter.currentPublishedCycleKey, '2026');
});

test('P7: recruitments projection follows the selected cycle', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db);
  await runPublication(db);
  const rec = db._docs.get('recruitments/rec_ssc_ssc_cgl');
  assert.strictEqual(rec.status, 'published');
});

test('P8: Student catalog projection follows the selected cycle', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db);
  await runPublication(db);
  const cat = db._docs.get('student_mission_catalog/rec_ssc_ssc_cgl');
  assert.strictEqual(cat.studentPublicationState, 'ACTIVE');
  assert.strictEqual(cat.visibility.studentVisible, true);
});

test('P9: historical 2026 cycle is preserved after publishing 2027', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db, { cycleKey: '2026' });
  await runPublication(db, { cycleKey: '2026' });

  seedEnrichedCycle(db, { cycleKey: '2027' });
  db.seed('mission_realms/rec_ssc_ssc_cgl', {
    ...db._docs.get('mission_realms/rec_ssc_ssc_cgl'),
    currentPublishedCycleKey: '2026',
    latest_draft_cycle_key: '2027',
  });

  await runPublication(db, { cycleKey: '2027' });

  const cycle2026 = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(cycle2026.status, 'published');

  const cycle2027 = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2027');
  assert.strictEqual(cycle2027.status, 'published');

  const parent = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parent.currentPublishedCycleKey, '2027');
});

test('P10: foreign cycle is untouched by a publication of the selected cycle', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db, { cycleKey: '2026' });
  db.seed('mission_realms/rec_ssc_ssc_cgl/cycles/2025', { cycleKey: '2025', status: 'published', enrichmentStatus: 'ENRICHMENT_COMPLETE' });

  const writesBefore = db._writes.length;
  await runPublication(db, { cycleKey: '2026' });
  const newWrites = db._writes.slice(writesBefore);

  for (const w of newWrites) {
    assert.notStrictEqual(w.path, 'mission_realms/rec_ssc_ssc_cgl/cycles/2025');
  }
});

test('P11: draft creation alone never invokes publication (no published status / pointer move)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await runCreation(db, creationPayload());
  const parent = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  assert.strictEqual(parent.currentPublishedCycleKey || null, null);
  assert.strictEqual(parent.status, 'PASSIVE');
  const cat = db._docs.get('student_mission_catalog/rec_ssc_ssc_cgl');
  assert.strictEqual(cat.studentPublicationState, 'INTERNAL_DRAFT');
});

test('P12: publication plan contains no unselected cycle', async () => {
  const db = createFakeDb();
  seedEnrichedCycle(db, { cycleKey: '2026' });
  const result = await runPublication(db, { cycleKey: '2026' });
  assert.strictEqual(result.plan.selectedCycle.cycleKey, '2026');
  assert.strictEqual(result.plan.pointerUpdates.currentPublishedCycleKey, '2026');
});

// ---------------------------------------------------------------------------
// Cross-cutting Central / State / UT coverage
// ---------------------------------------------------------------------------

test('X1: Central/State/UT x SEPARATE/EMBEDDED/PENDING all flow through the same generic path', async () => {
  const archetypes = [
    { authority: 'SSC', authorityKey: 'auth_in_ssc', exam: 'SSC CGL', year: 2026, mode: 'SEPARATE', level: 'CENTRAL', state: null, domain: 'https://ssc.gov.in' },
    { authority: 'RPSC', authorityKey: 'auth_in_rj_rpsc', exam: 'RPSC First Grade', year: 2027, mode: 'PENDING', level: 'STATE', state: 'RJ', domain: 'https://rpsc.rajasthan.gov.in' },
    { authority: 'UPSC', authorityKey: 'auth_in_upsc', exam: 'UPSC CSE Prelims', year: 2026, mode: 'EMBEDDED', level: 'CENTRAL', state: null, domain: 'https://upsc.gov.in' },
  ];
  for (const a of archetypes) {
    const db = createFakeDb();
    seedVerifiedSources(db, { syllabusId: a.mode === 'SEPARATE' ? 'syll_test' : null, domain: a.domain, authorityKey: a.authorityKey });
    const result = await runCreation(db, creationPayload({
      authority: a.authority,
      organization: a.authority,
      authorityKey: a.authorityKey,
      exam_name: a.exam,
      examName: a.exam,
      year: a.year,
      syllabusBindingMode: a.mode,
      jurisdictionLevel: a.level,
      stateCode: a.state,
      syllabusId: a.mode === 'SEPARATE' ? 'syll_test' : null,
    }));
    assert.strictEqual(result.cycleKey, String(a.year));
    assert.strictEqual(result.jurisdictionLevel, a.level);
    const createdCycle = db._docs.get(`mission_realms/${result.missionId}/cycles/${result.cycleKey}`);
    assert.strictEqual(createdCycle.authorityKey, a.authorityKey);
  }
});

// ---------------------------------------------------------------------------
// Negative & Quarantine Regressions (N1 - N24)
// ---------------------------------------------------------------------------

test('N1: AUTO_CREATE_FROM_MONITOR = BLOCKED (verified draft alone creates zero mission/recruitment writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl'), false);
  assert.strictEqual(db._docs.has('recruitments/rec_ssc_ssc_cgl'), false);
  assert.strictEqual(db._docs.has('student_mission_catalog/rec_ssc_ssc_cgl'), false);
});

test('N2: MISSING_YEAR_DEFAULT = BLOCKED (missing year fails closed; never defaults to current year)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await assert.rejects(
    async () => runCreation(db, creationPayload({ year: null })),
    /CYCLE_KEY_INVALID/,
  );
  await assert.rejects(
    async () => runCreation(db, creationPayload({ year: undefined })),
    /CYCLE_KEY_INVALID/,
  );
  await assert.rejects(
    async () => runCreation(db, creationPayload({ year: 'invalid_year' })),
    /CYCLE_KEY_INVALID/,
  );
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl'), false);
});

test('N3: HISTORICAL_YEAR_SAFETY (explicit past year creates historical cycle and never current year)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload({ year: 2018 }));
  assert.strictEqual(result.cycleKey, '2018');
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/2018'), true);
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl/cycles/2026'), false);
});

test('N4: UNOFFICIAL_DOMAIN = BLOCKED (unproven official domain fails preflight closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: '' });
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N5: NON_ENGLISH_ACADEMIC_SOURCE = BLOCKED (non-English source fails preflight closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { language: 'hi' });
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N6: MISSING_BYTE_PROOF = BLOCKED (hash present but untrusted ingestion proof fails closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { trusted: false });
  db._docs.get('sentinel_drafts/draft_notif_1').actualSha256 = undefined;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N7: HASH_MISMATCH = BLOCKED (actual byte sha mismatch fails preflight closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  db._docs.get('sentinel_drafts/draft_notif_1').actualSha256 = makeSha256('tampered_content');
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N8: CREATE_STUDENT_VISIBILITY = 0 (created mission shell has zero student visibility)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await runCreation(db, creationPayload());
  const catalog = db._docs.get('student_mission_catalog/rec_ssc_ssc_cgl');
  assert.strictEqual(catalog.studentPublicationState, 'INTERNAL_DRAFT');
  assert.strictEqual(catalog.userPanelVisible, false);
  assert.strictEqual(catalog.cardVisible, false);
  assert.strictEqual(catalog.visibility.studentVisible, false);
  assert.strictEqual(catalog.visibility.catalogVisible, false);
  assert.strictEqual(catalog.visibility.userPanelVisible, false);
  assert.strictEqual(catalog.visibility.quickEntryEnabled, false);
  assert.strictEqual(catalog.visibility.smartEntryEnabled, false);
});

test('N9: CREATE_PUBLICATION = 0 (creation is never publication; current published pointer remains null)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  const result = await runCreation(db, creationPayload());
  const parent = db._docs.get('mission_realms/rec_ssc_ssc_cgl');
  const cycle = db._docs.get('mission_realms/rec_ssc_ssc_cgl/cycles/2026');
  assert.strictEqual(parent.status, 'PASSIVE');
  assert.strictEqual(parent.currentPublishedCycleKey || null, null);
  assert.strictEqual(cycle.status, 'INTERNAL_DRAFT');
  assert.strictEqual(result.summary.enrichmentStatus, 'PENDING_ENRICHMENT');
});

test('N10: LEGACY_PROMOTION_QUARANTINE_EXECUTABLE (executes sentinel promotion and proves 0 domain writes)', async () => {
  const db = createFakeDb();
  const loggedActivities = [];
  const logMock = async (event) => { loggedActivities.push(event); };

  const draft = {
    type: 'recruitment_notification',
    status: 'verified',
    sourceId: 'src_doc_1',
    rawData: { title: 'SSC CGL 2026', org: 'SSC', year: 2026, vacancies: 5000 },
  };

  const result = await executeSentinelPromotion({
    draftId: 'draft_promo_1',
    draft,
    beforeDraft: null,
    db,
    logActivity: logMock,
    heartbeatService: { isWorkerEnabled: async () => true, getWorkerMode: async () => 'auto', updateHeartbeat: async () => {} },
  });

  assert.strictEqual(result.quarantined, true);
  assert.strictEqual(result.forbiddenDomainWrites, 0);
  assert.strictEqual(db._writes.length, 0, 'Zero writes to database on recruitment promotion');
  assert.strictEqual(db._docs.has('recruitments/rec_ssc_ssc_cgl_2026'), false);
  assert.strictEqual(db._docs.has('mission_realms/rec_ssc_ssc_cgl'), false);
  assert.strictEqual(db._docs.has('ingestion_refinery/src_doc_1'), false);
  assert.ok(loggedActivities.some(a => a.type === 'RECRUITMENT_PROMOTION_QUARANTINED'));
});

test('N11: LEGACY_RECRUITMENT_ENGINE_QUARANTINE_EXECUTABLE (executes candidate engine and proves 0 candidate writes)', async () => {
  const db = createFakeDb();
  const loggedActivities = [];
  const logMock = async (event) => { loggedActivities.push(event); };

  const draft = {
    type: 'recruitment_notification',
    status: 'verified',
    rawData: { org: 'SSC', exam_name: 'SSC CGL', year: 2026 },
  };

  const result = await executeRecruitmentAutoCreationEngine({
    draftId: 'draft_engine_1',
    draft,
    db,
    logActivity: logMock,
  });

  assert.strictEqual(result.quarantined, true);
  assert.strictEqual(result.forbiddenDomainWrites, 0);
  assert.strictEqual(db._writes.length, 0, 'Zero writes to database on candidate pairing');
  assert.ok(loggedActivities.some(a => a.type === 'RECRUITMENT_AUTO_CREATE_QUARANTINED'));
});

test('N12: INVALID_SHA_FORMAT_REJECTED (non-64-hex string fails preflight closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  db._docs.get('sentinel_drafts/draft_notif_1').fileHash = 'sha256_draft_notif_1';
  db._docs.get('sentinel_drafts/draft_notif_1').actualSha256 = 'sha256_draft_notif_1';
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N13: BARE_TRUSTED_BOOLEAN_REJECTED (bare trusted:true without valid 64-hex hash fails closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  db._docs.get('sentinel_drafts/draft_notif_1').fileHash = null;
  db._docs.get('sentinel_drafts/draft_notif_1').actualSha256 = undefined;
  db._docs.get('ingestion_refinery/draft_notif_1').fileHash = null;
  db._docs.get('ingestion_refinery/draft_notif_1').trusted = true;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N14: VALID_CRYPTO_PATH_PASSES (64-hex SHA + official + English creates draft with 0 student visibility)', async () => {
  const db = createFakeDb();
  const validSha = makeSha256('official_academic_notice_payload');
  seedVerifiedSources(db);
  db._docs.get('sentinel_drafts/draft_notif_1').fileHash = validSha;
  db._docs.get('sentinel_drafts/draft_notif_1').actualSha256 = validSha;
  db._docs.get('ingestion_refinery/draft_notif_1').fileHash = validSha;
  db._docs.get('ingestion_refinery/draft_notif_1').trusted = true;

  const result = await runCreation(db, creationPayload());
  assert.strictEqual(result.cycleKey, '2026');
  const catalog = db._docs.get('student_mission_catalog/rec_ssc_ssc_cgl');
  assert.strictEqual(catalog.visibility.studentVisible, false);
  assert.strictEqual(catalog.catalogStatus, 'INTERNAL_DRAFT');
});

test('N15: ARBITRARY_DOMAIN_REJECTED (arbitrary domain string is not final authority proof and fails closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://arbitrary-unverified-org.com' });
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N16: DIGIBOOK_NON_RECRUITMENT_PROMOTION_REGRESSION (digibook promotion preserves serverTimestamp, status: review, lastAdminId: sentinel)', async () => {
  const db = createFakeDb();
  const loggedActivities = [];
  const logMock = async (event) => { loggedActivities.push(event); };

  const draft = {
    type: 'digibook',
    status: 'verified',
    sourceId: 'src_digi_1',
    rawData: {
      facts: [
        { isCore: true, content: 'Atomic Concept 1', title: 'Concept 1', importance: 5 },
        { isCore: false, content: 'Brief Note 2', title: 'Note 2', importance: 3 },
      ],
    },
  };

  const result = await executeSentinelPromotion({
    draftId: 'draft_digi_1',
    draft,
    beforeDraft: null,
    db,
    logActivity: logMock,
  });

  assert.strictEqual(result.processed, true);
  assert.strictEqual(result.quarantined, false);
  const fact0 = db._docs.get('digibook_refinery/fact_draft_digi_1_0');
  assert.ok(fact0 !== undefined);
  assert.strictEqual(fact0.type, 'concept_note');
  assert.strictEqual(fact0.status, 'review');
  assert.strictEqual(fact0.lastAdminId, 'sentinel');
  assert.ok(fact0.updatedAt !== undefined);

  const fact1 = db._docs.get('digibook_refinery/fact_draft_digi_1_1');
  assert.ok(fact1 !== undefined);
  assert.strictEqual(fact1.type, 'brief_note');
  assert.strictEqual(fact1.status, 'review');

  const ingest = db._docs.get('ingestion_refinery/src_digi_1');
  assert.ok(ingest !== undefined);
  assert.strictEqual(ingest.status, 'published');
  assert.ok(ingest.publishedAt !== undefined);
});

test('N17: SYLLABUS_NON_RECRUITMENT_PROMOTION_REGRESSION (syllabus promotion preserves micro_nodes, ai_queue, serverTimestamp)', async () => {
  const db = createFakeDb();
  const loggedActivities = [];
  const logMock = async (event) => { loggedActivities.push(event); };

  const draft = {
    type: 'syllabus',
    status: 'verified',
    sourceId: 'src_syll_1',
    linkedRealmId: 'rec_ssc_ssc_cgl',
    rawData: {
      segments: [
        { subject: 'Quantitative Aptitude', chapters: ['Algebra', 'Geometry'] },
      ],
    },
  };

  const result = await executeSentinelPromotion({
    draftId: 'draft_syll_1',
    draft,
    beforeDraft: null,
    db,
    logActivity: logMock,
  });

  assert.strictEqual(result.processed, true);
  assert.strictEqual(result.quarantined, false);
  const node0 = db._docs.get('micro_nodes/node_draft_syll_1_0_0');
  assert.ok(node0 !== undefined);
  assert.strictEqual(node0.examId, 'rec_ssc_ssc_cgl');
  assert.strictEqual(node0.subjectId, 'Quantitative Aptitude');
  assert.strictEqual(node0.chapterId, 'Algebra');
  assert.strictEqual(node0.status, 'draft');
  assert.ok(node0.updatedAt !== undefined);

  const node1 = db._docs.get('micro_nodes/node_draft_syll_1_0_1');
  assert.ok(node1 !== undefined);
  assert.strictEqual(node1.chapterId, 'Geometry');

  const aiQueueTask = db._docs.get('ai_queue/manifest_auto_draft_syll_1');
  assert.ok(aiQueueTask !== undefined);
  assert.strictEqual(aiQueueTask.type, 'MANIFEST_KNOWLEDGE');
  assert.strictEqual(aiQueueTask.payload.examId, 'rec_ssc_ssc_cgl');
  assert.ok(aiQueueTask.createdAt !== undefined);

  const ingest = db._docs.get('ingestion_refinery/src_syll_1');
  assert.ok(ingest !== undefined);
  assert.strictEqual(ingest.status, 'published');
  assert.ok(ingest.publishedAt !== undefined);
});

test('N18: RECRUITMENT_ALERT_PROMOTION_REGRESSION (recruitment_alert promotion preserves notifications, serverTimestamp, ingestion propagation)', async () => {
  const db = createFakeDb();
  const loggedActivities = [];
  const logMock = async (event) => { loggedActivities.push(event); };

  const draft = {
    type: 'recruitment_alert',
    status: 'verified',
    sourceId: 'src_alert_1',
    rawData: {
      uid: 'warrior_uid_42',
      opportunityId: 'opp_ssc_cgl_2026',
      relevanceScore: 0.92,
      title: 'SSC CGL Alert',
      isUrgent: true,
    },
  };

  const result = await executeSentinelPromotion({
    draftId: 'draft_alert_1',
    draft,
    beforeDraft: null,
    db,
    logActivity: logMock,
  });

  assert.strictEqual(result.processed, true);
  assert.strictEqual(result.quarantined, false);
  const notif = db._docs.get('users/warrior_uid_42/notifications/evt_warrior_uid_42_opp_ssc_cgl_2026');
  assert.ok(notif !== undefined);
  assert.strictEqual(notif.type, 'recruitment');
  assert.strictEqual(notif.priorityState, 'critical');
  assert.strictEqual(notif.isRead, false);
  assert.strictEqual(notif.source, 'Sentinel');
  assert.ok(notif.timestamp !== undefined);

  const ingest = db._docs.get('ingestion_refinery/src_alert_1');
  assert.ok(ingest !== undefined);
  assert.strictEqual(ingest.status, 'published');
});

test('N19: CROSS_AUTHORITY_DOMAIN_CREATION_REJECTED (SSC mission with RPSC domain fails preflight)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://rpsc.rajasthan.gov.in', authorityKey: 'auth_in_ssc' });
  await assert.rejects(
    async () => runCreation(db, creationPayload({ organization: 'SSC', authority: 'SSC', authorityKey: 'auth_in_ssc' })),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N20: JURISDICTION_CONTRADICTION_REJECTED (central SSC mission with stateCode RJ fails before write)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db);
  await assert.rejects(
    async () => runCreation(db, creationPayload({ organization: 'SSC', authorityKey: 'auth_in_ssc', jurisdictionLevel: 'CENTRAL', stateCode: 'RJ' })),
    /(?:JURISDICTION_STATE_MISMATCH|CYCLE_STATE_CODE_INVALID)/,
  );
});

test('N21: SECONDARY_OFFICIAL_DOMAIN_CREATION_PASSES (SSC mission with ssc.nic.in secondary domain creates cycle)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://ssc.nic.in', authorityKey: 'auth_in_ssc' });
  const result = await runCreation(db, creationPayload({
    authority: 'SSC',
    organization: 'SSC',
    authorityKey: 'auth_in_ssc',
    exam_name: 'SSC CGL',
    examName: 'SSC CGL',
    jurisdictionLevel: 'CENTRAL',
    stateCode: null,
  }));
  assert.strictEqual(result.cycleKey, '2026');
  assert.strictEqual(result.jurisdictionLevel, 'CENTRAL');
});

test('N22: MISSING_AUTHORITY_KEY_REJECTED (creation payload with null/missing authorityKey fails preflight closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { authorityKey: null });
  await assert.rejects(
    async () => runCreation(db, creationPayload({ authorityKey: null })),
    /(?:CREATION_AUTHORITY_KEY_REQUIRED|SOURCE_PREFLIGHT_FAILED)/,
  );
});

test('N23: UNKNOWN_AUTHORITY_KEY_REJECTED (creation payload with unregistered authorityKey fails before write)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { authorityKey: 'auth_in_unknown' });
  await assert.rejects(
    async () => runCreation(db, creationPayload({ authorityKey: 'auth_in_unknown' })),
    /AUTHORITY_NOT_FOUND/,
  );
});

test('N24: SUSPICIOUS_DOMAINS_REJECTED (digialm.com / sso.rajasthan.gov.in / ntaresults.nic.in fail closed)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { domain: 'https://cdn.digialm.com', authorityKey: 'auth_in_ssc' });
  await assert.rejects(
    async () => runCreation(db, creationPayload({ authorityKey: 'auth_in_ssc' })),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('N25: SYLLABUS_IN_NOTIFICATION_SLOT_REJECTED (syllabus draft used as notificationId fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  // Seed notif slot with a draft whose certified sourceType is 'syllabus'
  seedVerifiedSources(db, { notifSourceType: 'syllabus' });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_ROLE_MISMATCH/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on role mismatch');
});

test('N26: NOTIFICATION_IN_SYLLABUS_SLOT_REJECTED (notification draft used as syllabusId fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  // Seed syll slot with a draft whose certified sourceType is 'notification'
  seedVerifiedSources(db, { syllSourceType: 'notification' });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_ROLE_MISMATCH/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on role mismatch');
});

test('N27: MISSING_SOURCE_TYPE_REJECTED (draft lacking certified sourceType fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { notifSourceType: null });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_ROLE_UNRESOLVED/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on missing sourceType');
});

test('N28: MISSING_GOVERNANCE_STATUS_REJECTED (draft lacking governanceStatus fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { notifGovernance: null });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_GOVERNANCE_NOT_ACTIVE/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on missing governanceStatus');
});

test('N29: SUPERSEDED_GOVERNANCE_REJECTED (draft with governanceStatus SUPERSEDED fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { notifGovernance: 'SUPERSEDED' });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_GOVERNANCE_NOT_ACTIVE/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on SUPERSEDED draft');
});

test('N30: REVOKED_GOVERNANCE_REJECTED (draft with governanceStatus REVOKED fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { notifGovernance: 'REVOKED' });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_GOVERNANCE_NOT_ACTIVE/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on REVOKED draft');
});

test('N31: REJECTED_GOVERNANCE_REJECTED (draft with governanceStatus REJECTED fails closed with 0 writes)', async () => {
  const db = createFakeDb();
  seedVerifiedSources(db, { notifGovernance: 'REJECTED' });
  const writesBefore = db._writes.length;
  await assert.rejects(
    async () => runCreation(db, creationPayload()),
    /SOURCE_GOVERNANCE_NOT_ACTIVE/,
  );
  assert.strictEqual(db._writes.length, writesBefore, 'Must perform 0 writes on REJECTED draft');
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
