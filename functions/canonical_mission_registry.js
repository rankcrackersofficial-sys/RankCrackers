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

// 1. Data-driven existing mission bindings.
//
// These are deliberately kept as immutable parent bindings instead of being
// renamed or recreated.  The Firestore document id is part of the existing
// mission/subcollection contract, so a stable yearless family key must resolve
// back to the already-existing mission id for these records.
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
  },
  {
    legacyId: 'ssc_cgl',
    authorityKey: 'ssc',
    examAliases: ['ssc cgl', 'ssc cgl exam', 'combined graduate level examination']
  },
  {
    legacyId: 'ssc_selection_post',
    authorityKey: 'ssc',
    examAliases: ['ssc selection post', 'selection post examination']
  },
  {
    legacyId: 'ssc_stenographer',
    authorityKey: 'ssc',
    examAliases: ['ssc stenographer', "stenographer grade c d examination"]
  },
  {
    legacyId: 'upsc_cse_prelims',
    authorityKey: 'upsc',
    examAliases: ['upsc cse', 'upsc cse prelims', 'upsc civil services prelims', 'civil services preliminary examination']
  },
  {
    legacyId: 'rpsc_ras_prelims',
    authorityKey: 'rpsc',
    examAliases: ['rpsc ras', 'rpsc ras prelims', 'ras prelims', 'rpsc rajasthan administrative services prelims']
  },
  {
    legacyId: 'uppsc_pcs_prelims',
    authorityKey: 'uppsc',
    examAliases: ['uppsc pcs', 'uppsc pcs prelims', 'uppsc combined state upper subordinate services prelims']
  },
  {
    legacyId: 'ssc_gd',
    authorityKey: 'ssc',
    examAliases: ['ssc gd', 'ssc gd constable', 'constables gd examination']
  },
  {
    legacyId: 'ssc_cpo',
    authorityKey: 'ssc',
    examAliases: ['ssc cpo', 'ssc si cpo', 'sub inspector delhi police capf examination']
  },
  {
    legacyId: 'ssc_mts_havaldar',
    authorityKey: 'ssc',
    examAliases: ['ssc mts', 'ssc mts havaldar', 'multi tasking staff havaldar examination']
  },
  {
    legacyId: 'ssc_hindi_translators',
    authorityKey: 'ssc',
    examAliases: ['ssc hindi translators', 'combined hindi translators examination', 'junior hindi translator examination']
  },
  {
    legacyId: 'ssc_chsl',
    authorityKey: 'ssc',
    examAliases: ['ssc chsl', 'combined higher secondary level examination']
  },
  {
    legacyId: 'ssc_je',
    authorityKey: 'ssc',
    examAliases: ['ssc je', 'ssc junior engineer', 'junior engineer examination']
  }
]);

// 2. Governed Authority Aliases Registry
const GOVERNED_AUTHORITY_ALIASES = deepFreeze({
  'nta': ['nta', 'national testing agency', 'national testing agency (nta)'],
  'upsc': ['upsc', 'union public service commission', 'union public service commission (upsc)'],
  'rpsc': ['rpsc', 'rajasthan public service commission', 'rajasthan public service commission (rpsc)'],
  'uppsc': ['uppsc', 'up psc', 'uttar pradesh public service commission', 'uttar pradesh public service commission (uppsc)'],
  'ssc': ['ssc', 'staff selection commission', 'staff selection commission (ssc)'],
  'rssb': ['rssb', 'rsmssb', 'rajasthan staff selection board', 'rajasthan subordinate and ministerial services selection board'],
  'iit_jee_advanced': ['jee advanced authority', 'joint entrance examination advanced authority', 'joint admission board', 'iit jee advanced', 'iit_jee_advanced'],
  'auth_in_indian_air_force': ['indian air force', 'auth_in_indian_air_force', 'iaf', 'air force']
});

// 3. Governed Exam Aliases Registry
const GOVERNED_EXAM_ALIASES = deepFreeze({
  'jee_main': ['jee main', 'jee (main)', 'jee_main', 'joint entrance examination main'],
  'neet_ug': ['neet', 'neet ug', 'neet (ug)', 'neet_ug', 'national eligibility cum entrance test'],
  'upsc_cse_prelims': ['upsc cse', 'upsc cse prelims', 'upsc civil services prelims', 'upsc_cse_prelims'],
  'ssc_cgl': ['ssc cgl', 'ssc_cgl', 'staff selection commission cgl'],
  'ssc_selection_post': ['ssc selection post', 'selection post examination', 'ssc_selection_post'],
  'ssc_stenographer': ['ssc stenographer', 'stenographer grade c d examination', 'ssc_stenographer'],
  'ssc_hindi_translators': ['ssc hindi translators', 'combined hindi translators examination', 'ssc_hindi_translators'],
  'ssc_mts_havaldar': ['ssc mts', 'ssc mts havaldar', 'multi tasking staff havaldar examination', 'ssc_mts_havaldar'],
  'ssc_cpo': ['ssc cpo', 'sub inspector delhi police capf examination', 'ssc_cpo'],
  'ssc_gd': ['ssc gd', 'ssc gd constable', 'constables gd examination', 'ssc_gd'],
  'ssc_chsl': ['ssc chsl', 'combined higher secondary level examination', 'ssc_chsl'],
  'ssc_je': ['ssc je', 'ssc junior engineer', 'junior engineer examination', 'ssc_je'],
  'rpsc_ras_prelims': ['rpsc ras', 'rpsc ras prelims', 'rpsc_ras_prelims'],
  'rpsc_1st_grade': ['rpsc 1st grade', 'rpsc first grade', 'school lecturer school education', 'rpsc_1st_grade'],
  'uppsc_pcs_prelims': ['uppsc pcs', 'uppsc pcs prelims', 'uppsc combined state upper subordinate services prelims', 'uppsc_pcs_prelims'],
  'jee_advanced': ['jee advanced', 'jee (advanced)', 'joint entrance examination advanced', 'jee_advanced'],
  'upsc_nda': ['upsc nda', 'national defence academy naval academy examination', 'upsc_nda'],
  'upsc_cds': ['upsc cds', 'combined defence services examination', 'upsc_cds'],
  'upsc_capf': ['upsc capf', 'central armed police forces assistant commandants examination', 'upsc_capf'],
  'upsc_ese': ['upsc ese', 'engineering services examination', 'upsc_ese'],
  'upsc_cms': ['upsc cms', 'combined medical services examination', 'upsc_cms'],
  'upsc_ifs': ['upsc ifs', 'indian forest service examination', 'upsc_ifs'],
  'upsc_ies_iss': ['upsc ies iss', 'indian economic service indian statistical service examination', 'upsc_ies_iss'],
  'cuet_ug': ['cuet ug', 'common university entrance test ug', 'cuet_ug'],
  'ugc_net': ['ugc net', 'ugc national eligibility test', 'ugc_net'],
  'csir_net': ['csir net', 'joint csir ugc net', 'csir_net'],
  'rpsc_2nd_grade': ['rpsc 2nd grade', 'senior teacher grade ii', 'rpsc_2nd_grade'],
  'rpsc_college_lecturer': ['rpsc college lecturer', 'assistant professor college education', 'rpsc_college_lecturer'],
  'rpsc_si': ['rpsc si', 'sub inspector platoon commander', 'rpsc_si'],
  'rpsc_ae': ['rpsc ae', 'assistant engineer combined competitive examination', 'rpsc_ae'],
  'rssb_patwar': ['rssb patwar', 'patwari direct recruitment', 'rssb_patwar'],
  'rssb_cet_graduate': ['rssb cet graduate', 'common eligibility test graduate level', 'rssb_cet_graduate'],
  'rssb_cet_senior_secondary': ['rssb cet senior secondary', 'common eligibility test senior secondary level', 'rssb_cet_senior_secondary'],
  'rssb_junior_accountant': ['rssb junior accountant', 'junior accountant tehsil revenue accountant', 'rssb_junior_accountant'],
  'rssb_vdo': ['rssb vdo', 'village development officer gram vikas adhikari', 'rssb_vdo'],
  'rssb_lab_assistant': ['rssb lab assistant', 'lab assistant direct recruitment', 'rssb_lab_assistant'],
  'rssb_computor': ['rssb computor', 'sanganak direct recruitment', 'rssb_computor'],
  'rssb_vanpal': ['rssb vanpal', 'forester forest guard', 'rssb_vanpal'],
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
  'ssc_selection_post': ['ssc'],
  'ssc_stenographer': ['ssc'],
  'ssc_hindi_translators': ['ssc'],
  'ssc_mts_havaldar': ['ssc'],
  'ssc_cpo': ['ssc'],
  'ssc_gd': ['ssc'],
  'ssc_chsl': ['ssc'],
  'ssc_je': ['ssc'],
  'rpsc_ras_prelims': ['rpsc'],
  'rpsc_1st_grade': ['rpsc'],
  'uppsc_pcs_prelims': ['uppsc'],
  'jee_advanced': ['iit_jee_advanced'],
  'upsc_nda': ['upsc'],
  'upsc_cds': ['upsc'],
  'upsc_capf': ['upsc'],
  'upsc_ese': ['upsc'],
  'upsc_cms': ['upsc'],
  'upsc_ifs': ['upsc'],
  'upsc_ies_iss': ['upsc'],
  'cuet_ug': ['nta'],
  'ugc_net': ['nta'],
  'csir_net': ['nta'],
  'rpsc_2nd_grade': ['rpsc'],
  'rpsc_college_lecturer': ['rpsc'],
  'rpsc_si': ['rpsc'],
  'rpsc_ae': ['rpsc'],
  'rssb_patwar': ['rssb'],
  'rssb_cet_graduate': ['rssb'],
  'rssb_cet_senior_secondary': ['rssb'],
  'rssb_junior_accountant': ['rssb'],
  'rssb_vdo': ['rssb'],
  'rssb_lab_assistant': ['rssb'],
  'rssb_computor': ['rssb'],
  'rssb_vanpal': ['rssb'],
  'air_force_common_admission_test': ['auth_in_indian_air_force']
});

// 5. Single canonical mission-realm identity manifest.
//
// This is the one runtime identity map for the 18 records currently visible in
// Founder Mission Control.  The three non-exam records remain in inventory for
// audit visibility but are quarantined and can never become student missions.
// Existing Firestore ids are preserved in-place; no copy/delete or recreation
// is implied by this manifest.
const CANONICAL_MISSION_REALM_MANIFEST = deepFreeze([
  { missionId: 'ssc_cgl', authorityKey: 'ssc', examKey: 'ssc_cgl', jurisdiction: 'CENTRAL', shortName: 'SSC CGL', officialName: 'Combined Graduate Level Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_selection_post', authorityKey: 'ssc', examKey: 'ssc_selection_post', jurisdiction: 'CENTRAL', shortName: 'SSC Selection Post', officialName: 'Selection Posts Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_stenographer', authorityKey: 'ssc', examKey: 'ssc_stenographer', jurisdiction: 'CENTRAL', shortName: 'SSC Stenographer Grade C & D', officialName: "Stenographer Grade 'C' & 'D' Examination", officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'upsc_cse_prelims', authorityKey: 'upsc', examKey: 'upsc_cse_prelims', jurisdiction: 'CENTRAL', shortName: 'UPSC Civil Services – Prelims', officialName: 'Civil Services (Preliminary) Examination', officialDomain: 'upsc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'rpsc_ras_prelims', authorityKey: 'rpsc', examKey: 'rpsc_ras_prelims', jurisdiction: 'STATE', stateCode: 'RJ', shortName: 'RPSC RAS – Prelims', officialName: 'Rajasthan State and Subordinate Services Combined Competitive Examination (Preliminary)', officialDomain: 'rpsc.rajasthan.gov.in', studentMediumPolicy: 'ENGLISH_EVIDENCE_REQUIRED', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'uppsc_pcs_prelims', authorityKey: 'uppsc', examKey: 'uppsc_pcs_prelims', jurisdiction: 'STATE', stateCode: 'UP', shortName: 'UPPSC PCS – Prelims', officialName: 'Combined State / Upper Subordinate Services Examination (Preliminary)', officialDomain: 'uppsc.up.nic.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_gd', authorityKey: 'ssc', examKey: 'ssc_gd', jurisdiction: 'CENTRAL', shortName: 'SSC GD', officialName: 'Constable (GD) in Central Armed Police Forces Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_cpo', authorityKey: 'ssc', examKey: 'ssc_cpo', jurisdiction: 'CENTRAL', shortName: 'SSC CPO', officialName: 'Sub-Inspector in Delhi Police and Central Armed Police Forces Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_mts_havaldar', authorityKey: 'ssc', examKey: 'ssc_mts_havaldar', jurisdiction: 'CENTRAL', shortName: 'SSC MTS & Havaldar', officialName: 'Multi-Tasking (Non-Technical) Staff & Havaldar Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_hindi_translators', authorityKey: 'ssc', examKey: 'ssc_hindi_translators', jurisdiction: 'CENTRAL', shortName: 'SSC Combined Hindi Translators', officialName: 'Junior Hindi Translator, Junior Translator and Senior Hindi Translator Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_chsl', authorityKey: 'ssc', examKey: 'ssc_chsl', jurisdiction: 'CENTRAL', shortName: 'SSC CHSL', officialName: 'Combined Higher Secondary (10+2) Level Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'ssc_je', authorityKey: 'ssc', examKey: 'ssc_je', jurisdiction: 'CENTRAL', shortName: 'SSC Junior Engineer', officialName: 'Junior Engineer (Civil, Mechanical & Electrical) Examination', officialDomain: 'ssc.gov.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'RPSC_FIRST_GRADE2026_2026_1782713222215', authorityKey: 'rpsc', examKey: 'rpsc_1st_grade', jurisdiction: 'STATE', stateCode: 'RJ', shortName: 'RPSC 1st Grade', officialName: 'School Lecturer (School Education)', officialDomain: 'rpsc.rajasthan.gov.in', studentMediumPolicy: 'ENGLISH_EVIDENCE_REQUIRED', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'neet_(ug)-2027', authorityKey: 'nta', examKey: 'neet_ug', jurisdiction: 'CENTRAL', shortName: 'NEET (UG)', officialName: 'National Eligibility Cum Entrance Test (UG)', officialDomain: 'neet.nta.nic.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'jee_main_2026', authorityKey: 'nta', examKey: 'jee_main', jurisdiction: 'CENTRAL', shortName: 'JEE Main', officialName: 'Joint Entrance Examination (Main)', officialDomain: 'jeemain.nta.nic.in', studentMediumPolicy: 'ENGLISH_AVAILABLE', lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'e2e_prod_mission_1790940914968', identityStatus: 'QUARANTINED_UNCLASSIFIED_TEST_OR_E2E', shortName: 'e2e_prod_mission_1790940914968', jurisdiction: 'UNCLASSIFIED', studentMissionEligible: false, lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'm_prod_e2e_f5_1790946353278', identityStatus: 'QUARANTINED_UNCLASSIFIED_TEST_OR_E2E', shortName: 'm_prod_e2e_f5_1790946353278', jurisdiction: 'UNCLASSIFIED', studentMissionEligible: false, lifecycle: 'EXISTING_FOUNDER_DRAFT' },
  { missionId: 'test_mission_catalog_bridge', identityStatus: 'QUARANTINED_ORPHANED_TEST_RECORD', shortName: 'TEST Mission Catalog Bridge', jurisdiction: 'UNCLASSIFIED', studentMissionEligible: false, lifecycle: 'EXISTING_FOUNDER_DRAFT' }
]);

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

/**
 * Validates the single canonical mission-realm manifest.
 *
 * Identity records must point at a governed authority/exam pair.  Quarantined
 * records are allowed only when they explicitly opt out of student delivery;
 * this keeps visible test/orphan records auditable without making them valid
 * production missions by accident.
 */
function assertCanonicalMissionRealmManifestIntegrity(manifest) {
  if (!Array.isArray(manifest) || manifest.length === 0) {
    throw new Error('MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Manifest must be a non-empty array.');
  }

  const ids = new Set();
  for (const entry of manifest) {
    if (!entry || typeof entry !== 'object') {
      throw new Error('MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Every entry must be an object.');
    }
    if (typeof entry.missionId !== 'string' || entry.missionId.trim() === '') {
      throw new Error('MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: missionId must be non-empty.');
    }
    if (ids.has(entry.missionId)) {
      throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Duplicate missionId '${entry.missionId}'.`);
    }
    ids.add(entry.missionId);

    const isQuarantined = String(entry.identityStatus || '').startsWith('QUARANTINED_');
    if (isQuarantined) {
      if (entry.studentMissionEligible !== false || entry.jurisdiction !== 'UNCLASSIFIED') {
        throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Quarantined mission '${entry.missionId}' must be unclassified and student-ineligible.`);
      }
      continue;
    }

    if (!STRICT_CANONICAL_TOKEN_REGEX.test(entry.authorityKey || '') ||
        !STRICT_CANONICAL_TOKEN_REGEX.test(entry.examKey || '')) {
      throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Mission '${entry.missionId}' has invalid authority/exam keys.`);
    }
    if (!GOVERNED_AUTHORITY_ALIASES[entry.authorityKey] || !GOVERNED_EXAM_ALIASES[entry.examKey]) {
      throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Mission '${entry.missionId}' references an ungoverned identity.`);
    }
    const allowed = GOVERNED_EXAM_AUTHORITY_COMPATIBILITY[entry.examKey] || [];
    if (!allowed.includes(entry.authorityKey)) {
      throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Mission '${entry.missionId}' has an ungoverned authority/exam pair.`);
    }
    if (!['CENTRAL', 'STATE', 'UT'].includes(entry.jurisdiction)) {
      throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: Mission '${entry.missionId}' has invalid jurisdiction.`);
    }
    if (entry.jurisdiction === 'STATE' && (!entry.stateCode || entry.stateCode.length !== 2)) {
      throw new Error(`MISSION_REALM_MANIFEST_INTEGRITY_FAILURE: State mission '${entry.missionId}' must declare a stateCode.`);
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
assertCanonicalMissionRealmManifestIntegrity(CANONICAL_MISSION_REALM_MANIFEST);

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
  CANONICAL_MISSION_REALM_MANIFEST,
  deepFreeze,
  normalizeCanonicalToken,
  stripYearDecoration,
  assertRegistryIntegrity,
  assertExamAuthorityCompatibilityIntegrity,
  assertLegacyParentBindingsIntegrity,
  assertCanonicalMissionRealmManifestIntegrity,
  resolveCanonicalAuthorityKey,
  resolveCanonicalExamKey,
  buildPermanentMissionId,
  resolveCanonicalMissionId,
  validateOrResolveId
};
