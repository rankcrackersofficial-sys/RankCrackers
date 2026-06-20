import '../data/repositories/sentinel_repository.dart';
import '../models/opportunity.dart';
import '../models/opportunity_match.dart';
import 'sentinel_metrics_aggregator.dart';

/// 🔱 SENTINEL METRICS SERVICE
/// Orchestrates the aggregation and persistence of career intelligence metrics.
class SentinelMetricsService {
  final SentinelRepository _repository;

  SentinelMetricsService(this._repository);

  /// 🔱 REFRESH METRICS
  /// Calculates latest metrics and persists them to the Warrior's citadel.
  Future<void> refreshMetrics({
    required String uid,
    required List<Opportunity> allOpportunities,
    required List<OpportunityMatch> matches,
    int unreadNotifications = 0,
  }) async {
    // 1. Aggregate
    final metrics = SentinelMetricsAggregator.aggregate(
      allOpportunities: allOpportunities, 
      matches: matches,
      unreadNotifications: unreadNotifications,
    );

    // 2. Persist to Firestore via Repository
    await _repository.updateMetrics(uid, metrics);
  }
}
