/**
 * AUTHORITATIVE CANONICAL MISSION IDENTITY REGISTRY & RESOLVER (B1-R3 FINAL PAIR INTEGRITY)
 * Shared domain logic for RankCrackers permanent mission identity management.
 *
 * Enforces:
 *   - Authority-first resolution: canonical authority MUST be resolved before any legacy parent or generic ID return
 *   - PAIR GOVERNANCE: a canonical exam declares its allowed canonical authority keys (DATA);
 *     an individually valid authority + individually valid exam is NOT sufficient — the PAIR
 *     must be governed or resolution fails closed. Zero mission-specific control flow.
 *   - Legacy parent binding: (authorityKey + normalized exam alias) -> immutable legacy ID,
 *     with its own initialization integrity validator (pair uniqueness + structural laws)
 *   - Trailing-year decoration stripping ONLY: a standalone cycle year at the END of a title
 *     is decoration; a year embedded elsewhere in an official title is identity-relevant text
 *   - Strict canonical token grammar in builder: ^[a-z0-9]+(?:_[a-z0-9]+)*$ (zero silent normalization)
 *   - Deep-frozen immutable registries; KNOWN_PILOT_IDS exposed as a truly read-only view
 *   - Fail-closed behavior on unresolved, ambiguous, pair-mismatched, or invalid identity inputs
 */

'use strict';

/**
 * Recursively deep-freezes an object and all nested properties/arrays.
 */
function deepFreeze(obj) {
  if (obj && typeof obj === 'object') {
    Object.freeze(obj);
    Object.getOwnPropertyNames(obj).forEach(prop => {
      const val = obj[prop];
      if (val !== null && (typeof val === 'object' || typeof val === 'function') && !Object.isFrozen(val)) {
        deepFreeze(val);
      }
    });
  }
  return obj;
}

const STRICT_CANONICAL_TOKEN_REGEX = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

// 1. Data-driven legacy parent bindings (Pair: authorityKey + normalized examAliases -> legacyId)
const LEGACY_PARENT_BINDINGS = deepFreeze([
  {
    legacyId: 'jee_main_2026',
    authorityKey: 'nta',
    examAliases: [
      'jee main',
      'jee (main)',
      'jee_main',
      'joint entrance examination main'
    ]
  },
  {
    legacyId: 'neet_(ug)-2027',
    authorityKey: 'nta',
    examAliases: [
      'neet',
      'neet ug',
      'neet (ug)',
      'neet_ug',
      'national eligibility cum entrance test'
    ]
  },
  {
    legacyId: 'RPSC_FIRST_GRADE2026_2026_1782713222215',
    authorityKey: 'rpsc',
    examAliases: [
      'rpsc 1st grade',
      'rpsc first grade',
      'rpsc 1st grade exam',
      'rpsc first grade exam'
    ]
  }
]);

// 2. Governed Authority Aliases Registry
const GOVERNED_AUTHORITY_ALIASES = deepFreeze({
  'nta': ['nta', 'national testing agency', 'national testing agency (nta)'],
  'upsc': ['upsc', 'union public service commission', 'union public service commission (upsc)'],
  'rpsc': ['rpsc', 'rajasthan public service commission', 'rajasthan public service commission (rpsc)'],
  'ssc': ['ssc', 'staff selection commission', 'staff selection commission (ssc)'],
  'auth_in_indian_air_force': ['indian air force', 'auth_in_indian_air_force', 'iaf', 'air force']
});

// 3. Governed Exam Aliases Registry
const GOVERNED_EXAM_ALIASES = deepFreeze({
  'jee_main': ['jee main', 'jee (main)', 'jee_main', 'joint entrance examination main'],
  'neet_ug': ['neet', 'neet ug', 'neet (ug)', 'neet_ug', 'national eligibility cum entrance test'],
  'upsc_cse_prelims': ['upsc cse', 'upsc cse prelims', 'upsc civil services prelims', 'upsc_cse_prelims'],
  'ssc_cgl': ['ssc cgl', 'ssc_cgl', 'staff selection commission cgl'],
  'rpsc_ras_prelims': ['rpsc ras', 'rpsc ras prelims', 'rpsc_ras_prelims'],
  'air_force_common_admission_test': ['air force common admission test', 'afcat', 'air_force_common_admission_test']
});

// 4. DATA-driven governed authority/exam PAIR compatibility contract.
//    Every canonical exam declares the canonical authority keys it may be governed under.
//    A resolved (authority, exam) pair absent from this contract FAILS CLOSED.
const GOVERNED_EXAM_AUTHORITY_COMPATIBILITY = deepFreeze({
  'jee_main': ['nta'],
  'neet_ug': ['nta'],
  'upsc_cse_prelims': ['upsc'],
  'ssc_cgl': ['ssc'],
  'rpsc_ras_prelims': ['rpsc'],
  'air_force_common_admission_test': ['auth_in_indian_air_force']
});

/**
 * Read-only compatibility view over an internal Set.
 *
 * LAW: Object.freeze(new Set(...)) does NOT protect Set contents (add/delete/clear
 * remain reachable). This view exposes ONLY read operations actually required by
 * repository callers (.has + safe iteration/size) and never exposes the internal
 * Set, so the exported surface has NO mutation capability by construction.
 */
function createReadOnlySetView(sourceSet) {
  const view = {
    has(value) {
      return sourceSet.has(value);
    },
    get size() {
      return sourceSet.size;
    },
    values() {
      return sourceSet.values();
    },
    keys() {
      return sourceSet.keys();
    },
    entries() {
      return sourceSet.entries();
    },
    forEach(callback, thisArg) {
      sourceSet.forEach(callback, thisArg);
    },
    [Symbol.iterator]() {
      return sourceSet.values();
    }
  };
  return Object.freeze(view);
}

const KNOWN_PILOT_IDS = createReadOnlySetView(new Set(LEGACY_PARENT_BINDINGS.map(b => b.legacyId)));

/**
 * Normalizes a raw string into a clean lowercase snake_case canonical token.
 */
function normalizeCanonicalToken(input) {
  if (input === undefined || input === null) return '';
  const str = String(input).trim().toLowerCase();
  const normalized = str
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  return normalized;
}

/**
 * Strips ONLY a trailing standalone 4-digit cycle year (1900-2099) from a title.
 *
 * LAW: year decoration is TRAILING cycle metadata. A standalone year embedded
 * anywhere other than the end of the title is part of the official title and
 * MUST be retained (it is identity-relevant text, governed review decides).
 *   'JEE Main 2035'                        -> 'jee main'
 *   'Act 2005 Recruitment Examination'     -> 'act 2005 recruitment examination' (retained)
 *   'Scheme 2020 Officer Test Phase I'     -> 'scheme 2020 officer test phase i' (retained)
 */
function stripYearDecoration(input) {
  if (input === undefined || input === null) return '';
  const str = String(input).trim().toLowerCase();
  const stripped = str
    .replace(/\s+(19\d\d|20\d\d)\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return stripped;
}

/**
 * Asserts that an alias registry contains no overlapping/ambiguous normalized aliases.
 * (Used for BOTH the authority registry and the generic exam registry.)
 */
function assertRegistryIntegrity(registry, registryName) {
  const seenAliases = new Map();
  for (const [key, aliases] of Object.entries(registry)) {
    for (const rawAlias of aliases) {
      const norm = normalizeCanonicalToken(rawAlias);
      if (norm === '') {
        throw new Error(`${registryName} INTEGRITY_FAILURE: Empty normalized alias under key '${key}'.`);
      }
      if (seenAliases.has(norm) && seenAliases.get(norm) !== key) {
        throw new Error(`REGISTRY_INTEGRITY_FAILURE: Duplicate alias '${norm}' mapped to multiple keys ('${seenAliases.get(norm)}', '${key}') in ${registryName}.`);
      }
      seenAliases.set(norm, key);
    }
  }
}

/**
 * Asserts the integrity of the DATA-driven authority/exam pair compatibility contract:
 *   - every governed exam key MUST declare a non-empty allowed-authority array;
 *   - every declared authority key MUST itself be a governed authority key.
 * Run at module initialization; the pair contract is therefore TOTAL (no silent gaps).
 */
function assertExamAuthorityCompatibilityIntegrity(compatibility, examRegistry, authorityRegistry) {
  const examKeys = Object.keys(examRegistry);
  const authorityKeys = new Set(Object.keys(authorityRegistry));

  for (const examKey of examKeys) {
    const allowed = compatibility[examKey];
    if (!Array.isArray(allowed) || allowed.length === 0) {
      throw new Error(`EXAM_AUTHORITY_COMPATIBILITY_FAILURE: Governed exam '${examKey}' declares no allowed canonical authority keys.`);
    }
    for (const authorityKey of allowed) {
      if (!authorityKeys.has(authorityKey)) {
        throw new Error(`EXAM_AUTHORITY_COMPATIBILITY_FAILURE: Exam '${examKey}' declares unknown authority key '${authorityKey}'.`);
      }
    }
  }

  for (const compatKey of Object.keys(compatibility)) {
    if (!examRegistry[compatKey]) {
      throw new Error(`EXAM_AUTHORITY_COMPATIBILITY_FAILURE: Compatibility declared for non-governed exam key '${compatKey}'.`);
    }
  }
}

/**
 * Asserts the integrity of the legacy parent bindings:
 *   - legacyId non-empty string;
 *   - authorityKey strict canonical token grammar;
 *   - examAliases non-empty array with non-empty normalized aliases;
 *   - no two DIFFERENT legacy IDs claim the same (authorityKey + normalized exam alias) pair.
 * Run at module initialization. The SAME production validator is used by the identity
 * test suite against deliberately ambiguous temporary binding data.
 */
function assertLegacyParentBindingsIntegrity(bindings) {
  if (!Array.isArray(bindings) || bindings.length === 0) {
    throw new Error('LEGACY_BINDING_INTEGRITY_FAILURE: Legacy parent bindings must be a non-empty array.');
  }

  const seenPairs = new Map();
  for (const binding of bindings) {
    if (!binding || typeof binding !== 'object') {
      throw new Error('LEGACY_BINDING_INTEGRITY_FAILURE: Each legacy binding must be an object.');
    }
    if (typeof binding.legacyId !== 'string' || binding.legacyId.trim() === '') {
      throw new Error('LEGACY_BINDING_INTEGRITY_FAILURE: legacyId must be a non-empty string.');
    }
    if (typeof binding.authorityKey !== 'string' || !STRICT_CANONICAL_TOKEN_REGEX.test(binding.authorityKey)) {
      throw new Error(`LEGACY_BINDING_INTEGRITY_FAILURE: authorityKey '${binding.authorityKey}' violates strict canonical token grammar for legacy '${binding.legacyId}'.`);
    }
    if (!Array.isArray(binding.examAliases) || binding.examAliases.length === 0) {
      throw new Error(`LEGACY_BINDING_INTEGRITY_FAILURE: Legacy '${binding.legacyId}' declares no exam aliases.`);
    }

    for (const rawAlias of binding.examAliases) {
      const norm = normalizeCanonicalToken(rawAlias);
      if (norm === '') {
        throw new Error(`LEGACY_BINDING_INTEGRITY_FAILURE: Legacy '${binding.legacyId}' contains an alias that normalizes to empty ('${rawAlias}').`);
      }
      const pairKey = `${binding.authorityKey}::${norm}`;
      const priorOwner = seenPairs.get(pairKey);
      if (priorOwner !== undefined && priorOwner !== binding.legacyId) {
        throw new Error(`LEGACY_BINDING_INTEGRITY_FAILURE: Duplicate legacy pair (authority '${binding.authorityKey}' + exam alias '${norm}') claimed by multiple legacy IDs ('${priorOwner}', '${binding.legacyId}').`);
      }
      seenPairs.set(pairKey, binding.legacyId);
    }
  }
}

// Validate ALL registry integrity classes on module load (fail closed at init).
assertRegistryIntegrity(GOVERNED_AUTHORITY_ALIASES, 'GOVERNED_AUTHORITY_ALIASES');
assertRegistryIntegrity(GOVERNED_EXAM_ALIASES, 'GOVERNED_EXAM_ALIASES');
assertExamAuthorityCompatibilityIntegrity(
  GOVERNED_EXAM_AUTHORITY_COMPATIBILITY,
  GOVERNED_EXAM_ALIASES,
  GOVERNED_AUTHORITY_ALIASES
);
assertLegacyParentBindingsIntegrity(LEGACY_PARENT_BINDINGS);

/**
 * Resolves raw input text to a governed canonicalAuthorityKey.
 * Returns { status: 'RESOLVED'|'NEW_IDENTITY_CANDIDATE', key: string }.
 */
function resolveCanonicalAuthorityKey(input) {
  if (input === undefined || input === null || String(input).trim() === '') {
    throw new Error('CANONICAL_AUTHORITY_REQUIRED: Authority input cannot be empty.');
  }

  const norm = normalizeCanonicalToken(input);

  // Exact match against governed keys
  if (GOVERNED_AUTHORITY_ALIASES[norm]) {
    return { status: 'RESOLVED', key: norm };
  }

  // Match against alias arrays
  const matches = [];
  for (const [key, aliases] of Object.entries(GOVERNED_AUTHORITY_ALIASES)) {
    for (const alias of aliases) {
      if (norm === alias || norm === normalizeCanonicalToken(alias)) {
        matches.push(key);
        break;
      }
    }
  }

  if (matches.length === 1) {
    return { status: 'RESOLVED', key: matches[0] };
  }

  if (matches.length > 1) {
    throw new Error(`AMBIGUOUS_AUTHORITY_IDENTITY: Multiple canonical authority matches found for '${input}'.`);
  }

  // 0 matches: New governed identity candidate
  return { status: 'NEW_IDENTITY_CANDIDATE', key: norm };
}

/**
 * Resolves raw input text to a governed canonicalExamKey.
 * Returns { status: 'RESOLVED'|'NEW_IDENTITY_CANDIDATE', key: string }.
 */
function resolveCanonicalExamKey(input) {
  if (input === undefined || input === null || String(input).trim() === '') {
    throw new Error('CANONICAL_EXAM_REQUIRED: Exam identity input cannot be empty.');
  }

  const norm = normalizeCanonicalToken(input);
  const normBase = normalizeCanonicalToken(stripYearDecoration(input));

  // Exact match against governed keys
  if (GOVERNED_EXAM_ALIASES[norm]) {
    return { status: 'RESOLVED', key: norm };
  }
  if (GOVERNED_EXAM_ALIASES[normBase]) {
    return { status: 'RESOLVED', key: normBase };
  }

  // Match against alias arrays
  const matches = [];
  for (const [key, aliases] of Object.entries(GOVERNED_EXAM_ALIASES)) {
    for (const alias of aliases) {
      const normAlias = normalizeCanonicalToken(alias);
      if (norm === normAlias || normBase === normAlias) {
        matches.push(key);
        break;
      }
    }
  }

  if (matches.length === 1) {
    return { status: 'RESOLVED', key: matches[0] };
  }

  if (matches.length > 1) {
    throw new Error(`AMBIGUOUS_EXAM_IDENTITY: Multiple canonical exam matches found for '${input}'.`);
  }

  // 0 matches: New governed identity candidate
  return { status: 'NEW_IDENTITY_CANDIDATE', key: normBase || norm };
}

/**
 * Strict builder for year-less, cycle-less, timestamp-independent permanent mission ID.
 * Formula: rec_<canonicalAuthorityKey>_<canonicalExamKey>
 *
 * STRICT GRAMMAR LAW: Both inputs MUST ALREADY be strictly canonical tokens matching:
 * ^[a-z0-9]+(?:_[a-z0-9]+)*$
 *
 * NO SILENT NORMALIZATION IS PERMITTED. Non-canonical tokens are STRICTLY REJECTED.
 */
function buildPermanentMissionId(authorityKey, examKey) {
  const strictTokenRegex = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

  if (!authorityKey || typeof authorityKey !== 'string' || !strictTokenRegex.test(authorityKey)) {
    throw new Error(`STRICT_BUILDER_REJECTED: Authority key '${authorityKey}' violates strict canonical token grammar ^[a-z0-9]+(?:_[a-z0-9]+)*$.`);
  }

  if (!examKey || typeof examKey !== 'string' || !strictTokenRegex.test(examKey)) {
    throw new Error(`STRICT_BUILDER_REJECTED: Exam key '${examKey}' violates strict canonical token grammar ^[a-z0-9]+(?:_[a-z0-9]+)*$.`);
  }

  const permanentId = `rec_${authorityKey}_${examKey}`;

  if (!/^rec_[a-z0-9]+(?:_[a-z0-9]+)*$/.test(permanentId)) {
    throw new Error(`INVALID_PERMANENT_MISSION_ID: Generated ID '${permanentId}' violates generic syntax.`);
  }

  return permanentId;
}

/**
 * Resolves input payload parameters to an authoritative permanent mission ID.
 *
 * FAIL-CLOSED LAWS:
 *   1. Authority MUST be resolved and validated FIRST. Wrong or unknown authority MUST fail closed.
 *   2. Legacy parent binding matches ONLY when BOTH resolved canonicalAuthorityKey AND exam match.
 *      A wrong authority NEVER yields a legacy parent and NEVER falls through to a generic
 *      duplicate of the same governed exam under the wrong authority.
 *   3. Generic creations REQUIRE governed resolution for BOTH authority and exam identity.
 *   4. PAIR GOVERNANCE: the resolved (authority, exam) pair MUST be declared in the
 *      governed compatibility contract; known-but-unrelated pairs FAIL CLOSED.
 *   5. NEW_IDENTITY_CANDIDATE MUST FAIL CLOSED with an explicit contract error.
 *   6. Zero display-text slugification fallback permitted.
 */
function resolveCanonicalMissionId(param1, organization, year, cycle = '') {
  let examName = '';
  let org = organization;

  if (param1 && typeof param1 === 'object') {
    examName = param1.examName || param1.title || param1.exam_name || '';
    org = param1.organization || param1.org || param1.authority || organization;
  } else {
    examName = String(param1 || '');
  }

  if (!examName || String(examName).trim() === '') {
    throw new Error('CANONICAL_EXAM_REQUIRED: Exam name is required for mission identity resolution.');
  }

  if (!org || String(org).trim() === '') {
    throw new Error('CANONICAL_AUTHORITY_REQUIRED: Organization/Authority is required for mission identity resolution.');
  }

  // LAW 1: AUTHORITY-FIRST RESOLUTION
  const authRes = resolveCanonicalAuthorityKey(org);
  if (authRes.status !== 'RESOLVED') {
    throw new Error(`UNRESOLVED_AUTHORITY_IDENTITY: Authority '${org}' resolved to NEW_IDENTITY_CANDIDATE ('${authRes.key}'). Governed identity resolution required.`);
  }

  const resolvedAuthKey = authRes.key;
  const normExamTitle = normalizeCanonicalToken(stripYearDecoration(examName));

  // LAW 2: LEGACY PARENT RESOLUTION (Requires BOTH resolved canonicalAuthorityKey AND exam match)
  for (const binding of LEGACY_PARENT_BINDINGS) {
    if (binding.authorityKey === resolvedAuthKey) {
      for (const alias of binding.examAliases) {
        const normAlias = normalizeCanonicalToken(alias);
        if (normExamTitle === normAlias || normalizeCanonicalToken(examName) === normAlias) {
          return binding.legacyId;
        }
      }
    }
  }

  // LAW 3: GOVERNED GENERIC EXAM RESOLUTION
  const examRes = resolveCanonicalExamKey(examName);
  if (examRes.status !== 'RESOLVED') {
    throw new Error(`UNRESOLVED_EXAM_IDENTITY: Exam '${examName}' resolved to NEW_IDENTITY_CANDIDATE ('${examRes.key}'). Governed identity resolution required.`);
  }

  // LAW 4: PAIR GOVERNANCE — individually valid components are not sufficient.
  const allowedAuthorityKeys = GOVERNED_EXAM_AUTHORITY_COMPATIBILITY[examRes.key];
  if (!Array.isArray(allowedAuthorityKeys) || !allowedAuthorityKeys.includes(resolvedAuthKey)) {
    throw new Error(`GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH: Authority '${resolvedAuthKey}' is not governed for exam '${examRes.key}'. The authority/exam pair must itself be governed before a permanent mission ID can be generated.`);
  }

  // LAW 5: STRICT PERMANENT ID BUILDER
  return buildPermanentMissionId(resolvedAuthKey, examRes.key);
}

/**
 * Validates or resolves the canonical ID depending on action type.
 * Enforces: updateFallbackIdGeneration = 0.
 */
function validateOrResolveId(action, payload = {}, existingId = '') {
  // For creation actions: resolve from parameters
  if (action === 'launch_exam_mission') {
    return resolveCanonicalMissionId(payload);
  }

  // For lifecycle/update actions: existingId (e.g. recruitmentId) is mandatory
  if (!existingId || typeof existingId !== 'string' || existingId.trim() === '') {
    throw new Error('CANONICAL_ID_REQUIRED: Lifecycle actions require an authoritative canonical ID.');
  }

  const cleanId = existingId.trim();

  // Validate character structure (allows hyphens and parens for legacy pilot IDs)
  if (!/^[a-zA-Z0-9_\-()]+$/.test(cleanId)) {
    throw new Error(`INVALID_CANONICAL_ID: Canonical ID '${cleanId}' fails alphanumeric validation.`);
  }

  // Enforce no new ID generation for update actions
  return cleanId;
}

module.exports = {
  LEGACY_PARENT_BINDINGS,
  KNOWN_PILOT_IDS,
  GOVERNED_AUTHORITY_ALIASES,
  GOVERNED_EXAM_ALIASES,
  GOVERNED_EXAM_AUTHORITY_COMPATIBILITY,
  deepFreeze,
  normalizeCanonicalToken,
  stripYearDecoration,
  assertRegistryIntegrity,
  assertExamAuthorityCompatibilityIntegrity,
  assertLegacyParentBindingsIntegrity,
  resolveCanonicalAuthorityKey,
  resolveCanonicalExamKey,
  buildPermanentMissionId,
  resolveCanonicalMissionId,
  validateOrResolveId
};
