import '../models/career_signal.dart';
import '../models/opportunity.dart';
import '../../deep_profile/models/warrior_profile.dart';
import 'opportunity_matching_service.dart';

class CareerSignalEngine {
  /// COMPUTE PATHWAYS
  /// Dynamically computes matches from real opportunity notifications and rulebooks.
  static List<CareerSignal> compute({
    required WarriorProfile profile,
    required String recruitmentId,
    required String activeMissionName,
    required List<Opportunity> dbOpportunities,
  }) {
    final List<CareerSignal> signals = [];
    final studentId = profile.uid;
    final now = DateTime.now();
    final expires = now.add(const Duration(days: 7));

    // Filter Candidate pool based strictly on canonical recruitmentId
    final missionFiltered = dbOpportunities.where((opp) {
      return opp.eligibleMissionIds.contains(recruitmentId);
    }).toList();

    for (var opp in missionFiltered) {
      // 1. EVALUATE VIA FORMAL ELIGIBILITY RULE AUTHORITIES
      final evaluation = OpportunityMatchingService.evaluate(
        profile: profile,
        opportunity: opp,
      );

      // Determine relevance based on formal evaluation
      String relevanceState;
      String eligibilityState;
      final List<String> reasons = [];

      reasons.add("✓ Matches your $activeMissionName mission");

      if (evaluation.eligible) {
        relevanceState = opp.requiresGraduation ? "Eligibility Matched" : "Profile Matched";
        eligibilityState = "Eligible";

        // Explainability from evaluation
        for (var reason in evaluation.eligibilityReasons) {
            if (!reasons.contains(reason)) reasons.add(reason);
        }
      } else {
        relevanceState = "More Information Needed";
        eligibilityState = "Incomplete";
        for (var reason in evaluation.missingRequirements) {
          reasons.add("• $reason");
        }
      }

      signals.add(CareerSignal(
        signalId: "${opp.id}_signal",
        studentId: studentId,
        missionId: recruitmentId,
        careerFamily: _getCareerFamilyForOpp(opp),
        opportunityId: opp.id,
        title: opp.title,
        department: opp.department,
        description: opp.educationRequirements.isNotEmpty ? opp.educationRequirements.first : "Governed technical pathway",
        relevanceState: relevanceState,
        eligibilityState: eligibilityState,
        missionMatch: true,
        academicMatch: evaluation.eligible, // Bound to formal authority
        qualificationMatch: evaluation.eligible, // Bound to formal authority
        reasonCodes: reasons,
        sourceAuthority: opp.sourceAuthority,
        sourceVersion: opp.sourceVersion,
        sourceUpdatedAt: opp.notificationDate,
        generatedAt: now,
        expiresAt: expires,
      ));
    }

    // Sort by relevance hierarchy
    signals.sort((a, b) {
      final rank = {
        "Eligibility Matched": 0,
        "Profile Matched": 1,
        "Based on Mission": 2,
        "More Information Needed": 3,
      };
      final scoreA = rank[a.relevanceState] ?? 4;
      final scoreB = rank[b.relevanceState] ?? 4;
      return scoreA.compareTo(scoreB);
    });

    return signals;
  }

  static String _getCareerFamilyForOpp(Opportunity opp) {
    final title = opp.title.toLowerCase();
    if (title.contains("mbbs") || title.contains("medical")) return "Medicine";
    if (title.contains("nursing")) return "Healthcare";
    if (title.contains("btech") || title.contains("computer")) return "Engineering";
    if (title.contains("barch") || title.contains("architecture")) return "Design";
    if (title.contains("civil") || title.contains("ias")) return "Civil Services";
    if (title.contains("nda") || title.contains("forces")) return "Defence";
    return "Public Administration";
  }
}
