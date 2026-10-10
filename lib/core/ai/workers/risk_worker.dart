import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/risk_node.dart';
import 'package:rank_crackers/core/models/mastery_node.dart';
import 'package:rank_crackers/core/models/coverage_node.dart';

/// RISK ENGINE WORKER (Blueprint v1.0)
/// Law: Decision Loop Completer. Aggregates Mastery & Coverage to identify threats.
class RiskWorker {
  
  static RiskNode calculateRisk({
    required String userId,
    required String realmId,
    required String atomicTopicId,
    required MasteryNode mastery,
    required CoverageNode coverage,
    required double pyqWeightage, // 0.0 to 10.0
    required int pyqCount, // Audit GAP-4
    required int recentFrequency, // Audit GAP-4
  }) {
    debugPrint("RISK WORKER: Assessing threat level for $atomicTopicId...");

    final List<String> reasons = [];
    
    // Risk Formula Inputs
    double masteryComponent = (100.0 - mastery.masteryScore); 
    double coverageComponent = (100.0 - coverage.coverageScore); 
    
    // Audit GAP-2: Forgetting Curve (Time Decay)
    final daysSinceLast = DateTime.now().difference(mastery.lastAttempted).inDays;
    double decayFactor = 0.0;
    if (daysSinceLast > 30) decayFactor = 20.0;
    else if (daysSinceLast > 15) decayFactor = 10.0;
    else if (daysSinceLast > 7) decayFactor = 5.0;

    // Audit GAP-4: Dynamic PYQ Threat
    double dynamicPyqThreat = (pyqWeightage * 0.5) + (pyqCount * 0.3) + (recentFrequency * 0.2);

    // Weighted Risk Calculation (v1.2)
    double riskScore = (masteryComponent * 0.4) + 
                       (coverageComponent * 0.25) + 
                       (dynamicPyqThreat * 10.0 * 0.2) +
                       (decayFactor * 5.0 * 0.15);

    // Reason Extraction
    if (mastery.masteryScore < 40) reasons.add("Weak Mastery");
    if (coverage.coverageScore < 50) reasons.add("Low Coverage");
    if (dynamicPyqThreat > 7.0 && mastery.masteryScore < 60) reasons.add("High PYQ Threat");
    if (decayFactor > 0) reasons.add("Knowledge Decay (${daysSinceLast}d idle)");
    if (mastery.streak == 0 && mastery.totalAttempts > 0) reasons.add("Inconsistent Accuracy");

    String level = 'LOW';
    if (riskScore >= 85) level = 'CRITICAL';
    else if (riskScore >= 60) level = 'HIGH';
    else if (riskScore >= 30) level = 'MEDIUM';

    return RiskNode(
      id: "${userId}_$atomicTopicId",
      userId: userId,
      realmId: realmId,
      atomicTopicId: atomicTopicId,
      riskScore: riskScore.clamp(0.0, 100.0),
      riskLevel: level,
      reasons: reasons,
      calculatedAt: DateTime.now(),
    );
  }
}
