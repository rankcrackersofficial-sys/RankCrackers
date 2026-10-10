import * as functions from 'firebase-functions';
import { getOrCreateProfileSnapshot } from '../services/profileSnapshotAuthority';

/** Lazy, authenticated adoption boundary. The server derives the UID; callers cannot select another student. */
export const ensureProfileSnapshot = functions.https.onCall(async (_data, context) => {
  if (!context.auth?.uid) throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  const snapshot = await getOrCreateProfileSnapshot(context.auth.uid);
  return {
    snapshotId: snapshot.snapshotId,
    studentId: snapshot.studentId,
    schemaVersion: snapshot.schemaVersion,
    materialFactsFingerprint: snapshot.materialFactsFingerprint,
  };
});
