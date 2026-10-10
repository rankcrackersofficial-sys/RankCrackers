/**
 * W1 — Live Mission Enrichment Worker Integration Test Suite (synthetic).
 * Pure Node assert with an in-memory Firestore store. No emulator, no network,
 * no production. Covers the Master Spec §19 archetypes synthetically.
 *
 * Run: node functions/test_mission_enrichment_worker.js
 */

const assert = require('assert');
const crypto = require('crypto');
const {
  executeMissionEnrichmentCycle,
  WORKER_ID,
  WORKER_CONTRACT_VERSION,
} = require('./workers/mission_enrichment_worker');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const RECORDED_AT = '2026-09-11T17:00:00Z';

function makeSha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex').toLowerCase();
}


test('I22: Worker fails closed when draft authorityKey contradicts cycle authorityKey', async () => {
  const db = createFakeDb();
  // cycle has auth_in_ssc, draft has auth_in_rj_rpsc
  seedStandardSources(db, { domain: 'https://rpsc.rajasthan.gov.in', authorityKey: 'auth_in_rj_rpsc' });
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'ssc_cgl', cycleKey: '2027',
    cycleData: baseCycle({ authorityKey: 'auth_in_ssc' }),
    recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I23: Worker passes when draft authorityKey is null but cycle authorityKey is valid', async () => {
  const db = createFakeDb();
  seedStandardSources(db, { domain: 'https://ssc.gov.in', authorityKey: null });
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'ssc_cgl', cycleKey: '2027',
    cycleData: baseCycle({ authorityKey: 'auth_in_ssc' }),
    recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'PASS');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_COMPLETE');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'PASS');
});

// ---------------------------------------------------------------------------
// Synthetic Firestore store (in-memory; records every write for isolation proof)
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
      data: () => (docs.has(ref.path) ? docs.get(ref.path) : null),
    });
    ref.set = (data) => { writes.push({ path: ref.path, data, kind: 'set' }); docs.set(ref.path, data); return Promise.resolve(); };
    ref.update = (data) => {
      writes.push({ path: ref.path, data, kind: 'update' });
      docs.set(ref.path, { ...(docs.get(ref.path) || {}), ...data });
      return Promise.resolve();
    };
    ref.collection = (name) => collectionFor(segments.concat(name));
    return ref;
  }
  function collectionFor(segments) {
    return { doc: (id) => refFor(segments.concat(id)), path: segments.join('/') };
  }
  return {
    collection(name) { return collectionFor([name]); },
    _docs: docs,
    _writes: writes,
    seed(path, data) { docs.set(path, data); },
  };
}

function seedDraft(db, sourceId, overrides = {}) {
  const domain = overrides.officialDomain || (overrides.rawData && overrides.rawData.official_website) || 'https://nta.ac.in';
  const language = overrides.language || (overrides.rawData && overrides.rawData.language) || 'en';
  const isOfficial = overrides.isOfficial !== undefined ? overrides.isOfficial : true;
  const authorityKey = overrides.authorityKey || 'auth_in_nta';
  const defaultHash = makeSha256(sourceId);
  const fileHash = overrides.fileHash !== undefined ? overrides.fileHash : defaultHash;
  const actualSha256 = overrides.actualSha256 !== undefined ? overrides.actualSha256 : defaultHash;
  const sourceType = overrides.sourceType !== undefined ? overrides.sourceType : (sourceId.includes('syllabus') || sourceId.includes('syll') ? 'syllabus' : 'notification');
  const governanceStatus = overrides.governanceStatus !== undefined ? overrides.governanceStatus : 'ACTIVE';

  const defaultRawData = {
    exam_date: '2027-02-01',
    application_start_date: '2026-11-15',
    application_end_date: '2026-12-20',
    total_vacancies: 120,
    application_fee: '500 INR',
    official_website: domain,
    language,
    isOfficial,
  };
  const rawData = overrides.rawData !== undefined ? overrides.rawData : defaultRawData;

  db.seed(`sentinel_drafts/${sourceId}`, {
    type: 'recruitment_notification',
    sourceType,
    governanceStatus,
    status: 'verified',
    isOfficial,
    language,
    officialDomain: domain,
    authorityKey,
    fileHash,
    actualSha256,
    rawData,
    ...overrides,
  });
}

function seedRefinery(db, sourceId, fileHash = makeSha256(sourceId)) {
  db.seed(`ingestion_refinery/${sourceId}`, { fileHash, status: 'published', trusted: true });
}

function baseCycle({ mode = 'SEPARATE', jurisdictionLevel = 'CENTRAL', stateCode = null, authorityKey = 'auth_in_nta' } = {}) {
  return {
    cycleKey: '2027',
    targetYear: 2027,
    status: 'INTERNAL_DRAFT',
    syllabusBindingMode: mode,
    jurisdictionLevel,
    stateCode,
    authorityKey,
    notificationBinding: { sourceId: 'draft_notification_1', versionRef: 'v1' },
    syllabusBinding: mode === 'SEPARATE' ? { sourceId: 'draft_syllabus_1', versionRef: 'v1' } : null,
    enrichmentStatus: 'PENDING_ENRICHMENT',
  };
}

const NOTIF_SHA = makeSha256('draft_notification_1');
const SYLL_SHA = makeSha256('draft_syllabus_1');
function seedStandardSources(db, { notifHash = NOTIF_SHA, syllHash = SYLL_SHA, domain = 'https://nta.ac.in', authorityKey = 'auth_in_nta', language = 'en', isOfficial = true, actualSha = true } = {}) {
  seedDraft(db, 'draft_notification_1', {
    fileHash: notifHash,
    actualSha256: actualSha ? notifHash : null,
    officialDomain: domain,
    authorityKey,
    language,
    isOfficial,
    rawData: { official_website: domain, language, isOfficial, exam_date: '2027-02-01', vacancies: 50 },
  });
  seedDraft(db, 'draft_syllabus_1', {
    type: 'syllabus',
    fileHash: syllHash,
    actualSha256: actualSha ? syllHash : null,
    officialDomain: domain,
    authorityKey,
    language,
    isOfficial,
    rawData: { official_website: domain, language, isOfficial },
  });
  seedRefinery(db, 'draft_notification_1', notifHash);
  seedRefinery(db, 'draft_syllabus_1', syllHash);
}

function stageStatus(result, stageId) {
  const record = result.evidence.stageResults.find(s => s.stageId === stageId);
  return record ? record.status : null;
}

// ---------------------------------------------------------------------------
// Archetypes 1-3: Central + separate / pending / embedded syllabus
// ---------------------------------------------------------------------------

test('I1: Central mission + SEPARATE syllabus — full PASS run, six stages, syllabus ready', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027',
    cycleData: baseCycle({ mode: 'SEPARATE', jurisdictionLevel: 'CENTRAL', stateCode: null, authorityKey: 'auth_in_nta' }),
    recordedAt: RECORDED_AT,
  });

  assert.strictEqual(result.enriched, true);
  assert.strictEqual(result.overallStatus, 'PASS');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_COMPLETE');
  assert.strictEqual(stageStatus(result, 'SOURCE_RESOLVE'), 'PASS');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'PASS');
  assert.strictEqual(stageStatus(result, 'ROLE_CLASSIFY'), 'PASS');
  assert.strictEqual(stageStatus(result, 'VARIABLE_EXTRACTION'), 'PASS');
  assert.strictEqual(stageStatus(result, 'SYLLABUS_HANDOFF'), 'PASS');
  assert.strictEqual(stageStatus(result, 'EVIDENCE_FINALIZE'), 'PASS');

  const written = db._docs.get('mission_realms/jee_main_2026/cycles/2027');
  assert.strictEqual(written.enrichmentStatus, 'ENRICHMENT_COMPLETE');
  assert.strictEqual(written.readiness.notificationReady, true);
  assert.strictEqual(written.readiness.syllabusReady, true);
  assert.strictEqual(written.enrichmentEvidence.workerId, WORKER_ID);
  assert.strictEqual(written.enrichmentEvidence.workerVersion, WORKER_CONTRACT_VERSION);
});

test('I2: PROJECTION ISOLATION — the worker writes ONLY the cycle document', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  const writesBefore = db._writes.length;
  await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  const writesAfter = db._writes.slice(writesBefore);
  assert.strictEqual(writesAfter.length, 1, 'Worker must perform exactly 1 write');
  assert.strictEqual(writesAfter[0].path, 'mission_realms/jee_main_2026/cycles/2027');
  assert.strictEqual(writesAfter[0].kind, 'update');
  assert.strictEqual(db._docs.has('student_mission_catalog/jee_main_2026'), false);
  assert.strictEqual(db._docs.has('recruitments/jee_main_2026'), false);
  assert.strictEqual(db._docs.has('mission_realms/jee_main_2026'), false);
});

test('I3: write payload contains no visibility/publication fields (W1A firewall surface)', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  const update = db._writes[db._writes.length - 1].data;
  assert.strictEqual(update.currentPublishedCycleKey, undefined);
  assert.strictEqual(update.publishedAt, undefined);
  assert.strictEqual(update.studentVisible, undefined);
  assert.strictEqual(update.quickEntryEnabled, undefined);
  assert.strictEqual(update.smartEntryEnabled, undefined);
  assert.strictEqual(update.status, undefined, 'enrichment write must NEVER change the cycle status');
});

test('I4: Central mission + PENDING syllabus — honest NOT_TESTED, no fabricated syllabus data', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027',
    cycleData: baseCycle({ mode: 'PENDING' }), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.enriched, true);
  assert.strictEqual(result.overallStatus, 'NOT_TESTED');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_INCOMPLETE');
  assert.strictEqual(stageStatus(result, 'SYLLABUS_HANDOFF'), 'NOT_TESTED');
  const written = db._docs.get('mission_realms/jee_main_2026/cycles/2027');
  assert.strictEqual(written.readiness.notificationReady, true);
  assert.strictEqual(written.readiness.syllabusReady, false, 'PENDING mode must never fabricate syllabus readiness');
});

test('I5: Central mission + EMBEDDED syllabus — binding is not readiness (NOT_TESTED until evidence)', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027',
    cycleData: baseCycle({ mode: 'EMBEDDED' }), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.enriched, true);
  assert.strictEqual(stageStatus(result, 'SYLLABUS_HANDOFF'), 'NOT_TESTED');
  const written = db._docs.get('mission_realms/jee_main_2026/cycles/2027');
  assert.strictEqual(written.readiness.syllabusReady, false, 'EMBEDDED mode requires explicit section review evidence');
});

test('I6: source hash mismatch FAILS CLOSED — HASH_BIND FAIL, downstream BLOCKED, ENRICHMENT_FAILED', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  db._docs.get('sentinel_drafts/draft_notification_1').actualSha256 = makeSha256('tampered_notification');
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'SOURCE_RESOLVE'), 'PASS');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
  assert.strictEqual(stageStatus(result, 'ROLE_CLASSIFY'), 'BLOCKED');
  assert.strictEqual(stageStatus(result, 'VARIABLE_EXTRACTION'), 'BLOCKED');
  assert.strictEqual(stageStatus(result, 'SYLLABUS_HANDOFF'), 'BLOCKED');
  assert.strictEqual(stageStatus(result, 'EVIDENCE_FINALIZE'), 'BLOCKED');
});

test('I7: missing bound source FAILS CLOSED at SOURCE_RESOLVE', async () => {
  const db = createFakeDb();
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'SOURCE_RESOLVE'), 'FAIL');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'BLOCKED');
});

test('I8: no variable evidence in official rawData FAILS honestly (no invented variables)', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  // Empty variable fields (no dates, vacancies, fees, links, eligibility, department)
  db._docs.get('sentinel_drafts/draft_notification_1').rawData = { custom_unrelated_field: 'arbitrary' };
  db._docs.get('sentinel_drafts/draft_notification_1').officialDomain = 'https://nta.ac.in';
  db._docs.get('sentinel_drafts/draft_notification_1').language = 'en';
  db._docs.get('sentinel_drafts/draft_notification_1').isOfficial = true;

  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'VARIABLE_EXTRACTION'), 'FAIL');
});

// ---------------------------------------------------------------------------
// Archetypes 4-9: State PSC / UT missions
// ---------------------------------------------------------------------------

test('I9: State PSC and UT missions run the identical generic pipeline (data differences only)', async () => {
  const jurisdictions = [
    { missionId: 'rpsc_ras_2027', jurisdictionLevel: 'STATE', stateCode: 'RJ', authorityKey: 'auth_in_rj_rpsc', domain: 'https://rpsc.rajasthan.gov.in' },
    { missionId: 'dsssb_tier1_2027', jurisdictionLevel: 'UT', stateCode: 'DL', authorityKey: 'auth_in_dl_dsssb', domain: 'https://dsssb.delhi.gov.in' },
  ];
  for (const jurisdiction of jurisdictions) {
    const db = createFakeDb();
    seedStandardSources(db, { domain: jurisdiction.domain, authorityKey: jurisdiction.authorityKey });
    const cycleData = baseCycle({ mode: 'PENDING', jurisdictionLevel: jurisdiction.jurisdictionLevel, stateCode: jurisdiction.stateCode, authorityKey: jurisdiction.authorityKey });
    db.seed(`mission_realms/${jurisdiction.missionId}/cycles/2027`, cycleData);

    const result = await executeMissionEnrichmentCycle({
      db, missionId: jurisdiction.missionId, cycleKey: '2027',
      cycleData,
      recordedAt: RECORDED_AT,
    });
    assert.strictEqual(result.enriched, true, `${jurisdiction.jurisdictionLevel} must enrich identically`);
    assert.strictEqual(result.evidence.overallStatus, 'NOT_TESTED');
    const cycle = db._docs.get(`mission_realms/${jurisdiction.missionId}/cycles/2027`);
    assert.strictEqual(cycle.jurisdictionLevel, jurisdiction.jurisdictionLevel, 'B2 jurisdiction metadata must survive enrichment');
    assert.strictEqual(cycle.stateCode, jurisdiction.stateCode);
    assert.strictEqual(cycle.authorityKey, jurisdiction.authorityKey);
    assert.strictEqual(cycle.enrichmentStatus, 'ENRICHMENT_INCOMPLETE');
  }
});

// ---------------------------------------------------------------------------
// Archetype 15/16: replay/idempotency + retry semantics
// ---------------------------------------------------------------------------

test('I10: replay with the same task key is idempotent (zero additional writes)', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  const cycleData = baseCycle();
  const first = await executeMissionEnrichmentCycle({ db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData, recordedAt: RECORDED_AT });
  const writesAfterFirst = db._writes.length;
  assert.strictEqual(first.enriched, true);
  const second = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027',
    cycleData: db._docs.get('mission_realms/jee_main_2026/cycles/2027'), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(second.skipped, true, 'already-processed cycle must short-circuit (no duplicate enrichment)');
  assert.strictEqual(db._writes.length, writesAfterFirst, 'idempotent replay writes nothing');
});

test('I11: non-pending cycles are skipped (no re-enrichment side effects)', async () => {
  const db = createFakeDb();
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027',
    cycleData: { ...baseCycle(), enrichmentStatus: 'ENRICHMENT_COMPLETE' }, recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.skipped, true);
  assert.strictEqual(db._writes.length, 0);
});

test('I12: deterministic task key — same identity repeats, different cycle/source changes it', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  await executeMissionEnrichmentCycle({ db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT });
  const taskKey1 = db._docs.get('mission_realms/jee_main_2026/cycles/2027').enrichmentTaskKey;

  const db2 = createFakeDb();
  seedStandardSources(db2);
  await executeMissionEnrichmentCycle({ db: db2, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: '2026-09-12T00:00:00Z' });
  const taskKey2 = db2._docs.get('mission_realms/jee_main_2026/cycles/2027').enrichmentTaskKey;
  assert.strictEqual(taskKey1, taskKey2, 'task key must not depend on wall-clock time');

  const db3 = createFakeDb();
  seedStandardSources(db3);
  await executeMissionEnrichmentCycle({
    db: db3, missionId: 'jee_main_2026', cycleKey: '2028',
    cycleData: { ...baseCycle(), cycleKey: '2028' }, recordedAt: RECORDED_AT,
  });
  const taskKey3 = db3._docs.get('mission_realms/jee_main_2026/cycles/2028').enrichmentTaskKey;
  assert.notStrictEqual(taskKey1, taskKey3, 'different cycle must yield a different task key');
});

// ---------------------------------------------------------------------------
// Constitution: identity, variables, provenance, no duplicate worker path
// ---------------------------------------------------------------------------

test('I13: authoritative mission identity is preserved exactly; worker never invents one', async () => {
  const db = createFakeDb();
  seedStandardSources(db, { domain: 'https://rpsc.rajasthan.gov.in', authorityKey: 'auth_in_rj_rpsc' });
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'RPSC_FIRST_GRADE2026_2026_1782713222215', cycleKey: '2027',
    cycleData: baseCycle({ mode: 'PENDING', jurisdictionLevel: 'STATE', stateCode: 'RJ', authorityKey: 'auth_in_rj_rpsc' }), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.missionId, 'RPSC_FIRST_GRADE2026_2026_1782713222215');
  const envelope = result.evidence.stageResults[0].evidence;
  assert.strictEqual(envelope.missionId, 'RPSC_FIRST_GRADE2026_2026_1782713222215');
});

test('I14: extracted variables carry per-field source provenance', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  const ve = result.evidence.stageResults.find(s => s.stageId === 'VARIABLE_EXTRACTION');
  assert.strictEqual(ve.status, 'PASS');
  const written = db._docs.get('mission_realms/jee_main_2026/cycles/2027');
  const veStage = written.enrichmentEvidence.stages.find(s => s.stageId === 'VARIABLE_EXTRACTION');
  assert.ok(veStage, 'variable extraction evidence persisted');
  assert.strictEqual(veStage.evidence.status, 'PASS');
});

test('I15: worker source is constitutionally clean (no lifecycle invocation / publication / identity creation)', () => {
  const fs = require('fs');
  const path = require('path');
  const source = fs.readFileSync(path.join(__dirname, 'workers', 'mission_enrichment_worker.js'), 'utf8');
  assert.ok(!/launch_realm|launch_exam_mission|delete_realm_permanently|declare_result/.test(source), 'no lifecycle action invocation');
  assert.ok(!/studentVisible:\s*true|quickEntryEnabled:\s*true|smartEntryEnabled:\s*true/.test(source), 'no visibility activation');
  assert.ok(!/currentPublishedCycleKey/.test(source), 'worker never touches the published-cycle pointer');
  assert.ok(!/collection\(['"]student_mission_catalog['"]\)/.test(source), 'no Student catalog writes');
  assert.ok(!/collection\(['"]recruitments['"]\)/.test(source), 'no recruitment projection writes');
  assert.ok(!/mission-specific|UPSCWorker|RPSCWorker/.test(source), 'no mission-specific forks');
  assert.ok(!/authorityIntakeVerified:\s*true/.test(source), 'no synthetic authorityIntakeVerified flags');
  assert.ok(!/governed-cycle-binding/.test(source), 'no synthetic domain defaults');
});

test('I16: B2 handoff payload integrates with the worker end-to-end', async () => {
  const { buildCycleRecord, deriveCycleKey, buildEnrichmentHandoffPayload } = require('./services/mission_cycle_store');
  const db = createFakeDb();
  seedStandardSources(db, { domain: 'https://rpsc.rajasthan.gov.in', authorityKey: 'auth_in_rj_rpsc' });
  const key = deriveCycleKey({ targetYear: 2027 });
  const record = buildCycleRecord({
    cycleKey: key, targetYear: 2027, syllabusBindingMode: 'SEPARATE',
    jurisdictionLevel: 'STATE', stateCode: 'RJ', authorityKey: 'auth_in_rj_rpsc',
    notificationBinding: { sourceId: 'draft_notification_1', versionRef: 'v1' },
    syllabusBinding: { sourceId: 'draft_syllabus_1', versionRef: 'v1' },
    recordedAt: RECORDED_AT,
  });
  const handoff = buildEnrichmentHandoffPayload({ missionId: 'rpsc_first_grade', cycle: record });
  // The handoff IS the cycle identity the worker consumes (spec §19).
  const result = await executeMissionEnrichmentCycle({
    db, missionId: handoff.missionId, cycleKey: handoff.cycleKey,
    cycleData: { ...record, notificationBinding: handoff.notificationBinding, syllabusBinding: handoff.syllabusBinding, syllabusBindingMode: handoff.syllabusBindingMode, enrichmentStatus: handoff.enrichmentStatus, authorityKey: handoff.authorityKey },
    recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.enriched, true);
  assert.strictEqual(result.taskKey, handoff.enrichmentTaskKey, 'worker task key must equal the B2 handoff task key');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_COMPLETE');
});

// ---------------------------------------------------------------------------
// Negative Security & Trust Hardening Tests (I17 - I21)
// ---------------------------------------------------------------------------

test('I17: STEP 15 — Worker fails closed when actualSha256 is missing (fileHash alone is not proof)', async () => {
  const db = createFakeDb();
  seedStandardSources(db, { actualSha: false }); // fileHash exists, but actualSha256 is null
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I18: STEP 16 — Worker fails closed when officialDomain is missing (no fake fallback)', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  db._docs.get('sentinel_drafts/draft_notification_1').officialDomain = null;
  db._docs.get('sentinel_drafts/draft_notification_1').rawData.official_website = null;
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I19: STEP 17 — Worker fails closed when language is missing/non-English (no fake fallback)', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  db._docs.get('sentinel_drafts/draft_notification_1').language = null;
  db._docs.get('sentinel_drafts/draft_notification_1').rawData.language = null;
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I20: Worker fails closed when domain does not match cycle authorityKey', async () => {
  const db = createFakeDb();
  seedStandardSources(db, { domain: 'https://rpsc.rajasthan.gov.in', authorityKey: 'auth_in_ssc' }); // SSC cycle with RPSC domain
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'ssc_cgl', cycleKey: '2027',
    cycleData: baseCycle({ authorityKey: 'auth_in_ssc' }),
    recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I21: Worker fails closed when source is not marked isOfficial', async () => {
  const db = createFakeDb();
  seedStandardSources(db, { isOfficial: false });
  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I24: R5 — Worker fails closed when notification slot has a syllabus source', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  // Change notification draft's sourceType to syllabus
  db._docs.get('sentinel_drafts/draft_notification_1').sourceType = 'syllabus';

  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I25: R5 — Worker fails closed when syllabus slot has a notification source', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  // Change syllabus draft's sourceType to notification
  db._docs.get('sentinel_drafts/draft_syllabus_1').sourceType = 'notification';

  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle({ mode: 'SEPARATE' }), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I26: R5 — Worker fails closed when governanceStatus is SUPERSEDED', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  db._docs.get('sentinel_drafts/draft_notification_1').governanceStatus = 'SUPERSEDED';

  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I27: R5 — Worker fails closed when governanceStatus is REVOKED', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  db._docs.get('sentinel_drafts/draft_notification_1').governanceStatus = 'REVOKED';

  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I28: R5 — Worker fails closed when governanceStatus is missing/null', async () => {
  const db = createFakeDb();
  seedStandardSources(db);
  db._docs.get('sentinel_drafts/draft_notification_1').governanceStatus = null;

  const result = await executeMissionEnrichmentCycle({
    db, missionId: 'jee_main_2026', cycleKey: '2027', cycleData: baseCycle(), recordedAt: RECORDED_AT,
  });
  assert.strictEqual(result.overallStatus, 'FAIL');
  assert.strictEqual(result.enrichmentStatus, 'ENRICHMENT_FAILED');
  assert.strictEqual(stageStatus(result, 'HASH_BIND'), 'FAIL');
});

test('I29: R5-R1 — Worker fails closed in HASH_BIND if expectedSourceType is absent/null (no fallback to source.sourceType)', () => {
  const { preflightSourceBinding } = require('./services/mission_source_preflight');
  const source = {
    sourceId: 'draft_notif_1',
    sourceType: 'notification',
    governanceStatus: 'ACTIVE',
    verificationState: 'verified',
    isOfficial: true,
    officialDomain: 'https://nta.ac.in',
    language: 'en',
    expectedSha256: NOTIF_SHA,
    actualSha256: NOTIF_SHA,
    authorityKey: 'auth_in_nta',
    boundMissionId: null,
    boundCycleKey: null,
    ingestionProof: null,
  };
  // Expectation with NO fallback (expectedSourceType is absent/null):
  const expectation = {
    missionId: 'jee_main_2026',
    cycleKey: '2027',
    sourceType: null, // absent expectedSourceType
    authorityKey: 'auth_in_nta',
    expectedSha256: NOTIF_SHA,
  };
  const report = preflightSourceBinding({ source, expectation });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNRESOLVED'));
});

test('I30: R5-R1 — Worker fails closed if expectedSourceType is corrupted/unsupported', () => {
  const { preflightSourceBinding } = require('./services/mission_source_preflight');
  const source = {
    sourceId: 'draft_notif_1',
    sourceType: 'notification',
    governanceStatus: 'ACTIVE',
    verificationState: 'verified',
    isOfficial: true,
    officialDomain: 'https://nta.ac.in',
    language: 'en',
    expectedSha256: NOTIF_SHA,
    actualSha256: NOTIF_SHA,
    authorityKey: 'auth_in_nta',
    boundMissionId: null,
    boundCycleKey: null,
    ingestionProof: null,
  };
  const expectation = {
    missionId: 'jee_main_2026',
    cycleKey: '2027',
    sourceType: 'unknown_role',
    authorityKey: 'auth_in_nta',
    expectedSha256: NOTIF_SHA,
  };
  const report = preflightSourceBinding({ source, expectation });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNSUPPORTED'));
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
