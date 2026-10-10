/**
 * 🔱 RANKCRACKERS GATE 48CS2R3 ADVERSARIAL COMPLETENESS SAFETY TEST SUITE
 * Source-Completeness Safety, Rulebook Completeness Barrier & Uncertainty Separation Tests
 *
 * Validates all 10 required Chief Architect scenarios:
 *   1. SC candidate above base age + relaxation rule unresolved => NOT final NOT_ELIGIBLE (yields NOT_EVALUATED)
 *   2. SC candidate above base age + RELAXATION_NONE_VERIFIED => strictly NOT_ELIGIBLE
 *   3. SC candidate + verified relaxation rule => rule applied exactly
 *   4. All extracted rules pass but EXPERIENCE family unresolved => ELIGIBLE verdict strictly prohibited
 *   5. User DOB missing with complete age rule => MORE_INFORMATION_NEEDED (user profile gap)
 *   6. Official age rule missing / unverified => NOT_EVALUATED (official source gap)
 *   7. Partial vacancy matrix with zero matching rows => VACANCIES_PENDING_RESERVATION_DATA
 *   8. Complete vacancy matrix with zero applicable rows => NO_APPLICABLE_VACANCIES
 *   9. Base notification verified but amendment chain partial => affected field remains unresolved
 *   10. Complete rulebook + complete amendments + all mandatory rules pass => ELIGIBLE permitted
 */

'use strict';

const assert = require('assert');
const {
  CANONICAL_RECRUITMENT_CYCLE_STATUS,
  ELIGIBILITY_STATUS,
  VACANCY_APPLICABILITY_STATUS,
  VERTICAL_CATEGORY,
  RULE_FAMILY,
  RULE_FAMILY_STATUS,
  RULE_RESOLUTION_STATE,
  AGE_RELAXATION_RESOLUTION,
  VACANCY_MATRIX_COMPLETENESS,
  AMENDMENT_CHAIN_STATUS,
  normalizeRulebookCompleteness,
  normalizeAmendmentChain,
  normalizeCareerProfile
} = require('../services/career_signal_models');

const {
  evaluateSingleRule,
  evaluateApplicableVacancies,
  evaluateCareerSignalPersonalization
} = require('../services/career_signal_matching_engine');

console.log('================================================================================');
console.log('RUNNING GATE 48CS2R3 SOURCE-COMPLETENESS SAFETY TEST SUITE');
console.log('================================================================================\n');

let passedTests = 0;
let totalTests = 10;

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
// TEST 1: SC candidate above base age + relaxation rule unresolved => NOT final NOT_ELIGIBLE
// -----------------------------------------------------------------------------
assertTest('SC candidate above base age + relaxation rule unresolved => NOT final NOT_ELIGIBLE (yields NOT_EVALUATED)', () => {
  const profile = normalizeCareerProfile({
    userId: 'sc_candidate_33',
    dateOfBirth: '1992-05-15', // Age 33 at 2025-06-01
    reservationCategory: VERTICAL_CATEGORY.SC,
    highestQualification: 'GRADUATION'
  });

  const rules = [
    {
      ruleId: 'rule_base_age_30',
      ruleType: 'AGE_MAX',
      officialValue: 30,
      sourceDocumentId: 'doc_advt_01',
      sourceLocator: 'p3'
    }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_01',
    ageRelaxationResolution: AGE_RELAXATION_RESOLUTION.RELAXATION_UNRESOLVED,
    nowIso: '2025-06-01T00:00:00Z'
  });

  // Disqualification is prohibited! Must be NOT_EVALUATED
  assert.notStrictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_ELIGIBLE);
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
  assert.ok(view.unresolvedRuleIds.includes('rule_base_age_30'));
});

// -----------------------------------------------------------------------------
// TEST 2: SC candidate above base age + RELAXATION_NONE_VERIFIED => strictly NOT_ELIGIBLE
// -----------------------------------------------------------------------------
assertTest('SC candidate above base age + RELAXATION_NONE_VERIFIED => strictly NOT_ELIGIBLE', () => {
  const profile = normalizeCareerProfile({
    userId: 'sc_candidate_33_no_relax',
    dateOfBirth: '1992-05-15', // Age 33 at 2025-06-01
    reservationCategory: VERTICAL_CATEGORY.SC
  });

  const rules = [
    {
      ruleId: 'rule_base_age_30',
      ruleType: 'AGE_MAX',
      officialValue: 30,
      sourceDocumentId: 'doc_advt_01',
      sourceLocator: 'p3'
    }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_02',
    ageRelaxationResolution: AGE_RELAXATION_RESOLUTION.RELAXATION_NONE_VERIFIED,
    nowIso: '2025-06-01T00:00:00Z'
  });

  // Explicit verified absence of relaxation allows safe disqualification
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_ELIGIBLE);
  assert.ok(view.failedRuleIds.includes('rule_base_age_30'));
});

// -----------------------------------------------------------------------------
// TEST 3: SC candidate + verified relaxation rule => rule applied exactly
// -----------------------------------------------------------------------------
assertTest('SC candidate + verified relaxation rule => rule applied exactly', () => {
  const profile = normalizeCareerProfile({
    userId: 'sc_candidate_33_with_rule',
    dateOfBirth: '1992-05-15', // Age 33 at 2025-06-01
    reservationCategory: VERTICAL_CATEGORY.SC,
    highestQualification: 'GRADUATION'
  });

  const rules = [
    {
      ruleId: 'rule_base_age_30',
      ruleType: 'AGE_MAX',
      officialValue: 30,
      sourceDocumentId: 'doc_advt_01',
      sourceLocator: 'p3'
    },
    {
      ruleId: 'rule_sc_relax_5y',
      ruleType: 'AGE_RELAXATION',
      category: VERTICAL_CATEGORY.SC,
      relaxationYears: 5,
      sourceDocumentId: 'doc_advt_01',
      sourceLocator: 'p3_subclause_b'
    }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_03',
    ageRelaxationResolution: AGE_RELAXATION_RESOLUTION.RELAXATION_PRESENT_VERIFIED,
    nowIso: '2025-06-01T00:00:00Z'
  });

  assert.strictEqual(view.passedRuleIds.includes('rule_base_age_30'), true);
  assert.strictEqual(view.failedRuleIds.length, 0);
});

// -----------------------------------------------------------------------------
// TEST 4: All extracted rules pass but EXPERIENCE family unresolved => ELIGIBLE prohibited
// -----------------------------------------------------------------------------
assertTest('All extracted rules pass but EXPERIENCE family unresolved => ELIGIBLE prohibited', () => {
  const profile = normalizeCareerProfile({
    userId: 'candidate_all_pass',
    dateOfBirth: '1998-01-01',
    highestQualification: 'GRADUATION',
    subjectOrDiscipline: 'CIVIL_ENGINEERING',
    domicileState: 'RJ',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const rules = [
    { ruleId: 'r_age', ruleType: 'AGE_MAX', officialValue: 35, sourceDocumentId: 'doc_1', sourceLocator: 'p1' },
    { ruleId: 'r_qual', ruleType: 'QUALIFICATION_MIN', officialValue: 'GRADUATION', sourceDocumentId: 'doc_1', sourceLocator: 'p2' },
    { ruleId: 'r_disc', ruleType: 'DISCIPLINE_REQUIRED', officialValue: 'CIVIL_ENGINEERING', sourceDocumentId: 'doc_1', sourceLocator: 'p3' },
    { ruleId: 'r_dom', ruleType: 'DOMICILE_REQUIRED', officialValue: 'RJ', sourceDocumentId: 'doc_1', sourceLocator: 'p4' }
  ];

  // Incomplete rulebook: EXPERIENCE family is UNRESOLVED
  const rulebookCompleteness = {
    requiredFamilies: [RULE_FAMILY.AGE, RULE_FAMILY.EDUCATION, RULE_FAMILY.DISCIPLINE, RULE_FAMILY.DOMICILE, RULE_FAMILY.EXPERIENCE],
    familyStatuses: {
      AGE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      EDUCATION: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      DISCIPLINE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      DOMICILE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      EXPERIENCE: RULE_FAMILY_STATUS.UNRESOLVED
    }
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_04',
    rulebookCompleteness,
    nowIso: '2025-06-01T00:00:00Z'
  });

  // Must NOT be ELIGIBLE! Must be NOT_EVALUATED due to incomplete rulebook
  assert.notStrictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
  assert.ok(view.unresolvedRuleFamilies.includes(RULE_FAMILY.EXPERIENCE));
});

// -----------------------------------------------------------------------------
// TEST 5: User DOB missing with complete age rule => MORE_INFORMATION_NEEDED
// -----------------------------------------------------------------------------
assertTest('User DOB missing with complete age rule => MORE_INFORMATION_NEEDED (user profile gap)', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_missing_dob',
    dateOfBirth: null, // User fact missing
    highestQualification: 'GRADUATION'
  });

  const rules = [
    { ruleId: 'r_age', ruleType: 'AGE_MAX', officialValue: 30, sourceDocumentId: 'doc_1', sourceLocator: 'p1' }
  ];

  const rulebookCompleteness = {
    requiredFamilies: [RULE_FAMILY.AGE],
    familyStatuses: {
      AGE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE
    }
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_05',
    rulebookCompleteness
  });

  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.MORE_INFORMATION_NEEDED);
  assert.ok(view.missingProfileFields.includes('dateOfBirth'));
});

// -----------------------------------------------------------------------------
// TEST 6: Official age rule missing / unverified => NOT_EVALUATED
// -----------------------------------------------------------------------------
assertTest('Official age rule missing / unverified => NOT_EVALUATED (official source gap)', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_with_dob',
    dateOfBirth: '1999-01-01',
    highestQualification: 'GRADUATION'
  });

  // Fabricated rule missing verified source evidence
  const unverifiedRule = {
    ruleId: 'r_unverified_age',
    ruleType: 'AGE_MAX',
    officialValue: 30
    // Missing sourceDocumentId / sourceLocator
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [unverifiedRule],
    vacancyRows: [],
    eventId: 'evt_advt_test_06'
  });

  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
  assert.ok(view.unresolvedRuleIds.includes('r_unverified_age'));
  assert.strictEqual(view.missingProfileFields.length, 0); // NOT a user profile gap!
});

// -----------------------------------------------------------------------------
// TEST 7: Partial vacancy matrix with zero matching rows => VACANCIES_PENDING_RESERVATION_DATA
// -----------------------------------------------------------------------------
assertTest('Partial vacancy matrix with zero matching rows => VACANCIES_PENDING_RESERVATION_DATA', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_ur_01',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  // Only partial seat matrix extracted (e.g. SC only)
  const partialVacancyRows = [
    { rowId: 'v_sc_only', verticalCategory: 'SC', vacancyCount: 20 }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [],
    vacancyRows: partialVacancyRows,
    vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_PARTIAL,
    eventId: 'evt_advt_test_07'
  });

  // Cannot claim NO_APPLICABLE_VACANCIES from partial matrix!
  assert.notStrictEqual(view.vacancyApplicabilityStatus, VACANCY_APPLICABILITY_STATUS.NO_APPLICABLE_VACANCIES);
  assert.strictEqual(view.vacancyApplicabilityStatus, VACANCY_APPLICABILITY_STATUS.VACANCIES_PENDING_RESERVATION_DATA);
});

// -----------------------------------------------------------------------------
// TEST 8: Complete vacancy matrix with zero applicable rows => NO_APPLICABLE_VACANCIES
// -----------------------------------------------------------------------------
assertTest('Complete vacancy matrix with zero applicable rows => NO_APPLICABLE_VACANCIES', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_ur_02',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  // Fully audited and complete vacancy matrix where UR has 0 vacancies (special drive)
  const completeVacancyRows = [
    { rowId: 'v_sc_drive', verticalCategory: 'SC', vacancyCount: 20 },
    { rowId: 'v_st_drive', verticalCategory: 'ST', vacancyCount: 10 }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [],
    vacancyRows: completeVacancyRows,
    vacancyMatrixCompleteness: VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_COMPLETE,
    eventId: 'evt_advt_test_08'
  });

  assert.strictEqual(view.vacancyApplicabilityStatus, VACANCY_APPLICABILITY_STATUS.NO_APPLICABLE_VACANCIES);
});

// -----------------------------------------------------------------------------
// TEST 9: Base notification verified but amendment chain partial => affected field remains unresolved
// -----------------------------------------------------------------------------
assertTest('Base notification verified but amendment chain partial => affected field remains unresolved', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_amendment_check',
    dateOfBirth: '1995-01-01',
    highestQualification: 'GRADUATION'
  });

  const rules = [
    { ruleId: 'r_age', ruleType: 'AGE_MAX', officialValue: 30, sourceDocumentId: 'doc_base', sourceLocator: 'p1' }
  ];

  const rulebookCompleteness = {
    requiredFamilies: [RULE_FAMILY.AGE],
    familyStatuses: { AGE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE }
  };

  const amendmentChain = {
    baseNotificationDocId: 'doc_base',
    amendmentSearchStatus: AMENDMENT_CHAIN_STATUS.CHAIN_PARTIAL
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_09',
    rulebookCompleteness,
    amendmentChain
  });

  // Effective truth cannot be finalized because amendment chain search is partial
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
});

// -----------------------------------------------------------------------------
// TEST 10: Complete rulebook + complete amendments + all mandatory rules pass => ELIGIBLE permitted
// -----------------------------------------------------------------------------
assertTest('Complete rulebook + complete amendments + all mandatory rules pass => ELIGIBLE permitted', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_eligible_final',
    dateOfBirth: '1998-01-01', // Age 27 at 2025-06-01
    highestQualification: 'GRADUATION',
    subjectOrDiscipline: 'POLITICAL_SCIENCE',
    domicileState: 'RJ',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const rules = [
    { ruleId: 'r_age', ruleType: 'AGE_MAX', officialValue: 35, sourceDocumentId: 'doc_base', sourceLocator: 'p1' },
    { ruleId: 'r_qual', ruleType: 'QUALIFICATION_MIN', officialValue: 'GRADUATION', sourceDocumentId: 'doc_base', sourceLocator: 'p2' },
    { ruleId: 'r_disc', ruleType: 'DISCIPLINE_REQUIRED', officialValue: 'POLITICAL_SCIENCE', sourceDocumentId: 'doc_base', sourceLocator: 'p3' },
    { ruleId: 'r_dom', ruleType: 'DOMICILE_REQUIRED', officialValue: 'RJ', sourceDocumentId: 'doc_base', sourceLocator: 'p4' }
  ];

  const rulebookCompleteness = {
    requiredFamilies: [RULE_FAMILY.AGE, RULE_FAMILY.EDUCATION, RULE_FAMILY.DISCIPLINE, RULE_FAMILY.DOMICILE],
    familyStatuses: {
      AGE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      EDUCATION: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      DISCIPLINE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE,
      DOMICILE: RULE_FAMILY_STATUS.VERIFIED_COMPLETE
    }
  };

  const amendmentChain = {
    baseNotificationDocId: 'doc_base',
    amendmentSearchStatus: AMENDMENT_CHAIN_STATUS.CURRENT_CHAIN_VERIFIED
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    vacancyRows: [],
    eventId: 'evt_advt_test_10',
    rulebookCompleteness,
    amendmentChain,
    nowIso: '2025-06-01T00:00:00Z'
  });

  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
  assert.strictEqual(view.matchResultState, ELIGIBILITY_STATUS.ELIGIBLE);
  assert.strictEqual(view.relevanceScore, 1.0);
});

console.log('\n================================================================================');
console.log('ALL 10/10 GATE 48CS2R3 SOURCE-COMPLETENESS SAFETY TESTS PASSED');
console.log('================================================================================\n');
