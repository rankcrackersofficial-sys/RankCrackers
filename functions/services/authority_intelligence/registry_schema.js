/**
 * 🔱 OFFICIAL AUTHORITY INTELLIGENCE REGISTRY SCHEMA & CONTRACTS
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 *
 * Pure data-driven foundation for ONE expandable Official Authority Intelligence system.
 * Zero hardcoded worker branches. Zero network calls. Zero Firestore runtime writes.
 */

'use strict';

/**
 * Deep freezes an object recursively.
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

// 1. Controlled Jurisdictions
const JURISDICTIONS = deepFreeze({
  CENTRAL: 'CENTRAL',
  STATE: 'STATE',
  UT: 'UT',
});

// 2. Controlled Canonical State and UT Codes (28 States + 8 UTs)
// Parity with canonical backend contract: functions/services/generic_mission_materializer.js
const VALID_STATE_UT_CODES = deepFreeze(new Set([
  'AP', 'AR', 'AS', 'BR', 'CG', 'GA', 'GJ', 'HR', 'HP', 'JH', 'KA', 'KL',
  'MP', 'MH', 'MN', 'ML', 'MZ', 'NL', 'OD', 'PB', 'RJ', 'SK', 'TN', 'TG',
  'TR', 'UP', 'UK', 'WB',
  // Union Territories (8 Canonical UTs)
  'AN', 'CH', 'DN', 'DL', 'JK', 'LA', 'LD', 'PY'
]));

// Canonical Region Code Aliases (for ingestion normalization)
const STATE_UT_CODE_ALIASES = deepFreeze({
  'DH': 'DN', // Dadra and Nagar Haveli and Daman and Diu legacy ISO/B1 alias -> Canonical DN
  'TS': 'TG', // Telangana alternative abbreviation -> Canonical TG
});

/**
 * Normalizes any State/UT code or alias to its canonical project representation.
 * Returns canonical code string if recognized, null otherwise.
 */
function normalizeStateCode(code) {
  if (!code || typeof code !== 'string') return null;
  const upper = code.trim().toUpperCase();
  if (STATE_UT_CODE_ALIASES[upper]) {
    return STATE_UT_CODE_ALIASES[upper];
  }
  if (VALID_STATE_UT_CODES.has(upper)) {
    return upper;
  }
  return null;
}

// 3. Role Endpoint Slots
const ROLE_ENDPOINT_SLOTS = deepFreeze([
  'notifications',
  'recruitment',
  'syllabus',
  'calendar',
  'results',
  'answerKeys',
  'pyq',
  'archive',
]);

// 3B. Role Endpoint Proof Methods
const ROLE_PROOF_METHODS = deepFreeze({
  PATH_AND_TITLE_TOKENS: 'PATH_AND_TITLE_TOKENS',
  PATH_AND_PAGE_HEADING: 'PATH_AND_PAGE_HEADING',
  PATH_AND_PAGE_TOKENS: 'PATH_AND_PAGE_TOKENS',
  SAFE_NULL: 'SAFE_NULL',
});

// 4. Controlled Update Vocabulary (Exact 15 types)
const UPDATE_VOCABULARY = deepFreeze([
  'NEW_NOTIFICATION',
  'CORRIGENDUM',
  'AMENDMENT',
  'SYLLABUS',
  'EXAM_PATTERN',
  'EXAM_DATE',
  'CALENDAR',
  'ADMIT_CARD_NOTICE',
  'ANSWER_KEY',
  'FINAL_ANSWER_KEY',
  'RESULT',
  'PYQ',
  'ELIGIBILITY_CHANGE',
  'RULE_CHANGE',
  'OTHER_OFFICIAL_UPDATE',
]);

// 5. Operational Modes
const OPERATIONAL_MODES = deepFreeze({
  HISTORICAL_BACKFILL: 'HISTORICAL_BACKFILL',
  DAILY_FORWARD_WATCH: 'DAILY_FORWARD_WATCH',
});

// 6. Suitability Output Classes & Decisions
const SUITABILITY_CLASSES = deepFreeze({
  BROAD_ELIGIBILITY: 'BROAD_ELIGIBILITY',
  MODERATE_SPECIALIZATION: 'MODERATE_SPECIALIZATION',
  NICHE_SPECIALIST: 'NICHE_SPECIALIST',
});

const SUITABILITY_DECISIONS = deepFreeze({
  CREATE_CANDIDATE: 'CREATE_CANDIDATE',
  REVIEW: 'REVIEW',
  SKIP: 'SKIP',
});

// 7. Explicit Suitability Reason Codes
const SUITABILITY_REASON_CODES = deepFreeze({
  COMMON_QUALIFICATION: 'COMMON_QUALIFICATION',
  RECURRING_MAJOR_EXAM: 'RECURRING_MAJOR_EXAM',
  HIGH_PREPARATION_VALUE: 'HIGH_PREPARATION_VALUE',
  SPECIALIZED_QUALIFICATION: 'SPECIALIZED_QUALIFICATION',
  RARE_QUALIFICATION: 'RARE_QUALIFICATION',
  NO_WRITTEN_COMPETITIVE_EXAM: 'NO_WRITTEN_COMPETITIVE_EXAM',
  INSUFFICIENT_SCALE_EVIDENCE: 'INSUFFICIENT_SCALE_EVIDENCE',
  UNKNOWN_ELIGIBILITY: 'UNKNOWN_ELIGIBILITY',
  NON_ACADEMIC_ADMINISTRATIVE_NOTICE: 'NON_ACADEMIC_ADMINISTRATIVE_NOTICE',
});

// 8. Controlled Qualification Breadth Categories
const QUALIFICATION_BREADTH = deepFreeze({
  COMMON_SCHOOL_LEVEL: 'COMMON_SCHOOL_LEVEL',
  COMMON_GRADUATE: 'COMMON_GRADUATE',
  COMMON_POST_GRADUATE: 'COMMON_POST_GRADUATE',
  COMMON_TEACHER_QUALIFICATION: 'COMMON_TEACHER_QUALIFICATION',
  MAINSTREAM_TECHNICAL: 'MAINSTREAM_TECHNICAL',
  MAINSTREAM_PROFESSIONAL: 'MAINSTREAM_PROFESSIONAL',
  SPECIALIZED: 'SPECIALIZED',
  RARE_SPECIALIST: 'RARE_SPECIALIST',
  UNKNOWN: 'UNKNOWN',
});

// 9. Controlled Qualitative Scale Dimensions (Recurrence, Participation, Vacancy, Preparation)
const QUALITATIVE_SCALE = deepFreeze({
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  UNKNOWN: 'UNKNOWN',
});

// Authority Key Regex:
// Central: auth_in_<acronym> (e.g. auth_in_upsc)
// State/UT: auth_in_<stateCode>_<acronym> (e.g. auth_in_rj_rpsc, auth_in_dl_dsssb)
const AUTHORITY_KEY_PATTERN = /^auth_in_(?:([a-z]{2})_)?([a-z0-9_]+)$/;

/**
 * Validates an Authority definition against the schema.
 * Throws descriptive Error on violation; returns true on valid.
 */
function validateAuthorityEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('SCHEMA_ERROR: Authority entry must be a non-null object.');
  }

  // 1. Required string attributes
  const requiredStringFields = ['authorityKey', 'shortName', 'fullName', 'officialDomain', 'homePage', 'jurisdiction'];
  for (const field of requiredStringFields) {
    if (typeof entry[field] !== 'string' || entry[field].trim() === '') {
      throw new Error(`SCHEMA_ERROR: Missing or empty required field "${field}".`);
    }
  }

  // 2. Authority Key Convention & Consistency
  const match = AUTHORITY_KEY_PATTERN.exec(entry.authorityKey);
  if (!match) {
    throw new Error(`SCHEMA_ERROR: Invalid authorityKey format "${entry.authorityKey}". Must match "auth_in_[<stateCode>_]<name>".`);
  }

  // 3. Jurisdiction & stateCode Rules
  const jur = entry.jurisdiction;
  if (!Object.values(JURISDICTIONS).includes(jur)) {
    throw new Error(`SCHEMA_ERROR: Invalid jurisdiction "${jur}". Must be one of: ${Object.values(JURISDICTIONS).join(', ')}.`);
  }

  if (jur === JURISDICTIONS.CENTRAL) {
    if (entry.stateCode !== null && entry.stateCode !== undefined) {
      throw new Error(`SCHEMA_ERROR: Central jurisdiction must have stateCode: null, got "${entry.stateCode}".`);
    }
    if (match[1]) {
      throw new Error(`SCHEMA_ERROR: Central authorityKey "${entry.authorityKey}" must NOT include a state prefix.`);
    }
  } else {
    // STATE or UT
    if (!entry.stateCode || typeof entry.stateCode !== 'string') {
      throw new Error(`SCHEMA_ERROR: ${jur} jurisdiction requires a valid non-empty stateCode string.`);
    }
    const stateCodeUpper = entry.stateCode.toUpperCase();
    if (!VALID_STATE_UT_CODES.has(stateCodeUpper)) {
      if (STATE_UT_CODE_ALIASES[stateCodeUpper]) {
        throw new Error(`SCHEMA_ERROR: Non-canonical State/UT code alias "${entry.stateCode}". Must be normalized to canonical "${STATE_UT_CODE_ALIASES[stateCodeUpper]}".`);
      }
      throw new Error(`SCHEMA_ERROR: Unrecognized State/UT code "${entry.stateCode}". Must be one of canonical 28 States + 8 UTs.`);
    }
    const expectedPrefix = stateCodeUpper.toLowerCase();
    if (match[1] !== expectedPrefix) {
      throw new Error(`SCHEMA_ERROR: Authority key "${entry.authorityKey}" state prefix "${match[1]}" does not match stateCode "${expectedPrefix}".`);
    }
  }

  // 4. Allowed Official Domains
  if (!Array.isArray(entry.allowedOfficialDomains) || entry.allowedOfficialDomains.length === 0) {
    throw new Error(`SCHEMA_ERROR: allowedOfficialDomains must be a non-empty array for "${entry.authorityKey}".`);
  }
  for (const domain of entry.allowedOfficialDomains) {
    if (typeof domain !== 'string' || !domain.includes('.')) {
      throw new Error(`SCHEMA_ERROR: Invalid domain string "${domain}" in allowedOfficialDomains.`);
    }
  }
  if (!entry.allowedOfficialDomains.includes(entry.officialDomain)) {
    throw new Error(`SCHEMA_ERROR: officialDomain "${entry.officialDomain}" must be present in allowedOfficialDomains.`);
  }

  // 5. Official Domain format check (must not be an unauthorized search engine or coaching domain)
  const forbiddenDomainPatterns = ['google.com', 'bing.com', 'testbook.com', 'adda247.com', 'unacademy.com', 'byjus.com', 'facebook.com', 'twitter.com', 'x.com'];
  for (const domain of entry.allowedOfficialDomains) {
    if (forbiddenDomainPatterns.some(bad => domain.toLowerCase().includes(bad))) {
      throw new Error(`SECURITY_ERROR: Forbidden coaching/search domain "${domain}" detected in allowedOfficialDomains.`);
    }
  }

  // 6. Home Page URL Verification
  try {
    const homeUrl = new URL(entry.homePage);
    const host = homeUrl.hostname.toLowerCase();
    const isDomainAllowed = entry.allowedOfficialDomains.some(d => host === d || host.endsWith('.' + d));
    if (!isDomainAllowed) {
      throw new Error(`SCHEMA_ERROR: homePage domain "${host}" is not in allowedOfficialDomains for "${entry.authorityKey}".`);
    }
  } catch (err) {
    if (err.message.startsWith('SCHEMA_ERROR')) throw err;
    throw new Error(`SCHEMA_ERROR: Malformed homePage URL "${entry.homePage}": ${err.message}`);
  }

  // 7. Role Endpoints Slots Check
  if (!entry.roleEndpoints || typeof entry.roleEndpoints !== 'object') {
    throw new Error(`SCHEMA_ERROR: roleEndpoints must be an object for "${entry.authorityKey}".`);
  }
  for (const slot of ROLE_ENDPOINT_SLOTS) {
    if (!(slot in entry.roleEndpoints)) {
      throw new Error(`SCHEMA_ERROR: Missing roleEndpoint slot "${slot}" in authority "${entry.authorityKey}".`);
    }
    const endpoint = entry.roleEndpoints[slot];
    if (endpoint !== null && endpoint !== undefined) {
      if (typeof endpoint !== 'string') {
        throw new Error(`SCHEMA_ERROR: roleEndpoint "${slot}" must be string or null.`);
      }
      try {
        const epUrl = new URL(endpoint);
        const epHost = epUrl.hostname.toLowerCase();
        const isEpAllowed = entry.allowedOfficialDomains.some(d => epHost === d || epHost.endsWith('.' + d));
        if (!isEpAllowed) {
          throw new Error(`SCHEMA_ERROR: roleEndpoint "${slot}" host "${epHost}" is not in allowedOfficialDomains.`);
        }
      } catch (err) {
        if (err.message.startsWith('SCHEMA_ERROR')) throw err;
        throw new Error(`SCHEMA_ERROR: Malformed roleEndpoint URL for slot "${slot}": ${endpoint}`);
      }
    }
  }

  // 7B. Role Endpoint Evidence Contracts (if present)
  if (entry.roleEndpointEvidence !== undefined && entry.roleEndpointEvidence !== null) {
    if (typeof entry.roleEndpointEvidence !== 'object') {
      throw new Error(`SCHEMA_ERROR: roleEndpointEvidence must be an object for "${entry.authorityKey}".`);
    }
    for (const slot of ROLE_ENDPOINT_SLOTS) {
      if (!(slot in entry.roleEndpointEvidence)) {
        throw new Error(`SCHEMA_ERROR: Missing roleEndpointEvidence slot "${slot}" in authority "${entry.authorityKey}".`);
      }
      validateRoleEndpointEvidence(entry.roleEndpointEvidence[slot], slot, entry.roleEndpoints[slot], entry.allowedOfficialDomains);
    }
  }

  // 8. Known Major Recurring Exams
  if (!Array.isArray(entry.knownMajorRecurringExams)) {
    throw new Error(`SCHEMA_ERROR: knownMajorRecurringExams must be an array for "${entry.authorityKey}".`);
  }
  for (const exam of entry.knownMajorRecurringExams) {
    if (!exam || typeof exam !== 'object' || !exam.examKey || !exam.displayName) {
      throw new Error(`SCHEMA_ERROR: Each item in knownMajorRecurringExams must have examKey and displayName.`);
    }
  }

  // 9. Monitoring Flag
  if (typeof entry.monitoringEnabled !== 'boolean') {
    throw new Error(`SCHEMA_ERROR: monitoringEnabled must be a boolean for "${entry.authorityKey}".`);
  }

  return true;
}

/**
 * Validates a single role endpoint evidence contract against declared URL and allowed domains.
 */
function validateRoleEndpointEvidence(evidence, slot, declaredUrl, allowedDomains) {
  if (!evidence || typeof evidence !== 'object') {
    throw new Error(`SCHEMA_ERROR: roleEndpointEvidence for slot "${slot}" must be a non-null object.`);
  }
  if (evidence.slot !== slot) {
    throw new Error(`SCHEMA_ERROR: roleEndpointEvidence slot mismatch: expected "${slot}", got "${evidence.slot}".`);
  }
  if (declaredUrl === null || declaredUrl === undefined) {
    if (evidence.proofMethod !== ROLE_PROOF_METHODS.SAFE_NULL) {
      throw new Error(`SCHEMA_ERROR: Null roleEndpoint slot "${slot}" must have proofMethod SAFE_NULL, got "${evidence.proofMethod}".`);
    }
    if (evidence.canonicalUrl !== null) {
      throw new Error(`SCHEMA_ERROR: SAFE_NULL slot "${slot}" must have canonicalUrl: null, got "${evidence.canonicalUrl}".`);
    }
    return true;
  }
  if (!Object.values(ROLE_PROOF_METHODS).includes(evidence.proofMethod)) {
    throw new Error(`SCHEMA_ERROR: Invalid proofMethod "${evidence.proofMethod}" for slot "${slot}".`);
  }
  if (evidence.proofMethod === ROLE_PROOF_METHODS.SAFE_NULL) {
    throw new Error(`SCHEMA_ERROR: Non-null roleEndpoint slot "${slot}" cannot have proofMethod SAFE_NULL.`);
  }
  if (evidence.canonicalUrl !== declaredUrl) {
    throw new Error(`SCHEMA_ERROR: roleEndpointEvidence canonicalUrl mismatch for slot "${slot}": expected "${declaredUrl}", got "${evidence.canonicalUrl}".`);
  }
  if (typeof evidence.expectedFinalHost !== 'string' || !allowedDomains.some(d => evidence.expectedFinalHost.toLowerCase() === d.toLowerCase() || evidence.expectedFinalHost.toLowerCase().endsWith('.' + d.toLowerCase()))) {
    throw new Error(`SCHEMA_ERROR: roleEndpointEvidence expectedFinalHost "${evidence.expectedFinalHost}" is not in allowedOfficialDomains for slot "${slot}".`);
  }
  if (typeof evidence.expectedPathPattern !== 'string' || evidence.expectedPathPattern.trim() === '') {
    throw new Error(`SCHEMA_ERROR: roleEndpointEvidence expectedPathPattern must be non-empty string for slot "${slot}".`);
  }
  try {
    new RegExp(evidence.expectedPathPattern);
  } catch (e) {
    throw new Error(`SCHEMA_ERROR: Invalid expectedPathPattern regex "${evidence.expectedPathPattern}" for slot "${slot}": ${e.message}`);
  }
  if (evidence.proofMethod === ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS && (!Array.isArray(evidence.expectedTitleTokens) || evidence.expectedTitleTokens.length === 0)) {
    throw new Error(`SCHEMA_ERROR: PATH_AND_TITLE_TOKENS requires non-empty expectedTitleTokens for slot "${slot}".`);
  }
  if ((evidence.proofMethod === ROLE_PROOF_METHODS.PATH_AND_PAGE_HEADING || evidence.proofMethod === ROLE_PROOF_METHODS.PATH_AND_PAGE_TOKENS) && (!Array.isArray(evidence.expectedPageTokens) || evidence.expectedPageTokens.length === 0)) {
    throw new Error(`SCHEMA_ERROR: ${evidence.proofMethod} requires non-empty expectedPageTokens for slot "${slot}".`);
  }
  return true;
}

module.exports = {
  deepFreeze,
  JURISDICTIONS,
  VALID_STATE_UT_CODES,
  STATE_UT_CODE_ALIASES,
  normalizeStateCode,
  ROLE_ENDPOINT_SLOTS,
  ROLE_PROOF_METHODS,
  UPDATE_VOCABULARY,
  OPERATIONAL_MODES,
  SUITABILITY_CLASSES,
  SUITABILITY_DECISIONS,
  SUITABILITY_REASON_CODES,
  QUALIFICATION_BREADTH,
  QUALITATIVE_SCALE,
  AUTHORITY_KEY_PATTERN,
  validateAuthorityEntry,
  validateRoleEndpointEvidence,
};
