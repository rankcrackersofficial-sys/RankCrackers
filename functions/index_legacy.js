const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔱 SOVEREIGN PRIVILEGE ESCALATION (Hardened Bootstrapping)
 */
exports.setSovereignClaims = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED.');
  }

  const targetUid = data.uid;
  const callerUid = context.auth.uid;
  const AUTHORIZED_FOUNDER_EMAILS = ["founder.rcofficial@gmail.com"];
  const callerUser = await admin.auth().getUser(callerUid);

  if (!AUTHORIZED_FOUNDER_EMAILS.includes(callerUser.email)) {
    throw new functions.https.HttpsError('permission-denied', '🔱 COMMAND DENIED: Unrecognized Founder.');
  }

  try {
    await admin.auth().setCustomUserClaims(targetUid, {
      admin: true,
      founder: true,
    });
    return { success: true, message: `Sovereign Authority established for ${targetUid}` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'Failed to escalate privileges.');
  }
});
