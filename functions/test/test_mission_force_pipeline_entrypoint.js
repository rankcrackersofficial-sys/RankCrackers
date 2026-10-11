'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const { authorizeFounderExecutor }=require('../services/mission_force_pipeline_entrypoint');

function tx(user){return {get:async()=>({exists:!!user,data:()=>user})};}
const db={collection:()=>({doc:()=>({})})};

test('trusted entry requires authenticated founder authority',async()=>{
 await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:null}),/EXECUTOR_AUTHORITY_MISSING/);
 await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:{uid:'u',token:{founder:false}}}),/PERMISSION_DENIED/);
 await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'INACTIVE'}),auth:{uid:'u',token:{founder:true}}}),/ACCOUNT_INACTIVE/);
 const ok=await authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:{uid:'u',token:{founder:true}}});
 assert.equal(ok.operation,'INGEST_OFFICIAL_SOURCE');
});

test('payload authority claims are irrelevant to trusted authorization',async()=>{
 const ok=await authorizeFounderExecutor({db,transaction:tx({status:'ACTIVE'}),auth:{uid:'founder',token:{founder:true}},request:{internal:true,actorType:'AUTHORIZED_AGENT',permission:'mission.source.ingest'}});
 assert.equal(ok.uid,'founder');
});

test('founder authorization rejects inactive accounts before trusted execution',async()=>{await assert.rejects(()=>authorizeFounderExecutor({db,transaction:tx({status:'INACTIVE'}),auth:{uid:'u',token:{founder:true}}}),/ACCOUNT_INACTIVE/);});


// Integration regression: emulate Firestore's strict reads-before-writes rule.
// This exercises the real finalizer, verifier, embedded role and pair coordinator,
// without Firebase credentials or a production project.
const { PDFDocument } = require('pdf-lib');
const { runTrustedForcePipeline } = require('../services/mission_force_pipeline_entrypoint');

function createMemoryEmulators(pdfBytes, userStatus = 'ACTIVE') {
  const documents = new Map([
    ['users/founder-local', { status: userStatus }],
    ['mission_realms/ssc_cgl', {
      missionId: 'ssc_cgl', authorityKey: 'auth_in_ssc', studentVisible: false,
      catalogVisible: false, userPanelVisible: false, cardVisible: false,
      visibilityGate: { studentVisible: false, catalogVisible: false, userPanelVisible: false, cardVisible: false },
    }],
  ]);
  const objects = new Map([['mission_source_staging/ssc-cgl-test.pdf', Buffer.from(pdfBytes)]]);
  const counters = { transactions: 0, storageWrites: 0 };
  const ref = path => ({
    path,
    get: async () => {
      const value = documents.get(path);
      return { exists: value !== undefined, data: () => value ? { ...value } : undefined };
    },
    collection: name => ({ doc: id => ref(path + '/' + name + '/' + id) }),
  });
  const db = {
    collection: name => ({ doc: id => ref(name + '/' + id) }),
    runTransaction: async fn => {
      counters.transactions++;
      const pendingWrites = [];
      const snapshot = r => {
        const value = documents.get(r.path);
        return { exists: value !== undefined, data: () => value ? { ...value } : undefined };
      };
      const transaction = {
        get: async r => {
          if (pendingWrites.length) throw new Error('Firestore transactions require all reads to be executed before all writes.');
          return snapshot(r);
        },
        create: (r, value) => pendingWrites.push({ op: 'create', path: r.path, value }),
        update: (r, value) => pendingWrites.push({ op: 'update', path: r.path, value }),
      };
      const result = await fn(transaction);
      for (const write of pendingWrites) {
        const current = documents.get(write.path);
        if (write.op === 'create' && current !== undefined) throw new Error('ALREADY_EXISTS');
        if (write.op === 'update' && current === undefined) throw new Error('NOT_FOUND');
        documents.set(write.path, write.op === 'update' ? { ...current, ...write.value } : { ...write.value });
      }
      return result;
    },
  };
  const storage = {
    bucket: () => ({
      file: path => ({
        getMetadata: async () => {
          if (!objects.has(path)) throw new Error('STORAGE_NOT_FOUND');
          return [{ contentType: 'application/pdf' }];
        },
        download: async () => {
          const value = objects.get(path);
          if (!value) throw new Error('STORAGE_NOT_FOUND');
          return [Buffer.from(value)];
        },
        exists: async () => [objects.has(path)],
        save: async value => { counters.storageWrites++; objects.set(path, Buffer.from(value)); },
      }),
    }),
  };
  return { db, storage, documents, objects, counters };
}

function goldenRequest() {
  return {
    requestId: 'ssc-cgl-golden-local-2026', missionId: 'ssc_cgl', cycleKey: '2026',
    authorityKey: 'auth_in_ssc', officialSourceUrl: 'https://ssc.gov.in/official.pdf',
    sourceType: 'notification', sourceLanguage: 'english',
    syllabusBindingMode: 'EMBEDDED',
    stagedStoragePath: 'mission_source_staging/ssc-cgl-test.pdf',
  };
}

async function goldenPdf() {
  const document = await PDFDocument.create();
  const page = document.addPage([350, 450]);
  page.drawText('SSC CGL local emulator fixture; not an official document');
  return Buffer.from(await document.save());
}

function goldenAdapters(environment, auth) {
  return {
    db: environment.db,
    storage: environment.storage,
    auth,
    request: goldenRequest(),
    recordedAt: '2026-10-11T14:00:00.000Z',
    resolveMission: async ({ transaction, db, missionId }) => {
      const snap = await transaction.get(db.collection('mission_realms').doc(missionId));
      return snap.exists ? snap.data() : null;
    },
    createHiddenMission: async () => { throw new Error('EXISTING_MISSION_MUST_BE_REUSED'); },
  };
}

test('transaction lifecycle is read-before-write and embedded replay is deterministic', async () => {
  const environment = createMemoryEmulators(await goldenPdf());
  const call = goldenAdapters(environment, { uid: 'founder-local', token: { founder: true } });
  const first = await runTrustedForcePipeline(call);
  assert.equal(first.missionState, 'EXISTING_MISSION_REUSED');
  assert.equal(first.sourceState, 'VERIFIED');
  const sources = [...environment.documents.entries()].filter(([key]) => key.startsWith('mission_realms/ssc_cgl/official_documents/'));
  assert.equal(sources.length, 2);
  const notification = sources.find(([, value]) => value.sourceType === 'notification')[1];
  const syllabus = sources.find(([, value]) => value.sourceType === 'syllabus')[1];
  assert.equal(notification.status, 'VERIFIED');
  assert.equal(notification.verificationState, 'verified');
  assert.equal(notification.verifiedBy, 'mission_source_pair_verifier_v1');
  assert.equal(syllabus.status, 'VERIFIED');
  assert.equal(syllabus.embeddedFromDocumentId, notification.documentId);
  assert.equal(syllabus.storagePath, notification.storagePath);
  assert.equal(syllabus.contentSha256, notification.contentSha256);
  const pairId = first.pairResult.taskId;
  assert.ok(environment.documents.has('mission_realms/ssc_cgl/source_pairs/' + pairId));
  assert.ok(environment.documents.has('ai_queue/' + pairId));
  assert.equal(environment.counters.storageWrites, 1);

  const second = await runTrustedForcePipeline(call);
  assert.equal(second.pairResult.taskId, pairId);
  assert.equal(environment.counters.storageWrites, 1);
  assert.equal([...environment.documents.keys()].filter(key => key.startsWith('mission_realms/ssc_cgl/official_documents/')).length, 2);
  assert.equal([...environment.documents.keys()].filter(key => key.startsWith('ai_queue/')).length, 1);
});

test('inactive founder is rejected before any official storage or source mutation', async () => {
  const environment = createMemoryEmulators(await goldenPdf(), 'INACTIVE');
  const initialObjects = environment.objects.size;
  const initialDocuments = environment.documents.size;
  const call = goldenAdapters(environment, { uid: 'founder-local', token: { founder: true } });
  await assert.rejects(() => runTrustedForcePipeline(call), /ACCOUNT_INACTIVE/);
  assert.equal(environment.counters.storageWrites, 0);
  assert.equal(environment.objects.size, initialObjects);
  assert.equal(environment.documents.size, initialDocuments);
  assert.equal(environment.counters.transactions, 0);
});
