const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logFounderActivity } = require("../services/audit_service");
const { ensureFounderClaims } = require("../utils/sovereign_logic");

/**
 * 🔱 SOVEREIGN ACCESS MANAGEMENT (v5.5 Hardened)
 * Only a Founder can elevate others to Admin.
 */
exports.manageUserAccess = functions.https.onCall(async (data, context) => {
  const { auth } = context;

  if (!auth) throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED.');

  // 🔱 Phase 7: Sovereign Override
  await ensureFounderClaims(auth.uid);

  // 🔱 Identity Verification
  const isFounder = auth.token.founder === true;
  const isAdmin = auth.token.admin === true;

  if (!isFounder && !isAdmin) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }

  const { targetUid, role, action } = data;
  const db = admin.firestore();

  try {
    const targetUser = await admin.auth().getUser(targetUid);
    const targetClaims = targetUser.customClaims || {};

    // 🔱 P1: FOUNDER PROTECTION LAWS
    if (role === 'founder' && !isFounder) {
      throw new functions.https.HttpsError('permission-denied', '🔱 ONLY A FOUNDER CAN ANNOUNCE A NEW FOUNDER.');
    }

    // 🔱 Audit Fix: Ensure at least one founder remains
    if (targetClaims.founder && action === 'revoke') {
      if (!isFounder) {
        throw new functions.https.HttpsError('permission-denied', '🔱 ADMINS CANNOT STRIP FOUNDER PRIVILEGES.');
      }
      const foundersSnap = await admin.firestore().collection('users').where('role', '==', 'founder').get();
      if (foundersSnap.size <= 1) {
        throw new functions.https.HttpsError('failed-precondition', '🔱 COMMAND DENIED: The last Founder must remain in power.');
      }
    }

    let newClaims = { ...targetClaims };

    if (action === 'grant') {
      if (role === 'founder' || role === 'admin') newClaims.admin = true;
      if (role === 'founder') {
        newClaims.founder = true;
        newClaims.accessLevel = 9;
      } else if (role === 'admin') {
        newClaims.accessLevel = 5;
      }
    } else {
      delete newClaims.admin;
      delete newClaims.founder;
      delete newClaims.accessLevel;
    }

    await admin.auth().setCustomUserClaims(targetUid, newClaims);

    let newRole = 'user';
    if (newClaims.founder) newRole = 'founder';
    else if (newClaims.admin) newRole = 'admin';

    // Sync to Firestore
    await db.collection('users').doc(targetUid).set({
      role: newRole,
      accessLevel: newClaims.accessLevel || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await logFounderActivity({
      type: 'ACCESS_MANAGEMENT',
      message: `Founder ${auth.uid} ${action}ed ${role} to ${targetUid}`,
      metadata: {
        targetUid,
        action,
        role,
        previousRole: targetClaims.founder ? 'founder' : (targetClaims.admin ? 'admin' : 'user'),
        newRole
      }
    });

    return { success: true, newClaims };

  } catch (error) {
    console.error(`🔱 ACCESS_MGMT_ERROR: ${error.message}`);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
