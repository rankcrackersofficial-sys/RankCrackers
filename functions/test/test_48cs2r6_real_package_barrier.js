'use strict';

const assert = require('assert');
const {
  FACT_VERIFICATION_LEVEL,
  RULE_TYPE_NORMALIZATION,
  deriveFactVerificationLevel,
  normalizeRealRuleType
} = require('../services/real_package_trust_boundary');
const { validateCareerRulebookPackage, PACKAGE_VALIDATION_RESULT } = require('../services/career_rulebook_package');
const { adapt48CS4PilotToRulebookPackage } = require('../services/real_source_adapter');
const { evaluateCareerSignalPersonalization } = require('../services/career_signal_matching_engine');
const { normalizeCareerProfile, ELIGIBILITY_STATUS } = require('../services/career_signal_models');

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('PASS', name); }

test('URL_FOUND cannot become RULE_VERIFIED', () => {
  const level = deriveFactVerificationLevel(
    { ruleType: 'AGE_LIMIT', evidenceRefs: ['page-1'] },
    { sourceState: 'URL_FOUND', officialSourceUrl: 'https://official.example/notice' }
  );
  assert.strictEqual(level, FACT_VERIFICATION_LEVEL.SOURCE_LOCATED);
  assert.notStrictEqual(level, FACT_VERIFICATION_LEVEL.RULE_VERIFIED);
});

test('SHA-verified unresolved RPSC scan cannot emit final ELIGIBLE', () => {
  const pkg = adapt48CS4PilotToRulebookPackage('RPSC-SCHOOL-LECTURER-ADV-06-2025-26');
  assert.strictEqual(pkg.baseNotification.sourceState, 'SHA_VERIFIED');
  assert.strictEqual(pkg.baseNotification.textExtractedAndBound, false);
  const view = evaluateCareerSignalPersonalization({
    profile: normalizeCareerProfile({ userId: 'r6-rpsc', dateOfBirth: '1995-01-01', highestQualification: 'POST_GRADUATION', reservationCategory: 'UR' }),
    rulebookPackage: pkg,
    eventId: 'evt_48cs2r6_rpsc'
  });
  assert.strictEqual(view.eligibilityStatus, ELIGIBILITY_STATUS.NOT_EVALUATED);
});

test('NEET 2026 cannot become current evidence for 2027 through adapter', () => {
  const lawful = adapt48CS4PilotToRulebookPackage('NEET-UG-2026-EVIDENCE-BASE');
  assert.strictEqual(lawful.isPriorCycleReference, true);
  const attacked = { ...lawful, isPriorCycleReference: false };
  const result = validateCareerRulebookPackage(attacked);
  assert.strictEqual(result.validationResult, PACKAGE_VALIDATION_RESULT.REJECTED_SOURCE_PACKAGE);
  assert.ok(result.errors.some(e => e.includes('CYCLE_MISMATCH')));
});

test('unknown real ruleType fails closed', () => {
  assert.strictEqual(normalizeRealRuleType('AGE_LIMIT_EXTRA').failureCode, 'UNKNOWN_RULE_TYPE');
  assert.strictEqual(Object.prototype.hasOwnProperty.call(RULE_TYPE_NORMALIZATION, 'AGE_LIMIT_EXTRA'), false);
  const pkg = adapt48CS4PilotToRulebookPackage('JEE-MAIN-2026');
  pkg.eligibilityRules.push({ ruleId: 'attack', ruleType: 'AGE_LIMIT_EXTRA', evidenceRefs: ['p1'] });
  const result = validateCareerRulebookPackage(pkg);
  assert.strictEqual(result.validationResult, PACKAGE_VALIDATION_RESULT.REJECTED_SOURCE_PACKAGE);
  assert.ok(result.errors.some(e => e.includes('UNKNOWN_RULE_TYPE')));
});

test('partial amendment chain forbids final eligibility', () => {
  const pkg = adapt48CS4PilotToRulebookPackage('RPSC-SCHOOL-LECTURER-ADV-06-2025-26');
  const result = validateCareerRulebookPackage(pkg);
  assert.strictEqual(result.derivedAmendmentStatus, 'CHAIN_PARTIAL');
  assert.notStrictEqual(result.validationResult, PACKAGE_VALIDATION_RESULT.ACCEPTED_FOR_MATCHING);
});

assert.strictEqual(passed, 5);
console.log('48CS2R6 adversarial barrier tests: 5/5 passed');
