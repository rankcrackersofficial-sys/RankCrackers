/**
 * 🔱 RANKCRACKERS GATE 48CS2R2 ADVERSARIAL HARDENING TEST SUITE
 * Official-Rule-Safe Career Personalization & Reservation Safety Tests
 *
 * Proves all 20 adversarial conditions required by Chief Architect:
 *   1. SC user with no official relaxation rule gets no automatic +5
 *   2. OBC user with no official relaxation rule gets no automatic +3
 *   3. Official relaxation applied only when explicit verified rule exists
 *   4. Missing category remains UNKNOWN / null, never defaulted to UR
 *   5. Missing PwBD remains null, never defaulted to false
 *   6. Missing experience remains null, never defaulted to 0
 *   7. OBC_CL does not consume OBC_NCL reserved quota by default
 *   8. WOMEN horizontal row strictly rejects male profile
 *   9. Same vacancy row is not double-counted (deduplication & count reconciliation)
 *   10. Eligible user with zero applicable vacancy remains eligibility-eligible (separate statuses)
 *   11. Two event types from same PDF produce distinct deterministic event IDs
 *   12. User view retains supplied canonical event ID (zero synthetic timestamp IDs)
 *   13. Legacy ACTIVE normalizes to APPLICATION_OPEN at boundary, not in canonical enum
 *   14. FINAL_RESULT_DECLARED remains a visible process event (processUpdateSignalActive = true)
 *   15. CYCLE_CLOSED definitively terminates cycle (opportunity: false, process: false)
 *   16. Domicile present but mismatched rule yields locationMatch = false (no auto-match)
 *   17. Domicile present with no domicile rule yields locationMatch = null (no auto-match)
 *   18. Rule without source evidence yields NOT_EVALUATED (cannot determine legal eligibility)
 *   19. Match dimensions derive strictly from ruleType (zero ruleId substring heuristics)
 *   20. Cross-vertical category isolation (SC candidate cannot match ST or OBC)
 */

'use strict';

const assert = require('assert');
const {
  CANONICAL_RECRUITMENT_CYCLE_STATUS,
  RECRUITMENT_CYCLE_STATUS,
  OPPORTUNITY_KIND,
  CAREER_SIGNAL_EVENT_TYPE,
  VERIFICATION_STATE,
  PARTICIPATION_STATE,
  AGE_RELAXATION_RESOLUTION,
  ELIGIBILITY_STATUS,
  MATCH_RESULT_STATE,
  VACANCY_APPLICABILITY_STATUS,
  VERTICAL_CATEGORY,
  HORIZONTAL_CATEGORY,
  normalizeCycleStatus,
  computeCareerSignalEventId,
  normalizeCareerSignalEvent,
  normalizeCareerSignalView,
  normalizeRecruitmentCycle,
  normalizeCareerProfile
} = require('../services/career_signal_models');

const {
  computeActiveSignalFlags,
  reduceEventsToEffectiveState
} = require('../services/career_signal_reducer');

const {
  calculateAgeYears,
  findOfficialAgeRelaxationRule,
  evaluateSingleRule,
  evaluateApplicableVacancies,
  evaluateCareerSignalPersonalization
} = require('../services/career_signal_matching_engine');

console.log('================================================================================');
console.log('RUNNING GATE 48CS2R2 ADVERSARIAL HARDENING TEST SUITE');
console.log('================================================================================\n');

let passedTests = 0;
let totalTests = 20;

function assertTest(name, fn) {
  try {
    fn();
    passedTests++;
    console.log(`✅ PASS [Test ${passedTests}/${totalTests}]: ${name}`);
  } catch (err) {
    console.error(`❌ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// -----------------------------------------------------------------------------
// TEST 1: SC user with no official relaxation rule gets NO automatic +5
// -----------------------------------------------------------------------------
assertTest('SC user with no official relaxation rule gets NO automatic +5', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_sc_01',
    dateOfBirth: '1992-05-15', // Age 33 at 2025-06-01
    reservationCategory: VERTICAL_CATEGORY.SC
  });

  const baseAgeRule = {
    ruleId: 'rule_max_age_30',
    ruleType: 'AGE_MAX',
    officialValue: 30,
    sourceDocumentId: 'doc_upsc_advt_2025',
    sourceLocator: 'clause_3_age_limits'
  };

  // Explicitly verified absence of relaxation rule yields FAILED with zero automatic +5
  const res = evaluateSingleRule(baseAgeRule, profile, {
    referenceDate: '2025-06-01T00:00:00Z',
    allRules: [baseAgeRule],
    ageRelaxationResolution: AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED
  });

  assert.strictEqual(res.status, 'FAILED');
  assert.ok(res.reason.includes('No official age relaxation rule provided'));
  assert.ok(!res.reason.includes('including 5y relaxation'));
});

// -----------------------------------------------------------------------------
// TEST 2: OBC user with no official relaxation rule gets NO automatic +3
// -----------------------------------------------------------------------------
assertTest('OBC user with no official relaxation rule gets NO automatic +3', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_obc_01',
    dateOfBirth: '1993-02-10', // Age 32 at 2025-06-01
    reservationCategory: VERTICAL_CATEGORY.OBC_NCL
  });

  const baseAgeRule = {
    ruleId: 'rule_max_age_30',
    ruleType: 'AGE_MAX',
    officialValue: 30,
    sourceDocumentId: 'doc_rpsc_advt_2025',
    sourceLocator: 'clause_4_age'
  };

  const res = evaluateSingleRule(baseAgeRule, profile, {
    referenceDate: '2025-06-01T00:00:00Z',
    allRules: [baseAgeRule],
    ageRelaxationResolution: AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED
  });

  assert.strictEqual(res.status, 'FAILED');
  assert.ok(res.reason.includes('No official age relaxation rule provided'));
  assert.ok(!res.reason.includes('including 3y relaxation'));
});

// -----------------------------------------------------------------------------
// TEST 3: Official relaxation applied ONLY when explicit verified rule exists
// -----------------------------------------------------------------------------
assertTest('Official relaxation applied ONLY when explicit verified rule exists', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_sc_relaxed',
    dateOfBirth: '1992-05-15', // Age 33 at 2025-06-01
    reservationCategory: VERTICAL_CATEGORY.SC
  });

  const baseAgeRule = {
    ruleId: 'rule_max_age_30',
    ruleType: 'AGE_MAX',
    officialValue: 30,
    sourceDocumentId: 'doc_advt_2025',
    sourceLocator: 'clause_3'
  };

  const officialRelaxationRule = {
    ruleId: 'rule_sc_relax_5',
    ruleType: 'AGE_RELAXATION',
    category: VERTICAL_CATEGORY.SC,
    relaxationYears: 5,
    sourceDocumentId: 'doc_advt_2025',
    sourceLocator: 'clause_3_b_relaxation_table'
  };

  const res = evaluateSingleRule(baseAgeRule, profile, {
    referenceDate: '2025-06-01T00:00:00Z',
    allRules: [baseAgeRule, officialRelaxationRule]
  });

  assert.strictEqual(res.status, 'PASSED');
  assert.ok(res.reason.includes('including official notification relaxation of 5y for SC'));
});

// -----------------------------------------------------------------------------
// TEST 4: Missing category remains UNKNOWN / null, never defaulted to UR
// -----------------------------------------------------------------------------
assertTest('Missing category remains UNKNOWN / null, never defaulted to UR', () => {
  const profile1 = normalizeCareerProfile({ userId: 'user_no_cat' });
  assert.strictEqual(profile1.reservationCategory, null);

  const profile2 = normalizeCareerProfile({ userId: 'user_unknown_cat', reservationCategory: 'UNKNOWN' });
  assert.strictEqual(profile2.reservationCategory, 'UNKNOWN');
  assert.notStrictEqual(profile2.reservationCategory, VERTICAL_CATEGORY.UR);
});

// -----------------------------------------------------------------------------
// TEST 5: Missing PwBD remains null, never defaulted to false
// -----------------------------------------------------------------------------
assertTest('Missing PwBD remains null, never defaulted to false', () => {
  const profile = normalizeCareerProfile({ userId: 'user_no_pwbd' });
  assert.strictEqual(profile.isPwBD, null);
  assert.notStrictEqual(profile.isPwBD, false);
});

// -----------------------------------------------------------------------------
// TEST 6: Missing experience remains null, never defaulted to 0
// -----------------------------------------------------------------------------
assertTest('Missing experience remains null, never defaulted to 0', () => {
  const profile = normalizeCareerProfile({ userId: 'user_no_exp' });
  assert.strictEqual(profile.experienceMonths, null);
  assert.notStrictEqual(profile.experienceMonths, 0);
});

// -----------------------------------------------------------------------------
// TEST 7: OBC_CL does not consume OBC_NCL reserved quota by default
// -----------------------------------------------------------------------------
assertTest('OBC_CL does not consume OBC_NCL reserved quota by default', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_obc_cl',
    reservationCategory: VERTICAL_CATEGORY.OBC_CL
  });

  const vacancyRows = [
    { rowId: 'v_ur_01', verticalCategory: 'UR', vacancyCount: 50 },
    { rowId: 'v_obc_01', verticalCategory: 'OBC_NCL', vacancyCount: 20 },
    { rowId: 'v_sc_01', verticalCategory: 'SC', vacancyCount: 15 }
  ];

  const { applicableRows, totalApplicableVacancies } = evaluateApplicableVacancies(profile, vacancyRows);

  // OBC_CL must match UR only, NOT OBC_NCL!
  assert.strictEqual(applicableRows.length, 1);
  assert.strictEqual(applicableRows[0].verticalCategory, 'UR');
  assert.strictEqual(totalApplicableVacancies, 50);
});

// -----------------------------------------------------------------------------
// TEST 8: WOMEN horizontal row strictly rejects male profile
// -----------------------------------------------------------------------------
assertTest('WOMEN horizontal row strictly rejects male profile', () => {
  const maleProfile = normalizeCareerProfile({
    userId: 'user_male_01',
    gender: 'MALE',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const vacancyRows = [
    { rowId: 'v_ur_general', verticalCategory: 'UR', horizontalCategory: 'NONE', vacancyCount: 30 },
    { rowId: 'v_ur_women', verticalCategory: 'UR', horizontalCategory: 'WOMEN', vacancyCount: 10 }
  ];

  const { applicableRows, totalApplicableVacancies } = evaluateApplicableVacancies(maleProfile, vacancyRows);

  assert.strictEqual(applicableRows.length, 1);
  assert.strictEqual(applicableRows[0].rowId, 'v_ur_general');
  assert.strictEqual(totalApplicableVacancies, 30);
});

// -----------------------------------------------------------------------------
// TEST 9: Same vacancy row is not double-counted (deduplication)
// -----------------------------------------------------------------------------
assertTest('Same vacancy row is not double-counted', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_ur_01',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const vacancyRowsWithDuplicates = [
    { rowId: 'v_ur_main', verticalCategory: 'UR', vacancyCount: 50 },
    { rowId: 'v_ur_main', verticalCategory: 'UR', vacancyCount: 50 } // Duplicate row
  ];

  const { applicableRows, totalApplicableVacancies } = evaluateApplicableVacancies(profile, vacancyRowsWithDuplicates);

  assert.strictEqual(applicableRows.length, 1);
  assert.strictEqual(totalApplicableVacancies, 50);
});

// -----------------------------------------------------------------------------
// TEST 10: Eligible user with zero applicable vacancy remains eligibility-eligible
// -----------------------------------------------------------------------------
assertTest('Eligible user with zero applicable vacancy remains eligibility-eligible', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_ur_qual',
    dateOfBirth: '1998-01-01',
    highestQualification: 'GRADUATION',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const rules = [
    {
      ruleId: 'rule_max_30',
      ruleType: 'AGE_MAX',
      officialValue: 30,
      sourceDocumentId: 'doc_advt_01',
      sourceLocator: 'p1'
    },
    {
      ruleId: 'rule_grad_min',
      ruleType: 'QUALIFICATION_MIN',
      officialValue: 'GRADUATION',
      sourceDocumentId: 'doc_advt_01',
      sourceLocator: 'p2'
    }
  ];

  // Special recruitment where vacancies are ONLY for SC & ST
  const vacancyRows = [
    { rowId: 'v_sc', verticalCategory: 'SC', vacancyCount: 10 },
    { rowId: 'v_st', verticalCategory: 'ST', vacancyCount: 5 }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows,
    eventId: 'evt_canonical_verified_01',
    nowIso: '2025-06-01T00:00:00Z'
  });

  // Candidate satisfies all recruitment rules => ELIGIBLE
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
  assert.strictEqual(view.matchResultState, ELIGIBILITY_STATUS.ELIGIBLE);

  // But zero applicable vacancies for UR in this recruitment
  assert.strictEqual(view.vacancyApplicabilityStatus, VACANCY_APPLICABILITY_STATUS.NO_APPLICABLE_VACANCIES);
  assert.strictEqual(view.applicableVacancyRows.length, 0);
  assert.strictEqual(view.totalApplicableVacancies, 0);
});

// -----------------------------------------------------------------------------
// TEST 11: Two event types from same PDF produce distinct deterministic event IDs
// -----------------------------------------------------------------------------
assertTest('Two event types from same PDF produce distinct deterministic event IDs', () => {
  const docSha = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
  const cycleId = 'rc_upsc_cse_2026';

  const eventId1 = computeCareerSignalEventId({
    cycleId,
    documentSha256: docSha,
    eventType: CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION,
    semanticEventKey: 'notification_body'
  });

  const eventId2 = computeCareerSignalEventId({
    cycleId,
    documentSha256: docSha,
    eventType: CAREER_SIGNAL_EVENT_TYPE.VACANCY_ANNOUNCED,
    semanticEventKey: 'revised_vacancy_breakup'
  });

  assert.ok(eventId1.startsWith('evt_'));
  assert.ok(eventId2.startsWith('evt_'));
  assert.notStrictEqual(eventId1, eventId2);

  // Rerun confirms 100% determinism
  const eventId1Rerun = computeCareerSignalEventId({
    cycleId,
    documentSha256: docSha,
    eventType: CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION,
    semanticEventKey: 'notification_body'
  });
  assert.strictEqual(eventId1, eventId1Rerun);
});

// -----------------------------------------------------------------------------
// TEST 12: User view retains supplied canonical event ID (zero synthetic timestamp IDs)
// -----------------------------------------------------------------------------
assertTest('User view retains supplied canonical event ID (zero synthetic timestamp IDs)', () => {
  const profile = normalizeCareerProfile({ userId: 'student_999' });
  const canonicalEventId = 'evt_sha_verified_canon_001';

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [],
    vacancyRows: [],
    eventId: canonicalEventId
  });

  assert.strictEqual(view.eventId, canonicalEventId);
  assert.strictEqual(view.viewId, 'student_999_' + canonicalEventId);
  assert.ok(!view.eventId.includes('gen_'));
  assert.ok(!view.eventId.includes(String(Date.now()).substring(0, 5)));
});

// -----------------------------------------------------------------------------
// TEST 13: Legacy ACTIVE normalizes to APPLICATION_OPEN at boundary, not in canonical enum
// -----------------------------------------------------------------------------
assertTest('Legacy ACTIVE normalizes to APPLICATION_OPEN at boundary, not in canonical enum', () => {
  const norm = normalizeCycleStatus('ACTIVE');
  assert.strictEqual(norm, CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN);

  // Canonical enum does NOT contain legacy members
  assert.strictEqual(CANONICAL_RECRUITMENT_CYCLE_STATUS['ACTIVE'], undefined);
  assert.strictEqual(CANONICAL_RECRUITMENT_CYCLE_STATUS['UPCOMING'], undefined);
  assert.strictEqual(CANONICAL_RECRUITMENT_CYCLE_STATUS['IN_SELECTION'], undefined);
  assert.strictEqual(CANONICAL_RECRUITMENT_CYCLE_STATUS['CLOSED'], undefined);
});

// -----------------------------------------------------------------------------
// TEST 14: FINAL_RESULT_DECLARED remains a visible process event (processUpdate: true)
// -----------------------------------------------------------------------------
assertTest('FINAL_RESULT_DECLARED remains a visible process event (processUpdate: true)', () => {
  const flags = computeActiveSignalFlags(CANONICAL_RECRUITMENT_CYCLE_STATUS.FINAL_RESULT_DECLARED, null, '2025-06-01T00:00:00Z');
  assert.strictEqual(flags.opportunitySignalActive, false);
  assert.strictEqual(flags.processUpdateSignalActive, true);
});

// -----------------------------------------------------------------------------
// TEST 15: CYCLE_CLOSED definitively terminates cycle (opportunity: false, process: false)
// -----------------------------------------------------------------------------
assertTest('CYCLE_CLOSED definitively terminates cycle (opportunity: false, process: false)', () => {
  const flags = computeActiveSignalFlags(CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED, null, '2025-06-01T00:00:00Z');
  assert.strictEqual(flags.opportunitySignalActive, false);
  assert.strictEqual(flags.processUpdateSignalActive, false);
});

// -----------------------------------------------------------------------------
// TEST 16: Domicile present but mismatched rule yields locationMatch = false
// -----------------------------------------------------------------------------
assertTest('Domicile present but mismatched rule yields locationMatch = false', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_up_01',
    domicileState: 'UP'
  });

  const domicileRule = {
    ruleId: 'rule_domicile_rj',
    ruleType: 'DOMICILE_REQUIRED',
    officialValue: 'RJ',
    sourceDocumentId: 'doc_rpsc_01',
    sourceLocator: 'p3'
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [domicileRule],
    vacancyRows: [],
    eventId: 'evt_rj_gov_01'
  });

  assert.strictEqual(view.locationMatch, false);
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_ELIGIBLE);
});

// -----------------------------------------------------------------------------
// TEST 17: Domicile present with NO domicile rule yields locationMatch = null
// -----------------------------------------------------------------------------
assertTest('Domicile present with NO domicile rule yields locationMatch = null', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_delhi_01',
    domicileState: 'DL'
  });

  // All India exam with no domicile restriction rule
  const qualRule = {
    ruleId: 'rule_10th_pass',
    ruleType: 'QUALIFICATION_MIN',
    officialValue: '10TH',
    sourceDocumentId: 'doc_central_01',
    sourceLocator: 'sec_1'
  };

  profile.highestQualification = '10TH';

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [qualRule],
    vacancyRows: [],
    eventId: 'evt_central_exam_01'
  });

  // locationMatch must NOT be true merely because domicileState is present!
  assert.strictEqual(view.locationMatch, null);
});

// -----------------------------------------------------------------------------
// TEST 18: Rule without source evidence yields NOT_EVALUATED
// -----------------------------------------------------------------------------
assertTest('Rule without source evidence yields NOT_EVALUATED', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_unverified',
    highestQualification: 'GRADUATION'
  });

  // Rule without sourceDocumentId or sourceLocator
  const fabricatedRule = {
    ruleId: 'rule_unverified_bogus',
    ruleType: 'QUALIFICATION_MIN',
    officialValue: 'GRADUATION'
    // Missing sourceDocumentId, sourceLocator, etc.
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [fabricatedRule],
    vacancyRows: [],
    eventId: 'evt_unverified_001'
  });

  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
  assert.strictEqual(view.unresolvedRuleIds.length, 1);
  assert.strictEqual(view.unresolvedRuleIds[0], 'rule_unverified_bogus');
});

// -----------------------------------------------------------------------------
// TEST 19: Match dimensions derive strictly from ruleType (zero ruleId substring heuristics)
// -----------------------------------------------------------------------------
assertTest('Match dimensions derive strictly from ruleType (zero ruleId substring heuristics)', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_physics_major',
    subjectOrDiscipline: 'PHYSICS',
    highestQualification: 'POST_GRADUATION'
  });

  // Note ruleId has NO "discipline" or "subject" in its ID name
  const academicRule = {
    ruleId: 'special_criterion_alpha_7',
    ruleType: 'DISCIPLINE_REQUIRED',
    officialValue: ['Physics', 'Applied Physics'],
    sourceDocumentId: 'doc_isro_01',
    sourceLocator: 'sec_academic'
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [academicRule],
    vacancyRows: [],
    eventId: 'evt_isro_01'
  });

  assert.strictEqual(view.academicMatch, true);
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
});

// -----------------------------------------------------------------------------
// TEST 20: Cross-vertical category isolation (SC candidate cannot match ST or OBC)
// -----------------------------------------------------------------------------
assertTest('Cross-vertical category isolation (SC candidate cannot match ST or OBC)', () => {
  const scProfile = normalizeCareerProfile({
    userId: 'user_sc_strict',
    reservationCategory: VERTICAL_CATEGORY.SC
  });

  const vacancyRows = [
    { rowId: 'v_ur_open', verticalCategory: 'UR', vacancyCount: 100 },
    { rowId: 'v_sc_reserved', verticalCategory: 'SC', vacancyCount: 25 },
    { rowId: 'v_st_reserved', verticalCategory: 'ST', vacancyCount: 15 },
    { rowId: 'v_obc_reserved', verticalCategory: 'OBC_NCL', vacancyCount: 40 },
    { rowId: 'v_ews_reserved', verticalCategory: 'EWS', vacancyCount: 10 }
  ];

  const { applicableRows, totalApplicableVacancies } = evaluateApplicableVacancies(scProfile, vacancyRows);

  assert.strictEqual(applicableRows.length, 2);
  const categories = applicableRows.map(r => r.verticalCategory);
  assert.ok(categories.includes('UR'));
  assert.ok(categories.includes('SC'));
  assert.ok(!categories.includes('ST'));
  assert.ok(!categories.includes('OBC_NCL'));
  assert.ok(!categories.includes('EWS'));
  assert.strictEqual(totalApplicableVacancies, 125);
});

console.log('\n================================================================================');
console.log('ALL 20/20 GATE 48CS2R2 ADVERSARIAL TESTS PASSED WITH 100% CANONICAL INTEGRITY');
console.log('================================================================================\n');
