'use strict';

/**
 * 🔱 CANONICAL ADMIN SCOPE AUTHORITY (v1.0.0)
 * Whitelist of explicit Admin permission scopes for RankCrackers Admin Console.
 */
const CANONICAL_ADMIN_SCOPES = Object.freeze([
  'DOCUMENTS_VIEW',
  'DOCUMENTS_UPLOAD',
  'SYLLABUS_REVIEW',
  'PYQ_REVIEW',
  'MISSION_CREATE',
  'STUDY_MASTER',
]);

const SCOPE_ALIASES = Object.freeze({
  'document.view': 'DOCUMENTS_VIEW',
  'DOCUMENTS_VIEW': 'DOCUMENTS_VIEW',
  'document.upload': 'DOCUMENTS_UPLOAD',
  'DOCUMENTS_UPLOAD': 'DOCUMENTS_UPLOAD',
  'syllabus.review': 'SYLLABUS_REVIEW',
  'SYLLABUS_REVIEW': 'SYLLABUS_REVIEW',
  'pyq.review': 'PYQ_REVIEW',
  'PYQ_REVIEW': 'PYQ_REVIEW',
  'mission.view': 'MISSION_CREATE',
  'mission.create': 'MISSION_CREATE',
  'MISSION_CREATE': 'MISSION_CREATE',
  'study_master.view': 'STUDY_MASTER',
  'STUDY_MASTER': 'STUDY_MASTER',
});

/**
 * Normalize and validate an array of scopes against the canonical whitelist.
 * Throws if any unrecognized scope is encountered.
 */
function normalizeScopes(scopes) {
  if (!Array.isArray(scopes)) {
    throw new Error('ACCESS_SCOPES_MUST_BE_ARRAY');
  }
  const normalized = new Set();
  for (const raw of scopes) {
    if (typeof raw !== 'string' || !raw.trim()) {
      throw new Error('ACCESS_SCOPE_INVALID');
    }
    const trimmed = raw.trim();
    const canonical = SCOPE_ALIASES[trimmed];
    if (!canonical || !CANONICAL_ADMIN_SCOPES.includes(canonical)) {
      throw new Error(`ACCESS_SCOPE_UNAUTHORIZED: ${trimmed}`);
    }
    normalized.add(canonical);
  }
  return Array.from(normalized).sort();
}

/**
 * Check if the caller auth token satisfies the required scope.
 * Founders always satisfy all scopes.
 */
function hasScope(token, requiredScope) {
  if (!token) return false;
  if (token.founder === true) return true;
  if (token.admin !== true) return false;

  const canonicalTarget = SCOPE_ALIASES[requiredScope] || requiredScope;
  if (!CANONICAL_ADMIN_SCOPES.includes(canonicalTarget)) return false;

  const grantedScopes = Array.isArray(token.scopes) ? token.scopes : [];
  for (const g of grantedScopes) {
    if ((SCOPE_ALIASES[g] || g) === canonicalTarget) {
      return true;
    }
  }
  return false;
}

/**
 * Server callable guard: asserts that caller token possesses the required scope.
 */
function assertAdminScope(auth, requiredScope) {
  if (!auth) {
    throw new Error('ACCESS_UNAUTHENTICATED');
  }
  if (!hasScope(auth.token, requiredScope)) {
    throw new Error(`ACCESS_DENIED_MISSING_SCOPE: ${requiredScope}`);
  }
  return true;
}

module.exports = {
  CANONICAL_ADMIN_SCOPES,
  SCOPE_ALIASES,
  normalizeScopes,
  hasScope,
  assertAdminScope,
};
