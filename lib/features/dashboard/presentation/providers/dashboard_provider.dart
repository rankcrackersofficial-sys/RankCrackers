import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../../core/models/node_runtime_state.dart';
import '../../../../core/models/readiness_state.dart';
import '../../../../shared/providers/session_provider.dart';

/// Progress metrics are private to the signed-in user and selected mission.
bool hasCurrentSessionMissionMetrics({
  required String selectedMissionId,
  required String? engineMissionId,
  required bool metricsBoundToSession,
}) {
  return selectedMissionId.isNotEmpty &&
      engineMissionId == selectedMissionId &&
      metricsBoundToSession;
}

// =========================================
// REAL KNOWLEDGE FLOW PROVIDER
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
  final session = ref.watch(activeSessionUserProvider);
  final engine = ref.watch(knowledgeEngineProvider);
  // Use the same mission-scoped node source as Syllabus.
  final nodes = ref.watch(allNodesProvider);
  final metricsAreCurrent = hasCurrentSessionMissionMetrics(
    selectedMissionId: session.examId,
    engineMissionId: engine.activeRecruitment?.examId,
    metricsBoundToSession: engine.isMetricsValidForCurrentSession(),
  );
  final states = metricsAreCurrent
      ? engine.nodeStates
      : const <String, NodeRuntimeState>{};

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
  final session = ref.watch(activeSessionUserProvider);
  final engine = ref.watch(knowledgeEngineProvider);
  final metricsAreCurrent = hasCurrentSessionMissionMetrics(
    selectedMissionId: session.examId,
    engineMissionId: engine.activeRecruitment?.examId,
    metricsBoundToSession: engine.isMetricsValidForCurrentSession(),
  );
  return metricsAreCurrent ? engine.readinessState : null;
});

/// Performance-optimized User Metrics Provider
final userProfileStatsProvider = Provider<Map<String, int>>((ref) {
  final session = ref.watch(activeSessionUserProvider);
  final engine = ref.watch(knowledgeEngineProvider);
  final metricsAreCurrent = hasCurrentSessionMissionMetrics(
    selectedMissionId: session.examId,
    engineMissionId: engine.activeRecruitment?.examId,
    metricsBoundToSession: engine.isMetricsValidForCurrentSession(),
  );
  final states = metricsAreCurrent
      ? engine.nodeStates.values
      : const <NodeRuntimeState>[];

  int totalBattles = 0;
  for (final state in states) {
    totalBattles += state.battlesWon + state.battlesLost;
  }

  return {'totalBattles': totalBattles};
});
