/// UTC-safe schedule support derived from governed learning state.
library;

import '../models/aaf_personalization_bridge.dart';
import '../models/student_learning_state.dart';
import '../models/student_schedule_support.dart';

final class StudentScheduleSupportEngine {
  const StudentScheduleSupportEngine();

  StudentScheduleSupport schedule({
    required AafPersonalizationBridgeAuthority bridge,
    required StudentLearningState state,
    required DateTime nowUtc,
  }) {
    if (!nowUtc.isUtc) {
      throw const FormatException('nowUtc must be UTC.');
    }

    try {
      bridge.validate();
    } on FormatException {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        reason: StudentScheduleSupportReason.bridgeRejected,
      );
    }

    state.validate();
    if (bridge.studentId != state.studentId ||
        bridge.targetAmtnId != state.amtnId) {
      throw const FormatException(
          'Bridge and student state identity mismatch.');
    }

    if (state.totalEligibleEvidenceCount == 0) {
      return _blocked(
        bridge: bridge,
        nowUtc: nowUtc,
        reason: StudentScheduleSupportReason.insufficientEvidence,
      );
    }

    final interval = _intervalFor(state.retentionState);
    final support = StudentScheduleSupport(
      studentId: bridge.studentId,
      targetAmtnId: bridge.targetAmtnId,
      publicProjectionId: bridge.publicProjectionId,
      createdAtUtc: nowUtc,
      nextActionAtUtc: nowUtc.add(interval),
      status: StudentScheduleSupportStatus.scheduled,
      reason: StudentScheduleSupportReason.governedIntervalSelected,
      schemaVersion: StudentScheduleSupport.currentSchemaVersion,
    );
    support.validate();
    return support;
  }

  Duration _intervalFor(StudentRetentionState retentionState) {
    switch (retentionState) {
      case StudentRetentionState.fragile:
        return const Duration(hours: 12);
      case StudentRetentionState.unstable:
        return const Duration(days: 1);
      case StudentRetentionState.stable:
        return const Duration(days: 3);
      case StudentRetentionState.strong:
        return const Duration(days: 7);
      case StudentRetentionState.unknown:
        return const Duration(days: 1);
    }
  }

  StudentScheduleSupport _blocked({
    required AafPersonalizationBridgeAuthority bridge,
    required DateTime nowUtc,
    required StudentScheduleSupportReason reason,
  }) {
    final support = StudentScheduleSupport(
      studentId: bridge.studentId,
      targetAmtnId: bridge.targetAmtnId,
      publicProjectionId: bridge.publicProjectionId,
      createdAtUtc: nowUtc,
      nextActionAtUtc: null,
      status: StudentScheduleSupportStatus.blocked,
      reason: reason,
      schemaVersion: StudentScheduleSupport.currentSchemaVersion,
    );
    support.validate();
    return support;
  }
}
