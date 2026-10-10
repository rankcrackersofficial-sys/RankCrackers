import '../models/cognitive_profile.dart';

class DiagnosticEngine {
  // ===================================================
  // ANALYZE TEST RESULTS 
  // ===================================================
  static CognitiveProfile generateProfile({
    required double memoryScore,
    required double conceptualScore,
    required double analyticalScore,
    required double speedScore,
    required Map<String, double> subjectScores,
  }) {
    // Logic to calculate cognitive traits from raw test data
    return CognitiveProfile(
      memoryStrength: memoryScore.clamp(0.0, 1.0),
      conceptualDepth: conceptualScore.clamp(0.0, 1.0),
      analyticalAbility: analyticalScore.clamp(0.0, 1.0),
      speed: speedScore.clamp(0.0, 1.0),
      domainMastery: subjectScores,
      retentionRate: 0.85, // Default starting retention
    );
  }

  // ===================================================
  // DETERMINE USER LEVEL 
  // ===================================================
  static String determineLevel(CognitiveProfile profile) {
    double average = (profile.conceptualDepth + profile.analyticalAbility) / 2;
    if (average < 0.4) return 'beginner';
    if (average < 0.75) return 'intermediate';
    return 'pro';
  }
}
