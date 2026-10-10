import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/notification_canonical.dart';

/// ELIGIBILITY INTELLIGENCE ENGINE (Sprint F.2)
class EligibilityIntelligenceEngine {
  static Future<UserRelevanceEngine> analyze(NotificationIntelligence intel) async {
    debugPrint("ELIGIBILITY ENGINE: Simulating user relevance mapping...");
    
    final List<String> eligibleCategories = ['UR', 'EWS', 'OBC', 'SC', 'ST'];
    final List<String> specialBenefits = [];
    final List<String> criticalActions = [];

    // Simple Rule-Based Logic
    if (intel.fees.general > 0) {
      specialBenefits.add("Fee Exemption for SC/ST/Female candidates");
    }

    if (intel.eligibility.maximumAge != null && intel.eligibility.maximumAge! < 30) {
      criticalActions.add("Verify age relaxation if above ${intel.eligibility.maximumAge}");
    }

    return UserRelevanceEngine(
      eligibleCategories: eligibleCategories,
      specialBenefits: specialBenefits,
      criticalActions: criticalActions,
    );
  }
}
