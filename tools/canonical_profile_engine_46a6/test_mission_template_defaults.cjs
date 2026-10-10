'use strict';

const assert = require('assert');
const { CANONICAL_7_PHASES, createCanonicalMissionPlan, buildCanonicalRecruitmentPayload } = require('./mission_template_defaults.cjs');

function runTest() {
  console.log('=== TESTING CANONICAL 98-DAY (7x14 PHASES) MISSION TEMPLATE DEFAULTS ===');

  // Test 1: Standard Payload Generation
  const testPayload = buildCanonicalRecruitmentPayload({
    missionId: 'rec_rc_test_generic_template_2099',
    examName: 'Generic Template Automated Test Mission',
    organization: 'RankCrackers Academic Automation',
    year: 2099,
    examCategory: 'competitive'
  });

  console.log('Generated Recruitment Payload Summary:', {
    id: testPayload.id,
    status: testPayload.status,
    totalDays: testPayload.missionPlan.totalDays,
    cycleDays: testPayload.missionPlan.cycleDays,
    phaseCount: testPayload.missionPlan.phases.length,
    majorTestDecoupled: testPayload.missionPlan.majorTestRule === undefined
  });

  // Assertion 1: Total Days & Cycle Days
  assert.strictEqual(testPayload.missionPlan.totalDays, 98, 'totalDays must be exactly 98');
  assert.strictEqual(testPayload.missionPlan.cycleDays, 98, 'cycleDays must be exactly 98');
  assert.strictEqual(testPayload.missionPlan.mode, 'CONTINUOUS_ROTATING_ORBIT', 'mode must be CONTINUOUS_ROTATING_ORBIT');

  // Assertion 2: Exact 7 Phases x 14 Days
  assert.strictEqual(testPayload.missionPlan.phases.length, 7, 'phases count must be exactly 7');
  let phaseSumDays = 0;
  testPayload.missionPlan.phases.forEach((phase, idx) => {
    assert.strictEqual(phase.durationDays, 14, `Phase ${idx + 1} duration must be 14 days`);
    assert.strictEqual(phase.endDay - phase.startDay + 1, 14, `Phase ${idx + 1} day range must be 14`);
    phaseSumDays += phase.durationDays;
  });
  assert.strictEqual(phaseSumDays, 98, 'Total sum of phase days must be exactly 98');

  // Assertion 3: Major Test decoupled
  assert.strictEqual(testPayload.missionPlan.majorTestRule, undefined, 'majorTestRule must NOT exist in Crucible missionPlan');

  // Assertion 4: Default Status is draft (never blindly published)
  assert.strictEqual(testPayload.status, 'draft', 'Default status must be draft');

  // Test 2: Invariants Protection Against Overrides
  console.log('\n--- Testing Invariants Protection ---');
  let override100Rejected = false;
  try {
    createCanonicalMissionPlan({ totalDays: 100 });
  } catch (e) {
    override100Rejected = true;
    console.log('[PASS] Attempted totalDays=100 override successfully REJECTED:', e.message);
  }
  assert.strictEqual(override100Rejected, true, 'totalDays=100 override must be rejected');

  let overrideMajorRejected = false;
  try {
    createCanonicalMissionPlan({ majorTestRule: { enabled: true } });
  } catch (e) {
    overrideMajorRejected = true;
    console.log('[PASS] Attempted majorTestRule override successfully REJECTED:', e.message);
  }
  assert.strictEqual(overrideMajorRejected, true, 'majorTestRule override must be rejected');

  console.log('\n[ALL INVARIANT ASSERTIONS PASSED]');
  console.log('NEW_TEST_MISSION_98_DAY_DRY_RUN: PASS');

  return {
    status: 'PASS',
    testMissionId: testPayload.id,
    defaultStatus: testPayload.status,
    totalDays: testPayload.missionPlan.totalDays,
    cycleDays: testPayload.missionPlan.cycleDays,
    phaseCount: testPayload.missionPlan.phases.length,
    phaseStructure: '7 phases x 14 days = 98 days',
    majorTestDecoupled: testPayload.missionPlan.majorTestRule === undefined,
    invariantsProtected: override100Rejected && overrideMajorRejected
  };
}

if (require.main === module) {
  try {
    runTest();
    process.exit(0);
  } catch (err) {
    console.error('TEST FAILED:', err.message);
    process.exit(1);
  }
}

module.exports = { runTest };
