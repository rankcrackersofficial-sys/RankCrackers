import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/mastery_node.dart';
import 'package:rank_crackers/core/models/coverage_node.dart';
import 'package:rank_crackers/core/models/risk_node.dart';

/// 🔱 FUSION ENGINE (Sprint K/L Hardened - Blueprint v1.1)
/// Converts raw intelligence (Mastery/Coverage/Risk) into study actions.
class FusionEngine {
  
  static FusionNode fuse({
    required MasteryNode mastery,
    required CoverageNode coverage,
    required RiskNode risk,
  }) {
    debugPrint("🔱 FUSION ENGINE: Fusing intelligence for ${mastery.atomicTopicId}...");

    final List<String> reasons = [];

    // 🔱 Priority Scoring Logic (1-100)
    double priorityBase = ((100.0 - mastery.masteryScore) * 0.4) + 
                          ((100.0 - coverage.coverageScore) * 0.3) + 
                          (risk.riskScore * 0.3);
    
    int priorityScore = priorityBase.toInt().clamp(1, 100);

    // 🔱 Decision Matrix & Reason Capture (Audit Sprint L)
    String action = "IGNORE";

    if (risk.riskScore >= 85) {
      action = "EMERGENCY";
      reasons.addAll(risk.reasons);
    } else if (mastery.masteryScore >= 90 && coverage.coverageScore >= 90) {
      if (risk.riskScore > 20) {
        action = "REVISE";
        reasons.add("Knowledge Decay / Maintenance");
      } else {
        action = "IGNORE";
      }
    } else if (coverage.coverageScore < 50) {
      action = "MASTER";
      reasons.add("Coverage Gap (Breadth)");
    } else if (mastery.masteryScore < 60) {
      action = "PRACTICE";
      reasons.add("Weak Mastery (Depth)");
    } else {
      action = "REVISE";
      reasons.add("Consolidation required");
    }

    return FusionNode(
      id: "${mastery.userId}_${mastery.atomicTopicId}",
      userId: mastery.userId,
      realmId: mastery.realmId,
      atomicTopicId: mastery.atomicTopicId,
      masteryScore: mastery.masteryScore,
      coverageScore: coverage.coverageScore,
      riskScore: risk.riskScore,
      priorityScore: priorityScore,
      action: action,
      reasons: reasons,
      fusedAt: DateTime.now(),
    );
  }
}
