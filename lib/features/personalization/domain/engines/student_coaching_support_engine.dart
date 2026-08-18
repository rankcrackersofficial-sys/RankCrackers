/// Deterministic coaching-support router for governed student state.
library;

import '../models/aaf_personalization_bridge.dart';
import '../models/student_coaching_support.dart';
import '../models/student_learning_state.dart';
import '../models/student_treatment_decision.dart';

final class StudentCoachingSupportEngine {
  const StudentCoachingSupportEngine();

  StudentCoachingSupportDecision mentorship({
    required AafPersonalizationBridgeAuthority bridge,
    required StudentLearningState state,
    required StudentTreatmentDecision treatmentDecision,
    required DateTime nowUtc,
  }) {
    final bridgeFailure = _bridgeFailure(bridge);
    if (bridgeFailure != null) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        type: StudentCoachingSupportType.mentorshipIntervention,
        reasons: <StudentCoachingSupportReason>{bridgeFailure},
      );
    }

    state.validate();
    treatmentDecision.validate();
    _requireSameStudentAndTarget(bridge, state, treatmentDecision);

    final hasMentorTrigger = treatmentDecision.directives.any(
      (directive) => directive.type == StudentTreatmentType.mentorReview,
    );

    if (!hasMentorTrigger) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        type: StudentCoachingSupportType.mentorshipIntervention,
        reasons: const <StudentCoachingSupportReason>{
          StudentCoachingSupportReason.noGovernedTrigger,
        },
      );
    }

    return _ready(
      bridge: bridge,
      nowUtc: nowUtc,
      type: StudentCoachingSupportType.mentorshipIntervention,
      supportRouteId: 'mentor:${bridge.publicProjectionId}',
      reasons: const <StudentCoachingSupportReason>{
        StudentCoachingSupportReason.governedTrigger,
      },
    );
  }

  StudentCoachingSupportDecision doubtResolution({
    required AafPersonalizationBridgeAuthority bridge,
    required StudentLearningState state,
    required DateTime nowUtc,
    required List<String> groundedSupportRouteIds,
  }) {
    final bridgeFailure = _bridgeFailure(bridge);
    if (bridgeFailure != null) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        type: StudentCoachingSupportType.doubtResolution,
        reasons: <StudentCoachingSupportReason>{bridgeFailure},
      );
    }

    state.validate();
    _requireSameStudentAndTarget(bridge, state, null);

    final routes = groundedSupportRouteIds
        .where((routeId) => routeId.trim().isNotEmpty)
        .toList(growable: false);

    if (routes.isEmpty) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        type: StudentCoachingSupportType.doubtResolution,
        reasons: const <StudentCoachingSupportReason>{
          StudentCoachingSupportReason.noGroundedSupportAvailable,
        },
      );
    }

    return _ready(
      bridge: bridge,
      nowUtc: nowUtc,
      type: StudentCoachingSupportType.doubtResolution,
      supportRouteId: routes.first,
      reasons: const <StudentCoachingSupportReason>{
        StudentCoachingSupportReason.groundedSupportAvailable,
      },
    );
  }

  StudentCoachingSupportDecision engagementSupport({
    required AafPersonalizationBridgeAuthority bridge,
    required StudentLearningState state,
    required DateTime nowUtc,
  }) {
    final bridgeFailure = _bridgeFailure(bridge);
    if (bridgeFailure != null) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        type: StudentCoachingSupportType.engagementSupport,
        reasons: <StudentCoachingSupportReason>{bridgeFailure},
      );
    }

    state.validate();
    _requireSameStudentAndTarget(bridge, state, null);

    final needsSupport = state.totalEligibleEvidenceCount == 0 ||
        state.hasAnyInsufficientDimension ||
        (state.retryRate ?? 0) >= 0.5 ||
        (state.hintDependencyRate ?? 0) >= 0.5;

    if (!needsSupport) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        type: StudentCoachingSupportType.engagementSupport,
        reasons: const <StudentCoachingSupportReason>{
          StudentCoachingSupportReason.noGovernedTrigger,
        },
      );
    }

    return _ready(
      bridge: bridge,
      nowUtc: nowUtc,
      type: StudentCoachingSupportType.engagementSupport,
      supportRouteId: 'engagement:${bridge.publicProjectionId}',
      reasons: const <StudentCoachingSupportReason>{
        StudentCoachingSupportReason.engagementSignalObserved,
      },
    );
  }

  StudentCoachingSupportReason? _bridgeFailure(
    AafPersonalizationBridgeAuthority bridge,
  ) {
    try {
      bridge.validate();
      return null;
    } on FormatException {
      return StudentCoachingSupportReason.bridgeRejected;
    }
  }

  void _requireSameStudentAndTarget(
    AafPersonalizationBridgeAuthority bridge,
    StudentLearningState state,
    StudentTreatmentDecision? treatmentDecision,
  ) {
    if (bridge.studentId != state.studentId ||
        bridge.targetAmtnId != state.amtnId) {
      throw const FormatException(
          'Bridge and student state identity mismatch.');
    }
    if (treatmentDecision == null) {
      return;
    }
    if (bridge.studentId != treatmentDecision.studentId ||
        bridge.targetAmtnId != treatmentDecision.targetAmtnId) {
      throw const FormatException(
        'Bridge and treatment decision identity mismatch.',
      );
    }
  }

  StudentCoachingSupportDecision _ready({
    required AafPersonalizationBridgeAuthority bridge,
    required DateTime nowUtc,
    required StudentCoachingSupportType type,
    required String supportRouteId,
    required Set<StudentCoachingSupportReason> reasons,
  }) {
    return _decision(
      bridge: bridge,
      nowUtc: nowUtc,
      type: type,
      status: StudentCoachingSupportStatus.ready,
      supportRouteId: supportRouteId,
      reasons: reasons,
    );
  }

  StudentCoachingSupportDecision _blocked({
    required AafPersonalizationBridgeAuthority bridge,
    required DateTime nowUtc,
    required StudentCoachingSupportType type,
    required Set<StudentCoachingSupportReason> reasons,
  }) {
    return _decision(
      bridge: bridge,
      nowUtc: nowUtc,
      type: type,
      status: StudentCoachingSupportStatus.blocked,
      supportRouteId: null,
      reasons: reasons,
    );
  }

  StudentCoachingSupportDecision _decision({
    required AafPersonalizationBridgeAuthority bridge,
    required DateTime nowUtc,
    required StudentCoachingSupportType type,
    required StudentCoachingSupportStatus status,
    required String? supportRouteId,
    required Set<StudentCoachingSupportReason> reasons,
  }) {
    if (!nowUtc.isUtc) {
      throw const FormatException('nowUtc must be UTC.');
    }
    final decision = StudentCoachingSupportDecision(
      studentId: bridge.studentId,
      targetAmtnId: bridge.targetAmtnId,
      canonicalSemanticTopicId: bridge.canonicalSemanticTopicId,
      canonicalKnowledgeVersion: bridge.canonicalKnowledgeVersion,
      publicProjectionId: bridge.publicProjectionId,
      studentStateVersion: bridge.studentStateVersion,
      supportDecisionVersion:
          StudentCoachingSupportDecision.currentSchemaVersion,
      createdAtUtc: nowUtc,
      type: type,
      status: status,
      reasons: reasons,
      supportRouteId: supportRouteId,
      schemaVersion: StudentCoachingSupportDecision.currentSchemaVersion,
    );
    decision.validate();
    return decision;
  }
}
