import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/battle_session.dart';
import 'package:rank_crackers/core/models/forecast_node.dart';

/// LEARNING VALIDATION ENGINE (Blueprint v1.0 - Document 69)
/// Measures APOS prediction accuracy against real student outcomes.
class LearningValidationEngine {
  static Map<String, dynamic> validatePrediction({
    required ForecastNode forecast,
    required BattleSession actualSession,
  }) {
    debugPrint("LEARNING VALIDATION: Comparing prediction vs reality...");

    // Metric: Accuracy of Readiness projection
    // We compare predicted readiness gain vs actual session accuracy
    double predictedGain =
        forecast.projectedReadiness7d; // Simple comparison for v1
    final solved = actualSession.questionsSolved;
    double actualGain =
        solved == 0 ? 0.0 : (actualSession.correctAnswers / solved) * 100.0;

    double errorMargin = (predictedGain - actualGain).abs();

    return {
      'predictionId': forecast.calculatedAt.millisecondsSinceEpoch,
      'errorMargin': errorMargin,
      'isModelCalibrated': errorMargin < 15.0,
      'calibrationFactor': errorMargin > 20.0 ? 0.8 : 1.0, // Suggest adjustment
    };
  }
}
