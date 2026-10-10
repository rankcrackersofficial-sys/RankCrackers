/**
 * 🔱 GATE 48CS2R4 ADVERSARIAL TRUST BOUNDARY TEST SUITE
 *
 * Validates the 12 Trust Boundary Invariants:
 *   1. Caller sends isComplete: true with unresolved family -> rejected / derived false.
 *   2. RULE_ABSENCE_VERIFIED without evidence attestation -> rejected / unresolved.
 *   3. Search-no-result alone cannot prove absence.
 *   4. Partial corrigendum surface cannot become CURRENT_CHAIN_VERIFIED.
 *   5. Partial vacancy table cannot become VACANCY_MATRIX_COMPLETE.
 *   6. URL-only source remains URL_FOUND, not SHA_VERIFIED.
 *   7. SHA verified document retains SHA_VERIFIED.
 *   8. Incomplete rulebook still permits generic verified notification facts (title, dates, total seats).
 *   9. Incomplete rulebook cannot output ELIGIBLE (strictly NOT_EVALUATED).
 *  10. Complete evidence-backed package is accepted for matching and outputs ELIGIBLE.
 *  11. Same evidence gives same semantic hash.
 *  12. New corrigendum changes semantic hash.
 */

'use strict';

const assert = require('assert');
const {
  VERTICAL_CATEGORY,
  RULE_FAMILY,
  RULE_FAMILY_STATUS,
  RULE_RESOLUTION_STATE,
  VACANCY_MATRIX_COMPLETENESS,
  AMENDMENT_CHAIN_STATUS,
  ELIGIBILITY_STATUS,
  normalizeCareerProfile
} = require('../services/career_signal_models');

const {
  SOURCE_DOCUMENT_STATE,
  PACKAGE_VALIDATION_RESULT,
  RULE_FAMILY_COVERAGE_STATUS,
  VACANCY_COVERAGE_STATUS,
  ATTESTATION_REVIEW_STATUS,
  validateSourceDocumentState,
  validateAbsenceAttestation,
  deriveRulebookCompleteness,
  deriveAmendmentChainStatus,
  deriveVacancyMatrixCompleteness,
  computePackageSemanticHash,
  validateCareerRulebookPackage
} = require('../services/career_rulebook_package');

const {
  evaluateCareerSignalPersonalization
} = require('../services/career_signal_matching_engine');

console.log('================================================================================');
console.log('RUNNING GATE 48CS2R4 TRUST BOUNDARY TEST SUITE');
console.log('================================================================================\n');

let passedTests = 0;
const totalTests = 12;

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
// TEST 1: Caller sends isComplete: true with unresolved family -> rejected/derived false
// -----------------------------------------------------------------------------
assertTest('Caller sends isComplete: true with unresolved family -> rejected/derived false', () => {
  const fakeCompletePackage = {
    packageId: 'pkg_caller_cheat_01',
    cycleId: 'cycle_rpsc_ras_2026',
    authorityId: 'auth_in_rj_rpsc',
    isComplete: true, // Caller tries to self-certify!
    rulebookCompleteness: { isComplete: true }, // Nested caller self-certification
    baseNotification: {
      documentIdentity: 'doc_base_ras_2026',
      officialNoticeNumber: '01/2026-RAS',
      sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
      documentSha256: 'a'.repeat(64),
      officialSourceUrl: 'https://rpsc.rajasthan.gov.in/notices/01_2026'
    },
    ruleFamilyCoverage: [
      { family: RULE_FAMILY.AGE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['clause_1'] },
      { family: RULE_FAMILY.EDUCATION, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['clause_2'] },
      { family: RULE_FAMILY.DISCIPLINE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['clause_3'] },
      { family: RULE_FAMILY.DOMICILE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['clause_4'] }
      // CATEGORY_OR_RESERVATION is MISSING from coverage rows!
    ]
  };

  const validation = validateCareerRulebookPackage(fakeCompletePackage);

  // Derivation must override caller's fake claim
  assert.strictEqual(validation.derivedCompleteness.isComplete, false, 'Derived isComplete must be false');
  assert.strictEqual(validation.validationResult, PACKAGE_VALIDATION_RESULT.PARTIAL_SOURCE_PACKAGE);
  assert.ok(validation.derivedCompleteness.unresolvedFamilies.includes(RULE_FAMILY.CATEGORY_OR_RESERVATION));
});

// -----------------------------------------------------------------------------
// TEST 2: RULE_ABSENCE_VERIFIED without evidence attestation -> rejected / unresolved
// -----------------------------------------------------------------------------
assertTest('RULE_ABSENCE_VERIFIED without evidence attestation -> rejected / unresolved', () => {
  const pkgWithEmptyAttestation = {
    packageId: 'pkg_empty_attest_02',
    cycleId: 'cycle_upsc_cse_2026',
    authorityId: 'auth_in_gov_upsc',
    baseNotification: {
      documentIdentity: 'doc_base_upsc_2026',
      officialNoticeNumber: '02/2026-CSE',
      sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
      documentSha256: 'b'.repeat(64)
    },
    ruleFamilyCoverage: [
      {
        family: RULE_FAMILY.DOMICILE,
        resolutionStatus: RULE_RESOLUTION_STATE.RULE_ABSENCE_VERIFIED,
        coverageStatus: RULE_FAMILY_COVERAGE_STATUS.NOT_APPLICABLE_VERIFIED,
        absenceAttestation: null // Missing attestation!
      }
    ]
  };

  const completeness = deriveRulebookCompleteness(pkgWithEmptyAttestation);

  assert.strictEqual(completeness.familyStatuses[RULE_FAMILY.DOMICILE], RULE_FAMILY_STATUS.UNRESOLVED);
  assert.ok(completeness.unresolvedFamilies.includes(RULE_FAMILY.DOMICILE));
  assert.strictEqual(completeness.isComplete, false);
});

// -----------------------------------------------------------------------------
// TEST 3: Search-no-result alone cannot prove absence
// -----------------------------------------------------------------------------
assertTest('Search-no-result alone cannot prove absence', () => {
  const searchNoResultAttestation = {
    ruleFamily: RULE_FAMILY.EXPERIENCE,
    cycleId: 'cycle_ssc_cgl_2026',
    authoritativeDocumentsReviewed: ['doc_ssc_cgl_advt'],
    sourceScope: 'QUICK_SEARCH_TITLES_ONLY',
    evidenceRefs: [], // Empty evidence refs! (search returned nothing)
    reviewStatus: 'SEARCH_RETURNED_EMPTY', // Not AUDITED_ABSENCE_CONFIRMED
    attestationReason: 'Search for "experience" returned 0 rows.'
  };

  const result = validateAbsenceAttestation(searchNoResultAttestation, RULE_FAMILY.EXPERIENCE, 'cycle_ssc_cgl_2026');

  assert.strictEqual(result.isValid, false);
  assert.ok(result.reason.includes('NO_EVIDENCE_REFS'));
});

// -----------------------------------------------------------------------------
// TEST 4: Partial corrigendum surface cannot become CURRENT_CHAIN_VERIFIED
// -----------------------------------------------------------------------------
assertTest('Partial corrigendum surface cannot become CURRENT_CHAIN_VERIFIED', () => {
  const pkgWithPartialCorrigendum = {
    packageId: 'pkg_partial_corr_04',
    cycleId: 'cycle_ibps_po_2026',
    authorityId: 'auth_in_gov_ibps',
    baseNotification: {
      documentIdentity: 'doc_base_ibps',
      sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
      documentSha256: 'c'.repeat(64)
    },
    amendmentAudit: {
      auditScope: 'OFFICIAL_PORTAL_CORRIGENDA_AUDITED',
      auditWindowThrough: '2026-06-01T00:00:00Z'
    },
    applicableCorrigenda: [
      {
        documentIdentity: 'corr_01',
        sourceState: SOURCE_DOCUMENT_STATE.URL_FOUND, // URL_FOUND only! Not SHA_VERIFIED
        officialSourceUrl: 'https://ibps.in/corr1.pdf'
      }
    ]
  };

  const amendmentStatus = deriveAmendmentChainStatus(pkgWithPartialCorrigendum);

  assert.strictEqual(amendmentStatus.amendmentSearchStatus, AMENDMENT_CHAIN_STATUS.CHAIN_PARTIAL);
  assert.strictEqual(amendmentStatus.isChainVerified, false);
  assert.ok(amendmentStatus.reason.includes('not SHA_VERIFIED'));
});

// -----------------------------------------------------------------------------
// TEST 5: Partial vacancy table cannot become VACANCY_MATRIX_COMPLETE
// -----------------------------------------------------------------------------
assertTest('Partial vacancy table cannot become VACANCY_MATRIX_COMPLETE', () => {
  const pkgWithPartialVacancy = {
    packageId: 'pkg_partial_vac_05',
    cycleId: 'cycle_rpsc_ras_2026',
    authorityId: 'auth_in_rj_rpsc',
    vacancyMatrix: {
      coverageStatus: VACANCY_COVERAGE_STATUS.PARTIAL_TABLE, // Claims only partial table
      totalSeats: 500,
      rows: [
        { category: 'UR', vacancies: 200 } // Missing evidence refs!
      ]
    }
  };

  const matrixCompleteness = deriveVacancyMatrixCompleteness(pkgWithPartialVacancy);

  assert.strictEqual(matrixCompleteness.vacancyMatrixCompleteness, VACANCY_MATRIX_COMPLETENESS.VACANCY_MATRIX_PARTIAL);
  assert.strictEqual(matrixCompleteness.isMatrixComplete, false);
});

// -----------------------------------------------------------------------------
// TEST 6: URL-only source remains URL_FOUND, not SHA_VERIFIED
// -----------------------------------------------------------------------------
assertTest('URL-only source remains URL_FOUND, not SHA_VERIFIED', () => {
  const urlOnlyDoc = {
    documentIdentity: 'doc_url_notice',
    officialSourceUrl: 'https://rpsc.rajasthan.gov.in/notice_unverified.pdf',
    sourceState: SOURCE_DOCUMENT_STATE.URL_FOUND,
    shaVerified: true, // Caller claims shaVerified
    documentSha256: 'd'.repeat(64) // Caller supplies speculative SHA
  };

  const validatedDoc = validateSourceDocumentState(urlOnlyDoc);

  assert.strictEqual(validatedDoc.sourceState, SOURCE_DOCUMENT_STATE.URL_FOUND);
  assert.strictEqual(validatedDoc.isShaVerified, false);
  assert.strictEqual(validatedDoc.documentSha256, null); // Stripped! Zero trust for unhashed URL
});

// -----------------------------------------------------------------------------
// TEST 7: SHA verified document retains SHA_VERIFIED
// -----------------------------------------------------------------------------
assertTest('SHA verified document retains SHA_VERIFIED', () => {
  const validShaHex = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const shaDoc = {
    documentIdentity: 'doc_rpsc_advt_official',
    officialSourceUrl: 'https://rpsc.rajasthan.gov.in/advt_signed.pdf',
    sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
    documentSha256: validShaHex
  };

  const validatedDoc = validateSourceDocumentState(shaDoc);

  assert.strictEqual(validatedDoc.sourceState, SOURCE_DOCUMENT_STATE.SHA_VERIFIED);
  assert.strictEqual(validatedDoc.isShaVerified, true);
  assert.strictEqual(validatedDoc.documentSha256, validShaHex);
});

// -----------------------------------------------------------------------------
// TEST 8: Incomplete rulebook permits generic verified notification facts
// -----------------------------------------------------------------------------
assertTest('Incomplete rulebook permits generic verified notification facts (title, dates, total seats)', () => {
  const partialPackage = {
    packageId: 'pkg_ras_partial_08',
    cycleId: 'cycle_rpsc_ras_2026',
    authorityId: 'auth_in_rj_rpsc',
    title: 'Rajasthan State and Subordinate Services Combined Competitive Exam 2026',
    advertisementNumber: '07/2026-RAS',
    baseNotification: {
      documentIdentity: 'doc_rpsc_advt_2026',
      officialNoticeNumber: '07/2026-RAS',
      sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
      documentSha256: 'f'.repeat(64),
      officialSourceUrl: 'https://rpsc.rajasthan.gov.in/advt_07.pdf'
    },
    applicationWindow: {
      startDate: '2026-07-01',
      endDate: '2026-07-31',
      isExtended: false
    },
    examDates: [
      { stageName: 'PRELIMS', scheduledDate: '2026-10-15', isTentative: true }
    ],
    vacancyMatrix: {
      coverageStatus: VACANCY_COVERAGE_STATUS.TOTAL_SEATS_ONLY,
      totalSeats: 905,
      rows: []
    },
    ruleFamilyCoverage: [
      { family: RULE_FAMILY.AGE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p4'] }
      // Other families unextracted
    ]
  };

  const validation = validateCareerRulebookPackage(partialPackage);

  assert.strictEqual(validation.validationResult, PACKAGE_VALIDATION_RESULT.PARTIAL_SOURCE_PACKAGE);
  assert.ok(validation.genericCycleFacts, 'Generic facts must be extracted');
  assert.strictEqual(validation.genericCycleFacts.cycleId, 'cycle_rpsc_ras_2026');
  assert.strictEqual(validation.genericCycleFacts.title, 'Rajasthan State and Subordinate Services Combined Competitive Exam 2026');
  assert.strictEqual(validation.genericCycleFacts.advertisementNumber, '07/2026-RAS');
  assert.strictEqual(validation.genericCycleFacts.totalVacancies, 905);
  assert.strictEqual(validation.genericCycleFacts.applicationWindow.startDate, '2026-07-01');
  assert.strictEqual(validation.genericCycleFacts.examDates[0].scheduledDate, '2026-10-15');
});

// -----------------------------------------------------------------------------
// TEST 9: Incomplete rulebook cannot output ELIGIBLE (strictly NOT_EVALUATED)
// -----------------------------------------------------------------------------
assertTest('Incomplete rulebook cannot output ELIGIBLE (strictly NOT_EVALUATED)', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_star_student',
    dateOfBirth: '1998-05-15', // Age 27
    highestQualification: 'GRADUATION',
    subjectOrDiscipline: 'HISTORY',
    domicileState: 'RJ',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const partialPackage = {
    packageId: 'pkg_partial_09',
    cycleId: 'cycle_rpsc_ras_2026',
    authorityId: 'auth_in_rj_rpsc',
    baseNotification: {
      documentIdentity: 'doc_base_09',
      sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
      documentSha256: '1'.repeat(64)
    },
    eligibilityRules: [
      // Candidate passes this rule with flying colors
      { ruleId: 'r_age_35', ruleType: 'AGE_MAX', officialValue: 35, sourceDocumentId: 'doc_base_09', evidenceRefs: ['p1'] }
    ],
    ruleFamilyCoverage: [
      { family: RULE_FAMILY.AGE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p1'] }
      // Missing EDUCATION, DISCIPLINE, DOMICILE, CATEGORY_OR_RESERVATION
    ],
    vacancyMatrix: {
      coverageStatus: VACANCY_COVERAGE_STATUS.PARTIAL_TABLE,
      rows: []
    }
  };

  const view = evaluateCareerSignalPersonalization({
    profile,
    rulebookPackage: partialPackage,
    eventId: 'evt_test_partial_09',
    nowIso: '2025-06-01T00:00:00Z'
  });

  // Candidate passed the only rule in the package, BUT the package is partial!
  // Eligibility must NOT be ELIGIBLE!
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
  assert.notStrictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
  assert.ok(view.reasonCodes.some(r => r.includes('PARTIAL_SOURCE_PACKAGE')));
});

// -----------------------------------------------------------------------------
// TEST 10: Complete evidence-backed package is accepted and outputs ELIGIBLE
// -----------------------------------------------------------------------------
assertTest('Complete evidence-backed package is accepted for matching and outputs ELIGIBLE', () => {
  const profile = normalizeCareerProfile({
    userId: 'user_star_student',
    dateOfBirth: '1998-05-15', // Age 27
    highestQualification: 'GRADUATION',
    subjectOrDiscipline: 'HISTORY',
    domicileState: 'RJ',
    reservationCategory: VERTICAL_CATEGORY.UR
  });

  const validShaHex = '2'.repeat(64);
  const completePackage = {
    packageId: 'pkg_complete_10',
    cycleId: 'cycle_rpsc_ras_2026',
    authorityId: 'auth_in_rj_rpsc',
    title: 'RPSC RAS 2026',
    baseNotification: {
      documentIdentity: 'doc_rpsc_ras_2026_advt',
      officialNoticeNumber: '05/2026-RAS',
      sourceState: SOURCE_DOCUMENT_STATE.SHA_VERIFIED,
      documentSha256: validShaHex,
      officialSourceUrl: 'https://rpsc.rajasthan.gov.in/advt_05.pdf'
    },
    amendmentAudit: {
      auditScope: 'OFFICIAL_PORTAL_CORRIGENDA_AUDITED',
      auditWindowThrough: '2026-06-01T00:00:00Z'
    },
    applicableCorrigenda: [],
    eligibilityRules: [
      { ruleId: 'r_age', ruleType: 'AGE_MAX', officialValue: 35, sourceDocumentId: 'doc_rpsc_ras_2026_advt', evidenceRefs: ['p3'] },
      { ruleId: 'r_qual', ruleType: 'QUALIFICATION_MIN', officialValue: 'GRADUATION', sourceDocumentId: 'doc_rpsc_ras_2026_advt', evidenceRefs: ['p4'] },
      { ruleId: 'r_disc', ruleType: 'DISCIPLINE_REQUIRED', officialValue: 'HISTORY', sourceDocumentId: 'doc_rpsc_ras_2026_advt', evidenceRefs: ['p5'] },
      { ruleId: 'r_dom', ruleType: 'DOMICILE_REQUIRED', officialValue: 'RJ', sourceDocumentId: 'doc_rpsc_ras_2026_advt', evidenceRefs: ['p6'] }
    ],
    ruleFamilyCoverage: [
      { family: RULE_FAMILY.AGE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p3'] },
      { family: RULE_FAMILY.EDUCATION, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p4'] },
      { family: RULE_FAMILY.DISCIPLINE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p5'] },
      { family: RULE_FAMILY.DOMICILE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p6'] },
      {
        family: RULE_FAMILY.CATEGORY_OR_RESERVATION,
        resolutionStatus: RULE_RESOLUTION_STATE.RULE_ABSENCE_VERIFIED,
        coverageStatus: RULE_FAMILY_COVERAGE_STATUS.NOT_APPLICABLE_VERIFIED,
        absenceAttestation: {
          ruleFamily: RULE_FAMILY.CATEGORY_OR_RESERVATION,
          cycleId: 'cycle_rpsc_ras_2026',
          authoritativeDocumentsReviewed: ['doc_rpsc_ras_2026_advt'],
          sourceScope: 'FULL_NOTIFICATION_TEXT_AND_ANNEXURES',
          evidenceRefs: ['NOTIF_SECTION_7_RESERVATION_GENERAL'],
          reviewStatus: ATTESTATION_REVIEW_STATUS.AUDITED_ABSENCE_CONFIRMED,
          attestationReason: 'General category candidates have no reservation restrictions.'
        }
      }
    ],
    vacancyMatrix: {
      coverageStatus: VACANCY_COVERAGE_STATUS.COMPLETE_OFFICIAL_TABLE,
      totalSeats: 100,
      rows: [
        { category: 'UR', horizontalQuota: 'NONE', vacancies: 50, evidenceRefs: ['table_1_p7'] },
        { category: 'SC', horizontalQuota: 'NONE', vacancies: 25, evidenceRefs: ['table_1_p7'] },
        { category: 'ST', horizontalQuota: 'NONE', vacancies: 25, evidenceRefs: ['table_1_p7'] }
      ]
    }
  };

  const validation = validateCareerRulebookPackage(completePackage);
  assert.strictEqual(validation.validationResult, PACKAGE_VALIDATION_RESULT.ACCEPTED_FOR_MATCHING);

  const view = evaluateCareerSignalPersonalization({
    profile,
    rulebookPackage: completePackage,
    eventId: 'evt_test_complete_10',
    nowIso: '2025-06-01T00:00:00Z'
  });

  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.ELIGIBLE);
  assert.strictEqual(view.relevanceScore, 1.0);
  assert.strictEqual(view.totalApplicableVacancies, 50);
});

// -----------------------------------------------------------------------------
// TEST 11: Same evidence gives same semantic hash
// -----------------------------------------------------------------------------
assertTest('Same evidence gives same semantic hash (excluding non-deterministic fields)', () => {
  const basePackage = {
    cycleId: 'cycle_upsc_cse_2026',
    authorityId: 'auth_in_gov_upsc',
    permanentMissionId: 'mission_upsc_civil_services',
    baseNotification: {
      documentIdentity: 'doc_upsc_notif_2026',
      officialNoticeNumber: '01/2026-CSP',
      issueDate: '2026-02-01',
      documentSha256: '3'.repeat(64)
    },
    applicableCorrigenda: [],
    eligibilityRules: [
      { ruleId: 'r1', ruleType: 'AGE_MAX', officialValue: 32, evidenceRefs: ['p2'] }
    ],
    ruleFamilyCoverage: [
      { family: RULE_FAMILY.AGE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p2'] }
    ],
    vacancyMatrix: {
      coverageStatus: VACANCY_COVERAGE_STATUS.COMPLETE_OFFICIAL_TABLE,
      totalSeats: 1056,
      rows: [
        { postCode: 'IAS', category: 'UR', horizontalQuota: 'NONE', vacancies: 73 }
      ]
    }
  };

  // Package A generated at timestamp 1
  const pkgA = {
    ...basePackage,
    packageId: 'pkg_upsc_run_1',
    generatedAt: '2026-02-01T08:00:00.000Z',
    auditedAt: '2026-02-01T08:05:00.000Z',
    runId: 'run_worker_alpha'
  };

  // Package B generated at timestamp 2 with different run ID
  const pkgB = {
    ...basePackage,
    packageId: 'pkg_upsc_run_2',
    generatedAt: '2026-09-10T12:00:00.000Z',
    auditedAt: '2026-09-10T12:05:00.000Z',
    runId: 'run_worker_beta'
  };

  const hashA = computePackageSemanticHash(pkgA);
  const hashB = computePackageSemanticHash(pkgB);

  assert.strictEqual(hashA, hashB, 'Semantic hash must be 100% deterministic and invariant to timestamps');
});

// -----------------------------------------------------------------------------
// TEST 12: New corrigendum changes semantic hash
// -----------------------------------------------------------------------------
assertTest('New corrigendum changes semantic hash', () => {
  const basePackage = {
    cycleId: 'cycle_upsc_cse_2026',
    authorityId: 'auth_in_gov_upsc',
    baseNotification: {
      documentIdentity: 'doc_upsc_notif_2026',
      officialNoticeNumber: '01/2026-CSP',
      issueDate: '2026-02-01',
      documentSha256: '3'.repeat(64)
    },
    applicableCorrigenda: [],
    eligibilityRules: [
      { ruleId: 'r1', ruleType: 'AGE_MAX', officialValue: 32, evidenceRefs: ['p2'] }
    ],
    ruleFamilyCoverage: [
      { family: RULE_FAMILY.AGE, resolutionStatus: RULE_RESOLUTION_STATE.RULE_PRESENT_VERIFIED, coverageStatus: RULE_FAMILY_COVERAGE_STATUS.EXHAUSTIVE, evidenceRefs: ['p2'] }
    ],
    vacancyMatrix: {
      coverageStatus: VACANCY_COVERAGE_STATUS.COMPLETE_OFFICIAL_TABLE,
      totalSeats: 1056,
      rows: []
    }
  };

  const hashBefore = computePackageSemanticHash(basePackage);

  const packageWithCorrigendum = {
    ...basePackage,
    applicableCorrigenda: [
      {
        documentIdentity: 'doc_upsc_corr_01',
        officialNoticeNumber: '01/2026-CSP-CORR-1',
        documentSha256: '4'.repeat(64)
      }
    ]
  };

  const hashAfter = computePackageSemanticHash(packageWithCorrigendum);

  assert.notStrictEqual(hashBefore, hashAfter, 'Adding official corrigendum must produce a distinct semantic hash');
});

console.log('\n================================================================================');
console.log('ALL 12/12 GATE 48CS2R4 TRUST BOUNDARY TESTS PASSED WITH 100% CANONICAL INTEGRITY');
console.log('================================================================================\n');
