'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildMissionShellBootstrapPlan,
} = require('../services/mission_shell_bootstrap');
const {
  executeCodexMissionOfficialSourcePair,
} = require('../services/mission_official_source_codex_invocation');
const {
  buildPrivateOfficialSourceStoragePath,
  createFirebaseAdminPrivateOfficialSourceStorageAdapter,
  sha256,
} = require('../services/private_official_source_storage');

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
  db.runTransaction = async work => work(transaction);
  return { db, transaction, docs, writes };
}

function fakeBucket() {
  const objects = new Map();
  return {
    objects,
    file(path) {
      return {
        async exists() { return [objects.has(path)]; },
        async save(bytes, options) {
          if (objects.has(path) && options.preconditionOpts?.ifGenerationMatch === 0) {
            const error = new Error('precondition');
            error.code = 412;
            throw error;
          }
          objects.set(path, { bytes: Buffer.from(bytes), options });
        },
        async download() {
          return [Buffer.from(objects.get(path).bytes)];
        },
      };
    },
  };
}

function source(plan, sourceType, bytes, overrides = {}) {
  return {
    sourceType,
    missionId: plan.missionId,
    cycleKey: plan.cycleKey,
    authorityKey: 'auth_in_ssc',
    isOfficial: true,
    officialUrl: sourceType === 'notification'
      ? 'https://ssc.gov.in/notices/ssc-cgl-2027'
      : 'https://ssc.gov.in/for-candidates/scheme-of-examination',
    officialDomain: 'ssc.gov.in',
    language: 'en',
    expectedSha256: sha256(bytes),
    bytes,
    fileName: `${sourceType}.pdf`,
    mimeType: 'application/pdf',
    ...overrides,
  };
}

function setup(overrides = {}) {
  const plan = buildMissionShellBootstrapPlan({
    payload: BOOTSTRAP_PAYLOAD,
    actorId: 'founder-1',
    recordedAt: RECORDED_AT,
  });
  const store = fakeStore({ 'users/founder-1': { status: 'ACTIVE' } });
  const bucket = fakeBucket();
  const storage = createFirebaseAdminPrivateOfficialSourceStorageAdapter({ bucket });
  const notification = Buffer.from('official notification bytes');
  const syllabus = Buffer.from('official syllabus bytes');
  const request = {
    requestId: BOOTSTRAP_PAYLOAD.requestId,
    bootstrapPayload: BOOTSTRAP_PAYLOAD,
    schemaVersion: 'source_pair_schema_v1',
    sources: [source(plan, 'notification', notification), source(plan, 'syllabus', syllabus)],
    ...overrides,
  };
  const authorizeCodexInvocation = async () => ({
    authorized: true,
    authorizationId: 'codex-auth-contract-test',
    actorId: 'founder-1',
    founderAuth: { uid: 'founder-1', token: { founder: true } },
    stageAuthorized: true,
  });
  return { plan, store, bucket, storage, request, authorizeCodexInvocation };
}

async function execute(fixture, overrides = {}) {
  return executeCodexMissionOfficialSourcePair({
    db: fixture.store.db,
    storage: fixture.storage,
    request: fixture.request,
    authorizeCodexInvocation: fixture.authorizeCodexInvocation,
    recordedAt: RECORDED_AT,
    ...overrides,
  });
}

test('private Admin Storage adapter writes and reads only canonical private objects with independent hashes', async () => {
  const bucket = fakeBucket();
  const storage = createFirebaseAdminPrivateOfficialSourceStorageAdapter({ bucket });
  const storagePath = buildPrivateOfficialSourceStoragePath({
    missionId: 'ssc_cgl', sourceType: 'notification', requestId: 'codex-ssc-cgl-2027-01',
  });
  const bytes = Buffer.from('private bytes');
  const first = await storage.putPrivateObject({
    storagePath, bytes, contentType: 'application/pdf',
    metadata: { missionId: 'ssc_cgl', sourceType: 'notification' },
  });
  const replay = await storage.putPrivateObject({ storagePath, bytes });
  const read = await storage.readPrivateObject({ storagePath, expectedSha256: first.sha256 });
  assert.equal(first.idempotent, false);
  assert.equal(replay.idempotent, true);
  assert.equal(read.sha256, sha256(bytes));
  assert.deepEqual(read.bytes, bytes);
  assert.equal(bucket.objects.get(storagePath).options.metadata.cacheControl, 'private, max-age=0, no-store');
  await assert.rejects(() => storage.putPrivateObject({ storagePath, bytes: Buffer.from('changed') }), /OBJECT_CONFLICT/);
  await assert.rejects(() => storage.readPrivateObject({ storagePath: 'assets/public.pdf' }), /PATH_MISMATCH/);
});

test('authorized Codex invocation bootstraps the hidden shell, stages two private artifacts, and finalizes only refs/hashes', async () => {
  const fixture = setup();
  const result = await execute(fixture);
  assert.equal(result.success, true);
  assert.equal(result.bootstrap.idempotent, false);
  assert.equal(result.staging.status, 'RECEIVED');
  assert.equal(fixture.store.docs.get(`mission_realms/${result.missionId}`).status, 'PASSIVE');
  assert.equal(fixture.store.docs.has(`mission_realms/${result.missionId}/cycles/${result.cycleKey}`), false);
  assert.equal(fixture.bucket.objects.size, 2);
  assert.equal(result.objectRefs.every(refValue => !refValue.storagePath.includes('https://')), true);
  const requestRecord = fixture.store.docs.get(`mission_source_pair_requests/${result.staging.requestKeyHash}`);
  assert.equal(JSON.stringify(requestRecord.job).includes('https://'), false);
  assert.equal(requestRecord.sources.every(item => item.actualSha256 === undefined), true);
});

test('replay is idempotent and changed evidence fails before any replacement write', async () => {
  const fixture = setup();
  const first = await execute(fixture);
  const writes = fixture.store.writes.length;
  const replay = await execute(fixture);
  assert.equal(replay.bootstrap.idempotent, true);
  assert.equal(replay.staging.idempotent, true);
  assert.equal(fixture.store.writes.length, writes);

  const changedBytes = Buffer.from('changed notification');
  fixture.request.sources[0].bytes = changedBytes;
  fixture.request.sources[0].expectedSha256 = sha256(changedBytes);
  await assert.rejects(() => execute(fixture), /OBJECT_CONFLICT/);
  assert.equal(fixture.store.writes.length, writes);
  assert.equal(first.staging.taskId, replay.staging.taskId);
});

test('missing identity binding, invalid official provenance, and visible missions fail closed', async () => {
  const missingIdentity = setup();
  await assert.rejects(() => execute(missingIdentity, { authorizeCodexInvocation: undefined }), /AUTHORIZATION_REQUIRED/);
  assert.equal(missingIdentity.store.writes.length, 0);
  assert.equal(missingIdentity.bucket.objects.size, 0);

  const invalidUrl = setup();
  invalidUrl.request.sources[0].officialUrl = 'http://ssc.gov.in/notice';
  await assert.rejects(() => execute(invalidUrl), /URL_INVALID/);
  assert.equal(invalidUrl.store.writes.length, 0);
  assert.equal(invalidUrl.bucket.objects.size, 0);

  const visible = setup();
  visible.store.docs.set(`mission_realms/${visible.plan.missionId}`, { ...visible.plan.realm, studentVisible: true });
  await assert.rejects(() => execute(visible), /VISIBILITY_CONFLICT/);
  assert.equal(visible.store.writes.length, 0);
  assert.equal(visible.bucket.objects.size, 0);
});

test('the source boundary requires both distinct roles and never fetches the official URLs', async () => {
  const fixture = setup();
  const calls = [];
  fixture.storage = {
    async putPrivateObject(input) { calls.push({ op: 'put', input }); return { idempotent: false, sha256: sha256(input.bytes) }; },
    async readPrivateObject(input) { calls.push({ op: 'read', input }); return { bytes: input.storagePath.includes('/notification/') ? Buffer.from('official notification bytes') : Buffer.from('official syllabus bytes') }; },
  };
  const result = await execute(fixture);
  assert.equal(result.staging.status, 'RECEIVED');
  assert.deepEqual(calls.map(call => call.op), ['put', 'put', 'read', 'read']);
  assert.equal(calls.some(call => JSON.stringify(call.input).includes('officialUrl')), false);

  const incomplete = setup({ sources: [fixture.request.sources[0], { ...fixture.request.sources[0], sourceType: 'notification' }] });
  await assert.rejects(() => execute(incomplete), /TYPES_INVALID/);
  assert.equal(incomplete.store.writes.length, 0);
});
