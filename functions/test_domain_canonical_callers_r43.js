'use strict';
const assert = require('assert');
const { assembleCrucibleAssessment } = require('./services/authority_intelligence/crucible_assessment_service_r43');
const { assembleTestArenaAssessment } = require('./services/authority_intelligence/test_arena_assessment_service_r43');
const req = { realmId: 'r', missionId: 'm', subject: 'physics' }; const good = { authorityId: 'good', ...req, atomId: 'a', materialHash: 'mh', executionId: 'e', evidenceHash: 'eh', mode: 'micro', testId: 'major-1' }; const auth = { good: { ...req, atomId: 'a', materialHash: 'mh', executionId: 'e', evidenceHash: 'eh', state: 'VALID' }, bad: { ...req, atomId: 'a', materialHash: 'mh', executionId: 'e', evidenceHash: 'eh', state: 'UNKNOWN' } }; let passed = 0; function t(n, f) { try { f(); passed++; console.log(`PASS ${n}`); } catch (e) { console.error(`FAIL ${n}: ${e.message}`); process.exitCode = 1; } }
t('crucible valid', () => assert.strictEqual(assembleCrucibleAssessment({ ...req, day: 1, mode: 'micro', candidates: [good], authorityById: auth }).items.length, 1));
t('crucible filters', () => assert.strictEqual(assembleCrucibleAssessment({ ...req, day: 98, mode: 'micro', candidates: [good, { ...good, authorityId: 'bad' }], authorityById: auth }).items.length, 1));
t('major outside crucible', () => assert.throws(() => assembleCrucibleAssessment({ ...req, day: 1, mode: 'major', candidates: [], authorityById: auth }), /MAJOR_TEST_OUTSIDE_CRUCIBLE/));
t('test arena valid major', () => assert.strictEqual(assembleTestArenaAssessment({ ...req, testId: 'major-1', testType: 'major', candidates: [good], authorityById: auth }).items.length, 1));
t('test arena filters', () => assert.strictEqual(assembleTestArenaAssessment({ ...req, testId: 'major-1', testType: 'major', candidates: [{ ...good, authorityId: 'bad' }], authorityById: auth }).items.length, 0));
t('cross mission excluded', () => assert.strictEqual(assembleTestArenaAssessment({ ...req, testId: 'major-1', testType: 'major', candidates: [{ ...good, missionId: 'other' }], authorityById: auth }).items.length, 0));
t('empty crucible closed', () => assert.strictEqual(assembleCrucibleAssessment({ ...req, day: 14, mode: 'micro', candidates: [], authorityById: auth }).eligible, false));
t('invalid day denied', () => assert.throws(() => assembleCrucibleAssessment({ ...req, day: 99, mode: 'micro', candidates: [], authorityById: auth }), /CRUCIBLE_DAY_INVALID/));
console.log(JSON.stringify({ total: 8, passed, failed: 8 - passed }));
