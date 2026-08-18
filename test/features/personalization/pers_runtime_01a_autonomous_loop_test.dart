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
import 'package:rank_crackers/features/personalization/domain/engines/student_coaching_support_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_learning_state.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

void main() {
  group('PERS-RUNTIME-01A StudentAutonomousLoopEngine Tests', () {
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

    test('1. Full loop execution with real engines - PASS', () {
      final bridge = AafPersonalizationBridgeAuthority(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: 1,
        publicProjectionId: 'pub1',
        status: AafPublicProjectionStatus.current,
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: now,
        schemaVersion: 1,
      );

      // Execute Loop with real engines
      final result = loop.run(
        bridge: bridge,
        rawEvents: [], // No events means insufficient evidence -> gather evidence/maintain
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      );

      expect(result.learningState.studentId, equals('s1'));
      expect(result.learningState.masteryConfidence,
          equals(StudentLearningStateConfidence.insufficient));
      expect(
          result.treatmentDecision.directives.any((d) =>
              d.type == StudentTreatmentType.maintain ||
              d.type == StudentTreatmentType.gatherEvidence),
          isTrue);
      expect(result.syllabusRoute.studentId, equals('s1'));
      expect(result.digibookRoute.steps.isNotEmpty, isTrue);
      expect(result.coachingDecisions.length, equals(6));
    });

    test('2. Attack: Bridge rejection blocks loop - FAIL CLOSED', () {
      final bridge = AafPersonalizationBridgeAuthority(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: 1,
        publicProjectionId: 'pub1',
        status: AafPublicProjectionStatus.withdrawn, // Invalid status
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: now,
        schemaVersion: 1,
      );

      expect(
          () => loop.run(
                bridge: bridge,
                rawEvents: [],
                prerequisiteStates: {},
                revisionCandidates: [],
                nowUtc: now,
              ),
          throwsFormatException);
    });
  });
}
