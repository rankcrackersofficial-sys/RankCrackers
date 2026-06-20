import 'dart:collection';
import 'dart:math';
import '../../../core/models/mission_context.dart';
import '../../../core/models/node_runtime_state.dart';
import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/atomic_risk_state.dart';
import '../models/crucible_schedule.dart';
import '../models/crucible_protocol_state.dart';

/// 🔱 CRUCIBLE ENGINE (Document 45 Compliant)
/// Sovereign authority for orchestrating the 100-Day Tactical Protocol.
/// Implements Dependency-Aware Sequencing, Momentum Compression, and Atomic Risk Injection.
class CrucibleEngine {
  
  // ===================================================
  // PROTOCOL ORCHESTRATION 🔱
  // ===================================================

  /// Generates the complete tactical roadmap with systemic intelligence.
  static List<CrucibleSchedule> buildProtocolRoadmap({
    required MissionContext context,
    required Map<String, AtomicRiskState> atomicRisks,
  }) {
    final List<MicroTopicNode> allNodes = context.graph.allNodes;
    if (allNodes.isEmpty) return [];

    // 🔱 1. DEPENDENCY-AWARE SEQUENCING (Topological Order)
    final List<MicroTopicNode> sequencedNodes = _topologicalSort(allNodes);

    // 🔱 2. DEADLINE & MOMENTUM COMPRESSION
    final int daysRemaining = context.recruitment.examDate?.difference(DateTime.now()).inDays ?? 100;

    int totalSchedules = 42; 
    if (daysRemaining < 100) {
      totalSchedules = (daysRemaining / 2.4).floor().clamp(14, 42); 
    }

    int nodesPerSchedule = (sequencedNodes.length / totalSchedules).ceil();
    if (nodesPerSchedule < 1) nodesPerSchedule = 1;

    final List<CrucibleSchedule> schedules = [];
    final states = context.states;

    for (int i = 0; i < totalSchedules; i++) {
      final startIndex = i * nodesPerSchedule;
      if (startIndex >= sequencedNodes.length) break;

      final scheduleNodes = sequencedNodes
          .skip(startIndex)
          .take(nodesPerSchedule)
          .map((n) => n.id)
          .toList();

      final scheduleIndex = i + 1;
      final double progress = (scheduleIndex / totalSchedules);
      
      // 🔱 3. PROTOCOL PHASE RATIO LAW
      String type = 'study';
      if (progress > 0.90) {
        type = 'major_test'; 
      } else if (progress > 0.82) {
        type = 'macro_test'; 
      } else if (progress > 0.70) {
        type = 'rebuild';    
      }

      // 🔱 4. ATOMIC RISK INJECTION (Document 29)
      // If systemic weakness is detected early, or a node has high atomic risk, inject rebuilds.
      bool hasHighAtomicRisk = false;
      for (final nodeId in scheduleNodes) {
        final node = context.graph.getNode(nodeId);
        if (node != null) {
          for (final atomicId in node.atomicTopicIds) {
            if ((atomicRisks[atomicId]?.score ?? 0.0) > 75.0) {
              hasHighAtomicRisk = true;
              break;
            }
          }
        }
      }

      if (type == 'study' && (context.risk.weaknessRisk > 0.60 || hasHighAtomicRisk)) {
        if (scheduleIndex % 4 == 0) type = 'rebuild';
      }

      // 🔱 5. GRANULAR SCHEDULE PRIORITY
      double nodePrioritySum = 0.0;
      for (final nodeId in scheduleNodes) {
        final state = states[nodeId];
        final node = context.graph.getNode(nodeId);
        if (node != null) {
          // Priority = Gap * Importance + Peak Atomic Risk
          double peakAtomicRisk = 0.0;
          for (final atomicId in node.atomicTopicIds) {
            peakAtomicRisk = max(peakAtomicRisk, (atomicRisks[atomicId]?.score ?? 0.0) / 100.0);
          }
          nodePrioritySum += ((1.0 - (state?.mastery ?? 0.0)) * node.importance) + peakAtomicRisk;
        }
      }
      final double scheduleBasePriority = scheduleNodes.isEmpty ? 1.0 : (nodePrioritySum / scheduleNodes.length);

      schedules.add(CrucibleSchedule(
        id: 'sch_${context.recruitment.id}_$scheduleIndex',
        recruitmentId: context.recruitment.id,
        scheduleIndex: scheduleIndex,
        nodeIds: scheduleNodes,
        atomicTopicIds: _resolveAtoms(scheduleNodes, context),
        scheduleType: type,
        targetHours: type == 'study' ? 4.0 : 6.0,
        blueprintId: context.blueprint.id,
        digibookSessionId: 'sess_${context.recruitment.id}_$scheduleIndex',
        priorityScore: scheduleBasePriority + (context.risk.overallRisk * 0.5),
      ));
    }

    return schedules;
  }

  /// Extracts Atomic Topic IDs from a list of Micro Topic nodes.
  static List<String> _resolveAtoms(List<String> nodeIds, MissionContext context) {
    final List<String> atoms = [];
    for (var id in nodeIds) {
      final node = context.graph.getNode(id);
      if (node != null) {
        atoms.addAll(node.atomicTopicIds);
      }
    }
    return atoms.toSet().toList(); // Ensure unique IDs
  }

  /// Refreshes the protocol state based on current context and granular risk.
  static CrucibleProtocolState refreshProtocolState({
    required CrucibleProtocolState currentState,
    required MissionContext context,
    required Map<String, NodeRuntimeState> states,
  }) {
    // 🔱 Granular Risk Integration (Document 49)
    final globalRisk = context.risk.overallRisk;
    final weaknessRisk = context.risk.weaknessRisk;
    final bool isStalled = context.momentum.isStalled;

    // Detect Rebuild Need based on combined signal
    String status = currentState.status;
    if (weaknessRisk >= 0.75 || globalRisk >= 0.70) {
      status = 'rebuild';
    }

    return currentState.copyWith(
      status: status,
      isStalled: isStalled,
      lastProgressAt: DateTime.now(),
    );
  }

  // ===================================================
  // INTERNAL UTILITIES 🔱
  // ===================================================

  /// Performs a topological sort to ensure prerequisite-safe ordering.
  static List<MicroTopicNode> _topologicalSort(List<MicroTopicNode> nodes) {
    final Map<String, int> inDegree = {for (var n in nodes) n.id: 0};
    final Map<String, List<String>> adj = {for (var n in nodes) n.id: []};

    for (var node in nodes) {
      for (var preId in node.prerequisiteIds) {
        if (adj.containsKey(preId)) {
          adj[preId]!.add(node.id);
          inDegree[node.id] = inDegree[node.id]! + 1;
        }
      }
    }

    final queue = Queue<String>();
    inDegree.forEach((id, degree) {
      if (depth(id, nodes) == 0) {
        queue.add(id);
      }
    });

    final List<MicroTopicNode> sorted = [];
    while (queue.isNotEmpty) {
      final u = queue.removeFirst();
      final node = nodes.firstWhere((n) => n.id == u);
      sorted.add(node);

      for (var v in adj[u]!) {
        inDegree[v] = inDegree[v]! - 1;
        if (inDegree[v] == 0) {
          queue.add(v);
        }
      }
    }

    // Handle any nodes missed due to cycles or missing internal prerequisites
    if (sorted.length < nodes.length) {
      final missing = nodes.where((n) => !sorted.contains(n)).toList();
      missing.sort((a, b) => b.importance.compareTo(a.importance));
      sorted.addAll(missing);
    }

    return sorted;
  }

  static int depth(String id, List<MicroTopicNode> nodes) {
    final node = nodes.firstWhere((n) => n.id == id);
    return node.prerequisiteIds.where((preId) => nodes.any((n) => n.id == preId)).length;
  }
}
