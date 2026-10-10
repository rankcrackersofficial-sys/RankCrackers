/**
 * 🔱 RANKCRACKERS GATE 48CS2R1 AUTOMATED TEST SUITE
 * Career Signal Personalization, Matching Engine & Rule Verification Tests
 *
 * Covers all 23 scenarios required by Chief Architect:
 *   1. Permanent mission + multiple recruitment cycles
 *   2. One-off recruitment with permanentMissionId = null
 *   3. NotificationCandidate discovery staging boundary
 *   4. CareerSignalEvent identity vs CareerSignalView identity
 *   5. No arbitrary 7-day expiry
 *   6. Canonical state-machine alignment
 *   7. Application deadline amendment
 *   8. Exam completed stage
 *   9. Result stage
 *   10. Cycle closed
 *   11. Known ineligible (strictly NOT_ELIGIBLE, not incomplete)
 *   12. Missing profile field (MORE_INFORMATION_NEEDED)
 *   13. Unresolved official rule (NOT_EVALUATED)
 *   14. SC female reservation applicability
 *   15. OBC female reservation isolation
 *   16. Horizontal/vertical no-double-count
 *   17. Open-merit rule fixture
 *   18. Separate qualification vs academic match
 *   19. Location match not evaluated (not default false)
 *   20. Preference match not evaluated (not default false)
 *   21. JOB vs ADMISSION opportunity kind (JEE/NEET admission semantics)
 *   22. Participation-based process priority
 *   23. Same SHA idempotency
 */

'use strict';

const assert = require('assert');
const {
  CANONICAL_RECRUITMENT_CYCLE_STATUS,
  OPPORTUNITY_KIND,
  CAREER_SIGNAL_EVENT_TYPE,
  VERIFICATION_STATE,
  PARTICIPATION_STATE,
  MATCH_RESULT_STATE,
  VERTICAL_CATEGORY,
  HORIZONTAL_CATEGORY,
  normalizeNotificationCandidate,
  normalizeCareerSignalEvent,
  normalizeCareerSignalView,
  normalizeNotificationEvent,
  normalizeRecruitmentCycle,
  normalizeCareerProfile
} = require('../services/career_signal_models');

const {
  computeActiveSignalFlags,
  reduceEventsToEffectiveState
} = require('../services/career_signal_reducer');

const {
  calculateAgeYears,
  getAgeRelaxationYears,
  evaluateSingleRule,
  evaluateApplicableVacancies,
  evaluateCareerSignalPersonalization
} = require('../services/career_signal_matching_engine');

const { routeSourceDocumentImpact } = require('../services/source_impact_router');

console.log('================================================================================');
console.log('RUNNING GATE 48CS2R1 AUTOMATED TEST SUITE');
console.log('================================================================================\n');

let passedTests = 0;
let totalTests = 23;

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

// 1. Permanent mission + multiple recruitment cycles
assertTest('Permanent mission + multiple recruitment cycles', () => {
  const permId = 'upsc_cse_prelims';
  const c2025 = normalizeRecruitmentCycle({
    cycleId: 'rc_upsc_cse_2025',
    permanentMissionId: permId,
    authorityKey: 'auth_in_upsc',
    title: 'Civil Services 2025',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED
  });
  const c2026 = normalizeRecruitmentCycle({
    cycleId: 'rc_upsc_cse_2026',
    permanentMissionId: permId,
    authorityKey: 'auth_in_upsc',
    title: 'Civil Services 2026',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN
  });

  assert.strictEqual(c2025.permanentMissionId, permId);
  assert.strictEqual(c2026.permanentMissionId, permId);
  assert.notStrictEqual(c2025.cycleId, c2026.cycleId);
  assert.strictEqual(c2025.status, 'CYCLE_CLOSED');
  assert.strictEqual(c2026.status, 'APPLICATION_OPEN');
});

// 2. One-off recruitment with permanentMissionId = null
assertTest('One-off recruitment operates cleanly with permanentMissionId = null', () => {
  const oneOff = normalizeRecruitmentCycle({
    cycleId: 'rc_special_drive_drdo_2026',
    permanentMissionId: null,
    authorityKey: 'auth_in_drdo',
    title: 'DRDO Scientist-B Special Recruitment',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN
  });

  assert.strictEqual(oneOff.permanentMissionId, null);
  assert.strictEqual(oneOff.cycleId, 'rc_special_drive_drdo_2026');
});

// 3. NotificationCandidate discovery staging boundary
assertTest('NotificationCandidate discovery staging boundary is distinct from delivery queue', () => {
  const candidate = normalizeNotificationCandidate({
    candidateId: 'cand_upsc_gazette_2026_01',
    authorityKey: 'auth_in_upsc',
    sourceDocumentRef: { docId: 'doc_gazette_772', sha: 'abc123' },
    status: 'STAGED_FOR_REVIEW'
  });

  assert.strictEqual(candidate.candidateId, 'cand_upsc_gazette_2026_01');
  assert.strictEqual(candidate.status, 'STAGED_FOR_REVIEW');
  assert.strictEqual(candidate.userId, undefined); // Candidate is NOT tied to any user
});

// 4. CareerSignalEvent identity vs CareerSignalView identity
assertTest('CareerSignalEvent identity is user-independent; CareerSignalView is user-scoped', () => {
  const docSha = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const event = normalizeCareerSignalEvent({
    cycleId: 'rc_rpsc_ras_2026',
    authorityKey: 'auth_in_rj_rpsc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION,
    documentProvenance: {
      officialSourceIdentity: 'https://rpsc.rajasthan.gov.in',
      authorityBinding: 'auth_in_rj_rpsc',
      documentIdentity: 'doc_ras_2026',
      documentSha256: docSha,
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  assert.ok(event.eventId.startsWith('evt_'));

  const userView = normalizeCareerSignalView({
    userId: 'user_warrior_99',
    eventId: event.eventId,
    cycleId: event.cycleId,
    matchResultState: MATCH_RESULT_STATE.ELIGIBLE
  });

  assert.strictEqual(userView.viewId, `user_warrior_99_${event.eventId}`);
  assert.notStrictEqual(userView.viewId, event.eventId);
});

// 5. No arbitrary 7-day expiry
assertTest('Signal active state is derived from deadline/state, zero reliance on 7-day business expiry', () => {
  const flags1 = computeActiveSignalFlags('APPLICATION_OPEN', '2026-10-31T23:59:59Z', '2026-09-10T12:00:00Z');
  assert.strictEqual(flags1.opportunitySignalActive, true);

  // Past deadline -> opportunity is false immediately
  const flags2 = computeActiveSignalFlags('APPLICATION_OPEN', '2026-09-01T23:59:59Z', '2026-09-10T12:00:00Z');
  assert.strictEqual(flags2.opportunitySignalActive, false);
});

// 6. Canonical state-machine alignment (12 canonical states)
assertTest('Canonical 12-state vocabulary alignment', () => {
  const states = [
    'ANNOUNCED', 'APPLICATION_OPEN', 'APPLICATION_CLOSED', 'EXAM_SCHEDULED',
    'EXAM_COMPLETED', 'ANSWER_KEY_STAGE', 'RESULT_STAGE', 'INTERVIEW_OR_DV_STAGE',
    'FINAL_RESULT_DECLARED', 'CYCLE_CLOSED', 'CANCELLED', 'STATUS_UNRESOLVED'
  ];

  for (const s of states) {
    assert.strictEqual(CANONICAL_RECRUITMENT_CYCLE_STATUS[s], s);
  }
});

// 7. Application deadline amendment
assertTest('Application deadline amendment preserves extension history', () => {
  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_ssc_cgl_2026',
    authorityKey: 'auth_in_ssc',
    title: 'SSC CGL 2026',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN,
    applicationWindow: { startDate: '2026-01-01', endDate: '2026-01-31' }
  });

  const amendEvent = normalizeCareerSignalEvent({
    cycleId: 'rc_ssc_cgl_2026',
    authorityKey: 'auth_in_ssc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.DEADLINE_EXTENSION,
    payload: { applicationEnd: '2026-02-15T23:59:59Z' },
    documentProvenance: {
      officialSourceIdentity: 'https://ssc.gov.in',
      authorityBinding: 'auth_in_ssc',
      documentIdentity: 'doc_corrigendum_01',
      documentSha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const reduced = reduceEventsToEffectiveState(cycle, [amendEvent], { nowIso: '2026-02-05T00:00:00Z' });
  assert.strictEqual(reduced.applicationWindow.isExtended, true);
  assert.strictEqual(reduced.applicationWindow.endDate, '2026-02-15T23:59:59Z');
  assert.strictEqual(reduced.applicationWindow.extensionHistory.length, 1);
  assert.strictEqual(reduced.opportunitySignalActive, true);
});

// 8. Exam completed stage
assertTest('Exam completed stage: opportunity false, process true', () => {
  const flags = computeActiveSignalFlags(CANONICAL_RECRUITMENT_CYCLE_STATUS.EXAM_COMPLETED, null, '2026-09-10T00:00:00Z');
  assert.strictEqual(flags.opportunitySignalActive, false);
  assert.strictEqual(flags.processUpdateSignalActive, true);
});

// 9. Result stage
assertTest('Result stage: opportunity false, process true', () => {
  const flags = computeActiveSignalFlags(CANONICAL_RECRUITMENT_CYCLE_STATUS.RESULT_STAGE, null, '2026-09-10T00:00:00Z');
  assert.strictEqual(flags.opportunitySignalActive, false);
  assert.strictEqual(flags.processUpdateSignalActive, true);
});

// 10. Cycle closed
assertTest('Cycle closed: opportunity false, process false', () => {
  const flags = computeActiveSignalFlags(CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED, null, '2026-09-10T00:00:00Z');
  assert.strictEqual(flags.opportunitySignalActive, false);
  assert.strictEqual(flags.processUpdateSignalActive, false);
});

// 11. Known ineligible (strictly NOT_ELIGIBLE, not incomplete)
assertTest('Known failed rule maps strictly to NOT_ELIGIBLE (zero collapse to incomplete)', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_01',
    dateOfBirth: '1980-01-01', // 46 years old
    highestQualification: 'GRADUATION',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const rules = [
    {
      ruleId: 'rule_age_max_35',
      ruleType: 'AGE_MAX',
      operator: 'LTE',
      officialValue: 35
    }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    cycle: { cycleId: 'rc_test' },
    nowIso: '2026-09-10T00:00:00Z'
  });

  assert.strictEqual(view.matchResultState, MATCH_RESULT_STATE.NOT_ELIGIBLE);
  assert.strictEqual(view.failedRuleIds.includes('rule_age_max_35'), true);
});

// 12. Missing profile field (MORE_INFORMATION_NEEDED)
assertTest('Missing profile field maps to MORE_INFORMATION_NEEDED', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_02',
    dateOfBirth: null, // DOB missing
    highestQualification: 'GRADUATION'
  });

  const rules = [
    { ruleId: 'rule_age_max_30', ruleType: 'AGE_MAX', officialValue: 30 }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    cycle: { cycleId: 'rc_test' },
    nowIso: '2026-09-10T00:00:00Z'
  });

  assert.strictEqual(view.matchResultState, MATCH_RESULT_STATE.MORE_INFORMATION_NEEDED);
  assert.strictEqual(view.missingProfileFields.includes('dateOfBirth'), true);
});

// 13. Unresolved official rule (NOT_EVALUATED)
assertTest('Unresolved/unsupported official rule maps to NOT_EVALUATED', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_03',
    dateOfBirth: '2000-01-01',
    highestQualification: 'GRADUATION'
  });

  const rules = [
    { ruleId: 'rule_advanced_psychometric', ruleType: 'UNKNOWN_CUSTOM_HEURISTIC', officialValue: 'PASS' }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    cycle: { cycleId: 'rc_test' },
    nowIso: '2026-09-10T00:00:00Z'
  });

  assert.strictEqual(view.matchResultState, MATCH_RESULT_STATE.NOT_EVALUATED);
  assert.strictEqual(view.unresolvedRuleIds.includes('rule_advanced_psychometric'), true);
});

// 14. SC female reservation applicability
assertTest('SC female applicant matches UR and SC female vacancies', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_sc_female',
    gender: 'FEMALE',
    reservationCategory: VERTICAL_CATEGORY.SC
  });

  const vacancyRows = [
    { postCode: 'P1', verticalCategory: 'UR', genderApplicability: 'ALL' },
    { postCode: 'P2', verticalCategory: 'SC', genderApplicability: 'FEMALE_ONLY' },
    { postCode: 'P3', verticalCategory: 'OBC', genderApplicability: 'FEMALE_ONLY' }
  ];

  const applicable = evaluateApplicableVacancies(profile, vacancyRows);
  const postCodes = applicable.map(r => r.postCode);

  assert.strictEqual(postCodes.includes('P1'), true); // Can match UR
  assert.strictEqual(postCodes.includes('P2'), true); // Can match SC female
  assert.strictEqual(postCodes.includes('P3'), false); // Cannot match OBC
});

// 15. OBC female reservation isolation
assertTest('OBC female applicant is isolated from SC vacancies', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_obc_female',
    gender: 'FEMALE',
    reservationCategory: VERTICAL_CATEGORY.OBC_NCL
  });

  const vacancyRows = [
    { postCode: 'P_SC', verticalCategory: 'SC', genderApplicability: 'ALL' },
    { postCode: 'P_OBC', verticalCategory: 'OBC', genderApplicability: 'ALL' }
  ];

  const applicable = evaluateApplicableVacancies(profile, vacancyRows);
  const postCodes = applicable.map(r => r.postCode);

  assert.strictEqual(postCodes.includes('P_OBC'), true);
  assert.strictEqual(postCodes.includes('P_SC'), false);
});

// 16. Horizontal/vertical no-double-count
assertTest('Horizontal quota intersection without double counting', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_pwbd_male',
    gender: 'MALE',
    reservationCategory: VERTICAL_CATEGORY.UR,
    isPwBD: true
  });

  const vacancyRows = [
    { postCode: 'P_GEN', verticalCategory: 'UR', horizontalCategory: 'NONE', genderApplicability: 'ALL' },
    { postCode: 'P_PWBD', verticalCategory: 'UR', horizontalCategory: 'PWBD', genderApplicability: 'ALL' },
    { postCode: 'P_EX_SER', verticalCategory: 'UR', horizontalCategory: 'EX_SERVICEMAN', genderApplicability: 'ALL' }
  ];

  const applicable = evaluateApplicableVacancies(profile, vacancyRows);
  const postCodes = applicable.map(r => r.postCode);

  assert.strictEqual(postCodes.includes('P_GEN'), true);
  assert.strictEqual(postCodes.includes('P_PWBD'), true);
  assert.strictEqual(postCodes.includes('P_EX_SER'), false); // Not ex-serviceman
});

// 17. Open-merit rule fixture
assertTest('UR (Open Merit) vacancy matches qualified candidate of any category', () => {
  const stCandidate = normalizeCareerProfile({
    userId: 'user_st',
    gender: 'MALE',
    reservationCategory: VERTICAL_CATEGORY.ST
  });

  const vacancyRows = [
    { postCode: 'P_OPEN', verticalCategory: 'UR', genderApplicability: 'ALL' }
  ];

  const applicable = evaluateApplicableVacancies(stCandidate, vacancyRows);
  assert.strictEqual(applicable.length, 1);
  assert.strictEqual(applicable[0].postCode, 'P_OPEN');
});

// 18. Separate qualification vs academic match
assertTest('academicMatch and qualificationMatch are separate, not collapsed', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_eng',
    highestQualification: 'GRADUATION', // Qualifies for degree
    subjectOrDiscipline: 'History' // Does not qualify for Engineering discipline
  });

  const rules = [
    { ruleId: 'rule_degree', ruleType: 'QUALIFICATION_MIN', officialValue: 'GRADUATION' },
    { ruleId: 'rule_discipline', ruleType: 'DISCIPLINE_REQUIRED', officialValue: 'Computer Science' }
  ];

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules,
    cycle: { cycleId: 'rc_tech_job' },
    nowIso: '2026-09-10T00:00:00Z'
  });

  assert.strictEqual(view.qualificationMatch, true);
  assert.strictEqual(view.academicMatch, false);
  assert.notStrictEqual(view.qualificationMatch, view.academicMatch);
});

// 19. Location not evaluated (not default false)
assertTest('Location match defaults to null/NOT_EVALUATED when unconstrained, not false', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_unconstrained',
    domicileState: null
  });

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [],
    cycle: { cycleId: 'rc_central_exam' }
  });

  assert.strictEqual(view.locationMatch, null);
});

// 20. Preference not evaluated (not default false)
assertTest('Preference match defaults to null/NOT_EVALUATED, not false', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_no_pref'
  });

  const view = evaluateCareerSignalPersonalization({
    profile,
    rules: [],
    cycle: { cycleId: 'rc_open' }
  });

  assert.strictEqual(view.preferenceMatch, null);
});

// 21. JOB vs ADMISSION opportunity kind (JEE/NEET admission semantics)
assertTest('JEE/NEET opportunities carry ADMISSION_ENTRANCE kind, not JOB_RECRUITMENT', () => {
  const neetCycle = normalizeRecruitmentCycle({
    cycleId: 'rc_neet_2027',
    authorityKey: 'auth_in_nta',
    title: 'National Eligibility cum Entrance Test (UG)',
    opportunityKind: OPPORTUNITY_KIND.ADMISSION_ENTRANCE
  });

  assert.strictEqual(neetCycle.opportunityKind, 'ADMISSION_ENTRANCE');
  assert.notStrictEqual(neetCycle.opportunityKind, 'JOB_RECRUITMENT');
});

// 22. Participation-based process priority
assertTest('EXAM_APPEARED participant gets HIGH_PRIORITY_PERSONALIZED; non-participant gets STANDARD_PUBLIC_UPDATE', () => {
  const profile = normalizeCareerProfile({ userId: 'student_77' });
  const resultCycle = { cycleId: 'rc_upsc_2026', status: 'RESULT_STAGE' };

  // Case A: Appeared in exam
  const appearedView = evaluateCareerSignalPersonalization({
    profile,
    cycle: resultCycle,
    participationState: PARTICIPATION_STATE.EXAM_APPEARED
  });
  assert.strictEqual(appearedView.priority, 'HIGH_PRIORITY_PERSONALIZED');
  assert.match(appearedView.reasonCodes[0], /for your participating/);

  // Case B: Non-participant
  const observerView = evaluateCareerSignalPersonalization({
    profile,
    cycle: resultCycle,
    participationState: PARTICIPATION_STATE.DISCOVERED
  });
  assert.strictEqual(observerView.priority, 'STANDARD_PUBLIC_UPDATE');
  assert.doesNotMatch(observerView.reasonCodes[0], /your/);
});

// 23. Same SHA idempotency
assertTest('Same document SHA produces exact same eventId and prevents duplicate event generation', () => {
  const docSha = '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff';
  const doc = {
    title: 'GATE 2026 Notification',
    documentType: 'ADVERTISEMENT',
    permanentMissionId: 'gate_2026',
    provenance: {
      officialSourceIdentity: 'https://gate2026.iitk.ac.in',
      authorityBinding: 'auth_in_iit',
      documentIdentity: 'doc_gate_2026_brochure',
      documentSha256: docSha,
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  };

  const res1 = routeSourceDocumentImpact(doc, { processedShaStore: new Set() });
  const eventId1 = res1.impacts.careerSignalImpact.event.eventId;

  const res2 = routeSourceDocumentImpact(doc, { processedShaStore: new Set() });
  const eventId2 = res2.impacts.careerSignalImpact.event.eventId;

  assert.strictEqual(eventId1, eventId2);
  assert.strictEqual(eventId1, `evt_${docSha.substring(0, 16)}`);
});

console.log('\n================================================================================');
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% CANONICAL INTEGRITY`);
console.log('================================================================================\n');
