import 'package:flutter/foundation.dart';

/// TRUST & SAFETY ENGINE (Blueprint v1.0 - Document 67)
/// Enforces constitutional safety limits on APOS recommendations to prevent student burnout.
class TrustSafetyEngine {
  
  /// Validates a proposed study plan against safety guardrails.
  static Map<String, dynamic> validatePlan({
    required int proposedMinutes,
    required int totalSubjects,
    required String actionType,
  }) {
    debugPrint("TRUST & SAFETY: Auditing workload safety...");

    final List<String> violations = [];
    bool isSafe = true;

    // Safety Law 1: Max Workload
    if (proposedMinutes > 720) { // 12 Hours
       isSafe = false;
       violations.add("Workload exceeds safe human daily limit (720 min).");
    }

    // Safety Law 2: Cognitive Overload
    if (totalSubjects > 5 && proposedMinutes < 180) {
       isSafe = false;
       violations.add("Cognitive fragmentation: Too many subjects in too little time.");
    }

    // Safety Law 3: Balanced Prep
    if (actionType == 'EMERGENCY' && proposedMinutes > 300) {
       violations.add("Prolonged Emergency mode may lead to performance fatigue.");
    }

    return {
      'isSafe': isSafe,
      'violations': violations,
      'correctedMinutes': isSafe ? proposedMinutes : 480, // Cap at 8 hours if unsafe
    };
  }
}
