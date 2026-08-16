"use strict";

const admin = require("firebase-admin");

/**
 * 🔱 Server-Issued AttemptSession & Authoritative Evaluation Worker
 */

async function createAttemptSession({
  db,
  userId,
  microTestId,
  macroTestId,
  scheduleId,
  questionIds,
  questionVersions,
  poolVersion,
  assemblyVersion,
  attemptOrdinal,
  isRunnable = true
}) {
  if (!isRunnable) {
    throw new Error("NOT_READY: Test is not runnable due to pending questions or scope issues.");
  }

  const attemptSessionId = `session_${userId}_${scheduleId}_ord${attemptOrdinal}`;
  const sessionRef = db.collection('attempt_sessions').doc(attemptSessionId);

  const sessionDoc = await sessionRef.get();
  if (sessionDoc.exists) {
    return sessionDoc.data();
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 3600 * 1000); // 3 hours expiration

  const sessionData = {
    attemptSessionId,
    userId,
    microTestId: microTestId || null,
    macroTestId: macroTestId || null,
    scheduleId,
    questionIds,
    questionVersions, // Map of questionId -> version
    poolVersion,
    assemblyVersion,
    attemptOrdinal,
    openedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    status: 'opened'
  };

  await sessionRef.set(sessionData);
  return sessionData;
}

async function evaluateAttempt({
  db,
  attemptSessionId,
  responses,
  submittedAt
}) {
  // 1. Fetch Session to check if it is micro or macro
  const sessionDoc = await db.collection('attempt_sessions').doc(attemptSessionId).get();
  if (!sessionDoc.exists) {
    throw new Error("INVALID_SESSION: Attempt session does not exist.");
  }
  const session = sessionDoc.data();

  const isMacro = session.macroTestId !== undefined && session.macroTestId !== null && session.macroTestId !== "";
  const attemptCollection = isMacro ? 'macro_attempts' : 'micro_attempts';
  const attemptRef = db.collection(attemptCollection).doc(attemptSessionId);

  // 2. Transactional Idempotency: Check if already evaluated
  const existingAttempt = await attemptRef.get();
  if (existingAttempt.exists) {
    console.log(`[Evaluator] Attempt for session ${attemptSessionId} already evaluated. Returning existing result.`);
    return existingAttempt.data();
  }

  const now = new Date();
  if (new Date(session.expiresAt) < now) {
    throw new Error("EXPIRED_SESSION: Attempt session has expired.");
  }

  // 3. Score Responses transactionally
  let totalScore = 0;
  const correctness = {};
  const evidenceRecords = [];

  // Fetch all authoritative question profiles and answer keys in parallel
  const questionIds = session.questionIds;
  const qDocs = await Promise.all(questionIds.map(id => db.collection('question_bank').doc(id).get()));
  const keyDocs = await Promise.all(questionIds.map(id => db.collection('answer_keys').doc(id).get()));

  const questionMap = new Map(qDocs.filter(d => d.exists).map(d => [d.id, d.data()]));
  const keyMap = new Map(keyDocs.filter(d => d.exists).map(d => [d.id, d.data()]));

  for (const qId of questionIds) {
    const question = questionMap.get(qId);
    const keyRecord = keyMap.get(qId);

    if (!question || !keyRecord) {
      throw new Error(`STALE_VERSION_OR_FORGED_QUESTION: Authoritative question profile/key for ${qId} missing.`);
    }

    // Verify version match
    const requiredVersion = session.questionVersions[qId];
    if (question.version !== requiredVersion) {
      throw new Error(`STALE_VERSION_OR_FORGED_QUESTION: Question version mismatch for ${qId}.`);
    }

    const studentResponse = responses[qId];
    let isCorrect = false;

    if (studentResponse !== undefined && studentResponse !== null) {
      const type = question.questionType;
      const expectedAnswer = keyRecord.verifiedAnswerValue;

      if (type === 'mcq_single') {
        isCorrect = studentResponse.trim() === expectedAnswer.trim();
      } else if (type === 'numerical') {
        // Scoring consumes the exam-specific acceptance policy
        const policy = keyRecord.acceptancePolicy || { type: 'exact' };
        const submittedDouble = parseFloat(studentResponse);
        const expectedDouble = parseFloat(expectedAnswer);

        if (!isNaN(submittedDouble) && !isNaN(expectedDouble)) {
          if (policy.type === 'exact') {
            isCorrect = Math.abs(submittedDouble - expectedDouble) < 1e-9;
          } else if (policy.type === 'integer') {
            isCorrect = Math.round(submittedDouble) === Math.round(expectedDouble);
          } else if (policy.type === 'tolerance') {
            const tol = policy.tolerance || 0.01;
            isCorrect = Math.abs(submittedDouble - expectedDouble) <= tol;
          } else {
            // Fail closed on unsupported policy
            isCorrect = false;
          }
        }
      }
    }

    correctness[qId] = isCorrect;
    if (isCorrect) {
      totalScore += 1;
    }

    // Authoritative Atom Mapping derived from server question metadata
    const atomIds = question.atomicTopicIds || [];
    const outcome = studentResponse === undefined || studentResponse === null 
      ? 'unanswered' 
      : (isCorrect ? 'correct' : 'incorrect');
    const evidenceStatus = isCorrect ? 'VERIFIED_CORRECT' : 'VERIFIED_INCORRECT';

    for (const atomId of atomIds) {
      evidenceRecords.push({
        attemptSessionId,
        attemptResultId: attemptSessionId,
        userId: session.userId,
        questionId: qId,
        questionLineageId: question.questionLineageId || question.id || '',
        questionVersion: question.version || 1,
        atomId,
        authoritativeAtomIds: question.atomicTopicIds || [],
        assessmentType: isMacro ? 'macro' : 'micro',
        scheduleId: session.scheduleId,
        outcome,
        evidenceStatus,
        timestamp: submittedAt
      });
    }
  }

  const resultData = {
    attemptSessionId,
    userId: session.userId,
    scheduleId: session.scheduleId,
    status: 'submitted',
    submittedAt,
    responses,
    score: totalScore,
    correctness,
    evaluated: true
  };

  // Write C3 Immutable artifacts via transaction/batch
  const batch = db.batch();

  // Create attempt result
  batch.set(attemptRef, resultData);

  // Create Atomic Evidence Records
  for (const record of evidenceRecords) {
    const recordId = `ev_${attemptSessionId}_${record.questionId}_${record.atomId}`;
    batch.set(db.collection('atomic_evidence_records').doc(recordId), record);
  }

  // Create Evidence Outbox Event
  const outboxId = `outbox_${attemptSessionId}`;
  const outboxEvent = {
    eventId: outboxId,
    attemptSessionId,
    userId: session.userId,
    scheduleId: session.scheduleId,
    score: totalScore,
    correctness,
    timestamp: now.toISOString(),
    eventStatus: 'pending_processing'
  };
  batch.set(db.collection('evidence_outbox').doc(outboxId), outboxEvent);

  await batch.commit();

  return resultData;
}

module.exports = {
  createAttemptSession,
  evaluateAttempt
};
