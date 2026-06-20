const functions = require("firebase-functions");
const admin = require("firebase-admin");

/**
 * 🔱 SYSTEM HEALTH MONITOR (Hardened v3.9 - Forensic Diagnostics)
 * Central authority for auditing cloud infrastructure and provider states.
 */
exports.getSystemHealth = functions
  .runWith({
    secrets: ["GEMINI_API_KEY"]
  })
  .https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth || (!auth.token.admin && !auth.token.founder)) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }

  const db = admin.firestore();

  // 🔱 1. Provider Audit (Real .env Check)
  const health = {
    providers: {
      gemini: process.env.GEMINI_API_KEY ? "configured" : "missing_key",
    },
    services: {
      firestore: "evaluating",
      auth: "healthy"
    },
    project: admin.app().options.projectId || process.env.GCLOUD_PROJECT,
    version: "8.2.3",
    timestamp: new Date().toISOString()
  };

  try {
    // 🔱 2. Firestore Forensic Check: Write Test
    const heartbeatRef = db.collection('system_health_pings').doc('heartbeat');

    try {
        await heartbeatRef.set({
            lastPing: admin.firestore.FieldValue.serverTimestamp(),
            auditedBy: auth.uid,
            env: process.env.NODE_ENV || 'production'
        });
        health.services.firestore = "healthy";
    } catch (writeError) {
        console.error("🔱 HEALTH WRITE FAILURE:", writeError);
        // Map common error codes to readable strings for the Founder
        const codeMap = {
            7: "permission_denied",
            8: "resource_exhausted",
            14: "unavailable",
            5: "not_found"
        };
        health.services.firestore = `write_fail: ${codeMap[writeError.code] || writeError.code || writeError.message.substring(0, 20)}`;
    }

    // 🔱 3. Read Verification (only if write didn't fail fatally)
    if (health.services.firestore === "healthy") {
        const testRead = await heartbeatRef.get();
        if (!testRead.exists) {
            health.services.firestore = "read_verification_failed";
        }
    }

    return health;

  } catch (error) {
    console.error("🔱 CRITICAL HEALTH SYSTEM ERROR:", error);
    health.services.firestore = `system_error: ${error.message.substring(0, 20)}`;
    return health;
  }
});
