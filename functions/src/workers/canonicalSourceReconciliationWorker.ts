import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();
const { isJobCurrent, downstreamImpact } = require('../../services/canonical_source_authority');

export const canonicalSourceReconciliationWorker = functions.firestore
  .document('canonical_source_events/{eventId}')
  .onCreate(async (snap, context) => {
    const event = snap.data();
    if (!event || event.type !== 'CANONICAL_SOURCE_ACTIVATED') return;
    const slotRef = db.collection('mission_realms').doc(event.missionId).collection('source_slots').doc(event.sourceSlotId);
    const versionRef = slotRef.collection('source_versions').doc(event.sourceVersionId);
    const [slotSnap, versionSnap] = await Promise.all([slotRef.get(), versionRef.get()]);
    if (!isJobCurrent(slotSnap.data(), event)) {
      await snap.ref.set({ status: 'SUPERSEDED', stoppedReason: 'STALE_CANONICAL_SOURCE', completedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    const version = versionSnap.data() || {};
    if (version.verificationState !== 'VERIFIED' || version.activationBlocked === true) {
      await snap.ref.set({ status: 'BLOCKED', stoppedReason: 'UNVERIFIED_OR_AMBIGUOUS_SOURCE', completedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    if (event.documentFamily !== 'SYLLABUS') {
      await Promise.all([
        slotRef.set({ academicDeltaApplied: true, reconciliationState: 'NOT_APPLICABLE', updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
        snap.ref.set({ status: 'RECONCILED', completedAt: FieldValue.serverTimestamp() }, { merge: true }),
      ]);
      return;
    }
    const deltaItems: any[] = Array.isArray(version.deltaItems) ? version.deltaItems : [];
    if (deltaItems.length === 0) {
      await snap.ref.set({ status: 'BLOCKED', stoppedReason: 'VERIFIED_DELTA_ITEMS_REQUIRED', completedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }
    if (deltaItems.some(item => ['AMBIGUOUS', 'SPLIT', 'MERGED'].includes(item.classification))) {
      await Promise.all([
        slotRef.set({ ambiguousDelta: true, academicDeltaApplied: false, reconciliationState: 'VERIFICATION_REQUIRED' }, { merge: true }),
        snap.ref.set({ status: 'BLOCKED', stoppedReason: 'AMBIGUOUS_DELTA', completedAt: FieldValue.serverTimestamp() }, { merge: true }),
      ]);
      return;
    }
    const impact = downstreamImpact({ items: deltaItems, activationBlocked: false });
    const writes: Array<(batch: admin.firestore.WriteBatch) => void> = [];
    for (const item of deltaItems) {
      const unit = item.after || item.before || {};
      const unitId = unit.id || unit.semanticKey;
      if (!unitId) continue;
      const ref = db.collection('mission_realms').doc(event.missionId).collection('current_syllabus_projection').doc(unitId);
      if (item.classification === 'REMOVED') {
        writes.push(batch => batch.set(ref, { current: false, retiredBySourceVersionId: event.sourceVersionId, retiredAt: FieldValue.serverTimestamp(), historicalEvidencePreserved: true }, { merge: true }));
      } else {
        writes.push(batch => batch.set(ref, { ...unit, current: true, sourceSlotId: event.sourceSlotId, canonicalVersionId: event.sourceVersionId, canonicalSha256: event.sourceSha256, activationEpoch: event.activationEpoch, deltaClassification: item.classification, updatedAt: FieldValue.serverTimestamp() }, { merge: true }));
      }
    }
    writes.push(batch => batch.set(db.collection('factory_impact_queue').doc(`digibook_${context.params.eventId}`), { type: 'DIGIBOOK_SOURCE_IMPACT', missionId: event.missionId, sourceSlotId: event.sourceSlotId, sourceVersionId: event.sourceVersionId, sourceSha256: event.sourceSha256, activationEpoch: event.activationEpoch, impact: impact.digibook, autoPublish: false, status: 'VERIFICATION_REQUIRED', createdAt: FieldValue.serverTimestamp() }));
    writes.push(batch => batch.set(db.collection('factory_impact_queue').doc(`crucible_${context.params.eventId}`), { type: 'CRUCIBLE_SOURCE_IMPACT', missionId: event.missionId, sourceSlotId: event.sourceSlotId, sourceVersionId: event.sourceVersionId, sourceSha256: event.sourceSha256, activationEpoch: event.activationEpoch, impact: impact.crucible, historicalEvidenceMutationAllowed: false, activePlanRewriteAllowed: false, status: 'RECONCILIATION_REQUIRED', createdAt: FieldValue.serverTimestamp() }));
    for (let index = 0; index < writes.length; index += 400) {
      const batch = db.batch();
      writes.slice(index, index + 400).forEach(write => write(batch));
      await batch.commit();
    }
    if (!(await slotRef.get()).exists || !isJobCurrent((await slotRef.get()).data(), event)) {
      await snap.ref.set({ status: 'SUPERSEDED', stoppedReason: 'CANONICAL_CHANGED_DURING_RECONCILIATION' }, { merge: true });
      return;
    }
    await Promise.all([
      slotRef.set({ academicDeltaApplied: true, reconciliationState: 'APPLIED', downstreamVerificationComplete: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true }),
      snap.ref.set({ status: 'RECONCILED', deltaCount: deltaItems.length, completedAt: FieldValue.serverTimestamp() }, { merge: true }),
    ]);
  });
