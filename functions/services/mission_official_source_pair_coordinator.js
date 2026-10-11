'use strict';

const { assertVerifiedOfficialSourcePair } = require('./mission_official_source_pair');

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
  if (!notificationSnap.exists || !syllabusSnap.exists) throw new Error('PAIR_COORDINATOR_SOURCE_RECORD_MISSING');
  assertStoredSource(notificationSnap.data(), plan.pair.sources.notification, 'notification');
  assertStoredSource(syllabusSnap.data(), plan.pair.sources.syllabus, 'syllabus');

  const pairRecord = {
    taskId: plan.pair.taskId, contractVersion: plan.pair.contractVersion,
    missionId: plan.pair.missionId, cycleKey: plan.pair.cycleKey, authorityKey: plan.pair.authorityKey,
    schemaVersion: plan.pair.schemaVersion, sources: plan.pair.sources,
    status: 'READY_FOR_WORKER', createdAt: recordedAt, updatedAt: recordedAt,
  };
  if (pairSnap.exists) {
    const existing = pairSnap.data() || {};
    if (existing.missionId !== pairRecord.missionId || existing.cycleKey !== pairRecord.cycleKey
        || existing.authorityKey !== pairRecord.authorityKey
        || existing.sources?.notification?.sha256 !== pairRecord.sources.notification.sha256
        || existing.sources?.syllabus?.sha256 !== pairRecord.sources.syllabus.sha256) {
      throw new Error('PAIR_COORDINATOR_IDEMPOTENCY_CONFLICT');
    }
  } else {
    transaction.create(pairRef, pairRecord);
  }

  if (!queueSnap.exists) transaction.create(queueRef, { ...plan.pair.job, createdAt: recordedAt });
  else {
    const existingJob = queueSnap.data() || {};
    if (existingJob.type !== plan.pair.job.type || existingJob.payload?.missionId !== plan.pair.missionId
        || existingJob.payload?.notificationSha256 !== plan.pair.sources.notification.sha256
        || existingJob.payload?.syllabusSha256 !== plan.pair.sources.syllabus.sha256) {
      throw new Error('PAIR_COORDINATOR_QUEUE_IDEMPOTENCY_CONFLICT');
    }
  }

  transaction.update(realmRef, {
    missionSetupStatus: 'OFFICIAL_SOURCE_PAIR_READY',
    'missionSetup.sourcePairStatus': 'READY_FOR_WORKER',
    'missionSetup.sourcePairTaskId': plan.pair.taskId,
    'missionSetup.notificationDocumentId': plan.pair.sources.notification.documentId,
    'missionSetup.syllabusDocumentId': plan.pair.sources.syllabus.documentId,
    updated_at: recordedAt,
  });
  return { success: true, idempotent: pairSnap.exists && queueSnap.exists, taskId: plan.pair.taskId, missionId: plan.pair.missionId, state: 'OFFICIAL_SOURCE_PAIR_READY' };
}

module.exports = { assertStoredSource, buildPairCoordinatorPlan, executeOfficialSourcePairCoordinator };
