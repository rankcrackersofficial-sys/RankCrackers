import 'package:equatable/equatable.dart';

/// NOTIFICATION EVENT
/// Represents a tactical alert or system event directed at the warrior.
/// Implements Document 16 Sections 59–63.
class NotificationEvent extends Equatable {
  final String id;
  final String missionId;
  final String type; // system, mission, social, stall, rebuild, exam_reminder
  final String priorityState; // low, medium, high, critical
  final double priorityScore; // Calculated via NotificationImportanceEngine
  final String title;
  final String message;
  final Map<String, dynamic> context;
  final DateTime timestamp;
  final int version;
  final bool isRead;

  const NotificationEvent({
    required this.id,
    required this.missionId,
    required this.type,
    required this.priorityState,
    required this.priorityScore,
    required this.title,
    required this.message,
    required this.context,
    required this.timestamp,
    this.version = 1,
    this.isRead = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'missionId': missionId,
      'type': type,
      'priorityState': priorityState,
      'priorityScore': priorityScore,
      'title': title,
      'message': message,
      'context': context,
      'timestamp': timestamp.millisecondsSinceEpoch,
      'version': version,
      'isRead': isRead,
    };
  }

  factory NotificationEvent.fromMap(Map<String, dynamic> map) {
    return NotificationEvent(
      id: map['id'] ?? '',
      missionId: map['missionId'] ?? '',
      type: map['type'] ?? 'system',
      priorityState: map['priorityState'] ?? 'low',
      priorityScore: (map['priorityScore'] ?? 0.0).toDouble(),
      title: map['title'] ?? '',
      message: map['message'] ?? '',
      context: Map<String, dynamic>.from(map['context'] ?? {}),
      timestamp: DateTime.fromMillisecondsSinceEpoch(map['timestamp'] ?? 0),
      version: map['version'] ?? 1,
      isRead: map['isRead'] ?? false,
    );
  }

  @override
  List<Object?> get props => [
    id,
    missionId,
    type,
    priorityState,
    priorityScore,
    title,
    message,
    context,
    timestamp,
    version,
    isRead,
  ];
}
