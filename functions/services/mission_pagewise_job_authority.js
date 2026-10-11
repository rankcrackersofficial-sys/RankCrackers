'use strict';

const { ORIGIN_PROOF_METHOD } = require('./mission_official_origin_provenance');

const PAGE_BATCH_SIZE = 20;
const MAX_SOURCE_PAGES = 4000;
const PAIR_ID = /^mission_source_pair_[a-f0-9]{64}$/;
const SHA = /^[a-f0-9]{64}$/;

function requiredSegment(value, code) {
  if (typeof value !== 'string' || !value.trim() || value.includes('/') || value.includes('..')) {
    throw new Error(code);
  }
  return value;
}

function assertPagewiseTaskAuthority({ taskId, task, pair, source, realm, parentQueue }) {
  if (!task || task.task_type !== 'pagewise_text_extraction_batch') throw new Error('PAGEWISE_TASK_TYPE_INVALID');
  const role = task.document_type;
  if (!['notification', 'syllabus'].includes(role)) throw new Error('PAGEWISE_ROLE_INVALID');
  if (task.type !== (role === 'notification' ? 'OFFICIAL_NOTIFICATION' : 'OFFICIAL_SYLLABUS')) {
    throw new Error('PAGEWISE_ROLE_TYPE_MISMATCH');
  }
  const missionId = requiredSegment(task.mission_id, 'PAGEWISE_MISSION_ID_INVALID');
  const documentId = requiredSegment(task.document_id, 'PAGEWISE_DOCUMENT_ID_INVALID');
  const parentId = requiredSegment(task.parentTaskId, 'PAGEWISE_PARENT_REQUIRED');
  if (!PAIR_ID.test(parentId) || !pair || pair.taskId !== parentId || pair.missionId !== missionId
      || pair.status !== 'DISPATCHED') throw new Error('PAGEWISE_PAIR_AUTHORITY_INVALID');
  if (!realm || realm.authorityKey !== pair.authorityKey
      || realm.studentVisible === true || realm.catalogVisible === true
      || realm.cardVisible === true || realm.userPanelVisible === true
      || realm.catalogDiscoverable === true || realm.visibility === 'PUBLIC'
      || realm.visibilityGate?.studentVisible === true || realm.visibilityGate?.catalogVisible === true
      || realm.visibilityGate?.cardVisible === true || realm.visibilityGate?.userPanelVisible === true) {
    throw new Error('PAGEWISE_REALM_AUTHORITY_INVALID');
  }
  if (!parentQueue || parentQueue.type !== 'MISSION_SOURCE_PAIR'
      || parentQueue.status !== 'DISPATCHED'
      || !Array.isArray(parentQueue.childTaskIds)
      || !parentQueue.childTaskIds.includes(taskId)
      || parentQueue.payload?.missionId !== missionId
      || parentQueue.payload?.cycleKey !== pair.cycleKey
      || parentQueue.payload?.authorityKey !== pair.authorityKey) {
    throw new Error('PAGEWISE_PARENT_QUEUE_AUTHORITY_INVALID');
  }
  if (!source || source.documentId !== documentId || source.missionId !== missionId
      || source.cycleKey !== pair.cycleKey || source.authorityKey !== pair.authorityKey
      || source.sourceType !== role || source.status !== 'VERIFIED'
      || source.verificationState !== 'verified' || source.governanceStatus !== 'ACTIVE'
      || source.verifiedBy !== 'mission_source_pair_verifier_v1') {
    throw new Error('PAGEWISE_SOURCE_TRUST_INVALID');
  }
  const sha = source.contentSha256;
  if (typeof sha !== 'string' || !SHA.test(sha)
      || source.actualSha256 !== sha || source.expectedSha256 !== sha
      || (source.documentId !== role + '_' + sha && source.documentId !== sha)
      || task.sourceSha256 !== sha || task.expectedSha256 !== sha) {
    throw new Error('PAGEWISE_SHA_AUTHORITY_INVALID');
  }
  if (source.originProofState !== 'OFFICIAL_URL_BYTES_MATCHED'
      || source.originProofMethod !== ORIGIN_PROOF_METHOD
      || source.originSha256 !== sha || typeof source.sourceUrl !== 'string'
      || source.originUrl !== source.sourceUrl) {
    throw new Error('PAGEWISE_SOURCE_ORIGIN_NOT_CORROBORATED');
  }
  const physicalId = source.embeddedFromDocumentId || documentId;
  const canonicalPath = 'mission_realms/' + missionId + '/official_documents/' + physicalId + '/source.pdf';
  if (source.storagePath !== canonicalPath || task.source_path !== canonicalPath
      || task.source_document_id !== documentId) {
    throw new Error('PAGEWISE_STORAGE_AUTHORITY_INVALID');
  }
  const pairRole = pair.sources && pair.sources[role];
  if (!pairRole || pairRole.documentId !== documentId || pairRole.sha256 !== sha
      || pairRole.storagePath !== canonicalPath
      || !Array.isArray(pair.childTaskIds) || !pair.childTaskIds.includes(taskId)) {
    throw new Error('PAGEWISE_PAIR_SOURCE_BINDING_INVALID');
  }
  if (!Number.isSafeInteger(source.pageCount) || source.pageCount < 1 || source.pageCount > MAX_SOURCE_PAGES) {
    throw new Error('PAGEWISE_PAGE_COUNT_INVALID');
  }
  const batchIndex = task.page_batch_index;
  const totalBatches = Math.ceil(source.pageCount / PAGE_BATCH_SIZE);
  const start = (batchIndex - 1) * PAGE_BATCH_SIZE + 1;
  const end = Math.min(source.pageCount, start + PAGE_BATCH_SIZE - 1);
  if (!Number.isSafeInteger(batchIndex) || batchIndex < 1
      || taskId !== parentId + '_' + role + '_b' + String(batchIndex).padStart(4, '0')
      || task.page_start !== start || task.page_end !== end
      || task.total_batches !== totalBatches
      || task.expected_physical_pages !== source.pageCount
      || !['en', 'eng', 'english'].includes(String(task.language || '').toLowerCase())
      || task.language !== pairRole.language
      || task.expected_output !== 'page_extractions') {
    throw new Error('PAGEWISE_PAGE_RANGE_OR_JOB_ID_INVALID');
  }
  return Object.freeze({ missionId, documentId, sourcePath: canonicalPath, sourceSha256: sha, role, parentId });
}

async function assertGovernedPagewiseTask({ firestore, taskId, task }) {
  if (!firestore || typeof firestore.collection !== 'function') throw new Error('PAGEWISE_FIRESTORE_REQUIRED');
  requiredSegment(taskId, 'PAGEWISE_TASK_ID_INVALID');
  const missionId = requiredSegment(task?.mission_id, 'PAGEWISE_MISSION_ID_INVALID');
  const documentId = requiredSegment(task?.document_id, 'PAGEWISE_DOCUMENT_ID_INVALID');
  const parentId = requiredSegment(task?.parentTaskId, 'PAGEWISE_PARENT_REQUIRED');
  if (!PAIR_ID.test(parentId)) throw new Error('PAGEWISE_PARENT_ID_INVALID');
  const realmRef = firestore.collection('mission_realms').doc(missionId);
  const [realmSnap, sourceSnap, pairSnap, parentSnap] = await Promise.all([
    realmRef.get(),
    realmRef.collection('official_documents').doc(documentId).get(),
    realmRef.collection('source_pairs').doc(parentId).get(),
    firestore.collection('ai_queue').doc(parentId).get(),
  ]);
  return assertPagewiseTaskAuthority({
    taskId, task,
    realm: realmSnap.exists ? realmSnap.data() : null,
    source: sourceSnap.exists ? sourceSnap.data() : null,
    pair: pairSnap.exists ? pairSnap.data() : null,
    parentQueue: parentSnap.exists ? parentSnap.data() : null,
  });
}

module.exports = { PAGE_BATCH_SIZE, assertPagewiseTaskAuthority, assertGovernedPagewiseTask };
