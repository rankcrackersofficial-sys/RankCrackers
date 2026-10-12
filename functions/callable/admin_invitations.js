'use strict';

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');
const { ensureFounderClaims } = require('../utils/sovereign_logic');
const { logFounderActivity } = require('../services/audit_service');
const { CANONICAL_ADMIN_SCOPES, normalizeScopes } = require('../services/admin_scope_authority');

/**
 * 🔱 SECURE ADMIN INVITATION LIFECYCLE (P0)
 * Tokens are cryptographically digested via SHA-256 before Firestore storage.
 * Plaintext tokens are NEVER stored in Firestore and NEVER logged.
 */

exports.issueAdminInvite = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth) throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Authentication required.');

  await ensureFounderClaims(auth.uid);
  if (auth.token.founder !== true) {
    throw new functions.https.HttpsError('permission-denied', '🔱 ACCESS DENIED: Founder clearance required.');
  }

  const { email, scopes, expiresInHours } = data || {};
  if (typeof email !== 'string' || !email.trim() || !email.includes('@')) {
    throw new functions.https.HttpsError('invalid-argument', 'INVITATION_TARGET_EMAIL_INVALID');
  }

  const normalizedEmail = email.trim().toLowerCase();
  let assignedScopes;
  try {
    assignedScopes = normalizeScopes(Array.isArray(scopes) && scopes.length > 0 ? scopes : CANONICAL_ADMIN_SCOPES);
  } catch (err) {
    throw new functions.https.HttpsError('invalid-argument', err.message);
  }

  const hours = Math.min(Math.max(Number(expiresInHours) || 48, 1), 168);
  const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + hours * 3600 * 1000);

  // Generate cryptographically secure random bearer token
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const db = admin.firestore();
  await db.collection('admin_invitations').doc(tokenHash).set({
    inviteHash: tokenHash,
    targetEmail: normalizedEmail,
    role: 'admin',
    scopes: assignedScopes,
    expiresAt,
    status: 'ISSUED',
    redeemed: false,
    redeemedAt: null,
    redeemedByUid: null,
    claimedByUid: null,
    claimedAt: null,
    claimError: null,
    createdByUid: auth.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await logFounderActivity({
    type: 'ADMIN_INVITATION_ISSUED',
    message: `Founder ${auth.uid} issued invitation for ${normalizedEmail}`,
    metadata: {
      targetEmail: normalizedEmail,
      scopes: assignedScopes,
      expiresAt: expiresAt.toDate().toISOString(),
      inviteHash: tokenHash,
    },
  });

  return {
    success: true,
    token, // Provided once to Founder over secure transport; never written to DB or logs.
    expiresAt: expiresAt.toDate().toISOString(),
  };
});

exports.acceptAdminInvite = functions.https.onCall(async (data, context) => {
  const { auth } = context;
  if (!auth || !auth.uid) {
    throw new functions.https.HttpsError('unauthenticated', '🔱 COMMAND DENIED: Must be authenticated to accept invitation.');
  }

  const callerEmail = auth.token.email;
  if (!callerEmail || typeof callerEmail !== 'string') {
    throw new functions.https.HttpsError('failed-precondition', '🔱 CALLER_EMAIL_REQUIRED: Verified account email required.');
  }

  if (auth.token.email_verified !== true) {
    throw new functions.https.HttpsError('failed-precondition', '🔱 CALLER_EMAIL_UNVERIFIED: Email address must be verified.');
  }

  const { token } = data || {};
  if (typeof token !== 'string' || !token.trim()) {
    throw new functions.https.HttpsError('invalid-argument', 'INVITATION_TOKEN_REQUIRED');
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
  const db = admin.firestore();
  const inviteRef = db.collection('admin_invitations').doc(tokenHash);

  // STEP 1: Transactional Claim (ISSUED -> CLAIMS_PENDING)
  let inviteData;
  await db.runTransaction(async (txn) => {
    const inviteSnap = await txn.get(inviteRef);
    if (!inviteSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'INVITATION_NOT_FOUND');
    }

    const doc = inviteSnap.data();
    if (doc.status === 'ACCEPTED' || doc.redeemed === true) {
      throw new functions.https.HttpsError('already-exists', 'INVITATION_ALREADY_REDEEMED');
    }

    const expiresMillis = doc.expiresAt?.toMillis ? doc.expiresAt.toMillis() : 0;
    if (Date.now() > expiresMillis) {
      throw new functions.https.HttpsError('deadline-exceeded', 'INVITATION_EXPIRED');
    }

    if (callerEmail.trim().toLowerCase() !== (doc.targetEmail || '').trim().toLowerCase()) {
      throw new functions.https.HttpsError('permission-denied', 'INVITATION_EMAIL_MISMATCH');
    }

    // State machine concurrency lock: Check if already locked by another user
    if (doc.status === 'CLAIMS_PENDING' && doc.claimedByUid && doc.claimedByUid !== auth.uid) {
      throw new functions.https.HttpsError('permission-denied', 'INVITATION_CLAIMED_BY_ANOTHER_USER');
    }

    // Advance to CLAIMS_PENDING if not already claimed by this user
    if (doc.status !== 'CLAIMS_PENDING' || doc.claimedByUid !== auth.uid) {
      txn.update(inviteRef, {
        status: 'CLAIMS_PENDING',
        claimedByUid: auth.uid,
        claimedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    inviteData = doc;
  });

  // STEP 2: Custom Claims assignment preserving existing trusted claims
  try {
    const userRecord = await admin.auth().getUser(auth.uid);
    const existingClaims = userRecord.customClaims || {};

    const newClaims = {
      ...existingClaims,
      admin: true,
      accessLevel: 5,
      scopes: inviteData.scopes || [],
    };

    await admin.auth().setCustomUserClaims(auth.uid, newClaims);
  } catch (err) {
    // Record claim error in invitation document so retry is possible without losing state
    await inviteRef.update({
      claimError: err.message || 'CLAIM_ASSIGNMENT_FAILED',
      claimErrorAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    throw new functions.https.HttpsError('internal', `CLAIM_ASSIGNMENT_FAILED: ${err.message}`);
  }

  // STEP 3: Final Transaction (CLAIMS_PENDING -> ACCEPTED)
  await db.runTransaction(async (txn) => {
    txn.update(inviteRef, {
      status: 'ACCEPTED',
      redeemed: true,
      redeemedAt: admin.firestore.FieldValue.serverTimestamp(),
      redeemedByUid: auth.uid,
      claimError: null,
    });

    const userRef = db.collection('users').doc(auth.uid);
    txn.set(userRef, {
      role: 'admin',
      status: 'ACTIVE',
      accessLevel: 5,
      scopes: inviteData.scopes || [],
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  });

  await logFounderActivity({
    type: 'ADMIN_INVITATION_ACCEPTED',
    message: `User ${auth.uid} (${callerEmail}) accepted admin invitation`,
    metadata: {
      uid: auth.uid,
      email: callerEmail,
      scopes: inviteData.scopes,
      inviteHash: tokenHash,
    },
  });

  return {
    success: true,
    role: 'admin',
    scopes: inviteData.scopes || [],
  };
});
