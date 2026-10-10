import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_autonomous_loop_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_mastery_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_retention_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_fluency_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_prerequisite_state_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_learning_state_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_treatment_decision_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/syllabus_personalization_route_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/digibook_personalization_route_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/crucible_personalization_blueprint_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_revision_queue_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_revision_closed_loop_engine.dart';
import 'package:rank_crackers/features/personalization/domain/engines/student_coaching_support_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';

void main() {
  group('RELIABILITY FF01: Multi-Mission Isolation Leakage Tests', () {
    late StudentAutonomousLoopEngine loop;
    final now = DateTime.utc(2026, 8, 18, 12);

    setUp(() {
      loop = const StudentAutonomousLoopEngine(
        masteryEngine: StudentMasteryEngine(),
        retentionEngine: StudentRetentionEngine(),
        fluencyEngine: StudentFluencyEngine(),
        prerequisiteEngine: StudentPrerequisiteStateEngine(),
        learningStateEngine: StudentLearningStateEngine(),
        treatmentEngine: StudentTreatmentDecisionEngine(),
        syllabusEngine: SyllabusPersonalizationRouteEngine(),
        digibookEngine: DigiBookPersonalizationRouteEngine(),
        crucibleEngine: CruciblePersonalizationBlueprintEngine(),
        revisionEngine: StudentRevisionQueueEngine(),
        revisionClosedLoopEngine: StudentRevisionClosedLoopEngine(),
        coachingEngine: StudentCoachingSupportEngine(),
      );
    });

    test('1. Mission A evidence does not affect Mission B mastery - PASS', () {
      final missionA = 'jee_main_2026';
      final missionB = 'neet_ug_2027';

      final bridgeB = AafPersonalizationBridgeAuthority(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        missionId: missionB,
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: 1,
        publicProjectionId: 'pub1',
        status: AafPublicProjectionStatus.current,
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: now,
        schemaVersion: 2,
      );

      final eventA = StudentEvidenceEvent(
        eventId: 'e1',
        studentId: 's1',
        missionId: missionA, // WRONG MISSION for bridgeB
        amtnId: 'amtn1',
        questionId: 'q1',
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: now.subtract(const Duration(minutes: 5)),
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );

      final result = loop.run(
        bridge: bridgeB,
        rawEvents: [eventA],
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      );

      // result.learningState should have insufficient evidence because eventA was ignored
      expect(result.learningState.missionId, equals(missionB));
      expect(result.learningState.masteryConfidence, equals(StudentLearningStateConfidence.insufficient));
      expect(result.learningState.totalEligibleEvidenceCount, equals(0));
    });

    test('2. Mission B evidence correctly affects Mission B mastery - PASS', () {
      final missionB = 'neet_ug_2027';

      final bridgeB = AafPersonalizationBridgeAuthority(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        missionId: missionB,
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: 1,
        publicProjectionId: 'pub1',
        status: AafPublicProjectionStatus.current,
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: now,
        schemaVersion: 2,
      );

      final eventB1 = StudentEvidenceEvent(
        eventId: 'e1',
        studentId: 's1',
        missionId: missionB,
        amtnId: 'amtn1',
        questionId: 'q1',
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: now.subtract(const Duration(minutes: 10)),
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );

      final eventB2 = StudentEvidenceEvent(
        eventId: 'e2',
        studentId: 's1',
        missionId: missionB,
        amtnId: 'amtn1',
        questionId: 'q2',
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: now.subtract(const Duration(minutes: 5)),
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );

      final eventB3 = StudentEvidenceEvent(
        eventId: 'e3',
        studentId: 's1',
        missionId: missionB,
        amtnId: 'amtn1',
        questionId: 'q3',
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: now.subtract(const Duration(minutes: 1)),
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 3,
      );

      final result = loop.run(
        bridge: bridgeB,
        rawEvents: [eventB1, eventB2, eventB3],
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      );

      expect(result.learningState.missionId, equals(missionB));
      expect(result.learningState.masteryConfidence, isNot(equals(StudentLearningStateConfidence.insufficient)));
      expect(result.learningState.totalEligibleEvidenceCount, greaterThan(0));
    });
  });
}
