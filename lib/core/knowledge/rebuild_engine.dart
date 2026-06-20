import '../models/micro_topic_node.dart';
import '../models/node_runtime_state.dart';
import '../models/rebuild_candidate.dart'; // 🔱 Audit Fix
import 'mastery_decay_engine.dart';

/// 🔱 REBUILD ENGINE
/// Identifies and ranks nodes that require critical recovery.
/// Constitutionally State-Aware.
class RebuildEngine {
  static List<RebuildCandidate> generateQueue({
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
  }) {
    final List<RebuildCandidate> queue = [];

    for (final node in nodes) {
      final state = states[node.id];
      if (state == null) continue;

      String? reason;
      
      // 🔱 Rule 1: Mastery Collapse (Article 12)
      if (state.mastery < 0.50) {
        reason = 'low_mastery';
      } 
      // 🔱 Rule 2: Battle Failure Rate
      else if (state.battlesLost >= 2 && (state.battlesWon / (state.battlesWon + state.battlesLost)) < 0.4) {
        reason = 'failed_battles';
      }
      // 🔱 Rule 3: Retention Collapse (Article 13)
      else if (MasteryDecayEngine.calculateRetention(lastEvidenceAt: state.lastReviewed ?? DateTime.fromMillisecondsSinceEpoch(0)) < 0.3) {
        reason = 'retention_collapse';
      }

      if (reason != null) {
        // 🔱 Rebuild score formula: ((1 - mastery) * 50) + (importance * 3) + (difficulty * 2)
        final priorityScore = ((1.0 - state.mastery) * 50.0) +
            (node.importance * 3.0) +
            (node.difficulty * 2.0);

        queue.add(
          RebuildCandidate(
            nodeId: node.id,
            reason: reason,
            identifiedAt: DateTime.now(),
            priorityScore: priorityScore,
          ),
        );
      }
    }

    // Sort by priority score descending (Highest Risk First)
    queue.sort((a, b) => b.priorityScore.compareTo(a.priorityScore));

    return queue;
  }
}
