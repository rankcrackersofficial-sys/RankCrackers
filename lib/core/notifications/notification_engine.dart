import '../models/notification_event.dart';

/// 🔱 NOTIFICATION ENGINE
/// Sovereign authority for tactical communication.
class NotificationEngine {
  // ===================================================
  // ALERT GENERATION 🔱
  // ===================================================

  /// Generates a critical alert for upcoming exam deadlines.
  static NotificationEvent generateExamReminder({
    required String missionId,
    required String recruitmentTitle,
    required int daysRemaining,
  }) {
    return NotificationEvent(
      id: 'alert_exam_${DateTime.now().millisecondsSinceEpoch}',
      missionId: missionId,
      title: 'MISSION DEADLINE APPROACHING 🔱',
      message: '$recruitmentTitle is only $daysRemaining days away. Stabilize your core facts now.',
      timestamp: DateTime.now(),
      type: 'exam_reminder',
      priorityState: daysRemaining <= 7 ? 'critical' : 'high',
      priorityScore: daysRemaining <= 7 ? 0.95 : 0.80,
      context: {'daysRemaining': daysRemaining},
    );
  }

  /// Generates an alert if preparation momentum has stalled.
  static NotificationEvent generateStallAlert({
    required String missionId,
    required int stallDays,
  }) {
    return NotificationEvent(
      id: 'alert_stall_${DateTime.now().millisecondsSinceEpoch}',
      missionId: missionId,
      title: 'PREPARATION STALL DETECTED ⚠️',
      message: 'No progress recorded in $stallDays days. The 100-Day Protocol is at risk.',
      timestamp: DateTime.now(),
      type: 'stall',
      priorityState: 'high',
      priorityScore: 0.85,
      context: {'stallDays': stallDays},
    );
  }

  /// Generates an alert for critical rebuild zones.
  static NotificationEvent generateRebuildAlert({
    required String missionId,
    required int weakNodeCount,
  }) {
    return NotificationEvent(
      id: 'alert_rebuild_${DateTime.now().millisecondsSinceEpoch}',
      missionId: missionId,
      title: 'SYSTEMIC WEAKNESS ALERT 🔴',
      message: '$weakNodeCount topics have fallen below secure mastery. Enter the Rebuild Zone.',
      timestamp: DateTime.now(),
      type: 'rebuild',
      priorityState: 'high',
      priorityScore: 0.75,
      context: {'weakNodeCount': weakNodeCount},
    );
  }

  /// Generates an alert for crucible phase transitions.
  static NotificationEvent generatePhaseTransition({
    required String missionId,
    required int newPhase,
  }) {
    return NotificationEvent(
      id: 'alert_phase_${DateTime.now().millisecondsSinceEpoch}',
      missionId: missionId,
      title: 'CRUCIBLE PHASE ASCENSION 🔱',
      message: 'You have entered Phase $newPhase. Tactical complexity has increased.',
      timestamp: DateTime.now(),
      type: 'crucible_phase',
      priorityState: 'medium',
      priorityScore: 0.50,
      context: {'phase': newPhase},
    );
  }
}
