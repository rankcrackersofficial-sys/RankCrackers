/**
 * 🔱 FOUNDER ON-DEMAND AUTHORITY SCAN CALLABLE (scan_authority_now)
 * Command: RC-AUTHORITY-WATCH-R1A-FIXED-IST-SCHEDULE-AND-FOUNDER-ONDEMAND-SCAN-AG1-20260914
 *
 * Laws:
 *   - Strictly Founder clearance required: auth.token.founder === true.
 *   - Student / Non-Founder: DENIED with permission-denied.
 *   - Unauthenticated: DENIED with unauthenticated.
 *   - Input from client: authorityKey ONLY.
 *   - Server re-reads all canonical data from authority registry; zero trust in client inputs.
 *   - Reuses generic scanSingleAuthority engine.
 *   - Double-run concurrency protection: returns ALREADY_RUNNING if already in-flight.
 *   - Operational boundaries: Zero source prepare, zero verify, zero mission create, zero publish.
 */

'use strict';

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { scanSingleAuthority } = require("../services/authority_intelligence/authority_watch_scanner");
const { logFounderActivity } = require("../services/audit_service");

/**
 * Asserts caller holds active Founder authorization.
 * Denies student, non-founder, and unauthenticated callers before any network scan.
 */
function assertFounderAuthorized(auth) {
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }
  if (!auth.token || auth.token.founder !== true) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required for on-demand authority scan.');
  }
}

/**
 * Callable HTTPS endpoint for on-demand single-authority scanning by Founder.
 */
const scanAuthorityNow = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '512MB',
  })
  .https.onCall(async (data, context) => {
  const { auth } = context;

  // 1. Strict security authorization BEFORE any network scan
  assertFounderAuthorized(auth);

  // 2. Extract and validate authorityKey (accepts { authorityKey } or { payload: { authorityKey } })
  const rawKey = (data && data.authorityKey) || (data && data.payload && data.payload.authorityKey);
  if (!rawKey || typeof rawKey !== 'string' || rawKey.trim().length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'AUTHORITY_KEY_REQUIRED: Must provide non-empty authorityKey.');
  }

  const authorityKey = rawKey.trim();
  const db = admin.firestore();

  // 3. Execute single-authority scan via generic engine
  let result;
  try {
    result = await scanSingleAuthority({
      db,
      authorityKey,
      triggerSource: `MANUAL_FOUNDER_${auth.uid}`,
    });
  } catch (err) {
    console.error(`🔱 SCAN_AUTHORITY_NOW_FAILED: ${err.message}`);
    throw new functions.https.HttpsError('internal', err.message);
  }

  // 4. Log Founder activity for auditability
  try {
    await logFounderActivity({
      type: 'AUTHORITY_SCAN_NOW',
      message: `Founder triggered on-demand scan for authority "${authorityKey}" [Status: ${result.runStatus}]`,
      metadata: {
        authorityKey,
        runStatus: result.runStatus,
        candidatesDetected: result.candidatesDetected,
        newEvents: result.newEvents,
        duplicates: result.duplicates,
        errors: result.errors,
      },
    });
  } catch (logErr) {
    console.warn(`🔱 SCAN_AUTHORITY_NOW: Founder audit log warning: ${logErr.message}`);
  }

  return {
    success: result.runStatus !== 'ERROR',
    action: 'scan_authority_now',
    result,
  };
});

module.exports = {
  scanAuthorityNow,
  assertFounderAuthorized,
};
