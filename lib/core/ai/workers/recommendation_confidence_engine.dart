import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/decision_trace_node.dart';

/// 🔱 RECOMMENDATION CONFIDENCE ENGINE (Blueprint v1.0 - Document 63)
/// Measures the structural integrity and data density behind an APOS decision.
class RecommendationConfidenceEngine {
  
  static double calculateConfidence(DecisionTraceNode trace) {
    debugPrint("🔱 CONFIDENCE ENGINE: Auditing data density for ${trace.targetId}...");

    double confidence = 0.5; // Baseline
    final inputs = trace.inputs;

    // Density Checks
    if (inputs['totalAttempts'] != null && inputs['totalAttempts'] > 20) {
      confidence += 0.2; // High historical evidence
    }
    
    if (inputs['pyqVerified'] == true) {
      confidence += 0.15; // Anchored in actual exam evidence
    }
    
    if (inputs['momentumStatus'] != 'UNKNOWN') {
      confidence += 0.1; // Contextualized by student trend
    }
    
    if (inputs['isHeuristic'] == true) {
      confidence -= 0.2; // Penalty for logic using assumptions
    }

    return confidence.clamp(0.1, 1.0);
  }
}
