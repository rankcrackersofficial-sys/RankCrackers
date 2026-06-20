import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/node_runtime_state.dart';

class CrucibleMasterEngine {
  static List<Map<String, dynamic>> generatePlan({
    required List<MicroTopicNode> nodes,
    required Map<String, NodeRuntimeState> states,
  }) {
    // 🔱 Identity Mapping for Foundation Shield & Revision Chain
    final weakNodeIds = nodes.where((n) {
      final state = states[n.id];
      return state != null && state.mastery < 0.50;
    }).map((n) => n.id).toSet();

    // 🔱 Foundation Multiplier: Delay advanced topics with weak prerequisites
    double getFoundationMultiplier(MicroTopicNode node) {
      if (node.prerequisiteIds.isEmpty) return 1.0;
      for (final preId in node.prerequisiteIds) {
        final preNodeState = states[preId];
        if (preNodeState != null && preNodeState.mastery < 0.50) {
          return 0.6; // 🔱 Soft Foundation Penalty
        }
      }
      return 1.0;
    }

    // 🔱 Revision Multiplier: Boost nodes belonging to a struggling chain
    double getRevisionMultiplier(MicroTopicNode node) {
      if (node.revisionChainIds.isEmpty) return 1.0;
      for (final chainId in node.revisionChainIds) {
        if (weakNodeIds.contains(chainId)) {
          return 1.2; // 🔱 Contextual Boost
        }
      }
      return 1.0;
    }

    // 🔱 Unlocker Multiplier: Boost nodes that are foundations for weak areas
    double getUnlockerMultiplier(MicroTopicNode node) {
      if (node.dependentIds.isEmpty) return 1.0;
      for (final depId in node.dependentIds) {
        if (weakNodeIds.contains(depId)) {
          return 1.1; // 🔱 Strategic Unlocker Boost
        }
      }
      return 1.0;
    }

    // 🔱 Strategic Sorting: Factor in Importance, Mastery, Foundations, Chains, and Unlockers
    final sortedNodes = [...nodes];
    sortedNodes.sort((a, b) {
      final aState = states[a.id] ?? NodeRuntimeState(nodeId: a.id);
      final bState = states[b.id] ?? NodeRuntimeState(nodeId: b.id);

      final aBase = a.importance * (1.0 - aState.mastery);
      final bBase = b.importance * (1.0 - bState.mastery);

      final aScore = aBase *
          getFoundationMultiplier(a) *
          getRevisionMultiplier(a) *
          getUnlockerMultiplier(a);

      final bScore = bBase *
          getFoundationMultiplier(b) *
          getRevisionMultiplier(b) *
          getUnlockerMultiplier(b);

      return bScore.compareTo(aScore); // Highest priority score first
    });

    final plan = <Map<String, dynamic>>[];
    int day = 1;

    for (final node in sortedNodes) {
      final state = states[node.id] ?? NodeRuntimeState(nodeId: node.id);
      
      // 🔱 Dynamic Hours based on Importance + Mastery
      double hours;
      if (node.importance >= 8 && state.mastery < 0.5) {
        hours = 4.0; // High Stakes Depth Study
      } else if (state.mastery < 0.3) {
        hours = 3.0;
      } else if (state.mastery < 0.6 || node.importance >= 6) {
        hours = 2.0;
      } else {
        hours = 1.0;
      }

      // 🔱 Dynamic Priority Labels
      String priority;
      if (node.importance >= 9 && state.mastery < 0.4) {
        priority = 'legendary';
      } else if (node.importance >= 7 || state.mastery < 0.3) {
        priority = 'critical';
      } else if (node.importance >= 5 || state.mastery < 0.6) {
        priority = 'medium';
      } else {
        priority = 'normal';
      }

      plan.add({
        'day': day,
        'topicId': node.id,
        'topicName': node.title,
        'mastery': state.mastery,
        'importance': node.importance,
        'hours': hours,
        'priority': priority,
      });

      day++;
    }

    return plan;
  }
}
