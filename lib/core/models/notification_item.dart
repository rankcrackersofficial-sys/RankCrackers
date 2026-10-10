import 'notification_priority.dart';

class NotificationItem {
  final String id;
  final String title;
  final String body;
  final NotificationPriority priority;
  final String source; // Sentinel, Recruitment, Coverage, Risk, System
  final DateTime createdAt;
  final bool read;

  NotificationItem({
    required this.id,
    required this.title,
    required this.body,
    required this.priority,
    required this.source,
    required this.createdAt,
    this.read = false,
  });

  NotificationItem copyWith({
    String? id,
    String? title,
    String? body,
    NotificationPriority? priority,
    String? source,
    DateTime? createdAt,
    bool? read,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      title: title ?? this.title,
      body: body ?? this.body,
      priority: priority ?? this.priority,
      source: source ?? this.source,
      createdAt: createdAt ?? this.createdAt,
      read: read ?? this.read,
    );
  }
}
