'use strict';

const { assertActiveFounder } = require('./mission_lifecycle_governance');
const { executeAuthorizedForcePipeline } = require('./mission_force_pipeline_runner');
const { verifyOfficialSource } = require('./mission_official_source_verifier');
const { preflightSourceBinding } = require('./mission_source_preflight');
const { executeOfficialSourcePairCoordinator } = require('./mission_official_source_pair_coordinator');
const { computeSha256, finalizeOfficialSource } = require('./mission_official_source_finalizer');

async function authorizeFounderExecutor({ db, transaction, auth }) {
  if (!auth || !auth.uid) throw new Error('FORCE_PIPELINE_EXECUTOR_AUTHORITY_MISSING');
  const userRef = db.collection('users').doc(auth.uid);
  const userSnap = await transaction.get(userRef);
  assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});
  return Object.freeze({ uid: auth.uid, operation: 'INGEST_OFFICIAL_SOURCE' });
}

async function runTrustedForcePipeline({
  db, storage, auth, request, resolveMission, createHiddenMission, ingestSource, recordedAt, officialBytesFetcher,
}) {
  if (!db || typeof db.runTransaction !== 'function') throw new Error('FORCE_PIPELINE_DB_REQUIRED');
  if (!storage || typeof storage.bucket !== 'function') throw new Error('FORCE_PIPELINE_STORAGE_REQUIRED');
  // Trusted origin fetch overrides exist only for unit tests and hermetic
  // demo emulators. They must never be supplied by a production callable.
  if (officialBytesFetcher !== undefined) {
    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || '';
    const loopback = value => /^(?:127\\.0\\.0\\.1|localhost):[0-9]+$/.test(String(value || ''));
    const isolatedDemo = projectId.startsWith('demo-')
      && loopback(process.env.FIRESTORE_EMULATOR_HOST)
      && loopback(process.env.FIREBASE_STORAGE_EMULATOR_HOST);
    if (typeof officialBytesFetcher !== 'function'
        || (process.env.NODE_ENV !== 'test' && !isolatedDemo)) {
      throw new Error('FORCE_PIPELINE_ORIGIN_FETCH_OVERRIDE_FORBIDDEN');
    }
  }
  if (!auth || !auth.uid) throw new Error('FORCE_PIPELINE_EXECUTOR_AUTHORITY_MISSING');
  if (!request || typeof request.stagedStoragePath !== 'string' || request.stagedStoragePath.trim() === '') {
    throw new Error('FORCE_PIPELINE_STAGED_SOURCE_REQUIRED');
  }

  const userSnap = await db.collection('users').doc(auth.uid).get();
  assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});

  const sourceLanguage = typeof request.sourceLanguage === 'string' ? request.sourceLanguage.trim().toLowerCase() : '';
  if (!['en','eng','english'].includes(sourceLanguage)) throw new Error('FORCE_PIPELINE_ENGLISH_SOURCE_EVIDENCE_REQUIRED');
  // Fail before Storage finalization when the request cannot form a governed
  // official notification + embedded syllabus pair. Do not default identity.
  if (typeof request.missionId !== 'string' || !request.missionId.trim()) {
    throw new Error('FORCE_PIPELINE_MISSION_REQUIRED');
  }
  if (typeof request.cycleKey !== 'string' || !request.cycleKey.trim()) {
    throw new Error('FORCE_PIPELINE_CYCLE_REQUIRED');
  }
  if (typeof request.authorityKey !== 'string' || !request.authorityKey.trim()) {
    throw new Error('FORCE_PIPELINE_AUTHORITY_REQUIRED');
  }
  if (request.syllabusBindingMode !== 'EMBEDDED') {
    throw new Error('FORCE_PIPELINE_SEPARATE_PAIR_NOT_IMPLEMENTED');
  }
  if (request.sourceType && request.sourceType !== 'notification') {
    throw new Error('FORCE_PIPELINE_EMBEDDED_REQUIRES_NOTIFICATION');
  }
  if (typeof resolveMission !== 'function') throw new Error('FORCE_PIPELINE_MISSION_RESOLVER_REQUIRED');
  if (request.allowForceCreate === true && typeof createHiddenMission !== 'function') {
    throw new Error('FORCE_PIPELINE_HIDDEN_MISSION_CREATOR_REQUIRED');
  }

  // Avoid creating even an orphaned Storage object for a mission which the
  // governed pipeline would reject. Repeat these checks transactionally later:
  // this early gate protects Storage, but is NOT the final realm authority.
  const realmSnap = await db.collection('mission_realms').doc(request.missionId).get();
  if (!realmSnap.exists) {
    if (request.allowForceCreate !== true) throw new Error('FORCE_PIPELINE_MISSION_MISSING');
  } else {
    const realm = realmSnap.data() || {};
    const gate = realm.visibilityGate || {};
    const legacy = realm.visibility || {};
    if (realm.authorityKey !== request.authorityKey ||
        (realm.missionId && realm.missionId !== request.missionId)) {
      throw new Error('FORCE_PIPELINE_MISSION_AUTHORITY_MISMATCH');
    }
    if (realm.studentVisible === true || realm.catalogVisible === true ||
        realm.userPanelVisible === true || realm.cardVisible === true ||
        realm.catalogDiscoverable === true || realm.visibility === 'PUBLIC' ||
        gate.studentVisible === true || gate.catalogVisible === true ||
        gate.userPanelVisible === true || gate.cardVisible === true ||
        legacy.studentVisible === true || legacy.catalogVisible === true ||
        legacy.userPanelVisible === true || legacy.cardVisible === true) {
      throw new Error('FORCE_PIPELINE_STUDENT_VISIBILITY_FORBIDDEN');
    }
  }

  const finalizedBase = await finalizeOfficialSource({
    storage,
    missionId: request.missionId,
    cycleKey: request.cycleKey,
    authorityKey: request.authorityKey,
    sourceType: request.sourceType || 'notification',
    sourceUrl: request.officialSourceUrl,
    stagedStoragePath: request.stagedStoragePath,
    mimeType: request.mimeType || 'application/pdf',
    recordedAt,
    officialBytesFetcher,
  });
  const finalized = Object.freeze({ ...finalizedBase, language: sourceLanguage });

  const persistedBytes = Buffer.from((await storage.bucket().file(finalized.storagePath).download())[0]);
  if (persistedBytes.length !== finalized.byteLength) throw new Error('FORCE_PIPELINE_FINALIZED_BYTE_LENGTH_MISMATCH');
  const persistedSha = computeSha256(persistedBytes);
  if (persistedSha !== finalized.contentSha256) throw new Error('FORCE_PIPELINE_FINALIZED_SHA_MISMATCH');
  const serverRequest = Object.freeze({
    ...request,
    bytes: persistedBytes,
  });

  // All Firestore reads must precede writes within each transaction. Each
  // phase below reauthorizes the Founder independently and is retry-safe.
  const authorizedTransaction = operation => db.runTransaction(async transaction => {
    await authorizeFounderExecutor({ db, transaction, auth });
    return operation(transaction);
  });

  return executeAuthorizedForcePipeline({
    request: serverRequest,
    resolveMission: missionId => authorizedTransaction(transaction =>
      resolveMission({ transaction, db, missionId })),
    createHiddenMission: plan => authorizedTransaction(async transaction => {
      const existing = await resolveMission({ transaction, db, missionId: plan.missionId });
      if (existing) throw new Error('FORCE_PIPELINE_MISSION_ALREADY_EXISTS_RETRY');
      return createHiddenMission({ transaction, db, plan, auth, recordedAt });
    }),
    ingestSource: async args => {
      if (args.source.missionId !== finalized.missionId || args.source.cycleKey !== finalized.cycleKey
          || args.source.authorityKey !== finalized.authorityKey || args.source.sourceType !== finalized.sourceType
          || args.source.contentSha256 !== finalized.contentSha256) {
        throw new Error('FORCE_PIPELINE_FINALIZER_BINDING_MISMATCH');
      }
      return authorizedTransaction(async transaction => {
        const ref = db.collection('mission_realms').doc(finalized.missionId)
          .collection('official_documents').doc(finalized.documentId);
        const snap = await transaction.get(ref);
        if (snap.exists) {
          const old = snap.data() || {};
          if (old.contentSha256 !== finalized.contentSha256 || old.storagePath !== finalized.storagePath
              || old.missionId !== finalized.missionId || old.cycleKey !== finalized.cycleKey
              || old.authorityKey !== finalized.authorityKey || old.sourceType !== finalized.sourceType
              || !['PENDING_SOURCE_VERIFICATION', 'VERIFIED'].includes(old.status)) {
            throw new Error('FORCE_PIPELINE_SOURCE_RECORD_CONFLICT');
          }
        } else {
          transaction.create(ref, { ...finalized, createdAt: recordedAt, updatedAt: recordedAt });
        }
        if (typeof ingestSource === 'function') {
          await ingestSource({ transaction, db, storage, source: finalized, recordedAt });
        }
        return finalized;
      });
    },
    verifySource: async ({ source }) => {
      // Storage reads and byte-hash verification occur outside the transaction.
      const verified = await verifyOfficialSource({ storage, source, preflight: preflightSourceBinding, officialBytesFetcher });
      return authorizedTransaction(async transaction => {
        const ref = db.collection('mission_realms').doc(verified.missionId)
          .collection('official_documents').doc(verified.documentId);
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new Error('FORCE_PIPELINE_VERIFIED_SOURCE_RECORD_MISSING');
        const current = snap.data() || {};
        if (current.status === 'VERIFIED') {
          if (current.verifiedBy !== verified.verifiedBy || current.actualSha256 !== verified.actualSha256
              || current.storagePath !== verified.storagePath || current.sourceType !== verified.sourceType
              || current.missionId !== verified.missionId || current.cycleKey !== verified.cycleKey
              || current.authorityKey !== verified.authorityKey
              || current.verificationState !== 'verified' || current.governanceStatus !== 'ACTIVE') {
            throw new Error('FORCE_PIPELINE_VERIFIED_SOURCE_STATE_CONFLICT');
          }
          return verified;
        }
        if (current.status !== 'PENDING_SOURCE_VERIFICATION' || current.verifiedBy != null
            || current.contentSha256 !== verified.contentSha256
            || current.storagePath !== verified.storagePath || current.sourceType !== verified.sourceType
            || current.missionId !== verified.missionId || current.cycleKey !== verified.cycleKey
            || current.authorityKey !== verified.authorityKey) {
          throw new Error('FORCE_PIPELINE_VERIFIED_SOURCE_STATE_CONFLICT');
        }
        transaction.update(ref, {
          status: verified.status,
          verificationState: verified.verificationState,
          governanceStatus: verified.governanceStatus,
          verifiedBy: verified.verifiedBy,
          verificationBasis: verified.verificationBasis,
          actualSha256: verified.actualSha256,
          contentSha256: verified.contentSha256,
          updatedAt: recordedAt,
        });
        return verified;
      });
    },
    materializeEmbeddedRole: async ({ notification }) => {
      const syllabus = Object.freeze({
        ...notification,
        documentId: 'syllabus_' + notification.contentSha256,
        sourceType: 'syllabus',
        storagePath: notification.storagePath,
        embeddedFromDocumentId: notification.documentId,
      });
      return authorizedTransaction(async transaction => {
        const notificationRef = db.collection('mission_realms').doc(notification.missionId)
          .collection('official_documents').doc(notification.documentId);
        const ref = db.collection('mission_realms').doc(syllabus.missionId)
          .collection('official_documents').doc(syllabus.documentId);
        const [notificationSnap, syllabusSnap] = await Promise.all([
          transaction.get(notificationRef), transaction.get(ref),
        ]);
        const persistedNotification = notificationSnap.exists ? notificationSnap.data() || {} : {};
        if (persistedNotification.status !== 'VERIFIED'
            || persistedNotification.verifiedBy !== 'mission_source_pair_verifier_v1'
            || persistedNotification.contentSha256 !== notification.contentSha256
            || persistedNotification.storagePath !== notification.storagePath
            || persistedNotification.verificationState !== 'verified'
            || persistedNotification.governanceStatus !== 'ACTIVE') {
          throw new Error('FORCE_PIPELINE_EMBEDDED_NOTIFICATION_NOT_VERIFIED');
        }
        if (syllabusSnap.exists) {
          const old = syllabusSnap.data() || {};
          if (old.contentSha256 !== syllabus.contentSha256 || old.storagePath !== syllabus.storagePath
              || old.sourceType !== 'syllabus' || old.verifiedBy !== syllabus.verifiedBy
              || old.embeddedFromDocumentId !== notification.documentId
              || old.verificationState !== 'verified' || old.governanceStatus !== 'ACTIVE') {
            throw new Error('FORCE_PIPELINE_EMBEDDED_ROLE_CONFLICT');
          }
        } else {
          transaction.create(ref, { ...syllabus, createdAt: recordedAt, updatedAt: recordedAt });
        }
        return syllabus;
      });
    },
    handoffPair: async ({ mission, notification, syllabus, cycleKey, authorityKey }) => {
      if (!notification || !syllabus) throw new Error('FORCE_PIPELINE_SOURCE_PAIR_INCOMPLETE');
      return authorizedTransaction(transaction => executeOfficialSourcePairCoordinator({
        transaction, db, missionId: mission.missionId || mission.id || request.missionId,
        cycleKey, authorityKey, notification, syllabus,
        preflight: preflightSourceBinding, recordedAt,
      }));
    },
  });
}

module.exports = { authorizeFounderExecutor, runTrustedForcePipeline };
