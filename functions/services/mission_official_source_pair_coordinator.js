'use strict';

const { assertVerifiedOfficialSourcePair } = require('./mission_official_source_pair');
const { ORIGIN_PROOF_METHOD } = require('./mission_official_origin_provenance');

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function buildPairCoordinatorPlan({ missionId, cycleKey, authorityKey, notification, syllabus, preflight, schemaVersion = 'mission_source_pair_v1' }) {
  const pair = assertVerifiedOfficialSourcePair({
    missionId: requiredString(missionId, 'MISSION_ID_REQUIRED'),
    cycleKey: requiredString(cycleKey, 'CYCLE_KEY_REQUIRED'),
    authorityKey: requiredString(authorityKey, 'AUTHORITY_KEY_REQUIRED'),
    sources: [notification, syllabus],
    preflight,
    schemaVersion,
  });
  return Object.freeze({
    pair,
    notificationRef: `mission_realms/${pair.missionId}/official_documents/${pair.sources.notification.documentId}`,
    syllabusRef: `mission_realms/${pair.missionId}/official_documents/${pair.sources.syllabus.documentId}`,
    pairRef: `mission_realms/${pair.missionId}/source_pairs/${pair.taskId}`,
    queueRef: `ai_queue/${pair.taskId}`,
  });
}

function assertStoredSource(source, expected, sourceType) {
  if (!source || source.status !== 'VERIFIED') throw new Error('PAIR_COORDINATOR_SOURCE_NOT_VERIFIED');
  if (source.verifiedBy !== 'mission_source_pair_verifier_v1') throw new Error('PAIR_COORDINATOR_SOURCE_ATTESTATION_REQUIRED');
  if ((source.documentId || source.id) !== expected.documentId) throw new Error('PAIR_COORDINATOR_SOURCE_ID_MISMATCH');
  if (source.sourceType !== sourceType || source.missionId !== expected.missionId || source.cycleKey !== expected.cycleKey || source.authorityKey !== expected.authorityKey) {
    throw new Error('PAIR_COORDINATOR_SOURCE_BINDING_MISMATCH');
  }
  if (source.verificationState !== 'verified' || source.governanceStatus !== 'ACTIVE') throw new Error('PAIR_COORDINATOR_SOURCE_STATE_INVALID');
  if (String(source.actualSha256 || '').toLowerCase() !== expected.sha256
      || String(source.contentSha256 || source.actualSha256 || '').toLowerCase() !== expected.sha256) throw new Error('PAIR_COORDINATOR_SOURCE_SHA_MISMATCH');
  if (source.originProofState !== 'OFFICIAL_URL_BYTES_MATCHED'
      || source.originProofMethod !== ORIGIN_PROOF_METHOD
      || source.originSha256 !== expected.sha256
      || typeof source.sourceUrl !== 'string'
      || source.originUrl !== source.sourceUrl) {
    throw new Error('PAIR_COORDINATOR_SOURCE_ORIGIN_ATTESTATION_REQUIRED');
  }
}

async function executeOfficialSourcePairCoordinator({ transaction, db, missionId, cycleKey, authorityKey, notification, syllabus, preflight, schemaVersion, recordedAt }) {
  if (!transaction || !db) throw new Error('PAIR_COORDINATOR_TRANSACTION_REQUIRED');
  if (!recordedAt) throw new Error('PAIR_COORDINATOR_RECORDED_AT_REQUIRED');
  const plan = buildPairCoordinatorPlan({ missionId, cycleKey, authorityKey, notification, syllabus, preflight, schemaVersion });
  const realmRef = db.collection('mission_realms').doc(plan.pair.missionId);
  const notificationRef = realmRef.collection('official_documents').doc(plan.pair.sources.notification.documentId);
  const syllabusRef = realmRef.collection('official_documents').doc(plan.pair.sources.syllabus.documentId);
  const pairRef = realmRef.collection('source_pairs').doc(plan.pair.taskId);
  const queueRef = db.collection('ai_queue').doc(plan.pair.taskId);

  const [realmSnap, notificationSnap, syllabusSnap, pairSnap, queueSnap] = await Promise.all([
    transaction.get(realmRef), transaction.get(notificationRef), transaction.get(syllabusRef),
    transaction.get(pairRef), transaction.get(queueRef),
  ]);
  if (!realmSnap.exists) throw new Error('PAIR_COORDINATOR_REALM_NOT_FOUND');
  const realm = realmSnap.data() || {};
  if (realm.authorityKey !== plan.pair.authorityKey) throw new Error('PAIR_COORDINATOR_REALM_AUTHORITY_MISMATCH');
  const gate = realm.visibilityGate || {};
  const legacy = realm.visibility || {};
  if (realm.studentVisible === true || realm.catalogVisible === true || realm.userPanelVisible === true
      || realm.cardVisible === true || realm.catalogDiscoverable === true || realm.visibility === 'PUBLIC'
      || gate.studentVisible === true || gate.catalogVisible === true || gate.userPanelVisible === true
      || gate.cardVisible === true || legacy.studentVisible === true || legacy.catalogVisible === true
      || legacy.userPanelVisible === true || legacy.cardVisible === true) {
    throw new Error('PAIR_COORDINATOR_STUDENT_VISIBILITY_FORBIDDEN');
  }
  if (!notificationSnap.exists || !syllabusSnap.exists) throw new Error('PAIR_COORDINATOR_SOURCE_RECORD_MISSING');
  assertStoredSource(notificationSnap.data(), plan.pair.sources.notification, 'notification');
  assertStoredSource(syllabusSnap.data(), plan.pair.sources.syllabus, 'syllabus');

  const pairRecord = {
    taskId: plan.pair.taskId, contractVersion: plan.pair.contractVersion,
    missionId: plan.pair.missionId, cycleKey: plan.pair.cycleKey, authorityKey: plan.pair.authorityKey,
    schemaVersion: plan.pair.schemaVersion, sources: plan.pair.sources,
    status: 'READY_FOR_WORKER', createdAt: recordedAt, updatedAt: recordedAt,
  };
  // An existing pair is authoritative immutable history. A revoked/failed
  // pair must never be resurrected by a replay of the original upload.
  if (pairSnap.exists !== queueSnap.exists) {
    throw new Error('PAIR_COORDINATOR_PARTIAL_REPLAY_CONFLICT');
  }
  if (pairSnap.exists) {
    const existing = pairSnap.data() || {};
    const existingJob = queueSnap.data() || {};
    if (existing.taskId !== pairRecord.taskId || existing.contractVersion !== pairRecord.contractVersion
        || existing.schemaVersion !== pairRecord.schemaVersion
        || existing.missionId !== pairRecord.missionId || existing.cycleKey !== pairRecord.cycleKey
        || existing.authorityKey !== pairRecord.authorityKey
        || existing.sources?.notification?.documentId !== pairRecord.sources.notification.documentId
        || existing.sources?.syllabus?.documentId !== pairRecord.sources.syllabus.documentId
        || existing.sources?.notification?.sha256 !== pairRecord.sources.notification.sha256
        || existing.sources?.syllabus?.sha256 !== pairRecord.sources.syllabus.sha256
        || existing.sources?.notification?.storagePath !== pairRecord.sources.notification.storagePath
        || existing.sources?.syllabus?.storagePath !== pairRecord.sources.syllabus.storagePath) {
      throw new Error('PAIR_COORDINATOR_IDEMPOTENCY_CONFLICT');
    }
    if (!['READY_FOR_WORKER', 'DISPATCHED'].includes(existing.status)) {
      throw new Error('PAIR_COORDINATOR_REPLAY_STATE_FORBIDDEN');
    }
    if (existingJob.type !== plan.pair.job.type
        || existingJob.queueContract !== plan.pair.job.queueContract
        || existingJob.payload?.missionId !== plan.pair.missionId
        || existingJob.payload?.cycleKey !== plan.pair.cycleKey
        || existingJob.payload?.authorityKey !== plan.pair.authorityKey
        || existingJob.payload?.schemaVersion !== plan.pair.schemaVersion
        || existingJob.payload?.notificationDocumentId !== plan.pair.sources.notification.documentId
        || existingJob.payload?.syllabusDocumentId !== plan.pair.sources.syllabus.documentId
        || existingJob.payload?.notificationSha256 !== plan.pair.sources.notification.sha256
        || existingJob.payload?.syllabusSha256 !== plan.pair.sources.syllabus.sha256
        || existingJob.payload?.notificationStoragePath !== plan.pair.sources.notification.storagePath
        || existingJob.payload?.syllabusStoragePath !== plan.pair.sources.syllabus.storagePath) {
      throw new Error('PAIR_COORDINATOR_QUEUE_IDEMPOTENCY_CONFLICT');
    }
    if (existing.status === 'DISPATCHED' && existingJob.status !== 'DISPATCHED') {
      throw new Error('PAIR_COORDINATOR_DISPATCH_REPLAY_CONFLICT');
    }
    if (existing.status === 'READY_FOR_WORKER' &&
        !['received', 'DISPATCHED'].includes(existingJob.status)) {
      throw new Error('PAIR_COORDINATOR_QUEUE_REPLAY_STATE_FORBIDDEN');
    }
    // Keep the actual persisted lifecycle state. Do not reset a dispatched
    // pair's realm to READY_FOR_WORKER or recreate missing/revoked queue jobs.
    return {
      success: true, idempotent: true, taskId: plan.pair.taskId,
      missionId: plan.pair.missionId,
      state: existing.status === 'DISPATCHED' ? 'OFFICIAL_SOURCE_PAIR_DISPATCHED' : 'OFFICIAL_SOURCE_PAIR_READY',
    };
  }

  transaction.create(pairRef, pairRecord);
  transaction.create(queueRef, { ...plan.pair.job, createdAt: recordedAt });
  transaction.update(realmRef, {
    missionSetupStatus: 'OFFICIAL_SOURCE_PAIR_READY',
    'missionSetup.sourcePairStatus': 'READY_FOR_WORKER',
    'missionSetup.sourcePairTaskId': plan.pair.taskId,
    'missionSetup.notificationDocumentId': plan.pair.sources.notification.documentId,
    'missionSetup.syllabusDocumentId': plan.pair.sources.syllabus.documentId,
    updated_at: recordedAt,
  });
  return {
    success: true, idempotent: false, taskId: plan.pair.taskId,
    missionId: plan.pair.missionId, state: 'OFFICIAL_SOURCE_PAIR_READY',
  };
}

module.exports = { assertStoredSource, buildPairCoordinatorPlan, executeOfficialSourcePairCoordinator };
