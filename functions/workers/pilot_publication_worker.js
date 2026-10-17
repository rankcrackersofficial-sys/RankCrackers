'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { executeCycleAwarePublication } = require('../services/mission_cycle_lifecycle');

const FOUNDER_UID = 'CswjiDlFjrcdHyyEjQ8oGIPYv1h1';

/**
 * Server-owned pilot publication lane. It calls the same cycle-aware,
 * evidence-derived publication plan as the Founder lifecycle action, but is
 * kicked only after the verified pilot cycle reaches ENRICHMENT_COMPLETE.
 */
exports.pilotPublicationWorker = functions.firestore
  .document('pilot_publication/{pilotId}')
  .onCreate(async (snap, context) => {
    const data = snap.data() || {};
    if (data.status !== 'QUEUED') return null;
    const missionId = String(data.missionId || '');
    const cycleKey = String(data.cycleKey || '');
    const requestId = String(data.requestId || `pilot-${context.params.pilotId}`);
    const reason = String(data.reason || 'Automated pilot publication after verified enrichment.');
    if (!missionId || !cycleKey) {
      await snap.ref.update({status: 'FAILED', error: 'MISSION_AND_CYCLE_REQUIRED'});
      return null;
    }

    const db = admin.firestore();
    try {
      let result;
      await db.runTransaction(async (transaction) => {
        const jobSnap = await transaction.get(snap.ref);
        if (!jobSnap.exists || jobSnap.data()?.status !== 'QUEUED') return;
        const cycleRef = db.collection('mission_realms').doc(missionId).collection('cycles').doc(cycleKey);
        const realmRef = db.collection('mission_realms').doc(missionId);
        const [cycleSnap, realmSnap] = await Promise.all([
          transaction.get(cycleRef),
          transaction.get(realmRef),
        ]);
        if (!cycleSnap.exists || !realmSnap.exists) throw new Error('PILOT_PUBLICATION_CONTRACT_INCOMPLETE');
        transaction.update(snap.ref, {
          status: 'RUNNING',
          actorUid: FOUNDER_UID,
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        result = await executeCycleAwarePublication({
          transaction,
          db,
          missionId,
          cycleKey,
          cycleSnap,
          reason,
          requestId,
          recordedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        transaction.update(snap.ref, {
          status: 'PUBLISHED',
          actorUid: FOUNDER_UID,
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          result: {published: true, cycleKey: result.cycleKey},
        });
        transaction.set(db.collection('founder_activity_log').doc(`pilot_publication_${context.params.pilotId}`), {
          type: 'MISSION_LIFECYCLE',
          missionId,
          actorId: FOUNDER_UID,
          action: 'launch_realm',
          reason,
          requestId,
          nextState: {realm: 'ACTIVE', cycle: cycleKey},
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          automatedPilot: true,
        });
      });
      return result || {skipped: true};
    } catch (error) {
      console.error(`PILOT_PUBLICATION_FAILED: ${missionId}/${cycleKey}: ${error.message}`);
      await snap.ref.update({
        status: 'FAILED',
        error: error.message || 'PILOT_PUBLICATION_FAILED',
        failedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return {error: error.message};
    }
  });

