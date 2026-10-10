/**
 * B3 — Canonical Mission Source Preflight & Domain Authority Test Suite (C1 Convergence)
 * Pure Node assert. No emulator, no network, no production.
 * Covers official-source, English-language, cryptographic SHA-256 binding,
 * and canonical Authority Registry domain validation.
 *
 * Run: node functions/test_mission_source_preflight.js
 */

const assert = require('assert');
const crypto = require('crypto');
const {
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
} = require('./services/mission_source_preflight');
const {
  assertAuthorityJurisdictionConsistency,
} = require('./services/authority_intelligence/canonical_authority_domain_validator');
const {
  canonicalAuthorityRegistry,
} = require('./services/authority_intelligence/index');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// Canonical 64-char hex SHA-256 test vectors
const VALID_64_HEX_1 = crypto.createHash('sha256').update('source_payload_1').digest('hex');
const VALID_64_HEX_2 = crypto.createHash('sha256').update('source_payload_2').digest('hex');

const GOOD_SOURCE = {
  sourceId: 'draft_notif_1',
  sourceType: 'notification',
  governanceStatus: 'ACTIVE',
  verificationState: 'verified',
  isOfficial: true,
  officialDomain: 'https://ssc.gov.in',
  authorityKey: 'auth_in_ssc',
  language: 'en',
  expectedSha256: VALID_64_HEX_1,
  actualSha256: VALID_64_HEX_1,
  ingestionProof: null,
  boundMissionId: null,
  boundCycleKey: null,
};

const GOOD_EXPECTATION = {
  missionId: 'ssc_cgl',
  sourceType: 'notification',
  authorityKey: 'auth_in_ssc',
  expectedSha256: VALID_64_HEX_1,
};

function sourceWith(overrides) {
  return { ...GOOD_SOURCE, ...overrides };
}

// --- official-source, language, and verification laws -----------------------

test('S1: good source descriptor PASSES all preflight checks with domain authority bound', () => {
  const report = preflightSourceBinding({ source: GOOD_SOURCE, expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.failures.length, 0);
  assert.strictEqual(report.byteIntegrityProven, true);
  assert.strictEqual(report.domainAuthorityBound, true);
  assert.strictEqual(report.sourceOfficialProven, true);
  assert.strictEqual(report.sourceEnglishProven, true);
  assert.strictEqual(report.BYTE_INTEGRITY_PROVEN, true);
  assert.strictEqual(report.AUTHORITY_DOMAIN_BOUND, true);
  assert.strictEqual(report.SOURCE_OFFICIAL_PROVEN, true);
  assert.strictEqual(report.SOURCE_ENGLISH_PROVEN, true);
  assert.strictEqual(report.domainAuthorityBindingReady, true);
  assert.strictEqual(DOMAIN_AUTHORITY_BINDING_READY, true);
  assert.strictEqual(PRODUCTION_SOURCE_CREATE_READY, false);
});

test('S2: missing sourceId fails with SOURCE_MISSING', () => {
  const report = preflightSourceBinding({ source: sourceWith({ sourceId: '' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_MISSING'));
});

test('S3: unofficial source (isOfficial !== true) fails with SOURCE_NOT_OFFICIAL', () => {
  const report = preflightSourceBinding({ source: sourceWith({ isOfficial: false }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_NOT_OFFICIAL'));
  assert.strictEqual(report.sourceOfficialProven, false);
});

test('S3b: missing or empty officialDomain fails with SOURCE_OFFICIAL_DOMAIN_UNPROVEN', () => {
  const report = preflightSourceBinding({ source: sourceWith({ officialDomain: '' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_OFFICIAL_DOMAIN_UNPROVEN'));
  assert.strictEqual(report.sourceOfficialProven, false);
});

test('S4: non-English language fails with SOURCE_NOT_ENGLISH under current policy', () => {
  for (const lang of ['hi', 'hindi', 'ta', 'te', 'mr', 'es', 'fr', null, '']) {
    const report = preflightSourceBinding({ source: sourceWith({ language: lang }), expectation: GOOD_EXPECTATION });
    assert.strictEqual(report.status, 'FAIL', `Expected '${lang}' to fail English policy`);
    assert.ok(report.failures.some(f => f.code === 'SOURCE_NOT_ENGLISH'));
    assert.strictEqual(report.sourceEnglishProven, false);
  }
});

test('S5: unverified source (verificationState !== "verified") fails with SOURCE_NOT_VERIFIED', () => {
  for (const state of ['pending', 'draft', 'rejected', 'quarantined', null, undefined]) {
    const report = preflightSourceBinding({ source: sourceWith({ verificationState: state }), expectation: GOOD_EXPECTATION });
    assert.strictEqual(report.status, 'FAIL');
    assert.ok(report.failures.some(f => f.code === 'SOURCE_NOT_VERIFIED'));
  }
});

test('S6: role mismatch (sourceType !== expected sourceType) fails with SOURCE_ROLE_MISMATCH', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ sourceType: 'syllabus' }),
    expectation: { ...GOOD_EXPECTATION, sourceType: 'notification' },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_ROLE_MISMATCH'));
});

// --- hash binding laws & crypto proof ----------------------------------------

test('S7: hash present != hash verified — missing proof fails closed', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ actualSha256: undefined, ingestionProof: null }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.byteIntegrityProven, false);
  assert.ok(report.failures.some(f => f.code === 'HASH_PROOF_MISSING' || f.code === 'UNPROVEN_TRUST_REJECTED'));
});

test('S8: actual-bytes digest equal to expected 64-hex hash PASSES (byte integrity proven)', () => {
  const report = preflightSourceBinding({ source: sourceWith({ actualSha256: VALID_64_HEX_1 }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.byteIntegrityProven, true);
});

test('S9: actual-bytes digest mismatch FAILS with HASH_MISMATCH', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ actualSha256: VALID_64_HEX_2 }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.byteIntegrityProven, false);
  assert.ok(report.failures.some(f => f.code === 'HASH_MISMATCH'));
});

test('S10: unproven ingestion proof (option b) FAILS CLOSED without actual bytes sha256', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ actualSha256: undefined, ingestionProof: { trusted: true, sha256: VALID_64_HEX_1, recordId: 'hash_1' } }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.byteIntegrityProven, false);
  assert.ok(report.failures.some(f => f.code === 'UNPROVEN_TRUST_REJECTED' || f.code === 'HASH_PROOF_MISSING'));
});

test('S11: untrusted ingestion proof is not accepted as evidence', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ actualSha256: undefined, ingestionProof: { trusted: false, sha256: VALID_64_HEX_1, recordId: 'hash_1' } }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'UNPROVEN_TRUST_REJECTED' || f.code === 'HASH_PROOF_MISSING'));
});

test('S12: no expected hash recorded at all fails closed', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ expectedSha256: null, actualSha256: undefined, ingestionProof: null }),
    expectation: { ...GOOD_EXPECTATION, expectedSha256: null },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'HASH_PROOF_MISSING'));
});

test('S12b: invalid pseudo-hash format fails closed with HASH_FORMAT_INVALID', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ expectedSha256: 'sha256_draft_notif_1', actualSha256: 'sha256_draft_notif_1' }),
    expectation: { ...GOOD_EXPECTATION, expectedSha256: 'sha256_draft_notif_1' },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'HASH_FORMAT_INVALID'));
});

test('S12c: bare boolean trusted flag without valid 64-hex hash fails closed', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ expectedSha256: null, actualSha256: undefined, ingestionProof: { trusted: true, sha256: 'invalid_sha', recordId: 'r1' } }),
    expectation: { ...GOOD_EXPECTATION, expectedSha256: null },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'UNPROVEN_TRUST_REJECTED' || f.code === 'HASH_PROOF_MISSING' || f.code === 'HASH_FORMAT_INVALID'));
});

// --- canonical authority domain validation laws (C1 convergence) -----------

test('C1: SSC domain positive (auth_in_ssc + ssc.gov.in) PASSES', () => {
  const res = validateAuthorityDomain('auth_in_ssc', 'https://ssc.gov.in/notice');
  assert.strictEqual(res.bound, true);
  assert.strictEqual(res.authorityKey, 'auth_in_ssc');
  assert.strictEqual(res.hostname, 'ssc.gov.in');
});

test('C2: SSC cross-authority negative (auth_in_ssc + rpsc.rajasthan.gov.in) FAILS', () => {
  const res = validateAuthorityDomain('auth_in_ssc', 'https://rpsc.rajasthan.gov.in');
  assert.strictEqual(res.bound, false);
  assert.ok(res.reason.includes('OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND'));
});

test('C3: RPSC positive (auth_in_rj_rpsc + rpsc.rajasthan.gov.in) PASSES', () => {
  const res = validateAuthorityDomain('auth_in_rj_rpsc', 'https://rpsc.rajasthan.gov.in/news');
  assert.strictEqual(res.bound, true);
  assert.strictEqual(res.authorityKey, 'auth_in_rj_rpsc');
  assert.strictEqual(res.stateCode, 'RJ');
});

test('C4: RPSC cross-authority negative (auth_in_rj_rpsc + ssc.gov.in) FAILS', () => {
  const res = validateAuthorityDomain('auth_in_rj_rpsc', 'https://ssc.gov.in');
  assert.strictEqual(res.bound, false);
  assert.ok(res.reason.includes('OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND'));
});

test('C5: DSSSB positive (auth_in_dl_dsssb + dsssb.delhi.gov.in) PASSES', () => {
  const res = validateAuthorityDomain('auth_in_dl_dsssb', 'https://dsssb.delhi.gov.in');
  assert.strictEqual(res.bound, true);
  assert.strictEqual(res.authorityKey, 'auth_in_dl_dsssb');
  assert.strictEqual(res.stateCode, 'DL');
});

test('C6: Unknown authorityKey fails closed', () => {
  const res = validateAuthorityDomain('auth_in_unknown', 'https://ssc.gov.in');
  assert.strictEqual(res.bound, false);
  assert.ok(res.reason.includes('AUTHORITY_NOT_FOUND'));
});

test('C7: Arbitrary unverified domain fails closed for governed mission creation', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ officialDomain: 'https://arbitrary-unverified-domain.com' }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.domainAuthorityBound, false);
  assert.ok(report.failures.some(f => f.code === 'OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND'));
});

test('C8: Suffix spoof domain (ssc.gov.in.attacker.example) fails closed', () => {
  const res = validateAuthorityDomain('auth_in_ssc', 'https://ssc.gov.in.attacker.example/phish');
  assert.strictEqual(res.bound, false);
  assert.ok(res.reason.includes('OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND'));
});

test('C9: Approved secondary domain with correct authority PASSES (dsssbonline.nic.in for DSSSB)', () => {
  const res = validateAuthorityDomain('auth_in_dl_dsssb', 'https://dsssbonline.nic.in');
  assert.strictEqual(res.bound, true);
  assert.strictEqual(res.authorityKey, 'auth_in_dl_dsssb');
});

test('C10: Approved secondary domain with wrong authority FAILS (dsssbonline.nic.in on SSC)', () => {
  const res = validateAuthorityDomain('auth_in_ssc', 'https://dsssbonline.nic.in');
  assert.strictEqual(res.bound, false);
  assert.ok(res.reason.includes('OFFICIAL_DOMAIN_NOT_AUTHORITY_BOUND'));
});

test('C11: Central jurisdiction requires stateCode: null and fails on contradiction', () => {
  assert.doesNotThrow(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_ssc', jurisdictionLevel: 'CENTRAL', stateCode: null });
  });
  assert.throws(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_ssc', jurisdictionLevel: 'STATE', stateCode: 'RJ' });
  }, /JURISDICTION_AUTHORITY_MISMATCH/);
  assert.throws(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_ssc', jurisdictionLevel: 'CENTRAL', stateCode: 'RJ' });
  }, /JURISDICTION_STATE_MISMATCH/);
});

test('C12: Rajasthan jurisdiction requires stateCode: RJ and fails on contradiction', () => {
  assert.doesNotThrow(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_rj_rpsc', jurisdictionLevel: 'STATE', stateCode: 'RJ' });
  });
  assert.throws(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_rj_rpsc', jurisdictionLevel: 'CENTRAL', stateCode: null });
  }, /JURISDICTION_AUTHORITY_MISMATCH/);
  assert.throws(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_rj_rpsc', jurisdictionLevel: 'STATE', stateCode: 'DL' });
  }, /JURISDICTION_STATE_MISMATCH/);
});

test('C13: Delhi UT jurisdiction requires stateCode: DL and fails on contradiction', () => {
  assert.doesNotThrow(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_dl_dsssb', jurisdictionLevel: 'UT', stateCode: 'DL' });
  });
  assert.throws(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_dl_dsssb', jurisdictionLevel: 'STATE', stateCode: 'DL' });
  }, /JURISDICTION_AUTHORITY_MISMATCH/);
  assert.throws(() => {
    assertAuthorityJurisdictionConsistency({ authorityKey: 'auth_in_dl_dsssb', jurisdictionLevel: 'UT', stateCode: 'RJ' });
  }, /JURISDICTION_STATE_MISMATCH/);
});

test('C14: NTA authority validates nta.ac.in and secondary approved domains', () => {
  const res1 = validateAuthorityDomain('auth_in_nta', 'https://nta.ac.in/NoticeBoardArchive');
  assert.strictEqual(res1.bound, true);
  const res2 = validateAuthorityDomain('auth_in_nta', 'https://exams.nta.nic.in');
  assert.strictEqual(res2.bound, true);
  const res3 = validateAuthorityDomain('auth_in_ssc', 'https://nta.ac.in');
  assert.strictEqual(res3.bound, false);
});

test('C15: Missing authorityKey fails closed with AUTHORITY_KEY_UNRESOLVED', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ authorityKey: null }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: null },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.domainAuthorityBound, false);
  assert.ok(report.failures.some(f => f.code === 'AUTHORITY_KEY_UNRESOLVED'));
});

test('C16: Zero fuzzy inference — free-text mission names/orgs do NOT resolve authorityKey', () => {
  assert.strictEqual(resolveCanonicalAuthorityKey('SSC CGL 2026'), null);
  assert.strictEqual(resolveCanonicalAuthorityKey('rec_ssc_ssc_cgl'), null);
  assert.strictEqual(resolveCanonicalAuthorityKey('Staff Selection Commission'), null);
  assert.strictEqual(resolveCanonicalAuthorityKey('UPSC'), null);
  assert.strictEqual(resolveCanonicalAuthorityKey('RPSC'), null);
  assert.strictEqual(resolveCanonicalAuthorityKey('auth_in_ssc'), 'auth_in_ssc');
});

test('C17: Suspicious unapproved domains fail closed (digialm.com, sso.rajasthan.gov.in, ntaresults.nic.in)', () => {
  // digialm.com is not in SSC allowedOfficialDomains
  const res1 = validateAuthorityDomain('auth_in_ssc', 'https://cdn.digialm.com/test');
  assert.strictEqual(res1.bound, false);
  // sso.rajasthan.gov.in is not in RPSC allowedOfficialDomains
  const res2 = validateAuthorityDomain('auth_in_rj_rpsc', 'https://sso.rajasthan.gov.in');
  assert.strictEqual(res2.bound, false);
  // ntaresults.nic.in is not in NTA allowedOfficialDomains
  const res3 = validateAuthorityDomain('auth_in_nta', 'https://ntaresults.nic.in');
  assert.strictEqual(res3.bound, false);
});

test('C18: Dynamic Canonical Registry Domain Snapshot Test (retrieved directly from registry loader)', () => {
  const allAuthorities = canonicalAuthorityRegistry.getAll();
  assert.strictEqual(allAuthorities.length, 6, 'Must have exactly 6 canonical pilot authorities');
  for (const auth of allAuthorities) {
    assert.ok(auth.authorityKey, 'Each authority must have an authorityKey');
    assert.ok(auth.officialDomain, 'Each authority must have an officialDomain');
    assert.ok(Array.isArray(auth.allowedOfficialDomains), 'allowedOfficialDomains must be an array');
    assert.ok(auth.allowedOfficialDomains.length >= 1, 'allowedOfficialDomains must contain at least 1 domain');
    assert.ok(auth.allowedOfficialDomains.includes(auth.officialDomain), 'primary officialDomain must be in allowedOfficialDomains');
    // Validate that primary domain passes validation
    const check = validateAuthorityDomain(auth.authorityKey, auth.officialDomain);
    assert.strictEqual(check.bound, true, `Primary domain '${auth.officialDomain}' must validate for '${auth.authorityKey}'`);
  }
});

test('C19: Independent Proof Separation Test (asserts proofs are orthogonal)', () => {
  // Proof 1: Byte integrity valid, but domain invalid -> byte=true, domain=false, status=FAIL
  const r1 = preflightSourceBinding({
    source: sourceWith({ officialDomain: 'https://unapproved.com' }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(r1.status, 'FAIL');
  assert.strictEqual(r1.byteIntegrityProven, true);
  assert.strictEqual(r1.domainAuthorityBound, false);
  assert.strictEqual(r1.sourceOfficialProven, true);
  assert.strictEqual(r1.sourceEnglishProven, true);

  // Proof 2: Domain valid, but byte integrity invalid -> byte=false, domain=true, status=FAIL
  const r2 = preflightSourceBinding({
    source: sourceWith({ actualSha256: null }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(r2.status, 'FAIL');
  assert.strictEqual(r2.byteIntegrityProven, false);
  assert.strictEqual(r2.domainAuthorityBound, true);
  assert.strictEqual(r2.sourceOfficialProven, true);
  assert.strictEqual(r2.sourceEnglishProven, true);

  // Proof 3: Domain valid, byte valid, but language invalid -> byte=true, domain=true, english=false, status=FAIL
  const r3 = preflightSourceBinding({
    source: sourceWith({ language: 'hi' }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(r3.status, 'FAIL');
  assert.strictEqual(r3.byteIntegrityProven, true);
  assert.strictEqual(r3.domainAuthorityBound, true);
  assert.strictEqual(r3.sourceOfficialProven, true);
  assert.strictEqual(r3.sourceEnglishProven, false);

  // Proof 4: Domain valid, byte valid, language valid, but isOfficial=false -> official=false, status=FAIL
  const r4 = preflightSourceBinding({
    source: sourceWith({ isOfficial: false }),
    expectation: GOOD_EXPECTATION,
  });
  assert.strictEqual(r4.status, 'FAIL');
  assert.strictEqual(r4.byteIntegrityProven, true);
  assert.strictEqual(r4.domainAuthorityBound, true);
  assert.strictEqual(r4.sourceOfficialProven, false);
  assert.strictEqual(r4.sourceEnglishProven, true);
});

// --- multi-source cycle preflight & assertion wrapper -----------------------


test('C20: Source authorityKey matching expected authorityKey PASSES with authorityIdentityMatch: true and sourceAuthorityCorroborated: true', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_ssc', officialDomain: 'https://ssc.gov.in' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc' },
  });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.authorityIdentityMatch, true);
  assert.strictEqual(report.sourceAuthorityCorroborated, true);
  assert.strictEqual(report.domainAuthorityBound, true);
  assert.strictEqual(report.EXPECTED_AUTHORITY_KEY, 'auth_in_ssc');
  assert.strictEqual(report.SOURCE_AUTHORITY_KEY, 'auth_in_ssc');
});

test('C21: Source authorityKey contradicting expected authorityKey FAILS with SOURCE_AUTHORITY_KEY_MISMATCH (RPSC source vs SSC cycle)', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_rj_rpsc', officialDomain: 'https://rpsc.rajasthan.gov.in' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc' },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.authorityIdentityMatch, false);
  assert.strictEqual(report.sourceAuthorityCorroborated, false);
  assert.ok(report.failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH'));
});

test('C22: Same-domain contradiction (SSC domain + RPSC source authorityKey vs SSC cycle) FAILS with SOURCE_AUTHORITY_KEY_MISMATCH', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_rj_rpsc', officialDomain: 'https://ssc.gov.in' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc' },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.strictEqual(report.authorityIdentityMatch, false);
  assert.ok(report.failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH'));
});

test('C23: Source authorityKey absent with explicit valid cycle authorityKey PASSES with sourceAuthorityCorroborated: false, authorityIdentityMatch: true', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ authorityKey: null, officialDomain: 'https://ssc.gov.in' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc' },
  });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.authorityIdentityMatch, true);
  assert.strictEqual(report.sourceAuthorityCorroborated, false);
  assert.strictEqual(report.domainAuthorityBound, true);
});

test('C24: Proof output separation: EXPECTED_AUTHORITY_KEY, SOURCE_AUTHORITY_KEY, AUTHORITY_IDENTITY_MATCH, AUTHORITY_DOMAIN_BOUND are all distinct', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_ssc', officialDomain: 'https://ssc.gov.in' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc' },
  });
  assert.strictEqual(report.EXPECTED_AUTHORITY_KEY, 'auth_in_ssc');
  assert.strictEqual(report.SOURCE_AUTHORITY_KEY, 'auth_in_ssc');
  assert.strictEqual(report.AUTHORITY_IDENTITY_MATCH, true);
  assert.strictEqual(report.SOURCE_AUTHORITY_CORROBORATED, true);
  assert.strictEqual(report.AUTHORITY_DOMAIN_BOUND, true);
  assert.strictEqual(report.BYTE_INTEGRITY_PROVEN, true);
  assert.strictEqual(report.SOURCE_OFFICIAL_PROVEN, true);
  assert.strictEqual(report.SOURCE_ENGLISH_PROVEN, true);
});

test('S15: cycle source preflight PASSES with notification + syllabus valid bindings', () => {
  const bindings = [
    { source: GOOD_SOURCE, expectation: GOOD_EXPECTATION },
    {
      source: sourceWith({
        sourceId: 'draft_syll_1',
        sourceType: 'syllabus',
        authorityKey: 'auth_in_ssc',
        expectedSha256: VALID_64_HEX_2,
        actualSha256: VALID_64_HEX_2,
      }),
      expectation: { missionId: 'ssc_cgl', sourceType: 'syllabus', authorityKey: 'auth_in_ssc', expectedSha256: VALID_64_HEX_2 },
    },
  ];
  const report = preflightCycleSourceBindings({ bindings });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.reports.length, 2);
  assert.strictEqual(report.failures.length, 0);
  assert.strictEqual(report.domainAuthorityBindingReady, true);
});

test('S16: assertCycleSourceBindingsPass throws on failure, returns report on PASS', () => {
  const goodBindings = [{ source: GOOD_SOURCE, expectation: GOOD_EXPECTATION }];
  const passReport = assertCycleSourceBindingsPass({ bindings: goodBindings });
  assert.strictEqual(passReport.status, 'PASS');

  const badBindings = [{ source: sourceWith({ language: 'hi' }), expectation: GOOD_EXPECTATION }];
  assert.throws(
    () => assertCycleSourceBindingsPass({ bindings: badBindings }),
    /SOURCE_PREFLIGHT_FAILED/,
  );
});

test('S17: verifySha256Hex produces identical digest from bytes and string', () => {
  const bytes = Buffer.from('the quick brown fox jumps over the lazy dog');
  const digest = verifySha256Hex(bytes);
  assert.strictEqual(typeof digest, 'string');
  assert.strictEqual(digest.length, 64);
  assert.strictEqual(isValidSha256Hex(digest), true);

  const report = preflightSourceBinding({
    source: sourceWith({ expectedSha256: digest, actualSha256: verifySha256Hex(bytes) }),
    expectation: { ...GOOD_EXPECTATION, expectedSha256: digest },
  });
  assert.strictEqual(report.status, 'PASS');
});


// --- R5: Certified Source Role & Governance Invariant Tests ----------------

test('S18: R5 — notification source role positive PASS', () => {
  const report = preflightSourceBinding({ source: GOOD_SOURCE, expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.failures.length, 0);
});

test('S19: R5 — syllabus source role positive PASS', () => {
  const syllSource = sourceWith({
    sourceId: 'draft_syll_1',
    sourceType: 'syllabus',
    expectedSha256: VALID_64_HEX_2,
    actualSha256: VALID_64_HEX_2,
  });
  const syllExpectation = {
    missionId: 'ssc_cgl',
    sourceType: 'syllabus',
    authorityKey: 'auth_in_ssc',
    expectedSha256: VALID_64_HEX_2,
  };
  const report = preflightSourceBinding({ source: syllSource, expectation: syllExpectation });
  assert.strictEqual(report.status, 'PASS');
  assert.strictEqual(report.failures.length, 0);
});

test('S20: R5 — syllabus-as-notification fails closed with SOURCE_ROLE_MISMATCH', () => {
  const syllSource = sourceWith({
    sourceId: 'draft_syll_1',
    sourceType: 'syllabus',
    expectedSha256: VALID_64_HEX_2,
    actualSha256: VALID_64_HEX_2,
  });
  // Caller expects notification but source is syllabus
  const notifExpectation = {
    missionId: 'ssc_cgl',
    sourceType: 'notification',
    authorityKey: 'auth_in_ssc',
    expectedSha256: VALID_64_HEX_2,
  };
  const report = preflightSourceBinding({ source: syllSource, expectation: notifExpectation });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_ROLE_MISMATCH'));
});

test('S21: R5 — notification-as-syllabus fails closed with SOURCE_ROLE_MISMATCH', () => {
  const notifSource = sourceWith({
    sourceId: 'draft_notif_1',
    sourceType: 'notification',
  });
  // Caller expects syllabus but source is notification
  const syllExpectation = {
    missionId: 'ssc_cgl',
    sourceType: 'syllabus',
    authorityKey: 'auth_in_ssc',
    expectedSha256: VALID_64_HEX_1,
  };
  const report = preflightSourceBinding({ source: notifSource, expectation: syllExpectation });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_ROLE_MISMATCH'));
});

test('S22: R5 — missing sourceType fails closed with SOURCE_ROLE_UNRESOLVED', () => {
  const report1 = preflightSourceBinding({ source: sourceWith({ sourceType: undefined }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report1.status, 'FAIL');
  assert.ok(report1.failures.some(f => f.code === 'SOURCE_ROLE_UNRESOLVED'));

  const report2 = preflightSourceBinding({ source: sourceWith({ sourceType: null }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report2.status, 'FAIL');
  assert.ok(report2.failures.some(f => f.code === 'SOURCE_ROLE_UNRESOLVED'));

  const report3 = preflightSourceBinding({ source: sourceWith({ sourceType: '' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report3.status, 'FAIL');
  assert.ok(report3.failures.some(f => f.code === 'SOURCE_ROLE_UNRESOLVED'));
});

test('S23: R5 — unsupported sourceType fails closed with SOURCE_ROLE_UNSUPPORTED', () => {
  const report1 = preflightSourceBinding({ source: sourceWith({ sourceType: 'brochure' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report1.status, 'FAIL');
  assert.ok(report1.failures.some(f => f.code === 'SOURCE_ROLE_UNSUPPORTED'));

  const report2 = preflightSourceBinding({ source: sourceWith({ sourceType: 'OFFICIAL_CYCLE_DIRECT_NOTIFICATION' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report2.status, 'FAIL');
  assert.ok(report2.failures.some(f => f.code === 'SOURCE_ROLE_UNSUPPORTED'));
});

test('S24: R5 — missing governanceStatus fails closed with SOURCE_GOVERNANCE_NOT_ACTIVE', () => {
  const report1 = preflightSourceBinding({ source: sourceWith({ governanceStatus: undefined }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report1.status, 'FAIL');
  assert.ok(report1.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));

  const report2 = preflightSourceBinding({ source: sourceWith({ governanceStatus: null }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report2.status, 'FAIL');
  assert.ok(report2.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));

  const report3 = preflightSourceBinding({ source: sourceWith({ governanceStatus: '' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report3.status, 'FAIL');
  assert.ok(report3.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));
});

test('S25: R5 — SUPERSEDED governanceStatus fails closed with SOURCE_GOVERNANCE_NOT_ACTIVE', () => {
  const report = preflightSourceBinding({ source: sourceWith({ governanceStatus: 'SUPERSEDED' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));
});

test('S26: R5 — REVOKED governanceStatus fails closed with SOURCE_GOVERNANCE_NOT_ACTIVE', () => {
  const report = preflightSourceBinding({ source: sourceWith({ governanceStatus: 'REVOKED' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));
});

test('S27: R5 — REJECTED governanceStatus fails closed with SOURCE_GOVERNANCE_NOT_ACTIVE', () => {
  const report = preflightSourceBinding({ source: sourceWith({ governanceStatus: 'REJECTED' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));
});

test('S28: R5 — unverified + ACTIVE fails closed with SOURCE_NOT_VERIFIED', () => {
  const report = preflightSourceBinding({ source: sourceWith({ verificationState: 'under_review', governanceStatus: 'ACTIVE' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_NOT_VERIFIED'));
  assert.strictEqual(report.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'), false);
});

test('S29: R5 — verified + non-ACTIVE fails closed with SOURCE_GOVERNANCE_NOT_ACTIVE', () => {
  const report = preflightSourceBinding({ source: sourceWith({ verificationState: 'verified', governanceStatus: 'SUPERSEDED' }), expectation: GOOD_EXPECTATION });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_GOVERNANCE_NOT_ACTIVE'));
  assert.strictEqual(report.failures.some(f => f.code === 'SOURCE_NOT_VERIFIED'), false);
});

test('S30: R5 — role vs authority orthogonality (both fail independently)', () => {
  // Case A: Wrong authority, correct role -> FAIL authority mismatch
  const rA = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_rj_rpsc', officialDomain: 'https://rpsc.rajasthan.gov.in', sourceType: 'notification' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc' },
  });
  assert.strictEqual(rA.status, 'FAIL');
  assert.ok(rA.failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH'));
  assert.strictEqual(rA.failures.some(f => f.code === 'SOURCE_ROLE_MISMATCH'), false);

  // Case B: Correct authority, wrong role -> FAIL role mismatch
  const rB = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_ssc', sourceType: 'syllabus' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc', sourceType: 'notification' },
  });
  assert.strictEqual(rB.status, 'FAIL');
  assert.ok(rB.failures.some(f => f.code === 'SOURCE_ROLE_MISMATCH'));
  assert.strictEqual(rB.failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH'), false);

  // Case C: Wrong authority AND wrong role -> FAIL BOTH
  const rC = preflightSourceBinding({
    source: sourceWith({ authorityKey: 'auth_in_rj_rpsc', officialDomain: 'https://rpsc.rajasthan.gov.in', sourceType: 'syllabus' }),
    expectation: { ...GOOD_EXPECTATION, authorityKey: 'auth_in_ssc', sourceType: 'notification' },
  });
  assert.strictEqual(rC.status, 'FAIL');
  assert.ok(rC.failures.some(f => f.code === 'SOURCE_AUTHORITY_KEY_MISMATCH'));
  assert.ok(rC.failures.some(f => f.code === 'SOURCE_ROLE_MISMATCH'));
});

test('S31: R5-R1 — expectation.sourceType absent fails with EXPECTED_SOURCE_ROLE_UNRESOLVED', () => {
  const badExpectation = { ...GOOD_EXPECTATION };
  delete badExpectation.sourceType;
  const report = preflightSourceBinding({ source: GOOD_SOURCE, expectation: badExpectation });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNRESOLVED'));
});

test('S32: R5-R1 — expectation.sourceType undefined, null, or empty string fails closed', () => {
  const r1 = preflightSourceBinding({ source: GOOD_SOURCE, expectation: { ...GOOD_EXPECTATION, sourceType: undefined } });
  assert.strictEqual(r1.status, 'FAIL');
  assert.ok(r1.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNRESOLVED'));

  const r2 = preflightSourceBinding({ source: GOOD_SOURCE, expectation: { ...GOOD_EXPECTATION, sourceType: null } });
  assert.strictEqual(r2.status, 'FAIL');
  assert.ok(r2.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNRESOLVED'));

  const r3 = preflightSourceBinding({ source: GOOD_SOURCE, expectation: { ...GOOD_EXPECTATION, sourceType: '   ' } });
  assert.strictEqual(r3.status, 'FAIL');
  assert.ok(r3.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNRESOLVED'));
});

test('S33: R5-R1 — expectation.sourceType unsupported fails with EXPECTED_SOURCE_ROLE_UNSUPPORTED', () => {
  const r1 = preflightSourceBinding({ source: GOOD_SOURCE, expectation: { ...GOOD_EXPECTATION, sourceType: 'brochure' } });
  assert.strictEqual(r1.status, 'FAIL');
  assert.ok(r1.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNSUPPORTED'));

  const r2 = preflightSourceBinding({ source: GOOD_SOURCE, expectation: { ...GOOD_EXPECTATION, sourceType: 'OFFICIAL_CYCLE_DIRECT_NOTIFICATION' } });
  assert.strictEqual(r2.status, 'FAIL');
  assert.ok(r2.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNSUPPORTED'));
});

test('S34: R5-R1 — expectation.sourceType non-string types fail closed without TypeError', () => {
  for (const badType of [123, true, false, {}, [], () => {}]) {
    const report = preflightSourceBinding({ source: GOOD_SOURCE, expectation: { ...GOOD_EXPECTATION, sourceType: badType } });
    assert.strictEqual(report.status, 'FAIL');
    assert.ok(report.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNSUPPORTED'));
  }
});

test('S35: R5-R1 — source role and expected role failures are collected independently', () => {
  const report = preflightSourceBinding({
    source: sourceWith({ sourceType: null }),
    expectation: { ...GOOD_EXPECTATION, sourceType: null },
  });
  assert.strictEqual(report.status, 'FAIL');
  assert.ok(report.failures.some(f => f.code === 'SOURCE_ROLE_UNRESOLVED'));
  assert.ok(report.failures.some(f => f.code === 'EXPECTED_SOURCE_ROLE_UNRESOLVED'));
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------
async function main() {
  let passed = 0;
  let failed = 0;
  console.log(`Running ${tests.length} Mission Source Preflight (B3 / C1) tests...`);
  for (const t of tests) {
    try {
      await t.fn();
      passed++;
      console.log(`  PASS: ${t.name}`);
    } catch (err) {
      failed++;
      console.error(`  FAIL: ${t.name}`);
      console.error(`    ${err.message}`);
    }
  }
  console.log(`-------------------------------------------------------------------------------`);
  console.log(`TEST_COUNT=${tests.length} PASS_COUNT=${passed} FAIL_COUNT=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
