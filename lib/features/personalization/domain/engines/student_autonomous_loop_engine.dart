/// Central orchestrator for the RankCrackers Autonomous Personalized Student Loop.
///
/// This engine binds the AAF bridge authority to the runtime and manages the
/// transition from evidence events to personalized routes across all surfaces.
library;

import '../models/aaf_personalization_bridge.dart';
import '../models/student_evidence_event.dart';
import '../models/student_learning_state.dart';
import '../models/student_treatment_decision.dart';
import '../models/syllabus_personalization_route.dart';
import '../models/digibook_personalization_route.dart';
import '../models/crucible_personalization_blueprint.dart';
import '../models/student_revision_queue.dart';
import '../models/student_coaching_support.dart';

import 'student_mastery_engine.dart';
import 'student_retention_engine.dart';
import 'student_fluency_engine.dart';
import 'student_prerequisite_state_engine.dart';
import 'student_learning_state_engine.dart';
import 'student_treatment_decision_engine.dart';
import 'syllabus_personalization_route_engine.dart';
import 'digibook_personalization_route_engine.dart';
import 'crucible_personalization_blueprint_engine.dart';
import 'student_revision_queue_engine.dart';
import 'student_revision_closed_loop_engine.dart';
import 'student_coaching_support_engine.dart';

final class StudentAutonomousLoopResult {
  const StudentAutonomousLoopResult({
    required this.learningState,
    required this.treatmentDecision,
    required this.syllabusRoute,
    required this.digibookRoute,
    required this.crucibleBlueprint,
    required this.revisionQueue,
    required this.coachingDecisions,
  });

  final StudentLearningState learningState;
  final StudentTreatmentDecision treatmentDecision;
  final SyllabusPersonalizationRoute syllabusRoute;
  final DigiBookPersonalizationRoute digibookRoute;
  final CruciblePersonalizationBlueprint crucibleBlueprint;
  final StudentRevisionQueue revisionQueue;
  final List<StudentCoachingSupportDecision> coachingDecisions;
}

final class StudentAutonomousLoopEngine {
  const StudentAutonomousLoopEngine({
    required this.masteryEngine,
    required this.retentionEngine,
    required this.fluencyEngine,
    required this.prerequisiteEngine,
    required this.learningStateEngine,
    required this.treatmentEngine,
    required this.syllabusEngine,
    required this.digibookEngine,
    required this.crucibleEngine,
    required this.revisionEngine,
    required this.revisionClosedLoopEngine,
    required this.coachingEngine,
  });

  final StudentMasteryEngine masteryEngine;
  final StudentRetentionEngine retentionEngine;
  final StudentFluencyEngine fluencyEngine;
  final StudentPrerequisiteStateEngine prerequisiteEngine;
  final StudentLearningStateEngine learningStateEngine;
  final StudentTreatmentDecisionEngine treatmentEngine;
  final SyllabusPersonalizationRouteEngine syllabusEngine;
  final DigiBookPersonalizationRouteEngine digibookEngine;
  final CruciblePersonalizationBlueprintEngine crucibleEngine;
  final StudentRevisionQueueEngine revisionEngine;
  final StudentRevisionClosedLoopEngine revisionClosedLoopEngine;
  final StudentCoachingSupportEngine coachingEngine;

  StudentAutonomousLoopResult run({
    required AafPersonalizationBridgeAuthority bridge,
    required List<StudentEvidenceEvent> rawEvents,
    required Map<String, StudentLearningState> prerequisiteStates,
    required List<StudentRevisionCandidate> revisionCandidates,
    required DateTime nowUtc,
    List<String> groundedSupportRouteIds = const [],
    bool hasMissedSchedules = false,
  }) {
    if (!nowUtc.isUtc) {
      throw const FormatException('nowUtc must be UTC.');
    }

    // 1. Validate Bridge Authority
    bridge.validate();

    // 2. Filter events for target identity and deduplicate by eventId
    final seenEventIds = <String>{};
    final uniqueEvents = <StudentEvidenceEvent>[];
    for (final e in rawEvents) {
      if (e.studentId == bridge.studentId &&
          e.missionId == bridge.missionId &&
          e.amtnId == bridge.targetAmtnId) {
        if (seenEventIds.add(e.eventId)) {
          uniqueEvents.add(e);
        }
      }
    }
    final targetEvents = uniqueEvents;

    // 3. Calculate Core Learning State Dimensions

    // 3. Calculate Core Learning State Dimensions
    final mastery = masteryEngine.calculate(
      studentId: bridge.studentId,
      amtnId: bridge.targetAmtnId,
      missionId: bridge.missionId,
      calculatedAtUtc: nowUtc,
      events: targetEvents,
    );

    final retention = retentionEngine.calculate(
      studentId: bridge.studentId,
      amtnId: bridge.targetAmtnId,
      missionId: bridge.missionId,
      calculatedAtUtc: nowUtc,
      events: targetEvents,
    );

    final fluency = fluencyEngine.calculate(
      studentId: bridge.studentId,
      amtnId: bridge.targetAmtnId,
      missionId: bridge.missionId,
      calculatedAtUtc: nowUtc,
      events: targetEvents,
    );

    final prerequisiteDiagnosis = prerequisiteEngine.diagnose(
      studentId: bridge.studentId,
      targetAmtnId: bridge.targetAmtnId,
      missionId: bridge.missionId,
      calculatedAtUtc: nowUtc,
      prerequisiteStates: prerequisiteStates,
    );

    // 4. Assemble Unified Learning State
    final learningState = learningStateEngine.assemble(
      studentId: bridge.studentId,
      amtnId: bridge.targetAmtnId,
      missionId: bridge.missionId,
      calculatedAtUtc: nowUtc,
      mastery: mastery,
      retention: retention,
      fluency: fluency,
      prerequisiteReadiness: prerequisiteDiagnosis.readiness,
      prerequisiteConfidence: prerequisiteDiagnosis.confidence,
      rawEvents: targetEvents,
    );

    // 5. Derive Treatment Decision
    final treatmentDecision = treatmentEngine.decide(
      state: learningState,
      prerequisite: prerequisiteDiagnosis,
      createdAtUtc: nowUtc,
    );

    // 6. Coordinate Surface Route Updates
    final syllabusRoute = syllabusEngine.build(
      studentId: bridge.studentId,
      examId: bridge.canonicalSemanticTopicId,
      targetAmtnId: bridge.targetAmtnId,
      createdAtUtc: nowUtc,
      decision: treatmentDecision,
    );

    final digibookRoute = digibookEngine.build(
      authority: bridge,
      decision: treatmentDecision,
      createdAtUtc: nowUtc,
    );

    final crucibleBlueprint = crucibleEngine.build(
      decision: treatmentDecision,
      createdAtUtc: nowUtc,
    );

    // 7. Update Revision Queue
    final revisionQueue = revisionEngine.build(
      studentId: bridge.studentId,
      nowUtc: nowUtc,
      candidates: revisionCandidates
          .where((c) => c.state.missionId == bridge.missionId),
    );

    // 8. Generate Coaching Support Decisions
    final coachingDecisions = [
      coachingEngine.mentorship(
        bridge: bridge,
        state: learningState,
        treatmentDecision: treatmentDecision,
        nowUtc: nowUtc,
      ),
      coachingEngine.doubtResolution(
        bridge: bridge,
        state: learningState,
        nowUtc: nowUtc,
        groundedSupportRouteIds: groundedSupportRouteIds,
      ),
      coachingEngine.engagementSupport(
        bridge: bridge,
        state: learningState,
        nowUtc: nowUtc,
      ),
      coachingEngine.personalizedPractice(
        bridge: bridge,
        state: learningState,
        nowUtc: nowUtc,
      ),
      coachingEngine.analyticsTracking(
        bridge: bridge,
        state: learningState,
        nowUtc: nowUtc,
      ),
      coachingEngine.scheduleDiscipline(
        bridge: bridge,
        state: learningState,
        nowUtc: nowUtc,
        hasMissedSchedules: hasMissedSchedules,
      ),
    ];

    return StudentAutonomousLoopResult(
      learningState: learningState,
      treatmentDecision: treatmentDecision,
      syllabusRoute: syllabusRoute,
      digibookRoute: digibookRoute,
      crucibleBlueprint: crucibleBlueprint,
      revisionQueue: revisionQueue,
      coachingDecisions: coachingDecisions,
    );
  }
}
