const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { logFounderActivity } = require("../services/audit_service");
const { ensureFounderClaims } = require("../utils/sovereign_logic");
const { assertAccessMutationRequest, assertTargetClaimTransition } = require('../services/founder_access_mutation_guard');

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

  const { targetUid, role, action } = data || {};
  const db = admin.firestore();

  try {
    assertAccessMutationRequest({ auth, targetUid, role, action });
    const targetUser = await admin.auth().getUser(targetUid);
    const targetClaims = targetUser.customClaims || {};
    assertTargetClaimTransition({ targetClaims, role, action });

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
        if (Array.isArray(data?.scopes)) {
          const { normalizeScopes } = require('../services/admin_scope_authority');
          newClaims.scopes = normalizeScopes(data.scopes);
        }
      }
    } else {
      delete newClaims.admin;
      delete newClaims.founder;
      delete newClaims.accessLevel;
      delete newClaims.scopes;
    }

    await admin.auth().setCustomUserClaims(targetUid, newClaims);

    let newRole = 'user';
    if (newClaims.founder) newRole = 'founder';
    else if (newClaims.admin) newRole = 'admin';

    // Sync to Firestore
    const userUpdate = {
      role: newRole,
      accessLevel: newClaims.accessLevel || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    if (newClaims.scopes) {
      userUpdate.scopes = newClaims.scopes;
    } else if (action === 'revoke') {
      userUpdate.scopes = [];
    }

    await db.collection('users').doc(targetUid).set(userUpdate, { merge: true });

    await logFounderActivity({
      type: 'ACCESS_MANAGEMENT',
      message: `Founder ${auth.uid} ${action}ed ${role} to ${targetUid}`,
      metadata: {
        targetUid,
        action,
        role,
        previousRole: targetClaims.founder ? 'founder' : (targetClaims.admin ? 'admin' : 'user'),
        newRole,
        scopes: newClaims.scopes || []
      }
    });

    return { success: true, newClaims };

  } catch (error) {
    console.error('ACCESS_MGMT_ERROR:', error.message);
    if (error instanceof functions.https.HttpsError) throw error;
    if (typeof error?.message === 'string' && error.message.startsWith('ACCESS_')) {
      const code = error.message.includes('_INVALID') || error.message.includes('_ARRAY') ? 'invalid-argument' : 'permission-denied';
      throw new functions.https.HttpsError(code, error.message);
    }
    throw new functions.https.HttpsError('internal', 'Access management failed.');
  }
});

/**
 * 🔱 GRANULAR ADMIN SCOPE MUTATION (Founder-only)
 */
exports.manageAdminScopes = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth) throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED.');

  await ensureFounderClaims(auth.uid);

  const isFounder = auth.token.founder === true;
  if (!isFounder) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }

  const { targetUid, action, scopes } = data || {};
  const { assertAdminScopesMutationRequest } = require('../services/founder_access_mutation_guard');
  const { normalizeScopes } = require('../services/admin_scope_authority');
  const db = admin.firestore();

  try {
    assertAdminScopesMutationRequest({ auth, targetUid, action, scopes });
    const targetUser = await admin.auth().getUser(targetUid);
    const targetClaims = targetUser.customClaims || {};

    if (targetClaims.founder === true) {
      throw new functions.https.HttpsError('failed-precondition', '🔱 FOUNDER_SCOPES_CANNOT_BE_MUTATED: Founders have universal clearance.');
    }
    if (targetClaims.admin !== true) {
      throw new functions.https.HttpsError('failed-precondition', '🔱 TARGET_IS_NOT_ADMIN: Target must be elevated to Admin before assigning scopes.');
    }

    const requestedScopes = normalizeScopes(scopes || []);
    const existingScopes = Array.isArray(targetClaims.scopes) ? targetClaims.scopes : [];
    let updatedScopes = [];

    if (action === 'grant') {
      const set = new Set([...existingScopes, ...requestedScopes]);
      updatedScopes = Array.from(set).sort();
    } else if (action === 'revoke') {
      const removeSet = new Set(requestedScopes);
      updatedScopes = existingScopes.filter(s => !removeSet.has(s)).sort();
    } else if (action === 'set') {
      updatedScopes = requestedScopes;
    }

    const newClaims = {
      ...targetClaims,
      scopes: updatedScopes,
    };

    await admin.auth().setCustomUserClaims(targetUid, newClaims);

    await db.collection('users').doc(targetUid).set({
      scopes: updatedScopes,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await logFounderActivity({
      type: 'ADMIN_SCOPE_MANAGEMENT',
      message: `Founder ${auth.uid} ${action}ed scopes on Admin ${targetUid}`,
      metadata: {
        targetUid,
        action,
        requestedScopes,
        updatedScopes
      }
    });

    return { success: true, scopes: updatedScopes };
  } catch (error) {
    console.error('ADMIN_SCOPE_MGMT_ERROR:', error.message);
    if (error instanceof functions.https.HttpsError) throw error;
    if (typeof error?.message === 'string' && error.message.startsWith('ACCESS_')) {
      const code = error.message.includes('_INVALID') || error.message.includes('_ARRAY') ? 'invalid-argument' : 'permission-denied';
      throw new functions.https.HttpsError(code, error.message);
    }
    throw new functions.https.HttpsError('internal', 'Admin scope management failed.');
  }
});
