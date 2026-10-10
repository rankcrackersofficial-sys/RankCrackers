import '../models/opportunity.dart';
import '../models/opportunity_match.dart';
import '../models/sentinel_metrics.dart';

/// SENTINEL METRICS AGGREGATOR
/// Consolidates match intelligence into command metrics.
class SentinelMetricsAggregator {
  
  static SentinelMetrics aggregate({
    required List<Opportunity> allOpportunities,
    required List<OpportunityMatch> matches,
    int unreadNotifications = 0, // Phase 9D: Direct Feed Injection
  }) {
    final now = DateTime.now();

    // 1. New Alerts: Logic based on unread notification count
    final newAlertsCount = unreadNotifications;

    // 2. Expiring Forms: Closing in less than 7 days
    final expiringCount = allOpportunities.where((o) {
      final daysLeft = o.lastDate.difference(now).inDays;
      return daysLeft >= 0 && daysLeft <= 7;
    }).length;

    // 3. High Priority Exams: Match > 85%
    final highPriorityCount = matches.where((m) => m.matchScore > 85).length;

    return SentinelMetrics(
      newAlerts: newAlertsCount,
      expiringForms: expiringCount,
      highPriorityExams: highPriorityCount,
    );
  }
}
