'use strict';
const { selectTestArenaContent } = require('./test_arena_assessment_gate_r42');
function assembleTestArenaAssessment({ realmId, missionId, subject, testId, testType, candidates, authorityById }) { if (!realmId || !missionId || !subject || !testId || !testType) throw new Error('TEST_ARENA_SCOPE_REQUIRED'); const scoped = (candidates || []).filter((x) => x.realmId === realmId && x.missionId === missionId && x.subject === subject && x.testId === testId); const items = selectTestArenaContent(scoped, authorityById || {}); return Object.freeze({ engine: 'TEST_ARENA', realmId, missionId, subject, testId, testType, items: Object.freeze(items.map((x) => Object.freeze({ ...x }))), eligible: items.length > 0 }); }
module.exports = Object.freeze({ assembleTestArenaAssessment });
