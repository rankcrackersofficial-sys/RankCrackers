/// RankCrackers governed Syllabus Personalization Route Contract.
/// CODE NO: PERS-13-R2
library;

enum SyllabusPersonalizationNodeState {
  prerequisiteRepair,
  currentTarget,
  reinforcement,
  reviewDue,
  masteredMaintenance,
}

enum SyllabusPersonalizationPriority { blocking, high, normal, low }

final class SyllabusPersonalizationNodeRoute {
  const SyllabusPersonalizationNodeRoute({
    required this.amtnId,
    required this.state,
    required this.priority,
    required this.sequenceRank,
    required this.requiredBeforeTarget,
    this.parentSyllabusNodeId,
    this.targetReturnAmtnId,
    this.reviewDueAtUtc,
  });

  final String amtnId;
  final String? parentSyllabusNodeId;
  final SyllabusPersonalizationNodeState state;
  final SyllabusPersonalizationPriority priority;
  final int sequenceRank;
  final bool requiredBeforeTarget;
  final String? targetReturnAmtnId;
  final DateTime? reviewDueAtUtc;

  void validate() {
    if (amtnId.trim().isEmpty || sequenceRank <= 0) {
      throw const FormatException('Invalid syllabus route node.');
    }
    if (reviewDueAtUtc != null && !reviewDueAtUtc!.isUtc) {
      throw const FormatException('reviewDueAtUtc must be UTC.');
    }
  }
}

final class SyllabusPersonalizationRoute {
  static const int currentSchemaVersion = 3;

  const SyllabusPersonalizationRoute({
    required this.studentId,
    required this.missionId,
    required this.examId,
    required this.createdAtUtc,
    required this.currentTargetAmtnId,
    required this.orderedNodes,
    required this.schemaVersion,
  });

  final String studentId;
  final String missionId;
  final String examId;
  final DateTime createdAtUtc;
  final String currentTargetAmtnId;
  final List<SyllabusPersonalizationNodeRoute> orderedNodes;
  final int schemaVersion;

  void validate() {
    if (studentId.trim().isEmpty ||
        missionId.trim().isEmpty ||
        examId.trim().isEmpty ||
        currentTargetAmtnId.trim().isEmpty ||
        !createdAtUtc.isUtc ||
        schemaVersion <= 0 ||
        orderedNodes.isEmpty) {
      throw const FormatException('Invalid syllabus personalization route.');
    }
    final ranks = <int>{};
    for (final n in orderedNodes) {
      n.validate();
      if (!ranks.add(n.sequenceRank)) {
        throw const FormatException('Duplicate sequence rank.');
      }
    }
    final sorted = [...ranks]..sort();
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i] != i + 1) {
        throw const FormatException('Sequence rank must be contiguous.');
      }
    }
  }
}
