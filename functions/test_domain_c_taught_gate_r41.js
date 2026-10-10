'use strict';
const assert = require('assert');
const gate = require('./services/authority_intelligence/domain_c_taught_gate_r41');
const request = { realmId: 'r', missionId: 'm', subject: 'physics', atomId: 'a', materialHash: 'mh', executionId: 'e', evidenceHash: 'eh' };
const valid = { ...request, state: 'VALID', invalidated: false, superseded: false, legacyOnly: false };
let passed = 0;
function t(name, fn) { try { fn(); passed++; console.log(`PASS ${name}`); } catch (e) { console.error(`FAIL ${name}: ${e.message}`); process.exitCode = 1; } }
for (const [name, fn] of Object.entries({
  question_factory_accepts_valid: () => assert.strictEqual(gate.questionFactoryEligibility(request, valid).ok, true),
  crucible_accepts_valid: () => assert.strictEqual(gate.crucibleEligibility(request, valid).ok, true),
  test_arena_accepts_valid: () => assert.strictEqual(gate.testArenaEligibility(request, valid).ok, true),
  missing_authority_denied_all: () => [gate.questionFactoryEligibility(request, null), gate.crucibleEligibility(request, null), gate.testArenaEligibility(request, null)].forEach((x) => assert.strictEqual(x.ok, false)),
  legacy_denied_all: () => [gate.questionFactoryEligibility(request, { ...valid, legacyOnly: true }), gate.crucibleEligibility(request, { ...valid, legacyOnly: true }), gate.testArenaEligibility(request, { ...valid, legacyOnly: true })].forEach((x) => assert.strictEqual(x.ok, false)),
  cross_scope_denied: () => assert.strictEqual(gate.questionFactoryEligibility({ ...request, missionId: 'other' }, valid).ok, false),
  invalidated_denied: () => assert.strictEqual(gate.testArenaEligibility(request, { ...valid, invalidated: true }).ok, false),
  superseded_denied: () => assert.strictEqual(gate.crucibleEligibility(request, { ...valid, superseded: true }).ok, false),
})) t(name, fn);
console.log(JSON.stringify({ total: 8, passed, failed: 8 - passed }));
