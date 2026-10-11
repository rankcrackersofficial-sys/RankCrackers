'use strict';

const { assertVerifiedOfficialSourcePair } = require('./mission_official_source_pair');

function required(value, code) { if (typeof value !== 'string' || !value) throw new Error(code); return value; }

const PAGE_BATCH_SIZE = 20;
const MAX_SOURCE_PAGES = 4000;
function requiredPageCount(source) {
  const value = source && source.pageCount;
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_SOURCE_PAGES) throw new Error('PAIR_CONSUMER_PAGE_COUNT_REQUIRED');
  return value;
}

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
  const gate = realm.visibilityGate || {};
  const legacy = realm.visibility || {};
  if (realm.studentVisible === true || realm.catalogVisible === true || realm.userPanelVisible === true
      || realm.cardVisible === true || realm.catalogDiscoverable === true || realm.visibility === 'PUBLIC'
      || gate.studentVisible === true || gate.catalogVisible === true || gate.userPanelVisible === true
      || gate.cardVisible === true || legacy.studentVisible === true || legacy.catalogVisible === true
      || legacy.userPanelVisible === true || legacy.cardVisible === true) {
    throw new Error('PAIR_CONSUMER_STUDENT_VISIBILITY_FORBIDDEN');
  }
  if (!notificationSnap.exists || !syllabusSnap.exists) throw new Error('PAIR_CONSUMER_DOCUMENT_MISSING');
  for (const record of [notificationSnap.data() || {}, syllabusSnap.data() || {}]) {
    if (record.status !== 'VERIFIED' || record.verificationState !== 'verified'
        || record.governanceStatus !== 'ACTIVE' || record.verifiedBy !== 'mission_source_pair_verifier_v1') {
      throw new Error('PAIR_CONSUMER_SOURCE_TRUST_INVALID');
    }
  }
  const pair = assertVerifiedOfficialSourcePair({
    missionId, cycleKey: required(payload.cycleKey, 'PAIR_CONSUMER_CYCLE_REQUIRED'),
    authorityKey: required(payload.authorityKey, 'PAIR_CONSUMER_AUTHORITY_REQUIRED'),
    sources: [notificationSnap.data(), syllabusSnap.data()], preflight,
    schemaVersion: payload.schemaVersion || 'mission_source_pair_v1',
  });
  if (pair.taskId !== taskId) throw new Error('PAIR_CONSUMER_TASK_ID_MISMATCH');
  const children = ['notification', 'syllabus'].flatMap(role => {
    const source = pair.sources[role];
    const sourceRecord = role === 'notification' ? notificationSnap.data() : syllabusSnap.data();
    const pageCount = requiredPageCount(sourceRecord);
    const totalBatches = Math.ceil(pageCount / PAGE_BATCH_SIZE);
    return Array.from({ length: totalBatches }, (_, offset) => {
      const batchIndex = offset + 1;
      const pageStart = offset * PAGE_BATCH_SIZE + 1;
      const pageEnd = Math.min(pageCount, pageStart + PAGE_BATCH_SIZE - 1);
      const id = `${taskId}_${role}_b${String(batchIndex).padStart(4, '0')}`;
      return { id, type: role === 'notification' ? 'OFFICIAL_NOTIFICATION' : 'OFFICIAL_SYLLABUS',
        task_type: 'pagewise_text_extraction_batch', status: 'queued', parentTaskId: taskId,
        mission_id: missionId, document_id: source.documentId, source_document_id: source.documentId,
        document_type: role, source_path: source.storagePath, sourceSha256: source.sha256,
        expectedSha256: source.sha256, language: source.language, page_start: pageStart, page_end: pageEnd,
        expected_physical_pages: pageCount, page_batch_index: batchIndex, total_batches: totalBatches,
        expected_output: 'page_extractions', review_status: 'pending_founder_verification', createdAt: recordedAt };
    });
  });
  const existingPair = pairSnap.exists ? pairSnap.data() || {} : {};
  if (existingPair.taskId && existingPair.taskId !== taskId) throw new Error('PAIR_CONSUMER_IDEMPOTENCY_CONFLICT');
  // Firestore forbids reads after the first write in a transaction.
  // Resolve ALL deterministic child refs and snapshots before creating any job.
  const childRefs = children.map(child => db.collection('ai_queue').doc(child.id));
  const childSnaps = await Promise.all(childRefs.map(ref => transaction.get(ref)));
  for (let index = 0; index < children.length; index++) {
    const child = children[index];
    const ref = childRefs[index];
    const snap = childSnaps[index];
    if (snap.exists) {
      const old = snap.data() || {};
      if (old.parentTaskId !== taskId || old.sourceSha256 !== child.sourceSha256) throw new Error('PAIR_CONSUMER_CHILD_CONFLICT');
    } else {
      transaction.create(ref, child);
    }
  }
  if (!pairSnap.exists) transaction.create(pairRef, { taskId, status: 'DISPATCHED', missionId, cycleKey: pair.cycleKey, authorityKey: pair.authorityKey, sources: pair.sources, childTaskIds: children.map(c => c.id), createdAt: recordedAt, updatedAt: recordedAt });
  else transaction.update(pairRef, { status: 'DISPATCHED', childTaskIds: children.map(c => c.id), updatedAt: recordedAt });
  transaction.update(queueRef, { status: 'DISPATCHED', childTaskIds: children.map(c => c.id), updatedAt: recordedAt });
  return Object.freeze({ taskId, childTaskIds: children.map(c => c.id), idempotent: pairSnap.exists });
}

module.exports = { executeMissionSourcePair };
