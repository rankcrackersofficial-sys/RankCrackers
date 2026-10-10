import * as functions from 'firebase-functions';
import { persistEligibilityEvaluation } from '../services/careerEligibilityAuthority';
import { getOrCreateProfileSnapshot } from '../services/profileSnapshotAuthority';

export const ensureEligibilityEvaluation = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid;
  if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  if (!data || data.studentId || data.state || data.evaluationId || data.evaluatedAt || data.profileSnapshotId || data.profileMaterialFactsFingerprint) {
    throw new functions.https.HttpsError('invalid-argument', 'Authoritative eligibility fields are server-owned.');
  }
  const snapshot = await getOrCreateProfileSnapshot(uid);
  return persistEligibilityEvaluation({
    ...data,
    studentId: uid,
    profileSnapshotId: snapshot.snapshotId,
    profileMaterialFactsFingerprint: snapshot.materialFactsFingerprint,
  });
});
