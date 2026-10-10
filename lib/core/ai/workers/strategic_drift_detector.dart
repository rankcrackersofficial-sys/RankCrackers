import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/drift_detection_node.dart';
import 'package:rank_crackers/core/models/success_probability_node.dart';

/// STRATEGIC DRIFT DETECTOR (Blueprint v1.0 - Document 65)
/// Identifies scenarios where a student follows the plan but fails to gain readiness.
class StrategicDriftDetector {
  
  static DriftDetectionNode analyze({
    required String userId,
    required String realmId,
    required double planCompliance,
    required SuccessProbabilityNode currentProbability,
    required double previousProbability,
  }) {
    debugPrint("DRIFT DETECTOR: Auditing strategic alignment for $userId...");

    final double delta = currentProbability.overallProbability - previousProbability;
    
    String status = 'STABLE';
    String reason = 'System performance within normal parameters.';

    // Drift Logic: compliance is high but probability is falling
    if (planCompliance > 80 && delta < -5) {
      status = 'DRIFTING';
      reason = 'High plan compliance failing to generate readiness. Strategy may be ineffective.';
    } else if (planCompliance > 90 && delta < -10) {
      status = 'COLLAPSING';
      reason = 'Severe strategic failure detected. Current mission mix is not addressing root causes.';
    } else if (planCompliance < 40 && delta < 0) {
      status = 'DRIFTING';
      reason = 'Execution gap driving readiness decay.';
    } else if (delta > 2) {
      status = 'CONVERGING';
      reason = 'Strategy is effectively driving success probability upward.';
    }

    return DriftDetectionNode(
      id: "drift_${DateTime.now().millisecondsSinceEpoch}",
      userId: userId,
      realmId: realmId,
      planCompliance: planCompliance,
      probabilityDelta: delta,
      driftStatus: status,
      primaryDriftReason: reason,
      detectedAt: DateTime.now(),
    );
  }
}
