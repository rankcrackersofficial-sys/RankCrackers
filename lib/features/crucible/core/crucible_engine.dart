import 'dart:collection';
import 'dart:math';
import '../../../core/models/mission_context.dart';
import '../../../core/models/node_runtime_state.dart';
import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/atomic_risk_state.dart';
import '../models/crucible_schedule.dart';
import '../models/crucible_protocol_state.dart';
import 'crucible_clock_engine.dart';

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

  // ===================================================
  // C1 DETERMINISTIC TRANSITIONS & LIFE CYCLES 🔱
  // ===================================================

  /// Pause the protocol and store the timestamp.
  static CrucibleProtocolState pauseProtocol(CrucibleProtocolState state, DateTime now) {
    if (state.isPaused) return state;
    return state.copyWith(
      isPaused: true,
      pausedAt: now,
      lastProgressAt: now,
    );
  }

  /// Resume the protocol, shifting absolute timelines by the pause duration.
  static CrucibleProtocolState resumeProtocol(CrucibleProtocolState state, DateTime now) {
    if (!state.isPaused || state.pausedAt == null) return state;

    final pausedMs = now.difference(state.pausedAt!).inMilliseconds;
    final shiftedProtocolStart = state.protocolStartTime.add(Duration(milliseconds: pausedMs));
    final shiftedScheduleStart = state.scheduleStartTime.add(Duration(milliseconds: pausedMs));
    final shiftedBoundary = state.currentBoundaryTime.add(Duration(milliseconds: pausedMs));

    return state.copyWith(
      isPaused: false,
      clearPausedAt: true,
      protocolStartTime: shiftedProtocolStart,
      scheduleStartTime: shiftedScheduleStart,
      currentBoundaryTime: shiftedBoundary,
      pausedDurationMs: state.pausedDurationMs + pausedMs,
      lastProgressAt: now,
    );
  }

  /// Refreshes the protocol state based on current context and granular risk.
  /// (Maintains Document 49 and original signature contract)
  static CrucibleProtocolState refreshProtocolState({
    required CrucibleProtocolState currentState,
    required MissionContext context,
    required Map<String, NodeRuntimeState> states,
  }) {
    final globalRisk = context.risk.overallRisk;
    final weaknessRisk = context.risk.weaknessRisk;
    final bool isStalled = context.momentum.isStalled;

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

  /// Deterministically evaluates state transitions for the 100-Day Crucible protocol.
  static CrucibleProtocolState evaluateState({
    required CrucibleProtocolState state,
    required DateTime now,
    required List<String> completedMicroIds,
    required List<String> completedRebuildIds,
    required List<String> completedMacroIds,
    required bool isMajorTestPassed,
    required Map<String, bool> assessmentReadiness,
  }) {
    // 1. If currently paused, time and state transitions are frozen.
    if (state.isPaused) {
      return state;
    }

    final int currentDay = CrucibleClockEngine.getProtocolDay(state: state, now: now);

    // Day 100+ Terminal handling.
    if (currentDay > 100) {
      if (isMajorTestPassed) {
        return state.copyWith(status: 'completed', lastProgressAt: now);
      }
      final bool isMajorReady = assessmentReadiness['major_test_final'] ?? false;
      if (isMajorReady) {
        return state.copyWith(status: 'major_test', lastProgressAt: now);
      } else {
        // blocked on academic readiness
        return state.copyWith(status: 'major_test', lastProgressAt: now);
      }
    }

    String status = state.status;
    int phaseIndex = state.phaseIndex;
    int scheduleIndex = state.scheduleIndex;
    DateTime scheduleStartTime = state.scheduleStartTime;
    DateTime currentBoundaryTime = state.currentBoundaryTime;
    String currentScheduleId = state.currentScheduleId;

    if (status == 'study') {
      final elapsed = now.difference(scheduleStartTime);
      final bool learningComplete = elapsed >= const Duration(hours: 47);

      if (learningComplete) {
        final microId = 'micro_${scheduleIndex.toString().padLeft(2, '0')}';
        final bool microCompleted = completedMicroIds.contains(microId);

        if (microCompleted) {
          // Transition depending on phase boundary
          if (scheduleIndex % 6 == 0) {
            status = 'rebuild';
            scheduleStartTime = now;
            currentBoundaryTime = now.add(const Duration(hours: 48));
          } else {
            scheduleIndex += 1;
            status = 'study';
            scheduleStartTime = now;
            currentBoundaryTime = now.add(const Duration(hours: 48));
            currentScheduleId = 'sch_${state.recruitmentId}_$scheduleIndex';
          }
        } else {
          // Gated by Academic Readiness of the Micro Test
          final bool isReady = assessmentReadiness[microId] ?? false;
          if (isReady) {
            // Can display micro_test transition screen
          } else {
            // Blocked on academic readiness - remains stuck here
          }
        }
      }
    } else if (status == 'rebuild') {
      final elapsed = now.difference(scheduleStartTime);
      final bool rebuildCompleted = elapsed >= const Duration(hours: 48) || 
          completedRebuildIds.contains('rebuild_window_$phaseIndex');

      if (rebuildCompleted) {
        status = 'macro_test';
        scheduleStartTime = now;
        currentBoundaryTime = now.add(const Duration(hours: 24));
      }
    } else if (status == 'macro_test') {
      final macroId = 'macro_test_$phaseIndex';
      final bool macroCompleted = completedMacroIds.contains(macroId);

      if (macroCompleted) {
        if (phaseIndex == 7) {
          status = 'major_test';
          scheduleStartTime = now;
          currentBoundaryTime = now.add(const Duration(hours: 24));
        } else {
          phaseIndex += 1;
          scheduleIndex += 1;
          status = 'study';
          scheduleStartTime = now;
          currentBoundaryTime = now.add(const Duration(hours: 48));
          currentScheduleId = 'sch_${state.recruitmentId}_$scheduleIndex';
        }
      } else {
        // Gated by Academic Readiness of the Macro Test
        final bool isReady = assessmentReadiness[macroId] ?? false;
        if (isReady) {
          // Macro test is ready to take
        } else {
          // Blocked on academic readiness
        }
      }
    } else if (status == 'major_test') {
      if (isMajorTestPassed) {
        status = 'completed';
      } else {
        // Gated by Academic Readiness of the Major Test
        final bool isReady = assessmentReadiness['major_test_final'] ?? false;
        if (isReady) {
          // Major test is ready to take
        } else {
          // Blocked on academic readiness
        }
      }
    }

    return state.copyWith(
      phaseIndex: phaseIndex,
      scheduleIndex: scheduleIndex,
      currentScheduleId: currentScheduleId,
      status: status,
      scheduleStartTime: scheduleStartTime,
      currentBoundaryTime: currentBoundaryTime,
      lastProgressAt: now,
    );
  }

  /// Calculates the lifecycle state of a target schedule dynamically.
  static String getScheduleLifecycleState({
    required CrucibleProtocolState state,
    required int targetScheduleIndex,
    required DateTime now,
    required List<String> completedMicroIds,
  }) {
    final microId = 'micro_${targetScheduleIndex.toString().padLeft(2, '0')}';
    final bool microCompleted = completedMicroIds.contains(microId);

    if (targetScheduleIndex < state.scheduleIndex || microCompleted) {
      return 'schedule-complete';
    }

    if (targetScheduleIndex > state.scheduleIndex) {
      return 'locked';
    }

    // Currently active schedule index
    if (state.status != 'study') {
      return 'upcoming';
    }

    final elapsed = now.difference(state.scheduleStartTime);
    if (elapsed < const Duration(hours: 47)) {
      return 'active';
    } else if (elapsed < const Duration(hours: 48)) {
      return 'micro-test-required';
    } else {
      return 'overdue';
    }
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
