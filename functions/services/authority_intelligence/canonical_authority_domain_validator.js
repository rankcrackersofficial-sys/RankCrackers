/**
 * CANONICAL AUTHORITY DOMAIN VALIDATOR & RESOLUTION ADAPTER (C1 Convergence)
 * Bridges Agent #1 B3/B5 mission-source security with Agent #2 Canonical Authority Registry.
 *
 * Laws (Master Spec §2.2, §6, §13-§17; C1 Convergence Law):
 *   - Explicit canonical authorityKey transport (zero fuzzy / token / exam inference)
 *   - Strict hostname boundary safety (exact domain or registered subdomain only; no suffix spoofing)
 *   - Full secondary approved-domain support from canonical registry data
 *   - Cross-authority reuse rejection (fail-closed)
 *   - Geographic / jurisdiction level and stateCode consistency
 *   - Zero hard-coded authority/domain lists (pure registry data consumption)
 */

'use strict';

const { canonicalAuthorityRegistry } = require('./index');

/**
 * Deterministically resolves a canonical authorityKey (e.g. 'auth_in_ssc').
 * Strict law: ONLY an exact registered authorityKey is accepted.
 * Fuzzy matching, token splitting, shortName guessing, and substring matching are strictly forbidden.
 *
 * Returns the canonical authorityKey string or null if unresolvable.
 */
function resolveCanonicalAuthorityKey(input) {
  if (!input || typeof input !== 'string') return null;
  const token = input.trim();
  const auth = canonicalAuthorityRegistry.getByKey(token, false);
  if (auth) {
    return auth.authorityKey;
  }
  return null;
}

/**
 * Validates that a source domain/URL belongs to the resolved canonical authority.
 * Purely delegates to canonicalAuthorityRegistry.isDomainApprovedForAuthority.
 *
 * @param {string} authorityKey - Canonical authority key (e.g. 'auth_in_ssc')
 * @param {string} domainOrUrl - Full URL or bare hostname
 * @returns {{ bound: boolean, authorityKey?: string, jurisdiction?: string, stateCode?: string|null, hostname?: string, reason?: string }}
 */
function validateAuthorityDomain(authorityKey, domainOrUrl) {
  if (!authorityKey || typeof authorityKey !== 'string' || authorityKey.trim() === '') {
    return { bound: false, reason: 'AUTHORITY_KEY_MISSING' };
  }
  if (!domainOrUrl || typeof domainOrUrl !== 'string' || domainOrUrl.trim() === '') {
    return { bound: false, reason: 'DOMAIN_MISSING' };
  }
  const cleanKey = authorityKey.trim();
  const auth = canonicalAuthorityRegistry.getByKey(cleanKey, false);
  if (!auth) {
    return { bound: false, reason: `AUTHORITY_NOT_FOUND: authorityKey '${cleanKey}' is not registered in canonical registry.` };
  }

  let host = domainOrUrl.trim();
  try {
    if (host.startsWith('http://') || host.startsWith('https://')) {
      host = new URL(host).hostname;
    }
  } catch {
    // treat as raw string
  }
  host = host.toLowerCase().trim();

  const isApproved = canonicalAuthorityRegistry.isDomainApprovedForAuthority(host, cleanKey);
  if (!isApproved) {
    return {
      bound: false,
      reason: `OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND: hostname '${host}' is not approved for authority '${cleanKey}' (allowed: ${auth.allowedOfficialDomains.join(', ')}).`,
    };
  }

  return {
    bound: true,
    authorityKey: auth.authorityKey,
    jurisdiction: auth.jurisdiction,
    stateCode: auth.stateCode,
    hostname: host,
  };
}

/**
 * Validates that mission payload jurisdictionLevel and stateCode are consistent
 * with the canonical authority registry. Fails closed on any contradiction.
 */
function assertAuthorityJurisdictionConsistency({ authorityKey, jurisdictionLevel, stateCode }) {
  if (!authorityKey || typeof authorityKey !== 'string' || authorityKey.trim() === '') return;
  const cleanKey = authorityKey.trim();
  const auth = canonicalAuthorityRegistry.getByKey(cleanKey, false);
  if (!auth) {
    throw new Error(`AUTHORITY_NOT_FOUND: authorityKey '${cleanKey}' is not registered in canonical registry.`);
  }

  // Check jurisdictionLevel consistency
  if (jurisdictionLevel) {
    const jurUpper = String(jurisdictionLevel).trim().toUpperCase();
    if (jurUpper !== auth.jurisdiction) {
      throw new Error(`JURISDICTION_AUTHORITY_MISMATCH: payload jurisdictionLevel '${jurUpper}' does not match authority '${cleanKey}' jurisdiction '${auth.jurisdiction}'.`);
    }
  }

  // Check stateCode consistency
  if (auth.jurisdiction === 'CENTRAL') {
    if (stateCode !== null && stateCode !== undefined && String(stateCode).trim() !== '') {
      throw new Error(`JURISDICTION_STATE_MISMATCH: central authority '${cleanKey}' requires stateCode to be null, received '${stateCode}'.`);
    }
  } else {
    if (!stateCode || String(stateCode).trim() === '') {
      throw new Error(`JURISDICTION_STATE_MISMATCH: ${auth.jurisdiction} authority '${cleanKey}' requires stateCode '${auth.stateCode}', received empty/null.`);
    }
    const scUpper = String(stateCode).trim().toUpperCase();
    if (scUpper !== String(auth.stateCode).toUpperCase()) {
      throw new Error(`JURISDICTION_STATE_MISMATCH: payload stateCode '${scUpper}' does not match authority '${cleanKey}' stateCode '${auth.stateCode}'.`);
    }
  }
}

module.exports = {
  assertAuthorityJurisdictionConsistency,
  resolveCanonicalAuthorityKey,
  validateAuthorityDomain,
};
