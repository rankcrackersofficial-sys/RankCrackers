import 'package:equatable/equatable.dart';

/// PUBLISH ELIGIBILITY STATE
/// Represents the validation results for a Mission before publication.
class PublishEligibilityState extends Equatable {
  final bool isEligible;
  final bool hasNotification;
  final bool hasSyllabus;
  final bool hasDigiBook;
  final bool hasCrucible;
  final bool hasAssessments;
  final List<String> errors;

  const PublishEligibilityState({
    required this.isEligible,
    required this.hasNotification,
    required this.hasSyllabus,
    required this.hasDigiBook,
    required this.hasCrucible,
    required this.hasAssessments,
    this.errors = const [],
  });

  @override
  List<Object?> get props => [
    isEligible,
    hasNotification,
    hasSyllabus,
    hasDigiBook,
    hasCrucible,
    hasAssessments,
    errors,
  ];
}
