'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { assertPagewiseTaskAuthority, assertGovernedPagewiseTask } =
  require('../services/mission_pagewise_job_authority');

const sha = 'a'.repeat(64);
const parentId = 'mission_source_pair_' + 'b'.repeat(64);
const missionId = 'ssc_cgl';
const notificationId = 'notification_' + sha;
const syllabusId = 'syllabus_' + sha;
const physicalPath = 'mission_realms/ssc_cgl/official_documents/' + notificationId + '/source.pdf';

function context(role = 'notification', batchIndex = 1) {
  const documentId = role === 'notification' ? notificationId : syllabusId;
  const taskId = parentId + '_' + role + '_b' + String(batchIndex).padStart(4, '0');
  const task = {
    type: role === 'notification' ? 'OFFICIAL_NOTIFICATION' : 'OFFICIAL_SYLLABUS',
    task_type: 'pagewise_text_extraction_batch',
    status: 'queued',
    parentTaskId: parentId, mission_id: missionId,
    document_id: documentId, source_document_id: documentId, document_type: role,
    source_path: physicalPath, sourceSha256: sha, expectedSha256: sha, language: 'english',
    page_start: (batchIndex - 1) * 20 + 1, page_end: Math.min(batchIndex * 20, 25),
    page_batch_index: batchIndex, total_batches: 2, expected_physical_pages: 25,
    expected_output: 'page_extractions',
  };
  const source = {
    documentId, missionId, cycleKey: '2026', authorityKey: 'auth_in_ssc',
    sourceType: role, status: 'VERIFIED', verifiedBy: 'mission_source_pair_verifier_v1',
    verificationState: 'verified', governanceStatus: 'ACTIVE', pageCount: 25,
    contentSha256: sha, actualSha256: sha, expectedSha256: sha,
    storagePath: physicalPath,
    ...(role === 'syllabus' ? { embeddedFromDocumentId: notificationId } : {}),
  };
  const pairRole = { documentId, sha256: sha, storagePath: physicalPath, language: 'english' };
  const pair = {
    taskId: parentId, missionId, cycleKey: '2026', authorityKey: 'auth_in_ssc',
    status: 'DISPATCHED',
    childTaskIds: [taskId],
    sources: { [role]: pairRole },
  };
  const realm = { authorityKey: 'auth_in_ssc', studentVisible: false, visibilityGate: { studentVisible: false } };
  const parentQueue = {
    type: 'MISSION_SOURCE_PAIR', status: 'DISPATCHED', childTaskIds: [taskId],
    payload: { missionId, cycleKey: '2026', authorityKey: 'auth_in_ssc' },
  };
  return { taskId, task, source, pair, realm, parentQueue };
}

function firestoreFor(c) {
  const store = {
    ['mission_realms/' + missionId]: c.realm,
    ['mission_realms/' + missionId + '/official_documents/' + c.task.document_id]: c.source,
    ['mission_realms/' + missionId + '/source_pairs/' + parentId]: c.pair,
    ['ai_queue/' + parentId]: c.parentQueue,
  };
  function ref(path) {
    return {
      get: async () => {
        const value = store[path];
        return { exists: value !== undefined, data: () => value };
      },
      collection: sub => ({ doc: id => ref(path + '/' + sub + '/' + id) }),
    };
  }
  return { collection: name => ({ doc: id => ref(name + '/' + id) }) };
}

test('accepts persisted coordinator authority for notification, second batch and embedded syllabus', async () => {
  for (const c of [context('notification'), context('notification', 2), context('syllabus')]) {
    const verified = assertPagewiseTaskAuthority(c);
    assert.equal(verified.sourcePath, physicalPath);
    assert.equal(verified.sourceSha256, sha);
    assert.equal(verified.role, c.task.document_type);
    assert.equal((await assertGovernedPagewiseTask({
      firestore: firestoreFor(c), taskId: c.taskId, task: c.task,
    })).sourcePath, physicalPath);
  }
});

test('rejects forged, orphaned, visible, altered or unverified official page tasks', async () => {
  const cases = [
    c => { c.pair = null; },
    c => { c.pair.status = 'REVOKED'; },
    c => { c.pair.childTaskIds = []; },
    c => { c.parentQueue.childTaskIds = []; },
    c => { c.parentQueue.status = 'received'; },
    c => { c.realm.studentVisible = true; },
    c => { c.realm.visibilityGate.catalogVisible = true; },
    c => { c.source.verifiedBy = null; },
    c => { c.source.verificationState = 'pending'; },
    c => { c.source.governanceStatus = 'REVOKED'; },
    c => { c.source.contentSha256 = '0'.repeat(64); },
    c => { c.task.expectedSha256 = '0'.repeat(64); },
    c => { c.task.source_path = 'https://attacker.example/file.pdf'; },
    c => { c.task.source_path = 'gs://other-bucket/file.pdf'; },
    c => { c.task.page_end = 4000; },
    c => { c.task.total_batches = 1; },
    c => { c.task.expected_physical_pages = 1; },
    c => { c.task.language = 'unknown'; },
    c => { c.taskId = parentId + '_syllabus_b0001'; },
    c => { c.task.document_id = 'syllabus_' + sha; },
  ];
  for (const mutate of cases) {
    const c = context();
    mutate(c);
    await assert.rejects(() => assertGovernedPagewiseTask({
      firestore: firestoreFor(c), taskId: c.taskId, task: c.task,
    }), undefined, String(mutate));
  }
});

test('source authority rejects unresolved Firestore documents and missing parents', async () => {
  const c = context();
  const missing = firestoreFor({ ...c, source: undefined });
  await assert.rejects(() => assertGovernedPagewiseTask({
    firestore: missing, taskId: c.taskId, task: c.task,
  }), /PAGEWISE_SOURCE_TRUST_INVALID/);
  const missingParent = firestoreFor({ ...c, parentQueue: undefined });
  await assert.rejects(() => assertGovernedPagewiseTask({
    firestore: missingParent, taskId: c.taskId, task: c.task,
  }), /PAGEWISE_PARENT_QUEUE_AUTHORITY_INVALID/);
});
