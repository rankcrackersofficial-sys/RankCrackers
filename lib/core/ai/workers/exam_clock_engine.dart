import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/exam_clock_node.dart';

/// 🔱 EXAM CLOCK ENGINE (Blueprint v1.0 - Document 52)
/// Calculates feasibility and track status based on deadline and remaining workload.
class ExamClockEngine {
  
  static ExamClockNode calculate({
    required String userId,
    required String realmId,
    required DateTime examDate,
    required int totalTopics,
    required int completedTopics,
    required double currentReadiness, // 0.0 to 100.0
  }) {
    debugPrint("🔱 EXAM CLOCK: Calculating temporal feasibility for $userId...");

    final now = DateTime.now();
    final daysRemaining = examDate.difference(now).inDays;
    final topicsRemaining = totalTopics - completedTopics;
    
    // Readiness Gap: Target 90% readiness before exam
    const double targetReadiness = 90.0;
    final readinessGap = (targetReadiness - currentReadiness).clamp(0.0, 100.0);
    
    // Feasibility Calculation
    double neededRate = daysRemaining > 0 ? topicsRemaining / daysRemaining : topicsRemaining.toDouble();
    
    ExamClockStatus status = ExamClockStatus.ON_TRACK;
    if (daysRemaining < 30 && readinessGap > 40) {
      status = ExamClockStatus.OFF_TRACK;
    } else if (neededRate > 5 || (daysRemaining < 60 && readinessGap > 25)) {
      status = ExamClockStatus.AT_RISK;
    }

    return ExamClockNode(
      userId: userId,
      realmId: realmId,
      examDate: examDate,
      daysRemaining: daysRemaining,
      topicsRemaining: topicsRemaining,
      coverageRemaining: (topicsRemaining / (totalTopics == 0 ? 1 : totalTopics)) * 100,
      readinessGap: readinessGap,
      status: status,
      calculatedAt: now,
    );
  }
}
