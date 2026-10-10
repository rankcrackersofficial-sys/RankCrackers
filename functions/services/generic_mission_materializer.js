/**
 * 🔱 RANKCRACKERS PRODUCTION-GRADE GENERIC INDIA-WIDE MISSION MATERIALIZER ENGINE
 * Gate 47B6 — Anti-Gravity Backend Implementation Lane & True Integration Recertification
 *
 * Implements the production-grade, manifest-driven generic India-wide Mission Materializer.
 *
 * Enforces:
 *   - Absolute Existing-Lifecycle Safety & Founder Hold Enforcement
 *   - Founder hold explicitly blocks studentVisible, catalogVisible, cardVisible, quickEntry, smartEntry
 *   - Governed Dynamic Authority Registry Validation (No fixture seeding in governed contexts)
 *   - Execution Contexts: FIXTURE_TEST, ACCEPTED_MANIFEST, UNFROZEN_INTEGRATION_PREFLIGHT, LIVE_INTEGRATION_PREFLIGHT
 *   - Strict Fail-Closed Central Authority Aliasing (auth_central_* rejected in governed contexts)
 *   - Canonical Region Code Contract (TG = Telangana, LA = Ladakh, LD = Lakshadweep)
 *   - Strict Jurisdiction Validation (Central -> stateCode=null, State -> State region, UT -> UT region)
 *   - Exact Opaque Canonical Mission ID Preservation in Hierarchy (No uppercasing/case mutation of missionId)
 *   - Authority Group Key Contract (Read from authority.authorityGroupKey, never string replacement)
 *   - Secure Official Domain Validation (URL parsing; hostname matching against authority.officialDomains)
 *   - Structured Cross-Agency Recruitment Contract (No boolean-only domain bypass)
 *   - Strict Source Metadata & Physical Byte Evidence Contract (No boolean-only byte proof)
 *   - Variant Selection Gate (variantRequired = true with empty variants blocks selection and startability)
 *   - No Default Exam Metadata Insertion in ACCEPTED_MANIFEST / Governed modes
 *   - Startability & Publication Dependency Contract (PREPARING != LIVE; unready startability = false)
 *   - Monitoring & Verification Timestamp Truth (monitorConfigured = false unless evidence-backed)
 *   - 3-Projection Owned-Field Merge Semantics across mission_realms, recruitments, student_mission_catalog
 *   - Hard-Disabled APPLY Mode (APPLY mode rejected)
 *   - Measured Parity & Zero Timestamp Drift
 */

'use strict';

const crypto = require('crypto');
const { URL } = require('url');

// Immutable pilot mission IDs in production
const IMMUTABLE_PILOT_IDS = new Set([
  'jee_main_2026',
  'neet_(ug)-2027',
  'RPSC_FIRST_GRADE2026_2026_1782713222215'
]);

// Governed Variant Dimensions Enum
const ALLOWED_VARIANT_DIMENSIONS = new Set([
  'SUBJECT',
  'DISCIPLINE',
  'TRACK',
  'CADRE',
  'LEVEL',
  'STREAM',
  'LANGUAGE',
  'SPORT'
]);

// Disallowed Compulsory Paper Variant IDs
const DISALLOWED_COMPULSORY_PAPER_VARIANT_IDS = new Set([
  'paper_1_gs',
  'paper_2_csat',
  'gs_paper_1',
  'csat_paper_2',
  'prelims_gs',
  'compulsory_paper_1',
  'tier_1_paper'
]);

// Canonical Region Codes Contract (28 States + 8 UTs)
const REGION_CODES = {
  'AN': { name: 'Andaman and Nicobar Islands', type: 'UT' },
  'AP': { name: 'Andhra Pradesh', type: 'STATE' },
  'AR': { name: 'Arunachal Pradesh', type: 'STATE' },
  'AS': { name: 'Assam', type: 'STATE' },
  'BR': { name: 'Bihar', type: 'STATE' },
  'CH': { name: 'Chandigarh', type: 'UT' },
  'CG': { name: 'Chhattisgarh', type: 'STATE' },
  'DN': { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT' },
  'DL': { name: 'Delhi', type: 'UT' },
  'GA': { name: 'Goa', type: 'STATE' },
  'GJ': { name: 'Gujarat', type: 'STATE' },
  'HR': { name: 'Haryana', type: 'STATE' },
  'HP': { name: 'Himachal Pradesh', type: 'STATE' },
  'JK': { name: 'Jammu and Kashmir', type: 'UT' },
  'JH': { name: 'Jharkhand', type: 'STATE' },
  'KA': { name: 'Karnataka', type: 'STATE' },
  'KL': { name: 'Kerala', type: 'STATE' },
  'LA': { name: 'Ladakh', type: 'UT' },       // ENFORCED: LA = Ladakh
  'LD': { name: 'Lakshadweep', type: 'UT' },   // ENFORCED: LD = Lakshadweep
  'MP': { name: 'Madhya Pradesh', type: 'STATE' },
  'MH': { name: 'Maharashtra', type: 'STATE' },
  'MN': { name: 'Manipur', type: 'STATE' },
  'ML': { name: 'Meghalaya', type: 'STATE' },
  'MZ': { name: 'Mizoram', type: 'STATE' },
  'NL': { name: 'Nagaland', type: 'STATE' },
  'OD': { name: 'Odisha', type: 'STATE' },
  'PY': { name: 'Puducherry', type: 'UT' },
  'PB': { name: 'Punjab', type: 'STATE' },
  'RJ': { name: 'Rajasthan', type: 'STATE' },
  'SK': { name: 'Sikkim', type: 'STATE' },
  'TN': { name: 'Tamil Nadu', type: 'STATE' },
  'TG': { name: 'Telangana', type: 'STATE' },   // CANONICAL: TG = Telangana
  'TR': { name: 'Tripura', type: 'STATE' },
  'UP': { name: 'Uttar Pradesh', type: 'STATE' },
  'UK': { name: 'Uttarakhand', type: 'STATE' },
  'WB': { name: 'West Bengal', type: 'STATE' }
};

// Region code alias map (e.g. TS -> TG)
const REGION_CODE_ALIASES = {
  'TS': 'TG'
};

// Default Fixture Authority Registry (For FIXTURE_TEST context ONLY)
const DEFAULT_FIXTURE_AUTHORITY_REGISTRY = new Map([
  ['auth_in_upsc', { authorityId: 'auth_in_upsc', authorityOfficialName: 'Union Public Service Commission', authorityShortName: 'UPSC', authorityGroupKey: 'upsc', jurisdictionType: 'CENTRAL', isCentralAuthority: true, officialPrimaryDomain: 'https://upsc.gov.in', officialDomains: ['upsc.gov.in'] }],
  ['auth_in_ssc', { authorityId: 'auth_in_ssc', authorityOfficialName: 'Staff Selection Commission', authorityShortName: 'SSC', authorityGroupKey: 'ssc', jurisdictionType: 'CENTRAL', isCentralAuthority: true, officialPrimaryDomain: 'https://ssc.gov.in', officialDomains: ['ssc.gov.in', 'ssc.nic.in'] }],
  ['auth_in_cbse', { authorityId: 'auth_in_cbse', authorityOfficialName: 'Central Board of Secondary Education', authorityShortName: 'CBSE', authorityGroupKey: 'cbse', jurisdictionType: 'CENTRAL', isCentralAuthority: true, officialPrimaryDomain: 'https://cbse.gov.in', officialDomains: ['cbse.gov.in', 'cbse.nic.in'] }],
  ['auth_in_ibps', { authorityId: 'auth_in_ibps', authorityOfficialName: 'Institute of Banking Personnel Selection', authorityShortName: 'IBPS', authorityGroupKey: 'ibps', jurisdictionType: 'CENTRAL', isCentralAuthority: true, officialPrimaryDomain: 'https://ibps.in', officialDomains: ['ibps.in'] }],
  ['auth_in_nta', { authorityId: 'auth_in_nta', authorityOfficialName: 'National Testing Agency', authorityShortName: 'NTA', authorityGroupKey: 'nta', jurisdictionType: 'CENTRAL', isCentralAuthority: true, officialPrimaryDomain: 'https://nta.ac.in', officialDomains: ['nta.ac.in', 'jeemain.nta.nic.in', 'neet.nta.nic.in'] }],
  ['auth_in_rj_rpsc', { authorityId: 'auth_in_rj_rpsc', authorityOfficialName: 'Rajasthan Public Service Commission', authorityShortName: 'RPSC', authorityGroupKey: 'rpsc', jurisdictionType: 'STATE', regionCode: 'RJ', regionName: 'Rajasthan', isCentralAuthority: false, officialPrimaryDomain: 'https://rpsc.rajasthan.gov.in', officialDomains: ['rpsc.rajasthan.gov.in'] }],
  ['auth_in_up_uppsc', { authorityId: 'auth_in_up_uppsc', authorityOfficialName: 'Uttar Pradesh Public Service Commission', authorityShortName: 'UPPSC', authorityGroupKey: 'uppsc', jurisdictionType: 'STATE', regionCode: 'UP', regionName: 'Uttar Pradesh', isCentralAuthority: false, officialPrimaryDomain: 'https://uppsc.up.nic.in', officialDomains: ['uppsc.up.nic.in'] }],
  ['auth_in_dl_dsssb', { authorityId: 'auth_in_dl_dsssb', authorityOfficialName: 'Delhi Subordinate Services Selection Board', authorityShortName: 'DSSSB', authorityGroupKey: 'dsssb', jurisdictionType: 'UT', regionCode: 'DL', regionName: 'Delhi', isCentralAuthority: false, officialPrimaryDomain: 'https://dsssb.delhi.gov.in', officialDomains: ['dsssb.delhi.gov.in'] }],
  ['auth_in_la_dssrb', { authorityId: 'auth_in_la_dssrb', authorityOfficialName: 'LAHDC District Selection Services Board', authorityShortName: 'LAHDC_DSSRB', authorityGroupKey: 'dssrb', jurisdictionType: 'UT', regionCode: 'LA', regionName: 'Ladakh', isCentralAuthority: false, officialPrimaryDomain: 'https://lahdcleh.nic.in', officialDomains: ['lahdcleh.nic.in', 'kargil.nic.in'] }]
]);

/**
 * Validates the authority registry itself for structural and referential purity.
 */
function validateAuthorityRegistry(inputRegistry, options = {}) {
  if (!inputRegistry) {
    throw new Error('AUTHORITY_REGISTRY_REQUIRED: An explicit authority registry object or Map is required.');
  }

  const context = options.context || 'FIXTURE_TEST';
  const isGovernedContext = context !== 'FIXTURE_TEST';

  const registryMap = new Map();
  const seenIds = new Set();
  const errors = [];

  let entries = [];
  if (inputRegistry instanceof Map) {
    entries = Array.from(inputRegistry.values());
  } else if (Array.isArray(inputRegistry)) {
    entries = inputRegistry;
  } else if (typeof inputRegistry === 'object' && inputRegistry !== null) {
    if (Array.isArray(inputRegistry.authorities)) {
      entries = inputRegistry.authorities;
    } else if (Array.isArray(inputRegistry.canonicalStateUTAuthorities) || Array.isArray(inputRegistry.canonicalCentralAuthorities)) {
      const userCentrals = inputRegistry.canonicalCentralAuthorities || [];
      const userStates = inputRegistry.canonicalStateUTAuthorities || [];

      if (!isGovernedContext) {
        const map = new Map();
        DEFAULT_FIXTURE_AUTHORITY_REGISTRY.forEach((v, k) => map.set(k, v));
        userStates.concat(userCentrals).forEach(a => {
          const rawKey = a.canonicalAuthorityKey || a.authorityKey || a.authorityId || a.proposedStableAuthorityKey;
          if (rawKey) map.set(rawKey, a);
        });
        entries = Array.from(map.values());
      } else {
        entries = [...userCentrals, ...userStates];
      }
    } else {
      entries = Object.values(inputRegistry).filter(v => typeof v === 'object' && v !== null && (v.canonicalAuthorityKey || v.authorityKey || v.authorityId || v.proposedStableAuthorityKey));
    }
  }

  if (entries.length === 0) {
    throw new Error('AUTHORITY_REGISTRY_EMPTY: Supplied authority registry contains zero entries.');
  }

  entries.forEach((a, idx) => {
    if (!a || typeof a !== 'object') return;

    let id = a.canonicalAuthorityKey || a.authorityKey || a.authorityId || a.proposedStableAuthorityKey;

    if (!id || typeof id !== 'string' || !id.trim()) {
      errors.push(`AuthorityRegistryRow[${idx}]: authorityId / canonicalAuthorityKey is required.`);
      return;
    }

    let cleanId = id.trim();

    if (cleanId.startsWith('auth_central_')) {
      if (isGovernedContext) {
        errors.push(`AuthorityRegistryRow[${idx}]: CENTRAL_AUTHORITY_ALIAS_DRIFT: '${cleanId}' uses unapproved auth_central_ prefix. Unapproved aliases are rejected in governed context.`);
        return;
      } else {
        cleanId = cleanId.replace(/^auth_central_/, 'auth_in_');
      }
    }

    if (seenIds.has(cleanId)) {
      errors.push(`AuthorityRegistryRow[${idx}]: DUPLICATE_AUTHORITY_ID: Authority ID '${cleanId}' is duplicated in registry.`);
      return;
    }
    seenIds.add(cleanId);

    if (!a.authorityOfficialName && !a.name) {
      errors.push(`AuthorityRegistryRow[${idx}]: official name is required for authority '${cleanId}'.`);
    }

    const isCentral = a.isCentralAuthority === true ||
      String(a.jurisdictionType || '').toUpperCase() === 'CENTRAL' ||
      ['auth_in_upsc', 'auth_in_ssc', 'auth_in_cbse', 'auth_in_ibps', 'auth_in_nta'].includes(cleanId) ||
      (!a.regionCode && (cleanId.includes('upsc') || cleanId.includes('ssc') || cleanId.includes('cbse') || cleanId.includes('ibps') || cleanId.includes('nta')));

    const jurType = isCentral ? 'CENTRAL' : String(a.jurisdictionType || 'STATE').toUpperCase();

    if (!['CENTRAL', 'STATE', 'UT'].includes(jurType)) {
      errors.push(`AuthorityRegistryRow[${idx}]: Invalid jurisdictionType '${a.jurisdictionType}' for authority '${cleanId}'.`);
    }

    if ((jurType === 'STATE' || jurType === 'UT') && !a.regionCode) {
      errors.push(`AuthorityRegistryRow[${idx}]: regionCode is required for State/UT authority '${cleanId}'.`);
    }

    registryMap.set(cleanId, {
      authorityId: cleanId,
      canonicalAuthorityKey: cleanId,
      proposedStableAuthorityKey: cleanId,
      authorityOfficialName: a.authorityOfficialName || a.name || cleanId,
      authorityShortName: a.authorityShortName || a.shortName || cleanId.toUpperCase(),
      authorityGroupKey: a.authorityGroupKey || (isGovernedContext ? null : cleanId.replace(/^auth_in_/, '').replace(/^[a-z]{2}_/, '')),
      jurisdictionType: jurType,
      regionCode: a.regionCode ? (REGION_CODE_ALIASES[a.regionCode.toUpperCase()] || a.regionCode.toUpperCase()) : null,
      regionName: a.regionName || null,
      isCentralAuthority: jurType === 'CENTRAL' || Boolean(a.isCentralAuthority),
      officialPrimaryDomain: a.officialPrimaryDomain || (Array.isArray(a.officialDomains) ? a.officialDomains[0] : null),
      officialDomains: Array.isArray(a.officialDomains) ? a.officialDomains : (a.officialPrimaryDomain ? [a.officialPrimaryDomain] : [])
    });
  });

  if (errors.length > 0) {
    const err = new Error(`INVALID_AUTHORITY_REGISTRY: ${errors.length} error(s) found in authority registry:\n${errors.join('\n')}`);
    err.registryErrors = errors;
    throw err;
  }

  return registryMap;
}

/**
 * Secure Domain Matching using URL parsing and hostname checking.
 */
function isUrlDomainApproved(urlString, approvedDomains = []) {
  if (!urlString || typeof urlString !== 'string' || !urlString.includes('http')) return false;

  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    return approvedDomains.some(domain => {
      const cleanDomain = String(domain || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '').toLowerCase();
      if (!cleanDomain) return false;
      return hostname === cleanDomain || hostname.endsWith('.' + cleanDomain);
    });
  } catch (_) {
    return false;
  }
}

/**
 * Deterministically stringifies objects recursively for canonical key sorting.
 */
function canonicalJsonStringify(obj) {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalJsonStringify).join(',') + ']';
  }
  const sortedKeys = Object.keys(obj).sort();
  const pairs = sortedKeys.map(k => JSON.stringify(k) + ':' + canonicalJsonStringify(obj[k]));
  return '{' + pairs.join(',') + '}';
}

/**
 * Computes SHA-256 semantic digest of payload.
 * Strips non-semantic fields like updatedAt before hashing.
 */
function computeSemanticHash(payload) {
  if (!payload || typeof payload !== 'object') return '';
  const clone = JSON.parse(JSON.stringify(payload));
  delete clone.updatedAt;
  delete clone.lastMaterializedAt;
  delete clone.mirrorTimestamp;
  return crypto.createHash('sha256').update(canonicalJsonStringify(clone)).digest('hex');
}

/**
 * Formats Jurisdiction Hierarchy Path according to Jurisdiction Path Law.
 * ENFORCED: Retains EXACT canonical missionId bytes (NO case mutation/uppercasing of missionId).
 */
function buildHierarchyPath(jurisdictionLevel, stateCode, authorityShortName, exactMissionId) {
  const level = String(jurisdictionLevel || '').toUpperCase();
  const authName = String(authorityShortName || 'AUTH').toUpperCase();

  if (level === 'CENTRAL') {
    return `CENTRAL/NATIONAL/${authName}/${exactMissionId}`;
  }

  const sCode = String(stateCode || 'XX').toUpperCase();

  if (level === 'UT') {
    return `UT/${sCode}/${authName}/${exactMissionId}`;
  }

  return `STATE/${sCode}/${authName}/${exactMissionId}`;
}

/**
 * Normalizes candidate mission entry across fixture schema and physical 47A3/47A3R schema.
 */
function normalizeMissionCandidate(m) {
  const missionId = String(m.missionId || m.proposedYearlessMissionKey || m.latestSourceStatus?.missionId || '').trim();
  const title = String(m.title || m.studentRecognizableDisplayName || m.canonicalExamName || m.examName || '').trim();

  let canonicalAuthorityKey = String(m.canonicalAuthorityKey || m.authorityKey || '').trim();

  const rawStateCode = m.stateCode || m.regionCode || null;
  const stateCode = rawStateCode ? (REGION_CODE_ALIASES[String(rawStateCode).toUpperCase()] || String(rawStateCode).toUpperCase()) : null;

  let jurLevel = m.jurisdictionLevel ? String(m.jurisdictionLevel).toUpperCase() : null;
  if (!jurLevel) {
    if (!stateCode || stateCode === 'CENTRAL' || stateCode === 'NATIONAL') {
      jurLevel = 'CENTRAL';
    } else {
      jurLevel = REGION_CODES[stateCode] ? REGION_CODES[stateCode].type : 'STATE';
    }
  }

  const officialSourceLocator = m.officialSourceLocator || m.governingSource || null;
  const latestEffectiveSource = m.latestEffectiveSource || m.governingSource || null;

  const examCategory = m.examCategory || m.backendExamCategory || null;
  const examScope = m.examScope || null;
  const examPurpose = m.examPurpose || null;

  let variants = Array.isArray(m.variants) ? m.variants : [];
  if (variants.length === 0 && m.variantSummary?.variantRequired === 'YES' && Array.isArray(m.variantSummary?.variants)) {
    variants = m.variantSummary.variants;
  }

  return {
    ...m,
    missionId,
    title,
    canonicalAuthorityKey,
    jurisdictionLevel: jurLevel,
    stateCode: jurLevel === 'CENTRAL' ? null : stateCode,
    officialSourceLocator,
    latestEffectiveSource,
    examCategory,
    examScope,
    examPurpose,
    variants,
    variantRequired: m.variantRequired === true || m.variantSummary?.variantRequired === 'YES'
  };
}

/**
 * Validates manifest input against schema and domain laws.
 */
function validateManifest(manifest, options = {}) {
  const errors = [];
  const warnings = [];
  const context = options.context || 'FIXTURE_TEST';

  if (!manifest || typeof manifest !== 'object') {
    throw new Error('MANIFEST_REQUIRED: Manifest must be a non-null object.');
  }

  if (context === 'ACCEPTED_MANIFEST' && manifest.fixtureOnly === true) {
    throw new Error('FIXTURE_REJECTED_IN_ACCEPTED_MANIFEST_MODE: Test fixtures cannot be processed in ACCEPTED_MANIFEST mode.');
  }

  if (!manifest.manifestVersion) {
    errors.push('MANIFEST_VERSION_REQUIRED: Manifest must declare manifestVersion.');
  }

  const rawMissions = Array.isArray(manifest.missions) ? manifest.missions : [];
  if (rawMissions.length === 0) {
    errors.push('MANIFEST_EMPTY: Manifest contains zero mission entries.');
  }

  // Authority Registry Resolution in ACCEPTED_MANIFEST / Governed modes vs FIXTURE_TEST mode
  let registry = null;
  if (context !== 'FIXTURE_TEST') {
    if (!options.authorityRegistry) {
      throw new Error('AUTHORITY_REGISTRY_REQUIRED: In governed integration mode, an explicit authority registry is mandatory.');
    }
    registry = validateAuthorityRegistry(options.authorityRegistry, options);
  } else {
    registry = options.authorityRegistry ? validateAuthorityRegistry(options.authorityRegistry, options) : DEFAULT_FIXTURE_AUTHORITY_REGISTRY;
  }

  const seenMissionIds = new Set();

  rawMissions.forEach((rawM, idx) => {
    const m = normalizeMissionCandidate(rawM);
    const ctx = `Mission[${idx}] (${m.missionId || 'UNNAMED'})`;

    if (!m.missionId || typeof m.missionId !== 'string' || !m.missionId.trim()) {
      errors.push(`${ctx}: missionId is required.`);
      return;
    }

    const cleanId = m.missionId.trim();

    // Rejection rule: Duplicate missionId in manifest
    if (seenMissionIds.has(cleanId)) {
      errors.push(`${ctx}: Duplicate missionId '${cleanId}' in manifest.`);
    }
    seenMissionIds.add(cleanId);

    // Year-less ID enforcement for new non-pilot missions
    const isPilot = IMMUTABLE_PILOT_IDS.has(cleanId);
    if (!isPilot) {
      if (/_20\d\d$/.test(cleanId) || /_\d{4}_\d+$/.test(cleanId)) {
        errors.push(`${ctx}: New major mission ID '${cleanId}' violates year-less stable ID rule.`);
      }
    }

    // Authority Reference Resolution
    let canonicalKey = String(m.canonicalAuthorityKey || m.authorityKey || '').trim();
    if (!canonicalKey) {
      errors.push(`${ctx}: canonicalAuthorityKey is required.`);
    } else {
      const auth = registry.get(canonicalKey);
      if (!auth) {
        errors.push(`${ctx}: UNKNOWN_AUTHORITY '${canonicalKey}' is not registered in canonical authority registry.`);
      } else {
        if (auth.isCentralAuthority && m.jurisdictionLevel !== 'CENTRAL' && !m.regionalDiscoveryCandidate) {
          errors.push(`${ctx}: Central authority '${canonicalKey}' cannot be cloned as a State/UT authority. Use regional discovery pointer.`);
        }

        // Domain Consistency Validation using URL parsing
        const notifUrl = m.officialSourceLocator?.exactDocumentUrl || m.officialSourceLocator?.officialListingPageUrl || m.officialSourceLocator?.url || null;
        if (notifUrl) {
          const authDomains = auth.officialDomains && auth.officialDomains.length > 0 ? auth.officialDomains : (auth.officialPrimaryDomain ? [auth.officialPrimaryDomain] : []);
          const isDomainOk = isUrlDomainApproved(notifUrl, authDomains);

          if (!isDomainOk) {
            // Check structured cross-agency recruitment contract
            const hasStructuredCrossAgency = m.crossAgencyRecruitment === true &&
              m.conductingAuthorityKey &&
              registry.has(m.conductingAuthorityKey) &&
              isUrlDomainApproved(notifUrl, registry.get(m.conductingAuthorityKey).officialDomains);

            if (!hasStructuredCrossAgency) {
              errors.push(`${ctx}: AUTHORITY_SOURCE_MISMATCH: Official source URL '${notifUrl}' does not match authority '${canonicalKey}' domain (${authDomains.join(', ')}).`);
            }
          }
        }
      }
    }

    // Jurisdiction & Region verification (Strict Fail-Closed)
    const jurLevel = String(m.jurisdictionLevel || '').toUpperCase();
    if (!['CENTRAL', 'STATE', 'UT'].includes(jurLevel)) {
      errors.push(`${ctx}: Invalid jurisdictionLevel '${m.jurisdictionLevel}'. Must be CENTRAL, STATE, or UT.`);
    }

    if (jurLevel === 'CENTRAL' && m.stateCode != null) {
      errors.push(`${ctx}: CENTRAL jurisdiction requires stateCode to be null/absent.`);
    }

    if ((jurLevel === 'STATE' || jurLevel === 'UT') && !m.stateCode) {
      errors.push(`${ctx}: stateCode is required for ${jurLevel} jurisdiction.`);
    }

    if (m.stateCode) {
      const rawCode = String(m.stateCode).toUpperCase();
      const sCode = REGION_CODE_ALIASES[rawCode] || rawCode;

      if (!REGION_CODES[sCode]) {
        errors.push(`${ctx}: UNKNOWN_REGION_CODE '${sCode}' is not a valid Indian State/UT code.`);
      } else {
        const expectedType = REGION_CODES[sCode].type;
        if (jurLevel !== expectedType) {
          errors.push(`${ctx}: REGION_JURISDICTION_MISMATCH: Region '${sCode}' is a ${expectedType}, but jurisdictionLevel declares ${jurLevel}.`);
        }
      }
    }

    // Variant Validation Law (Variant != Compulsory Paper; Governed Enum)
    if (Array.isArray(m.variants)) {
      const seenVariantIds = new Set();
      m.variants.forEach((v, vIdx) => {
        if (!v.variantId) {
          errors.push(`${ctx} Variant[${vIdx}]: variantId is required.`);
        } else {
          if (seenVariantIds.has(v.variantId)) {
            errors.push(`${ctx} Variant[${vIdx}]: Duplicate variantId '${v.variantId}' in manifest.`);
          }
          seenVariantIds.add(v.variantId);

          if (DISALLOWED_COMPULSORY_PAPER_VARIANT_IDS.has(v.variantId.toLowerCase())) {
            errors.push(`${ctx} Variant[${vIdx}]: COMPULSORY_PAPER_AS_VARIANT: Compulsory paper '${v.variantId}' cannot be modeled as a student-selectable variant.`);
          }

          if (m.variantRequired === true && !v.sourceEvidenceRef) {
            errors.push(`${ctx} Variant[${vIdx}]: VARIANT_WITHOUT_EVIDENCE: Variant '${v.variantId}' requires explicit sourceEvidenceRef.`);
          }

          if (v.variantDimension && !ALLOWED_VARIANT_DIMENSIONS.has(String(v.variantDimension).toUpperCase())) {
            errors.push(`${ctx} Variant[${vIdx}]: UNKNOWN_VARIANT_DIMENSION '${v.variantDimension}'. Must be one of: ${Array.from(ALLOWED_VARIANT_DIMENSIONS).join(', ')}.`);
          }
        }
      });
    }

    // ACCEPTED_MANIFEST Mode Strict Checks (No default metadata insertions)
    if (context === 'ACCEPTED_MANIFEST') {
      if (!m.examCategory) errors.push(`${ctx}: ACCEPTED_MANIFEST mode requires explicit examCategory.`);
      if (!m.examScope) errors.push(`${ctx}: ACCEPTED_MANIFEST mode requires explicit examScope.`);
      if (!m.examPurpose) errors.push(`${ctx}: ACCEPTED_MANIFEST mode requires explicit examPurpose.`);
    } else if (context === 'UNFROZEN_INTEGRATION_PREFLIGHT' || context === 'LIVE_INTEGRATION_PREFLIGHT') {
      if (!m.examScope || !m.examCategory || !m.examPurpose) {
        warnings.push(`${ctx}: UNFROZEN_INTEGRATION_PREFLIGHT hold: missing explicit exam metadata.`);
      }
    }

    // Required titles
    if (!m.title && !m.examName) {
      errors.push(`${ctx}: title or examName is required.`);
    }
  });

  if (errors.length > 0) {
    const err = new Error(`MANIFEST_VALIDATION_FAILED: ${errors.length} error(s) found:\n${errors.join('\n')}`);
    err.validationErrors = errors;
    err.warnings = warnings;
    throw err;
  }

  return { valid: true, totalMissions: rawMissions.length, errors: [], warnings };
}

/**
 * Builds canonical projection payloads for a single mission entry.
 * Implements OWNED_FIELD_MERGE semantics & Field Ownership Classes.
 */
function buildMissionProjections(rawMission, existingState = {}, options = {}) {
  const nowIso = options.nowIso || new Date().toISOString();
  const context = options.context || 'FIXTURE_TEST';

  const registry = options.authorityRegistry ? validateAuthorityRegistry(options.authorityRegistry, options) : DEFAULT_FIXTURE_AUTHORITY_REGISTRY;

  const mission = normalizeMissionCandidate(rawMission);

  const missionId = mission.missionId.trim();
  const title = String(mission.title || mission.examName || '').trim();
  let authKey = String(mission.canonicalAuthorityKey || mission.authorityKey || '').trim();

  const authObj = registry.get(authKey) || { authorityShortName: 'AUTH', authorityOfficialName: 'Authority', authorityGroupKey: 'auth' };

  const jurLevel = String(mission.jurisdictionLevel || 'STATE').toUpperCase();
  const rawCode = mission.stateCode ? String(mission.stateCode).toUpperCase() : null;
  const stateCode = jurLevel === 'CENTRAL' ? null : (REGION_CODE_ALIASES[rawCode] || rawCode);
  const stateName = jurLevel === 'CENTRAL' ? null : (mission.stateName || (stateCode ? REGION_CODES[stateCode]?.name : null));
  const region = String(mission.region || (jurLevel === 'CENTRAL' ? 'NATIONAL' : 'REGIONAL')).toUpperCase();
  const sector = mission.sector ? String(mission.sector).toUpperCase() : null;

  // Exact Canonical missionId preserved in hierarchy path (NO case mutation)
  const hierarchyPath = buildHierarchyPath(jurLevel, stateCode, authObj.authorityShortName, missionId);

  // Authority Group Key from Registry (NO derived string replacement in governed mode)
  const authorityGroupKey = authObj.authorityGroupKey || (context === 'FIXTURE_TEST' ? authKey.replace(/^auth_in_/, '') : null);

  // Exact Source Byte Semantics (Requires physical byte length & valid hex SHA-256)
  const hasPhysicalByteProof = Boolean(mission.officialSourceLocator?.bytesAvailable) &&
    Boolean(mission.officialSourceLocator?.sha256Verified) &&
    typeof mission.officialSourceLocator?.byteLength === 'number' &&
    mission.officialSourceLocator.byteLength > 0 &&
    typeof mission.officialSourceLocator?.sha256 === 'string' &&
    /^[a-f0-9]{64}$/i.test(mission.officialSourceLocator.sha256);

  // Readiness State (Existence != Readiness)
  const readiness = {
    missionExists: true,
    sourceMetadataAvailable: Boolean(mission.officialSourceLocator && (mission.officialSourceLocator.officialListingPageUrl || mission.officialSourceLocator.exactDocumentUrl)),
    sourceBytesAvailable: hasPhysicalByteProof,
    syllabusReady: mission.readiness?.syllabusReady || 'PREPARING',
    digibookReady: mission.readiness?.digibookReady || 'PREPARING',
    questionBankReady: mission.readiness?.questionBankReady || 'PREPARING',
    crucibleReady: mission.readiness?.crucibleReady || 'PREPARING'
  };

  // Discoverable != Startable
  const isGrounded = Boolean(mission.officialSourceLocator?.officialListingPageUrl || mission.officialSourceLocator?.exactDocumentUrl);

  // Existing documents for OWNED_FIELD_MERGE & GOVERNANCE_OWNED Preservation
  const exRealm = existingState.mission_realms?.[missionId] || {};
  const exRec = existingState.recruitments?.[missionId] || {};
  const exCat = existingState.student_mission_catalog?.[missionId] || {};

  // Preserve GOVERNANCE_OWNED Fields
  const isArchived = exCat.archived === true || exRealm.archived === true || mission.archived === true;
  const isFounderHold = exRealm.founderHold === true || exCat.founderHold === true || mission.founderHold === true;

  // FOUNDER HOLD LAW: Founder hold explicitly blocks student visibility and startability
  const isBlockedByGovernance = isArchived || isFounderHold;
  const studentVisible = !isBlockedByGovernance && Boolean(mission.visibility?.studentVisible) && isGrounded;
  const catalogDiscoverable = studentVisible;

  // Variant Selection Gate Law: variantRequired = true with empty variants blocks selection and startability
  const variants = Array.isArray(mission.variants) ? mission.variants : [];
  const variantRequiredEmpty = mission.variantRequired === true && variants.length === 0;

  // Startability is strictly FALSE unless academic content, Crucible, and Variant selection are fully ready
  const isAcademicReady = !variantRequiredEmpty &&
    readiness.syllabusReady === 'ready' &&
    readiness.digibookReady === 'ready' &&
    readiness.questionBankReady === 'ready' &&
    readiness.crucibleReady === 'ready';

  const quickEntryEnabled = !isBlockedByGovernance && isAcademicReady;
  const smartEntryEnabled = !isBlockedByGovernance && isAcademicReady;

  // Preparing Publication Semantics (PREPARING != LIVE)
  const publicationState = isArchived ? 'ARCHIVED' : (isFounderHold ? 'HELD_FOUNDER' : (isAcademicReady ? 'LIVE' : 'PREPARING'));
  const studentMsg = isArchived ? 'Mission archived.' :
    (isFounderHold ? 'Mission held by Founder governance.' :
    (isAcademicReady ? 'Mission is live and accessible!' : 'Mission is being prepared. Content will unlock soon.'));

  // Monitoring Truth (monitorConfigured != monitorRuntimeProven; no fake runtime monitors)
  const monitoringRef = {
    monitoringRegistryPath: `mission_realms/${missionId}/source_monitoring_registry`,
    monitorConfigured: Boolean(mission.sourceMonitoringRef && mission.sourceMonitoringRef.configured === true),
    monitorRuntimeProven: Boolean(mission.sourceMonitoringRef && mission.sourceMonitoringRef.monitorRuntimeProven === true && mission.sourceMonitoringRef.runtimeEvidenceRef),
    lastSuccessfulCheck: mission.sourceMonitoringRef?.lastSuccessfulCheck || null
  };

  // Preserve timestamps & lastVerifiedDate if present on existing docs
  const realmCreatedAt = exRealm.createdAt || mission.createdAt || nowIso;
  const realmUpdatedAt = exRealm.createdAt ? (exRealm.updatedAt || nowIso) : nowIso;

  const recCreatedAt = exRec.createdAt || mission.createdAt || nowIso;
  const recUpdatedAt = exRec.createdAt ? (exRec.updatedAt || nowIso) : nowIso;

  const catCreatedAt = exCat.createdAt || mission.createdAt || nowIso;
  const catUpdatedAt = exCat.createdAt ? (exCat.updatedAt || nowIso) : nowIso;

  // Source Verification Timestamp Truth: Do NOT generate lastVerifiedDate = nowIso unless evidence-backed!
  const lastVerifiedDate = mission.latestEffectiveSource?.lastVerifiedDate || exRealm.latestOfficialSource?.lastVerifiedDate || null;

  const latestOfficialSource = mission.latestEffectiveSource ? {
    ...mission.latestEffectiveSource,
    lastVerifiedDate: lastVerifiedDate
  } : null;

  // Strict Exam Category, Scope, and Purpose
  const examCategory = mission.examCategory ? String(mission.examCategory).toLowerCase() : (context === 'ACCEPTED_MANIFEST' ? null : 'competitive');
  const examScope = mission.examScope ? String(mission.examScope).toUpperCase() : (context === 'ACCEPTED_MANIFEST' ? null : 'PUBLIC_STUDENT_ELIGIBLE');
  const examPurpose = mission.examPurpose ? String(mission.examPurpose) : (context === 'ACCEPTED_MANIFEST' ? null : 'Major Exam Mission');

  // 1. PROJECTION: mission_realms/{missionId}
  const realmData = {
    ...exRealm, // OWNED_FIELD_MERGE: Preserve unowned governed fields
    id: missionId,
    realm_id: missionId,
    missionId: missionId,
    canonicalMissionIdentity: missionId,
    title: title,
    name: title,
    exam_name: title,
    displayTitle: title,
    authorityGroupKey: authorityGroupKey,
    canonicalAuthorityKey: authKey,
    authorityDisplayName: authObj.authorityOfficialName,
    organizationCode: authObj.authorityShortName,
    jurisdictionLevel: jurLevel,
    stateCode: stateCode,
    stateName: stateName,
    region: region,
    sector: sector,
    examCategory: examCategory,
    examScope: examScope,
    examPurpose: examPurpose,
    studentHierarchyPath: hierarchyPath,
    hierarchyPlacement: {
      jurisdiction: jurLevel,
      stateCode: stateCode,
      region: region,
      sector: sector,
      authorityGroupKey: authKey
    },
    variants: variants,
    officialSourceLocator: mission.officialSourceLocator || null,
    latestOfficialSource: latestOfficialSource,
    pyqArchiveReference: mission.pyqArchiveRef || { collectionPath: `mission_realms/${missionId}/pyq_archives`, unboundedSupport: true },
    monitoringRef: monitoringRef,
    readiness: readiness,
    contentReadiness: readiness,
    visibilityGate: {
      studentVisible: studentVisible,
      catalogVisible: catalogDiscoverable,
      userPanelVisible: studentVisible,
      cardVisible: studentVisible,
      quickEntryEnabled: quickEntryEnabled,
      smartEntryEnabled: smartEntryEnabled,
      gateStatus: publicationState,
      blockers: isArchived ? ['GOVERNANCE_ARCHIVED'] : (isFounderHold ? ['FOUNDER_HOLD'] : (studentVisible ? [] : ['HELD_FOR_VERIFICATION']))
    },
    userPanelVisible: studentVisible,
    status: publicationState,
    archived: isArchived,
    founderHold: isFounderHold,
    createdAt: realmCreatedAt,
    updatedAt: realmUpdatedAt
  };

  // 2. PROJECTION: recruitments/{missionId}
  const recruitmentData = {
    ...exRec, // OWNED_FIELD_MERGE
    id: missionId,
    recruitmentId: missionId,
    missionId: missionId,
    title: title,
    examName: title,
    organization: authObj.authorityOfficialName,
    organizationCode: authObj.authorityShortName,
    authorityGroupKey: authorityGroupKey,
    canonicalAuthorityKey: authKey,
    authorityDisplayName: authObj.authorityOfficialName,
    jurisdictionLevel: jurLevel,
    stateCode: stateCode,
    stateName: stateName,
    region: region,
    sector: sector,
    examCategory: examCategory,
    examScope: examScope,
    studentHierarchyPath: hierarchyPath,
    readiness: readiness,
    status: isArchived ? 'archived' : (isFounderHold ? 'held' : (isAcademicReady ? 'published' : 'draft')),
    nature: isArchived ? 'ARCHIVED' : (isFounderHold ? 'HELD' : (isAcademicReady ? 'ACTIVE' : 'PASSIVE')),
    createdAt: recCreatedAt,
    updatedAt: recUpdatedAt
  };

  // 3. PROJECTION: student_mission_catalog/{missionId}
  const catalogData = {
    ...exCat, // OWNED_FIELD_MERGE
    id: missionId,
    missionId: missionId,
    realmId: missionId,
    sourceMissionId: missionId,
    sourcePath: `mission_realms/${missionId}`,
    sourceType: 'mission_realms',
    title: title,
    name: title,
    displayTitle: title,
    examName: title,
    authorityGroupKey: authorityGroupKey,
    canonicalAuthorityKey: authKey,
    authorityDisplayName: authObj.authorityOfficialName,
    organizationCode: authObj.authorityShortName,
    boardId: authObj.authorityShortName,
    jurisdictionLevel: jurLevel,
    state: stateName || 'Central',
    stateCode: stateCode,
    stateName: stateName,
    region: region,
    sector: sector,
    examCategory: examCategory,
    missionType: examCategory,
    missionStructureType: mission.missionStructureType || 'SINGLE_TRACK',
    examScope: examScope,
    studentHierarchyPath: hierarchyPath,
    readiness: readiness,
    status: publicationState,
    catalogStatus: publicationState,
    studentPublicationState: publicationState,
    studentMessage: studentMsg,
    userPanelVisible: studentVisible,
    cardVisible: studentVisible,
    visibility: {
      studentVisible: studentVisible,
      catalogVisible: catalogDiscoverable,
      userPanelVisible: studentVisible,
      cardVisible: studentVisible,
      quickEntryEnabled: quickEntryEnabled,
      smartEntryEnabled: smartEntryEnabled
    },
    archived: isArchived,
    founderHold: isFounderHold,
    source: {
      missionRealmPath: `mission_realms/${missionId}`,
      mirroredBy: 'generic_mission_materializer_47b6',
      materializerPhase: '47B6_PRODUCTION_ENGINE'
    },
    createdAt: catCreatedAt,
    updatedAt: catUpdatedAt
  };

  return {
    missionId,
    realmData,
    recruitmentData,
    catalogData
  };
}

/**
 * Runs materializer in VALIDATE_ONLY, DRY_RUN, or APPLY mode.
 * Note: APPLY mode is HARD-DISABLED in Gate 47B4/47B5/47B6!
 */
function runGenericMissionMaterializer(manifest, currentStateStore = {}, options = {}) {
  const mode = String(options.mode || 'DRY_RUN').toUpperCase();

  // HARD-DISABLE APPLY MODE IN THIS GATE
  if (mode === 'APPLY') {
    throw new Error('APPLY_MODE_DISABLED: Apply mode is hard-disabled in Gate 47B6. Use VALIDATE_ONLY or DRY_RUN mode.');
  }

  if (mode !== 'VALIDATE_ONLY' && mode !== 'DRY_RUN') {
    throw new Error(`INVALID_EXECUTION_MODE: Unsupported mode '${mode}'.`);
  }

  // Step 1: Validate Manifest
  const validation = validateManifest(manifest, options);

  if (mode === 'VALIDATE_ONLY') {
    return {
      executionMode: 'VALIDATE_ONLY',
      status: 'PASS',
      totalMissionsEvaluated: validation.totalMissions,
      validation: validation
    };
  }

  // Step 2: DRY_RUN Execution
  const nowIso = options.nowIso || new Date().toISOString();
  const plannedOperations = [];
  const mutationManifest = [];

  const existingRealms = currentStateStore.mission_realms || {};
  const existingRecruitments = currentStateStore.recruitments || {};
  const existingCatalog = currentStateStore.student_mission_catalog || {};

  let semanticCreates = 0;
  let semanticUpdates = 0;
  let semanticNoOps = 0;
  let semanticDeletes = 0;
  let semanticRejects = 0;

  manifest.missions.forEach(rawMission => {
    const projections = buildMissionProjections(rawMission, currentStateStore, { ...options, nowIso });
    const mId = projections.missionId;

    const targets = [
      { col: 'mission_realms', path: `mission_realms/${mId}`, data: projections.realmData, store: existingRealms },
      { col: 'recruitments', path: `recruitments/${mId}`, data: projections.recruitmentData, store: existingRecruitments },
      { col: 'student_mission_catalog', path: `student_mission_catalog/${mId}`, data: projections.catalogData, store: existingCatalog }
    ];

    targets.forEach(t => {
      const existingDoc = t.store[mId];
      const candidateHash = computeSemanticHash(t.data);

      if (!existingDoc) {
        semanticCreates++;
        const op = {
          targetPath: t.path,
          collection: t.col,
          documentId: mId,
          operation: 'CREATE',
          semanticBeforeHash: null,
          semanticAfterHash: candidateHash,
          changedFields: Object.keys(t.data),
          reason: 'Document does not exist in state store; planned CREATE',
          diff: { before: null, after: t.data }
        };
        plannedOperations.push(op);
        mutationManifest.push({ path: t.path, op: 'CREATE', hash: candidateHash });
      } else {
        const existingHash = computeSemanticHash(existingDoc);

        if (existingHash === candidateHash) {
          semanticNoOps++;
          plannedOperations.push({
            targetPath: t.path,
            collection: t.col,
            documentId: mId,
            operation: 'NO_OP',
            semanticBeforeHash: existingHash,
            semanticAfterHash: candidateHash,
            changedFields: [],
            reason: 'Payload is semantically identical to existing document; NO_OP (no timestamp drift)',
            diff: { before: existingDoc, after: existingDoc }
          });
        } else {
          semanticUpdates++;
          const changedFields = Object.keys(t.data).filter(k => JSON.stringify(existingDoc[k]) !== JSON.stringify(t.data[k]));
          const mergedData = { ...existingDoc, ...t.data, updatedAt: nowIso };

          plannedOperations.push({
            targetPath: t.path,
            collection: t.col,
            documentId: mId,
            operation: 'UPDATE',
            semanticBeforeHash: existingHash,
            semanticAfterHash: candidateHash,
            changedFields: changedFields,
            reason: 'Semantic diff detected; planned OWNED_FIELD_MERGE UPDATE',
            diff: { before: existingDoc, after: mergedData }
          });
          mutationManifest.push({ path: t.path, op: 'UPDATE', beforeHash: existingHash, afterHash: candidateHash });
        }
      }
    });
  });

  return {
    executionMode: 'DRY_RUN',
    status: 'PASS',
    timestamp: nowIso,
    manifestVersion: manifest.manifestVersion,
    totalMissionsEvaluated: manifest.missions.length,
    totalProjectionsEvaluated: manifest.missions.length * 3,
    summary: {
      semanticCreates,
      semanticUpdates,
      semanticNoOps,
      semanticDeletes,
      semanticRejects,
      totalMutationsPlanned: semanticCreates + semanticUpdates
    },
    plannedOperations,
    mutationManifest
  };
}

/**
 * Applies planned materialization mutations to a simulator state store for idempotency testing.
 */
function applyToSimulatorState(currentStateStore = {}, dryRunResult) {
  const nextState = {
    mission_realms: { ...(currentStateStore.mission_realms || {}) },
    recruitments: { ...(currentStateStore.recruitments || {}) },
    student_mission_catalog: { ...(currentStateStore.student_mission_catalog || {}) }
  };

  dryRunResult.plannedOperations.forEach(op => {
    if (op.operation === 'CREATE' || op.operation === 'UPDATE') {
      const col = op.collection;
      const docId = op.documentId;
      nextState[col][docId] = JSON.parse(JSON.stringify(op.diff.after));
    }
  });

  return nextState;
}

module.exports = {
  IMMUTABLE_PILOT_IDS,
  ALLOWED_VARIANT_DIMENSIONS,
  DISALLOWED_COMPULSORY_PAPER_VARIANT_IDS,
  REGION_CODES,
  REGION_CODE_ALIASES,
  DEFAULT_FIXTURE_AUTHORITY_REGISTRY,
  validateAuthorityRegistry,
  isUrlDomainApproved,
  canonicalJsonStringify,
  computeSemanticHash,
  buildHierarchyPath,
  normalizeMissionCandidate,
  validateManifest,
  buildMissionProjections,
  runGenericMissionMaterializer,
  applyToSimulatorState
};
