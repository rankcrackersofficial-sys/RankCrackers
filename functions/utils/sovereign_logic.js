const admin = require("firebase-admin");

/**
 * 🔱 SOVEREIGN FOUNDER LOGIC (Disabled for security compliance)
 */
// Canonical Founder account: resolve this from the production Auth directory,
// never from a client-supplied email or claim.
const FOUNDER_UID = 'CswjiDlFjrcdHyyEjQ8oGIPYv1h1';
// The Founder account confirmed for the live Google sign-in flow.
// Keep the UID check below as the authoritative guard; email alone is not
// sufficient to receive privileged claims.
const FOUNDER_EMAIL = 'founder.rcofficial@gmail.com';

async function ensureFounderClaims(uid) {
  const user = await admin.auth().getUser(uid);
  const isCanonicalFounder =
    user.uid === FOUNDER_UID &&
    (user.email || '').trim().toLowerCase() === FOUNDER_EMAIL;

  if (!isCanonicalFounder) return false;

  const existingClaims = user.customClaims || {};
  await admin.auth().setCustomUserClaims(uid, {
    ...existingClaims,
    founder: true,
    admin: true,
    accessLevel: 9,
  });
  await admin.firestore().collection('users').doc(uid).set(
    {
      role: 'FOUNDER',
      status: 'ACTIVE',
      accessLevel: 9,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  return true;
}

module.exports = {
  ensureFounderClaims,
  FOUNDER_UID,
  FOUNDER_EMAIL
};
