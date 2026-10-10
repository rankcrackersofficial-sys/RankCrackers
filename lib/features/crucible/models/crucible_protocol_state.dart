import 'package:equatable/equatable.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// CRUCIBLE PROTOCOL STATE
/// Tracks the warrior's position in the 100-Day Protocol.
class CrucibleProtocolState extends Equatable {
  final String recruitmentId;
  final int phaseIndex; // 1-7
  final int scheduleIndex; // 1-42
  final String currentScheduleId; // ADDED: Specific session identifier
  final String status; // study, rebuild, micro_test, macro_test, major_test
  final DateTime scheduleStartTime;
  final DateTime protocolStartTime;
  final DateTime currentBoundaryTime;
  final DateTime? lastProgressAt; // ADDED: Stall detection anchor
  final bool isVIP;
  final bool isStalled;
  final bool isPaused; // ADDED: Pause tracking flag
  final DateTime? pausedAt; // ADDED: When the pause started
  final int pausedDurationMs; // ADDED: Accumulated pause duration in milliseconds

  const CrucibleProtocolState({
    required this.recruitmentId,
    required this.phaseIndex,
    required this.scheduleIndex,
    required this.currentScheduleId,
    required this.status,
    required this.scheduleStartTime,
    required this.protocolStartTime,
    required this.currentBoundaryTime,
    this.lastProgressAt,
    required this.isVIP,
    required this.isStalled,
    this.isPaused = false,
    this.pausedAt,
    this.pausedDurationMs = 0,
  });

  CrucibleProtocolState copyWith({
    String? recruitmentId,
    int? phaseIndex,
    int? scheduleIndex,
    String? currentScheduleId,
    String? status,
    DateTime? scheduleStartTime,
    DateTime? protocolStartTime,
    DateTime? currentBoundaryTime,
    DateTime? lastProgressAt,
    bool? isVIP,
    bool? isStalled,
    bool? isPaused,
    DateTime? pausedAt,
    bool clearPausedAt = false,
    int? pausedDurationMs,
  }) {
    return CrucibleProtocolState(
      recruitmentId: recruitmentId ?? this.recruitmentId,
      phaseIndex: phaseIndex ?? this.phaseIndex,
      scheduleIndex: scheduleIndex ?? this.scheduleIndex,
      currentScheduleId: currentScheduleId ?? this.currentScheduleId,
      status: status ?? this.status,
      scheduleStartTime: scheduleStartTime ?? this.scheduleStartTime,
      protocolStartTime: protocolStartTime ?? this.protocolStartTime,
      currentBoundaryTime: currentBoundaryTime ?? this.currentBoundaryTime,
      lastProgressAt: lastProgressAt ?? this.lastProgressAt,
      isVIP: isVIP ?? this.isVIP,
      isStalled: isStalled ?? this.isStalled,
      isPaused: isPaused ?? this.isPaused,
      pausedAt: clearPausedAt ? null : (pausedAt ?? this.pausedAt),
      pausedDurationMs: pausedDurationMs ?? this.pausedDurationMs,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'recruitmentId': recruitmentId,
      'phaseIndex': phaseIndex,
      'scheduleIndex': scheduleIndex,
      'currentScheduleId': currentScheduleId,
      'status': status,
      'scheduleStartTime': scheduleStartTime.millisecondsSinceEpoch,
      'protocolStartTime': protocolStartTime.millisecondsSinceEpoch,
      'currentBoundaryTime': currentBoundaryTime.millisecondsSinceEpoch,
      'lastProgressAt': lastProgressAt?.millisecondsSinceEpoch,
      'isVIP': isVIP,
      'isStalled': isStalled,
      'isPaused': isPaused,
      'pausedAt': pausedAt?.millisecondsSinceEpoch,
      'pausedDurationMs': pausedDurationMs,
    };
  }

  static DateTime _parseDateTime(dynamic val) {
    if (val == null) return DateTime.fromMillisecondsSinceEpoch(0);
    if (val is Timestamp) return val.toDate();
    if (val is DateTime) return val;
    if (val is int) return DateTime.fromMillisecondsSinceEpoch(val);
    if (val is String) {
      return DateTime.tryParse(val) ?? DateTime.fromMillisecondsSinceEpoch(0);
    }
    return DateTime.fromMillisecondsSinceEpoch(0);
  }

  static DateTime? _parseNullableDateTime(dynamic val) {
    if (val == null) return null;
    if (val is Timestamp) return val.toDate();
    if (val is DateTime) return val;
    if (val is int) return DateTime.fromMillisecondsSinceEpoch(val);
    if (val is String) return DateTime.tryParse(val);
    return null;
  }

  factory CrucibleProtocolState.fromMap(Map<String, dynamic> map) {
    return CrucibleProtocolState(
      recruitmentId: map['recruitmentId'] ?? '',
      phaseIndex: map['phaseIndex'] ?? 1,
      scheduleIndex: map['scheduleIndex'] ?? 1,
      currentScheduleId: map['currentScheduleId'] ?? '',
      status: map['status'] ?? 'study',
      scheduleStartTime: _parseDateTime(map['scheduleStartTime']),
      protocolStartTime: _parseDateTime(map['protocolStartTime']),
      currentBoundaryTime: _parseDateTime(map['currentBoundaryTime']),
      lastProgressAt: _parseNullableDateTime(map['lastProgressAt']),
      isVIP: map['isVIP'] ?? false,
      isStalled: map['isStalled'] ?? false,
      isPaused: map['isPaused'] ?? false,
      pausedAt: _parseNullableDateTime(map['pausedAt']),
      pausedDurationMs: map['pausedDurationMs'] ?? 0,
    );
  }

  @override
  List<Object?> get props => [
    recruitmentId,
    phaseIndex,
    scheduleIndex,
    currentScheduleId,
    status,
    scheduleStartTime,
    protocolStartTime,
    currentBoundaryTime,
    lastProgressAt,
    isVIP,
    isStalled,
    isPaused,
    pausedAt,
    pausedDurationMs,
  ];
}
