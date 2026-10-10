import 'package:equatable/equatable.dart';

class CareerSignal extends Equatable {
  final String signalId;
  final String studentId;
  final String missionId;
  final String careerFamily;
  final String opportunityId;
  final String title;
  final String department;
  final String description;

  // Signal state badges mapping
  final String relevanceState; // "Based on Mission", "Profile Matched", "Eligibility Matched", "More Information Needed"
  final String eligibilityState; // "Eligible", "Not Confirmed", "Incomplete"

  // Matching Indicators
  final bool missionMatch;
  final bool academicMatch;
  final bool qualificationMatch;
  final bool preferenceMatch;
  final bool locationMatch;

  final List<String> missingProfileFields;
  final List<String> reasonCodes; // "Why this signal?" bullet texts

  // Governance / Source Metadata
  final String sourceAuthority;
  final String sourceVersion;
  final DateTime sourceUpdatedAt;
  final DateTime generatedAt;
  final DateTime expiresAt;

  const CareerSignal({
    required this.signalId,
    required this.studentId,
    required this.missionId,
    required this.careerFamily,
    required this.opportunityId,
    required this.title,
    required this.department,
    required this.description,
    required this.relevanceState,
    required this.eligibilityState,
    this.missionMatch = false,
    this.academicMatch = false,
    this.qualificationMatch = false,
    this.preferenceMatch = false,
    this.locationMatch = false,
    this.missingProfileFields = const [],
    this.reasonCodes = const [],
    this.sourceAuthority = "Sovereign Rulebook",
    this.sourceVersion = "1.0.0",
    required this.sourceUpdatedAt,
    required this.generatedAt,
    required this.expiresAt,
  });

  @override
  List<Object?> get props => [
        signalId,
        studentId,
        missionId,
        careerFamily,
        opportunityId,
        title,
        relevanceState,
        eligibilityState,
        missionMatch,
        academicMatch,
        qualificationMatch,
        preferenceMatch,
        locationMatch,
      ];
}
