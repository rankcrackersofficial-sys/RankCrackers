import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/coverage_node.dart';

/// COVERAGE UPDATE WORKER (Blueprint v1.0)
/// Law: Coverage is earned through activity (DigiBook, Crucible, Diagnostic).
class CoverageUpdateWorker {
  
  static CoverageNode processEvent({
    required CoverageNode currentNode,
    required String eventType, // DIGIBOOK_VIEW, CRUCIBLE_ATTEMPT, DIAGNOSTIC_START
    int durationSeconds = 0, // Audit GAP-3: Anti-Exploit
  }) {
    debugPrint("COVERAGE WORKER: Updating coverage for ${currentNode.atomicTopicId} | Event: $eventType");

    bool newDiscovered = currentNode.discovered;
    bool newStudied = currentNode.studied;
    bool newAssessed = currentNode.assessed;
    int newViews = currentNode.digibookViews;
    int newAttempts = currentNode.crucibleAttempts;

    switch (eventType) {
      case 'DIGIBOOK_VIEW':
        newDiscovered = true;
        // Constitutional Law: Min 20s reading for coverage credit
        if (durationSeconds >= 20) {
          newStudied = true;
          newViews++;
        }
        break;
      case 'CRUCIBLE_ATTEMPT':
        newDiscovered = true;
        newAssessed = true;
        newAttempts++;
        break;
      case 'DIAGNOSTIC_START':
        newDiscovered = true;
        break;
    }

    // Coverage Score Calculation
    // Logic: Studied (40%) + Assessed (60%)
    double newScore = 0.0;
    if (newStudied) newScore += 40.0;
    if (newAssessed) newScore += 60.0;

    // Status Flow
    String newStatus = 'UNTOUCHED';
    if (newScore >= 100) newStatus = 'COVERED';
    else if (newScore > 40) newStatus = 'ENGAGED';
    else if (newDiscovered) newStatus = 'DISCOVERED';

    if (newViews > 2 && newAttempts > 5 && newScore >= 100) {
      newStatus = 'REINFORCED';
    }

    return currentNode.copyWith(
      discovered: newDiscovered,
      studied: newStudied,
      assessed: newAssessed,
      digibookViews: newViews,
      crucibleAttempts: newAttempts,
      coverageScore: newScore,
      status: newStatus,
      lastActivity: DateTime.now(),
    );
  }
}
