import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
const { classifyWorkerAuthority } = require('../../services/canonical_source_authority');
const { buildMissionNeutralProjectionNode } = require('../../services/mission_neutral_projection');

export interface CutoverRequest {
  missionId: string;
  sourceSlotId: string;
  sourceVersionId: string;
  sourceSha256: string;
  activationEpoch: number;
}

export async function projectSyllabusToStudentReader(
  db: admin.firestore.Firestore,
  request: CutoverRequest
): Promise<{ success: boolean; projectedNodesCount: number; status: string }> {
  const slotRef = db.collection('mission_realms')
    .doc(request.missionId)
    .collection('source_slots')
    .doc(request.sourceSlotId);

  const slotSnap = await slotRef.get();
  const slotData = slotSnap.data();

  const authorityStatus = classifyWorkerAuthority(slotData, request);
  if (authorityStatus !== 'CURRENT') {
    return { success: false, projectedNodesCount: 0, status: `CUTOVER_REJECTED_${authorityStatus}` };
  }

  // Fail-closed if downstream verification (DigiBook + Crucible) is not complete
  if (slotData?.downstreamVerificationComplete !== true && slotData?.reconciliationState !== 'NOT_APPLICABLE') {
    return { success: false, projectedNodesCount: 0, status: 'DOWNSTREAM_VERIFICATION_INCOMPLETE' };
  }

  // Read current_syllabus_projection units
  const projSnap = await db.collection('mission_realms')
    .doc(request.missionId)
    .collection('current_syllabus_projection')
    .where('current', '==', true)
    .get();

  if (projSnap.empty) {
    return { success: false, projectedNodesCount: 0, status: 'PROJECTION_EMPTY' };
  }

  const structuredRef = db.collection('mission_realms')
    .doc(request.missionId)
    .collection('structured_nodes');

  // Validate the entire projection BEFORE staging any Firestore write.
  // A missing runId, subject or paper must never be filled with JEE defaults.
  const projections: Array<{ nodeId: string; data: any }> = [];
  for (const doc of projSnap.docs) {
    const node = doc.data();
    const nodeId = node.id || doc.id;
    try {
      const projected = buildMissionNeutralProjectionNode({ node, nodeId, request });
      projections.push({ nodeId, data: projected });
    } catch (error: any) {
      return {
        success: false,
        projectedNodesCount: 0,
        status: 'PROJECTION_AUTHORITY_BLOCKED_' + (error?.message || 'UNKNOWN')
      };
    }
  }

  // Keep publication atomic: one Firestore batch contains at most 499 node
  // writes plus the active mission pointer. Oversized projections fail closed.
  if (projections.length > 499) {
    return {
      success: false,
      projectedNodesCount: 0,
      status: 'PROJECTION_TOO_LARGE_FOR_ATOMIC_CUTOVER'
    };
  }

  const batch = db.batch();
  for (const projection of projections) {
    batch.set(structuredRef.doc(projection.nodeId), {
      ...projection.data,
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }
  const count = projections.length;
  batch.set(slotRef.parent.parent!, {
    studentProjectionActivationEpoch: request.activationEpoch,
    studentProjectionSourceVersionId: request.sourceVersionId,
    studentProjectionSourceSha256: request.sourceSha256,
    studentProjectionActivatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  await batch.commit();

  return { success: true, projectedNodesCount: count, status: 'STUDENT_READER_CUTOVER_COMPLETE' };
}
