/**
 * B4 — Cycle-aware governed publication test suite (pure Node assert).
 * Run: node functions/test_mission_cycle_lifecycle.js
 */

const assert = require('assert');
const {
  assertCyclePublicationEligibility,
  assertDraftCycleWritePlanSafe,
  assertPublicationPlanIsolation,
  buildCyclePublicationPlan,
} = require('./services/mission_cycle_lifecycle');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const RECORDED_AT = '2026-09-11T16:00:00Z';

function eligibleCycle(overrides = {}) {
  return {
    cycleKey: '2027',
    status: 'INTERNAL_DRAFT',
    enrichmentStatus: 'ENRICHMENT_COMPLETE',
    enrichmentEvidence: { overallStatus: 'PASS' },
    readiness: { notificationReady: true, syllabusReady: false },
    ...overrides,
  };
}

const PLAN_BASE = {
  missionId: 'rpsc_first_grade',
  cycleKey: '2027',
  reason: 'Founder governed publication of the 2027 cycle',
  requestId: 'web-life-1726000000000',
  recordedAt: RECORDED_AT,
};

// --- eligibility -------------------------------------------------------------

test('L1: a completed-evidence INTERNAL_DRAFT cycle is publication eligible', () => {
  const eligibility = assertCyclePublicationEligibility(eligibleCycle());
  assert.strictEqual(eligibility.eligible, true);
});

test('L2: incomplete enrichment must never become publication-ready', () => {
  for (const enrichmentStatus of ['ENRICHMENT_FAILED', 'ENRICHMENT_BLOCKED', 'ENRICHMENT_INCOMPLETE', 'PENDING_ENRICHMENT']) {
    assert.throws(
      () => assertCyclePublicationEligibility(eligibleCycle({ enrichmentStatus })),
      /CYCLE_PUBLICATION_INELIGIBLE/,
    );
  }
});

test('L3: missing or non-PASS enrichment evidence blocks publication', () => {
  assert.throws(() => assertCyclePublicationEligibility(eligibleCycle({ enrichmentEvidence: null })), /CYCLE_PUBLICATION_INELIGIBLE/);
  assert.throws(
    () => assertCyclePublicationEligibility(eligibleCycle({ enrichmentEvidence: { overallStatus: 'FAIL' } })),
    /CYCLE_PUBLICATION_INELIGIBLE/,
  );
});

test('L4: an already-ACTIVE cycle is not re-published through this path', () => {
  assert.throws(() => assertCyclePublicationEligibility(eligibleCycle({ status: 'ACTIVE' })), /CYCLE_PUBLICATION_INELIGIBLE/);
});

test('L5: notification readiness is required; syllabus readiness reported honestly without blocking', () => {
  assert.throws(
    () => assertCyclePublicationEligibility(eligibleCycle({ readiness: { notificationReady: false, syllabusReady: false } })),
    /CYCLE_PUBLICATION_INELIGIBLE/,
  );
  const eligibility = assertCyclePublicationEligibility(eligibleCycle({ readiness: { notificationReady: true, syllabusReady: false } }));
  assert.strictEqual(eligibility.syllabusReady, false);
});

// --- plan construction -------------------------------------------------------

test('L6: publication plan selects exactly the requested cycle and moves the pointer', () => {
  const plan = buildCyclePublicationPlan({ ...PLAN_BASE, cycle: eligibleCycle() });
  assert.strictEqual(plan.type, 'CYCLE_PUBLICATION');
  assert.strictEqual(plan.selectedCycle.cycleKey, '2027');
  assert.strictEqual(plan.selectedCycle.status, 'ACTIVE');
  assert.strictEqual(plan.pointerUpdates.currentPublishedCycleKey, '2027');
  assert.strictEqual(plan.historicalCyclesPreserved, true);
});

test('L7: plan projection matches the governed lifecycle projection', () => {
  const plan = buildCyclePublicationPlan({ ...PLAN_BASE, cycle: eligibleCycle() });
  assert.strictEqual(plan.projectionUpdates.mission_realms.status, 'ACTIVE');
  assert.strictEqual(plan.projectionUpdates.recruitments.status, 'published');
  assert.strictEqual(plan.projectionUpdates.student_mission_catalog.studentPublicationState, 'ACTIVE');
  assert.strictEqual(plan.projectionUpdates.student_mission_catalog.visibility.studentVisible, true);
  assert.strictEqual(plan.projectionUpdates.student_mission_catalog.visibility.quickEntryEnabled, true);
  assert.strictEqual(plan.projectionUpdates.student_mission_catalog.visibility.smartEntryEnabled, false);
});

test('L8: governed reason and requestId are mandatory', () => {
  assert.throws(() => buildCyclePublicationPlan({ ...PLAN_BASE, reason: 'short', cycle: eligibleCycle() }), /PUBLICATION_REASON_REQUIRED/);
  assert.throws(() => buildCyclePublicationPlan({ ...PLAN_BASE, requestId: '!!', cycle: eligibleCycle() }), /PUBLICATION_REQUEST_ID_INVALID/);
});

test('L9: an ineligible cycle can never produce a publication plan', () => {
  assert.throws(
    () => buildCyclePublicationPlan({ ...PLAN_BASE, cycle: eligibleCycle({ enrichmentStatus: 'ENRICHMENT_FAILED' }) }),
    /CYCLE_PUBLICATION_INELIGIBLE/,
  );
});

test('L10: the plan is deeply frozen (immutable evidence artifact)', () => {
  const plan = buildCyclePublicationPlan({ ...PLAN_BASE, cycle: eligibleCycle() });
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.projectionUpdates.student_mission_catalog.visibility));
});

// --- isolation ---------------------------------------------------------------

test('L11: publication isolation proves only the selected cycle is touched', () => {
  const plan = buildCyclePublicationPlan({ ...PLAN_BASE, cycle: eligibleCycle() });
  assert.doesNotThrow(() => assertPublicationPlanIsolation(plan, '2027'));
  assert.throws(() => assertPublicationPlanIsolation(plan, '2028'), /PUBLICATION_ISOLATION_VIOLATION/);
});

// --- draft-creation boundary reuses the W1A firewall --------------------------

test('L12: draft-cycle write plans pass through the W1A lifecycle firewall', () => {
  assert.doesNotThrow(() => assertDraftCycleWritePlanSafe({
    enrichmentEvidence: { overallStatus: 'PASS' },
    readiness: { syllabusReady: false },
  }));
  assert.throws(
    () => assertDraftCycleWritePlanSafe({ enrichmentStatus: 'ENRICHMENT_COMPLETE', visibility: { studentVisible: true } }),
    /LIFECYCLE_MUTATION_BLOCKED/,
  );
});

// ---------------------------------------------------------------------------
let passCount = 0, failCount = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    passCount += 1;
    console.log(`PASS  ${name}`);
  } catch (err) {
    failCount += 1;
    console.log(`FAIL  ${name} :: ${err.message}`);
  }
}
console.log('-------------------------------------------------------------------------------');
console.log(`TEST_COUNT=${tests.length} PASS_COUNT=${passCount} FAIL_COUNT=${failCount}`);
process.exit(failCount > 0 ? 1 : 0);
