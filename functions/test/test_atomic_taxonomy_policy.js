const assert = require('assert');
const {
  SOURCE_ROLES,
  CANDIDATE_STATES,
  PUBLICATION_STATES,
  makeCandidate,
  validateCandidate,
  missionMode,
} = require('../services/atomic_taxonomy_policy');

const officialRef = { sourceId: 'syllabus_1', sourcePage: '5', sourceRole: SOURCE_ROLES.OFFICIAL_SYLLABUS, excerpt: 'Mathematical abilities' };
const pyqRef = { sourceId: 'pyq_1', sourcePage: '2', sourceRole: SOURCE_ROLES.OFFICIAL_PYQ, excerpt: 'Percentage question' };

const candidate = makeCandidate({
  missionId: 'ssc_cgl', subject: 'Quantitative Aptitude', unit: 'Arithmetic',
  topic: 'Percentage', microTopic: 'Successive percentage change',
  atomicTopic: 'Increase/decrease percentage calculation', sourceRefs: [pyqRef],
  sourceRole: SOURCE_ROLES.OFFICIAL_PYQ, derivationMethod: 'PYQ frequency and concept mapping', confidence: 0.92,
});
assert.equal(candidate.candidateState, CANDIDATE_STATES.VERIFIED);
assert.equal(candidate.publicationState, PUBLICATION_STATES.STUDENT_READY);
assert.equal(validateCandidate(candidate).valid, true);

const unsafe = makeCandidate({
  missionId: 'ssc_cgl', subject: 'General Awareness', unit: 'General Policy',
  topic: 'Reservation', microTopic: 'OBC reservation', atomicTopic: 'Category quota',
  sourceRefs: [{ sourceId: 'notification_1', sourcePage: '10', sourceRole: SOURCE_ROLES.OFFICIAL_SYLLABUS, excerpt: 'reservation SC/ST OBC EWS' }],
  sourceRole: SOURCE_ROLES.AI_CANDIDATE, derivationMethod: 'model suggestion', confidence: 0.99,
});
assert.equal(unsafe.publicationState, PUBLICATION_STATES.INTERNAL_ONLY);
assert.equal(validateCandidate(unsafe).valid, false);
assert.equal(missionMode({ hasPyq: false, hasApprovedCurriculum: false, hasExpertReview: false }), 'OFFICIAL_SYLLABUS_ONLY');
assert.equal(missionMode({ hasPyq: true, hasApprovedCurriculum: false, hasExpertReview: false }), 'PYQ_BACKED_CURRICULUM');

console.log('atomic taxonomy policy tests passed');
