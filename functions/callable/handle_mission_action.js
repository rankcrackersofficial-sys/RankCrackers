const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔱 MISSION ACTION CENTER (Hardened v5.2 - Forensic Truth Layer)
 * Citizen-tier actions with Cross-Realm Deduplication and Project Segregation.
 */
exports.handleMissionAction = functions.https.onCall(async (data, context) => {
  const { auth } = context;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', '🔱 ACCESS DENIED.');

  const { action, realmId, payload } = data;
  const db = admin.firestore();
  const uid = auth.uid;

  // 🔱 Gap 2 Fix: Project-based Environment Segregation
  const projectId = admin.app().options.projectId;
  const isProduction = projectId === 'rankcrackers-55';

  try {
    const participantRef = db.collection('mission_realms').doc(realmId).collection('participants').doc(uid);

    // 🔱 ACTION: CLAIM QUALIFICATION (Forensic Ingestion)
    if (action === 'claim_qualification') {
      const { milestoneType, rollNumber, resultUrl, screenshotUrl, score, rank } = payload;
      if (!rollNumber) throw new Error('ROLL_NUMBER_REQUIRED');

      // 🔱 Gap 3 Fix: Cross-User Duplicate Detection (Roll Number)
      const duplicateSnap = await db.collectionGroup('participants')
          .where(`attempts.${milestoneType}.claimedRollNumber`, '==', rollNumber)
          .where('environment', '==', projectId)
          .limit(1).get();

      const isDuplicateRoll = !duplicateSnap.empty && duplicateSnap.docs[0].id !== uid;

      // 🔱 1. Calculate Initial Authenticity Score (0-100)
      let authScore = 0;
      if (resultUrl && resultUrl.includes('http')) authScore += 30;
      if (screenshotUrl && screenshotUrl.includes('firebasestorage')) authScore += 30;
      if (rollNumber) authScore += 10;

      // 🔱 Gap 1 Fix: Treat Client Score/Rank as "Claimed" (Lower weight)
      if (score && score <= 100) authScore += 5;
      if (rank) authScore += 5;

      // Deduct for suspicious signals
      if (isDuplicateRoll) authScore -= 50;

      // 🔱 2. Forensic Flagging Logic
      let targetStatus = 'PENDING_VERIFICATION';
      let flagReason = null;

      if (!screenshotUrl || !resultUrl || isDuplicateRoll || (score && score > 100)) {
          targetStatus = 'FLAGGED';
          flagReason = isDuplicateRoll ? 'DUPLICATE_ROLL_NUMBER' :
                      (!screenshotUrl ? 'MISSING_SCREENSHOT' :
                      (!resultUrl ? 'MISSING_URL' : 'INVALID_METRICS'));
      }

      await participantRef.set({
        uid: uid,
        environment: projectId, // 🔱 True Project ID segregation
        isMockData: !isProduction,
        [`attempts.${milestoneType}.status`]: targetStatus,
        [`attempts.${milestoneType}.authenticityScore`]: authScore,
        [`attempts.${milestoneType}.flagReason`]: flagReason,

        // 🔱 Gap 1 Fix: Explicit separation of Claimed vs Verified
        [`attempts.${milestoneType}.claimedRollNumber`]: rollNumber,
        [`attempts.${milestoneType}.claimedResultUrl`]: resultUrl || null,
        [`attempts.${milestoneType}.claimedScreenshotUrl`]: screenshotUrl || null,
        [`attempts.${milestoneType}.claimedScore`]: score || null,
        [`attempts.${milestoneType}.claimedRank`]: rank || null,

        [`attempts.${milestoneType}.verifiedScore`]: null, // Pending Founder
        [`attempts.${milestoneType}.verifiedRank`]: null,  // Pending Founder

        [`attempts.${milestoneType}.claimedAt`]: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      return { success: true, status: targetStatus, score: authScore };
    }

    throw new Error('UNKNOWN_ACTION');
  } catch (error) {
    console.error(`🔱 MISSION_ACTION_ERROR: ${error.message}`);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
