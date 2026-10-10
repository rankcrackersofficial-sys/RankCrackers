"use strict";

process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8080";

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
const { materializeQuestion } = require("../../functions/workers/materialize_worker");

const PROJECT_ID = "rankcrackers-55";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: PROJECT_ID,
  });
}

const db = admin.firestore();

async function seed() {
  const planPath = path.join(__dirname, "../../assets/data/preview/jee_main_2027/crucible_preview_plan.json");
  const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  const firstSchedule = plan.schedules[0];
  console.log(`First schedule index: ${firstSchedule.scheduleIndex}, ID: ${firstSchedule.scheduleId}`);
  console.log(`Assigned Atom IDs count: ${firstSchedule.assignedAtomIds.length}`);
  
  const assignedAtoms = firstSchedule.assignedAtomIds;
  if (assignedAtoms.length === 0) {
    throw new Error("No atoms assigned to the first schedule!");
  }

  const batch = db.batch();
  const questionIds = [];
  for (let i = 1; i <= 50; i++) {
    const questionId = `q_first_micro_${i}`;
    questionIds.push(questionId);
    
    const atomId = assignedAtoms[(i - 1) % assignedAtoms.length];
    
    const questionRef = db.collection('question_bank').doc(questionId);
    batch.set(questionRef, {
      id: questionId,
      questionLineageId: questionId,
      version: 1,
      questionType: 'mcq_single',
      question: `This is question ${i} for first micro test about atomic topic ${atomId}. What is the correct answer?`,
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      difficulty: 'medium',
      examId: 'jee_main',
      subjectId: 'physics',
      nodeId: 'node_physics_1',
      atomicTopicIds: [atomId],
      status: 'published',
      verifiedBy: 'pro_reviewer_1',
      verifiedAt: admin.firestore.Timestamp.now(),
      solution: `Solution explanation for question ${i}.`
    });

    const keyRef = db.collection('answer_keys').doc(questionId);
    batch.set(keyRef, {
      verifiedAnswerValue: '0'
    });

    const pubRef = db.collection('publication_registry').doc(questionId);
    batch.set(pubRef, {
      id: questionId,
      studentReady: true,
      publishedAt: admin.firestore.Timestamp.now()
    });
  }

  console.log("Committing questions to question_bank & publication_registry...");
  await batch.commit();

  console.log("Materializing questions to published_questions...");
  for (const qId of questionIds) {
    await materializeQuestion(qId, db);
  }

  console.log(`✅ Seeded 50 questions for schedule 1: ${firstSchedule.scheduleId}`);
}

seed().catch(console.error);
