import 'package:equatable/equatable.dart';

/// 🔱 OPPORTUNITY MATCH (Document 50A Section 3)
/// Represents the personalized alignment between a warrior and an opportunity.
class OpportunityMatch extends Equatable {
  final String uid;
  final String opportunityId;
  final bool eligible;
  final double matchScore;
  final List<String> matchedRules;
  final List<String> missingRequirements;
  final List<String> eligibilityReasons; // 🔱 Explainability Layer
  final List<String> benefitReasons; // 🔱 Benefit Attribution

  const OpportunityMatch({
    required this.uid,
    required this.opportunityId,
    required this.eligible,
    required this.matchScore,
    this.matchedRules = const [],
    this.missingRequirements = const [],
    this.eligibilityReasons = const [],
    this.benefitReasons = const [],
  });

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'opportunityId': opportunityId,
      'eligible': eligible,
      'matchScore': matchScore,
      'matchedRules': matchedRules,
      'missingRequirements': missingRequirements,
      'eligibilityReasons': eligibilityReasons,
      'benefitReasons': benefitReasons,
    };
  }

  factory OpportunityMatch.fromMap(Map<String, dynamic> map) {
    return OpportunityMatch(
      uid: map['uid'] ?? '',
      opportunityId: map['opportunityId'] ?? '',
      eligible: map['eligible'] ?? false,
      matchScore: (map['matchScore'] ?? 0.0).toDouble(),
      matchedRules: List<String>.from(map['matchedRules'] ?? []),
      missingRequirements: List<String>.from(map['missingRequirements'] ?? []),
      eligibilityReasons: List<String>.from(map['eligibilityReasons'] ?? []),
      benefitReasons: List<String>.from(map['benefitReasons'] ?? []),
    );
  }

  @override
  List<Object?> get props => [uid, opportunityId, eligible, matchScore];
}
