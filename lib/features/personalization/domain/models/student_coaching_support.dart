/// Governed coaching support decisions for RankCrackers personalization.
///
/// CODE NO: PERS-COACH-01
///
/// These models can route support, but they cannot create academic truth,
/// diagnose psychology, or write public projections.
library;

import 'aaf_personalization_bridge.dart';

enum StudentCoachingSupportType {
  mentorshipIntervention,
  doubtResolution,
  engagementSupport,
  personalizedPractice,
  analyticsTracking,
  scheduleDiscipline,
}

enum StudentCoachingSupportStatus {
  ready,
  blocked,
}

enum StudentCoachingSupportReason {
  governedTrigger,
  noGovernedTrigger,
  bridgeRejected,
  insufficientEvidence,
  groundedSupportAvailable,
  noGroundedSupportAvailable,
  engagementSignalObserved,
}

enum CoachingInteractionType {
  mentorship,
  doubtSupport,
  personalizedTest,
  personalizedPractice,
  analyticsReview,
  scheduleDiscipline,
  motivationEngagement,
  studyMaterialRouting,
}

enum CoachingSignalSource {
  retries,
  hintUsage,
  completionConsistency,
  confidenceEvidenceMismatch,
  timeOnTask,
  missedSchedules,
  revisionOverdue,
}

final class CoachingTargetSession {
  const CoachingTargetSession({
    required this.sessionId,
    required this.studentId,
    required this.interactionType,
    required this.signalsTriggered,
    required this.metadataMap,
    required this.aafProjectionId,
    required this.aafKnowledgeVersion,
    required this.createdAtUtc,
  });

  final String sessionId;
  final String studentId;
  final CoachingInteractionType interactionType;
  final Set<CoachingSignalSource> signalsTriggered;
  final Map<String, String> metadataMap;
  final String aafProjectionId;
  final int aafKnowledgeVersion;
  final DateTime createdAtUtc;

  void validate() {
    if (sessionId.trim().isEmpty ||
        studentId.trim().isEmpty ||
        aafProjectionId.trim().isEmpty ||
        aafKnowledgeVersion <= 0 ||
        !createdAtUtc.isUtc) {
      throw const FormatException('Invalid coaching session fields.');
    }

    if (signalsTriggered.isEmpty) {
      throw const FormatException(
        'Coaching session requires at least one signal source.',
      );
    }

    // Safety Invariant: PERS_CAN_CREATE_ACADEMIC_TRUTH = FALSE
    if (metadataMap.containsKey('generate_academic_content') ||
        metadataMap.containsKey('publish_new_truth')) {
      throw const FormatException(
        'Coaching contract prohibited from creating academic truth.',
      );
    }

    // Safety Invariant: no personality profiling or psychological diagnosis
    for (final key in metadataMap.keys) {
      final value = metadataMap[key]!.toLowerCase();
      final keyLower = key.toLowerCase();
      const forbiddenWords = [
        'personality',
        'psychology',
        'psychological',
        'diagnosis',
        'diagnostic',
        'mental_health',
        'profiling',
      ];
      for (final word in forbiddenWords) {
        if (keyLower.contains(word) || value.contains(word)) {
          throw const FormatException(
            'Safety violation: Personality profiling or psychological diagnosis is strictly prohibited.',
          );
        }
      }
    }
  }

  bool isEligibleForCoaching(AafPersonalizationBridgeAuthority bridge) {
    try {
      bridge.validate();
    } catch (_) {
      return false;
    }

    if (bridge.studentId != studentId ||
        bridge.publicProjectionId != aafProjectionId ||
        bridge.canonicalKnowledgeVersion != aafKnowledgeVersion) {
      throw const FormatException(
        'Bridge mismatch in coaching eligibility check.',
      );
    }

    if (bridge.status == AafPublicProjectionStatus.unverified ||
        bridge.status == AafPublicProjectionStatus.withdrawn ||
        bridge.status == AafPublicProjectionStatus.superseded) {
      return false;
    }
    return true;
  }
}

final class StudentCoachingSupportDecision {
  static const int currentSchemaVersion = 1;

  const StudentCoachingSupportDecision({
    required this.studentId,
    required this.targetAmtnId,
    required this.canonicalSemanticTopicId,
    required this.canonicalKnowledgeVersion,
    required this.publicProjectionId,
    required this.studentStateVersion,
    required this.supportDecisionVersion,
    required this.createdAtUtc,
    required this.type,
    required this.status,
    required this.reasons,
    required this.supportRouteId,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final String canonicalSemanticTopicId;
  final int canonicalKnowledgeVersion;
  final String publicProjectionId;
  final int studentStateVersion;
  final int supportDecisionVersion;
  final DateTime createdAtUtc;
  final StudentCoachingSupportType type;
  final StudentCoachingSupportStatus status;
  final Set<StudentCoachingSupportReason> reasons;
  final String? supportRouteId;
  final int schemaVersion;

  bool get isReady => status == StudentCoachingSupportStatus.ready;

  void validate() {
    _requireNonEmpty(studentId, 'studentId');
    _requireNonEmpty(targetAmtnId, 'targetAmtnId');
    _requireNonEmpty(canonicalSemanticTopicId, 'canonicalSemanticTopicId');
    _requireNonEmpty(publicProjectionId, 'publicProjectionId');

    if (canonicalKnowledgeVersion <= 0) {
      throw const FormatException(
        'canonicalKnowledgeVersion must be positive.',
      );
    }
    if (studentStateVersion <= 0) {
      throw const FormatException('studentStateVersion must be positive.');
    }
    if (supportDecisionVersion <= 0) {
      throw const FormatException(
        'supportDecisionVersion must be positive.',
      );
    }
    if (schemaVersion <= 0) {
      throw const FormatException('schemaVersion must be positive.');
    }
    if (!createdAtUtc.isUtc) {
      throw const FormatException('createdAtUtc must be UTC.');
    }
    if (reasons.isEmpty) {
      throw const FormatException('Coaching support requires a reason.');
    }
    if (status == StudentCoachingSupportStatus.ready) {
      if (supportRouteId == null || supportRouteId!.trim().isEmpty) {
        throw const FormatException(
          'Ready coaching support requires a supportRouteId.',
        );
      }
      if (reasons.contains(StudentCoachingSupportReason.bridgeRejected) ||
          reasons.contains(StudentCoachingSupportReason.noGovernedTrigger) ||
          reasons.contains(StudentCoachingSupportReason.insufficientEvidence) ||
          reasons.contains(
            StudentCoachingSupportReason.noGroundedSupportAvailable,
          )) {
        throw const FormatException(
          'Ready coaching support cannot contain fail-closed reasons.',
        );
      }
    }
  }

  Map<String, Object?> toJson() {
    validate();
    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'studentId': studentId,
      'targetAmtnId': targetAmtnId,
      'canonicalSemanticTopicId': canonicalSemanticTopicId,
      'canonicalKnowledgeVersion': canonicalKnowledgeVersion,
      'publicProjectionId': publicProjectionId,
      'studentStateVersion': studentStateVersion,
      'supportDecisionVersion': supportDecisionVersion,
      'createdAtUtc': createdAtUtc.toIso8601String(),
      'type': type.wireName,
      'status': status.wireName,
      'reasons': reasons.map((reason) => reason.wireName).toList(),
      'supportRouteId': supportRouteId,
    };
  }

  static void _requireNonEmpty(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException('$field must not be empty.');
    }
  }
}

extension StudentCoachingSupportTypeWire on StudentCoachingSupportType {
  String get wireName {
    switch (this) {
      case StudentCoachingSupportType.mentorshipIntervention:
        return 'mentorship_intervention';
      case StudentCoachingSupportType.doubtResolution:
        return 'doubt_resolution';
      case StudentCoachingSupportType.engagementSupport:
        return 'engagement_support';
      case StudentCoachingSupportType.personalizedPractice:
        return 'personalized_practice';
      case StudentCoachingSupportType.analyticsTracking:
        return 'analytics_tracking';
      case StudentCoachingSupportType.scheduleDiscipline:
        return 'schedule_discipline';
    }
  }
}

extension StudentCoachingSupportStatusWire on StudentCoachingSupportStatus {
  String get wireName {
    switch (this) {
      case StudentCoachingSupportStatus.ready:
        return 'ready';
      case StudentCoachingSupportStatus.blocked:
        return 'blocked';
    }
  }
}

extension StudentCoachingSupportReasonWire on StudentCoachingSupportReason {
  String get wireName {
    switch (this) {
      case StudentCoachingSupportReason.governedTrigger:
        return 'governed_trigger';
      case StudentCoachingSupportReason.noGovernedTrigger:
        return 'no_governed_trigger';
      case StudentCoachingSupportReason.bridgeRejected:
        return 'bridge_rejected';
      case StudentCoachingSupportReason.insufficientEvidence:
        return 'insufficient_evidence';
      case StudentCoachingSupportReason.groundedSupportAvailable:
        return 'grounded_support_available';
      case StudentCoachingSupportReason.noGroundedSupportAvailable:
        return 'no_grounded_support_available';
      case StudentCoachingSupportReason.engagementSignalObserved:
        return 'engagement_signal_observed';
    }
  }
}
