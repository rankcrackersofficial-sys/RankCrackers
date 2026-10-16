/**
 * 🔱 FOUNDER OPERATIONS SUMMARY CALLABLE (getFounderOpsSummary)
 * Command: RC-FOUNDER-OPS-BACKEND-R2-SERVER-AUTHORITATIVE-OPS-SUMMARY-AG1-20260914
 *
 * Laws:
 *   - Strictly Founder clearance required: auth.token.founder === true.
 *   - Student / Non-Founder: DENIED with permission-denied.
 *   - Unauthenticated: DENIED with unauthenticated.
 *   - Zero mutation: strictly read-only execution.
 *   - Authorization evaluated before any Firestore reads.
 */

'use strict';

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { buildFounderOpsSummary } = require("../services/founder_ops_summary_service");

/**
 * Asserts caller holds active Founder authorization.
 * Denies student, non-founder, and unauthenticated callers before any Firestore read.
 */
function assertFounderAuthorized(auth) {
  if (!auth) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');
  }
  if (!auth.token || auth.token.founder !== true) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required for Operations Summary.');
  }
}

/**
 * Callable HTTPS endpoint for Founder Operations Summary.
 */
const getFounderOpsSummary = functions.https.onCall(async (data, context) => {
  const { auth } = context;

  // 1. Strict security authorization BEFORE any Firestore read
  assertFounderAuthorized(auth);

  // 2. Execute bounded server-authoritative summary
  const db = admin.firestore();
  const summary = await buildFounderOpsSummary({ db });

  return summary;
});

module.exports = {
  assertFounderAuthorized,
  getFounderOpsSummary,
};
