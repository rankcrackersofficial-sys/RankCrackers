/**
 * 🔱 DELHI UNION TERRITORY (UT) OFFICIAL AUTHORITY REGISTRY
 * Pilot Authority: DSSSB
 * Command: RC-AUTHORITY-INTELLIGENCE-B1-R2-AG2-STRICT-TLS-ENDPOINT-EVIDENCE-AND-FREEZE-20260912
 */

'use strict';

const { deepFreeze, JURISDICTIONS, ROLE_PROOF_METHODS } = require('../registry_schema');

const DELHI_UT_AUTHORITIES = deepFreeze({
  auth_in_dl_dsssb: {
    authorityKey: 'auth_in_dl_dsssb',
    shortName: 'DSSSB',
    fullName: 'Delhi Subordinate Services Selection Board',
    jurisdiction: JURISDICTIONS.UT,
    stateCode: 'DL',
    officialDomain: 'dsssb.delhi.gov.in',
    allowedOfficialDomains: [
      'dsssb.delhi.gov.in',
      'dsssbonline.nic.in',
    ],
    homePage: 'https://dsssb.delhi.gov.in',
    roleEndpoints: {
      notifications: 'https://dsssb.delhi.gov.in/notice-of-exam', // Notice of Exam and Circulars
      recruitment: 'https://dsssb.delhi.gov.in/dsssb-vacancies', // Current Vacancies Advertised
      syllabus: 'https://dsssb.delhi.gov.in/dsssb/syllabus-combined-examination', // Syllabus of Combined Examination
      calendar: 'https://dsssb.delhi.gov.in/dsssb/tentative-calendar-0', // Tentative Calendar
      results: 'https://dsssb.delhi.gov.in/results', // Results
      answerKeys: 'https://dsssb.delhi.gov.in/doit/tab-content/answer-keys', // Answer Keys
      pyq: null, // DSSSB issues question papers via candidate response keys during active window
      archive: 'https://dsssb.delhi.gov.in/dsssb/archived-vacancies', // Archived Vacancies
    },
    roleEndpointEvidence: {
      notifications: {
        slot: 'notifications',
        canonicalUrl: 'https://dsssb.delhi.gov.in/notice-of-exam',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
        expectedPathPattern: '^/notice-of-exam',
        expectedTitleTokens: ['Notice of Exam', 'Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['Notice of Exam'],
        verificationNotes: 'Official DSSSB notice of exam and circulars feed.',
      },
      recruitment: {
        slot: 'recruitment',
        canonicalUrl: 'https://dsssb.delhi.gov.in/dsssb-vacancies',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
        expectedPathPattern: '^/dsssb-vacancies',
        expectedTitleTokens: ['DSSSB Vacancies', 'Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['DSSSB Vacancies'],
        verificationNotes: 'Official DSSSB current vacancies and recruitment advertisements.',
      },
      syllabus: {
        slot: 'syllabus',
        canonicalUrl: 'https://dsssb.delhi.gov.in/dsssb/syllabus-combined-examination',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
        expectedPathPattern: '^/dsssb/syllabus-combined-examination',
        expectedTitleTokens: ['Syllabus of Combined Examination', 'Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['Syllabus of Combined Examination'],
        verificationNotes: 'Official DSSSB syllabus for combined examination.',
      },
      calendar: {
        slot: 'calendar',
        canonicalUrl: 'https://dsssb.delhi.gov.in/dsssb/tentative-calendar-0',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
        expectedPathPattern: '^/dsssb/tentative-calendar-0',
        expectedTitleTokens: ['Tentative Calendar', 'Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['Tentative Calendar'],
        verificationNotes: 'Official DSSSB tentative annual examination calendar.',
      },
      results: {
        slot: 'results',
        canonicalUrl: 'https://dsssb.delhi.gov.in/results',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
        expectedPathPattern: '^/results',
        expectedTitleTokens: ['Results', 'Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['Results'],
        verificationNotes: 'Official DSSSB examination results section.',
      },
      answerKeys: {
        slot: 'answerKeys',
        canonicalUrl: 'https://dsssb.delhi.gov.in/doit/tab-content/answer-keys',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_PAGE_HEADING,
        expectedPathPattern: '^/doit/tab-content/answer-keys',
        expectedTitleTokens: ['Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['Answer Keys'],
        verificationNotes: 'Official DSSSB examination answer keys section.',
      },
      pyq: {
        slot: 'pyq',
        canonicalUrl: null,
        expectedFinalHost: null,
        proofMethod: ROLE_PROOF_METHODS.SAFE_NULL,
        expectedPathPattern: null,
        expectedTitleTokens: [],
        expectedPageTokens: [],
        verificationNotes: 'DSSSB issues question papers via candidate response keys during active window.',
      },
      archive: {
        slot: 'archive',
        canonicalUrl: 'https://dsssb.delhi.gov.in/dsssb/archived-vacancies',
        expectedFinalHost: 'dsssb.delhi.gov.in',
        proofMethod: ROLE_PROOF_METHODS.PATH_AND_TITLE_TOKENS,
        expectedPathPattern: '^/dsssb/archived-vacancies',
        expectedTitleTokens: ['Archived Vacancies', 'Delhi Subordinate Services Selection Board'],
        expectedPageTokens: ['Archived Vacancies'],
        verificationNotes: 'Official DSSSB archived vacancies portal.',
      },
    },
    knownMajorRecurringExams: [
      { examKey: 'dsssb_tgt', displayName: 'Trained Graduate Teacher (TGT)' },
      { examKey: 'dsssb_pgt', displayName: 'Post Graduate Teacher (PGT)' },
      { examKey: 'dsssb_prt', displayName: 'Primary Teacher (PRT / Assistant Teacher)' },
      { examKey: 'dsssb_special_educator', displayName: 'Special Education Teacher' },
      { examKey: 'dsssb_dass_grade_2', displayName: 'DASS Grade II / Assistant Section Officer' },
      { examKey: 'dsssb_junior_assistant', displayName: 'Junior Assistant / Grade IV DASS' },
      { examKey: 'dsssb_warder', displayName: 'Delhi Prisons Warder / Matron' },
    ],
    monitoringEnabled: true,
  },
});

module.exports = {
  DELHI_UT_AUTHORITIES,
};
