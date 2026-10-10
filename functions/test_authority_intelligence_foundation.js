/**
 * 🔱 OFFICIAL AUTHORITY INTELLIGENCE SYSTEM — UNIT TEST SUITE
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-AG2-PILOT-REGISTRY-AND-PURE-MONITOR-FOUNDATION-20260912
 *
 * Pure Node.js assert test suite.
 * ZERO network calls, ZERO Firestore writes, ZERO filesystem mutation.
 *
 * Run:  node functions/test_authority_intelligence_foundation.js
 * Exit: 0 when all tests pass; 1 otherwise.
 */

'use strict';

const assert = require('assert');
const {
  JURISDICTIONS,
  VALID_STATE_UT_CODES,
  STATE_UT_CODE_ALIASES,
  normalizeStateCode,
  UPDATE_VOCABULARY,
  OPERATIONAL_MODES,
  SUITABILITY_CLASSES,
  SUITABILITY_DECISIONS,
  SUITABILITY_REASON_CODES,
  QUALIFICATION_BREADTH,
  QUALITATIVE_SCALE,
  validateAuthorityEntry,
  canonicalAuthorityRegistry,
  buildValidatedRegistry,
  AuthorityRegistry,
  normalizeOfficialUrl,
  computeUrlHash,
  extractHostname,
  normalizeReferenceString,
  computeSemanticEventSignature,
  generateDedupeDescriptor,
  evaluateMissionSuitability,
  createAuthorityIntelligenceEvent,
} = require('./services/authority_intelligence');

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

// =============================================================================
// TEST GROUP 1: SCHEMA VALIDATION & AUTHORITY KEY GOVERNANCE
// =============================================================================

test('T01: Canonical pilot registry loads all 6 authorities cleanly', () => {
  const all = canonicalAuthorityRegistry.getAll();
  assert.strictEqual(all.length, 6, 'Should load exactly 6 pilot authorities');

  const keys = all.map(a => a.authorityKey).sort();
  const expectedKeys = [
    'auth_in_dl_dsssb',
    'auth_in_nta',
    'auth_in_rj_rpsc',
    'auth_in_rj_rssb',
    'auth_in_ssc',
    'auth_in_upsc',
  ].sort();

  assert.deepStrictEqual(keys, expectedKeys);
});

test('T02: Duplicate authority key is strictly blocked', () => {
  assert.throws(() => {
    buildValidatedRegistry([
      {
        auth_in_upsc: canonicalAuthorityRegistry.getByKey('auth_in_upsc'),
      },
      {
        auth_in_upsc: canonicalAuthorityRegistry.getByKey('auth_in_upsc'),
      },
    ]);
  }, /REGISTRY_INTEGRITY_ERROR.*Duplicate authorityKey/);
});

test('T03: Missing required string fields are rejected', () => {
  const invalid = {
    authorityKey: 'auth_in_test',
    // shortName missing
    fullName: 'Test Authority',
    jurisdiction: JURISDICTIONS.CENTRAL,
    stateCode: null,
    officialDomain: 'test.gov.in',
    allowedOfficialDomains: ['test.gov.in'],
    homePage: 'https://test.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SCHEMA_ERROR.*shortName/);
});

test('T04: Malformed authorityKey format is rejected', () => {
  const invalid = {
    authorityKey: 'UPSC_INVALID_KEY',
    shortName: 'UPSC',
    fullName: 'Union Public Service Commission',
    jurisdiction: JURISDICTIONS.CENTRAL,
    stateCode: null,
    officialDomain: 'upsc.gov.in',
    allowedOfficialDomains: ['upsc.gov.in'],
    homePage: 'https://upsc.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SCHEMA_ERROR.*Invalid authorityKey format/);
});

// =============================================================================
// TEST GROUP 2: JURISDICTION & STATE CODE CONSTRAINTS
// =============================================================================

test('T05: Central authorities must have stateCode: null and no state prefix in key', () => {
  const upsc = canonicalAuthorityRegistry.getByKey('auth_in_upsc');
  assert.strictEqual(upsc.jurisdiction, JURISDICTIONS.CENTRAL);
  assert.strictEqual(upsc.stateCode, null);

  const ssc = canonicalAuthorityRegistry.getByKey('auth_in_ssc');
  assert.strictEqual(ssc.jurisdiction, JURISDICTIONS.CENTRAL);
  assert.strictEqual(ssc.stateCode, null);

  const nta = canonicalAuthorityRegistry.getByKey('auth_in_nta');
  assert.strictEqual(nta.jurisdiction, JURISDICTIONS.CENTRAL);
  assert.strictEqual(nta.stateCode, null);
});

test('T06: Central authority with non-null stateCode is strictly rejected', () => {
  const invalid = {
    authorityKey: 'auth_in_upsc',
    shortName: 'UPSC',
    fullName: 'Union Public Service Commission',
    jurisdiction: JURISDICTIONS.CENTRAL,
    stateCode: 'DL', // VIOLATION: Central cannot have stateCode
    officialDomain: 'upsc.gov.in',
    allowedOfficialDomains: ['upsc.gov.in'],
    homePage: 'https://upsc.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SCHEMA_ERROR.*Central jurisdiction must have stateCode: null/);
});

test('T07: Central authority key with state prefix is strictly rejected', () => {
  const invalid = {
    authorityKey: 'auth_in_dl_upsc', // VIOLATION: Central cannot have state prefix
    shortName: 'UPSC',
    fullName: 'Union Public Service Commission',
    jurisdiction: JURISDICTIONS.CENTRAL,
    stateCode: null,
    officialDomain: 'upsc.gov.in',
    allowedOfficialDomains: ['upsc.gov.in'],
    homePage: 'https://upsc.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SCHEMA_ERROR.*must NOT include a state prefix/);
});

test('T08: Rajasthan jurisdiction requires stateCode: RJ and auth_in_rj_ prefix', () => {
  const rpsc = canonicalAuthorityRegistry.getByKey('auth_in_rj_rpsc');
  assert.strictEqual(rpsc.jurisdiction, JURISDICTIONS.STATE);
  assert.strictEqual(rpsc.stateCode, 'RJ');

  const rssb = canonicalAuthorityRegistry.getByKey('auth_in_rj_rssb');
  assert.strictEqual(rssb.jurisdiction, JURISDICTIONS.STATE);
  assert.strictEqual(rssb.stateCode, 'RJ');
});

test('T09: State authority with missing stateCode is rejected', () => {
  const invalid = {
    authorityKey: 'auth_in_rj_rpsc',
    shortName: 'RPSC',
    fullName: 'Rajasthan Public Service Commission',
    jurisdiction: JURISDICTIONS.STATE,
    stateCode: null, // VIOLATION
    officialDomain: 'rpsc.rajasthan.gov.in',
    allowedOfficialDomains: ['rpsc.rajasthan.gov.in'],
    homePage: 'https://rpsc.rajasthan.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SCHEMA_ERROR.*STATE jurisdiction requires a valid non-empty stateCode string/);
});

test('T10: Delhi UT jurisdiction requires stateCode: DL and auth_in_dl_ prefix', () => {
  const dsssb = canonicalAuthorityRegistry.getByKey('auth_in_dl_dsssb');
  assert.strictEqual(dsssb.jurisdiction, JURISDICTIONS.UT);
  assert.strictEqual(dsssb.stateCode, 'DL');
});

test('T11: Invalid stateCode code is rejected', () => {
  const invalid = {
    authorityKey: 'auth_in_xx_test',
    shortName: 'TEST',
    fullName: 'Test State Commission',
    jurisdiction: JURISDICTIONS.STATE,
    stateCode: 'XX', // VIOLATION: XX is not a valid Indian state/UT code
    officialDomain: 'test.gov.in',
    allowedOfficialDomains: ['test.gov.in'],
    homePage: 'https://test.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SCHEMA_ERROR.*Unrecognized State\/UT code "XX"/);
});

test('T11B: Canonical backend region code parity (DN canonical, DH alias normalized)', () => {
  // Canonical UT code DN must be recognized
  assert.ok(VALID_STATE_UT_CODES.has('DN'), 'Canonical UT code DN must be in VALID_STATE_UT_CODES');
  assert.strictEqual(VALID_STATE_UT_CODES.has('DH'), false, 'Legacy code DH must NOT be in canonical set');

  // Alias normalization
  assert.strictEqual(normalizeStateCode('dh'), 'DN', 'Legacy dh must normalize to canonical DN');
  assert.strictEqual(normalizeStateCode('DH'), 'DN', 'Legacy DH must normalize to canonical DN');
  assert.strictEqual(normalizeStateCode('ts'), 'TG', 'Alias ts must normalize to canonical TG');
  assert.strictEqual(normalizeStateCode('TS'), 'TG', 'Alias TS must normalize to canonical TG');
  assert.strictEqual(normalizeStateCode('RJ'), 'RJ', 'Canonical RJ must normalize to RJ');
  assert.strictEqual(normalizeStateCode('DL'), 'DL', 'Canonical DL must normalize to DL');
  assert.strictEqual(normalizeStateCode('UNKNOWN'), null, 'Invalid code must return null');

  // Authority with valid canonical DN code validates cleanly
  const validDnAuth = {
    authorityKey: 'auth_in_dn_admin',
    shortName: 'DN_ADMIN',
    fullName: 'Dadra and Nagar Haveli and Daman and Diu Administration',
    jurisdiction: JURISDICTIONS.UT,
    stateCode: 'DN',
    officialDomain: 'ddd.gov.in',
    allowedOfficialDomains: ['ddd.gov.in'],
    homePage: 'https://ddd.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.strictEqual(validateAuthorityEntry(validDnAuth), true);

  // Authority with non-canonical alias DH is rejected with explicit normalization instruction
  const invalidDhAuth = {
    ...validDnAuth,
    authorityKey: 'auth_in_dh_admin',
    stateCode: 'DH',
  };
  assert.throws(() => validateAuthorityEntry(invalidDhAuth), /SCHEMA_ERROR.*Non-canonical State\/UT code alias "DH".*Must be normalized to canonical "DN"/);
});

// =============================================================================
// TEST GROUP 3: OFFICIAL DOMAIN & ROLE ENDPOINTS VERIFICATION
// =============================================================================

test('T12: Verified official domains pass, non-approved domains reject', () => {
  // UPSC
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://upsc.gov.in/notices', 'auth_in_upsc'), true);
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://upsconline.nic.in/app', 'auth_in_upsc'), true);
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://fake-upsc.com', 'auth_in_upsc'), false);

  // RPSC
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://rpsc.rajasthan.gov.in/news', 'auth_in_rj_rpsc'), true);
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://rpsc.com', 'auth_in_rj_rpsc'), false);

  // DSSSB
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://dsssb.delhi.gov.in/results', 'auth_in_dl_dsssb'), true);
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://dsssbonline.nic.in', 'auth_in_dl_dsssb'), true);
  assert.strictEqual(canonicalAuthorityRegistry.isDomainApprovedForAuthority('https://delhigovt.org', 'auth_in_dl_dsssb'), false);
});

test('T13: Commercial/coaching domains in allowedOfficialDomains throw security error', () => {
  const invalid = {
    authorityKey: 'auth_in_upsc',
    shortName: 'UPSC',
    fullName: 'Union Public Service Commission',
    jurisdiction: JURISDICTIONS.CENTRAL,
    stateCode: null,
    officialDomain: 'upsc.gov.in',
    allowedOfficialDomains: ['upsc.gov.in', 'testbook.com'], // VIOLATION
    homePage: 'https://upsc.gov.in',
    roleEndpoints: {
      notifications: null, recruitment: null, syllabus: null, calendar: null,
      results: null, answerKeys: null, pyq: null, archive: null,
    },
    knownMajorRecurringExams: [],
    monitoringEnabled: true,
  };
  assert.throws(() => validateAuthorityEntry(invalid), /SECURITY_ERROR.*Forbidden coaching\/search domain/);
});

test('T14: All 8 role endpoint slots are validated in each pilot authority', () => {
  const expectedSlots = ['notifications', 'recruitment', 'syllabus', 'calendar', 'results', 'answerKeys', 'pyq', 'archive'];
  for (const auth of canonicalAuthorityRegistry.getAll()) {
    assert.ok(auth.roleEndpoints, `Authority ${auth.authorityKey} must have roleEndpoints`);
    for (const slot of expectedSlots) {
      assert.ok(slot in auth.roleEndpoints, `Slot ${slot} must exist in ${auth.authorityKey}`);
    }
  }
});

// =============================================================================
// TEST GROUP 4: URL NORMALIZATION & PURITY
// =============================================================================

test('T15: URL normalization strips tracking params and standardizes query string', () => {
  const messy = 'HTTPS://UPSC.GOV.IN:443/Examinations/active-examinations/?utm_source=telegram&b=2&a=1&fbclid=XYZ#section2';
  const clean = normalizeOfficialUrl(messy);
  assert.strictEqual(clean, 'https://upsc.gov.in/Examinations/active-examinations?a=1&b=2');
});

test('T16: computeUrlHash is deterministic', () => {
  const url1 = 'https://rpsc.rajasthan.gov.in/news?year=2026&page=1';
  const url2 = 'HTTPS://rpsc.rajasthan.gov.in:443/news/?page=1&year=2026&utm_campaign=daily';
  assert.strictEqual(computeUrlHash(url1), computeUrlHash(url2));
});

test('T17: Malformed URL input throws URL_NORMALIZATION_ERROR', () => {
  assert.throws(() => normalizeOfficialUrl('not a valid url'), /URL_NORMALIZATION_ERROR/);
});

// =============================================================================
// TEST GROUP 5: DEDUPLICATION & LINEAGE CONTRACTS
// =============================================================================

test('T18: generateDedupeDescriptor produces deterministic eventId and signatures', () => {
  const input = {
    authorityKey: 'auth_in_rj_rpsc',
    officialUrl: 'https://rpsc.rajasthan.gov.in/advertisements/advt_06_2025_26.pdf',
    referenceNumber: 'Advt. No. 06/Exam/Lecturer/2025-26',
    documentSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    examFamily: 'rpsc_1st_grade',
    updateType: 'NEW_NOTIFICATION',
    targetYear: 2026,
  };

  const d1 = generateDedupeDescriptor(input);
  const d2 = generateDedupeDescriptor(input);

  assert.strictEqual(d1.eventId, d2.eventId);
  assert.strictEqual(d1.semanticEventSignature, d2.semanticEventSignature);
  assert.strictEqual(d1.referenceIdentity, 'advt_no_06_exam_lecturer_2025_26');
  assert.strictEqual(d1.binarySha256, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90');
  assert.strictEqual(d1.eventId, 'aievt_a1b2c3d4e5f60718293a4b5c');
});

test('T19: Lineage tracks corrigendum parent connection', () => {
  const corrigendum = generateDedupeDescriptor({
    authorityKey: 'auth_in_rj_rpsc',
    referenceNumber: 'Corrigendum No. 01/2025-26',
    parentReferenceNumber: 'Advt. No. 06/Exam/Lecturer/2025-26',
    parentDocumentSha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    examFamily: 'rpsc_1st_grade',
    updateType: 'CORRIGENDUM',
    targetYear: 2026,
  });

  assert.strictEqual(corrigendum.sourceLineage.isCorrigendumOf, true);
  assert.strictEqual(corrigendum.sourceLineage.parentReference, 'advt_no_06_exam_lecturer_2025_26');
  assert.strictEqual(corrigendum.sourceLineage.parentDocumentSha256, 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90');
});

// =============================================================================
// TEST GROUP 6: UPDATE VOCABULARY & EVENT FACTORY
// =============================================================================

test('T20: All 15 controlled update vocabulary types are accepted by event factory', () => {
  for (const vocab of UPDATE_VOCABULARY) {
    const event = createAuthorityIntelligenceEvent({
      authorityKey: 'auth_in_upsc',
      updateType: vocab,
      operationalMode: OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
      title: `Test ${vocab} announcement`,
      officialUrl: 'https://upsc.gov.in/examinations/active-examinations',
    });

    assert.strictEqual(event.updateType, vocab);
    assert.strictEqual(event.collection, 'authority_intelligence_events');
    assert.strictEqual(event.authorityKey, 'auth_in_upsc');
  }
});

test('T21: Uncontrolled update vocabulary type is rejected', () => {
  assert.throws(() => {
    createAuthorityIntelligenceEvent({
      authorityKey: 'auth_in_upsc',
      updateType: 'RANDOM_BLOG_POST', // VIOLATION
      operationalMode: OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
      title: 'Invalid update',
    });
  }, /INVALID_UPDATE_TYPE.*RANDOM_BLOG_POST/);
});

test('T22: Both operational modes (HISTORICAL_BACKFILL & DAILY_FORWARD_WATCH) are supported', () => {
  const daily = createAuthorityIntelligenceEvent({
    authorityKey: 'auth_in_nta',
    updateType: 'NEW_NOTIFICATION',
    operationalMode: OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
    title: 'JEE Main 2027 Registration Open',
  });
  assert.strictEqual(daily.operationalMode, 'DAILY_FORWARD_WATCH');

  const backfill = createAuthorityIntelligenceEvent({
    authorityKey: 'auth_in_nta',
    updateType: 'PYQ',
    operationalMode: OPERATIONAL_MODES.HISTORICAL_BACKFILL,
    title: 'JEE Main 2023 Official Question Paper',
  });
  assert.strictEqual(backfill.operationalMode, 'HISTORICAL_BACKFILL');
});

test('T23: Event with URL from unapproved domain fails closed', () => {
  assert.throws(() => {
    createAuthorityIntelligenceEvent({
      authorityKey: 'auth_in_dl_dsssb',
      updateType: 'NEW_NOTIFICATION',
      officialUrl: 'https://fake-dsssb-results.com/notice.pdf', // VIOLATION
      title: 'TGT Notice',
    });
  }, /UNAUTHORIZED_DOMAIN_ERROR/);
});

// =============================================================================
// TEST GROUP 7: SUITABILITY CLASSIFICATION (NO ARBITRARY APPLICANT THRESHOLDS)
// =============================================================================

test('T24: Broad eligibility qualification yields BROAD_ELIGIBILITY & CREATE_CANDIDATE', () => {
  const res = evaluateMissionSuitability({
    qualificationType: 'ANY_GRADUATE',
    syllabusScope: 'BROAD_CIVIL_OR_ACADEMIC',
    selectionMode: 'WRITTEN_EXAM',
  });

  assert.strictEqual(res.suitabilityClass, SUITABILITY_CLASSES.BROAD_ELIGIBILITY);
  assert.strictEqual(res.decision, SUITABILITY_DECISIONS.CREATE_CANDIDATE);
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.COMMON_QUALIFICATION));
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.RECURRING_MAJOR_EXAM));
  assert.ok(res.confidence >= 0.95);
});

test('T25: Mainstream technical qualification alone does NOT auto-create (defaults to REVIEW)', () => {
  // Conservative law: Engineering degree alone without high recurrence/scale evidence must NOT create candidate
  const res = evaluateMissionSuitability({
    qualificationType: 'ENGINEERING_DEGREE',
    syllabusScope: 'PROFESSIONAL_TECHNICAL_CURRICULUM',
    selectionMode: 'WRITTEN_EXAM',
  });

  assert.strictEqual(res.suitabilityClass, SUITABILITY_CLASSES.MODERATE_SPECIALIZATION);
  assert.strictEqual(res.decision, SUITABILITY_DECISIONS.REVIEW);
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.SPECIALIZED_QUALIFICATION));
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.INSUFFICIENT_SCALE_EVIDENCE));
});

test('T25B: Mainstream professional qualifications (LAW, CA, NURSING) alone default to REVIEW', () => {
  const lawRes = evaluateMissionSuitability({ qualificationType: 'LAW_LLB', selectionMode: 'WRITTEN_EXAM' });
  assert.strictEqual(lawRes.decision, SUITABILITY_DECISIONS.REVIEW);
  assert.ok(lawRes.reasons.includes(SUITABILITY_REASON_CODES.SPECIALIZED_QUALIFICATION));

  const caRes = evaluateMissionSuitability({ qualificationType: 'COMMERCE_CA_CS', selectionMode: 'WRITTEN_EXAM' });
  assert.strictEqual(caRes.decision, SUITABILITY_DECISIONS.REVIEW);

  const nursingRes = evaluateMissionSuitability({ qualificationType: 'NURSING_BSC', selectionMode: 'WRITTEN_EXAM' });
  assert.strictEqual(nursingRes.decision, SUITABILITY_DECISIONS.REVIEW);

  const phdRes = evaluateMissionSuitability({ qualificationType: 'PHD', selectionMode: 'WRITTEN_EXAM' });
  assert.strictEqual(phdRes.decision, SUITABILITY_DECISIONS.REVIEW);
});

test('T25C: Technical qualification with proven recurring exam & preparation value can CREATE_CANDIDATE', () => {
  const res = evaluateMissionSuitability({
    qualificationType: 'ENGINEERING_DEGREE',
    qualificationBreadth: QUALIFICATION_BREADTH.MAINSTREAM_TECHNICAL,
    syllabusScope: 'PROFESSIONAL_TECHNICAL_CURRICULUM',
    recruitmentRecurrence: QUALITATIVE_SCALE.HIGH,
    participationScale: QUALITATIVE_SCALE.HIGH,
    preparationValue: QUALITATIVE_SCALE.HIGH,
    writtenCompetitiveExamPresent: true,
    hasEstablishedExamKey: true, // e.g. UPSC ESE or State AE
  });

  assert.strictEqual(res.suitabilityClass, SUITABILITY_CLASSES.MODERATE_SPECIALIZATION);
  assert.strictEqual(res.decision, SUITABILITY_DECISIONS.CREATE_CANDIDATE);
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.SPECIALIZED_QUALIFICATION));
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.RECURRING_MAJOR_EXAM));
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.HIGH_PREPARATION_VALUE));
});

test('T25D: Unknown qualification breadth strictly fails closed to REVIEW', () => {
  const res = evaluateMissionSuitability({
    qualificationType: 'COMPLETELY_UNRECOGNIZED_EXPERIENCE_LEVEL',
    selectionMode: 'WRITTEN_EXAM',
  });

  assert.strictEqual(res.decision, SUITABILITY_DECISIONS.REVIEW);
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.UNKNOWN_ELIGIBILITY));
});

test('T25E: Rare specialist qualification strictly yields SKIP', () => {
  const res = evaluateMissionSuitability({
    qualificationType: 'SINGLE_EQUIPMENT_OPERATOR',
    specializationRarity: 'HIGH',
    syllabusScope: 'NARROW_TRADE_TASK',
  });

  assert.strictEqual(res.suitabilityClass, SUITABILITY_CLASSES.NICHE_SPECIALIST);
  assert.strictEqual(res.decision, SUITABILITY_DECISIONS.SKIP);
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.RARE_QUALIFICATION));
});

test('T26: Pure administrative or tender notice yields NICHE_SPECIALIST & SKIP', () => {
  const res = evaluateMissionSuitability({
    isAdministrativeNotice: true,
  });

  assert.strictEqual(res.suitabilityClass, SUITABILITY_CLASSES.NICHE_SPECIALIST);
  assert.strictEqual(res.decision, SUITABILITY_DECISIONS.SKIP);
  assert.ok(res.reasons.includes(SUITABILITY_REASON_CODES.NON_ACADEMIC_ADMINISTRATIVE_NOTICE));
});

test('T27: Direct promotion or interview without written exam yields SKIP', () => {
  const res1 = evaluateMissionSuitability({
    selectionMode: 'DIRECT_PROMOTION',
  });
  assert.strictEqual(res1.decision, SUITABILITY_DECISIONS.SKIP);
  assert.ok(res1.reasons.includes(SUITABILITY_REASON_CODES.NO_WRITTEN_COMPETITIVE_EXAM));

  const res2 = evaluateMissionSuitability({
    writtenCompetitiveExamPresent: false,
  });
  assert.strictEqual(res2.decision, SUITABILITY_DECISIONS.SKIP);
  assert.ok(res2.reasons.includes(SUITABILITY_REASON_CODES.NO_WRITTEN_COMPETITIVE_EXAM));
});

test('T27B: Historical missing targetYear does NOT default to current year', () => {
  const evt = createAuthorityIntelligenceEvent({
    authorityKey: 'auth_in_upsc',
    updateType: 'NEW_NOTIFICATION',
    operationalMode: OPERATIONAL_MODES.HISTORICAL_BACKFILL,
    title: 'Historical UPSC Notification Without Year Specified',
    // targetYear omitted
    referenceNumber: 'Hist-2020-Archive',
    officialUrl: 'https://www.upsc.gov.in/examinations/archive-examinations',
    qualificationType: 'ANY_GRADUATE',
  });

  assert.strictEqual(evt.operationalMode, OPERATIONAL_MODES.HISTORICAL_BACKFILL);
  assert.strictEqual(evt.targetYear, null, 'Missing targetYear must remain null, never defaulted to current year');
  assert.strictEqual(evt.dedupe.semanticSignature.length, 64);
  assert.ok(evt.suitability.reasons.length > 0);
});

// =============================================================================
// TEST GROUP 8: EXTENSIBILITY TEST — 4TH JURISDICTION (HARYANA STATE)
// =============================================================================

test('T28: Fourth jurisdiction (HARYANA / HPSC) can be added purely via data with zero monitor code changes', () => {
  // Define 4th jurisdiction as pure data
  const haryanaRegistry = {
    auth_in_hr_hpsc: {
      authorityKey: 'auth_in_hr_hpsc',
      shortName: 'HPSC',
      fullName: 'Haryana Public Service Commission',
      jurisdiction: JURISDICTIONS.STATE,
      stateCode: 'HR',
      officialDomain: 'hpsc.gov.in',
      allowedOfficialDomains: ['hpsc.gov.in'],
      homePage: 'https://hpsc.gov.in',
      roleEndpoints: {
        notifications: 'https://hpsc.gov.in/en-us/Advertisements',
        recruitment: 'https://hpsc.gov.in/en-us/Advertisements',
        syllabus: 'https://hpsc.gov.in/en-us/Syllabus',
        calendar: 'https://hpsc.gov.in/en-us/Examinations',
        results: 'https://hpsc.gov.in/en-us/Results',
        answerKeys: 'https://hpsc.gov.in/en-us/AnswerKeys',
        pyq: null,
        archive: 'https://hpsc.gov.in/en-us/Archive',
      },
      knownMajorRecurringExams: [
        { examKey: 'hpsc_hcs', displayName: 'Haryana Civil Services (Executive Branch) and other Allied Services' },
        { examKey: 'hpsc_pgt', displayName: 'Post Graduate Teachers (PGT)' },
        { examKey: 'hpsc_assistant_professor', displayName: 'Assistant Professor (College Cadre)' },
      ],
      monitoringEnabled: true,
    },
  };

  // Extend canonical registry purely in-memory
  const extendedRegistry = canonicalAuthorityRegistry.extendWith(haryanaRegistry);

  // Assert registry contains 7 authorities now
  assert.strictEqual(extendedRegistry.getAll().length, 7);

  // Assert lookup by jurisdiction
  const hrAuthorities = extendedRegistry.getByJurisdiction(JURISDICTIONS.STATE, 'HR');
  assert.strictEqual(hrAuthorities.length, 1);
  assert.strictEqual(hrAuthorities[0].authorityKey, 'auth_in_hr_hpsc');
  assert.strictEqual(hrAuthorities[0].stateCode, 'HR');

  // Assert domain validation works seamlessly
  assert.strictEqual(extendedRegistry.isDomainApprovedForAuthority('https://hpsc.gov.in/en-us/Advertisements', 'auth_in_hr_hpsc'), true);
  assert.strictEqual(extendedRegistry.isDomainApprovedForAuthority('https://fake-hpsc.org', 'auth_in_hr_hpsc'), false);

  // Assert event creation works seamlessly for 4th jurisdiction
  const event = createAuthorityIntelligenceEvent({
    authorityKey: 'auth_in_hr_hpsc',
    updateType: 'NEW_NOTIFICATION',
    operationalMode: OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
    title: 'HPSC HCS 2026 Official Notification',
    officialUrl: 'https://hpsc.gov.in/en-us/Advertisements/hcs_2026.pdf',
    referenceNumber: 'Advt. No. 12/2026',
    qualificationType: 'ANY_GRADUATE',
  }, extendedRegistry);

  assert.strictEqual(event.authorityKey, 'auth_in_hr_hpsc');
  assert.strictEqual(event.jurisdiction, 'STATE');
  assert.strictEqual(event.stateCode, 'HR');
  assert.strictEqual(event.suitability.decision, 'CREATE_CANDIDATE');
  assert.strictEqual(event.collection, 'authority_intelligence_events');
});

// =============================================================================
// TEST GROUP 9: STRICT TLS, SAFE_NULL, DOMAIN BOUNDARY & ROLE EVIDENCE
// =============================================================================

test('T29: TLS security forensics — TLS_CERTIFICATE_BYPASS_COUNT is strictly 0', () => {
  const fs = require('fs');
  const path = require('path');

  const runtimeFiles = [
    'functions/verify_pilot_endpoints_live.js',
    'functions/services/authority_intelligence/registry_schema.js',
    'functions/services/authority_intelligence/role_evidence_verifier.js',
    'functions/services/authority_intelligence/registries/central_registry.js',
    'functions/services/authority_intelligence/registries/rajasthan_registry.js',
    'functions/services/authority_intelligence/registries/delhi_ut_registry.js',
  ];

  const bypassPattern = new RegExp('reject' + 'Unauthorized\\s*:\\s*false');
  const envPattern = new RegExp('NODE_TLS_' + 'REJECT_UNAUTHORIZED');
  const insecurePattern = new RegExp('--' + 'insecure');

  let bypassCount = 0;
  for (const rel of runtimeFiles) {
    const full = path.resolve(__dirname, '..', rel);
    if (fs.existsSync(full)) {
      const src = fs.readFileSync(full, 'utf8');
      if (bypassPattern.test(src)) bypassCount++;
      if (envPattern.test(src)) bypassCount++;
      if (insecurePattern.test(src)) bypassCount++;
    }
  }

  assert.strictEqual(bypassCount, 0, 'TLS_CERTIFICATE_BYPASS_COUNT must be strictly 0');
});

test('T30: Strict TLS configuration verification in live verifier script', () => {
  const fs = require('fs');
  const path = require('path');
  const liveVerifierPath = path.resolve(__dirname, 'verify_pilot_endpoints_live.js');
  const src = fs.readFileSync(liveVerifierPath, 'utf8');

  const bypassPattern = new RegExp('reject' + 'Unauthorized\\s*:\\s*false');
  assert.ok(!bypassPattern.test(src), 'Live verifier must not contain certificate bypass');
  assert.ok(src.includes('SSL_OP_LEGACY_SERVER_CONNECT'), 'Live verifier should retain SSL_OP_LEGACY_SERVER_CONNECT for legacy state servers');
});

test('T31: SAFE_NULL is strictly distinct from VERIFIED', () => {
  const { evaluateRoleEvidence, ROLE_EVIDENCE_VERDICTS, ROLE_PROOF_METHODS } = require('./services/authority_intelligence');

  const safeNullContract = {
    slot: 'recruitment',
    canonicalUrl: null,
    expectedFinalHost: null,
    proofMethod: ROLE_PROOF_METHODS.SAFE_NULL,
    expectedPathPattern: null,
    expectedTitleTokens: [],
    expectedPageTokens: [],
    verificationNotes: 'No governed consolidated endpoint.',
  };

  const evalResult = evaluateRoleEvidence(safeNullContract, null, ['ssc.gov.in']);

  assert.strictEqual(evalResult.verdict, ROLE_EVIDENCE_VERDICTS.SAFE_NULL);
  assert.notStrictEqual(evalResult.verdict, ROLE_EVIDENCE_VERDICTS.VERIFIED, 'SAFE_NULL must not equal VERIFIED');
  assert.strictEqual(evalResult.semanticMatch, null, 'SAFE_NULL semanticMatch must be null');
  assert.strictEqual(evalResult.verificationPerformed, false, 'SAFE_NULL verificationPerformed must be false');
  assert.strictEqual(evalResult.reason, 'NO_GOVERNED_CONSOLIDATED_ENDPOINT');
  assert.strictEqual(evalResult.isSafeNull, true);
});

test('T32: Domain boundary security strictly rejects spoof hosts', () => {
  const { isDomainAllowed } = require('./services/authority_intelligence');
  const allowed = ['ssc.gov.in', 'ssc.nic.in'];

  // Valid official domains
  assert.strictEqual(isDomainAllowed('ssc.gov.in', allowed), true);
  assert.strictEqual(isDomainAllowed('sub.ssc.gov.in', allowed), true);
  assert.strictEqual(isDomainAllowed('ssc.nic.in', allowed), true);

  // Malicious spoof/attacker hosts with ssc.gov.in as prefix or substring
  assert.strictEqual(isDomainAllowed('evilssc.gov.in.attacker.example', allowed), false);
  assert.strictEqual(isDomainAllowed('ssc.gov.in.phishing.com', allowed), false);
  assert.strictEqual(isDomainAllowed('fake-ssc.gov.in', allowed), false);
  assert.strictEqual(isDomainAllowed('not-ssc.nic.in', allowed), false);
  assert.strictEqual(isDomainAllowed('attacker.com', allowed), false);
});

test('T33: Cross-domain redirect to unapproved domain fails closed as INVALID', () => {
  const { evaluateRoleEvidence, ROLE_EVIDENCE_VERDICTS, ROLE_PROOF_METHODS } = require('./services/authority_intelligence');

  const contract = {
    slot: 'notifications',
    canonicalUrl: 'https://www.upsc.gov.in/examinations/active-examinations',
    expectedFinalHost: 'www.upsc.gov.in',
    proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
    expectedPathPattern: '^/examinations/active-examinations',
    expectedTitleTokens: ['active-examinations', 'UPSC'],
    verificationNotes: 'UPSC Active Examinations',
  };

  // Simulating probe that followed redirect to external unapproved domain
  const redirectedProbe = {
    status: 200,
    finalUrl: 'https://attacker.com/examinations/active-examinations',
    finalHost: 'attacker.com',
    title: 'active-examinations | UPSC',
    headings: [],
    bodySnippet: 'Active Examinations',
    error: null,
  };

  const res = evaluateRoleEvidence(contract, redirectedProbe, ['upsc.gov.in', 'www.upsc.gov.in']);
  assert.strictEqual(res.verdict, ROLE_EVIDENCE_VERDICTS.INVALID);
  assert.strictEqual(res.semanticMatch, false);
  assert.ok(res.reason.includes('UNAPPROVED_FINAL_HOST') || res.reason.includes('HOST_MISMATCH'));
});

test('T34: Broad single-keyword semantic match is insufficient to prove role', () => {
  const { evaluateRoleEvidence, ROLE_EVIDENCE_VERDICTS, ROLE_PROOF_METHODS } = require('./services/authority_intelligence');

  // Contract expects examination calendar on /examdashboard
  const calendarContract = {
    slot: 'calendar',
    canonicalUrl: 'https://rpsc.rajasthan.gov.in/examdashboard',
    expectedFinalHost: 'rpsc.rajasthan.gov.in',
    proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
    expectedPathPattern: '^/examdashboard',
    expectedTitleTokens: ['RPSC', 'Exam Dashboard'],
    verificationNotes: 'RPSC Exam Dashboard',
  };

  // Probe hits generic homepage that has the word "exam" but wrong path and wrong title
  const genericProbe = {
    status: 200,
    finalUrl: 'https://rpsc.rajasthan.gov.in/home',
    finalHost: 'rpsc.rajasthan.gov.in',
    title: 'RPSC Home Portal',
    headings: ['Welcome to RPSC'],
    bodySnippet: 'Here is an exam notice and circular for general public',
    error: null,
  };

  const res = evaluateRoleEvidence(calendarContract, genericProbe, ['rpsc.rajasthan.gov.in']);
  assert.strictEqual(res.verdict, ROLE_EVIDENCE_VERDICTS.NOT_PROVEN, 'Broad word "exam" on generic home page must NOT prove calendar role');
  assert.strictEqual(res.semanticMatch, false);
});

test('T35: Missing endpoint evidence contract fails closed as NOT_PROVEN', () => {
  const { evaluateRoleEvidence, ROLE_EVIDENCE_VERDICTS } = require('./services/authority_intelligence');

  const probe = {
    status: 200,
    finalUrl: 'https://www.upsc.gov.in/some-endpoint',
    finalHost: 'www.upsc.gov.in',
    title: 'Some Page',
    headings: [],
    bodySnippet: 'Some content',
    error: null,
  };

  // Missing contract (null/undefined)
  const res = evaluateRoleEvidence(null, probe, ['upsc.gov.in', 'www.upsc.gov.in']);
  assert.strictEqual(res.verdict, ROLE_EVIDENCE_VERDICTS.NOT_PROVEN);
  assert.strictEqual(res.semanticMatch, false);
  assert.strictEqual(res.verificationPerformed, false);
});

test('T36: Valid data-driven endpoint evidence contract evaluates to VERIFIED', () => {
  const { evaluateRoleEvidence, ROLE_EVIDENCE_VERDICTS, ROLE_PROOF_METHODS } = require('./services/authority_intelligence');

  const contract = {
    slot: 'notifications',
    canonicalUrl: 'https://www.upsc.gov.in/examinations/active-examinations',
    expectedFinalHost: 'www.upsc.gov.in',
    proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
    expectedPathPattern: '^/examinations/active-examinations',
    expectedTitleTokens: ['active-examinations', 'UPSC'],
    verificationNotes: 'UPSC Active Examinations',
  };

  const validProbe = {
    status: 200,
    finalUrl: 'https://www.upsc.gov.in/examinations/active-examinations',
    finalHost: 'www.upsc.gov.in',
    title: 'active-examinations | UPSC',
    headings: [],
    bodySnippet: 'Active Examinations table',
    error: null,
  };

  const res = evaluateRoleEvidence(contract, validProbe, ['upsc.gov.in', 'www.upsc.gov.in']);
  assert.strictEqual(res.verdict, ROLE_EVIDENCE_VERDICTS.VERIFIED);
  assert.strictEqual(res.semanticMatch, true);
  assert.strictEqual(res.verificationPerformed, true);
});

test('T37: All 6 pilot authorities have complete, valid roleEndpointEvidence contracts across all 48 slots', () => {
  const {
    canonicalAuthorityRegistry,
    ROLE_ENDPOINT_SLOTS,
    ROLE_PROOF_METHODS,
    validateRoleEndpointEvidence,
  } = require('./services/authority_intelligence');

  const authorities = canonicalAuthorityRegistry.getAll();
  assert.strictEqual(authorities.length, 6);

  let totalSlots = 0;
  let nonNullSlots = 0;
  let safeNullSlots = 0;

  for (const auth of authorities) {
    assert.ok(auth.roleEndpointEvidence, 'Authority ' + auth.authorityKey + ' must define roleEndpointEvidence');
    for (const slot of ROLE_ENDPOINT_SLOTS) {
      totalSlots++;
      const declaredUrl = auth.roleEndpoints[slot];
      const evidence = auth.roleEndpointEvidence[slot];

      assert.ok(evidence, 'Missing evidence for ' + auth.authorityKey + ' slot ' + slot);
      validateRoleEndpointEvidence(evidence, slot, declaredUrl, auth.allowedOfficialDomains);

      if (declaredUrl === null) {
        safeNullSlots++;
        assert.strictEqual(evidence.proofMethod, ROLE_PROOF_METHODS.SAFE_NULL);
      } else {
        nonNullSlots++;
        assert.notStrictEqual(evidence.proofMethod, ROLE_PROOF_METHODS.SAFE_NULL);
      }
    }
  }

  assert.strictEqual(totalSlots, 48);
  assert.strictEqual(nonNullSlots, 35);
  assert.strictEqual(safeNullSlots, 13);
});

test('T38: Pure data-driven contracts guarantee zero Firestore writes, zero mission creation, zero publication', () => {
  const {
    createAuthorityIntelligenceEvent,
    canonicalAuthorityRegistry,
    OPERATIONAL_MODES,
  } = require('./services/authority_intelligence');

  const event = createAuthorityIntelligenceEvent({
    authorityKey: 'auth_in_upsc',
    updateType: 'NEW_NOTIFICATION',
    operationalMode: OPERATIONAL_MODES.DAILY_FORWARD_WATCH,
    title: 'Civil Services Examination 2026 Notification',
    officialUrl: 'https://www.upsc.gov.in/examinations/active-examinations',
    referenceNumber: '01/2026-CSP',
    qualificationType: 'ANY_GRADUATE',
  });

  // Factory is a pure in-memory transformer returning an uncommitted event object
  assert.strictEqual(typeof event, 'object');
  assert.strictEqual(event.collection, 'authority_intelligence_events');
  assert.strictEqual(event.triageState, 'PENDING_TRIAGE');
  assert.strictEqual(typeof event.save, 'undefined', 'Event object must not carry database persistence methods');
  assert.strictEqual(typeof event.publish, 'undefined', 'Event object must not carry publication methods');
  assert.strictEqual(typeof event.createMission, 'undefined', 'Event object must not carry mission creation methods');
});

test('T39: Generic NTA homepage must NOT satisfy the NTA notifications role contract', () => {
  const {
    canonicalAuthorityRegistry,
    evaluateRoleEvidence,
    ROLE_EVIDENCE_VERDICTS,
  } = require('./services/authority_intelligence');

  const nta = canonicalAuthorityRegistry.getByKey('auth_in_nta');
  const notificationsEvidence = nta.roleEndpointEvidence.notifications;

  // Simulate probe of generic NTA homepage (https://nta.ac.in/)
  const homepageProbe = {
    status: 200,
    finalUrl: 'https://nta.ac.in/',
    finalHost: 'nta.ac.in',
    title: 'National Testing Agency',
    headings: ['NTA Exams', 'Test Practice', 'National Testing Agency'],
    bodySnippet: 'Welcome to National Testing Agency official website',
    error: null,
  };

  const evalResult = evaluateRoleEvidence(notificationsEvidence, homepageProbe, nta.allowedOfficialDomains);

  assert.strictEqual(
    evalResult.verdict,
    ROLE_EVIDENCE_VERDICTS.NOT_PROVEN,
    'Generic NTA homepage must fail closed as NOT_PROVEN for notifications role'
  );
  assert.strictEqual(evalResult.semanticMatch, false);
  assert.ok(evalResult.reason.includes('PATH_PATTERN_MISMATCH'), 'Must reject due to path mismatch: ' + evalResult.reason);
});

test('T40: NTA NoticeBoardArchive strictly satisfies NTA notifications role contract with path and heading proof', () => {
  const {
    canonicalAuthorityRegistry,
    evaluateRoleEvidence,
    ROLE_EVIDENCE_VERDICTS,
  } = require('./services/authority_intelligence');

  const nta = canonicalAuthorityRegistry.getByKey('auth_in_nta');
  const notificationsEvidence = nta.roleEndpointEvidence.notifications;

  assert.strictEqual(nta.roleEndpoints.notifications, 'https://nta.ac.in/NoticeBoardArchive');
  assert.strictEqual(notificationsEvidence.canonicalUrl, 'https://nta.ac.in/NoticeBoardArchive');
  assert.strictEqual(notificationsEvidence.expectedPathPattern, '^/NoticeBoardArchive');

  // Simulate probe of NoticeBoardArchive
  const noticeBoardProbe = {
    status: 200,
    finalUrl: 'https://nta.ac.in/NoticeBoardArchive',
    finalHost: 'nta.ac.in',
    title: 'National Testing Agency',
    headings: ['NTA Exams', 'Test Practice', 'Notice Board Archive'],
    bodySnippet: 'Public Notice archive table and downloads',
    error: null,
  };

  const evalResult = evaluateRoleEvidence(notificationsEvidence, noticeBoardProbe, nta.allowedOfficialDomains);

  assert.strictEqual(
    evalResult.verdict,
    ROLE_EVIDENCE_VERDICTS.VERIFIED,
    'NoticeBoardArchive must be strictly VERIFIED'
  );
  assert.strictEqual(evalResult.semanticMatch, true);
  assert.strictEqual(evalResult.verificationPerformed, true);
  assert.strictEqual(evalResult.reason, 'DATA_DRIVEN_EVIDENCE_SATISFIED');
});

// =============================================================================
// RUNNER
// =============================================================================

async function run() {
  console.log('🔱 Running Official Authority Intelligence Foundation Tests...\n');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message}`);
      if (err.stack) {
        console.error(`     Stack:\n${err.stack.split('\n').slice(1, 4).join('\n')}`);
      }
      failed++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`Results: Total ${tests.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
