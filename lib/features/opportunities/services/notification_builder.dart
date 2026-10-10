import '../../../core/models/notification_item.dart';
import '../../../core/models/notification_priority.dart';
import '../models/opportunity.dart';
import '../models/opportunity_match.dart';

/// NOTIFICATION BUILDER
/// Pure functional service to transform intelligence events into user-facing alerts.
class NotificationBuilder {
  
  static NotificationItem fromOpportunityMatch({
    required Opportunity opportunity,
    required OpportunityMatch match,
  }) {
    final timestamp = DateTime.now();
    return NotificationItem(
      id: 'notif_${opportunity.id}_${timestamp.millisecondsSinceEpoch}',
      title: 'TARGET ACQUIRED: ${opportunity.title}',
      body: 'High-relevance mission detected (${match.matchScore}% alignment).',
      priority: match.matchScore > 85 ? NotificationPriority.high : NotificationPriority.medium,
      source: 'Recruitment',
      createdAt: timestamp,
    );
  }

  static NotificationItem fromSystemAlert(String title, String body, NotificationPriority priority) {
    return NotificationItem(
      id: 'sys_${DateTime.now().millisecondsSinceEpoch}',
      title: title,
      body: body,
      priority: priority,
      source: 'System',
      createdAt: DateTime.now(),
    );
  }
}
