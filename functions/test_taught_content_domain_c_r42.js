'use strict';
const assert = require('assert');
const { selectCrucibleContent } = require('./services/authority_intelligence/crucible_assessment_gate_r42');
const { selectTestArenaContent } = require('./services/authority_intelligence/test_arena_assessment_gate_r42');
const { project, recompute } = require('./services/authority_intelligence/taught_content_projection_r42');
const crypto = require('crypto');
let passed = 0;
function h(x) { return crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex'); }
const authority = { realmId: 'r', missionId: 'm', subject: 'physics', atom: { id: 'a', version: 1 }, material: { id: 'mat', version: 1, hash: 'mh' }, teacher: { id: 't', version: 1 }, pedagogy: { id: 'p', version: 1, hash: 'ph' }, executor: { id: 'x', version: 1 }, authorizationVersion: 1, executionId: 'e', fingerprint: 'fp', state: 'VALID' };
const gateAuthority = { realmId: 'r', missionId: 'm', subject: 'physics', atomId: 'a', materialHash: 'mh', executionId: 'e', evidenceHash: 'eh', state: 'VALID' };
const candidate = { authorityId: 'ok', realmId: 'r', missionId: 'm', subject: 'physics', atomId: 'a', materialHash: 'mh', executionId: 'e', evidenceHash: 'eh' };
const evidence = { evidenceId: 'ev', realmId: 'r', missionId: 'm', subject: 'physics', atom: { id: 'a', version: 1 }, material: { id: 'mat', version: 1, hash: 'mh' }, teacher: { id: 't', version: 1 }, pedagogy: { id: 'p', version: 1, hash: 'ph' }, executor: { id: 'x', version: 1 }, authorizationVersion: 1, executionId: 'e', fingerprint: 'fp', fencingToken: 1, leaseGeneration: 1, completion: { ok: true }, issuer: 'server', retentionClassId: 'r' };
const { hashEvidence } = require('./services/authority_intelligence/taught_content_eligibility_r40'); evidence.evidenceHash = hashEvidence(evidence);
const execution = { executionId: 'e', status: 'EXECUTED', authoritySnapshot: { ...authority } }; delete execution.authoritySnapshot.state;
function t(name, fn) { try { fn(); passed++; console.log(`PASS ${name}`); } catch (e) { console.error(`FAIL ${name}: ${e.message}`); process.exitCode = 1; } }
t('projection deterministic', () => assert.strictEqual(h(project({ execution, evidence, authority })), h(recompute({ execution, evidence, authority }))));
t('crucible filters invalid', () => assert.deepStrictEqual(selectCrucibleContent([candidate, { ...candidate, authorityId: 'bad', materialHash: 'wrong' }], { ok: gateAuthority, bad: { ...gateAuthority, state: 'UNKNOWN' } }).length, 1));
t('test arena filters invalid', () => assert.deepStrictEqual(selectTestArenaContent([candidate], { ok: gateAuthority }).length, 1));
t('projection rejects tamper', () => assert.throws(() => project({ execution, evidence: { ...evidence, evidenceHash: 'bad' }, authority }), /EVIDENCE_HASH_MISMATCH/));
t('projection rejects invalidation', () => assert.throws(() => project({ execution, evidence, authority: { ...authority, invalidated: true } }), /AUTHORITY_INVALID/));
t('empty candidates fail closed', () => assert.deepStrictEqual(selectCrucibleContent([], {}).length, 0));
console.log(JSON.stringify({ total: 6, passed, failed: 6 - passed }));
