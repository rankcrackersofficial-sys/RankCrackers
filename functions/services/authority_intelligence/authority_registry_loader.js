/**
 * 🔱 OFFICIAL AUTHORITY REGISTRY LOADER & RESOLVER
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 *
 * Provides validated, immutable lookup access to all registered official authorities.
 * Supports extensible data-only additions of future State/UT jurisdictions.
 */

'use strict';

const { deepFreeze, validateAuthorityEntry } = require('./registry_schema');
const { CENTRAL_AUTHORITIES } = require('./registries/central_registry');
const { RAJASTHAN_AUTHORITIES } = require('./registries/rajasthan_registry');
const { DELHI_UT_AUTHORITIES } = require('./registries/delhi_ut_registry');

/**
 * Builds and validates an aggregated registry map.
 * Ensures uniqueness of authorityKeys and schema conformance.
 */
function buildValidatedRegistry(registries = []) {
  const aggregated = {};
  const seenKeys = new Set();

  for (const reg of registries) {
    if (!reg || typeof reg !== 'object') continue;
    for (const [key, entry] of Object.entries(reg)) {
      if (seenKeys.has(key)) {
        throw new Error(`REGISTRY_INTEGRITY_ERROR: Duplicate authorityKey "${key}" detected.`);
      }
      if (entry.authorityKey !== key) {
        throw new Error(`REGISTRY_INTEGRITY_ERROR: Object key "${key}" does not match entry.authorityKey "${entry.authorityKey}".`);
      }
      validateAuthorityEntry(entry);
      seenKeys.add(key);
      aggregated[key] = entry;
    }
  }

  return deepFreeze(aggregated);
}

// Canonical pilot registry: Central + Rajasthan + Delhi UT
const CANONICAL_PILOT_REGISTRY = buildValidatedRegistry([
  CENTRAL_AUTHORITIES,
  RAJASTHAN_AUTHORITIES,
  DELHI_UT_AUTHORITIES,
]);

/**
 * Registry Resolver Class
 */
class AuthorityRegistry {
  constructor(registryMap = CANONICAL_PILOT_REGISTRY) {
    this._registry = registryMap;
  }

  /**
   * Returns all registered authorities as an array.
   */
  getAll() {
    return Object.values(this._registry);
  }

  /**
   * Returns an authority by its canonical key. Throws if not found when required.
   */
  getByKey(authorityKey, required = false) {
    const entry = this._registry[authorityKey];
    if (!entry && required) {
      throw new Error(`AUTHORITY_NOT_FOUND: Authority with key "${authorityKey}" is not registered.`);
    }
    return entry || null;
  }

  /**
   * Returns authorities filtered by jurisdiction and optional stateCode.
   */
  getByJurisdiction(jurisdiction, stateCode = null) {
    const jurUpper = String(jurisdiction || '').toUpperCase();
    const scUpper = stateCode ? String(stateCode).toUpperCase() : null;

    return Object.values(this._registry).filter(auth => {
      if (auth.jurisdiction !== jurUpper) return false;
      if (scUpper !== null && auth.stateCode !== scUpper) return false;
      return true;
    });
  }

  /**
   * Validates whether a given domain (or URL) belongs to the approved official domains for an authority.
   */
  isDomainApprovedForAuthority(domainOrUrl, authorityKey) {
    const auth = this.getByKey(authorityKey, true);
    let host = domainOrUrl;
    try {
      if (domainOrUrl.startsWith('http://') || domainOrUrl.startsWith('https://')) {
        host = new URL(domainOrUrl).hostname;
      }
    } catch {
      // Treat as raw host
    }
    host = host.toLowerCase().trim();

    return auth.allowedOfficialDomains.some(allowed => {
      const allowedClean = allowed.toLowerCase().trim();
      return host === allowedClean || host.endsWith('.' + allowedClean);
    });
  }

  /**
   * Creates a new child registry extending the current one with additional authorities.
   * Proves pure data extensibility without changing engine code.
   */
  extendWith(additionalRegistry) {
    const newAggregated = buildValidatedRegistry([
      this._registry,
      additionalRegistry,
    ]);
    return new AuthorityRegistry(newAggregated);
  }
}

// Export singleton for canonical pilot plus factory
const canonicalAuthorityRegistry = new AuthorityRegistry(CANONICAL_PILOT_REGISTRY);

module.exports = {
  CANONICAL_PILOT_REGISTRY,
  AuthorityRegistry,
  canonicalAuthorityRegistry,
  buildValidatedRegistry,
};
