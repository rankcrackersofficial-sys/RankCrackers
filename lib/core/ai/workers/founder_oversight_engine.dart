import 'package:flutter/foundation.dart';
import 'package:rank_crackers/core/models/fusion_node.dart';
import 'package:rank_crackers/core/models/drift_detection_node.dart';

/// FOUNDER OVERSIGHT ENGINE (Blueprint v1.0 - Document 68)
/// Aggregates prep intelligence across the realm for command-level insights.
class FounderOversightEngine {
  
  static Map<String, dynamic> generateRealmHealthReport({
    required String realmId,
    required List<FusionNode> allFusions,
    required List<DriftDetectionNode> allDrifts,
  }) {
    debugPrint("FOUNDER OVERSIGHT: Synthesizing health report for $realmId...");

    // 1. Threat Distribution
    final criticalCount = allFusions.where((f) => f.action == 'EMERGENCY').length;
    final totalTopics = allFusions.length;
    
    // 2. Strategic Stability
    final collapsingCount = allDrifts.where((d) => d.driftStatus == 'COLLAPSING').length;

    // 3. Realm Readiness
    double avgMastery = allFusions.fold(0.0, (sum, f) => sum + f.masteryScore) / (totalTopics == 0 ? 1 : totalTopics);

    return {
      'realmId': realmId,
      'healthScore': (avgMastery * 0.7) + (totalTopics == 0 ? 0 : (1.0 - (criticalCount / totalTopics)) * 30),
      'metrics': {
        'totalActiveTopics': totalTopics,
        'criticalThreats': criticalCount,
        'strategicCollapses': collapsingCount,
        'avgMastery': avgMastery,
      },
      'topFailureDrivers': _identifyFailureDrivers(allFusions),
    };
  }

  static List<String> _identifyFailureDrivers(List<FusionNode> fusions) {
    final Map<String, int> reasonFrequency = {};
    for (var f in fusions) {
      for (var reason in f.reasons) {
        reasonFrequency[reason] = (reasonFrequency[reason] ?? 0) + 1;
      }
    }
    
    final sorted = reasonFrequency.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
      
    return sorted.take(3).map((e) => e.key).toList();
  }
}
