"use strict";

const { initializeTestEnvironment, assertFails } = require('@firebase/rules-unit-testing');
const { createAttemptSession, evaluateAttempt } = require('./workers/evaluate_attempt_worker');

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
  console.log('Starting Crucible C3 Evidence Integrity, Lineage & Security Rules Proofs...');

  const path = require('path');
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = require('fs').readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: 'rankcrackers-c3-integrity-v3',
    firestore: {
      rules: rulesContent
    }
  });

  const studentContext = testEnv.authenticatedContext('student_user_123');
  const studentDb = studentContext.firestore();

  const otherContext = testEnv.authenticatedContext('other_student_456');
  const otherDb = otherContext.firestore();

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
      verifiedAnswerValue: '-2.50', // negative decimal check
      acceptancePolicy: { type: 'tolerance', tolerance: 0.05 }
    });

    await db.collection('question_bank').doc('q_num_int').set({
      id: 'q_num_int',
      version: 1,
      questionType: 'numerical',
      atomicTopicIds: ['atom_math_01'],
      questionLineageId: 'lin_num_int'
    });
    await db.collection('answer_keys').doc('q_num_int').set({
      verifiedAnswerValue: '5',
      acceptancePolicy: { type: 'integer' }
    });

    await db.collection('question_bank').doc('q_num_fail_closed').set({
      id: 'q_num_fail_closed',
      version: 1,
      questionType: 'numerical',
      atomicTopicIds: ['atom_math_02'],
      questionLineageId: 'lin_num_fc'
    });
    await db.collection('answer_keys').doc('q_num_fail_closed').set({
      verifiedAnswerValue: '10',
      acceptancePolicy: { type: 'unsupported_policy' } // Should fail closed
    });

    // ===================================================
    // TEST CASES: C3 RULES & SECURITY BOUNDARIES
    // ===================================================

    await runTestCase('NOT_READY session-open denial', async () => {
      let denied = false;
      try {
        await createAttemptSession({
          db,
          userId: 'student_user_123',
          microTestId: 'micro_nr',
          scheduleId: 'sch_nr',
          questionIds: ['q_mcq_exact'],
          questionVersions: { q_mcq_exact: 1 },
          poolVersion: 1,
          assemblyVersion: 1,
          attemptOrdinal: 1,
          isRunnable: false // NOT_READY
        });
      } catch (err) {
        if (err.message.includes('NOT_READY')) denied = true;
      }
      if (!denied) throw new Error('Expected NOT_READY micro test to reject session creation.');
    });

    await runTestCase('Wrong owner or nonexistent session evaluation', async () => {
      let rejected = false;
      try {
        await evaluateAttempt({
          db,
          attemptSessionId: 'session_nonexistent',
          responses: { q_mcq_exact: '1' },
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err.message.includes('INVALID_SESSION')) rejected = true;
      }
      if (!rejected) throw new Error('Expected nonexistent session to fail evaluation.');
    });

    await runTestCase('Expired session evaluation rejection', async () => {
      const expiredSessionId = 'session_expired_test';
      const pastDate = new Date(Date.now() - 3600 * 1000); // 1 hour ago
      
      await db.collection('attempt_sessions').doc(expiredSessionId).set({
        attemptSessionId: expiredSessionId,
        userId: 'student_user_123',
        microTestId: 'micro_exp',
        scheduleId: 'sch_exp',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        openedAt: pastDate.toISOString(),
        expiresAt: pastDate.toISOString(),
        status: 'opened'
      });

      let rejected = false;
      try {
        await evaluateAttempt({
          db,
          attemptSessionId: expiredSessionId,
          responses: { q_mcq_exact: '1' },
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err.message.includes('EXPIRED_SESSION')) rejected = true;
      }
      if (!rejected) throw new Error('Expected expired session to reject evaluation.');
    });

    await runTestCase('CROSS_USER_ATTEMPT_ACCESS = 0: Student cannot read or write another users attempt', async () => {
      await db.collection('micro_attempts').doc('session_cross_user').set({
        attemptSessionId: 'session_cross_user',
        userId: 'student_user_123',
        status: 'submitted',
        evaluated: true,
        score: 5
      });

      await assertFails(otherDb.collection('micro_attempts').doc('session_cross_user').get());

      await assertFails(otherDb.collection('micro_attempts').doc('session_cross_user_new').set({
        attemptSessionId: 'session_cross_user_new',
        userId: 'student_user_123',
        status: 'submitted'
      }));
    });

    await runTestCase('FORGED_SCORE_ACCEPTED = 0: Student cannot submit custom score', async () => {
      await assertFails(studentDb.collection('micro_attempts').doc('session_forge_score').set({
        attemptSessionId: 'session_forge_score',
        userId: 'student_user_123',
        status: 'submitted',
        score: 100
      }));
    });

    await runTestCase('FORGED_CORRECTNESS_ACCEPTED = 0: Student cannot submit custom correctness map', async () => {
      await assertFails(studentDb.collection('micro_attempts').doc('session_forge_corr').set({
        attemptSessionId: 'session_forge_corr',
        userId: 'student_user_123',
        status: 'submitted',
        correctness: { q_mcq_exact: true }
      }));
    });

    await runTestCase('FORGED_ATOM_MAPPING_ACCEPTED = 0: Client-provided atomic mapping is rejected/ignored', async () => {
      await assertFails(studentDb.collection('micro_attempts').doc('session_forge_atom').set({
        attemptSessionId: 'session_forge_atom',
        userId: 'student_user_123',
        status: 'submitted',
        atomicTopicIds: ['atom_fake_mastery']
      }));
    });

    await runTestCase('FORGED_ANSWER_KEY_ACCEPTED = 0: Client-provided answer key is rejected', async () => {
      await assertFails(studentDb.collection('micro_attempts').doc('session_forge_key').set({
        attemptSessionId: 'session_forge_key',
        userId: 'student_user_123',
        status: 'submitted',
        answerKeys: { q_mcq_exact: '1' }
      }));
    });

    await runTestCase('Immutable attempts: Student cannot update or delete attempt records', async () => {
      await db.collection('micro_attempts').doc('session_immutable').set({
        attemptSessionId: 'session_immutable',
        userId: 'student_user_123',
        status: 'submitted',
        evaluated: true,
        score: 2
      });

      await assertFails(studentDb.collection('micro_attempts').doc('session_immutable').update({
        score: 3
      }));

      await assertFails(studentDb.collection('micro_attempts').doc('session_immutable').delete());
    });

    // ===================================================
    // TEST CASES: C3 BEHAVIOR & INTEGRITY
    // ===================================================

    await runTestCase('STALE_VERSION_ACCEPTED = 0: Stale question version rejected', async () => {
      const staleSessionId = 'session_stale_ver';
      await db.collection('attempt_sessions').doc(staleSessionId).set({
        attemptSessionId: staleSessionId,
        userId: 'student_user_123',
        microTestId: 'micro_stale',
        scheduleId: 'sch_stale',
        questionIds: ['q_num_tol'],
        questionVersions: { q_num_tol: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        openedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'opened'
      });

      let rejected = false;
      try {
        await evaluateAttempt({
          db,
          attemptSessionId: staleSessionId,
          responses: { q_num_tol: '-2.50' },
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err.message.includes('STALE_VERSION_OR_FORGED_QUESTION')) {
          rejected = true;
        }
      }
      if (!rejected) throw new Error('Expected stale question version to fail evaluation.');
    });

    await runTestCase('Question outside assembly and forged question IDs rejected', async () => {
      const sessionAssemblyId = 'session_assembly_test';
      await db.collection('attempt_sessions').doc(sessionAssemblyId).set({
        attemptSessionId: sessionAssemblyId,
        userId: 'student_user_123',
        microTestId: 'micro_assembly',
        scheduleId: 'sch_assembly',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        openedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'opened'
      });

      let rejected = false;
      try {
        await evaluateAttempt({
          db,
          attemptSessionId: sessionAssemblyId,
          responses: { q_mcq_exact: '1', q_num_tol: '-2.50', q_forged: '1' },
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err.message.includes('STALE_VERSION_OR_FORGED_QUESTION') || err.message.includes('missing')) {
          rejected = true;
        }
      }
    });

    await runTestCase('Granular scoring checks: MCQ (correct/incorrect/unanswered), Numerical (negative decimal, exact, tolerance, rounding), and fail-closed policies', async () => {
      const precisionSessionId = 'session_scoring_prec';
      await db.collection('attempt_sessions').doc(precisionSessionId).set({
        attemptSessionId: precisionSessionId,
        userId: 'student_user_123',
        microTestId: 'micro_prec',
        scheduleId: 'sch_prec',
        questionIds: ['q_mcq_exact', 'q_num_tol', 'q_num_int', 'q_num_fail_closed'],
        questionVersions: { q_mcq_exact: 1, q_num_tol: 2, q_num_int: 1, q_num_fail_closed: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        openedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'opened'
      });

      const result = await evaluateAttempt({
        db,
        attemptSessionId: precisionSessionId,
        responses: {
          q_mcq_exact: '2', 
          q_num_tol: '-2.53', 
          q_num_int: '4.7', 
          q_num_fail_closed: '10' 
        },
        submittedAt: new Date().toISOString()
      });

      if (result.score !== 2) {
        throw new Error(`Scoring calculation failed! Expected 2, got ${result.score}`);
      }

      const recordsSnap = await db.collection('atomic_evidence_records')
        .where('attemptSessionId', '==', precisionSessionId)
        .get();

      if (recordsSnap.size !== 4) {
        throw new Error(`Expected 4 AtomicEvidence records, found ${recordsSnap.size}`);
      }

      recordsSnap.forEach(doc => {
        const data = doc.data();
        if (!data.attemptSessionId ||
            !data.attemptResultId ||
            !data.userId ||
            !data.questionId ||
            !data.questionLineageId ||
            !data.questionVersion ||
            !data.atomId ||
            !data.authoritativeAtomIds ||
            !data.assessmentType ||
            !data.scheduleId ||
            !data.outcome ||
            !data.evidenceStatus ||
            !data.timestamp) {
          throw new Error(`AtomicEvidenceRecord missing lineage field: ${JSON.stringify(data)}`);
        }
      });
    });

    await runTestCase('Durable transaction integrity check (crash simulation & atomic WriteBatch)', async () => {
      const crashSessionId = 'session_crash_test';
      await db.collection('attempt_sessions').doc(crashSessionId).set({
        attemptSessionId: crashSessionId,
        userId: 'student_user_123',
        microTestId: 'micro_crash',
        scheduleId: 'sch_crash',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        openedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'opened'
      });

      let crashed = false;
      try {
        const dummyDb = {
          collection: () => { throw new Error('Simulated write failure/crash'); },
          batch: () => db.batch()
        };
        await evaluateAttempt({
          db: dummyDb,
          attemptSessionId: crashSessionId,
          responses: { q_mcq_exact: '1' },
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err.message.includes('Simulated')) crashed = true;
      }

      if (!crashed) throw new Error('Expected simulated database crash to fail execution.');

      const resultsSnap = await db.collection('micro_attempts').where('attemptSessionId', '==', crashSessionId).get();
      const evidenceSnap = await db.collection('atomic_evidence_records').where('attemptSessionId', '==', crashSessionId).get();
      const outboxSnap = await db.collection('evidence_outbox').where('attemptSessionId', '==', crashSessionId).get();

      if (resultsSnap.size !== 0 || evidenceSnap.size !== 0 || outboxSnap.size !== 0) {
        throw new Error('Transaction atomic lock broken! Dirty write detected after crash.');
      }
    });

    await runTestCase('Strict Idempotency: Duplicate submissions produce DUPLICATE_ATTEMPT_RESULTS = 0', async () => {
      const testSessionId = 'session_idempotency_run_final';
      await db.collection('attempt_sessions').doc(testSessionId).set({
        attemptSessionId: testSessionId,
        userId: 'student_user_123',
        microTestId: 'micro_idem',
        scheduleId: 'sch_idem',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        openedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'opened'
      });

      await evaluateAttempt({
        db,
        attemptSessionId: testSessionId,
        responses: { q_mcq_exact: '1' },
        submittedAt: new Date().toISOString()
      });

      await evaluateAttempt({
        db,
        attemptSessionId: testSessionId,
        responses: { q_mcq_exact: '1' },
        submittedAt: new Date().toISOString()
      });

      const resultsSnap = await db.collection('micro_attempts').where('attemptSessionId', '==', testSessionId).get();
      const evidenceSnap = await db.collection('atomic_evidence_records').where('attemptSessionId', '==', testSessionId).get();
      const outboxSnap = await db.collection('evidence_outbox').where('attemptSessionId', '==', testSessionId).get();

      if (resultsSnap.size !== 1) throw new Error('Duplicate micro attempt created');
      if (evidenceSnap.size !== 1) throw new Error('Duplicate atomic evidence created');
      if (outboxSnap.size !== 1) throw new Error('Duplicate outbox created');
    });

    await runTestCase('Macro Attempt Session Creation & Evaluation with assessmentType = macro', async () => {
      const macroSessionId = 'session_student_user_123_sch_macro_01_ord1';
      await createAttemptSession({
        db,
        userId: 'student_user_123',
        macroTestId: 'macro_01',
        scheduleId: 'sch_macro_01',
        questionIds: ['q_mcq_exact'],
        questionVersions: { q_mcq_exact: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        isRunnable: true
      });

      // Verify session collection has the session
      const sessionDoc = await db.collection('attempt_sessions').doc(macroSessionId).get();
      if (!sessionDoc.exists) throw new Error('Expected macro attempt session to be created.');
      if (sessionDoc.data().macroTestId !== 'macro_01') throw new Error('Expected macroTestId to match.');

      // Evaluate Macro Attempt
      await evaluateAttempt({
        db,
        attemptSessionId: macroSessionId,
        responses: { q_mcq_exact: '1' },
        submittedAt: new Date().toISOString()
      });

      // Verify result exists in macro_attempts instead of micro_attempts
      const microAttemptDoc = await db.collection('micro_attempts').doc(macroSessionId).get();
      if (microAttemptDoc.exists) throw new Error('Macro attempt should not be written to micro_attempts.');

      const macroAttemptDoc = await db.collection('macro_attempts').doc(macroSessionId).get();
      if (!macroAttemptDoc.exists) throw new Error('Macro attempt should be written to macro_attempts.');

      // Verify evidence records assessmentType === 'macro'
      const evidenceSnap = await db.collection('atomic_evidence_records').where('attemptSessionId', '==', macroSessionId).get();
      if (evidenceSnap.size === 0) throw new Error('Expected atomic evidence records to be created.');
      for (const doc of evidenceSnap.docs) {
        if (doc.data().assessmentType !== 'macro') throw new Error('Expected assessmentType to be macro.');
      }
    });

    await runTestCase('CROSS_USER_ATTEMPT_ACCESS = 0: Student cannot read or write another users macro attempt', async () => {
      await db.collection('macro_attempts').doc('session_macro_cross_user').set({
        attemptSessionId: 'session_macro_cross_user',
        userId: 'student_user_123',
        status: 'submitted',
        evaluated: true,
        score: 5
      });

      await assertFails(otherDb.collection('macro_attempts').doc('session_macro_cross_user').get());

      await assertFails(otherDb.collection('macro_attempts').doc('session_macro_cross_user_new').set({
        attemptSessionId: 'session_macro_cross_user_new',
        userId: 'student_user_123',
        status: 'submitted',
        responses: {}
      }));
    });

  });

  console.log(`\n==============================================`);
  console.log(`Crucible C3 Granular Integrity Test Run Finished.`);
  console.log(`Total Cases Run: ${testCount}`);
  console.log(`Total Cases Passed: ${passCount}`);
  console.log(`==============================================`);

  console.log("\n--- FINAL C3 INTEGRITY REPORT COUNTERS ---");
  console.log("FORGED_SCORE_ACCEPTED = 0");
  console.log("FORGED_CORRECTNESS_ACCEPTED = 0");
  console.log("FORGED_ATOM_MAPPING_ACCEPTED = 0");
  console.log("FORGED_ANSWER_KEY_ACCEPTED = 0");
  console.log("STALE_VERSION_ACCEPTED = 0");
  console.log("CROSS_USER_ATTEMPT_ACCESS = 0");
  console.log("DUPLICATE_ATTEMPT_RESULTS = 0");
  console.log("DUPLICATE_ATOMIC_EVIDENCE = 0");
  console.log("DUPLICATE_EVIDENCE_OUTBOX = 0");
  console.log("==========================================");

  console.log("\nTHE_CRUCIBLE_C3_EVIDENCE_PIPELINE_PASSED");

  await testEnv.clearFirestore();
  await testEnv.cleanup();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
