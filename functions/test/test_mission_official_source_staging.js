'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildMissionShellBootstrapPlan,
} = require('../services/mission_shell_bootstrap');
const {
  executeMissionOfficialSourcePairStaging,
  SOURCE_PAIR_SCHEMA_VERSION,
} = require('../services/mission_official_source_staging');

const RECORDED_AT = '2026-10-11T08:00:00.000Z';
const BOOTSTRAP_PAYLOAD = {
  requestId: 'codex-ssc-cgl-2027-01',
  examName: 'SSC CGL',
  examCategory: 'government',
  organization: 'Staff Selection Commission',
  authorityKey: 'auth_in_ssc',
  jurisdictionLevel: 'CENTRAL',
  syllabusBindingMode: 'SEPARATE',
  year: '2027',
};

function ref(path) {
  return {
    path,
    collection(name) { return ref(`${path}/${name}`); },
    doc(id) { return ref(`${path}/${id}`); },
  };
}

function fakeStore(seed = {}) {
  const docs = new Map(Object.entries(seed));
  const writes = [];
  const db = { collection: name => ref(name) };
  const transaction = {
    async get(documentRef) {
      const value = docs.get(documentRef.path);
      return { exists: value !== undefined, data: () => value };
    },
    set(documentRef, value, options = {}) {
      const prior = docs.get(documentRef.path);
      docs.set(documentRef.path, options.merge && prior ? { ...prior, ...value } : value);
      writes.push({ op: 'set', path: documentRef.path });
    },
    create(documentRef, value) {
      if (docs.has(documentRef.path)) throw new Error(`ALREADY_EXISTS:${documentRef.path}`);
      docs.set(documentRef.path, value);
      writes.push({ op: 'create', path: documentRef.path });
    },
  };
  return { db, transaction, docs, writes };
}

function request(plan, overrides = {}) {
  const notificationPath = `mission_realms/${plan.missionId}/official_documents/notification/staged.pdf`;
  const syllabusPath = `mission_realms/${plan.missionId}/official_documents/syllabus/staged.pdf`;
  return {
    requestId: 'stage-ssc-cgl-2027-01',
    missionId: plan.missionId,
    cycleKey: plan.cycleKey,
    authorityKey: 'auth_in_ssc',
    schemaVersion: SOURCE_PAIR_SCHEMA_VERSION,
    actorId: 'codex-stage-test',
    sources: [
      {
        sourceType: 'notification',
        missionId: plan.missionId,
        cycleKey: plan.cycleKey,
        authorityKey: 'auth_in_ssc',
        isOfficial: true,
        officialUrl: 'https://ssc.gov.in/notices/ssc-cgl-2027',
        officialDomain: 'ssc.gov.in',
        language: 'en',
        storagePath: notificationPath,
      },
      {
        sourceType: 'syllabus',
        missionId: plan.missionId,
        cycleKey: plan.cycleKey,
        authorityKey: 'auth_in_ssc',
        isOfficial: true,
        officialUrl: 'https://ssc.gov.in/for-candidates/scheme-of-examination',
        officialDomain: 'ssc.gov.in',
        language: 'en',
        storagePath: syllabusPath,
      },
    ],
    ...overrides,
  };
}

function setup() {
  const plan = buildMissionShellBootstrapPlan({
    payload: BOOTSTRAP_PAYLOAD,
    actorId: 'founder-1',
    recordedAt: RECORDED_AT,
  });
  const store = fakeStore({ [`mission_realms/${plan.missionId}`]: plan.realm });
  const sources = request(plan);
  const bytes = new Map([
    [sources.sources[0].storagePath, Buffer.from('official notification bytes')],
    [sources.sources[1].storagePath, Buffer.from('official syllabus bytes')],
  ]);
  const readCalls = [];
  return {
    plan,
    store,
    request: sources,
    bytes,
    readCalls,
    readStagedBytes: async (storagePath) => {
      readCalls.push(storagePath);
      return bytes.get(storagePath);
    },
    authorizeStage: () => true,
  };
}

async function execute(fixture, overrides = {}) {
  return executeMissionOfficialSourcePairStaging({
    transaction: fixture.store.transaction,
    db: fixture.store.db,
    request: fixture.request,
    authorizeStage: fixture.authorizeStage,
    readStagedBytes: fixture.readStagedBytes,
    recordedAt: RECORDED_AT,
    ...overrides,
  });
}

test('finalizes two distinct backend-staged official artifacts with computed hashes and no cycle', async () => {
  const fixture = setup();
  const result = await execute(fixture);
  assert.equal(result.idempotent, false);
  assert.equal(result.status, 'RECEIVED');
  assert.equal(fixture.readCalls.length, 2);
  assert.equal(fixture.store.docs.has(`mission_realms/${result.missionId}/cycles/${result.cycleKey}`), false);

  for (const documentId of result.sourceDocumentIds) {
    const document = fixture.store.docs.get(`mission_realms/${result.missionId}/official_documents/${documentId}`);
    assert.equal(document.status, 'VERIFIED');
    assert.equal(document.verificationMethod, 'BACKEND_STAGED_BYTES_SHA256_V1');
    assert.equal(document.actualSha256, document.expectedSha256);
    assert.equal(document.studentTruth, false);
    assert.equal(document.activationState, 'CANDIDATE');
  }
  const requestRecord = fixture.store.docs.get(`mission_source_pair_requests/${result.requestKeyHash}`);
  assert.equal(requestRecord.status, 'RECEIVED');
  assert.equal(requestRecord.job.payload.notificationStoragePath.includes('https://'), false);
  assert.equal(requestRecord.job.payload.syllabusStoragePath.includes('https://'), false);
});

test('replay is idempotent, while changed staged bytes conflict before writes', async () => {
  const fixture = setup();
  const first = await execute(fixture);
  const writeCount = fixture.store.writes.length;
  const replay = await execute(fixture);
  assert.equal(replay.idempotent, true);
  assert.equal(fixture.store.writes.length, writeCount);

  fixture.bytes.set(fixture.request.sources[0].storagePath, Buffer.from('changed bytes'));
  await assert.rejects(() => execute(fixture), /IDEMPOTENCY_CONFLICT/);
  assert.equal(fixture.store.writes.length, writeCount);
  assert.equal(first.taskId, replay.taskId);
});

test('missing authorization, invalid domain, and incomplete pairs fail closed without writes', async () => {
  const unauthorized = setup();
  await assert.rejects(() => execute(unauthorized, { authorizeStage: () => false }), /AUTHORIZATION_FAILED/);
  assert.equal(unauthorized.store.writes.length, 0);

  const invalidDomain = setup();
  invalidDomain.request.sources[0].officialUrl = 'https://example.com/notices';
  await assert.rejects(() => execute(invalidDomain), /URL_DOMAIN_MISMATCH/);
  assert.equal(invalidDomain.store.writes.length, 0);

  const incomplete = setup();
  incomplete.request.sources = [incomplete.request.sources[0]];
  await assert.rejects(() => execute(incomplete), /EXACTLY_TWO/);
  assert.equal(incomplete.store.writes.length, 0);
});

test('notification and syllabus must use two distinct backend objects', async () => {
  const fixture = setup();
  fixture.request.sources[1].storagePath = fixture.request.sources[0].storagePath;
  await assert.rejects(() => execute(fixture), /STORAGE_ARTIFACTS_NOT_DISTINCT/);
  assert.equal(fixture.store.writes.length, 0);
});

test('visible or unrelated existing missions are rejected before reading source bytes', async () => {
  const visible = setup();
  visible.store.docs.set(`mission_realms/${visible.plan.missionId}`, { ...visible.plan.realm, studentVisible: true });
  await assert.rejects(() => execute(visible), /VISIBILITY_CONFLICT/);
  assert.equal(visible.readCalls.length, 0);
  assert.equal(visible.store.writes.length, 0);

  const unrelated = setup();
  unrelated.store.docs.set(`mission_realms/${unrelated.plan.missionId}`, { ...unrelated.plan.realm, missionSetup: {} });
  await assert.rejects(() => execute(unrelated), /CYCLE_MISMATCH|REQUIRES_SEPARATE|SOURCE_PAIR_REQUIREMENT|NOT_AWAITING/);
  assert.equal(unrelated.readCalls.length, 0);
  assert.equal(unrelated.store.writes.length, 0);
});

test('actual source preflight accepts a verified backend pair only after the governance fix', async () => {
  const fixture = setup();
  const result = await execute(fixture);
  assert.equal(result.status, 'RECEIVED');
});
