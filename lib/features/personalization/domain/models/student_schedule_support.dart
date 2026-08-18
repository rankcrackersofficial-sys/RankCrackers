/// Deterministic UTC-safe schedule and discipline support.
library;

enum StudentScheduleSupportStatus {
  scheduled,
  blocked,
}

enum StudentScheduleSupportReason {
  governedIntervalSelected,
  insufficientEvidence,
  bridgeRejected,
}

final class StudentScheduleSupport {
  static const int currentSchemaVersion = 1;

  const StudentScheduleSupport({
    required this.studentId,
    required this.targetAmtnId,
    required this.publicProjectionId,
    required this.createdAtUtc,
    required this.nextActionAtUtc,
    required this.status,
    required this.reason,
    required this.schemaVersion,
  });

  final String studentId;
  final String targetAmtnId;
  final String publicProjectionId;
  final DateTime createdAtUtc;
  final DateTime? nextActionAtUtc;
  final StudentScheduleSupportStatus status;
  final StudentScheduleSupportReason reason;
  final int schemaVersion;

  void validate() {
    if (studentId.trim().isEmpty ||
        targetAmtnId.trim().isEmpty ||
        publicProjectionId.trim().isEmpty) {
      throw const FormatException(
          'Schedule support identity must not be empty.');
    }
    if (!createdAtUtc.isUtc) {
      throw const FormatException('createdAtUtc must be UTC.');
    }
    if (nextActionAtUtc != null && !nextActionAtUtc!.isUtc) {
      throw const FormatException('nextActionAtUtc must be UTC.');
    }
    if (schemaVersion <= 0) {
      throw const FormatException('schemaVersion must be positive.');
    }
    if (status == StudentScheduleSupportStatus.scheduled) {
      if (nextActionAtUtc == null || !nextActionAtUtc!.isAfter(createdAtUtc)) {
        throw const FormatException(
          'Scheduled support requires a future UTC nextActionAtUtc.',
        );
      }
    }
  }
}
