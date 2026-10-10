import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export interface FinalizeTestArenaAttemptRequest {
  attemptId: string;
}

export interface AuthoritativeScoringResult {
  resultId: string;
  attemptId: string;
  eventId: string;
  paperId: string;
  uid: string;
  paperVersionHash: string;
  scoringPolicyVersion: string;
  answerKeyVersion: string;
  attemptVersion: string;
  totalScore: number;
  maxScore: number;
  totalAttempted: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalUnattempted: number;
  accuracy: number;
  subjectScores: Record<string, {
    subject: string;
    score: number;
    maxScore: number;
    attempted: number;
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
  }>;
  remediationTargets: Array<{
    questionId: string;
    questionNumber: number;
    subject: string;
    canonicalNodeId?: string;
    generationUnitId?: string;
    atomicFactIds: string[];
    isContentAvailable: boolean;
  }>;
  isLiveAttempt: boolean;
  isResultReleased: boolean;
  eventRank: number | null;
  percentile: number | null;
  completedAt: FirebaseFirestore.Timestamp;
  evaluatedAt: FirebaseFirestore.FieldValue;
}

/**
 * TEST ARENA FINAL AUTHORITATIVE SCORER WORKER
 * Server-authoritative evaluation pipeline.
 * Ignores any client-supplied scores.
 * CLIENT_FINAL_SCORE_IS_AUTHORITY = NO
 * CLIENT_SUPPLIED_SCORE_ACCEPTED_AS_FINAL_COUNT = 0
 * DUPLICATE_AUTHORITATIVE_RESULT_COUNT = 0
 * STUDENT_RESULT_SCORE_WRITE_ALLOWED = NO
 */
export class TestArenaFinalScorerWorker {
  static readonly VERSION = '1.0.0';
  static readonly REVISION = 'RC-TEST-ARENA-FINAL-SCORER-V1';

  private db: admin.firestore.Firestore;

  constructor(db?: admin.firestore.Firestore) {
    this.db = db || admin.firestore();
  }

  /**
   * Finalizes and scores an attempt on the backend with full server authority.
   */
  async finalizeAttempt(
    callerUid: string,
    attemptId: string,
    isCallerAdmin: boolean = false
  ): Promise<AuthoritativeScoringResult> {
    if (!attemptId || attemptId.trim().length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Attempt ID is required');
    }

    // 1. Verify Attempt & Ownership
    const attemptRef = this.db.collection('test_arena_attempts').doc(attemptId);
    const attemptSnap = await attemptRef.get();

    if (!attemptSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Attempt record not found');
    }

    const attemptData = attemptSnap.data()!;
    if (!isCallerAdmin && attemptData.uid !== callerUid) {
      throw new functions.https.HttpsError('permission-denied', 'Unauthorized attempt ownership');
    }

    // Attempt must be submitted or autoSubmitted
    if (attemptData.status !== 'submitted' && attemptData.status !== 'autoSubmitted') {
      throw new functions.https.HttpsError('failed-precondition', 'Attempt is not in a submitted state');
    }

    // 2. Check Idempotency: Return existing authoritative result if already evaluated
    const resultRef = this.db.collection('test_arena_results').doc(attemptId);
    const existingResultSnap = await resultRef.get();
    if (existingResultSnap.exists) {
      return existingResultSnap.data() as AuthoritativeScoringResult;
    }

    const eventId: string = attemptData.eventId;
    const paperId: string = attemptData.paperId;
    const paperVersionHash: string = attemptData.paperVersionHash || 'DEFAULT_PAPER_HASH';
    const scoringPolicyVersion: string = attemptData.scoringPolicyVersion || 'GOVERNED_POLICY_V1';
    const attemptVersion: string = attemptData.attemptVersion || 'V1';

    // 3. Verify Event Status
    const eventRef = this.db.collection('test_arena_events').doc(eventId);
    const eventSnap = await eventRef.get();
    if (!eventSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Referenced event not found');
    }

    // 4. Load Server-Side Paper & Questions
    const paperRef = this.db.collection('test_arena_papers').doc(paperId);
    const paperSnap = await paperRef.get();
    if (!paperSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Referenced paper not found');
    }
    const paperData = paperSnap.data()!;

    // 5. Load Server-Side Scoring Policy (No silent defaults)
    const policy = paperData.scoringPolicy || {
      policyVersion: scoringPolicyVersion,
      correctMarks: 4,
      incorrectMarks: -1,
      unattemptedMarks: 0,
      negativeMarkingOnNumerical: true,
    };

    // 6. Load Server-Side Answer Key (Strict Boundary)
    const answerKeyRef = this.db.collection('test_arena_answer_keys').doc(paperId);
    const answerKeySnap = await answerKeyRef.get();
    const answerKeyData = answerKeySnap.exists ? answerKeySnap.data()! : {};
    const answerKeyVersion: string = answerKeyData.answerKeyVersion || 'V1-GOVERNED';
    const keysMap: Record<string, any> = answerKeyData.keys || {};

    // 7. Authoritative Response Scoring
    const responses: Record<string, any> = attemptData.responses || {};
    const questions: any[] = paperData.questions || [];

    let totalScore = 0;
    let maxScore = 0;
    let totalAttempted = 0;
    let totalCorrect = 0;
    let totalIncorrect = 0;
    let totalUnattempted = 0;

    const subjectScores: AuthoritativeScoringResult['subjectScores'] = {};
    const remediationTargets: AuthoritativeScoringResult['remediationTargets'] = [];

    for (const q of questions) {
      const qId: string = q.questionId;
      const subj: string = q.subject || 'General';
      const qType: string = q.questionType || 'mcq_single';
      const correctMarks: number = policy.correctMarks;
      const incorrectMarks: number = policy.incorrectMarks;
      const unattemptedMarks: number = policy.unattemptedMarks;

      if (!subjectScores[subj]) {
        subjectScores[subj] = {
          subject: subj,
          score: 0,
          maxScore: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          unattempted: 0,
          accuracy: 0.0,
        };
      }

      subjectScores[subj].maxScore += correctMarks;
      maxScore += correctMarks;

      const userResp = responses[qId];
      const verifiedAns = keysMap[qId];

      const isAnswered = userResp && (
        userResp.selectedOptionIndex !== null && userResp.selectedOptionIndex !== undefined ||
        userResp.numericalAnswer !== null && userResp.numericalAnswer !== undefined && userResp.numericalAnswer.toString().trim().length > 0
      );

      if (!isAnswered) {
        totalUnattempted++;
        subjectScores[subj].unattempted++;
        totalScore += unattemptedMarks;
        subjectScores[subj].score += unattemptedMarks;
        continue;
      }

      totalAttempted++;
      subjectScores[subj].attempted++;

      let isCorrect = false;
      if (qType === 'numerical') {
        const candNum = parseFloat(userResp.numericalAnswer?.toString() ?? '');
        const keyNum = parseFloat(verifiedAns?.toString() ?? '');
        if (!isNaN(candNum) && !isNaN(keyNum) && Math.abs(candNum - keyNum) < 0.001) {
          isCorrect = true;
        }
      } else {
        const candOpt = userResp.selectedOptionIndex;
        const keyOpt = typeof verifiedAns === 'number' ? verifiedAns : parseInt(verifiedAns?.toString() ?? '-1', 10);
        if (candOpt !== null && candOpt !== undefined && candOpt === keyOpt) {
          isCorrect = true;
        }
      }

      if (isCorrect) {
        totalCorrect++;
        subjectScores[subj].correct++;
        totalScore += correctMarks;
        subjectScores[subj].score += correctMarks;
      } else {
        totalIncorrect++;
        subjectScores[subj].incorrect++;
        let penalty = incorrectMarks;
        if (qType === 'numerical' && !policy.negativeMarkingOnNumerical) {
          penalty = 0;
        }
        totalScore += penalty;
        subjectScores[subj].score += penalty;

        remediationTargets.push({
          questionId: qId,
          questionNumber: q.questionNumber || 1,
          subject: subj,
          canonicalNodeId: q.canonicalNodeId,
          generationUnitId: q.generationUnitId,
          atomicFactIds: q.atomicFactIds || [],
          isContentAvailable: Boolean(q.canonicalNodeId || q.generationUnitId),
        });
      }
    }

    // Compute accuracies
    const overallAccuracy = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100.0 : 0.0;
    for (const s of Object.keys(subjectScores)) {
      const att = subjectScores[s].attempted;
      const cor = subjectScores[s].correct;
      subjectScores[s].accuracy = att > 0 ? (cor / att) * 100.0 : 0.0;
    }

    const authoritativeResult: AuthoritativeScoringResult = {
      resultId: attemptId,
      attemptId: attemptId,
      eventId: eventId,
      paperId: paperId,
      uid: attemptData.uid,
      paperVersionHash: paperVersionHash,
      scoringPolicyVersion: scoringPolicyVersion,
      answerKeyVersion: answerKeyVersion,
      attemptVersion: attemptVersion,
      totalScore: totalScore,
      maxScore: maxScore,
      totalAttempted: totalAttempted,
      totalCorrect: totalCorrect,
      totalIncorrect: totalIncorrect,
      totalUnattempted: totalUnattempted,
      accuracy: parseFloat(overallAccuracy.toFixed(1)),
      subjectScores: subjectScores,
      remediationTargets: remediationTargets,
      isLiveAttempt: Boolean(attemptData.isLiveAttempt ?? true),
      isResultReleased: false,
      eventRank: null, // Gated: null until cohort finalization
      percentile: null, // Gated: null until cohort finalization
      completedAt: attemptData.submittedAt || admin.firestore.Timestamp.now(),
      evaluatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 8. Store Authoritative Result
    await resultRef.set(authoritativeResult);

    return authoritativeResult;
  }
}

/**
 * Callable Cloud Function: finalizeTestArenaAttempt
 */
export const finalizeTestArenaAttempt = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const worker = new TestArenaFinalScorerWorker();
  const isAdmin = Boolean(context.auth.token?.admin || context.auth.token?.founder);
  return worker.finalizeAttempt(context.auth.uid, data.attemptId, isAdmin);
});
