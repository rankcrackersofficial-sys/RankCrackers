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
