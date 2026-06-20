import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/opportunity_stats_service.dart';

final activeOpportunitiesCountProvider = StreamProvider<int>((ref) {
  return OpportunityStatsService.streamActiveCount();
});

final latestUpdatesCountProvider = StreamProvider<int>((ref) {
  return OpportunityStatsService.streamLatestUpdatesCount();
});
