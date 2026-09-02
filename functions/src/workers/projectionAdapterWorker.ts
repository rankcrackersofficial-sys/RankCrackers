import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
const { classifyWorkerAuthority } = require('../../services/canonical_source_authority');

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

  const batch = db.batch();
  let count = 0;

  for (const doc of projSnap.docs) {
    const data = doc.data();
    const nodeId = data.id || doc.id;

    // Project EXACT expected document shape for Student Reader contract
    const projectedDoc = {
      id: nodeId,
      nodeId: nodeId,
      nodeType: data.nodeType || 'topic',
      paperId: data.paperId || 'PAPER_1',
      runId: 'run_jee_full_materialization',
      subjectId: data.subjectId || 'Physics',
      parentId: data.parentId || data.parentKey || null,
      canonicalTitle: data.canonicalTitle || data.title || '',
      sourceOrder: data.sourceOrder || count,
      sourceVersionId: request.sourceVersionId,
      sourceSha256: request.sourceSha256,
      activationEpoch: request.activationEpoch,
      updatedAt: FieldValue.serverTimestamp()
    };

    batch.set(structuredRef.doc(nodeId), projectedDoc, { merge: true });
    count++;
  }

  await batch.commit();

  return { success: true, projectedNodesCount: count, status: 'STUDENT_READER_CUTOVER_COMPLETE' };
}
