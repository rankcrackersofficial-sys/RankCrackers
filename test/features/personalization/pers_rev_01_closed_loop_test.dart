import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_revision_queue_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_revision_closed_loop_engine.dart';

void main() {
  group('PERS-REV-01 Revision Closed Loop Implementation Tests', () {
    final t = DateTime.utc(2026, 8, 18);

    StudentLearningState dummyState({
      String studentId = 's1',
      String amtnId = 'amtn1',
      String missionId = 'jee_main_2026',
      StudentRetentionState retentionState = StudentRetentionState.unstable,
    }) {
      return StudentLearningState(
        studentId: studentId,
        amtnId: amtnId,
        missionId: missionId,
        calculatedAtUtc: t,
        masteryProbability: 0.7,
        masteryBand: StudentMasteryBand.developing,
        masteryConfidence: StudentLearningStateConfidence.medium,
        retentionProbability: 0.6,
        retentionState: retentionState,
        retentionConfidence: StudentLearningStateConfidence.medium,
        fluencyScore: 0.5,
        fluencyPattern: StudentFluencyPattern.balanced,
        fluencyConfidence: StudentLearningStateConfidence.medium,
        prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
        prerequisiteConfidence: StudentLearningStateConfidence.medium,
        hintDependencyRate: 0.1,
        explanationDependencyRate: 0.05,
        retryRate: 0.15,
        answerChangeRate: 0.08,
        totalEligibleEvidenceCount: 10,
        schemaVersion: 3,
      );
    }

    StudentRevisionClosedLoopCandidate validCandidate({
      String studentId = 's1',
      String amtnId = 'amtn1',
      String missionId = 'jee_main_2026',
      RevisionTriggerType trigger = RevisionTriggerType.retentionDecay,
      double decay = 0.5,
      int version = 1,
      String projection = 'pub1',
      StudentLearningState? state,
    }) {
      return StudentRevisionClosedLoopCandidate(
        studentId: studentId,
        amtnId: amtnId,
        missionId: missionId,
        triggerType: trigger,
        decayFactor: decay,
        knowledgeVersion: version,
        projectionId: projection,
        currentLearningState:
            state ?? dummyState(studentId: studentId, amtnId: amtnId, missionId: missionId),
      );
    }

    AafPersonalizationBridgeAuthority validBridge({
      String studentId = 's1',
      String targetAmtnId = 'amtn1',
      String missionId = 'jee_main_2026',
      AafPublicProjectionStatus status = AafPublicProjectionStatus.current,
      int version = 1,
      String projection = 'pub1',
    }) {
      return AafPersonalizationBridgeAuthority(
        studentId: studentId,
        targetAmtnId: targetAmtnId,
        missionId: missionId,
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: version,
        publicProjectionId: projection,
        status: status,
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: t,
        schemaVersion: 2,
      );
    }

    test('1. Valid candidate properties - PASS', () {
      final c = validCandidate();
      expect(() => c.validate(), returnsNormally);
    });

    test('2. Attack: Decay factor > 1.0 - FAIL CLOSED', () {
      final c = validCandidate(decay: 1.1);
      expect(() => c.validate(), throwsFormatException);
    });

    test('3. Attack: Decay factor < 0.0 - FAIL CLOSED', () {
      final c = validCandidate(decay: -0.1);
      expect(() => c.validate(), throwsFormatException);
    });

    test(
        '4. Attack: Candidate identity mismatch with learning state - FAIL CLOSED',
        () {
      final c = StudentRevisionClosedLoopCandidate(
        studentId: 'student_a',
        amtnId: 'amtn1',
        missionId: 'jee_main_2026',
        triggerType: RevisionTriggerType.retentionDecay,
        decayFactor: 0.5,
        knowledgeVersion: 1,
        projectionId: 'pub1',
        currentLearningState:
            dummyState(studentId: 'student_b', amtnId: 'amtn1', missionId: 'jee_main_2026'),
      );
      expect(() => c.validate(), throwsFormatException);
    });

    test('5. Deduplication preserves unique items only - PASS', () {
      final c1 = validCandidate(amtnId: 'amtn1');
      final c2 = validCandidate(amtnId: 'amtn1');
      final c3 = validCandidate(amtnId: 'amtn2');
      final list = const StudentRevisionClosedLoopEngine()
          .filterAndDeduplicate([c1, c2, c3]);
      expect(list.length, equals(2));
      expect(list[0].amtnId, equals('amtn1'));
      expect(list[1].amtnId, equals('amtn2'));
    });

    test('6. Critical priority for weakness trigger - PASS', () {
      final c = validCandidate(trigger: RevisionTriggerType.weaknessDetected);
      expect(const StudentRevisionClosedLoopEngine().computePriority(c),
          equals(RevisionItemPriority.critical));
    });

    test('7. Critical priority for high decay - PASS', () {
      final c = validCandidate(decay: 0.85);
      expect(const StudentRevisionClosedLoopEngine().computePriority(c),
          equals(RevisionItemPriority.critical));
    });

    test('8. Maintenance priority for strong retention - PASS', () {
      final c = validCandidate(
          state: dummyState(retentionState: StudentRetentionState.strong));
      expect(const StudentRevisionClosedLoopEngine().computePriority(c),
          equals(RevisionItemPriority.maintenance));
    });

    test('9. Normal priority for standard decay - PASS', () {
      final c = validCandidate(decay: 0.4);
      expect(const StudentRevisionClosedLoopEngine().computePriority(c),
          equals(RevisionItemPriority.normal));
    });

    test('10. Due check is true when current time is after due date - PASS', () {
      final c = validCandidate();
      final now = t.add(const Duration(hours: 1));
      expect(const StudentRevisionClosedLoopEngine().isDue(c, now, t), isTrue);
    });

    test('11. Due check is true when current time is equal to due date - PASS',
        () {
      final c = validCandidate();
      expect(const StudentRevisionClosedLoopEngine().isDue(c, t, t), isTrue);
    });

    test('12. Due check is false when current time is before due date - PASS',
        () {
      final c = validCandidate();
      final now = t.subtract(const Duration(hours: 1));
      expect(const StudentRevisionClosedLoopEngine().isDue(c, now, t), isFalse);
    });

    test('13. Non-UTC timestamp triggers fail-closed format exception - PASS',
        () {
      final c = validCandidate();
      final local = DateTime(2026, 8, 18);
      expect(() => const StudentRevisionClosedLoopEngine().isDue(c, local, t),
          throwsFormatException);
    });

    test('14. Invalidation: status withdrawn - PASS', () {
      final c = validCandidate();
      final bridge = validBridge(status: AafPublicProjectionStatus.withdrawn);
      expect(
          const StudentRevisionClosedLoopEngine()
              .shouldInvalidate(candidate: c, aafAuthority: bridge),
          isTrue);
    });

    test('15. Invalidation: status superseded - PASS', () {
      final c = validCandidate();
      final bridge = validBridge(status: AafPublicProjectionStatus.superseded);
      expect(
          const StudentRevisionClosedLoopEngine()
              .shouldInvalidate(candidate: c, aafAuthority: bridge),
          isTrue);
    });

    test('16. Invalidation: version mismatch - PASS', () {
      final c = validCandidate(version: 1);
      final bridge = validBridge(version: 2);
      expect(
          const StudentRevisionClosedLoopEngine()
              .shouldInvalidate(candidate: c, aafAuthority: bridge),
          isTrue);
    });

    test('17. Invalidation: projection ID mismatch - PASS', () {
      final c = validCandidate(projection: 'pub1');
      final bridge = validBridge(projection: 'pub2');
      expect(
          const StudentRevisionClosedLoopEngine()
              .shouldInvalidate(candidate: c, aafAuthority: bridge),
          isTrue);
    });

    test('18. Invalidation: identity mismatch throws FormatException - PASS',
        () {
      final c = validCandidate(studentId: 'student_a');
      final bridge = validBridge(studentId: 'student_b');
      expect(
          () => const StudentRevisionClosedLoopEngine()
              .shouldInvalidate(candidate: c, aafAuthority: bridge),
          throwsFormatException);
    });

    test('19. Completion evidence verified by mentorVerified action - PASS',
        () {
      final c = validCandidate();
      final event = StudentEvidenceEvent(
        eventId: 'event1',
        studentId: 's1',
        missionId: 'jee_main_2026',
        amtnId: 'amtn1',
        source: StudentEvidenceSource.mentorVerification,
        action: StudentEvidenceAction.mentorVerified,
        occurredAtUtc: t,
        sourceConfidence: StudentEvidenceConfidence.medium,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );
      expect(
          const StudentRevisionClosedLoopEngine()
              .processCompletionEvidence(candidate: c, event: event),
          isTrue);
    });

    test('20. Completion evidence verified by diagnosticCompleted action - PASS',
        () {
      final c = validCandidate();
      final event = StudentEvidenceEvent(
        eventId: 'event2',
        studentId: 's1',
        missionId: 'jee_main_2026',
        amtnId: 'amtn1',
        source: StudentEvidenceSource.diagnostic,
        action: StudentEvidenceAction.diagnosticCompleted,
        occurredAtUtc: t,
        sourceConfidence: StudentEvidenceConfidence.medium,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );
      expect(
          const StudentRevisionClosedLoopEngine()
              .processCompletionEvidence(candidate: c, event: event),
          isTrue);
    });

    test('21. Completion evidence not validated for regular study activity - PASS',
        () {
      final c = validCandidate();
      final event = StudentEvidenceEvent(
        eventId: 'event3',
        studentId: 's1',
        missionId: 'jee_main_2026',
        amtnId: 'amtn1',
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.nodeCompleted,
        occurredAtUtc: t,
        sourceConfidence: StudentEvidenceConfidence.medium,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );
      expect(
          const StudentRevisionClosedLoopEngine()
              .processCompletionEvidence(candidate: c, event: event),
          isFalse);
    });
  });
}
