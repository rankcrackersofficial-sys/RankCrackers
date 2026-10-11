'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const {buildPairCoordinatorPlan,assertStoredSource}=require('../services/mission_official_source_pair_coordinator');
const crypto=require('crypto');
function s(type,text){const h=crypto.createHash('sha256').update(text).digest('hex');return {documentId:h,sourceType:type,missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',storagePath:`mission_realms/ssc_cgl/official_documents/${h}/source.pdf`,expectedSha256:h,actualSha256:h,status:'VERIFIED',verificationState:'verified',governanceStatus:'ACTIVE',verifiedBy:'mission_source_pair_verifier_v1',isOfficial:true,officialDomain:'ssc.gov.in',sourceUrl:'https://ssc.gov.in/official.pdf',originUrl:'https://ssc.gov.in/official.pdf',originProofState:'OFFICIAL_URL_BYTES_MATCHED',originProofMethod:'TRUSTED_HTTPS_200_SAME_BYTES_SHA256_NO_REDIRECT',originSha256:h,language:'english'};}
const n=s('notification','n'), y=s('syllabus','s');
const preflight=()=>({status:'PASS'});
test('coordinator plan is deterministic and mission scoped',()=>{const a=buildPairCoordinatorPlan({missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',notification:n,syllabus:y,preflight});const b=buildPairCoordinatorPlan({missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',notification:n,syllabus:y,preflight});assert.equal(a.pair.taskId,b.pair.taskId);assert.match(a.queueRef,/^ai_queue\/mission_source_pair_/);});
test('stored source must preserve backend attestation',()=>assert.throws(()=>assertStoredSource({...n,verifiedBy:null},n,'notification'),/ATTESTATION_REQUIRED/));
test('stored source must preserve exact hash binding',()=>assert.throws(()=>assertStoredSource({...n,actualSha256:'0'.repeat(64)},n,'notification'),/SHA_MISMATCH/));

test('stored source requires canonical verified state',()=>assert.throws(()=>assertStoredSource({...n,verificationState:'pending'},n,'notification'),/STATE_INVALID/));


// Real Firestore transactions disallow a read after the first write.
function coordinatorHarness() {
  const docs = new Map([
    ['mission_realms/ssc_cgl', { missionId: 'ssc_cgl', authorityKey: 'auth_in_ssc', studentVisible: false }],
    ['mission_realms/ssc_cgl/official_documents/' + n.documentId, { ...n }],
    ['mission_realms/ssc_cgl/official_documents/' + y.documentId, { ...y }],
  ]);
  const ref = path => ({
    path,
    collection: name => ({ doc: id => ref(path + '/' + name + '/' + id) }),
  });
  const db = { collection: name => ({ doc: id => ref(name + '/' + id) }) };
  let writes = 0;
  const execute = () => {
    let wrote = false;
    const tx = {
      get: async doc => {
        if (wrote) throw new Error('Firestore transactions require all reads to be executed before all writes.');
        const data = docs.get(doc.path);
        return { exists: data !== undefined, data: () => data };
      },
      create: (doc, data) => {
        wrote = true; writes++;
        if (docs.has(doc.path)) throw new Error('ALREADY_EXISTS');
        docs.set(doc.path, data);
      },
      update: (doc, changes) => {
        wrote = true; writes++;
        if (!docs.has(doc.path)) throw new Error('NOT_FOUND');
        docs.set(doc.path, { ...docs.get(doc.path), ...changes });
      },
    };
    const { executeOfficialSourcePairCoordinator } = require('../services/mission_official_source_pair_coordinator');
    return executeOfficialSourcePairCoordinator({
      transaction: tx, db, missionId: 'ssc_cgl', cycleKey: '2026',
      authorityKey: 'auth_in_ssc', notification: n, syllabus: y,
      preflight, recordedAt: '2026-10-11T12:00:00Z',
    });
  };
  const plan = buildPairCoordinatorPlan({
    missionId: 'ssc_cgl', cycleKey: '2026', authorityKey: 'auth_in_ssc',
    notification: n, syllabus: y, preflight,
  });
  return { docs, execute, plan, get writes() { return writes; } };
}

test('coordinator replay preserves READY or DISPATCHED state without additional writes', async () => {
  const h = coordinatorHarness();
  const first = await h.execute();
  assert.equal(first.idempotent, false);
  assert.equal(h.writes, 3);
  const second = await h.execute();
  assert.equal(second.idempotent, true);
  assert.equal(second.taskId, first.taskId);
  assert.equal(second.state, 'OFFICIAL_SOURCE_PAIR_READY');
  assert.equal(h.writes, 3);
  const pair = h.docs.get(h.plan.pairRef);
  const queue = h.docs.get(h.plan.queueRef);
  pair.status = 'DISPATCHED';
  queue.status = 'DISPATCHED';
  const third = await h.execute();
  assert.equal(third.idempotent, true);
  assert.equal(third.state, 'OFFICIAL_SOURCE_PAIR_DISPATCHED');
  assert.equal(h.writes, 3, 'Replay must not re-mark realm as READY');
});

test('coordinator fails closed on revoked, mismatched and partial replay', async () => {
  const mutations = [
    h => { h.docs.get(h.plan.pairRef).status = 'REVOKED'; },
    h => { h.docs.get(h.plan.pairRef).status = 'FAILED'; },
    h => { const p = h.docs.get(h.plan.pairRef); h.docs.set(h.plan.pairRef, { ...p, sources: { ...p.sources, notification: { ...p.sources.notification, storagePath: 'tampered' } } }); },
    h => { const q = h.docs.get(h.plan.queueRef); h.docs.set(h.plan.queueRef, { ...q, payload: { ...q.payload, notificationDocumentId: 'tampered' } }); },
    h => { const q = h.docs.get(h.plan.queueRef); h.docs.set(h.plan.queueRef, { ...q, payload: { ...q.payload, syllabusStoragePath: 'tampered' } }); },
    h => { h.docs.delete(h.plan.pairRef); },
    h => { h.docs.delete(h.plan.queueRef); },
    h => { h.docs.get(h.plan.pairRef).status = 'DISPATCHED'; },
  ];
  for (const mutate of mutations) {
    const h = coordinatorHarness();
    await h.execute();
    mutate(h);
    await assert.rejects(() => h.execute(), /PAIR_COORDINATOR_/);
    assert.equal(h.writes, 3, 'Conflicted replay must make zero writes');
  }
});


test('coordinator refuses persisted records without independent source URL byte proof', () => {
  for (const changed of [
    { originProofState: 'PENDING' },
    { originSha256: '0'.repeat(64) },
    { originProofMethod: 'CLAIMED_ONLY' },
  ]) {
    assert.throws(() => assertStoredSource({ ...n, ...changed }, n, 'notification'),
      /PAIR_COORDINATOR_SOURCE_ORIGIN_ATTESTATION_REQUIRED/);
  }
});
