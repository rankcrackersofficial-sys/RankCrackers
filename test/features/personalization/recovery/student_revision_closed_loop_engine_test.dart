import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_revision_closed_loop_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_revision_event.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_revision_queue.dart';

void main() {
  group('PERS-REV-01 revision closed loop', () {
    final now = DateTime.utc(2026, 8, 18, 10);

    StudentLearningState state({
      StudentMasteryBand masteryBand = StudentMasteryBand.developing,
      StudentRetentionState retentionState = StudentRetentionState.unstable,
    }) {
      return StudentLearningState(
        studentId: 'student_1',
        amtnId: 'amtn_1',
        missionId: 'jee_main_2026',
        calculatedAtUtc: now,
        masteryProbability: 0.64,
        masteryBand: masteryBand,
        masteryConfidence: StudentLearningStateConfidence.medium,
        retentionProbability: 0.52,
        retentionState: retentionState,
        retentionConfidence: StudentLearningStateConfidence.medium,
        fluencyScore: 0.6,
        fluencyPattern: StudentFluencyPattern.balanced,
        fluencyConfidence: StudentLearningStateConfidence.medium,
        prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
        prerequisiteConfidence: StudentLearningStateConfidence.medium,
        hintDependencyRate: 0.0,
        explanationDependencyRate: 0.0,
        retryRate: 0.0,
        answerChangeRate: 0.0,
        totalEligibleEvidenceCount: 12,
        schemaVersion: 3,
      );
    }

    StudentRevisionClosedLoopCandidate candidate({
      int version = 2,
      String projectionId = 'pub_1',
    }) {
      return StudentRevisionClosedLoopCandidate(
        studentId: 'student_1',
        amtnId: 'amtn_1',
        missionId: 'jee_main_2026',
        canonicalSemanticTopicId: 'topic_1',
        triggerType: RevisionTriggerType.retentionDecay,
        decayFactor: 0.72,
        canonicalKnowledgeVersion: version,
        publicProjectionId: projectionId,
        currentLearningState: state(),
      );
    }

    AafPersonalizationBridgeAuthority bridge({
      AafPublicProjectionStatus status = AafPublicProjectionStatus.current,
      int version = 2,
      String projectionId = 'pub_1',
    }) {
      return AafPersonalizationBridgeAuthority(
        studentId: 'student_1',
        targetAmtnId: 'amtn_1',
        missionId: 'jee_main_2026',
        canonicalSemanticTopicId: 'topic_1',
        canonicalKnowledgeVersion: version,
        publicProjectionId: projectionId,
        status: status,
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: now,
        schemaVersion: 2,
      );
    }

    StudentEvidenceEvent evidence({
      String eventId = 'evidence_1',
      StudentEvidenceAction action = StudentEvidenceAction.revisionCompleted,
      StudentAnswerOutcome outcome = StudentAnswerOutcome.correct,
      int hintsUsed = 0,
      bool explanationOpened = false,
    }) {
      return StudentEvidenceEvent(
        eventId: eventId,
        studentId: 'student_1',
        missionId: 'jee_main_2026',
        source: StudentEvidenceSource.revision,
        action: action,
        occurredAtUtc: now,
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: outcome,
        amtnId: 'amtn_1',
        questionId: 'question_1',
        hintsUsed: hintsUsed,
        wasExplanationOpened: explanationOpened,
        wasRetry: false,
        wasSkipped: false,
        schemaVersion: 3,
      );
    }

    test('completion requires governed evidence', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(),
        evidenceEvent: null,
        completedRevisionEventIds: const <String>{},
      );

      expect(result.decision, StudentRevisionCompletionDecision.evidenceNeeded);
      expect(result.state, StudentRevisionQueueState.evidenceNeeded);
      expect(result.createsQueueItem, isFalse);
    });

    test('passive view cannot complete revision', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(),
        evidenceEvent: evidence(
          action: StudentEvidenceAction.learningBlockViewed,
          outcome: StudentAnswerOutcome.notApplicable,
        ),
        completedRevisionEventIds: const <String>{},
      );

      expect(result.decision, StudentRevisionCompletionDecision.evidenceNeeded);
      expect(result.upgradesMastery, isFalse);
    });

    test('hinted answer completes evidence but cannot silently upgrade mastery',
        () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(),
        evidenceEvent: evidence(hintsUsed: 1),
        completedRevisionEventIds: const <String>{},
      );

      expect(result.decision, StudentRevisionCompletionDecision.completed);
      expect(result.upgradesMastery, isFalse);
    });

    test('independent revision evidence may complete and upgrade mastery', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(),
        evidenceEvent: evidence(),
        completedRevisionEventIds: const <String>{},
      );

      expect(result.decision, StudentRevisionCompletionDecision.completed);
      expect(result.state, StudentRevisionQueueState.completed);
      expect(result.upgradesMastery, isTrue);
    });

    test('stale canonical version blocks revision route before scheduling', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(version: 2),
        aafAuthority: bridge(version: 3),
        evidenceEvent: evidence(),
        completedRevisionEventIds: const <String>{},
      );

      expect(
        result.decision,
        StudentRevisionCompletionDecision.blockedByStaleAafVersion,
      );
      expect(result.createsQueueItem, isFalse);
    });

    test('withdrawn projection blocks revision route', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(status: AafPublicProjectionStatus.withdrawn),
        evidenceEvent: evidence(),
        completedRevisionEventIds: const <String>{},
      );

      expect(
        result.decision,
        StudentRevisionCompletionDecision.blockedByIneligibleProjection,
      );
      expect(result.createsQueueItem, isFalse);
    });

    test('superseded projection blocks revision route', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(status: AafPublicProjectionStatus.superseded),
        evidenceEvent: evidence(),
        completedRevisionEventIds: const <String>{},
      );

      expect(
        result.decision,
        StudentRevisionCompletionDecision.blockedByIneligibleProjection,
      );
    });

    test('unverified projection blocks revision route', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(status: AafPublicProjectionStatus.unverified),
        evidenceEvent: evidence(),
        completedRevisionEventIds: const <String>{},
      );

      expect(
        result.decision,
        StudentRevisionCompletionDecision.blockedByIneligibleProjection,
      );
    });

    test('duplicate completion event is idempotent', () {
      final result = const StudentRevisionClosedLoopEngine().completeRevision(
        candidate: candidate(),
        aafAuthority: bridge(),
        evidenceEvent: evidence(eventId: 'done_1'),
        completedRevisionEventIds: const <String>{'done_1'},
      );

      expect(
        result.decision,
        StudentRevisionCompletionDecision.duplicateCompletionIgnored,
      );
      expect(result.createsQueueItem, isFalse);
    });

    test('revision event validates governed evidence identity', () {
      final revisionEvent =
          const StudentRevisionClosedLoopEngine().createRevisionEvent(
        revisionEventId: 'revision_event_1',
        candidate: candidate(),
        evidenceEvent: evidence(),
        decision: StudentRevisionCompletionDecision.completed,
        occurredAtUtc: now,
      );

      expect(revisionEvent.outcome, StudentRevisionEventOutcome.completed);
      expect(revisionEvent.hasGovernedEvidence, isTrue);
      expect(() => revisionEvent.validate(), returnsNormally);
    });
  });
}
