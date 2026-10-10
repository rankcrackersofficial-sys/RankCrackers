const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');
const { materializeQuestion } = require('./workers/materialize_worker');
const { createAttemptSession, evaluateAttempt } = require('./workers/evaluate_attempt_worker');

async function main() {
  console.log('Starting Firestore Rules Emulator & Materializer Tests...');
  
  const rulesPath = path.resolve(__dirname, '../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  const testEnv = await initializeTestEnvironment({
    projectId: 'rankcrackers-test-c2-fix5',
    firestore: {
      rules: rulesContent,
      host: '127.0.0.1',
      port: 8080
    }
  });

  const studentContext = testEnv.authenticatedContext('student_user_123');
  const studentDb = studentContext.firestore();

  const founderContext = testEnv.authenticatedContext('founder_user_123', { founder: true });
  const founderDb = founderContext.firestore();

  const anonContext = testEnv.unauthenticatedContext();
  const anonDb = anonContext.firestore();

  let testCount = 0;
  let passCount = 0;
  const errors = [];

  async function runTestCase(name, fn) {
    testCount++;
    try {
      await fn();
      passCount++;
      console.log(`[PASS] Test Case ${testCount}: ${name}`);
    } catch (e) {
      console.error(`[FAIL] Test Case ${testCount}: ${name}`);
      console.error(e);
      errors.push(`${name}: ${e.message}`);
    }
  }

  // ===================================================
  // 1. FIRESTORE SECURITY RULES TESTS
  // ===================================================

  // 1. Student identity cannot read / write question_bank private source
  await runTestCase('Student cannot read /question_bank/q1', async () => {
    await assertFails(studentDb.collection('question_bank').doc('q1').get());
  });

  await runTestCase('Student cannot write /question_bank/q1', async () => {
    await assertFails(studentDb.collection('question_bank').doc('q1').set({ question: 'leak?' }));
  });

  // 2. Student cannot read / write answer_keys
  await runTestCase('Student cannot read /answer_keys/q1', async () => {
    await assertFails(studentDb.collection('answer_keys').doc('q1').get());
  });

  await runTestCase('Student cannot write /answer_keys/q1', async () => {
    await assertFails(studentDb.collection('answer_keys').doc('q1').set({ verifiedAnswerValue: '42' }));
  });

  // 3. Student cannot read / write solution_verifications
  await runTestCase('Student cannot read /solution_verifications/q1', async () => {
    await assertFails(studentDb.collection('solution_verifications').doc('q1').get());
  });

  await runTestCase('Student cannot write /solution_verifications/q1', async () => {
    await assertFails(studentDb.collection('solution_verifications').doc('q1').set({ solutionHash: 'sha256_placeholder' }));
  });

  // 4. Student cannot read / write reviewer_registry
  await runTestCase('Student cannot read /reviewer_registry/r1', async () => {
    await assertFails(studentDb.collection('reviewer_registry').doc('r1').get());
  });

  await runTestCase('Student cannot write /reviewer_registry/r1', async () => {
    await assertFails(studentDb.collection('reviewer_registry').doc('r1').set({ role: 'PRO_REVIEWER' }));
  });

  // 5. Student cannot read / write publication_registry
  await runTestCase('Student cannot read /publication_registry/q1', async () => {
    await assertFails(studentDb.collection('publication_registry').doc('q1').get());
  });

  await runTestCase('Student cannot write /publication_registry/q1', async () => {
    await assertFails(studentDb.collection('publication_registry').doc('q1').set({ status: 'published', studentReady: true }));
  });

  // 6. Student cannot read / write pyq_evidence
  await runTestCase('Student cannot read /pyq_evidence/q1', async () => {
    await assertFails(studentDb.collection('pyq_evidence').doc('q1').get());
  });

  await runTestCase('Student cannot write /pyq_evidence/q1', async () => {
    await assertFails(studentDb.collection('pyq_evidence').doc('q1').set({ paperId: 'jee_2025' }));
  });

  // 7. Student cannot read / write lineage_registry
  await runTestCase('Student cannot read /lineage_registry/lin1', async () => {
    await assertFails(studentDb.collection('lineage_registry').doc('lin1').get());
  });

  await runTestCase('Student cannot write /lineage_registry/lin1', async () => {
    await assertFails(studentDb.collection('lineage_registry').doc('lin1').set({ activeVersion: 2 }));
  });

  // 8. Positive Test: Authenticated Student CAN read published questions
  await runTestCase('Founder can write to published_questions', async () => {
    await assertSucceeds(founderDb.collection('published_questions').doc('pq1').set({
      id: 'pq1',
      question: 'Is this safe?',
      status: 'published',
      questionType: 'mcq_single'
    }));
  });

  await runTestCase('Student CAN read published question pq1', async () => {
    await assertSucceeds(studentDb.collection('published_questions').doc('pq1').get());
  });

  // 9. Student CANNOT read draft questions in published_questions
  await runTestCase('Founder seeds a draft question in published_questions', async () => {
    await assertSucceeds(founderDb.collection('published_questions').doc('pq_draft').set({
      id: 'pq_draft',
      question: 'Draft stem',
      status: 'draft',
      questionType: 'mcq_single'
    }));
  });

  await runTestCase('Student CANNOT read draft question pq_draft', async () => {
    await assertFails(studentDb.collection('published_questions').doc('pq_draft').get());
  });

  // 10. Student cannot write to published_questions
  await runTestCase('Student cannot write to published_questions', async () => {
    await assertFails(studentDb.collection('published_questions').doc('pq2').set({
      id: 'pq2',
      status: 'published'
    }));
  });

  // 11. Anonymous user cannot read published_questions
  await runTestCase('Anonymous user cannot read published_questions', async () => {
    await assertFails(anonDb.collection('published_questions').doc('pq1').get());
  });

  // 12. Pre-existing system config checks
  await runTestCase('Student cannot read system_config', async () => {
    await assertFails(studentDb.collection('system_config').doc('global').get());
  });

  await runTestCase('Founder can read system_config', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('system_config').doc('global').set({ active: true });
    });
    await assertSucceeds(founderDb.collection('system_config').doc('global').get());
  });

  // 12.b Warrior Profiles Security Rules Tests
  await runTestCase('Student can read their own warrior profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('warrior_profiles').doc('student_user_123').set({ uid: 'student_user_123', gender: 'Male' });
    });
    await assertSucceeds(studentDb.collection('warrior_profiles').doc('student_user_123').get());
  });

  await runTestCase('Student can write their own warrior profile', async () => {
    await assertSucceeds(studentDb.collection('warrior_profiles').doc('student_user_123').set({
      uid: 'student_user_123',
      educationRecords: [{ id: '1', level: 'Class 12', status: 'Completed' }]
    }));
  });

  await runTestCase('Student cannot read another student\'s warrior profile', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection('warrior_profiles').doc('other_student_user').set({ uid: 'other_student_user', gender: 'Female' });
    });
    await assertFails(studentDb.collection('warrior_profiles').doc('other_student_user').get());
  });

  await runTestCase('Student cannot write another student\'s warrior profile', async () => {
    await assertFails(studentDb.collection('warrior_profiles').doc('other_student_user').set({
      uid: 'other_student_user',
      educationRecords: [{ id: '2', level: 'Class 12', status: 'Completed' }]
    }));
  });

  // 13. Safe published_questions field allowlist checks (even for Founder!)
  await runTestCase('Founder CANNOT write published_questions document with answerIndex', async () => {
    await assertFails(founderDb.collection('published_questions').doc('pq_fail_1').set({
      id: 'pq_fail_1',
      question: 'Stem',
      status: 'published',
      answerIndex: 2
    }));
  });

  await runTestCase('Founder CANNOT write published_questions document with solution', async () => {
    await assertFails(founderDb.collection('published_questions').doc('pq_fail_2').set({
      id: 'pq_fail_2',
      question: 'Stem',
      status: 'published',
      solution: 'Private explanation'
    }));
  });

  await runTestCase('Founder CANNOT write published_questions document with numericalAnswer', async () => {
    await assertFails(founderDb.collection('published_questions').doc('pq_fail_3').set({
      id: 'pq_fail_3',
      question: 'Stem',
      status: 'published',
      numericalAnswer: 4.5
    }));
  });

  await runTestCase('Founder CAN write published_questions document with ONLY allowed fields', async () => {
    await assertSucceeds(founderDb.collection('published_questions').doc('pq_success_1').set({
      id: 'pq_success_1',
      questionLineageId: 'lin_success',
      version: 1,
      questionType: 'mcq_single',
      question: 'What is allowed?',
      options: ['This', 'That'],
      status: 'published',
      isPYQ: false
    }));
  });

  // 14. PRO Reviewer Workflow Integration checks: Founder direct writes permitted, non-founders blocked
  await runTestCase('Founder CAN write to solution_verifications (registry write workflow)', async () => {
    await assertSucceeds(founderDb.collection('solution_verifications').doc('sv_q1').set({
      solutionStatus: 'verified',
      solutionHash: 'sha256_hash_value',
      reviewingAuthority: 'admin_reviewer_1'
    }));
  });

  await runTestCase('Founder CAN write to reviewer_registry', async () => {
    await assertSucceeds(founderDb.collection('reviewer_registry').doc('rev_1').set({
      role: 'PRO_REVIEWER',
      active: true
    }));
  });

  await runTestCase('Founder CAN write to publication_registry', async () => {
    await assertSucceeds(founderDb.collection('publication_registry').doc('pub_q1').set({
      studentReady: true
    }));
  });

  // 15. Content Payloads security checks
  await runTestCase('Founder CAN write content_payloads with status', async () => {
    await assertSucceeds(founderDb.collection('content_payloads').doc('cp_pub').set({
      status: 'published',
      nodeId: 'node_1'
    }));
    await assertSucceeds(founderDb.collection('content_payloads').doc('cp_draft').set({
      status: 'draft',
      nodeId: 'node_2'
    }));
    await assertSucceeds(founderDb.collection('content_payloads').doc('cp_quarantine').set({
      status: 'quarantined',
      nodeId: 'node_3'
    }));
    await assertSucceeds(founderDb.collection('content_payloads').doc('cp_archived').set({
      status: 'archived',
      nodeId: 'node_4'
    }));
  });

  await runTestCase('Student CAN read published content payload cp_pub', async () => {
    await assertSucceeds(studentDb.collection('content_payloads').doc('cp_pub').get());
  });

  await runTestCase('Student CANNOT read draft content payload cp_draft', async () => {
    await assertFails(studentDb.collection('content_payloads').doc('cp_draft').get());
  });

  await runTestCase('Student CANNOT read quarantined content payload cp_quarantine', async () => {
    await assertFails(studentDb.collection('content_payloads').doc('cp_quarantine').get());
  });

  await runTestCase('Student CANNOT read archived content payload cp_archived', async () => {
    await assertFails(studentDb.collection('content_payloads').doc('cp_archived').get());
  });

  await runTestCase('Student CANNOT read non-existent content payload cp_non_existent', async () => {
    await assertFails(studentDb.collection('content_payloads').doc('cp_non_existent').get());
  });

  await runTestCase('Unauthenticated user CANNOT read published content payload cp_pub', async () => {
    await assertFails(anonDb.collection('content_payloads').doc('cp_pub').get());
  });

  await runTestCase('Student CANNOT write to content_payloads', async () => {
    await assertFails(studentDb.collection('content_payloads').doc('cp_student_write').set({
      status: 'published',
      nodeId: 'node_1'
    }));
  });

  // ===================================================
  // 2. SERVER MATERIALIZER & LEAK TESTS
  // ===================================================

  await runTestCase('Materializer creates safe published question from private MCQ', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Seed private registries
      await db.collection('question_bank').doc('q_mcq_private').set({
        id: 'q_mcq_private',
        question: 'What is the speed of light?',
        options: ['3e8 m/s', '1e8 m/s', '2e8 m/s', '4e8 m/s'],
        answerIndex: 0,
        status: 'published',
        questionType: 'mcq_single',
        solution: 'Speed of light is 3x10^8 m/s.',
        questionLineageId: 'lin_mcq'
      });

      await db.collection('publication_registry').doc('q_mcq_private').set({
        studentReady: true
      });

      // Run materializer
      const projection = await materializeQuestion('q_mcq_private', db);

      // Verify returned projection fields (positive allowlist check)
      const allowedKeys = [
        'id', 'questionLineageId', 'version', 'questionType', 'question', 'options',
        'difficulty', 'examId', 'subjectId', 'nodeId', 'atomicTopicIds', 'status',
        'isPYQ', 'verifiedBy', 'verifiedAt'
      ];
      
      for (const key of Object.keys(projection)) {
        if (!allowedKeys.includes(key)) {
          throw new Error(`Forbidden field leaked in projection output: ${key}`);
        }
      }

      if (projection.answerIndex !== undefined || projection.solution !== undefined) {
        throw new Error('Private MCQ answer index or solution leaked in materializer return object!');
      }

      // Check stored firestore document fields
      const doc = await db.collection('published_questions').doc('q_mcq_private').get();
      const stored = doc.data();

      if (stored.answerIndex !== undefined || stored.solution !== undefined) {
        throw new Error('Private MCQ answer index or solution leaked to firestore projection collection!');
      }
    });
  });

  await runTestCase('Materializer creates safe published question from private Numerical', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Seed private registries
      await db.collection('question_bank').doc('q_num_private').set({
        id: 'q_num_private',
        question: 'Solve for x: x - 2.5 = 0',
        options: [],
        numericalAnswer: 2.5,
        status: 'published',
        questionType: 'numerical',
        solution: 'x = 2.5',
        questionLineageId: 'lin_num'
      });

      await db.collection('publication_registry').doc('q_num_private').set({
        studentReady: true
      });

      // Run materializer
      await materializeQuestion('q_num_private', db);

      // Check stored firestore document fields
      const doc = await db.collection('published_questions').doc('q_num_private').get();
      const stored = doc.data();

      if (stored.numericalAnswer !== undefined || stored.solution !== undefined) {
        throw new Error('Private Numerical answer or solution leaked to firestore projection collection!');
      }
    });
  });

  await runTestCase('Materializer deletes/ignores draft or non-ready questions', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      // Case A: Draft status
      await db.collection('question_bank').doc('q_draft_private').set({
        id: 'q_draft_private',
        question: 'Draft stem',
        status: 'draft',
        questionType: 'mcq_single'
      });
      await db.collection('publication_registry').doc('q_draft_private').set({
        studentReady: true
      });

      await materializeQuestion('q_draft_private', db);
      const docDraft = await db.collection('published_questions').doc('q_draft_private').get();
      if (docDraft.exists) {
        throw new Error('Draft question materialized incorrectly!');
      }

      // Case B: Not student-ready
      await db.collection('question_bank').doc('q_not_ready_private').set({
        id: 'q_not_ready_private',
        question: 'Review stem',
        status: 'published',
        questionType: 'mcq_single'
      });
      await db.collection('publication_registry').doc('q_not_ready_private').set({
        studentReady: false
      });

      await materializeQuestion('q_not_ready_private', db);
      const docNotReady = await db.collection('published_questions').doc('q_not_ready_private').get();
      if (docNotReady.exists) {
        throw new Error('Non student-ready question materialized incorrectly!');
      }
    });
  });

  // ===================================================
  // 4. CRUCIBLE C2A & C3 PIPELINE TESTS
  // ===================================================

  await runTestCase('Draft question cannot write directly to trust registries', async () => {
    await assertFails(studentDb.collection('published_questions').doc('q_draft_direct').set({
      id: 'q_draft_direct',
      status: 'draft'
    }));
  });

  await runTestCase('Micro stays NOT_READY if approved count < 50', async () => {
    const mockDb = testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      
      for (let i = 0; i < 49; i++) {
        await db.collection('question_bank').doc(`q_sch1_${i}`).set({
          id: `q_sch1_${i}`,
          status: 'published',
          version: 1,
          questionType: 'mcq_single',
          atomicTopicIds: ['atom_sch1']
        });
      }
      
      let opened = false;
      try {
        await createAttemptSession({
          db,
          userId: 'student_123',
          microTestId: 'micro_1',
          scheduleId: 'sch_1',
          questionIds: Array.from({ length: 49 }, (_, i) => `q_sch1_${i}`),
          questionVersions: {},
          poolVersion: 1,
          assemblyVersion: 1,
          attemptOrdinal: 1,
          isRunnable: false
        });
        opened = true;
      } catch (err) {
        if (!err.message.includes("NOT_READY")) throw err;
      }
      
      if (opened) {
        throw new Error("Should have blocked session creation for NOT_READY micro test!");
      }
    });
  });

  await runTestCase('Student cannot create or modify AttemptSession directly', async () => {
    await assertFails(studentDb.collection('attempt_sessions').doc('session_fake').set({
      attemptSessionId: 'session_fake',
      userId: 'student_user_123',
      status: 'opened'
    }));
  });

  await runTestCase('Student cannot submit score or correctness directly in micro_attempts', async () => {
    await assertFails(studentDb.collection('micro_attempts').doc('session_fake').set({
      attemptSessionId: 'session_fake',
      userId: 'student_user_123',
      status: 'submitted',
      score: 50,
      correctness: { q1: true }
    }));
  });

  await runTestCase('Student cannot overwrite or mutate evaluated result', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('micro_attempts').doc('session_evaluated').set({
        attemptSessionId: 'session_evaluated',
        userId: 'student_user_123',
        status: 'submitted',
        evaluated: true,
        score: 10
      });
    });

    await assertFails(studentDb.collection('micro_attempts').doc('session_evaluated').update({
      score: 50
    }));
  });

  await runTestCase('C3 Evaluation: scoring precision, idempotency, and outbox validation', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      await db.collection('question_bank').doc('q_mcq_c3').set({
        id: 'q_mcq_c3',
        version: 1,
        questionType: 'mcq_single',
        atomicTopicIds: ['atom_c3_mcq']
      });
      await db.collection('answer_keys').doc('q_mcq_c3').set({
        verifiedAnswerValue: '2'
      });

      await db.collection('question_bank').doc('q_num_c3').set({
        id: 'q_num_c3',
        version: 1,
        questionType: 'numerical',
        atomicTopicIds: ['atom_c3_num']
      });
      await db.collection('answer_keys').doc('q_num_c3').set({
        verifiedAnswerValue: '4.50',
        acceptancePolicy: { type: 'tolerance', tolerance: 0.05 }
      });

      const session = await createAttemptSession({
        db,
        userId: 'student_user_123',
        microTestId: 'micro_c3',
        scheduleId: 'sch_c3',
        questionIds: ['q_mcq_c3', 'q_num_c3'],
        questionVersions: { q_mcq_c3: 1, q_num_c3: 1 },
        poolVersion: 1,
        assemblyVersion: 1,
        attemptOrdinal: 1,
        isRunnable: true
      });

      const result = await evaluateAttempt({
        db,
        attemptSessionId: session.attemptSessionId,
        responses: { q_mcq_c3: '2', q_num_c3: '4.52' },
        submittedAt: new Date().toISOString()
      });

      if (result.score !== 2) {
        throw new Error(`Scoring calculation failed! Expected 2, got ${result.score}`);
      }

      const repeatResult = await evaluateAttempt({
        db,
        attemptSessionId: session.attemptSessionId,
        responses: { q_mcq_c3: '2', q_num_c3: '4.52' },
        submittedAt: new Date().toISOString()
      });

      if (repeatResult.score !== 2) {
        throw new Error("Idempotent check failed!");
      }

      const outboxDoc = await db.collection('evidence_outbox').doc(`outbox_${session.attemptSessionId}`).get();
      if (!outboxDoc.exists) {
        throw new Error("EvidenceOutbox event missing!");
      }
      const outbox = outboxDoc.data();
      if (outbox.score !== 2 || outbox.eventStatus !== 'pending_processing') {
        throw new Error("EvidenceOutbox schema validation failed!");
      }

      const evMcq = await db.collection('atomic_evidence_records').doc(`ev_${session.attemptSessionId}_q_mcq_c3_atom_c3_mcq`).get();
      const evNum = await db.collection('atomic_evidence_records').doc(`ev_${session.attemptSessionId}_q_num_c3_atom_c3_num`).get();

      if (!evMcq.exists || !evNum.exists) {
        throw new Error("AtomicEvidenceRecord documents missing!");
      }
    });
  });

  console.log(`\n==============================================`);
  console.log(`Firestore Rules & Materializer Test Run Finished.`);
  console.log(`Total Cases Run: ${testCount}`);
  console.log(`Total Cases Passed: ${passCount}`);
  console.log(`Total Cases Failed: ${errors.length}`);
  console.log(`==============================================`);

  await testEnv.clearFirestore();
  await testEnv.cleanup();

  if (errors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
