import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/momentum_node.dart';
import 'package:rank_crackers/core/models/battle_session.dart';

/// MOMENTUM ENGINE (Blueprint v1.0 - Document 50)
/// Analyzes long-term performance trends to determine the student's trajectory.
class MomentumEngine {
  
  static MomentumNode calculate({
    required String userId,
    required String realmId,
    required List<BattleSession> recentSessions, // Last 7-30 days
  }) {
    debugPrint("MOMENTUM ENGINE: Analyzing trajectory for $userId...");

    if (recentSessions.isEmpty) {
      return MomentumNode(
        userId: userId,
        realmId: realmId,
        masteryGrowth: 0,
        coverageGrowth: 0,
        missionCompletionRate: 0,
        battleAccuracy: 0,
        status: MomentumStatus.STABLE,
        calculatedAt: DateTime.now(),
      );
    }

    // Metric Aggregation
    int completedCount = recentSessions.where((s) => s.result != MissionResult.FAILED).length;
    double completionRate = (completedCount / recentSessions.length) * 100;
    
    int totalQuestions = recentSessions.fold(0, (sum, s) => sum + s.questionsSolved);
    int correctQuestions = recentSessions.fold(0, (sum, s) => sum + s.correctAnswers);
    double accuracy = totalQuestions == 0 ? 0 : (correctQuestions / totalQuestions) * 100;

    // Trend Analysis
    final firstHalf = recentSessions.take(recentSessions.length ~/ 2);
    final secondHalf = recentSessions.skip(recentSessions.length ~/ 2);
    
    double firstHalfAccuracy = _avgAccuracy(firstHalf.toList());
    double secondHalfAccuracy = _avgAccuracy(secondHalf.toList());
    double accuracyTrend = secondHalfAccuracy - firstHalfAccuracy;

    // Trajectory Classification
    MomentumStatus status = MomentumStatus.STABLE;
    if (accuracyTrend > 10 && completionRate > 80) status = MomentumStatus.RISING;
    else if (accuracyTrend < -15 || completionRate < 40) status = MomentumStatus.COLLAPSING;
    else if (accuracyTrend < -5) status = MomentumStatus.DECLINING;

    return MomentumNode(
      userId: userId,
      realmId: realmId,
      masteryGrowth: accuracyTrend,
      coverageGrowth: recentSessions.fold(0.0, (sum, s) => sum + s.coverageGained),
      missionCompletionRate: completionRate,
      battleAccuracy: accuracy,
      status: status,
      calculatedAt: DateTime.now(),
    );
  }

  static double _avgAccuracy(List<BattleSession> sessions) {
    if (sessions.isEmpty) return 0;
    int total = sessions.fold(0, (sum, s) => sum + s.questionsSolved);
    int correct = sessions.fold(0, (sum, s) => sum + s.correctAnswers);
    return total == 0 ? 0 : (correct.toDouble() / total) * 100;
  }
}
