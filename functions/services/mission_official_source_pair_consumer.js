'use strict';

const { assertVerifiedOfficialSourcePair } = require('./mission_official_source_pair');

function required(value, code) { if (typeof value !== 'string' || !value) throw new Error(code); return value; }

// Server-only consumer. It re-reads every authoritative record in one
// transaction before creating the two deterministic pagewise child jobs.
async function executeMissionSourcePair({ transaction, db, taskId, preflight, recordedAt }) {
  if (!transaction || !db) throw new Error('PAIR_CONSUMER_TRANSACTION_REQUIRED');
  const queueRef = db.collection('ai_queue').doc(required(taskId, 'PAIR_CONSUMER_TASK_REQUIRED'));
  const queueSnap = await transaction.get(queueRef);
  if (!queueSnap.exists) throw new Error('PAIR_CONSUMER_QUEUE_NOT_FOUND');
  const job = queueSnap.data() || {};
  if ((job.type || job.task_type) !== 'MISSION_SOURCE_PAIR') throw new Error('PAIR_CONSUMER_TYPE_INVALID');
  const payload = job.payload || {};
  const missionId = required(payload.missionId, 'PAIR_CONSUMER_MISSION_REQUIRED');
  const realmRef = db.collection('mission_realms').doc(missionId);
  const notificationRef = realmRef.collection('official_documents').doc(required(payload.notificationDocumentId, 'PAIR_CONSUMER_NOTIFICATION_REQUIRED'));
  const syllabusRef = realmRef.collection('official_documents').doc(required(payload.syllabusDocumentId, 'PAIR_CONSUMER_SYLLABUS_REQUIRED'));
  const pairRef = realmRef.collection('source_pairs').doc(taskId);
  const [realmSnap, notificationSnap, syllabusSnap, pairSnap] = await Promise.all([
    transaction.get(realmRef), transaction.get(notificationRef), transaction.get(syllabusRef), transaction.get(pairRef),
  ]);
  if (!realmSnap.exists) throw new Error('PAIR_CONSUMER_REALM_NOT_FOUND');
  const realm = realmSnap.data() || {};
  if (realm.studentVisible === true || realm.visibility === 'PUBLIC') throw new Error('PAIR_CONSUMER_STUDENT_VISIBILITY_FORBIDDEN');
  if (!notificationSnap.exists || !syllabusSnap.exists) throw new Error('PAIR_CONSUMER_DOCUMENT_MISSING');
  const pair = assertVerifiedOfficialSourcePair({
    missionId, cycleKey: required(payload.cycleKey, 'PAIR_CONSUMER_CYCLE_REQUIRED'),
    authorityKey: required(payload.authorityKey, 'PAIR_CONSUMER_AUTHORITY_REQUIRED'),
    sources: [notificationSnap.data(), syllabusSnap.data()], preflight,
    schemaVersion: payload.schemaVersion || 'mission_source_pair_v1',
  });
  if (pair.taskId !== taskId) throw new Error('PAIR_CONSUMER_TASK_ID_MISMATCH');
  const children = ['notification', 'syllabus'].map((role, index) => {
    const source = pair.sources[role];
    const id = `${taskId}_${role}`;
    return { id, type: role === 'notification' ? 'OFFICIAL_NOTIFICATION' : 'OFFICIAL_SYLLABUS',
      task_type: 'pagewise_text_extraction_batch', status: 'queued', parentTaskId: taskId,
      mission_id: missionId, document_id: source.documentId, source_document_id: source.documentId,
      document_type: role, source_path: source.storagePath, sourceSha256: source.sha256,
      expectedSha256: source.sha256, language: source.language, page_start: 1, page_end: 1,
      page_batch_index: index, total_batches: 1, expected_output: 'page_extractions',
      review_status: 'pending_founder_verification', createdAt: recordedAt };
  });
  const existingPair = pairSnap.exists ? pairSnap.data() || {} : {};
  if (existingPair.taskId && existingPair.taskId !== taskId) throw new Error('PAIR_CONSUMER_IDEMPOTENCY_CONFLICT');
  for (const child of children) {
    const ref = db.collection('ai_queue').doc(child.id);
    const snap = await transaction.get(ref);
    if (snap.exists) {
      const old = snap.data() || {};
      if (old.parentTaskId !== taskId || old.sourceSha256 !== child.sourceSha256) throw new Error('PAIR_CONSUMER_CHILD_CONFLICT');
    } else transaction.create(ref, child);
  }
  if (!pairSnap.exists) transaction.create(pairRef, { taskId, status: 'DISPATCHED', missionId, cycleKey: pair.cycleKey, authorityKey: pair.authorityKey, sources: pair.sources, childTaskIds: children.map(c => c.id), createdAt: recordedAt, updatedAt: recordedAt });
  else transaction.update(pairRef, { status: 'DISPATCHED', childTaskIds: children.map(c => c.id), updatedAt: recordedAt });
  transaction.update(queueRef, { status: 'DISPATCHED', childTaskIds: children.map(c => c.id), updatedAt: recordedAt });
  return Object.freeze({ taskId, childTaskIds: children.map(c => c.id), idempotent: pairSnap.exists });
}

module.exports = { executeMissionSourcePair };
