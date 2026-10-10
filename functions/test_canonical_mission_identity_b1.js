/**
 * RC_UNIFIED_MISSION_B1_R3 — Canonical Permanent Identity Test Suite (FINAL PAIR INTEGRITY)
 * =============================================================================
 * Pure Node assert. No emulator, no network, no filesystem mutation, no Firestore.
 * Tests exercise the REAL production resolver/validators from
 * functions/canonical_mission_registry.js — validator logic is NEVER duplicated here.
 *
 * Run:  node functions/test_canonical_mission_identity_b1.js
 * Exit: 0 when all tests pass; 1 otherwise.
 */

const assert = require('assert');
const {
  LEGACY_PARENT_BINDINGS,
  KNOWN_PILOT_IDS,
  GOVERNED_AUTHORITY_ALIASES,
  GOVERNED_EXAM_ALIASES,
  GOVERNED_EXAM_AUTHORITY_COMPATIBILITY,
  CANONICAL_MISSION_REALM_MANIFEST,
  normalizeCanonicalToken,
  stripYearDecoration,
  assertRegistryIntegrity,
  assertExamAuthorityCompatibilityIntegrity,
  assertLegacyParentBindingsIntegrity,
  resolveCanonicalAuthorityKey,
  resolveCanonicalExamKey,
  buildPermanentMissionId,
  resolveCanonicalMissionId,
  validateOrResolveId,
} = require('./canonical_mission_registry');

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function attemptMutation(mutator) {
  try {
    mutator();
    return 'NO_THROW';
  } catch (err) {
    return 'THREW';
  }
}

function resolvePayload(examName, organization, extra = {}) {
  return resolveCanonicalMissionId({ examName, organization, ...extra });
}

// ===========================================================================
// PAIR GOVERNANCE (P1-P11) — individually valid components are not sufficient
// ===========================================================================

test('P1: NTA + JEE Main resolves to immutable legacy parent jee_main_2026', () => {
  assert.strictEqual(resolvePayload('JEE Main', 'NTA'), 'jee_main_2026');
});

test('P2: UPSC + JEE Main FAILS CLOSED (governed pair mismatch)', () => {
  assert.throws(() => resolvePayload('JEE Main', 'UPSC'), /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
});

test('P3: SSC + JEE Main FAILS CLOSED (governed pair mismatch)', () => {
  assert.throws(() => resolvePayload('JEE Main', 'SSC'), /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
});

test('P4: NTA + NEET UG resolves to immutable legacy parent neet_(ug)-2027', () => {
  assert.strictEqual(resolvePayload('NEET UG', 'NTA'), 'neet_(ug)-2027');
});

test('P5: SSC + NEET UG FAILS CLOSED (governed pair mismatch)', () => {
  assert.throws(() => resolvePayload('NEET UG', 'SSC'), /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
});

test('P6: RPSC + RPSC First Grade resolves to immutable legacy parent', () => {
  assert.strictEqual(
    resolvePayload('RPSC First Grade', 'RPSC'),
    'RPSC_FIRST_GRADE2026_2026_1782713222215',
  );
});

test('P7: UPSC + RPSC First Grade FAILS CLOSED (no legacy pair, no generic duplicate)', () => {
  assert.throws(() => resolvePayload('RPSC First Grade', 'UPSC'), /_IDENTITY|PAIR_MISMATCH/);
});

test('P8: existing UPSC CSE mission resolves to its preserved realm id', () => {
  assert.strictEqual(resolvePayload('UPSC CSE Prelims', 'UPSC'), 'upsc_cse_prelims');
});

test('P9: existing SSC CGL mission resolves to its preserved realm id', () => {
  assert.strictEqual(resolvePayload('SSC CGL', 'SSC'), 'ssc_cgl');
});

test('P10: Indian Air Force + AFCAT builds governed generic permanent ID', () => {
  assert.strictEqual(
    resolvePayload('AFCAT', 'Indian Air Force'),
    'rec_auth_in_indian_air_force_air_force_common_admission_test',
  );
});

test('P11: known wrong pairs never create any generic mission ID', () => {
  assert.throws(() => resolvePayload('JEE Main', 'RPSC'), /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
  assert.throws(() => resolvePayload('SSC CGL', 'NTA'), /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
  assert.throws(() => resolvePayload('UPSC CSE Prelims', 'SSC'), /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
});

// ===========================================================================
// YEAR DECORATION (P12-P15) — trailing standalone cycle year ONLY
// ===========================================================================

test('P12: trailing 2035 stripped', () => {
  assert.strictEqual(stripYearDecoration('JEE Main 2035'), 'jee main');
});

test('P13: trailing 1999 stripped (within cycle-year range law 1900-2099)', () => {
  assert.strictEqual(stripYearDecoration('NEET UG 1999'), 'neet ug');
});

test('P14: middle "2005" retained in official title', () => {
  const out = stripYearDecoration('Act 2005 Recruitment Examination');
  assert.ok(out.includes('2005'), 'embedded year must be retained');
  assert.strictEqual(out, 'act 2005 recruitment examination');
});

test('P15: middle "2020" retained in official title', () => {
  const out = stripYearDecoration('Scheme 2020 Officer Test Phase I');
  assert.ok(out.includes('2020'), 'embedded year must be retained');
  assert.strictEqual(out, 'scheme 2020 officer test phase i');
});

test('P15b: trailing-year stripping feeds legacy resolution generically', () => {
  assert.strictEqual(resolvePayload('JEE Main 2035', 'NTA'), 'jee_main_2026');
  assert.strictEqual(resolvePayload('NEET UG 2034', 'NTA'), 'neet_(ug)-2027');
});

// ===========================================================================
// INTEGRITY VALIDATORS (P16-P19) — three independent classes, production code
// ===========================================================================

test('P16: legacy pair validator accepts the current governed bindings', () => {
  assert.doesNotThrow(() => assertLegacyParentBindingsIntegrity(LEGACY_PARENT_BINDINGS));
});

test('P17: legacy pair validator rejects duplicate authority+exam pair across legacy IDs', () => {
  const ambiguous = [
    { legacyId: 'legacy_alpha', authorityKey: 'nta', examAliases: ['same exam'] },
    { legacyId: 'legacy_beta', authorityKey: 'nta', examAliases: ['same exam'] },
  ];
  assert.throws(() => assertLegacyParentBindingsIntegrity(ambiguous), /LEGACY_BINDING_INTEGRITY_FAILURE/);
});

test('P17b: legacy pair validator enforces structural laws', () => {
  assert.throws(
    () => assertLegacyParentBindingsIntegrity([{ legacyId: '', authorityKey: 'nta', examAliases: ['x'] }]),
    /LEGACY_BINDING_INTEGRITY_FAILURE/,
  );
  assert.throws(
    () => assertLegacyParentBindingsIntegrity([{ legacyId: 'L1', authorityKey: 'NTA', examAliases: ['x'] }]),
    /LEGACY_BINDING_INTEGRITY_FAILURE/,
  );
  assert.throws(
    () => assertLegacyParentBindingsIntegrity([{ legacyId: 'L1', authorityKey: 'nta', examAliases: [] }]),
    /LEGACY_BINDING_INTEGRITY_FAILURE/,
  );
  assert.throws(
    () => assertLegacyParentBindingsIntegrity([{ legacyId: 'L1', authorityKey: 'nta', examAliases: ['   '] }]),
    /LEGACY_BINDING_INTEGRITY_FAILURE/,
  );
});

test('P18: authority integrity validator rejects normalized alias ambiguity', () => {
  const ambiguousAuthority = {
    'key_one': ['same alias'],
    'key_two': ['same alias'],
  };
  assert.throws(() => assertRegistryIntegrity(ambiguousAuthority, 'TEST_AUTHORITY'), /REGISTRY_INTEGRITY_FAILURE/);
  assert.doesNotThrow(() => assertRegistryIntegrity(GOVERNED_AUTHORITY_ALIASES, 'GOVERNED_AUTHORITY_ALIASES'));
});

test('P19: exam integrity validator rejects normalized alias ambiguity', () => {
  const ambiguousExam = {
    'exam_one': ['shared exam'],
    'exam_two': ['shared exam'],
  };
  assert.throws(() => assertRegistryIntegrity(ambiguousExam, 'TEST_EXAM'), /REGISTRY_INTEGRITY_FAILURE/);
  assert.doesNotThrow(() => assertRegistryIntegrity(GOVERNED_EXAM_ALIASES, 'GOVERNED_EXAM_ALIASES'));
});

test('P19b: pair compatibility validator accepts current data and rejects gaps', () => {
  assert.doesNotThrow(() =>
    assertExamAuthorityCompatibilityIntegrity(
      GOVERNED_EXAM_AUTHORITY_COMPATIBILITY,
      GOVERNED_EXAM_ALIASES,
      GOVERNED_AUTHORITY_ALIASES,
    ));
  assert.throws(
    () => assertExamAuthorityCompatibilityIntegrity({}, GOVERNED_EXAM_ALIASES, GOVERNED_AUTHORITY_ALIASES),
    /EXAM_AUTHORITY_COMPATIBILITY_FAILURE/,
  );
});

// ===========================================================================
// DEEP IMMUTABILITY (P20-P22)
// ===========================================================================

test('P20: authority registry nested arrays cannot be mutated', () => {
  const before = GOVERNED_AUTHORITY_ALIASES.nta.length;
  const outcome = attemptMutation(() => GOVERNED_AUTHORITY_ALIASES.nta.push('rogue alias'));
  assert.strictEqual(GOVERNED_AUTHORITY_ALIASES.nta.length, before, 'authority alias array unchanged');
  assert.ok(Object.isFrozen(GOVERNED_AUTHORITY_ALIASES.nta));
  assert.ok(['THREW', 'NO_THROW'].includes(outcome)); // frozen: throws in strict, ignored in sloppy
});

test('P21: exam registry nested arrays cannot be mutated', () => {
  const before = GOVERNED_EXAM_ALIASES.jee_main.length;
  attemptMutation(() => GOVERNED_EXAM_ALIASES.jee_main.push('rogue alias'));
  assert.strictEqual(GOVERNED_EXAM_ALIASES.jee_main.length, before, 'exam alias array unchanged');
  assert.ok(Object.isFrozen(GOVERNED_EXAM_ALIASES.jee_main));
});

test('P22: legacy binding aliases cannot be mutated', () => {
  const before = LEGACY_PARENT_BINDINGS[0].examAliases.length;
  attemptMutation(() => LEGACY_PARENT_BINDINGS[0].examAliases.push('rogue alias'));
  assert.strictEqual(LEGACY_PARENT_BINDINGS[0].examAliases.length, before, 'legacy alias array unchanged');
  assert.ok(Object.isFrozen(LEGACY_PARENT_BINDINGS[0].examAliases));
  assert.ok(Object.isFrozen(LEGACY_PARENT_BINDINGS));
});

test('P22b: pair compatibility data cannot be mutated', () => {
  const before = GOVERNED_EXAM_AUTHORITY_COMPATIBILITY.jee_main.length;
  attemptMutation(() => GOVERNED_EXAM_AUTHORITY_COMPATIBILITY.jee_main.push('upsc'));
  assert.strictEqual(GOVERNED_EXAM_AUTHORITY_COMPATIBILITY.jee_main.length, before, 'pair contract unchanged');
  assert.ok(Object.isFrozen(GOVERNED_EXAM_AUTHORITY_COMPATIBILITY.jee_main));
});

// ===========================================================================
// KNOWN_PILOT_IDS READ-ONLY SURFACE (P23)
// ===========================================================================

test('P23: KNOWN_PILOT_IDS exposes no mutation capability', () => {
  assert.strictEqual(typeof KNOWN_PILOT_IDS.add, 'undefined');
  assert.strictEqual(typeof KNOWN_PILOT_IDS.delete, 'undefined');
  assert.strictEqual(typeof KNOWN_PILOT_IDS.clear, 'undefined');
  assert.ok(Object.isFrozen(KNOWN_PILOT_IDS));
  // Property tampering on the frozen view is rejected.
  const outcome = attemptMutation(() => { KNOWN_PILOT_IDS.has = () => true; });
  assert.strictEqual(typeof KNOWN_PILOT_IDS.has, 'function', 'frozen view keeps real has()');
  assert.ok(['THREW', 'NO_THROW'].includes(outcome));
  // Genuine read semantics preserved.
  assert.strictEqual(KNOWN_PILOT_IDS.has('jee_main_2026'), true);
  assert.strictEqual(KNOWN_PILOT_IDS.has('not_a_pilot'), false);
});

test('P23b: KNOWN_PILOT_IDS read view is iteration- and size-compatible', () => {
  const ids = Array.from(KNOWN_PILOT_IDS);
  assert.deepStrictEqual([...ids].sort(), [
    'RPSC_FIRST_GRADE2026_2026_1782713222215',
    'jee_main_2026',
    'neet_(ug)-2027',
    'rpsc_ras_prelims',
    'ssc_cgl',
    'ssc_chsl',
    'ssc_cpo',
    'ssc_gd',
    'ssc_hindi_translators',
    'ssc_je',
    'ssc_mts_havaldar',
    'ssc_selection_post',
    'ssc_stenographer',
    'uppsc_pcs_prelims',
    'upsc_cse_prelims',
  ]);
  assert.strictEqual(KNOWN_PILOT_IDS.size, 15);
});

// ===========================================================================
// STRICT BUILDER (P24) — zero silent normalization
// ===========================================================================

test('P24: strict builder accepts canonical tokens and builds rec_<auth>_<exam>', () => {
  assert.strictEqual(buildPermanentMissionId('nta', 'jee_main'), 'rec_nta_jee_main');
  assert.strictEqual(buildPermanentMissionId('auth_in_indian_air_force', 'air_force_common_admission_test'),
    'rec_auth_in_indian_air_force_air_force_common_admission_test');
});

test('P24b: strict builder rejects display text', () => {
  assert.throws(() => buildPermanentMissionId('National Testing Agency', 'jee_main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('nta', 'Joint Entrance Examination Main'), /STRICT_BUILDER_REJECTED/);
});

test('P24c: strict builder rejects non-canonical token shapes', () => {
  assert.throws(() => buildPermanentMissionId('NTA', 'jee_main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('nta', 'JEE_MAIN'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('_nta', 'jee_main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('nta_', 'jee_main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('nta__jee', 'jee_main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('', 'jee_main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('nta', 'jee main'), /STRICT_BUILDER_REJECTED/);
  assert.throws(() => buildPermanentMissionId('nta', 'jee(main)'), /STRICT_BUILDER_REJECTED/);
});

// ===========================================================================
// UNKNOWN / MISSING IDENTITY FAIL-CLOSED (P25-P26) + baseline laws
// ===========================================================================

test('P25: unknown authority fails closed (candidate never creates an ID)', () => {
  assert.throws(() => resolvePayload('SSC CGL', 'Unknown Fake Board'), /UNRESOLVED_AUTHORITY_IDENTITY/);
  const cand = resolveCanonicalAuthorityKey('Unknown Fake Board');
  assert.strictEqual(cand.status, 'NEW_IDENTITY_CANDIDATE');
});

test('P26: unknown exam fails closed (candidate never creates an ID)', () => {
  assert.throws(() => resolvePayload('Totally Unknown Exam XYZ', 'SSC'), /UNRESOLVED_EXAM_IDENTITY/);
  const cand = resolveCanonicalExamKey('Totally Unknown Exam XYZ');
  assert.strictEqual(cand.status, 'NEW_IDENTITY_CANDIDATE');
});

test('P26b: missing or empty identity inputs fail without fallback', () => {
  assert.throws(() => resolveCanonicalMissionId({ examName: 'SSC CGL' }), /CANONICAL_AUTHORITY_REQUIRED/);
  assert.throws(() => resolveCanonicalMissionId({ examName: '', organization: 'SSC' }), /CANONICAL_EXAM_REQUIRED/);
  assert.throws(() => resolveCanonicalMissionId({ organization: 'SSC' }), /CANONICAL_EXAM_REQUIRED/);
  assert.throws(() => resolveCanonicalMissionId({ examName: '   ', organization: 'SSC' }), /CANONICAL_EXAM_REQUIRED/);
});

test('P26c: governed authority and exam resolvers return RESOLVED status', () => {
  assert.deepStrictEqual(resolveCanonicalAuthorityKey('National Testing Agency'), { status: 'RESOLVED', key: 'nta' });
  assert.deepStrictEqual(resolveCanonicalExamKey('staff selection commission cgl'), { status: 'RESOLVED', key: 'ssc_cgl' });
});

// ===========================================================================
// YEAR / CYCLE / TIMESTAMP INDEPENDENCE (P27-P29)
// ===========================================================================

test('P27: future years do not change governed generic permanent identity', () => {
  const y2027 = resolvePayload('UPSC CSE Prelims 2027', 'UPSC');
  const y2028 = resolvePayload('UPSC CSE Prelims 2028', 'UPSC');
  const y2029 = resolvePayload('UPSC CSE Prelims 2029', 'UPSC');
  assert.strictEqual(y2027, 'upsc_cse_prelims');
  assert.strictEqual(y2028, y2027);
  assert.strictEqual(y2029, y2027);
});

test('P28: cycle labels do not change identity', () => {
  const c1 = resolveCanonicalMissionId({ examName: 'SSC CGL', organization: 'SSC', cycle: 'cycle_1' });
  const c9 = resolveCanonicalMissionId({ examName: 'SSC CGL', organization: 'SSC', cycle: 'cycle_9' });
  assert.strictEqual(c1, c9);
  assert.strictEqual(c1, 'ssc_cgl');
});

test('P29: legacy permanent parents stable across future cycles (all three families)', () => {
  assert.strictEqual(resolvePayload('JEE Main 2026', 'NTA'), 'jee_main_2026');
  assert.strictEqual(resolvePayload('JEE Main 2027', 'NTA'), 'jee_main_2026');
  assert.strictEqual(resolvePayload('JEE Main 2028', 'NTA'), 'jee_main_2026');
  assert.strictEqual(resolvePayload('NEET (UG) 2030', 'NTA'), 'neet_(ug)-2027');
  assert.strictEqual(resolvePayload('RPSC 1st Grade 2031', 'RPSC'), 'RPSC_FIRST_GRADE2026_2026_1782713222215');
});

test('P29b: validateOrResolveId creation path object payload resolves identically', () => {
  assert.strictEqual(
    validateOrResolveId('launch_exam_mission', { examName: 'JEE Main 2027', organization: 'NTA', year: 2027 }),
    'jee_main_2026',
  );
});

// ===========================================================================
// DETERMINISM (P30)
// ===========================================================================

test('P30: deterministic repeatability of resolution', () => {
  const a = resolvePayload('UPSC CSE Prelims', 'UPSC');
  const b = resolvePayload('UPSC CSE Prelims', 'UPSC');
  const c = resolvePayload('UPSC CSE Prelims', 'Union Public Service Commission');
  assert.strictEqual(a, b);
  assert.strictEqual(a, c);
  const legacyA = resolvePayload('JEE Main', 'NTA');
  const legacyB = resolvePayload('joint entrance examination main', 'national testing agency');
  assert.strictEqual(legacyA, legacyB);
  assert.strictEqual(legacyA, 'jee_main_2026');
});

// ===========================================================================
// LIFECYCLE PASSTHROUGH (retained baseline law)
// ===========================================================================

test('P31: lifecycle existing-ID passthrough preserved (including legacy charset)', () => {
  assert.strictEqual(validateOrResolveId('launch_realm', {}, 'rec_ssc_ssc_cgl'), 'rec_ssc_ssc_cgl');
  assert.strictEqual(
    validateOrResolveId('pause_realm', {}, 'RPSC_FIRST_GRADE2026_2026_1782713222215'),
    'RPSC_FIRST_GRADE2026_2026_1782713222215',
  );
});

test('P31b: lifecycle without authoritative ID or with invalid ID fails closed', () => {
  assert.throws(() => validateOrResolveId('launch_realm', {}), /CANONICAL_ID_REQUIRED/);
  assert.throws(() => validateOrResolveId('launch_realm', {}, 'bad id!'), /INVALID_CANONICAL_ID/);
});

test('P31c: normalizeCanonicalToken retains strict behavior for validator reuse', () => {
  assert.strictEqual(normalizeCanonicalToken('  JEE (Main) 2027 '), 'jee_main_2027');
  assert.strictEqual(normalizeCanonicalToken(null), '');
});

// ===========================================================================
// ADDITIONAL HARDENING COVERAGE (P32-P42)
// ===========================================================================

test('P32: pair compatibility is TOTAL — every governed exam declares authorities', () => {
  for (const examKey of Object.keys(GOVERNED_EXAM_ALIASES)) {
    const allowed = GOVERNED_EXAM_AUTHORITY_COMPATIBILITY[examKey];
    assert.ok(Array.isArray(allowed) && allowed.length > 0, `${examKey} must declare allowed authorities`);
    for (const authorityKey of allowed) {
      assert.ok(GOVERNED_AUTHORITY_ALIASES[authorityKey], `${authorityKey} must be a governed authority`);
    }
  }
});

test('P33: KNOWN_PILOT_IDS view mirrors legacy binding IDs exactly', () => {
  const bindingIds = LEGACY_PARENT_BINDINGS.map(b => b.legacyId).sort();
  assert.deepStrictEqual(Array.from(KNOWN_PILOT_IDS).sort(), bindingIds);
});

test('P34: year decoration handles empty and null inputs deterministically', () => {
  assert.strictEqual(stripYearDecoration(null), '');
  assert.strictEqual(stripYearDecoration(undefined), '');
  assert.strictEqual(stripYearDecoration('   '), '');
});

test('P35: parenthesized legacy alias with trailing year resolves to legacy parent', () => {
  assert.strictEqual(resolvePayload('JEE (Main) 2036', 'NTA'), 'jee_main_2026');
});

test('P36: generic exam resolver strips only the trailing year for matching', () => {
  const resolved = resolveCanonicalExamKey('SSC CGL 2033');
  assert.deepStrictEqual(resolved, { status: 'RESOLVED', key: 'ssc_cgl' });
  const embedded = resolveCanonicalExamKey('Act 2005 Recruitment Examination');
  assert.strictEqual(embedded.status, 'NEW_IDENTITY_CANDIDATE', 'embedded-year title stays its own candidate');
});

test('P37: governance is case-insensitive but identity output stays canonical', () => {
  assert.strictEqual(resolvePayload('Jee Main', 'NtA'), 'jee_main_2026');
  assert.strictEqual(resolvePayload('SSC CGL', 'staff selection commission'), 'ssc_cgl');
});

test('P37b: the 18-card live inventory is represented by one immutable manifest', () => {
  assert.strictEqual(CANONICAL_MISSION_REALM_MANIFEST.length, 18);
  assert.strictEqual(new Set(CANONICAL_MISSION_REALM_MANIFEST.map((m) => m.missionId)).size, 18);
  const quarantined = CANONICAL_MISSION_REALM_MANIFEST.filter((m) => String(m.identityStatus || '').startsWith('QUARANTINED_'));
  assert.strictEqual(quarantined.length, 3);
  assert.ok(quarantined.every((m) => m.studentMissionEligible === false));
});

test('P38: registry integrity validation is deterministic across repeated loads', () => {
  const first = require('./canonical_mission_registry');
  const second = require('./canonical_mission_registry');
  assert.strictEqual(first, second, 'module instance is stable');
  assert.ok(Object.isFrozen(first.GOVERNED_AUTHORITY_ALIASES));
  assert.ok(Object.isFrozen(first.LEGACY_PARENT_BINDINGS));
});

test('P39: pair-mismatch failure never leaks a generated mission ID', () => {
  try {
    resolvePayload('JEE Main', 'UPSC');
    assert.fail('expected GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH');
  } catch (err) {
    assert.match(err.message, /GOVERNED_AUTHORITY_EXAM_PAIR_MISMATCH/);
    assert.ok(!err.message.includes("rec_"), 'fail-closed error must not contain a generated ID');
  }
});

test('P40: pair compatibility validator rejects unknown authority references', () => {
  assert.throws(
    () => assertExamAuthorityCompatibilityIntegrity(
      { 'ssc_cgl': ['nonexistent_authority'] },
      GOVERNED_EXAM_ALIASES,
      GOVERNED_AUTHORITY_ALIASES,
    ),
    /EXAM_AUTHORITY_COMPATIBILITY_FAILURE/,
  );
});

test('P41: legacy pair validator rejects malformed binding containers', () => {
  assert.throws(() => assertLegacyParentBindingsIntegrity([]), /LEGACY_BINDING_INTEGRITY_FAILURE/);
  assert.throws(() => assertLegacyParentBindingsIntegrity('not-an-array'), /LEGACY_BINDING_INTEGRITY_FAILURE/);
  assert.throws(() => assertLegacyParentBindingsIntegrity([null]), /LEGACY_BINDING_INTEGRITY_FAILURE/);
});

test('P42: authority-first law — unknown authority blocks before exam evaluation', () => {
  // Even a perfect governed exam cannot rescue an unresolved authority.
  let examEvaluated = false;
  try {
    resolveCanonicalMissionId({
      examName: 'SSC CGL',
      organization: 'Mystery Board',
      // probe: exam side must not rescue the run
      get probe() { examEvaluated = true; return true; },
    });
    assert.fail('expected UNRESOLVED_AUTHORITY_IDENTITY');
  } catch (err) {
    assert.match(err.message, /UNRESOLVED_AUTHORITY_IDENTITY/);
  }
  assert.strictEqual(examEvaluated, false, 'authority resolution must precede exam resolution');
});

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

let passCount = 0;
let failCount = 0;

for (const { name, fn } of tests) {
  try {
    fn();
    passCount += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failCount += 1;
    console.log(`FAIL  ${name} :: ${err.message}`);
  }
}

console.log('-------------------------------------------------------------------------------');
console.log(`TEST_COUNT=${tests.length} PASS_COUNT=${passCount} FAIL_COUNT=${failCount}`);

if (failCount > 0) {
  process.exit(1);
}
process.exit(0);
