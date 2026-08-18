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
import 'package:rank_crackers/features/personalization/domain/models/student_evidence_event.dart';

void main() {
  group('PERS-RUNTIME-01A Autonomous Loop Attack Suite', () {
    const loop = StudentAutonomousLoopEngine(
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

    final now = DateTime.utc(2026, 8, 18);

    AafPersonalizationBridgeAuthority validBridge() => AafPersonalizationBridgeAuthority(
      studentId: 'student_1',
      targetAmtnId: 'amtn_1',
      canonicalSemanticTopicId: 'topic_1',
      canonicalKnowledgeVersion: 1,
      publicProjectionId: 'pub_1',
      status: AafPublicProjectionStatus.current,
      studentStateVersion: 1,
      treatmentDecisionVersion: 1,
      routeVersion: 1,
      createdAtUtc: now,
      schemaVersion: 1,
    );

    test('Identity Isolation: Events from another student are ignored - PASS', () {
      final bridge = validBridge();
      final alienEvent = StudentEvidenceEvent(
        eventId: 'e1',
        studentId: 'student_2', // Alien
        amtnId: 'amtn_1',
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: now,
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 2,
      );

      final result = loop.run(
        bridge: bridge,
        rawEvents: [alienEvent],
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      );

      // Mastery should be insufficient because the alien event was filtered out
      expect(result.learningState.masteryConfidence, StudentLearningStateConfidence.insufficient);
      expect(result.learningState.totalEligibleEvidenceCount, 0);
    });

    test('Identity Isolation: Events from another AMTN are ignored - PASS', () {
      final bridge = validBridge();
      final alienEvent = StudentEvidenceEvent(
        eventId: 'e1',
        studentId: 'student_1',
        amtnId: 'amtn_alien', // Alien
        source: StudentEvidenceSource.practice,
        action: StudentEvidenceAction.answerSubmitted,
        occurredAtUtc: now,
        sourceConfidence: StudentEvidenceConfidence.high,
        difficulty: StudentEvidenceDifficulty.medium,
        answerOutcome: StudentAnswerOutcome.correct,
        schemaVersion: 2,
      );

      final result = loop.run(
        bridge: bridge,
        rawEvents: [alienEvent],
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      );

      expect(result.learningState.totalEligibleEvidenceCount, 0);
    });

    test('Content Eligibility: Superseded AAF projection blocks loop - FAIL CLOSED', () {
      final bridge = AafPersonalizationBridgeAuthority(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: 1,
        publicProjectionId: 'pub1',
        status: AafPublicProjectionStatus.superseded, // Invalid
        studentStateVersion: 1,
        treatmentDecisionVersion: 1,
        routeVersion: 1,
        createdAtUtc: now,
        schemaVersion: 1,
      );

      expect(() => loop.run(
        bridge: bridge,
        rawEvents: [],
        prerequisiteStates: {},
        revisionCandidates: [],
        nowUtc: now,
      ), throwsFormatException);
    });

    test('Identity Integrity: Prerequisite state mismatch triggers FormatException - FAIL CLOSED', () {
      final bridge = validBridge();
      final alienState = StudentLearningState(
        studentId: 'student_alien', // Mismatch
        amtnId: 'prereq_1',
        calculatedAtUtc: now,
        masteryProbability: 0.8,
        masteryBand: StudentMasteryBand.proficient,
        masteryConfidence: StudentLearningStateConfidence.high,
        retentionProbability: 0.8,
        retentionState: StudentRetentionState.stable,
        retentionConfidence: StudentLearningStateConfidence.high,
        fluencyScore: 0.8,
        fluencyPattern: StudentFluencyPattern.balanced,
        fluencyConfidence: StudentLearningStateConfidence.high,
        prerequisiteReadiness: StudentPrerequisiteReadiness.ready,
        prerequisiteConfidence: StudentLearningStateConfidence.high,
        hintDependencyRate: 0,
        explanationDependencyRate: 0,
        retryRate: 0,
        answerChangeRate: 0,
        totalEligibleEvidenceCount: 10,
        schemaVersion: 2,
      );

      expect(() => loop.run(
        bridge: bridge,
        rawEvents: [],
        prerequisiteStates: {'prereq_1': alienState},
        revisionCandidates: [],
        nowUtc: now,
      ), throwsFormatException);
    });
  });
}
