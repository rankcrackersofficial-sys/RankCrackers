'use strict';

function assertAccessMutationRequest({ auth, targetUid, role, action }) {
  if (auth?.token?.founder !== true) {
    throw new Error('ACCESS_FOUNDER_ONLY_MUTATION');
  }
  if (typeof targetUid !== 'string' || !targetUid.trim() ||
      targetUid.includes('/') || targetUid.length > 128) {
    throw new Error('ACCESS_TARGET_UID_INVALID');
  }
  if (!['founder','admin'].includes(role) || !['grant','revoke'].includes(action)) {
    throw new Error('ACCESS_ROLE_OR_ACTION_INVALID');
  }
  if (action === 'revoke' && role === 'founder' && targetUid === auth.uid) {
    throw new Error('ACCESS_FOUNDER_SELF_REVOCATION_FORBIDDEN');
  }
  return true;
}

function assertTargetClaimTransition({ targetClaims, role, action }) {
  const claims=targetClaims || {};
  if (role === 'admin' && claims.founder === true) {
    // Granting admin would silently lower a Founder accessLevel;
    // revoking admin would silently delete that Founder's authority.
    throw new Error('ACCESS_FOUNDER_CLAIM_DOWNGRADE_FORBIDDEN');
  }
  if (action === 'revoke') {
    if (role === 'founder' && claims.founder !== true) {
      throw new Error('ACCESS_TARGET_FOUNDER_CLAIM_MISSING');
    }
    if (role === 'admin' && claims.admin !== true) {
      throw new Error('ACCESS_TARGET_ADMIN_CLAIM_MISSING');
    }
  }
  return true;
}

module.exports = { assertAccessMutationRequest, assertTargetClaimTransition };
