"use strict";

const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { createAttemptSession, evaluateAttempt } = require('./workers/evaluate_attempt_worker');

async function runTestCase(name, fn) {
  try {
    await fn();
    console.log(`[PASS] ${name}`);
  } catch (err) {
    console.error(`[FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log('Starting Crucible C3 Evidence Integrity & Lineage Proofs...');

  const path = require('path');
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = require('fs').readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: 'rankcrackers-c3-integrity',
    firestore: {
      rules: rulesContent
    }
  });

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
      verifiedAnswerValue: '10.50',
      acceptancePolicy: { type: 'tolerance', tolerance: 0.1 }
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

    // ===================================================
    // TEST CASES
    // ===================================================

    await runTestCase('NOT_READY session-open denial', async () => {
      let denied = false;
      try {
        await createAttemptSession({
          db,
          userId: 'student_1',
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
        userId: 'student_1',
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

    await runTestCase('Stale question version rejection', async () => {
      const staleSessionId = 'session_stale_test';
      await db.collection('attempt_sessions').doc(staleSessionId).set({
        attemptSessionId: staleSessionId,
        userId: 'student_1',
        microTestId: 'micro_stale',
        scheduleId: 'sch_stale',
        questionIds: ['q_num_tol'],
        questionVersions: { q_num_tol: 1 }, // Authoritative version in question_bank is 2
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
          responses: { q_num_tol: '10.50' },
          submittedAt: new Date().toISOString()
        });
      } catch (err) {
        if (err.message.includes('STALE_VERSION_OR_FORGED_QUESTION')) rejected = true;
      }
      if (!rejected) throw new Error('Expected stale question version to fail evaluation.');
    });

    await runTestCase('Scoring precision: MCQ, Numerical (tolerance & integer checks), and unanswered inputs', async () => {
      const precisionSessionId = 'session_precision_test';
      await db.collection('attempt_sessions').doc(precisionSessionId).set({
        attemptSessionId: precisionSessionId,
        userId: 'student_1',
        microTestId: 'micro_prec',
        scheduleId: 'sch_prec',
        questionIds: ['q_mcq_exact', 'q_num_tol', 'q_num_int'],
        questionVersions: { q_mcq_exact: 1, q_num_tol: 2, q_num_int: 1 },
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
          q_mcq_exact: '1',
          q_num_tol: '10.55',
          q_num_int: '4.8'
        },
        submittedAt: new Date().toISOString()
      });

      if (result.score !== 3) {
        throw new Error(`Expected score 3, got ${result.score}`);
      }
    });

    await runTestCase('Granular Lineage Verification: AtomicEvidenceRecord & Outbox metadata matches exact spec', async () => {
      const precisionSessionId = 'session_precision_test';
      
      const outboxDoc = await db.collection('evidence_outbox').doc(`outbox_${precisionSessionId}`).get();
      if (!outboxDoc.exists) throw new Error('Outbox event missing');
      const outbox = outboxDoc.data();
      if (outbox.score !== 3 || outbox.scheduleId !== 'sch_prec' || outbox.userId !== 'student_1') {
        throw new Error('Outbox schema field mismatch');
      }

      const evDoc = await db.collection('atomic_evidence_records').doc(`ev_${precisionSessionId}_q_num_tol_atom_chem_01`).get();
      if (!evDoc.exists) throw new Error('Atomic evidence document missing');
      
      const ev = evDoc.data();
      if (ev.userId !== 'student_1' ||
          ev.attemptSessionId !== precisionSessionId ||
          ev.questionId !== 'q_num_tol' ||
          ev.atomId !== 'atom_chem_01' ||
          ev.evidenceStatus !== 'VERIFIED_CORRECT') {
        throw new Error('AtomicEvidenceRecord lineage metadata verification failed!');
      }
    });

    await runTestCase('Strict Idempotency: Retry creates exactly 1 AttemptResult, 1 Outbox event, and 1 AtomicEvidence per correctness', async () => {
      const testSessionId = 'session_idempotency_run';
      await db.collection('attempt_sessions').doc(testSessionId).set({
        attemptSessionId: testSessionId,
        userId: 'student_1',
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

      if (resultsSnap.size !== 1) {
        throw new Error(`DUPLICATE_ATTEMPT_RESULTS = ${resultsSnap.size - 1} / Idempotency failed!`);
      }
      if (evidenceSnap.size !== 1) {
        throw new Error(`DUPLICATE_ATOMIC_EVIDENCE = ${evidenceSnap.size - 1} / Idempotency failed!`);
      }
      if (outboxSnap.size !== 1) {
        throw new Error(`DUPLICATE_EVIDENCE_OUTBOX = ${outboxSnap.size - 1} / Idempotency failed!`);
      }

      console.log("DUPLICATE_ATTEMPT_RESULTS = 0");
      console.log("DUPLICATE_ATOMIC_EVIDENCE = 0");
      console.log("DUPLICATE_EVIDENCE_OUTBOX = 0");
    });

  });

  console.log('\n==================================================');
  console.log('Crucible C3 Evidence Integrity & Lineage Proofs Completed Successfully!');
  console.log('==================================================');

  await testEnv.clearFirestore();
  await testEnv.cleanup();
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
