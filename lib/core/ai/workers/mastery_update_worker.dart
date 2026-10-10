import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/mastery_node.dart';

/// MASTERY UPDATE WORKER (Blueprint v1.0)
/// Logic: MCQ Submitted -> Evaluation -> Difficulty/PYQ Weight -> Mastery Delta -> Firestore
class MasteryUpdateWorker {
  
  static MasteryNode calculateUpdate({
    required MasteryNode currentNode,
    required bool isCorrect,
    required int difficulty, // 1-5
    required bool isPYQ,
    required double responseTimeSeconds,
  }) {
    debugPrint("MASTERY WORKER: Calculating delta for ${currentNode.atomicTopicId}...");

    double delta = 0.0;
    int newStreak = isCorrect ? currentNode.streak + 1 : 0;

    if (isCorrect) {
      // Mastery Delta Logic (Audit Sprint J Hardening)
      delta = difficulty.toDouble(); 
      if (isPYQ) delta += 3.0; // PYQ Correct Bonus
      
      // Multi-Tier Response Time Discrimination
      if (responseTimeSeconds < 10) {
        delta += 2.0; // Rapid Recall (+2)
      } else if (responseTimeSeconds < 20) {
        delta += 1.0; // Prompt Response (+1)
      } else if (responseTimeSeconds < 30) {
        delta += 0.5; // Deliberate Action (+0.5)
      }
      // 30+ seconds adds no speed bonus
    } else {
      // Penalty for wrong answers
      delta = -(difficulty.toDouble() + 1.0); 
    }

    double newScore = (currentNode.masteryScore + delta).clamp(0.0, 100.0);
    
    // Status Flow Logic
    String newStatus = currentNode.status;
    if (newScore >= 90) newStatus = 'MASTERED';
    else if (newScore >= 60) newStatus = 'PRACTICING';
    else if (newScore > 0) newStatus = 'LEARNING';
    else if (currentNode.totalAttempts > 0) newStatus = 'DISCOVERED';

    return currentNode.copyWith(
      masteryScore: newScore,
      totalAttempts: currentNode.totalAttempts + 1,
      correctAttempts: isCorrect ? currentNode.correctAttempts + 1 : currentNode.correctAttempts,
      streak: newStreak,
      lastAttempted: DateTime.now(),
      status: newStatus,
    );
  }
}
