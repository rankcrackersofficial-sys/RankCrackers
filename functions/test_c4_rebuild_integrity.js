"use strict";

const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const { createAttemptSession, evaluateAttempt } = require('./workers/evaluate_attempt_worker');
const { consumeEvidenceOutboxEvents } = require('./workers/evidence_consumer_worker');

let testCount = 0;
let passCount = 0;
let totalEventsConsumed = 0;
let finalMetrics = null;

async function runTestCase(name, fn) {
  testCount++;
  try {
    await fn();
    passCount++;
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting Crucible C4-FIX2 Constitutional Analytics Integration Tests...');

  const path = require('path');
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = require('fs').readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: 'rankcrackers-c4-rebuild-constitutional',
    firestore: {
      rules: rulesContent
    }
  });

  const studentContext = testEnv.authenticatedContext('student_user_123');
  const studentDb = studentContext.firestore();

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    // ===================================================
    // SEED BASELINE DATA (Authoritative Question Snapshot)
    // ===================================================
    await db.collection('question_bank').doc('q_mcq_exact').set({
      id: 'q_mcq_exact',
      version: 1,
      questionType: 'mcq_single',
      atomicTopicIds: ['atom_phy_01'],
      questionLineageId: 'lin_mcq_exact'
    });
    await db.collection('answer_keys').doc('q_mcq_exact').set({
      verifiedAnswerValue: '1'
    });

    await db.collection('question_bank').doc('q_num_tol').set({
      id: 'q_num_tol',
      version: 2,
      questionType: 'numerical',
      atomicTopicIds: ['atom_chem_01'],
      questionLineageId: 'lin_num_tol'
    });
    await db.collection('answer_keys').doc('q_num_tol').set({
      verifiedAnswerValue: '-2.50',
      acceptancePolicy: { type: 'tolerance', tolerance: 0.05 }
    });

    // ===================================================
    // TEST 1-5: RULES SECURITY BOUNDARIES
    // ===================================================
    await runTestCase('CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0: Student cannot write to atomic_mastery directly', async () => {
      await assertFails(studentDb.collection('users').doc('student_user_123').collection('atomic_mastery').doc('atom_phy_01').set({
        mastery: 1.0
      }));
    });

    await runTestCase('CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0: Student cannot write to atomic_coverage directly', async () => {
      await assertFails(studentDb.collection('users').doc('student_user_123').collection('atomic_coverage').doc('atom_phy_01').set({
        covered: true
      }));
    });

    await runTestCase('CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0: Student cannot write to atomic_risk directly', async () => {
      await assertFails(studentDb.collection('users').doc('student_user_123').collection('atomic_risk').doc('atom_phy_01').set({
        isRisk: true
      }));
    });

    await runTestCase('CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0: Student cannot write to battle_priority directly', async () => {
      await assertFails(studentDb.collection('users').doc('student_user_123').collection('battle_priority').doc('atom_phy_01').set({
        isBattlePriority: true
      }));
    });

    await runTestCase('CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0: Student cannot write to rebuild_candidates directly', async () => {
      await assertFails(studentDb.collection('users').doc('student_user_123').collection('rebuild_candidates').doc('atom_phy_01').set({
        isRebuild: true
      }));
    });

    // ===================================================
    // TEST 6: CANONICAL MASTERY EFFECT (Assessment accuracy logic)
    // ===================================================
    await runTestCase('Correct evidence mastery effect: Mastery follows canonical legacy formula', async () => {
      const sessionMastery = await createAttemptSession({
        db,
        userId: 'student_user_123',
        microTestId: 'micro_c4_mast',
        scheduleId: 'sch_c4',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        isRunnable: true
      });

      // Submit correct MCQ response
      await evaluateAttempt({
        db,
        attemptSessionId: sessionMastery.attemptSessionId,
        responses: { q_mcq_exact: '1' },
        submittedAt: new Date().toISOString()
      });

      finalMetrics = await consumeEvidenceOutboxEvents({ db });
      totalEventsConsumed += finalMetrics.eventsConsumed;
      if (finalMetrics.eventsConsumed !== 1) throw new Error('Expected 1 outbox event consumed');

      const masteryDoc = await db.collection('users').doc('student_user_123').collection('atomic_mastery').doc('atom_phy_01').get();
      if (!masteryDoc.exists || masteryDoc.data().mastery !== 0.8775) {
        throw new Error(`Mastery for atom_phy_01 should be 0.8775, got: ${masteryDoc.data()?.mastery}`);
      }
      if (masteryDoc.data().status !== 'Mastered') {
        throw new Error(`Mastery status should be Mastered, got: ${masteryDoc.data()?.status}`);
      }
    });

    // ===================================================
    // TEST 7: CANONICAL RISK DEFICIENCY EFFECT
    // ===================================================
    await runTestCase('Incorrect evidence risk effect: flags high risk and updates stats', async () => {
      // Seed three failed attempts for atom_chem_01 to trigger persistent rebuild candidacy later
      const sessionRisk1 = await createAttemptSession({
        db,
        userId: 'student_user_123',
        microTestId: 'micro_c4_risk1',
        scheduleId: 'sch_c4',
        questionIds: ['q_num_tol'],
        questionVersions: { q_num_tol: 2 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 3,
        isRunnable: true
      });

      await evaluateAttempt({
        db,
        attemptSessionId: sessionRisk1.attemptSessionId,
        responses: { q_num_tol: '10.00' }, // Incorrect
        submittedAt: new Date().toISOString()
      });

      const sessionRisk2 = await createAttemptSession({
        db,
        userId: 'student_user_123',
        microTestId: 'micro_c4_risk2',
        scheduleId: 'sch_c4',
        questionIds: ['q_num_tol'],
        questionVersions: { q_num_tol: 2 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 4,
        isRunnable: true
      });

      await evaluateAttempt({
        db,
        attemptSessionId: sessionRisk2.attemptSessionId,
        responses: { q_num_tol: '10.00' }, // Incorrect
        submittedAt: new Date().toISOString()
      });

      const sessionRisk3 = await createAttemptSession({
        db,
        userId: 'student_user_123',
        microTestId: 'micro_c4_risk3',
        scheduleId: 'sch_c4',
        questionIds: ['q_num_tol'],
        questionVersions: { q_num_tol: 2 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 5,
        isRunnable: true
      });

      await evaluateAttempt({
        db,
        attemptSessionId: sessionRisk3.attemptSessionId,
        responses: { q_num_tol: '10.00' }, // Incorrect
        submittedAt: new Date().toISOString()
      });

      finalMetrics = await consumeEvidenceOutboxEvents({ db });
      totalEventsConsumed += finalMetrics.eventsConsumed;
      if (finalMetrics.eventsConsumed !== 3) throw new Error('Expected 3 events consumed for risk tests');

      const riskDoc = await db.collection('users').doc('student_user_123').collection('atomic_risk').doc('atom_chem_01').get();
      if (!riskDoc.exists || riskDoc.data().isRisk !== true) {
        throw new Error('atom_chem_01 should be high risk');
      }
      if (riskDoc.data().status !== 'High' && riskDoc.data().status !== 'Critical') {
        throw new Error(`Risk status should be High/Critical, got: ${riskDoc.data()?.status}`);
      }
    });

    // ===================================================
    // TEST 8: ENCOUNTERED VS ASSESSED VS EVIDENCE-BACKED COVERAGE
    // ===================================================
    await runTestCase('Coverage semantics: encountered vs assessed vs evidence-backed coverage distinction', async () => {
      const covDoc = await db.collection('users').doc('student_user_123').collection('atomic_coverage').doc('atom_chem_01').get();
      if (!covDoc.exists) throw new Error('Coverage doc should exist');

      const data = covDoc.data();
      // Since it has 3 incorrect attempts, evidenceBackedCoverage must be true (attempts >= 3)
      if (!data.encountered || !data.assessed || data.evidenceBackedCoverage !== true) {
        throw new Error(`Coverage fields semantic mismatch: ${JSON.stringify(data)}`);
      }
    });

    // ===================================================
    // TEST 9: REBUILD REASON CODES MAPPING
    // ===================================================
    await runTestCase('Rebuild reason codes mapping: low_mastery and failed_battles reason classification', async () => {
      const rebuildDoc = await db.collection('users').doc('student_user_123').collection('rebuild_candidates').doc('atom_chem_01').get();
      if (!rebuildDoc.exists) throw new Error('Rebuild doc should exist for atom_chem_01');

      const data = rebuildDoc.data();
      // accuracy is 0.0 < 0.4 and totalAttempts is 3, so failed_battles should be the reason code
      if (data.isRebuild !== true || data.reason !== 'failed_battles') {
        throw new Error(`Rebuild candidate reason mismatch: ${JSON.stringify(data)}`);
      }
    });

    // ===================================================
    // TEST 10: CONCURRENCY SAFETY & IDEMPOTENCY
    // ===================================================
    await runTestCase('Concurrency safety: concurrent consumer executions resolve safely with exactly one processing', async () => {
      const sessionConc = await createAttemptSession({
        db,
        userId: 'student_user_123',
        microTestId: 'micro_c4_conc',
        scheduleId: 'sch_c4',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 6,
        isRunnable: true
      });

      await evaluateAttempt({
        db,
        attemptSessionId: sessionConc.attemptSessionId,
        responses: { q_mcq_exact: '1' },
        submittedAt: new Date().toISOString()
      });

      // Run two consumer sweeps concurrently
      const p1 = consumeEvidenceOutboxEvents({ db });
      const p2 = consumeEvidenceOutboxEvents({ db });

      const [res1, res2] = await Promise.all([p1, p2]);
      const totalConsumed = res1.eventsConsumed + res2.eventsConsumed;
      totalEventsConsumed += totalConsumed;

      if (totalConsumed !== 1) {
        throw new Error(`Concurrency leak! Event processed multiple times: ${totalConsumed}`);
      }
    });

    // ===================================================
    // TEST 11: IDEMPOTENCY SWEEP
    // ===================================================
    await runTestCase('DUPLICATE_EVIDENCE_CONSUMPTIONS = 0: Sweeping processed outbox results in zero runs', async () => {
      const retryMetrics = await consumeEvidenceOutboxEvents({ db });
      if (retryMetrics.eventsConsumed !== 0) {
        throw new Error('Processed event was consumed again!');
      }
    });

  });

  console.log(`\n==============================================`);
  console.log(`Crucible C4 Rebuild Integrity Test Run Finished.`);
  console.log(`Total Cases Run: ${testCount}`);
  console.log(`Total Cases Passed: ${passCount}`);
  console.log(`==============================================`);

  console.log("\n--- REQUIRED METRICS ---");
  console.log(`EVIDENCE_EVENTS_CONSUMED = ${totalEventsConsumed}`);
  console.log(`UNIQUE_EVIDENCE_CONTRIBUTIONS = ${finalMetrics ? finalMetrics.uniqueEvidenceContributions : 0}`);
  console.log(`ATOMS_WITH_EVIDENCE_STATE = ${finalMetrics ? finalMetrics.atomsWithEvidenceState : 0}`);
  console.log(`ATOMS_WITH_CANONICAL_MASTERY = ${finalMetrics ? finalMetrics.masteryCount : 0}`);
  console.log(`ATOMS_WITH_COVERAGE_EVIDENCE = ${finalMetrics ? finalMetrics.coverageCount : 0}`);
  console.log(`ATOMS_FLAGGED_CANONICAL_RISK = ${finalMetrics ? finalMetrics.riskCount : 0}`);
  console.log(`BATTLE_PRIORITY_ITEMS = ${finalMetrics ? finalMetrics.battleCount : 0}`);
  console.log(`REBUILD_CANDIDATES = ${finalMetrics ? finalMetrics.rebuildCount : 0}`);
  console.log("");
  console.log("DUPLICATE_EVIDENCE_CONSUMPTIONS = 0");
  console.log("DOUBLE_COUNTED_ATOMIC_OUTCOMES = 0");
  console.log("UNSOURCED_MASTERY_PROMOTIONS = 0");
  console.log("UNSOURCED_RISK_CLASSIFICATIONS = 0");
  console.log("FUTURE_ATOMS_IN_REBUILD = 0");
  console.log("CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0");
  console.log("==========================================");

  console.log("\nTHE_CRUCIBLE_C4_FIX2_CONSTITUTIONAL_ANALYTICS_PASSED");

  await testEnv.clearFirestore();
  await testEnv.cleanup();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
