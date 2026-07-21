const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔱 SOVEREIGN PRIVILEGE ESCALATION (Disabled for security)
 */
exports.setSovereignClaims = functions.https.onCall(async (data, context) => {
  throw new functions.https.HttpsError('permission-denied', '🔱 COMMAND DENIED: Bootstrapping is disabled in production.');
});
