'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  CANONICAL_ADMIN_SCOPES,
  normalizeScopes,
  hasScope,
  assertAdminScope,
} = require('../services/admin_scope_authority');

test('canonical scope whitelist contains expected 6 scopes', () => {
  assert.deepEqual(CANONICAL_ADMIN_SCOPES, [
    'DOCUMENTS_VIEW',
    'DOCUMENTS_UPLOAD',
    'SYLLABUS_REVIEW',
    'PYQ_REVIEW',
    'MISSION_CREATE',
    'STUDY_MASTER',
  ]);
});

test('normalizeScopes accepts canonical and alias scopes and dedups', () => {
  const result = normalizeScopes([
    'DOCUMENTS_VIEW',
    'document.view',
    'syllabus.review',
    'MISSION_CREATE',
    'mission.view',
  ]);
  assert.deepEqual(result, ['DOCUMENTS_VIEW', 'MISSION_CREATE', 'SYLLABUS_REVIEW']);
});

test('normalizeScopes throws on non-array or invalid/unauthorized scopes', () => {
  assert.throws(() => normalizeScopes('DOCUMENTS_VIEW'), /ACCESS_SCOPES_MUST_BE_ARRAY/);
  assert.throws(() => normalizeScopes(['']), /ACCESS_SCOPE_INVALID/);
  assert.throws(() => normalizeScopes(['SUPER_ADMIN']), /ACCESS_SCOPE_UNAUTHORIZED/);
  assert.throws(() => normalizeScopes(['*']), /ACCESS_SCOPE_UNAUTHORIZED/);
  assert.throws(() => normalizeScopes(['all']), /ACCESS_SCOPE_UNAUTHORIZED/);
});

test('hasScope: Founders always satisfy every scope', () => {
  const founderToken = { founder: true };
  for (const scope of CANONICAL_ADMIN_SCOPES) {
    assert.equal(hasScope(founderToken, scope), true);
  }
});

test('hasScope: Admins require explicit matching granted scope', () => {
  const adminToken = {
    admin: true,
    scopes: ['DOCUMENTS_VIEW', 'SYLLABUS_REVIEW'],
  };
  assert.equal(hasScope(adminToken, 'DOCUMENTS_VIEW'), true);
  assert.equal(hasScope(adminToken, 'document.view'), true);
  assert.equal(hasScope(adminToken, 'SYLLABUS_REVIEW'), true);
  assert.equal(hasScope(adminToken, 'syllabus.review'), true);
  assert.equal(hasScope(adminToken, 'PYQ_REVIEW'), false);
  assert.equal(hasScope(adminToken, 'MISSION_CREATE'), false);
});

test('hasScope: unprivileged users or tokens fail closed', () => {
  assert.equal(hasScope(null, 'DOCUMENTS_VIEW'), false);
  assert.equal(hasScope({}, 'DOCUMENTS_VIEW'), false);
  assert.equal(hasScope({ admin: false }, 'DOCUMENTS_VIEW'), false);
  assert.equal(hasScope({ scopes: ['DOCUMENTS_VIEW'] }, 'DOCUMENTS_VIEW'), false);
});

test('assertAdminScope throws when unauthenticated or missing scope', () => {
  assert.throws(() => assertAdminScope(null, 'DOCUMENTS_VIEW'), /ACCESS_UNAUTHENTICATED/);
  assert.throws(
    () => assertAdminScope({ token: { admin: true, scopes: [] } }, 'DOCUMENTS_VIEW'),
    /ACCESS_DENIED_MISSING_SCOPE/
  );
  assert.equal(
    assertAdminScope({ token: { founder: true } }, 'DOCUMENTS_VIEW'),
    true
  );
  assert.equal(
    assertAdminScope({ token: { admin: true, scopes: ['DOCUMENTS_VIEW'] } }, 'DOCUMENTS_VIEW'),
    true
  );
});
