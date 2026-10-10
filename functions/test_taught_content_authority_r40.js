'use strict';
const assert = require('assert');
const { hashEvidence, validateTaughtContentEligibility } = require('./services/authority_intelligence/taught_content_eligibility_r40');
const { completeExecution, sealEvidence, issueProjection } = require('./services/authority_intelligence/taught_content_execution_r40');
let passed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`PASS ${name}`); } catch (e) { console.error(`FAIL ${name}: ${e.message}`); process.exitCode = 1; } }
const snapshot = { realmId: 'realm-1', missionId: 'mission-1', subject: 'physics', atom: { id: 'atom-1', version: 1 }, material: { id: 'mat-1', version: 1, hash: 'mat-hash' }, teacher: { id: 't-1', version: 1 }, pedagogy: { id: 'p-1', version: 1, hash: 'ped-hash' }, executor: { id: 'worker-1', version: 1 }, authorizationVersion: 1, executionId: 'exec-1', fingerprint: 'fp-1' };
const state = { ...snapshot, authoritySnapshot: snapshot, status: 'CLAIMED', owner: 'worker-1', fencingToken: 2, leaseGeneration: 3, statusVersion: 4, leaseExpiresAtMs: 2000 };
const token = { ...snapshot, owner: 'worker-1', fencingToken: 2, leaseGeneration: 3, statusVersion: 4, nowMs: 1000 };
const request = { realmId: 'realm-1', missionId: 'mission-1', subject: 'physics', atomId: 'atom-1', materialHash: 'mat-hash' };
test('completion requires current lease and fence', () => assert.strictEqual(completeExecution(state, token, { result: 'done' }).status, 'EXECUTED'));
test('stale worker denied', () => assert.throws(() => completeExecution(state, { ...token, fencingToken: 9 }, {}), /STALE_EXECUTION/));
test('evidence hash deterministic', () => { const e = { ...snapshot, evidenceId: 'ev-1', fencingToken: 2, leaseGeneration: 3, completion: { result: 'done' }, issuer: 'server', retentionClassId: 'rc-1' }; assert.strictEqual(hashEvidence(e), hashEvidence({ ...e })); });
test('legacy authority denied', () => assert.strictEqual(validateTaughtContentEligibility({}, { state: 'VALID', legacyOnly: true }).ok, false));
test('tampered evidence denied', () => { const ex = completeExecution(state, token, { result: 'done' }); const e = { ...snapshot, evidenceId: 'ev-2', fencingToken: 2, leaseGeneration: 3, completion: ex.completion, issuer: 'server', retentionClassId: 'rc-1' }; const sealed = sealEvidence(ex, e); assert.throws(() => issueProjection(ex, { ...sealed, evidenceHash: 'tampered' }, request), /EVIDENCE_HASH_MISMATCH/); });
console.log(JSON.stringify({ total: 5, passed, failed: 5 - passed }));
