import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/opportunity_match.dart';
import '../services/opportunity_matching_service.dart';
import '../../deep_profile/providers/warrior_profile_provider.dart';
import 'opportunities_provider.dart';

/// 🔱 OPPORTUNITY MATCH PROVIDER
/// Derives real-time eligibility matches for the current warrior.
final opportunityMatchesProvider = Provider<List<OpportunityMatch>>((ref) {
  final profile = ref.watch(warriorProfileProvider);
  final opportunitiesAsync = ref.watch(allOpportunitiesProvider);
  
  if (profile == null) return const [];
  
  // 🔱 Type-Safety Hardening: Explicitly unwrap and return typed List
  return opportunitiesAsync.maybeWhen(
    data: (list) {
      return list.map((o) => OpportunityMatchingService.evaluate(
        profile: profile, 
        opportunity: o
      )).toList();
    },
    orElse: () => const <OpportunityMatch>[],
  );
});

/// 🔱 ELIGIBLE MATCHES PROVIDER
final eligibleOpportunitiesProvider = Provider<List<OpportunityMatch>>((ref) {
  final matches = ref.watch(opportunityMatchesProvider);
  return matches.where((m) => m.eligible).toList();
});

/// 🔱 ALMOST ELIGIBLE PROVIDER
final almostEligibleOpportunitiesProvider = Provider<List<OpportunityMatch>>((ref) {
  final matches = ref.watch(opportunityMatchesProvider);
  // Match score between 40% and 100% but not eligible
  return matches.where((m) => !m.eligible && m.matchScore >= 0.4).toList();
});
