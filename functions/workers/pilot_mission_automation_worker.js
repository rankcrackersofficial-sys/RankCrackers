'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { runSeparateSourcePairPipeline } = require('../services/mission_separate_source_pair_entrypoint');
const { ensureFounderClaims } = require('../utils/sovereign_logic');

const PILOT = Object.freeze({
  missionId: 'ssc_cgl',
  cycleKey: 'ssc_cgl_2026',
  authorityKey: 'auth_in_ssc',
  sourceLanguage: 'english',
  notificationSourceUrl: 'https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf',
  // SSC maintains the recruitment notice and the subject syllabus as
  // separate official artefacts. Never bind the notification PDF as syllabus.
  syllabusSourceUrl: 'https://ssc.gov.in/api/attachment/uploads/masterData/Syllabus/CGL-syllabus-169635-.pdf',
});

const FOUNDER_UID = 'CswjiDlFjrcdHyyEjQ8oGIPYv1h1';

/**
 * Server-only pilot launcher. A Founder never uploads bytes or verifies a
 * document here: the worker fetches both official URLs and delegates all
 * byte/origin verification to the governed source-pair pipeline.
 */
exports.pilotMissionAutomationWorker = functions
  .runWith({ timeoutSeconds: 540, memory: '1GB' })
  .firestore
  .document('pilot_automation/{pilotId}')
  .onCreate(async (snap, context) => {
    if (!context.params.pilotId.startsWith(PILOT.missionId)) return null;
    const db = admin.firestore();
    const ref = snap.ref;
    const current = snap.data() || {};
    if (current.status !== 'QUEUED') return null;

    await ref.set({
      status: 'RUNNING',
      phase: 'SERVER_SOURCE_ACQUISITION',
      missionId: PILOT.missionId,
      cycleKey: PILOT.cycleKey,
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    try {
      // Repair only the immutable Founder identity; arbitrary callers cannot
      // select this UID because the worker is server-triggered and the UID is
      // fixed above.
      const founderReady = await ensureFounderClaims(FOUNDER_UID);
      if (!founderReady) throw new Error('CANONICAL_FOUNDER_IDENTITY_NOT_CONFIRMED');
      const realmRef = db.collection('mission_realms').doc(PILOT.missionId);
      const realmSnap = await realmRef.get();
      if (!realmSnap.exists) throw new Error('PILOT_MISSION_REALM_NOT_FOUND');
      const realm = realmSnap.data() || {};
      const canonicalAuthority = realm.canonicalIdentityBinding?.authorityKey;
      if (canonicalAuthority !== PILOT.authorityKey) {
        throw new Error('PILOT_CANONICAL_AUTHORITY_NOT_CONFIRMED');
      }
      if (realm.authorityKey && realm.authorityKey !== PILOT.authorityKey) {
        throw new Error('PILOT_ROOT_AUTHORITY_CONFLICT');
      }
      if (!realm.authorityKey) {
        await realmRef.set({
          authorityKey: PILOT.authorityKey,
          missionId: PILOT.missionId,
          updated_at: new Date().toISOString(),
        }, { merge: true });
      }
      const gate = realm.visibilityGate || {};
      const wasVisible = realm.studentVisible === true || realm.catalogVisible === true
        || realm.userPanelVisible === true || realm.cardVisible === true
        || gate.studentVisible === true || gate.catalogVisible === true
        || gate.userPanelVisible === true || gate.cardVisible === true;
      if (wasVisible) {
        await realmRef.set({
          automatedRepair: {
            status: 'ACTIVE',
            reason: 'CORRECT_CONTAMINATED_SOURCE_PAIR',
            previousVisibility: {
              studentVisible: realm.studentVisible === true,
              catalogVisible: realm.catalogVisible === true,
              userPanelVisible: realm.userPanelVisible === true,
              cardVisible: realm.cardVisible === true,
              visibilityGate: gate,
            },
            startedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          studentVisible: false, catalogVisible: false, userPanelVisible: false, cardVisible: false,
          catalogDiscoverable: false,
          visibilityGate: { ...gate, studentVisible: false, catalogVisible: false, userPanelVisible: false, cardVisible: false, gateStatus: 'REPAIRING' },
          updated_at: new Date().toISOString(),
        }, { merge: true });
      }
      const result = await runSeparateSourcePairPipeline({
        db,
        storage: admin.storage(),
        auth: {
          uid: FOUNDER_UID,
          token: { founder: true, admin: true, email: 'founder.rcofficial@gmail.com' },
        },
        payload: PILOT,
        recordedAt: new Date().toISOString(),
      });
      const notificationDoc = await realmRef.collection('official_documents').doc(result.notificationDocumentId).get();
      const syllabusDoc = await realmRef.collection('official_documents').doc(result.syllabusDocumentId).get();
      const notification = notificationDoc.data() || {};
      const syllabus = syllabusDoc.data() || {};
      await realmRef.collection('cycles').doc(PILOT.cycleKey).set({
        missionId: PILOT.missionId,
        cycleKey: PILOT.cycleKey,
        syllabusBindingMode: 'SEPARATE',
        notificationBinding: {
          sourceId: result.notificationDocumentId,
          actualSha256: notification.actualSha256 || notification.contentSha256 || null,
          versionRef: null,
          boundAt: new Date().toISOString(),
        },
        syllabusBinding: {
          sourceId: result.syllabusDocumentId,
          actualSha256: syllabus.actualSha256 || syllabus.contentSha256 || null,
          versionRef: null,
          boundAt: new Date().toISOString(),
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      await ref.set({
        status: 'SOURCE_PAIR_VERIFIED_AND_QUEUED',
        phase: 'AUTOMATED_INGESTION',
        result,
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      return result;
    } catch (error) {
      const latestRealm = await db.collection('mission_realms').doc(PILOT.missionId).get();
      const repair = latestRealm.data()?.automatedRepair;
      if (repair?.status === 'ACTIVE' && repair?.reason === 'CORRECT_CONTAMINATED_SOURCE_PAIR') {
        await latestRealm.ref.set({
          ...repair.previousVisibility,
          automatedRepair: { ...repair, status: 'ROLLED_BACK', rolledBackAt: admin.firestore.FieldValue.serverTimestamp() },
          updated_at: new Date().toISOString(),
        }, { merge: true });
      }
      await ref.set({
        status: 'FAILED',
        phase: 'AUTOMATED_INGESTION',
        errorCode: error.message || String(error),
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      throw error;
    }
  });

exports.PILOT = PILOT;
