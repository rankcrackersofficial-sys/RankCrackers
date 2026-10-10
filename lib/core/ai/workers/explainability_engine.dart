import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/decision_trace_node.dart';

/// EXPLAINABILITY ENGINE (Blueprint v1.0 - Document 62)
/// Translates technical APOS traces into student-facing preparation narratives.
class ExplainabilityEngine {
  
  static String generateExplanation(DecisionTraceNode trace) {
    debugPrint("EXPLAINABILITY: Crafting narrative for ${trace.targetId}...");

    final Map<String, dynamic> inputs = trace.inputs;
    final List<String> reasons = [];

    // Heuristic logic to build narrative from inputs
    if (inputs['riskScore'] != null && inputs['riskScore'] > 70) {
      reasons.add("it carries a high risk of failure in the upcoming exam");
    }
    
    if (inputs['masteryScore'] != null && inputs['masteryScore'] < 50) {
      reasons.add("your mastery in this area is currently below safe levels");
    }
    
    if (inputs['pyqThreat'] != null && inputs['pyqThreat'] == true) {
      reasons.add("this topic has high historical importance (PYQ weight)");
    }
    
    if (inputs['clockStatus'] == 'AT_RISK' || inputs['clockStatus'] == 'OFF_TRACK') {
      reasons.add("deadline pressure is increasing");
    }

    if (reasons.isEmpty) {
      return "This mission was assigned to maintain your current momentum and ensure knowledge stability.";
    }

    String narrative = "APOS assigned this ${trace.targetType.toLowerCase()} because ";
    narrative += reasons.join(", and ") + ".";
    
    return narrative;
  }
}
