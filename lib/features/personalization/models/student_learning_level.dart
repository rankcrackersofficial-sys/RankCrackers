import 'package:equatable/equatable.dart';

/// LEARNING LEVEL
/// Diagnostic training baseline level.
enum LearningLevel {
  novice,
  middle,
  pro;

  String get displayName {
    switch (this) {
      case LearningLevel.novice:
        return 'Guided Foundation';
      case LearningLevel.middle:
        return 'Standard Rigor';
      case LearningLevel.pro:
        return 'Advanced Application';
    }
  }

  String get supportiveMessage {
    switch (this) {
      case LearningLevel.novice:
        return 'Focus on core principles, step-by-step scaffolding, and reinforced conceptual clarity.';
      case LearningLevel.middle:
        return 'Balanced standard problem solving with comprehensive multi-step reasoning.';
      case LearningLevel.pro:
        return 'High-velocity execution, deep synthesis, and edge-case mastery.';
    }
  }
}

/// DIFFICULTY BAND
/// Academic difficulty tier strictly constrained within official syllabus.
enum DifficultyBand {
  foundation,
  standard,
  highJeeMain;

  static DifficultyBand fromString(String val) {
    final lower = val.toLowerCase().trim();
    if (lower == 'easy' || lower == 'foundation' || lower == 'basic') {
      return DifficultyBand.foundation;
    }
    if (lower == 'hard' || lower == 'high' || lower == 'advanced' || lower.contains('jee_main_high')) {
      return DifficultyBand.highJeeMain;
    }
    return DifficultyBand.standard;
  }

  static DifficultyBand fromDynamic(dynamic val) {
    if (val == null) return DifficultyBand.standard;
    if (val is DifficultyBand) return val;
    return fromString(val.toString().split('.').last);
  }
}

/// LEARNING LOAD STATUS
/// Non-medical behavioral signal of cognitive demand and fatigue.
enum LearningLoadStatus {
  low,
  balanced,
  highDemand;

  bool get requiresScaffolding => this == LearningLoadStatus.highDemand;
}

/// DIFFICULTY ENVELOPE
/// Distribution of question difficulty tailored to the student's current learning level.
class DifficultyEnvelope extends Equatable {
  final double foundationShare;
  final double standardShare;
  final double highShare;

  const DifficultyEnvelope({
    required this.foundationShare,
    required this.standardShare,
    required this.highShare,
  });

  static const DifficultyEnvelope novice = DifficultyEnvelope(
    foundationShare: 0.50,
    standardShare: 0.40,
    highShare: 0.10,
  );

  static const DifficultyEnvelope middle = DifficultyEnvelope(
    foundationShare: 0.25,
    standardShare: 0.55,
    highShare: 0.20,
  );

  static const DifficultyEnvelope pro = DifficultyEnvelope(
    foundationShare: 0.10,
    standardShare: 0.50,
    highShare: 0.40,
  );

  static DifficultyEnvelope forLevel(LearningLevel level) {
    switch (level) {
      case LearningLevel.novice:
        return novice;
      case LearningLevel.middle:
        return middle;
      case LearningLevel.pro:
        return pro;
    }
  }

  @override
  List<Object?> get props => [foundationShare, standardShare, highShare];
}
