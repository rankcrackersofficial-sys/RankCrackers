import 'package:equatable/equatable.dart';

/// TELEMETRY RECORD (v2 Hardened)
/// Captures real-world performance metrics from the warrior's device.
/// Implements Phase 6.3B (Production Analytics Readiness).
class TelemetryRecord extends Equatable {
  final String id;
  final String eventName;
  final int durationMs;
  final bool success; // Added: Event success state
  final String? errorCode; // Added: Failure analytics

  final String sessionId; // Added: Warrior journey reconstruction
  final String anonymizedUserId; // Added: Privacy compliant ID
  final String userId;
  final String? recruitmentId;

  final String deviceModel;
  final String osVersion;
  final String appVersion; // Added: Deployment tracking
  final String buildNumber; // Added: Precision tracking
  final String networkType; // Added: Environmental context

  final DateTime timestamp;
  final Map<String, dynamic> metadata;

  const TelemetryRecord({
    required this.id,
    required this.eventName,
    required this.durationMs,
    required this.success,
    this.errorCode,
    required this.sessionId,
    required this.anonymizedUserId,
    required this.userId,
    this.recruitmentId,
    required this.deviceModel,
    required this.osVersion,
    required this.appVersion,
    required this.buildNumber,
    required this.networkType,
    required this.timestamp,
    this.metadata = const {},
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'eventName': eventName,
      'durationMs': durationMs,
      'success': success,
      'errorCode': errorCode,
      'sessionId': sessionId,
      'anonymizedUserId': anonymizedUserId,
      'userId': userId,
      'recruitmentId': recruitmentId,
      'deviceModel': deviceModel,
      'osVersion': osVersion,
      'appVersion': appVersion,
      'buildNumber': buildNumber,
      'networkType': networkType,
      'timestamp': timestamp.millisecondsSinceEpoch,
      'metadata': metadata,
    };
  }

  factory TelemetryRecord.fromMap(Map<String, dynamic> map) {
    return TelemetryRecord(
      id: map['id'] ?? '',
      eventName: map['eventName'] ?? '',
      durationMs: map['durationMs'] ?? 0,
      success: map['success'] ?? true,
      errorCode: map['errorCode'],
      sessionId: map['sessionId'] ?? '',
      anonymizedUserId: map['anonymizedUserId'] ?? '',
      userId: map['userId'] ?? '',
      recruitmentId: map['recruitmentId'],
      deviceModel: map['deviceModel'] ?? 'Unknown',
      osVersion: map['osVersion'] ?? 'Unknown',
      appVersion: map['appVersion'] ?? 'Unknown',
      buildNumber: map['buildNumber'] ?? '0',
      networkType: map['networkType'] ?? 'unknown',
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] ?? 0),
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
    );
  }

  @override
  List<Object?> get props => [
        id,
        eventName,
        durationMs,
        success,
        errorCode,
        sessionId,
        anonymizedUserId,
        userId,
        recruitmentId,
        deviceModel,
        osVersion,
        appVersion,
        buildNumber,
        networkType,
        timestamp,
        metadata,
      ];
}
