import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../models/momentum_state.dart';

class MomentumEngine {
  // ===================================================
  // MOMENTUM CALCULATION 
  // ===================================================

  static MomentumState calculate({
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
  }) {
    final completedNodes = nodes.where((e) => states[e.id]?.completed ?? false).length;

    final studiedNodes = nodes.where((e) => (states[e.id]?.totalStudyMinutes ?? 0) > 0).length;

    final momentumScore = nodes.isEmpty
        ? 0.0
        : ((completedNodes + studiedNodes) / (nodes.length * 2)).clamp(0.0, 1.0);

    final latestStudy = nodes
        .map((e) => states[e.id]?.lastStudiedAt)
        .whereType<DateTime>()
        .fold<DateTime?>(null, (a, b) => a == null ? b : (a.isAfter(b) ? a : b));

    final stalled = latestStudy == null
        ? true
        : DateTime.now().difference(latestStudy).inDays > 3;

    return MomentumState(
      studyStreakDays: 0,
      completedToday: 0,
      completedThisWeek: completedNodes,
      momentumScore: momentumScore,
      isStalled: stalled,
      lastStudyAt: latestStudy,
    );
  }
}
