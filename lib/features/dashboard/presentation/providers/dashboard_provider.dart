import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../../core/models/node_runtime_state.dart';
import '../../../../core/models/readiness_state.dart';

// =========================================
// REAL KNOWLEDGE FLOW PROVIDER 🔱
// =========================================

class DashboardTopicModel {
  final String topicId;
  final String topicName;
  final String subject;
  final double accuracy;
  final double decayRisk;
  final bool rebuildRequired;
  final bool isMastered;
  final int revisionCount;

  DashboardTopicModel({
    required this.topicId,
    required this.topicName,
    required this.subject,
    required this.accuracy,
    required this.decayRisk,
    required this.rebuildRequired,
    required this.isMastered,
    required this.revisionCount,
  });
}

final dashboardTopicsProvider = Provider<List<DashboardTopicModel>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  final nodes = engine.allNodes;
  final states = engine.nodeStates;

  return nodes.map((node) {
    final state = states[node.id] ?? NodeRuntimeState(nodeId: node.id);
    
    return DashboardTopicModel(
      topicId: node.id,
      topicName: node.topic,
      subject: node.subject,
      accuracy: state.mastery * 100, 
      decayRisk: (1.0 - state.mastery) * 100,
      rebuildRequired: state.mastery < 0.50,
      isMastered: state.mastery >= 0.85,
      revisionCount: state.revisionLevel,
    );
  }).toList();
});

final missionReadinessProvider = Provider<ReadinessState?>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  return engine.readinessState;
});

/// 🔱 Performance-optimized User Metrics Provider
final userProfileStatsProvider = Provider<Map<String, int>>((ref) {
  final engine = ref.watch(knowledgeEngineProvider);
  final states = engine.nodeStates.values;
  
  int totalBattles = 0;
  for (var s in states) {
    totalBattles += (s.battlesWon + s.battlesLost);
  }
  
  return {
    'totalBattles': totalBattles,
  };
});
