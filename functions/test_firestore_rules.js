const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');
const { materializeQuestion } = require('./workers/materialize_worker');

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
  // 3. STUDENT ACCESS-LEAK AND BYPASS TESTS
  // ===================================================
  await runTestCase('Student CANNOT bypass security rules to read answers in published_questions (double confirmation)', async () => {
    // Attempting to read a clean published question to make sure it exists
    const doc = await studentDb.collection('published_questions').doc('q_mcq_private').get();
    if (!doc.exists) {
      throw new Error('Expected materialized question to exist');
    }
    const data = doc.data();
    if (data.answerIndex !== undefined || data.solution !== undefined || data.numericalAnswer !== undefined) {
      throw new Error('STUDENT_READABLE_PRIVATE_ANSWER_KEYS > 0 / Leak detected!');
    }
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
