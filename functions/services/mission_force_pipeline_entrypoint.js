'use strict';

const { assertActiveFounder } = require('./mission_lifecycle_governance');
const { executeAuthorizedForcePipeline } = require('./mission_force_pipeline_runner');
const { verifyOfficialSource } = require('./mission_official_source_verifier');
const { preflightSourceBinding } = require('./mission_source_preflight');
const { executeOfficialSourcePairCoordinator } = require('./mission_official_source_pair_coordinator');

async function authorizeFounderExecutor({ db, transaction, auth }) {
  if (!auth || !auth.uid) throw new Error('FORCE_PIPELINE_EXECUTOR_AUTHORITY_MISSING');
  const userRef = db.collection('users').doc(auth.uid);
  const userSnap = await transaction.get(userRef);
  assertActiveFounder(auth, userSnap.exists ? userSnap.data() : {});
  return Object.freeze({ uid: auth.uid, operation: 'INGEST_OFFICIAL_SOURCE' });
}

async function runTrustedForcePipeline({
  db, storage, auth, request, resolveMission, createHiddenMission, ingestSource, recordedAt,
}) {
  if (!db || typeof db.runTransaction !== 'function') throw new Error('FORCE_PIPELINE_DB_REQUIRED');
  if (!storage || typeof storage.bucket !== 'function') throw new Error('FORCE_PIPELINE_STORAGE_REQUIRED');

  return db.runTransaction(async transaction => {
    await authorizeFounderExecutor({ db, transaction, auth });
    return executeAuthorizedForcePipeline({
      request,
      resolveMission: missionId => resolveMission({ transaction, db, missionId }),
      createHiddenMission: plan => createHiddenMission({ transaction, db, plan, auth, recordedAt }),
      ingestSource: args => ingestSource({ transaction, db, storage, ...args, recordedAt }),
      verifySource: async ({ source }) => {
        const verified = await verifyOfficialSource({ storage, source, preflight: preflightSourceBinding });
        const ref = db.collection('mission_realms').doc(verified.missionId)
          .collection('official_documents').doc(verified.documentId);
        const snap = await transaction.get(ref);
        if (!snap.exists) throw new Error('FORCE_PIPELINE_VERIFIED_SOURCE_RECORD_MISSING');
        const current = snap.data() || {};
        if (current.status !== 'PENDING_SOURCE_VERIFICATION' || current.verifiedBy != null) {
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
      },
      materializeEmbeddedRole: async ({ mission, notification }) => {
        const syllabus = Object.freeze({
          ...notification,
          documentId: `syllabus_${notification.contentSha256}`,
          sourceType: 'syllabus',
          storagePath: notification.storagePath,
        });
        const ref = db.collection('mission_realms').doc(syllabus.missionId)
          .collection('official_documents').doc(syllabus.documentId);
        const snap = await transaction.get(ref);
        if (snap.exists) {
          const old = snap.data() || {};
          if (old.contentSha256 !== syllabus.contentSha256 || old.storagePath !== syllabus.storagePath
              || old.sourceType !== 'syllabus' || old.verifiedBy !== syllabus.verifiedBy) {
            throw new Error('FORCE_PIPELINE_EMBEDDED_ROLE_CONFLICT');
          }
        } else {
          transaction.create(ref, { ...syllabus, embeddedFromDocumentId: notification.documentId, createdAt: recordedAt, updatedAt: recordedAt });
        }
        return syllabus;
      },
      handoffPair: async ({ mission, notification, syllabus, cycleKey, authorityKey }) => {
        if (!notification || !syllabus) throw new Error('FORCE_PIPELINE_SOURCE_PAIR_INCOMPLETE');
        return executeOfficialSourcePairCoordinator({
          transaction, db, missionId: mission.missionId || mission.id || request.missionId,
          cycleKey, authorityKey, notification, syllabus,
          preflight: preflightSourceBinding, recordedAt,
        });
      },
    });
  });
}

module.exports = { authorizeFounderExecutor, runTrustedForcePipeline };
