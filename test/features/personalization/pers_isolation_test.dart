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

void main() {
  group('RELIABILITY FF01: PERS Mission Isolation Tests', () {
    late StudentAutonomousLoopEngine loop;
    final now = DateTime.utc(2026, 8, 18, 12);
    final targetMission = 'jee_main_2027';
    final otherMission = 'neet_ug_2027';

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

    test('1. Events from other missions are excluded from computation - PASS', () {
      final bridge = AafPersonalizationBridgeAuthority(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        missionId: targetMission,
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

      final targetEvent = StudentEvidenceEvent(
        eventId: 'e1',
        studentId: 's1',
        missionId: targetMission,
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

      final otherMissionEvent = StudentEvidenceEvent(
        eventId: 'e2',
        studentId: 's1',
        missionId: otherMission, // LEAKAGE CANDIDATE
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
        bridge: bridge,
        rawEvents: [targetEvent, otherMissionEvent],
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      );

      // Mastery should only count targetEvent
      // totalEligibleEvidenceCount: 1 (mastery) + 1 (retention) + 0 (fluency) = 2
      expect(result.learningState.totalEligibleEvidenceCount, equals(2));
      expect(result.learningState.missionId, equals(targetMission));
    });
  });
}
