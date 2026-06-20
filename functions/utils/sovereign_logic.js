const admin = require("firebase-admin");

/**
 * 🔱 SOVEREIGN FOUNDER LOGIC
 * Ensures the Founder UID always has supreme claims.
 */
const FOUNDER_UID = '6TdzjpBr6Zdx1ag3LbMmjJ0DY312';
const FOUNDER_EMAIL = 'founder.rcofficial@gmail.com';

async function ensureFounderClaims(uid) {
  if (uid !== FOUNDER_UID) return;

  const user = await admin.auth().getUser(uid);
  const claims = user.customClaims || {};

  if (!claims.founder || !claims.admin || claims.accessLevel !== 9) {
    console.log(`🔱 SOVEREIGN OVERRIDE: Granting supreme claims to Founder ${uid}`);
    await admin.auth().setCustomUserClaims(uid, {
      admin: true,
      founder: true,
      accessLevel: 9
    });

    // Also sync to Firestore
    await admin.firestore().collection('users').doc(uid).set({
      role: 'founder',
      admin: true,
      founder: true,
      accessLevel: 9,
      email: FOUNDER_EMAIL,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  }
}

module.exports = {
  ensureFounderClaims,
  FOUNDER_UID,
  FOUNDER_EMAIL
};
