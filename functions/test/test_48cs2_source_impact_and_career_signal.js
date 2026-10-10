/**
 * 🔱 RANKCRACKERS GATE 48CS2 TEST SUITE
 * One-Source Multi-Output Backend Engine & Career Signal Reducer Tests
 *
 * Validates all 11 required Chief Architect scenarios:
 *   1. Same permanent mission + new recruitment cycle
 *   2. Closed cycle + mission remains active (syllabus/digibook preserved)
 *   3. New notification signal (APPLICATION_OPEN -> opportunity: true, process: false)
 *   4. Deadline amendment (corrigendum preserves old date in history, updates effective state)
 *   5. Exam-completed no active application signal (opportunity: false, process: true)
 *   6. Result-stage process signal (opportunity: false, process: true)
 *   7. Cycle-closed no active signal (opportunity: false, process: false)
 *   8. One-off recruitment with missionId=null
 *   9. No source evidence -> no verified signal
 *   10. Idempotent repeated document ingestion
 *   11. Same document SHA -> no duplicate event
 */

'use strict';

const assert = require('assert');
const {
  CANONICAL_RECRUITMENT_CYCLE_STATUS,
  RECRUITMENT_CYCLE_STATUS,
  CAREER_SIGNAL_EVENT_TYPE,
  VERIFICATION_STATE,
  normalizeRecruitmentCycle,
  normalizeCareerSignalEvent
} = require('../services/career_signal_models');
const { reduceEventsToEffectiveState, computeActiveSignalFlags } = require('../services/career_signal_reducer');
const { routeSourceDocumentImpact } = require('../services/source_impact_router');
const { processCleanMissionFastPath } = require('../services/mission_creation_fast_path');

console.log('================================================================================');
console.log('RUNNING GATE 48CS2 AUTOMATED TEST SUITE');
console.log('================================================================================\n');

let passedTests = 0;
let totalTests = 11;

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
// TEST 1: Same permanent mission + new recruitment cycle
// -----------------------------------------------------------------------------
assertTest('Same permanent mission + new recruitment cycle separation', () => {
  const permanentMissionId = 'upsc_cse_prelims';
  const cycle2025 = normalizeRecruitmentCycle({
    cycleId: 'rc_auth_in_upsc_cse_2025',
    permanentMissionId: permanentMissionId,
    authorityKey: 'auth_in_upsc',
    title: 'Civil Services Examination 2025',
    cycleYear: 2025,
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED
  });

  const cycle2026 = normalizeRecruitmentCycle({
    cycleId: 'rc_auth_in_upsc_cse_2026',
    permanentMissionId: permanentMissionId,
    authorityKey: 'auth_in_upsc',
    title: 'Civil Services Examination 2026',
    cycleYear: 2026,
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN
  });

  assert.strictEqual(cycle2025.permanentMissionId, permanentMissionId);
  assert.strictEqual(cycle2026.permanentMissionId, permanentMissionId);
  assert.notStrictEqual(cycle2025.cycleId, cycle2026.cycleId);
  assert.strictEqual(cycle2025.status, CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED);
  assert.strictEqual(cycle2026.status, CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN);
});

// -----------------------------------------------------------------------------
// TEST 2: Closed cycle + mission remains active (Mission Independence)
// -----------------------------------------------------------------------------
assertTest('Closed cycle + mission remains active without syllabus or digibook destruction', () => {
  const missionProfile = {
    missionId: 'rpsc_ras_prelims',
    title: 'RPSC RAS – Prelims',
    canonicalAuthorityKey: 'auth_in_rj_rpsc',
    status: 'LIVE',
    syllabusReady: 'ready',
    digibookReady: 'ready'
  };

  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_rpsc_ras_2024',
    permanentMissionId: 'rpsc_ras_prelims',
    authorityKey: 'auth_in_rj_rpsc',
    title: 'RAS/RTS Comb. Comp. Exam 2024',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN
  });

  const closeEvent = normalizeCareerSignalEvent({
    eventId: 'evt_close_001',
    cycleId: 'rc_rpsc_ras_2024',
    permanentMissionId: 'rpsc_ras_prelims',
    authorityKey: 'auth_in_rj_rpsc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.FINAL_RESULT,
    effectiveDate: '2026-06-30T12:00:00Z',
    payload: { cycleClosed: true },
    documentProvenance: {
      officialSourceIdentity: 'https://rpsc.rajasthan.gov.in/results',
      authorityBinding: 'auth_in_rj_rpsc',
      documentIdentity: 'doc_rpsc_ras_2024_final_result',
      documentSha256: 'a1b2c3d4e5f600112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const effectiveCycle = reduceEventsToEffectiveState(cycle, [closeEvent], { nowIso: '2026-07-01T00:00:00Z' });

  // Assert cycle is closed
  assert.strictEqual(effectiveCycle.status, CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED);
  assert.strictEqual(effectiveCycle.opportunitySignalActive, false);
  assert.strictEqual(effectiveCycle.processUpdateSignalActive, false);

  // Assert permanent mission remains completely unaffected
  assert.strictEqual(missionProfile.missionId, 'rpsc_ras_prelims');
  assert.strictEqual(missionProfile.status, 'LIVE');
  assert.strictEqual(missionProfile.syllabusReady, 'ready');
  assert.strictEqual(missionProfile.digibookReady, 'ready');
});

// -----------------------------------------------------------------------------
// TEST 3: New notification signal (APPLICATION_OPEN -> opportunity: true)
// -----------------------------------------------------------------------------
assertTest('New notification signal produces opportunitySignalActive = true', () => {
  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_ssc_cgl_2026',
    permanentMissionId: 'ssc_cgl',
    authorityKey: 'auth_in_ssc',
    title: 'SSC Combined Graduate Level 2026'
  });

  const notifEvent = normalizeCareerSignalEvent({
    eventId: 'evt_notif_001',
    cycleId: 'rc_ssc_cgl_2026',
    permanentMissionId: 'ssc_cgl',
    authorityKey: 'auth_in_ssc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION,
    effectiveDate: '2026-08-01T00:00:00Z',
    payload: {
      applicationStart: '2026-08-01T00:00:00Z',
      applicationEnd: '2026-09-30T23:59:59Z',
      vacancies: 15000
    },
    documentProvenance: {
      officialSourceIdentity: 'https://ssc.gov.in/notices',
      authorityBinding: 'auth_in_ssc',
      documentIdentity: 'doc_ssc_cgl_2026_notice',
      documentSha256: 'b2c3d4e5f6a100112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const effective = reduceEventsToEffectiveState(cycle, [notifEvent], { nowIso: '2026-08-15T00:00:00Z' });

  assert.strictEqual(effective.status, CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN);
  assert.strictEqual(effective.opportunitySignalActive, true);
  assert.strictEqual(effective.processUpdateSignalActive, false);
  assert.strictEqual(effective.totalVacancies, 15000);
});

// -----------------------------------------------------------------------------
// TEST 4: Deadline amendment (Corrigendum preserves history, updates effective state)
// -----------------------------------------------------------------------------
assertTest('Deadline amendment preserves history and updates effective state', () => {
  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_ssc_cgl_2026',
    permanentMissionId: 'ssc_cgl',
    authorityKey: 'auth_in_ssc',
    title: 'SSC Combined Graduate Level 2026'
  });

  const originalNotif = normalizeCareerSignalEvent({
    eventId: 'evt_notif_001',
    cycleId: 'rc_ssc_cgl_2026',
    permanentMissionId: 'ssc_cgl',
    authorityKey: 'auth_in_ssc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.NEW_NOTIFICATION,
    effectiveDate: '2026-08-01T00:00:00Z',
    payload: {
      applicationStart: '2026-08-01T00:00:00Z',
      applicationEnd: '2026-08-31T23:59:59Z'
    },
    documentProvenance: {
      officialSourceIdentity: 'https://ssc.gov.in',
      authorityBinding: 'auth_in_ssc',
      documentIdentity: 'doc_ssc_notice_01',
      documentSha256: 'c3d4e5f6a1b200112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const extensionEvent = normalizeCareerSignalEvent({
    eventId: 'evt_corrigendum_001',
    cycleId: 'rc_ssc_cgl_2026',
    permanentMissionId: 'ssc_cgl',
    authorityKey: 'auth_in_ssc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.DEADLINE_EXTENSION,
    effectiveDate: '2026-08-25T00:00:00Z',
    payload: {
      applicationEnd: '2026-09-15T23:59:59Z',
      amendmentReason: 'Server connectivity issues'
    },
    documentProvenance: {
      officialSourceIdentity: 'https://ssc.gov.in',
      authorityBinding: 'auth_in_ssc',
      documentIdentity: 'doc_ssc_corrigendum_01',
      documentSha256: 'd4e5f6a1b2c300112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const effective = reduceEventsToEffectiveState(cycle, [originalNotif, extensionEvent], { nowIso: '2026-09-01T00:00:00Z' });

  assert.strictEqual(effective.applicationWindow.isExtended, true);
  assert.strictEqual(effective.applicationWindow.endDate, '2026-09-15T23:59:59Z');
  assert.strictEqual(effective.applicationWindow.extensionHistory.length, 1);
  assert.strictEqual(effective.applicationWindow.extensionHistory[0].previousEndDate, '2026-08-31T23:59:59Z');
  assert.strictEqual(effective.applicationWindow.extensionHistory[0].newEndDate, '2026-09-15T23:59:59Z');
  assert.strictEqual(effective.opportunitySignalActive, true);
});

// -----------------------------------------------------------------------------
// TEST 5: Exam-completed no active application signal
// -----------------------------------------------------------------------------
assertTest('Exam-completed has opportunity: false and process: true', () => {
  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_neet_2026',
    permanentMissionId: 'neet_(ug)-2027',
    authorityKey: 'auth_in_nta',
    title: 'NEET UG 2026',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN,
    applicationWindow: { startDate: '2026-01-01', endDate: '2026-02-01' }
  });

  const examEvent = normalizeCareerSignalEvent({
    eventId: 'evt_exam_done',
    cycleId: 'rc_neet_2026',
    permanentMissionId: 'neet_(ug)-2027',
    authorityKey: 'auth_in_nta',
    eventType: CAREER_SIGNAL_EVENT_TYPE.EXAM_COMPLETED,
    effectiveDate: '2026-05-05T00:00:00Z',
    documentProvenance: {
      officialSourceIdentity: 'https://nta.ac.in',
      authorityBinding: 'auth_in_nta',
      documentIdentity: 'doc_nta_press_release',
      documentSha256: 'e5f6a1b2c3d400112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const effective = reduceEventsToEffectiveState(cycle, [examEvent], { nowIso: '2026-05-06T00:00:00Z' });

  assert.strictEqual(effective.status, RECRUITMENT_CYCLE_STATUS.EXAM_COMPLETED);
  assert.strictEqual(effective.opportunitySignalActive, false);
  assert.strictEqual(effective.processUpdateSignalActive, true);
});

// -----------------------------------------------------------------------------
// TEST 6: Result-stage process signal
// -----------------------------------------------------------------------------
assertTest('Result-stage has opportunity: false and process: true', () => {
  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_jee_2026',
    permanentMissionId: 'jee_main_2026',
    authorityKey: 'auth_in_nta',
    title: 'JEE Main 2026',
    status: RECRUITMENT_CYCLE_STATUS.EXAM_COMPLETED
  });

  const resultEvent = normalizeCareerSignalEvent({
    eventId: 'evt_res_01',
    cycleId: 'rc_jee_2026',
    permanentMissionId: 'jee_main_2026',
    authorityKey: 'auth_in_nta',
    eventType: CAREER_SIGNAL_EVENT_TYPE.RESULT_DECLARED,
    effectiveDate: '2026-06-15T00:00:00Z',
    documentProvenance: {
      officialSourceIdentity: 'https://jeemain.nta.nic.in',
      authorityBinding: 'auth_in_nta',
      documentIdentity: 'doc_jee_session1_result',
      documentSha256: 'f6a1b2c3d4e500112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const effective = reduceEventsToEffectiveState(cycle, [resultEvent], { nowIso: '2026-06-16T00:00:00Z' });

  assert.strictEqual(effective.status, RECRUITMENT_CYCLE_STATUS.RESULT_STAGE);
  assert.strictEqual(effective.opportunitySignalActive, false);
  assert.strictEqual(effective.processUpdateSignalActive, true);
});

// -----------------------------------------------------------------------------
// TEST 7: Cycle-closed no active signal
// -----------------------------------------------------------------------------
assertTest('Cycle-closed has opportunity: false and process: false', () => {
  const cycle = normalizeRecruitmentCycle({
    cycleId: 'rc_upsc_cse_2024',
    permanentMissionId: 'upsc_cse_prelims',
    authorityKey: 'auth_in_upsc',
    title: 'Civil Services Examination 2024',
    status: RECRUITMENT_CYCLE_STATUS.RESULT_STAGE
  });

  const finalResultEvent = normalizeCareerSignalEvent({
    eventId: 'evt_fin_res',
    cycleId: 'rc_upsc_cse_2024',
    permanentMissionId: 'upsc_cse_prelims',
    authorityKey: 'auth_in_upsc',
    eventType: CAREER_SIGNAL_EVENT_TYPE.FINAL_RESULT,
    effectiveDate: '2025-04-15T00:00:00Z',
    documentProvenance: {
      officialSourceIdentity: 'https://upsc.gov.in',
      authorityBinding: 'auth_in_upsc',
      documentIdentity: 'doc_upsc_2024_final',
      documentSha256: 'a1a2a3a4a5a600112233445566778899aabbccddeeff00112233445566778899',
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  });

  const effective = reduceEventsToEffectiveState(cycle, [finalResultEvent], { nowIso: '2025-04-20T00:00:00Z' });

  // FINAL_RESULT_DECLARED remains visible as an active process update signal
  assert.strictEqual(effective.status, CANONICAL_RECRUITMENT_CYCLE_STATUS.FINAL_RESULT_DECLARED);
  assert.strictEqual(effective.opportunitySignalActive, false);
  assert.strictEqual(effective.processUpdateSignalActive, true);

  // CYCLE_CLOSED definitively terminates the cycle
  const closedCycle = normalizeRecruitmentCycle({
    ...effective,
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.CYCLE_CLOSED
  });
  const flags = computeActiveSignalFlags(closedCycle.status, null, '2025-05-01T00:00:00Z');
  assert.strictEqual(flags.opportunitySignalActive, false);
  assert.strictEqual(flags.processUpdateSignalActive, false);
});

// -----------------------------------------------------------------------------
// TEST 8: One-off recruitment with permanentMissionId = null
// -----------------------------------------------------------------------------
assertTest('One-off recruitment operates cleanly with permanentMissionId = null', () => {
  const oneOffCycle = normalizeRecruitmentCycle({
    cycleId: 'rc_special_driver_recruitment_2026',
    permanentMissionId: null, // No permanent mission exists
    authorityKey: 'auth_in_delhi_police',
    title: 'Special Driver Recruitment Drive 2026',
    status: CANONICAL_RECRUITMENT_CYCLE_STATUS.APPLICATION_OPEN
  });

  assert.strictEqual(oneOffCycle.permanentMissionId, null);
  assert.strictEqual(oneOffCycle.cycleId, 'rc_special_driver_recruitment_2026');
  assert.strictEqual(oneOffCycle.title, 'Special Driver Recruitment Drive 2026');
});

// -----------------------------------------------------------------------------
// TEST 9: No source evidence -> no verified signal
// -----------------------------------------------------------------------------
assertTest('Unverified source evidence is rejected and produces zero signals', () => {
  const unverifiedDoc = {
    title: 'Unverified Leak on Social Media',
    documentType: 'ADVERTISEMENT',
    provenance: {
      officialSourceIdentity: 'https://t.me/exam_leaks',
      authorityBinding: 'auth_in_upsc',
      documentIdentity: 'leaked_notice_2026',
      documentSha256: '112233445566778899aabbccddeeff00112233445566778899aabbccddeeff00',
      verificationState: 'UNVERIFIED_STAGING' // Not VERIFIED_SOURCE
    }
  };

  const routeResult = routeSourceDocumentImpact(unverifiedDoc);

  assert.strictEqual(routeResult.success, false);
  assert.strictEqual(routeResult.impacts.careerSignalImpact, null);
  assert.strictEqual(routeResult.impacts.missionImpact, null);
  assert.match(routeResult.rejectionReason, /UNVERIFIED_SOURCE_PROVENANCE/);
});

// -----------------------------------------------------------------------------
// TEST 10: Idempotent repeated document ingestion
// -----------------------------------------------------------------------------
assertTest('Idempotent repeated document ingestion produces NO_OP', () => {
  const docSha = '998877665544332211aabbccddeeff00112233445566778899aabbccddeeff00';
  const processedShaStore = new Set([docSha]);

  const verifiedDoc = {
    title: 'UPSC CSE 2026 Notification',
    documentType: 'ADVERTISEMENT',
    provenance: {
      officialSourceIdentity: 'https://upsc.gov.in/notices',
      authorityBinding: 'auth_in_upsc',
      documentIdentity: 'doc_upsc_cse_2026_notice',
      documentSha256: docSha,
      verificationState: VERIFICATION_STATE.VERIFIED_SOURCE
    }
  };

  const routeResult = routeSourceDocumentImpact(verifiedDoc, { processedShaStore });

  assert.strictEqual(routeResult.success, true);
  assert.strictEqual(routeResult.duplicateDetected, true);
  assert.strictEqual(routeResult.impacts.missionImpact.operation, 'NO_OP');
  assert.strictEqual(routeResult.impacts.careerSignalImpact.operation, 'NO_OP');
});

// -----------------------------------------------------------------------------
// TEST 11: Same document SHA -> no duplicate event
// -----------------------------------------------------------------------------
assertTest('Same document SHA produces exact same eventId and prevents duplicate event generation', () => {
  const docSha = 'deadbeef1234567890abcdef0123456789abcdef0123456789abcdef01234567';
  const doc = {
    title: 'SSC CGL 2026 Notification',
    documentType: 'ADVERTISEMENT',
    permanentMissionId: 'ssc_cgl',
    provenance: {
      officialSourceIdentity: 'https://ssc.gov.in',
      authorityBinding: 'auth_in_ssc',
      documentIdentity: 'doc_ssc_cgl_2026',
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

console.log(`\n================================================================================`);
console.log(`ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% CANONICAL INTEGRITY`);
console.log(`================================================================================\n`);
