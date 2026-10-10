'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const { computeProfileHash } = require('./profile_schema.cjs');
const { validateProfile, isValidSha256, isValidPortalUrl } = require('./profile_validator.cjs');
const { resolveS2DocumentProfile } = require('./s2_profile_resolver.cjs');
const { diffProfiles, validate, plan, apply } = require('./materialization_engine.cjs');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function loadFixture(name) {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, name), 'utf8'));
}

async function runAllTests() {
  console.log('===============================================================================');
  console.log('RC_CANONICAL_MISSION_PROFILE_MATERIALIZATION_ENGINE_46A6');
  console.log('AGENT-2 — BACKEND TEST SUITE & VERIFICATION');
  console.log('===============================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function test(name, fn) {
    totalTests++;
    try {
      fn();
      console.log(`PASS [${String(totalTests).padStart(2, '0')}] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`FAIL [${String(totalTests).padStart(2, '0')}] ${name}`);
      console.error('  ->', err.message);
      throw err;
    }
  }

  // 1. Profile Semantic Hash Determinism
  test('1. Profile semantic hash determinism: identical semantic profile produces identical hash', () => {
    const fixA1 = loadFixture('fixture_a_single_paper.json');
    const fixA2 = loadFixture('fixture_a_single_paper.json');
    const hash1 = computeProfileHash(fixA1);
    const hash2 = computeProfileHash(fixA2);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1, fixA1.profileHash);
  });

  // 2. Timestamp Exclusion from Hash
  test('2. Volatile timestamp exclusion: timestamp changes do NOT alter profileHash, but academic changes DO', () => {
    const fixA = loadFixture('fixture_a_single_paper.json');
    const baseHash = computeProfileHash(fixA);

    // Add volatile timestamps
    const withTimestamps = {
      ...fixA,
      createdAt: '2026-09-09T18:00:00.000Z',
      updatedAt: '2026-09-09T19:30:00.000Z',
      lastCheckedAt: '2026-09-09T19:35:00.000Z',
      runtimeTimestamp: 1788912345
    };
    const timestampHash = computeProfileHash(withTimestamps);
    assert.strictEqual(timestampHash, baseHash, 'Volatile timestamps must be excluded from hash calculation');

    // Make an academic change (totalMarks from 300 to 360)
    const withAcademicChange = JSON.parse(JSON.stringify(fixA));
    withAcademicChange.paperModel.papers[0].totalMarks = 360;
    const academicHash = computeProfileHash(withAcademicChange);
    assert.notStrictEqual(academicHash, baseHash, 'Academic changes MUST produce a different hash');
  });

  // 3. Duplicate ID Rejection
  test('3. Duplicate ID rejection: duplicate paperId and duplicate variantId fail closed', () => {
    // Duplicate Paper ID
    const fixB = loadFixture('fixture_b_multi_paper.json');
    fixB.paperModel.papers.push({ ...fixB.paperModel.papers[0] });
    const resPaper = validateProfile(fixB);
    assert.strictEqual(resPaper.valid, false);
    assert.ok(resPaper.errors.some(e => e.includes('DUPLICATE_PAPER_ID')));

    // Duplicate Variant ID
    const fixD = loadFixture('fixture_d_flat_variants.json');
    fixD.variantModel.variants.push({ ...fixD.variantModel.variants[0] });
    const resVariant = validateProfile(fixD);
    assert.strictEqual(resVariant.valid, false);
    assert.ok(resVariant.errors.some(e => e.includes('DUPLICATE_VARIANT_ID')));
  });

  // 4. Unmapped Variant Rejection
  test('4. Unmapped variant rejection: variant mapping to unknown paper family fails closed', () => {
    const fixF = loadFixture('fixture_f_multi_paper_family.json');
    fixF.variantModel.variants.push({
      variantId: 'var_invalid',
      variantName: 'Invalid Discipine',
      applicablePaperFamilyId: 'fam_non_existent_family'
    });
    const res = validateProfile(fixF);
    assert.strictEqual(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('UNMAPPED_VARIANT_PAPER_FAMILY')));
  });

  // 5. Paper Family Validation
  test('5. Paper-family validation: valid multi-family mappings pass; unknown paper references fail', () => {
    const fixF = loadFixture('fixture_f_multi_paper_family.json');
    const validRes = validateProfile(fixF);
    assert.strictEqual(validRes.valid, true);

    // Corrupt family with unknown paper
    const corrupted = JSON.parse(JSON.stringify(fixF));
    corrupted.paperModel.paperFamilies[0].paperIds.push('paper_does_not_exist');
    const corruptRes = validateProfile(corrupted);
    assert.strictEqual(corruptRes.valid, false);
    assert.ok(corruptRes.errors.some(e => e.includes('FAMILY_REFERENCES_UNKNOWN_PAPER')));
  });

  // 6. Nested Variant Validation
  test('6. Nested variant validation: parent variant with subvariants passes; duplicate subvariant fails', () => {
    const fixE = loadFixture('fixture_e_nested_variants.json');
    const validRes = validateProfile(fixE);
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(validRes.variantCount, 5); // 2 top-level + 3 subvariants

    // Duplicate subvariant
    const corrupted = JSON.parse(JSON.stringify(fixE));
    corrupted.variantModel.variants[1].subvariants.push({
      subvariantId: 'sub_coach_athletics', // duplicate
      subvariantName: 'Coach Athletics Duplicate',
      code: 'ATH2'
    });
    const corruptRes = validateProfile(corrupted);
    assert.strictEqual(corruptRes.valid, false);
    assert.ok(corruptRes.errors.some(e => e.includes('DUPLICATE_SUBVARIANT_ID')));
  });

  // 7. BYTE_VERIFIED Requires SHA
  test('7. Evidence class BYTE_VERIFIED requires valid 64-char hex SHA-256', () => {
    const fixH = loadFixture('fixture_h_byte_verified_with_sha.json');
    assert.strictEqual(validateProfile(fixH).valid, true);

    const corrupted = JSON.parse(JSON.stringify(fixH));
    corrupted.authority.sha256 = null; // Removed SHA
    const corruptRes = validateProfile(corrupted);
    assert.strictEqual(corruptRes.valid, false);
    assert.ok(corruptRes.errors.some(e => e.includes('BYTE_VERIFIED_SHA_REQUIRED')));
  });

  // 8. PORTAL_REGISTRY_VERIFIED Permits Null SHA
  test('8. Evidence class PORTAL_REGISTRY_VERIFIED permits null SHA-256 when official portals are valid', () => {
    const fixG = loadFixture('fixture_g_portal_registry_no_sha.json');
    assert.strictEqual(fixG.authority.sha256, null);
    const res = validateProfile(fixG);
    assert.strictEqual(res.valid, true);
  });

  // 9. SOURCE_VERIFIED Requires Evidence Class
  test('9. Provenance tag SOURCE_VERIFIED requires explicit evidenceClass', () => {
    const fixA = loadFixture('fixture_a_single_paper.json');
    const corrupted = JSON.parse(JSON.stringify(fixA));
    delete corrupted.authority.evidenceClass;
    const corruptRes = validateProfile(corrupted);
    assert.strictEqual(corruptRes.valid, false);
    assert.ok(corruptRes.errors.some(e => e.includes('EVIDENCE_CLASS_REQUIRED')));
  });

  // 10. Synthetic Hash Rejection
  test('10. Synthetic / fake hash patterns are rejected', () => {
    const fixH = loadFixture('fixture_h_byte_verified_with_sha.json');
    const corrupted = JSON.parse(JSON.stringify(fixH));
    corrupted.authority.sha256 = '0000000000000000000000000000000000000000000000000000000000000000';
    const corruptRes = validateProfile(corrupted);
    assert.strictEqual(corruptRes.valid, false);
    assert.ok(corruptRes.errors.some(e => e.includes('SYNTHETIC_OR_INVALID_SHA')));
  });

  // 11. Guessed URL Rejection
  test('11. Guessed URL patterns (example.com, placeholder) are rejected', () => {
    const fixA = loadFixture('fixture_a_single_paper.json');
    const corrupted = JSON.parse(JSON.stringify(fixA));
    corrupted.authority.officialPortals = ['https://example.com/portal'];
    const corruptRes = validateProfile(corrupted);
    assert.strictEqual(corruptRes.valid, false);
    assert.ok(corruptRes.errors.some(e => e.includes('GUESSED_OR_INVALID_PORTAL_URL')));
  });

  // 12. Missing Profile Fail-Closed S2 Lookup
  test('12. Missing profile fail-closed: S2 resolver returns HOLD with 0 fallback defaults', () => {
    const nullResult = resolveS2DocumentProfile(null);
    assert.strictEqual(nullResult.status, 'HOLD');
    assert.strictEqual(nullResult.resolved, false);
    assert.strictEqual(nullResult.profileFallbackCount, 0);
    assert.strictEqual(nullResult.s2DocumentProfile, null);

    // Profile in HOLD_FOR_REVIEW status
    const fixA = loadFixture('fixture_a_single_paper.json');
    fixA.profileStatus = 'HOLD_FOR_REVIEW';
    const holdResult = resolveS2DocumentProfile(fixA);
    assert.strictEqual(holdResult.status, 'HOLD');
    assert.strictEqual(holdResult.resolved, false);
    assert.strictEqual(holdResult.reason, 'PROFILE_STATUS_HOLD_FOR_REVIEW');
  });

  // 13. S2 Profile Resolution
  test('13. S2 profile resolution: governed profile resolves complete parsing specification', () => {
    const fixB = loadFixture('fixture_b_multi_paper.json');
    const resolution = resolveS2DocumentProfile(fixB);
    assert.strictEqual(resolution.status, 'READY');
    assert.strictEqual(resolution.resolved, true);
    assert.deepStrictEqual(resolution.s2DocumentProfile.expectedPapers, ['Paper 1 General', 'Paper 2 Subject']);
    assert.deepStrictEqual(resolution.s2DocumentProfile.expectedSubjects, ['Subject 1']);
    assert.strictEqual(resolution.s2DocumentProfile.sourceYearPolicy, 'USE_2025_BASELINE');
  });

  // 14. Second-Run Idempotency
  test('14. Second-run idempotency: re-planning against state containing same profile yields NO_OP (0 writes)', () => {
    const fixD = loadFixture('fixture_d_flat_variants.json');
    const missionId = fixD.identity.missionId;
    const allowlist = {
      allowedMutations: [
        { path: `mission_realms/${missionId}/canonical_profile/current`, operation: 'CREATE' }
      ]
    };

    // First run (fresh creation)
    const stateEmpty = { [missionId]: { missionRealmExists: true, canonicalProfile: null } };
    const plan1 = plan(fixD, stateEmpty, allowlist);
    assert.strictEqual(plan1.changeType, 'CREATE');
    assert.strictEqual(plan1.plannedWritesCount, 1);
    assert.strictEqual(plan1.isNoOp, false);

    // Second run (simulating post-materialization state)
    const stateApplied = {
      [missionId]: {
        missionRealmExists: true,
        canonicalProfile: fixD,
        profileHash: fixD.profileHash
      }
    };
    const plan2 = plan(fixD, stateApplied, allowlist);
    assert.strictEqual(plan2.changeType, 'NO_OP');
    assert.strictEqual(plan2.plannedWritesCount, 0);
    assert.strictEqual(plan2.isNoOp, true);
  });

  // 15. Version Preconditions Fail-Closed
  test('15. Version preconditions fail-closed: stale version or mismatched hash aborts plan', () => {
    const fixA = loadFixture('fixture_a_single_paper.json');
    const missionId = fixA.identity.missionId;
    const state = {
      [missionId]: {
        missionRealmExists: true,
        canonicalProfile: null,
        profileVersion: 2,
        profileHash: 'hash_abc'
      }
    };

    // Expecting version 1, but state has version 2
    assert.throws(() => {
      plan(fixA, state, null, { expectedProfileVersion: 1 });
    }, /PRECONDITION_FAILED.*Stale profile version/);

    // Expecting different hash
    assert.throws(() => {
      plan(fixA, state, null, { expectedProfileHash: 'hash_xyz' });
    }, /PRECONDITION_FAILED.*Stale profile hash/);
  });

  // 16. Allowlist Violation Fail-Closed
  test('16. Allowlist violation fail-closed: unallowlisted target path or operation throws and aborts', () => {
    const fixA = loadFixture('fixture_a_single_paper.json');
    const missionId = fixA.identity.missionId;
    const stateEmpty = { [missionId]: { missionRealmExists: true, canonicalProfile: null } };

    // Restricted allowlist targeting another path
    const restrictedAllowlist = {
      allowedMutations: [
        { path: 'mission_realms/another_mission/canonical_profile/current', operation: 'CREATE' }
      ]
    };

    assert.throws(() => {
      plan(fixA, stateEmpty, restrictedAllowlist);
    }, /UNALLOWLISTED_MUTATION_ATTEMPTED/);
  });

  console.log(`\n===============================================================================`);
  console.log(`ALL TESTS PASSED: ${passedTests}/${totalTests} PASS`);
  console.log('===============================================================================\n');
}

runAllTests().catch(err => {
  console.error('TEST_RUNNER_ERROR:', err);
  process.exit(1);
});
