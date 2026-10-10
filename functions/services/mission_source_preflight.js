/**
 * B3 — Canonical Mission Source Preflight & Domain Authority Verifier (C1-R2 Convergence)
 * =============================================================================
 * Authority-backed verification for source documents before draft-cycle binding.
 *
 * Laws (Worker/Founder Master Spec §2.2, §6, §13-§17; C1-R2 Identity Lock Law):
 *   - Expected/cycle authorityKey is CANONICAL AUTHORITY TRUTH.
 *   - Source authorityKey is corroborative evidence only; it NEVER overrides cycle authority.
 *   - If source authorityKey is present, it MUST exactly match the expected authorityKey.
 *   - Missing or contradictory authority identity strictly fails closed.
 *   - OFFICIAL DOMAIN PROOF: isOfficial === true on source record AND officialDomain
 *     validated against the canonical expected authorityKey via strict hostname matching.
 *   - ENGLISH PROOF: language === 'en' (or 'eng'/'english').
 *   - CRYPTOGRAPHIC SHA-256 PROOF: expectedSha256 MUST be a valid 64-char hex
 *     string matching actual source byte digest (actualSha256).
 *   - UNPROVEN TRUST LAW: UNPROVEN_TRUST_DISABLED = true.
 *   - PROOF INDEPENDENCE: BYTE_INTEGRITY_PROVEN, AUTHORITY_DOMAIN_BOUND,
 *     AUTHORITY_IDENTITY_MATCH, SOURCE_OFFICIAL_PROVEN, and SOURCE_ENGLISH_PROVEN
 *     are evaluated independently.
 */

'use strict';

const crypto = require('crypto');
const {
  resolveCanonicalAuthorityKey,
  validateAuthorityDomain,
} = require('./authority_intelligence/canonical_authority_domain_validator');

const DOMAIN_AUTHORITY_BINDING_READY = true;
const PRODUCTION_SOURCE_CREATE_READY = false;
const UNPROVEN_TRUST_DISABLED = true;

const REQUIRED_VERIFICATION_STATE = 'verified';
const ENGLISH_LANGUAGE_TOKENS = ['en', 'eng', 'english'];
const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/i;

const AUTHORITY_DOMAIN_BINDING_INTERFACE = {
  version: 'canonical_authority_registry_v1',
  isReady: true,
  validatorHookRequired: false,
  validateAuthorityDomain: validateAuthorityDomain,
};

/**
 * Validates that a string is a well-formed 64-character hexadecimal SHA-256 digest.
 */
function isValidSha256Hex(sha) {
  return typeof sha === 'string' && SHA256_HEX_REGEX.test(sha.trim());
}

/**
 * Computes the SHA-256 hex digest of source bytes (Buffer or string).
 * This is the canonical form of byte-level integrity proof.
 */
function verifySha256Hex(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex').toLowerCase();
}

function isEnglish(language) {
  if (typeof language !== 'string') return false;
  return ENGLISH_LANGUAGE_TOKENS.includes(language.trim().toLowerCase());
}

/**
 * Evaluates domain authority readiness against the canonical authority registry.
 */
function assessDomainAuthorityBinding({ domain, authorityKey, authorityDomainValidator } = {}) {
  if (typeof domain !== 'string' || domain.trim() === '') {
    return {
      status: 'FAIL',
      code: 'SOURCE_OFFICIAL_DOMAIN_UNPROVEN',
      domainAuthorityBound: false,
      ready: false,
      detail: 'officialDomain is missing or empty.',
    };
  }

  const resolvedKey = resolveCanonicalAuthorityKey(authorityKey);
  if (!resolvedKey) {
    return {
      status: 'FAIL',
      code: 'AUTHORITY_KEY_UNRESOLVED',
      domainAuthorityBound: false,
      ready: false,
      detail: `Cannot deterministically resolve canonical authorityKey '${authorityKey}'.`,
    };
  }

  const validator = typeof authorityDomainValidator === 'function' ? authorityDomainValidator : validateAuthorityDomain;
  const result = validator(resolvedKey, domain);

  return {
    status: result && result.bound ? 'PASS' : 'FAIL',
    code: result && result.bound ? 'DOMAIN_AUTHORITY_BOUND' : 'OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND',
    domainAuthorityBound: Boolean(result && result.bound),
    ready: true,
    authorityKey: resolvedKey,
    detail: result && result.reason ? result.reason : (result && result.bound ? 'Domain bound to canonical authority.' : 'Domain rejected by authority validator.'),
  };
}

/**
 * Preflights ONE source descriptor for binding to (missionId, cycleKey).
 *
 * source: {
 *   sourceId, sourceType,                       // existence + role
 *   verificationState,                          // 'verified' required
 *   isOfficial, officialDomain,                 // official-source proof
 *   authorityKey,                               // source-carried authority evidence (optional corroboration)
 *   language,                                   // English proof (current policy)
 *   expectedSha256,                             // trusted expected 64-hex hash
 *   actualSha256,                               // actual bytes digest
 *   ingestionProof: null,                       // unproven trust disabled
 *   boundMissionId, boundCycleKey,              // existing binding, if any
 * }
 *
 * expectation: { missionId, cycleKey, sourceType, expectedSha256?, authorityKey }
 *
 * Returns {
 *   status: 'PASS'|'FAIL',
 *   failures: [{code, detail}],
 *   byteIntegrityProven,
 *   domainAuthorityBound,
 *   sourceOfficialProven,
 *   sourceEnglishProven,
 *   authorityIdentityMatch,
 *   sourceAuthorityCorroborated,
 *   expectedAuthorityKey,
 *   sourceAuthorityKey,
 * }
 */
function preflightSourceBinding({ source, expectation, requireCanonicalAuthorityDomainBinding = true, authorityDomainValidator } = {}) {
  if (!source || typeof source !== 'object') {
    throw new Error('SOURCE_PREFLIGHT_INVALID: source descriptor is required.');
  }
  if (!expectation || typeof expectation !== 'object') {
    throw new Error('SOURCE_PREFLIGHT_INVALID: expectation descriptor is required.');
  }

  const failures = [];
  const expectedSha = expectation.expectedSha256 || source.expectedSha256 || null;

  if (!source.sourceId || typeof source.sourceId !== 'string' || source.sourceId.trim() === '') {
    failures.push({ code: 'SOURCE_MISSING', detail: 'sourceId is missing or empty.' });
  }

  // 1. SOURCE ROLE & EXPECTED ROLE VALIDATION (R5-R1 Certified Source Role & Expected Role Law)
  const CANONICAL_MISSION_SOURCE_TYPES = ['notification', 'syllabus'];

  let validSourceType = null;
  if (source.sourceType === undefined || source.sourceType === null || (typeof source.sourceType === 'string' && source.sourceType.trim() === '')) {
    failures.push({ code: 'SOURCE_ROLE_UNRESOLVED', detail: 'sourceType is missing or unresolved on source record.' });
  } else if (typeof source.sourceType !== 'string' || !CANONICAL_MISSION_SOURCE_TYPES.includes(source.sourceType.trim())) {
    failures.push({ code: 'SOURCE_ROLE_UNSUPPORTED', detail: `sourceType '${source.sourceType}' is not supported for mission creation (allowed: notification, syllabus).` });
  } else {
    validSourceType = source.sourceType.trim();
  }

  let validExpectedType = null;
  if (expectation.sourceType === undefined || expectation.sourceType === null || (typeof expectation.sourceType === 'string' && expectation.sourceType.trim() === '')) {
    failures.push({ code: 'EXPECTED_SOURCE_ROLE_UNRESOLVED', detail: 'expected sourceType is missing or unresolved on expectation descriptor.' });
  } else if (typeof expectation.sourceType !== 'string' || !CANONICAL_MISSION_SOURCE_TYPES.includes(expectation.sourceType.trim())) {
    failures.push({ code: 'EXPECTED_SOURCE_ROLE_UNSUPPORTED', detail: `expected sourceType '${expectation.sourceType}' is not supported for mission creation (allowed: notification, syllabus).` });
  } else {
    validExpectedType = expectation.sourceType.trim();
  }

  if (validSourceType && validExpectedType && validSourceType !== validExpectedType) {
    failures.push({ code: 'SOURCE_ROLE_MISMATCH', detail: `certified sourceType '${validSourceType}' does not match required role '${validExpectedType}'.` });
  }

  // 2. GOVERNANCE STATUS VALIDATION (R5 Explicit Active Governance Law)
  if (source.governanceStatus === undefined || source.governanceStatus === null || (typeof source.governanceStatus === 'string' && source.governanceStatus.trim() === '')) {
    failures.push({ code: 'SOURCE_GOVERNANCE_NOT_ACTIVE', detail: "governanceStatus is missing on source record; explicit 'ACTIVE' governance is required." });
  } else if (source.governanceStatus !== 'ACTIVE') {
    failures.push({ code: 'SOURCE_GOVERNANCE_NOT_ACTIVE', detail: `governanceStatus '${source.governanceStatus}' is not 'ACTIVE'.` });
  }

  // 3. VERIFICATION STATE VALIDATION
  if (source.verificationState !== REQUIRED_VERIFICATION_STATE) {
    failures.push({ code: 'SOURCE_NOT_VERIFIED', detail: `verificationState '${source.verificationState}' is not '${REQUIRED_VERIFICATION_STATE}'.` });
  }
  if (source.isOfficial !== true) {
    failures.push({ code: 'SOURCE_NOT_OFFICIAL', detail: 'official-source proof (isOfficial) is missing or false.' });
  }

  // 1. RESOLVE EXPECTED/CYCLE AUTHORITY (CANONICAL TRUTH)
  let domainAuthorityBound = false;
  let authorityIdentityMatch = false;
  let sourceAuthorityCorroborated = false;

  const expectedAuthorityKey = resolveCanonicalAuthorityKey(expectation.authorityKey);

  if (requireCanonicalAuthorityDomainBinding) {
    if (!expectedAuthorityKey) {
      failures.push({
        code: 'AUTHORITY_KEY_UNRESOLVED',
        detail: `canonical expected authorityKey is missing or not registered in canonical registry (got expectation.authorityKey: '${expectation.authorityKey}').`,
      });
    }
  }

  // 2. EVALUATE SOURCE-CARRIED AUTHORITY EVIDENCE (CORROBORATION / EQUALITY)
  let sourceAuthorityKey = null;
  if (source.authorityKey !== undefined && source.authorityKey !== null && String(source.authorityKey).trim() !== '') {
    sourceAuthorityKey = resolveCanonicalAuthorityKey(source.authorityKey);
    if (!sourceAuthorityKey || (expectedAuthorityKey && sourceAuthorityKey !== expectedAuthorityKey)) {
      failures.push({
        code: 'SOURCE_AUTHORITY_KEY_MISMATCH',
        detail: `source authorityKey '${source.authorityKey}' contradicts expected cycle authorityKey '${expectedAuthorityKey}'.`,
      });
    } else if (expectedAuthorityKey && sourceAuthorityKey === expectedAuthorityKey) {
      authorityIdentityMatch = true;
      sourceAuthorityCorroborated = true;
    }
  } else {
    // STEP 4: Source authorityKey is absent.
    // Governed law: Source key absence does not redefine cycle authority.
    // If expected authorityKey is explicit and registered, officialDomain is validated against expectedAuthorityKey.
    sourceAuthorityCorroborated = false;
    authorityIdentityMatch = true; // no contradiction
  }

  // 3. OFFICIAL DOMAIN VALIDATION (STRICTLY AGAINST EXPECTED AUTHORITY KEY)
  if (typeof source.officialDomain !== 'string' || source.officialDomain.trim() === '') {
    failures.push({ code: 'SOURCE_OFFICIAL_DOMAIN_UNPROVEN', detail: 'officialDomain proof is required for official-source authority.' });
  } else if (requireCanonicalAuthorityDomainBinding && expectedAuthorityKey) {
    const hasAuthorityMismatch = failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH');
    if (!hasAuthorityMismatch) {
      const validator = typeof authorityDomainValidator === 'function' ? authorityDomainValidator : validateAuthorityDomain;
      const authResult = validator(expectedAuthorityKey, source.officialDomain);
      if (!authResult || !authResult.bound) {
        failures.push({
          code: 'OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND',
          detail: (authResult && authResult.reason) || `officialDomain '${source.officialDomain}' is not approved for authority '${expectedAuthorityKey}'.`,
        });
      } else {
        domainAuthorityBound = true;
      }
    }
  }

  // 4. LANGUAGE EVIDENCE
  if (!isEnglish(source.language)) {
    failures.push({ code: 'SOURCE_NOT_ENGLISH', detail: `language '${source.language}' is not English (current Founder policy: official English notifications only).` });
  }

  // 5. CRYPTOGRAPHIC SHA-256 BINDING LAW:
  let proofFound = false;
  if (!expectedSha || typeof expectedSha !== 'string' || expectedSha.trim() === '') {
    failures.push({ code: 'HASH_PROOF_MISSING', detail: 'no expected/trusted hash is recorded for this source.' });
  } else if (!isValidSha256Hex(expectedSha)) {
    failures.push({ code: 'HASH_FORMAT_INVALID', detail: `expectedSha256 '${expectedSha}' is not a valid 64-character hex SHA-256 digest.` });
  } else {
    const normExpected = expectedSha.trim().toLowerCase();

    if (source.actualSha256 !== undefined && source.actualSha256 !== null) {
      if (!isValidSha256Hex(source.actualSha256)) {
        failures.push({ code: 'HASH_FORMAT_INVALID', detail: `actualSha256 '${source.actualSha256}' is not a valid 64-character hex SHA-256 digest.` });
      } else if (source.actualSha256.trim().toLowerCase() !== normExpected) {
        failures.push({ code: 'HASH_MISMATCH', detail: `actual source bytes sha256 '${source.actualSha256}' does not equal expected trusted hash '${normExpected}'.` });
      } else {
        proofFound = true;
      }
    } else {
      failures.push({
        code: 'UNPROVEN_TRUST_REJECTED',
        detail: 'unproven ingestion proof is disabled: repository lacks an immutable official trust producer. Direct byte SHA-256 digest match (actualSha256) is required.',
      });
    }

    if (!proofFound && !failures.some(f => f.code.startsWith('HASH_') || f.code.startsWith('UNPROVEN_'))) {
      failures.push({ code: 'HASH_PROOF_MISSING', detail: 'no actual-byte digest provided: hash presence alone is not verification.' });
    }
  }

  // 6. BINDING COMPATIBILITY
  if (source.boundMissionId && source.boundMissionId !== expectation.missionId) {
    failures.push({ code: 'BINDING_INCOMPATIBLE', detail: `source is bound to another mission ('${source.boundMissionId}').` });
  }
  if (source.boundCycleKey && expectation.cycleKey && source.boundCycleKey !== expectation.cycleKey) {
    failures.push({ code: 'BINDING_INCOMPATIBLE', detail: `source is bound to another cycle ('${source.boundCycleKey}').` });
  }

  const byteIntegrityProven = Boolean(proofFound);
  const sourceOfficialProven = Boolean(source.isOfficial === true && typeof source.officialDomain === 'string' && source.officialDomain.trim().length > 0);
  const sourceEnglishProven = Boolean(isEnglish(source.language));
  const isMatch = Boolean(authorityIdentityMatch && !failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH'));

  return {
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    failures,
    byteIntegrityProven,
    domainAuthorityBound: Boolean(domainAuthorityBound),
    sourceOfficialProven,
    sourceEnglishProven,
    authorityIdentityMatch: isMatch,
    sourceAuthorityCorroborated: Boolean(sourceAuthorityCorroborated),
    expectedAuthorityKey: expectedAuthorityKey || null,
    sourceAuthorityKey: source.authorityKey || null,
    EXPECTED_AUTHORITY_KEY: expectedAuthorityKey || null,
    SOURCE_AUTHORITY_KEY: source.authorityKey || null,
    AUTHORITY_IDENTITY_MATCH: isMatch,
    SOURCE_AUTHORITY_CORROBORATED: Boolean(sourceAuthorityCorroborated),
    AUTHORITY_DOMAIN_BOUND: Boolean(domainAuthorityBound),
    BYTE_INTEGRITY_PROVEN: byteIntegrityProven,
    SOURCE_OFFICIAL_PROVEN: sourceOfficialProven,
    SOURCE_ENGLISH_PROVEN: sourceEnglishProven,
    domainAuthorityBindingReady: DOMAIN_AUTHORITY_BINDING_READY,
    resolvedAuthorityKey: expectedAuthorityKey || null,
  };
}

/**
 * Preflights a set of source bindings for one cycle. Fails closed if ANY
 * source fails. Returns an aggregated frozen report.
 */
function preflightCycleSourceBindings({ bindings, requireCanonicalAuthorityDomainBinding = true, authorityDomainValidator } = {}) {
  if (!Array.isArray(bindings) || bindings.length === 0) {
    throw new Error('SOURCE_PREFLIGHT_INVALID: at least one source binding is required.');
  }
  const reports = bindings.map(({ source, expectation }) => ({
    sourceId: source.sourceId,
    ...preflightSourceBinding({ source, expectation, requireCanonicalAuthorityDomainBinding, authorityDomainValidator }),
  }));
  const failed = reports.filter(r => r.status === 'FAIL');
  return {
    status: failed.length === 0 ? 'PASS' : 'FAIL',
    reports,
    failures: failed.flatMap(r => r.failures.map(f => ({ sourceId: r.sourceId, ...f }))),
    domainAuthorityBindingReady: DOMAIN_AUTHORITY_BINDING_READY,
  };
}

/**
 * Fail-closed assertion wrapper: throws SOURCE_PREFLIGHT_FAILED on any failure.
 * Used by creation/preflight callers that must not proceed on ANY failure.
 */
function assertCycleSourceBindingsPass({ bindings, requireCanonicalAuthorityDomainBinding = true, authorityDomainValidator } = {}) {
  const report = preflightCycleSourceBindings({ bindings, requireCanonicalAuthorityDomainBinding, authorityDomainValidator });
  if (report.status !== 'PASS') {
    const summary = report.failures.map(f => `${f.sourceId}:${f.code}`).join(', ');
    throw new Error(`SOURCE_PREFLIGHT_FAILED: official/English/integrity/authority preflight failed for [${summary}]. Creation cannot proceed.`);
  }
  return report;
}

module.exports = {
  AUTHORITY_DOMAIN_BINDING_INTERFACE,
  DOMAIN_AUTHORITY_BINDING_READY,
  ENGLISH_LANGUAGE_TOKENS,
  PRODUCTION_SOURCE_CREATE_READY,
  UNPROVEN_TRUST_DISABLED,
  assertCycleSourceBindingsPass,
  assessDomainAuthorityBinding,
  isValidSha256Hex,
  preflightCycleSourceBindings,
  preflightSourceBinding,
  resolveCanonicalAuthorityKey,
  validateAuthorityDomain,
  verifySha256Hex,
};
