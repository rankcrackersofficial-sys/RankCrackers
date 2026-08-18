import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';

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
      throw const FormatException('Coaching session requires at least one signal source.');
    }

    // Safety Invariant: PERS_CAN_CREATE_ACADEMIC_TRUTH = FALSE
    // Coaching session must not generate content parameters itself
    if (metadataMap.containsKey('generate_academic_content') ||
        metadataMap.containsKey('publish_new_truth')) {
      throw const FormatException('Coaching contract prohibited from creating academic truth.');
    }

    // Safety Invariant: no personality profiling or psychological diagnosis
    for (final key in metadataMap.keys) {
      final value = metadataMap[key]!.toLowerCase();
      final keyLower = key.toLowerCase();
      final forbiddenWords = [
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
      // If validation fails (e.g. unverified/withdrawn/superseded), then the student is NOT eligible
      return false;
    }

    if (bridge.studentId != studentId ||
        bridge.publicProjectionId != aafProjectionId ||
        bridge.canonicalKnowledgeVersion != aafKnowledgeVersion) {
      throw const FormatException('Bridge mismatch in coaching eligibility check.');
    }

    if (bridge.status == AafPublicProjectionStatus.unverified ||
        bridge.status == AafPublicProjectionStatus.withdrawn ||
        bridge.status == AafPublicProjectionStatus.superseded) {
      return false;
    }
    return true;
  }
}
