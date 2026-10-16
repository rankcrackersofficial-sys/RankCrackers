'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { runTrustedForcePipeline } = require('../services/mission_force_pipeline_entrypoint');

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

function requiredString(value, code) {
  if (typeof value !== 'string' || value.trim() === '') throw new Error(code);
  return value.trim();
}

function decodePdf(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('FORCE_PIPELINE_SOURCE_BASE64_REQUIRED');
  }
  let bytes;
  try {
    bytes = Buffer.from(value, 'base64');
  } catch (_) {
    throw new Error('FORCE_PIPELINE_SOURCE_BASE64_INVALID');
  }
  if (bytes.length === 0 || bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error('FORCE_PIPELINE_SOURCE_SIZE_INVALID');
  }
  if (bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
    throw new Error('FORCE_PIPELINE_SOURCE_PDF_REQUIRED');
  }
  return bytes;
}

function stagedPath(uid, requestId) {
  const safeUid = requiredString(uid, 'FORCE_PIPELINE_AUTH_REQUIRED');
  const safeRequestId = requiredString(requestId, 'FORCE_PIPELINE_REQUEST_ID_REQUIRED');
  if (!/^[A-Za-z0-9._:-]{8,128}$/.test(safeRequestId)) {
    throw new Error('FORCE_PIPELINE_REQUEST_ID_INVALID');
  }
  return `mission_source_staging/${safeUid}/${safeRequestId}.pdf`;
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

/**
 * Founder-only bridge for the governed force pipeline.
 * Client Storage rules remain server-write-only for official documents.
 */
exports.forceMissionPipeline = functions.https.onCall(async (data, context) => {
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Founder authentication required.');
  }

  try {
    const request = data && typeof data === 'object' ? data : {};
    const bytes = decodePdf(request.sourceBase64);
    const requestId = requiredString(request.requestId, 'FORCE_PIPELINE_REQUEST_ID_REQUIRED');
    const path = stagedPath(context.auth.uid, requestId);
    const storage = admin.storage();
    const file = storage.bucket().file(path);
    const digest = sha256(bytes);
    const [exists] = await file.exists();
    if (exists) {
      const [existing] = await file.download();
      if (sha256(existing) !== digest) {
        throw new Error('FORCE_PIPELINE_STAGED_SOURCE_CONFLICT');
      }
    } else {
      await file.save(bytes, {
        resumable: false,
        metadata: { contentType: 'application/pdf', metadata: { sourceSha256: digest } },
      });
    }

    const result = await runTrustedForcePipeline({
      db: admin.firestore(),
      storage,
      auth: context.auth,
      recordedAt: new Date().toISOString(),
      request: {
        missionId: requiredString(request.missionId, 'FORCE_PIPELINE_MISSION_REQUIRED'),
        cycleKey: requiredString(request.cycleKey, 'FORCE_PIPELINE_CYCLE_REQUIRED'),
        authorityKey: requiredString(request.authorityKey, 'FORCE_PIPELINE_AUTHORITY_REQUIRED'),
        officialSourceUrl: requiredString(request.officialSourceUrl, 'FORCE_PIPELINE_SOURCE_URL_REQUIRED'),
        sourceLanguage: request.sourceLanguage || 'en',
        sourceType: request.sourceType || 'notification',
        syllabusBindingMode: request.syllabusBindingMode || 'EMBEDDED',
        allowForceCreate: request.allowForceCreate === true,
        requestId,
        stagedStoragePath: path,
        mimeType: 'application/pdf',
      },
      resolveMission: async ({ transaction, db, missionId }) => {
        const snap = await transaction.get(db.collection('mission_realms').doc(missionId));
        return snap.exists ? { id: snap.id, ...snap.data() } : null;
      },
      createHiddenMission: async ({ transaction, db, plan, auth, recordedAt }) => {
        const ref = db.collection('mission_realms').doc(plan.missionId);
        transaction.create(ref, {
          id: plan.missionId,
          missionId: plan.missionId,
          authorityKey: plan.authorityKey,
          status: 'PASSIVE',
          studentVisible: false,
          catalogVisible: false,
          userPanelVisible: false,
          cardVisible: false,
          visibilityGate: {
            studentVisible: false,
            catalogVisible: false,
            userPanelVisible: false,
            cardVisible: false,
            gateStatus: 'PASSIVE',
          },
          createdBy: auth.uid,
          createdAt: recordedAt,
          updatedAt: recordedAt,
        });
        return { id: plan.missionId, missionId: plan.missionId, authorityKey: plan.authorityKey };
      },
    });

    return { ok: true, ...result };
  } catch (error) {
    console.error('forceMissionPipeline failed:', error);
    throw new functions.https.HttpsError('failed-precondition', error.message || 'Force pipeline failed.');
  }
});

exports.decodePdf = decodePdf;
exports.stagedPath = stagedPath;
exports.sha256 = sha256;
