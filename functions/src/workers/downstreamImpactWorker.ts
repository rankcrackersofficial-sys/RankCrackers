import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
const { classifyWorkerAuthority } = require('../../services/canonical_source_authority');

export interface DigiBookCompletionRequest {
  eventId: string;
  missionId: string;
  sourceSlotId: string;
  sourceVersionId: string;
  sourceSha256: string;
  activationEpoch: number;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'REJECTED';
  verifiedBy: string;
}

export interface CrucibleCompletionRequest {
  eventId: string;
  missionId: string;
  sourceSlotId: string;
  sourceVersionId: string;
  sourceSha256: string;
  activationEpoch: number;
  mutatedHistoryAttempted: boolean;
  reconciliationStatus: 'SUCCESS' | 'FAILED';
  reconciledBy: string;
}

export async function completeDigiBookVerification(
  db: admin.firestore.Firestore,
  request: DigiBookCompletionRequest
): Promise<{ success: boolean; status: string; downstreamUnlocked: boolean }> {
  const slotRef = db.collection('mission_realms')
    .doc(request.missionId)
    .collection('source_slots')
    .doc(request.sourceSlotId);

  const slotSnap = await slotRef.get();
  const authorityStatus = classifyWorkerAuthority(slotSnap.data(), request);

  if (authorityStatus !== 'CURRENT') {
    return { success: false, status: `STALE_AUTHORITY_${authorityStatus}`, downstreamUnlocked: false };
  }

  const impactRef = db.collection('factory_impact_queue').doc(`digibook_${request.eventId}`);
  const isPass = request.verificationStatus === 'VERIFIED';
  const newStatus = isPass ? 'VERIFIED_COMPLETE' : 'VERIFICATION_FAILED';

  await impactRef.set({
    status: newStatus,
    verifiedBy: request.verifiedBy,
    verifiedAt: FieldValue.serverTimestamp(),
    sourceGuarded: true
  }, { merge: true });

  if (!isPass) {
    await slotRef.set({ downstreamVerificationComplete: false }, { merge: true });
    return { success: false, status: 'VERIFICATION_FAILED', downstreamUnlocked: false };
  }

  // Check if Crucible is also complete
  const crucibleRef = db.collection('factory_impact_queue').doc(`crucible_${request.eventId}`);
  const crucibleSnap = await crucibleRef.get();
  const crucibleDone = crucibleSnap.exists && crucibleSnap.data()?.status === 'RECONCILED_COMPLETE';

  if (crucibleDone) {
    await slotRef.set({ downstreamVerificationComplete: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  return { success: true, status: 'VERIFIED_COMPLETE', downstreamUnlocked: crucibleDone };
}

export async function completeCrucibleReconciliation(
  db: admin.firestore.Firestore,
  request: CrucibleCompletionRequest
): Promise<{ success: boolean; status: string; downstreamUnlocked: boolean }> {
  const slotRef = db.collection('mission_realms')
    .doc(request.missionId)
    .collection('source_slots')
    .doc(request.sourceSlotId);

  const slotSnap = await slotRef.get();
  const authorityStatus = classifyWorkerAuthority(slotSnap.data(), request);

  if (authorityStatus !== 'CURRENT') {
    return { success: false, status: `STALE_AUTHORITY_${authorityStatus}`, downstreamUnlocked: false };
  }

  // Enforce zero historical evidence mutation
  if (request.mutatedHistoryAttempted) {
    const impactRef = db.collection('factory_impact_queue').doc(`crucible_${request.eventId}`);
    await impactRef.set({
      status: 'UNSAFE_REWRITE_BLOCKED',
      reconciledBy: request.reconciledBy,
      reconciledAt: FieldValue.serverTimestamp(),
      historicalEvidenceMutationAllowed: false
    }, { merge: true });

    await slotRef.set({ downstreamVerificationComplete: false }, { merge: true });
    return { success: false, status: 'UNSAFE_REWRITE_BLOCKED', downstreamUnlocked: false };
  }

  const isPass = request.reconciliationStatus === 'SUCCESS';
  const newStatus = isPass ? 'RECONCILED_COMPLETE' : 'RECONCILIATION_FAILED';

  const impactRef = db.collection('factory_impact_queue').doc(`crucible_${request.eventId}`);
  await impactRef.set({
    status: newStatus,
    reconciledBy: request.reconciledBy,
    reconciledAt: FieldValue.serverTimestamp(),
    historicalEvidenceMutationAllowed: false
  }, { merge: true });

  if (!isPass) {
    await slotRef.set({ downstreamVerificationComplete: false }, { merge: true });
    return { success: false, status: 'RECONCILIATION_FAILED', downstreamUnlocked: false };
  }

  // Check if DigiBook is also complete
  const digibookRef = db.collection('factory_impact_queue').doc(`digibook_${request.eventId}`);
  const digibookSnap = await digibookRef.get();
  const digibookDone = digibookSnap.exists && digibookSnap.data()?.status === 'VERIFIED_COMPLETE';

  if (digibookDone) {
    await slotRef.set({ downstreamVerificationComplete: true, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  return { success: true, status: 'RECONCILED_COMPLETE', downstreamUnlocked: digibookDone };
}
