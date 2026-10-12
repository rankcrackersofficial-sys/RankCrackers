'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { CANONICAL_ADMIN_SCOPES, normalizeScopes } = require('../services/admin_scope_authority');

test('invitation tokens produce deterministic SHA-256 digests', () => {
  const token = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const digest1 = crypto.createHash('sha256').update(token).digest('hex');
  const digest2 = crypto.createHash('sha256').update(token).digest('hex');
  assert.equal(digest1, digest2);
  assert.equal(digest1.length, 64);
  assert.notEqual(token, digest1);
});

test('invitation lifecycle logic validates email, expiry, and single-use state', () => {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const targetEmail = 'admin.candidate@rankcrackers.com';
  const assignedScopes = ['DOCUMENTS_VIEW', 'SYLLABUS_REVIEW'];

  const inviteDoc = {
    inviteHash: tokenHash,
    targetEmail,
    role: 'admin',
    scopes: assignedScopes,
    expiresAtMillis: Date.now() + 48 * 3600 * 1000,
    redeemed: false,
    redeemedAt: null,
    redeemedByUid: null,
  };

  // Plaintext token is NEVER in the stored record
  assert.equal('token' in inviteDoc, false);
  assert.equal(inviteDoc.inviteHash, tokenHash);

  // Validate verification checks
  function validateInviteAcceptance({ submittedToken, callerEmail, doc }) {
    if (!submittedToken || typeof submittedToken !== 'string') {
      throw new Error('INVITATION_TOKEN_REQUIRED');
    }
    const submittedHash = crypto.createHash('sha256').update(submittedToken.trim()).digest('hex');
    if (submittedHash !== doc.inviteHash) {
      throw new Error('INVITATION_NOT_FOUND');
    }
    if (doc.redeemed) {
      throw new Error('INVITATION_ALREADY_REDEEMED');
    }
    if (Date.now() > doc.expiresAtMillis) {
      throw new Error('INVITATION_EXPIRED');
    }
    if (!callerEmail || callerEmail.toLowerCase().trim() !== doc.targetEmail.toLowerCase().trim()) {
      throw new Error('INVITATION_EMAIL_MISMATCH');
    }
    return true;
  }

  // 1. Success validation
  assert.equal(
    validateInviteAcceptance({
      submittedToken: token,
      callerEmail: 'admin.candidate@rankcrackers.com',
      doc: inviteDoc,
    }),
    true
  );

  // 2. Wrong token fails
  assert.throws(
    () =>
      validateInviteAcceptance({
        submittedToken: 'wrong_token',
        callerEmail: 'admin.candidate@rankcrackers.com',
        doc: inviteDoc,
      }),
    /INVITATION_NOT_FOUND/
  );

  // 3. Email mismatch fails
  assert.throws(
    () =>
      validateInviteAcceptance({
        submittedToken: token,
        callerEmail: 'attacker@other.com',
        doc: inviteDoc,
      }),
    /INVITATION_EMAIL_MISMATCH/
  );

  // 4. Expired token fails
  const expiredDoc = { ...inviteDoc, expiresAtMillis: Date.now() - 1000 };
  assert.throws(
    () =>
      validateInviteAcceptance({
        submittedToken: token,
        callerEmail: 'admin.candidate@rankcrackers.com',
        doc: expiredDoc,
      }),
    /INVITATION_EXPIRED/
  );

  // 5. Already redeemed token fails (replay attack prevented)
  const redeemedDoc = { ...inviteDoc, redeemed: true, redeemedAt: Date.now(), redeemedByUid: 'user123' };
  assert.throws(
    () =>
      validateInviteAcceptance({
        submittedToken: token,
        callerEmail: 'admin.candidate@rankcrackers.com',
        doc: redeemedDoc,
      }),
    /INVITATION_ALREADY_REDEEMED/
  );
});

test('assigned scopes in invitation are strictly bounded by canonical whitelist', () => {
  assert.deepEqual(
    normalizeScopes(['DOCUMENTS_VIEW', 'PYQ_REVIEW']),
    ['DOCUMENTS_VIEW', 'PYQ_REVIEW']
  );
  assert.throws(
    () => normalizeScopes(['SUPER_USER']),
    /ACCESS_SCOPE_UNAUTHORIZED/
  );
});

test('resumable invitation state machine handles concurrency locks and claim retries', () => {
  const token = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const targetEmail = 'admin@rankcrackers.com';
  const callerUid = 'user_admin_1';

  const doc = {
    inviteHash: tokenHash,
    targetEmail,
    role: 'admin',
    scopes: ['DOCUMENTS_VIEW'],
    expiresAtMillis: Date.now() + 3600000,
    status: 'ISSUED',
    redeemed: false,
    claimedByUid: null,
  };

  function simulateClaimStep1({ submittedToken, callerEmail, callerUid, emailVerified, inviteDoc }) {
    if (!emailVerified) {
      throw new Error('CALLER_EMAIL_UNVERIFIED');
    }
    const hash = crypto.createHash('sha256').update(submittedToken.trim()).digest('hex');
    if (hash !== inviteDoc.inviteHash) {
      throw new Error('INVITATION_NOT_FOUND');
    }
    if (inviteDoc.status === 'ACCEPTED' || inviteDoc.redeemed) {
      throw new Error('INVITATION_ALREADY_REDEEMED');
    }
    if (Date.now() > inviteDoc.expiresAtMillis) {
      throw new Error('INVITATION_EXPIRED');
    }
    if (callerEmail.toLowerCase().trim() !== inviteDoc.targetEmail.toLowerCase().trim()) {
      throw new Error('INVITATION_EMAIL_MISMATCH');
    }
    if (inviteDoc.status === 'CLAIMS_PENDING' && inviteDoc.claimedByUid && inviteDoc.claimedByUid !== callerUid) {
      throw new Error('INVITATION_CLAIMED_BY_ANOTHER_USER');
    }

    return {
      ...inviteDoc,
      status: 'CLAIMS_PENDING',
      claimedByUid: callerUid,
    };
  }

  // 1. Unverified email is rejected
  assert.throws(
    () => simulateClaimStep1({
      submittedToken: token,
      callerEmail: targetEmail,
      callerUid,
      emailVerified: false,
      inviteDoc: doc,
    }),
    /CALLER_EMAIL_UNVERIFIED/
  );

  // 2. Normal Step 1 locks token to CLAIMS_PENDING
  const lockedDoc = simulateClaimStep1({
    submittedToken: token,
    callerEmail: targetEmail,
    callerUid,
    emailVerified: true,
    inviteDoc: doc,
  });
  assert.equal(lockedDoc.status, 'CLAIMS_PENDING');
  assert.equal(lockedDoc.claimedByUid, callerUid);

  // 3. Foreign user attempting concurrent redemption is locked out
  assert.throws(
    () => simulateClaimStep1({
      submittedToken: token,
      callerEmail: targetEmail,
      callerUid: 'foreign_attacker',
      emailVerified: true,
      inviteDoc: lockedDoc,
    }),
    /INVITATION_CLAIMED_BY_ANOTHER_USER/
  );

  // 4. Same user resuming after a transient claim network failure succeeds
  const resumedDoc = simulateClaimStep1({
    submittedToken: token,
    callerEmail: targetEmail,
    callerUid,
    emailVerified: true,
    inviteDoc: lockedDoc,
  });
  assert.equal(resumedDoc.status, 'CLAIMS_PENDING');
  assert.equal(resumedDoc.claimedByUid, callerUid);

  // 5. Final Step 3 transitions to ACCEPTED
  function simulateClaimStep3({ inviteDoc }) {
    return {
      ...inviteDoc,
      status: 'ACCEPTED',
      redeemed: true,
    };
  }
  const acceptedDoc = simulateClaimStep3({ inviteDoc: resumedDoc });
  assert.equal(acceptedDoc.status, 'ACCEPTED');
  assert.equal(acceptedDoc.redeemed, true);

  // 6. Once ACCEPTED, further attempts are blocked
  assert.throws(
    () => simulateClaimStep1({
      submittedToken: token,
      callerEmail: targetEmail,
      callerUid,
      emailVerified: true,
      inviteDoc: acceptedDoc,
    }),
    /INVITATION_ALREADY_REDEEMED/
  );
});

test('custom claims merger preserves existing trusted claims without spreading token headers', () => {
  const existingCustomClaims = {
    institution: 'Delhi Central',
    batch2026: true,
  };

  const inviteScopes = ['DOCUMENTS_VIEW', 'SYLLABUS_REVIEW'];

  const mergedClaims = {
    ...existingCustomClaims,
    admin: true,
    accessLevel: 5,
    scopes: inviteScopes,
  };

  assert.equal(mergedClaims.institution, 'Delhi Central');
  assert.equal(mergedClaims.batch2026, true);
  assert.equal(mergedClaims.admin, true);
  assert.equal(mergedClaims.accessLevel, 5);
  assert.deepEqual(mergedClaims.scopes, ['DOCUMENTS_VIEW', 'SYLLABUS_REVIEW']);
  assert.equal('aud' in mergedClaims, false);
  assert.equal('iss' in mergedClaims, false);
  assert.equal('sub' in mergedClaims, false);
});



test('production invitation callable rejects unsupported states before assigning claims', async () => {
  const Module = require('node:module');
  const originalLoad = Module._load;
  const token = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const writes = [];
  const inviteRef = { update: async (value) => writes.push(value) };
  const db = {
    collection: (name) => ({ doc: (id) => name === 'admin_invitations' && id === hash ? inviteRef : {} }),
    runTransaction: async (callback) => callback({
      get: async () => ({ exists: true, data: () => ({
        status: 'REVOKED', redeemed: false, targetEmail: 'candidate@example.com',
        expiresAt: { toMillis: () => Date.now() + 60000 }, claimedByUid: null,
      }) }),
      update: (_ref, value) => writes.push(value),
      set: () => {},
    }),
  };
  let claimsAssigned = false;
  const fakeAdmin = {
    firestore: Object.assign(() => db, { FieldValue: { serverTimestamp: () => 'NOW' } }),
    auth: () => ({
      getUser: async () => ({ customClaims: {} }),
      setCustomUserClaims: async () => { claimsAssigned = true; },
    }),
  };
  const fakeFunctions = {
    https: {
      onCall: (handler) => handler,
      HttpsError: class HttpsError extends Error {
        constructor(code, message) { super(message); this.code = code; }
      },
    },
  };
  Module._load = function(request, parent, isMain) {
    if (request === 'firebase-functions') return fakeFunctions;
    if (request === 'firebase-admin') return fakeAdmin;
    if (request === '../utils/sovereign_logic' && parent.filename.endsWith('/admin_invitations.js')) {
      return { ensureFounderClaims: async () => {} };
    }
    if (request === '../services/audit_service' && parent.filename.endsWith('/admin_invitations.js')) {
      return { logFounderActivity: async () => {} };
    }
    if (request === '../services/admin_scope_authority' && parent.filename.endsWith('/admin_invitations.js')) {
      return { CANONICAL_ADMIN_SCOPES: [], normalizeScopes: (scopes) => scopes };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    const callablePath = require.resolve('../callable/admin_invitations');
    delete require.cache[callablePath];
    const { acceptAdminInvite } = require(callablePath);
    await assert.rejects(
      acceptAdminInvite({ token }, { auth: {
        uid: 'candidate', token: { email: 'candidate@example.com', email_verified: true },
      } }),
      (error) => error.code === 'failed-precondition' && /INVITATION_STATE_INVALID/.test(error.message)
    );
    assert.equal(claimsAssigned, false);
  } finally {
    Module._load = originalLoad;
  }
});
