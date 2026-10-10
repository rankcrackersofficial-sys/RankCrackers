import '../../personalization/domain/engines/student_autonomous_loop_engine.dart';
import '../../personalization/domain/engines/student_mastery_engine.dart';
import '../../personalization/domain/engines/student_retention_engine.dart';
import '../../personalization/domain/engines/student_fluency_engine.dart';
import '../../personalization/domain/engines/student_prerequisite_state_engine.dart';
import '../../personalization/domain/engines/student_learning_state_engine.dart';
import '../../personalization/domain/engines/student_treatment_decision_engine.dart';
import '../../personalization/domain/engines/syllabus_personalization_route_engine.dart';
import '../../personalization/domain/engines/digibook_personalization_route_engine.dart';
import '../../personalization/domain/engines/crucible_personalization_blueprint_engine.dart';
import '../../personalization/domain/engines/student_revision_queue_engine.dart';
import '../../personalization/domain/engines/student_revision_closed_loop_engine.dart';
import '../../personalization/domain/engines/student_coaching_support_engine.dart';
import '../../personalization/domain/models/aaf_personalization_bridge.dart';
import '../../personalization/domain/models/student_evidence_event.dart';
import '../../personalization/domain/models/student_learning_state.dart';

final class AutonomousSyllabusPipeline {
  const AutonomousSyllabusPipeline({
    this.loopEngine = const StudentAutonomousLoopEngine(
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
    ),
  });

  final StudentAutonomousLoopEngine loopEngine;

  StudentAutonomousLoopResult process({
    required AafPersonalizationBridgeAuthority bridge,
    required List<StudentEvidenceEvent> events,
    required Map<String, StudentLearningState> prerequisiteStates,
    required List<StudentRevisionCandidate> revisionCandidates,
    required DateTime nowUtc,
  }) {
    return loopEngine.run(
      bridge: bridge,
      rawEvents: events,
      prerequisiteStates: prerequisiteStates,
      revisionCandidates: revisionCandidates,
      nowUtc: nowUtc,
    );
  }
}
