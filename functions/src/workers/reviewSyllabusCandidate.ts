import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (admin.apps.length === 0) admin.initializeApp();
const db = admin.firestore();

/** Human SME decisions only. Founder claims cannot impersonate a reviewer. */
export const reviewSyllabusCandidate = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'SIGN_IN_REQUIRED');
  const authorityId = context.auth.token.academicReviewerId;
  if (typeof authorityId !== 'string' || !/^sme_[a-z0-9_]+$/.test(authorityId)) {
    throw new functions.https.HttpsError('permission-denied', 'ACADEMIC_REVIEWER_CLAIM_REQUIRED');
  }
  const missionId = String(data?.missionId || '');
  const nodeId = String(data?.nodeId || '');
  const decision = String(data?.decision || '').toUpperCase();
  const reason = String(data?.reason || '').trim();
  if (!missionId || !nodeId || !['APPROVE', 'REJECT'].includes(decision) || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'MISSION_NODE_DECISION_AND_REASON_REQUIRED');
  }

  const reviewerRef = db.collection('reviewer_registry').doc(authorityId);
  const officialRef = db.collection('mission_realms').doc(missionId).collection('official_syllabus_candidates').doc(nodeId);
  const derivedRef = db.collection('mission_realms').doc(missionId).collection('derived_syllabus_candidates').doc(nodeId);
  const [reviewerSnap, officialSnap, derivedSnap] = await Promise.all([reviewerRef.get(), officialRef.get(), derivedRef.get()]);
  if (!reviewerSnap.exists) throw new functions.https.HttpsError('permission-denied', 'REVIEWER_NOT_REGISTERED');
  const reviewer = reviewerSnap.data() || {};
  if (reviewer.active !== true || reviewer.reviewDecisionSigningMethod !== 'SECURE_JWT_AUDITED_SESSION'
      || !reviewer.credentialEvidenceRef || !Array.isArray(reviewer.missionScopes)
      || !reviewer.missionScopes.includes(missionId) || !Array.isArray(reviewer.subjectScopes)) {
    throw new functions.https.HttpsError('permission-denied', 'REVIEWER_SCOPE_OR_SIGNING_AUTHORITY_INVALID');
  }
  const isOfficial = officialSnap.exists;
  const ref = isOfficial ? officialRef : derivedRef;
  const snapshot = isOfficial ? officialSnap : derivedSnap;
  if (!snapshot.exists) throw new functions.https.HttpsError('not-found', 'SYLLABUS_CANDIDATE_NOT_FOUND');
  const candidate = snapshot.data() || {};
  const subject = String(candidate.subjectId || '');
  if (!reviewer.subjectScopes.includes(subject)) {
    throw new functions.https.HttpsError('permission-denied', 'REVIEWER_SUBJECT_SCOPE_MISMATCH');
  }
  if (candidate.missionId !== missionId || !['PENDING_REVIEW', 'CANDIDATE'].includes(candidate.verificationState)
      || !['OFFICIAL_CANDIDATE', 'DERIVED'].includes(candidate.provenance)) {
    throw new functions.https.HttpsError('failed-precondition', 'CANDIDATE_NOT_REVIEWABLE');
  }
  const sourceRef = db.collection('mission_realms').doc(missionId)
      .collection('official_documents').doc(String(candidate.documentId || ''));
  const sourceSnap = await sourceRef.get();
  if (!sourceSnap.exists) throw new functions.https.HttpsError('failed-precondition', 'OFFICIAL_SOURCE_MISSING');
  const source = sourceSnap.data() || {};
  if (source.sourceVersionId !== candidate.sourceVersionId
      || (source.sourceSha256 || source.fileHash) !== candidate.sourceSha256
      || !['VERIFIED', 'APPROVED'].includes(String(source.verificationState || source.reviewStatus || '').toUpperCase())) {
    throw new functions.https.HttpsError('failed-precondition', 'STALE_OR_UNVERIFIED_OFFICIAL_SOURCE');
  }
  if (candidate.provenance === 'DERIVED') {
    const profile = await db.collection('mission_realms').doc(missionId)
      .collection('academic_boundary_profiles').doc('current').get();
    const p = profile.data() || {};
    if (!profile.exists || p.effectiveState !== 'ACTIVE' || p.verificationState !== 'VERIFIED'
        || p.profileVersion !== candidate.boundaryProfileVersion
        || p.officialSyllabusVersion !== candidate.sourceVersionId) {
      throw new functions.https.HttpsError('failed-precondition', 'STALE_OR_UNVERIFIED_BOUNDARY_PROFILE');
    }
  }

  const nextState = decision === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
  await db.runTransaction(async (tx) => {
    const current = await tx.get(ref);
    if (!current.exists || !['PENDING_REVIEW', 'CANDIDATE'].includes(current.data()?.verificationState)) {
      throw new functions.https.HttpsError('aborted', 'CANDIDATE_CHANGED_DURING_REVIEW');
    }
    tx.update(ref, {
      verificationState: nextState,
      provenance: isOfficial && decision === 'APPROVE' ? 'OFFICIAL' : candidate.provenance,
      reviewState: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      reviewDecision: decision,
      reviewReason: reason,
      reviewerAuthorityId: authorityId,
      reviewerUid: context.auth!.uid,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  if (isOfficial && decision === 'APPROVE' && candidate.sourceVersionId) {
    const allSnap = await db.collection('mission_realms').doc(missionId)
      .collection('official_syllabus_candidates')
      .where('sourceVersionId', '==', candidate.sourceVersionId).get();
    const sourceNodes = allSnap.docs.map((doc) => doc.data());
    const allApproved = sourceNodes.length > 0
      && sourceNodes.every((node) => node.verificationState === 'VERIFIED' && node.provenance === 'OFFICIAL');
    if (allApproved) {
      const taskId = `syllabus_b4_${missionId}_${candidate.sourceVersionId}`;
      await db.collection('ai_queue').doc(taskId).create({
        id: taskId, task_type: 'SYLLABUS_B4', mission_id: missionId,
        document_id: candidate.documentId, sourceVersionId: candidate.sourceVersionId,
        sourceSha256: candidate.sourceSha256, run_id: candidate.runId || taskId,
        status: 'queued', createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expected_output: 'derived_syllabus_candidates',
      }).catch((error: any) => {
        if (error?.code !== 6 && error?.code !== 'already-exists') throw error;
      });
    }
  }
  return { success: true, missionId, nodeId, verificationState: nextState };
});
