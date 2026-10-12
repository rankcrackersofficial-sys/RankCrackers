'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { executeMissionSourcePair } = require('../services/mission_official_source_pair_consumer');
const { assertVerifiedOfficialSourcePair } = require('../services/mission_official_source_pair');

const sha = crypto.createHash('sha256').update('%PDF-identical').digest('hex');
const taskId = `mission_source_pair_${crypto.createHash('sha256').update(['ssc_cgl','2026','auth_in_ssc',sha,sha,'mission_source_pair_v1'].join('\n')).digest('hex')}`;
function source(type) { return { pageCount: type === 'notification' ? 25 : 2, documentId: `${type}_${sha}`, sourceType:type, missionId:'ssc_cgl', cycleKey:'2026', authorityKey:'auth_in_ssc', status:'VERIFIED', verificationState:'verified', governanceStatus:'ACTIVE', verifiedBy:'mission_source_pair_verifier_v1', isOfficial:true, officialDomain:'ssc.gov.in', sourceUrl:'https://ssc.gov.in/official.pdf', originUrl:'https://ssc.gov.in/official.pdf', originProofState:'OFFICIAL_URL_BYTES_MATCHED', originProofMethod:'TRUSTED_HTTPS_200_SAME_BYTES_SHA256_NO_REDIRECT', originSha256:sha, language:'english', expectedSha256:sha, actualSha256:sha, contentSha256:sha, storagePath:`mission_realms/ssc_cgl/official_documents/${type}_${sha}/source.pdf` }; }
class Ref { constructor(store,path){this.store=store;this.path=path;} get(){return Promise.resolve({exists:Object.prototype.hasOwnProperty.call(this.store,this.path),data:()=>this.store[this.path]});} }
class DB { constructor(store){this.store=store;} collection(c){return {doc:(id)=>{const ref=new Ref(this.store,`${c}/${id}`);ref.collection=(sub)=>({doc:(child)=>new Ref(this.store,`${c}/${id}/${sub}/${child}`)});return ref;},};} }
class Tx { constructor(store){this.store=store;this.created=[];this.updated=[];} get(ref){if(this.created.length || this.updated.length) throw new Error('Firestore transactions require all reads to be executed before all writes.');return ref.get();} create(ref,data){if(this.store[ref.path]) throw new Error('DUPLICATE'); this.store[ref.path]=data; this.created.push(ref.path);} update(ref,data){this.store[ref.path]={...(this.store[ref.path]||{}),...data};this.updated.push(ref.path);} }
function seed(){const store={}; store[`ai_queue/${taskId}`]={type:'MISSION_SOURCE_PAIR',payload:{missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',schemaVersion:'mission_source_pair_v1',notificationDocumentId:`notification_${sha}`,syllabusDocumentId:`syllabus_${sha}`}}; store['mission_realms/ssc_cgl']={studentVisible:false,authorityKey:'auth_in_ssc'}; store[`mission_realms/ssc_cgl/source_pairs/${taskId}`]={taskId,missionId:'ssc_cgl',cycleKey:'2026',authorityKey:'auth_in_ssc',status:'READY_FOR_WORKER',sources:{notification:{sha256:sha},syllabus:{sha256:sha}}}; store[`mission_realms/ssc_cgl/official_documents/notification_${sha}`]=source('notification'); store[`mission_realms/ssc_cgl/official_documents/syllabus_${sha}`]=source('syllabus'); return store;}
const preflight=()=>({status:'PASS'});
const legacySeed = seed;
seed = function() {
  const store = legacySeed();
  const pair = assertVerifiedOfficialSourcePair({ missionId: 'ssc_cgl', cycleKey: '2026',
    authorityKey: 'auth_in_ssc', sources: [source('notification'), source('syllabus')],
    preflight, schemaVersion: 'mission_source_pair_v1' });
  store[`ai_queue/${taskId}`] = JSON.parse(JSON.stringify(pair.job));
  store[`mission_realms/ssc_cgl/source_pairs/${taskId}`] = {
    ...JSON.parse(JSON.stringify(pair)), status: 'READY_FOR_WORKER',
  };
  return store;
};
test('consumer executes, deterministically creates two children, and replay is idempotent',async()=>{const store=seed(),db=new DB(store);let tx=new Tx(store);const first=await executeMissionSourcePair({transaction:tx,db,taskId,preflight,recordedAt:'now'});assert.deepEqual(first.childTaskIds,[`${taskId}_notification_b0001`,`${taskId}_notification_b0002`,`${taskId}_syllabus_b0001`]);assert.equal(store[`ai_queue/${taskId}_notification_b0001`].page_start,1);assert.equal(store[`ai_queue/${taskId}_notification_b0001`].page_end,20);assert.equal(store[`ai_queue/${taskId}_notification_b0002`].page_start,21);assert.equal(store[`ai_queue/${taskId}_notification_b0002`].page_end,25);assert.equal(store[`ai_queue/${taskId}_notification_b0002`].total_batches,2);assert.equal(store[`ai_queue/${taskId}_syllabus_b0001`].page_end,2);const count=tx.created.length;tx=new Tx(store);const second=await executeMissionSourcePair({transaction:tx,db,taskId,preflight,recordedAt:'later'});assert.equal(second.idempotent,true);assert.equal(tx.created.length,0);assert.equal(store['mission_realms/ssc_cgl'].studentVisible,false);assert.equal(count,3);});
test('consumer fails closed on missing source, mismatch, visible mission, and absent page count',async()=>{for (const mutate of [s=>delete s[`mission_realms/ssc_cgl/official_documents/syllabus_${sha}`],s=>s[`ai_queue/${taskId}`].payload.cycleKey='2027',s=>s['mission_realms/ssc_cgl'].studentVisible=true,s=>delete s[`mission_realms/ssc_cgl/official_documents/notification_${sha}`].pageCount]){const store=seed();mutate(store);await assert.rejects(()=>executeMissionSourcePair({transaction:new Tx(store),db:new DB(store),taskId,preflight,recordedAt:'now'}));}});


test('consumer rejects an orphan queue task without coordinator-approved pair authority', async () => {
  const store = seed();
  delete store['mission_realms/ssc_cgl/source_pairs/' + taskId];
  const tx = new Tx(store);
  await assert.rejects(() => executeMissionSourcePair({
    transaction: tx, db: new DB(store), taskId, preflight, recordedAt: 'now',
  }), /PAIR_CONSUMER_COORDINATOR_PAIR_REQUIRED/);
  assert.equal(tx.created.length, 0);
  assert.equal(tx.updated.length, 0);
});

test('consumer rejects a revoked or conflicted coordinator pair without child jobs', async () => {
  for (const mutate of [
    pair => { pair.status = 'REVOKED'; },
    pair => { pair.sources.notification.sha256 = '0'.repeat(64); },
    pair => { pair.authorityKey = 'other'; },
  ]) {
    const store = seed();
    mutate(store['mission_realms/ssc_cgl/source_pairs/' + taskId]);
    const tx = new Tx(store);
    await assert.rejects(() => executeMissionSourcePair({
      transaction: tx, db: new DB(store), taskId, preflight, recordedAt: 'now',
    }), /PAIR_CONSUMER_COORDINATOR_PAIR_CONFLICT/);
    assert.equal(tx.created.length, 0);
    assert.equal(tx.updated.length, 0);
  }
});

test('consumer rejects altered queue, realm, or persisted source bindings before writes', async () => {
  for (const mutate of [
    s => { s['mission_realms/ssc_cgl'].authorityKey = 'foreign'; },
    s => { s[`ai_queue/${taskId}`].status = 'cancelled'; },
    s => { s[`ai_queue/${taskId}`].payload.notificationStoragePath = 'foreign.pdf'; },
    s => { s[`ai_queue/${taskId}`].payload.notificationSha256 = '0'.repeat(64); },
    s => { s[`mission_realms/ssc_cgl/source_pairs/${taskId}`].sources.syllabus.documentId = 'foreign'; },
    s => { s[`mission_realms/ssc_cgl/source_pairs/${taskId}`].sources.syllabus.storagePath = 'foreign.pdf'; },
    s => { s[`mission_realms/ssc_cgl/source_pairs/${taskId}`].schemaVersion = 'foreign'; },
  ]) {
    const store = seed(); mutate(store); const tx = new Tx(store);
    await assert.rejects(() => executeMissionSourcePair({ transaction: tx, db: new DB(store),
      taskId, preflight, recordedAt: 'now' }));
    assert.equal(tx.created.length + tx.updated.length, 0);
  }
});

test('consumer replay validates every immutable child field and performs no writes', async () => {
  const store = seed();
  const first = await executeMissionSourcePair({ transaction: new Tx(store), db: new DB(store),
    taskId, preflight, recordedAt: 'now' });
  assert.equal(first.idempotent, false);
  const immutableKeys = ['id', 'type', 'task_type', 'parentTaskId', 'mission_id', 'document_id',
    'source_document_id', 'document_type', 'source_path', 'sourceSha256', 'expectedSha256',
    'language', 'page_start', 'page_end', 'expected_physical_pages', 'page_batch_index',
    'total_batches', 'expected_output'];
  for (const key of immutableKeys) {
    const tampered = structuredClone(store);
    const child = tampered[`ai_queue/${first.childTaskIds[0]}`];
    child[key] = typeof child[key] === 'number' ? child[key] + 1 : 'foreign';
    const tx = new Tx(tampered);
    await assert.rejects(() => executeMissionSourcePair({ transaction: tx, db: new DB(tampered),
      taskId, preflight, recordedAt: 'later' }), /PAIR_CONSUMER_CHILD_CONFLICT/);
    assert.equal(tx.created.length + tx.updated.length, 0);
  }
  const replay = new Tx(store);
  await executeMissionSourcePair({ transaction: replay, db: new DB(store), taskId, preflight, recordedAt: 'later' });
  assert.equal(replay.created.length + replay.updated.length, 0);
});

test('dispatched replay never recreates missing children or accepts partial lifecycle state', async () => {
  const original = seed();
  const first = await executeMissionSourcePair({ transaction: new Tx(original), db: new DB(original),
    taskId, preflight, recordedAt: 'now' });
  for (const mutate of [
    s => { delete s[`ai_queue/${first.childTaskIds[0]}`]; },
    s => { s[`ai_queue/${taskId}`].childTaskIds = []; },
    s => { s[`ai_queue/${taskId}`].status = 'received'; },
    s => { s[`mission_realms/ssc_cgl/official_documents/notification_${sha}`].pageCount = 26; },
  ]) {
    const store = structuredClone(original); mutate(store); const tx = new Tx(store);
    await assert.rejects(() => executeMissionSourcePair({ transaction: tx, db: new DB(store),
      taskId, preflight, recordedAt: 'later' }));
    assert.equal(tx.created.length + tx.updated.length, 0);
  }
});
