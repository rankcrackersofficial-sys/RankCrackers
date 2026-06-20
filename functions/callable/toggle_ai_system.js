const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logFounderActivity } = require("../services/audit_service");

/**
 * 🔱 COMMAND CENTER CONFIGURATION
 */
exports.toggleAiSystem = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth || !auth.token.founder) throw new functions.https.HttpsError('permission-denied', '🔱 ONLY FOUNDERS CAN OPERATE KILL SWITCH.');

  const { enabled } = data;
  await admin.firestore().collection('system_config').doc('global').set({
    aiEnabled: enabled,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedBy: auth.uid
  }, { merge: true });

  await logFounderActivity({
    type: 'SYSTEM_CONFIG',
    message: `AI System ${enabled ? 'ENABLED' : 'DISABLED'} by Founder.`,
    severity: enabled ? 'MEDIUM' : 'CRITICAL'
  });

  return { success: true };
});
