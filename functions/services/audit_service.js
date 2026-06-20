const admin = require("firebase-admin");

/**
 * 🔱 AUDIT SERVICE
 * Centralized logging for Founder and AI activities.
 */

async function logFounderActivity(activity) {
  await admin.firestore().collection('founder_activity_log').add({
    ...activity,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

async function logAiAudit(data) {
  await admin.firestore().collection('ai_audit_logs').add({
    ...data,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}

module.exports = {
  logFounderActivity,
  logAiAudit
};
