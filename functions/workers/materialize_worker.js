const admin = require("firebase-admin");

/**
 * Server-Side Materializer
 * Pulls from private /question_bank and writes to student-safe /published_questions.
 * Enforces strict safe-field allowlist and publication gates.
 */
async function materializeQuestion(questionId, db) {
  const qDoc = await db.collection('question_bank').doc(questionId).get();
  if (!qDoc.exists) {
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  const qData = qDoc.data();
  const status = qData.status;

  // Read publication gate approval state
  const pubDoc = await db.collection('publication_registry').doc(questionId).get();
  const pubData = pubDoc.exists ? pubDoc.data() : null;
  const isStudentReady = pubData && pubData.studentReady === true;

  if (status !== 'published' || !isStudentReady) {
    // Delete projection if not eligible
    await db.collection('published_questions').doc(questionId).delete();
    return null;
  }

  // Construct safe projection (strict positive allowlist, no undefined values)
  const safeProjection = {
    id: qData.id,
    questionLineageId: qData.questionLineageId || qData.id,
    version: qData.version || 1,
    questionType: qData.questionType || null,
    question: qData.question || '',
    options: qData.questionType === 'mcq_single' ? (qData.options || []) : [],
    difficulty: qData.difficulty || null,
    examId: qData.examId || null,
    subjectId: qData.subjectId || null,
    nodeId: qData.nodeId || null,
    atomicTopicIds: qData.atomicTopicIds || [],
    status: 'published',
    isPYQ: qData.isPYQ || false,
    verifiedBy: qData.verifiedBy || null,
    verifiedAt: qData.verifiedAt || null
  };

  await db.collection('published_questions').doc(questionId).set(safeProjection);
  return safeProjection;
}

module.exports = { materializeQuestion };
