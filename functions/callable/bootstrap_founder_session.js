const functions = require('firebase-functions');
const { ensureFounderClaims } = require('../utils/sovereign_logic');

/**
 * Repairs the canonical Founder's claims at session bootstrap.
 * The server checks both immutable UID and registered email; the client
 * cannot self-assign Founder access by supplying an email address.
 */
exports.bootstrapFounderSession = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required.');
  }

  const repaired = await ensureFounderClaims(context.auth.uid);
  return { success: repaired, founder: repaired };
});
