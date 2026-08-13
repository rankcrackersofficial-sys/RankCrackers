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

  // ===================================================
  // C1 DETERMINISTIC TRANSITIONS & LIFE CYCLES 🔱
  // ===================================================

  /// Pause the protocol (student interaction paused, sovereign clock continues).
  static CrucibleProtocolState pauseProtocol(CrucibleProtocolState state, DateTime now) {
    if (state.isPaused) return state;
    return state.copyWith(
      isPaused: true,
      pausedAt: now,
      lastProgressAt: now,
    );
  }

  /// Resume the protocol (Sovereign Start Law: protocolStartTime remains unchanged).
  static CrucibleProtocolState resumeProtocol(CrucibleProtocolState state, DateTime now) {
    if (!state.isPaused || state.pausedAt == null) return state;

    return state.copyWith(
      isPaused: false,
      clearPausedAt: true,
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
  /// (Enforces 14-day phase cycles and Never-Wait auto-progression backlog logic)
  static CrucibleProtocolState evaluateState({
    required CrucibleProtocolState state,
    required DateTime now,
    required List<String> completedMicroIds,
    required List<String> completedRebuildIds,
    required List<String> completedMacroIds,
    required bool isMajorTestSubmitted,
    required Map<String, bool> assessmentReadiness,
  }) {
    // 1. If currently paused, student session state is frozen.
    if (state.isPaused) {
      return state;
    }

    final elapsed = now.difference(state.protocolStartTime);

    String status = state.status;
    int phaseIndex = state.phaseIndex;
    int scheduleIndex = state.scheduleIndex;
    DateTime scheduleStartTime = state.scheduleStartTime;
    DateTime currentBoundaryTime = state.currentBoundaryTime;
    String currentScheduleId = state.currentScheduleId;

    if (elapsed.inSeconds >= 100 * 24 * 3600) {
      // Day 101+ Terminal handling.
      if (isMajorTestSubmitted) {
        status = 'completed';
      } else {
        status = 'major_test';
      }
      phaseIndex = 7;
      scheduleIndex = 42;
      scheduleStartTime = state.protocolStartTime.add(const Duration(days: 99));
      currentBoundaryTime = state.protocolStartTime.add(const Duration(days: 100));
    } else if (elapsed.inSeconds >= 99 * 24 * 3600) {
      // Day 100: Major Test (elapsed 99 days to 100 days)
      status = 'major_test';
      phaseIndex = 7;
      scheduleIndex = 42;
      scheduleStartTime = state.protocolStartTime.add(const Duration(days: 99));
      currentBoundaryTime = state.protocolStartTime.add(const Duration(days: 100));
    } else if (elapsed.inSeconds >= 98 * 24 * 3600) {
      // Day 99: Grand Simulation (elapsed 98 days to 99 days)
      status = 'grand_simulation';
      phaseIndex = 7;
      scheduleIndex = 42;
      scheduleStartTime = state.protocolStartTime.add(const Duration(days: 98));
      currentBoundaryTime = state.protocolStartTime.add(const Duration(days: 99));
    } else {
      // Day 1-98 (elapsed 0 days to 98 days)
      phaseIndex = (elapsed.inSeconds ~/ (14 * 24 * 3600)) + 1;
      final phaseStart = state.protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
      final elapsedWithinPhase = now.difference(phaseStart);

      final rebuildStart = const Duration(days: 12);
      final macroStart = const Duration(days: 12, hours: 23); // Day 14, 09:00 AM (12 days + 23 hours)
      final macroEnd = const Duration(days: 13, hours: 1);    // Day 14, 11:00 AM (13 days + 1 hour)
      final phaseEnd = const Duration(days: 14);

      if (elapsedWithinPhase < rebuildStart) {
        status = 'study';
        final int scheduleOffset = elapsedWithinPhase.inHours ~/ 48; // 0 to 5
        scheduleIndex = (phaseIndex - 1) * 6 + scheduleOffset + 1;
        scheduleStartTime = phaseStart.add(Duration(days: scheduleOffset * 2));
        currentBoundaryTime = scheduleStartTime.add(const Duration(hours: 48));
        currentScheduleId = 'sch_${state.recruitmentId}_$scheduleIndex';
      } else if (elapsedWithinPhase < macroStart) {
        status = 'rebuild';
        scheduleIndex = phaseIndex * 6;
        scheduleStartTime = phaseStart.add(rebuildStart);
        currentBoundaryTime = phaseStart.add(macroStart);
      } else if (elapsedWithinPhase < macroEnd) {
        status = 'macro_test';
        scheduleIndex = phaseIndex * 6;
        scheduleStartTime = phaseStart.add(macroStart);
        currentBoundaryTime = phaseStart.add(macroEnd);
      } else {
        status = 'phase_transition_recovery';
        scheduleIndex = phaseIndex * 6;
        scheduleStartTime = phaseStart.add(macroEnd);
        currentBoundaryTime = phaseStart.add(phaseEnd);
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

  /// Generates the temporal metadata slot for a given schedule index.
  static Map<String, dynamic> getTemporalSlotMetadata({
    required int scheduleIndex,
    required DateTime protocolStartTime,
    required List<String> assignedAtoms,
  }) {
    final int phaseIndex = (scheduleIndex - 1) ~/ 6 + 1;
    final int scheduleOffset = (scheduleIndex - 1) % 6;
    final phaseStart = protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
    final learningStart = phaseStart.add(Duration(days: scheduleOffset * 2));
    final microEligibilityStart = learningStart.add(const Duration(hours: 47));
    final microEligibilityEnd = learningStart.add(const Duration(hours: 48));
    final macroId = 'macro_${phaseIndex.toString().padLeft(2, '0')}';

    return {
      'scheduleId': 'sch_jee_main_2027_$scheduleIndex',
      'assignedAtoms': assignedAtoms,
      'learningStart': learningStart,
      'microEligibilityStart': microEligibilityStart,
      'microEligibilityEnd': microEligibilityEnd,
      'phaseId': 'phase_$phaseIndex',
      'macroId': macroId,
    };
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

  // ===================================================
  // ASSESSMENT CONTRACT SEMANTICS 🔱
  // ===================================================

  static DateTime getGrandSimulationDayStart(DateTime protocolStartTime) {
    return protocolStartTime.add(const Duration(days: 98));
  }

  static DateTime getGrandSimulationDayEnd(DateTime protocolStartTime) {
    return protocolStartTime.add(const Duration(days: 99));
  }

  static DateTime getMajorTestDayStart(DateTime protocolStartTime) {
    return protocolStartTime.add(const Duration(days: 99));
  }

  static DateTime getMajorTestDayEnd(DateTime protocolStartTime) {
    return protocolStartTime.add(const Duration(days: 100));
  }

  /// Retrieves the Grand Simulation assessment contract.
  static CrucibleAssessmentContract getGrandSimulationContract({
    CrucibleAssessmentContract? injectedContract,
  }) {
    if (injectedContract != null) {
      return injectedContract;
    }
    // Authoritative rule does not define this yet, remains unresolved
    return const CrucibleAssessmentContract();
  }

  /// Retrieves the Major Examination assessment contract.
  static CrucibleAssessmentContract getMajorTestContract({
    CrucibleAssessmentContract? injectedContract,
  }) {
    if (injectedContract != null) {
      return injectedContract;
    }
    // Authoritative rule does not define this yet, remains unresolved
    return const CrucibleAssessmentContract();
  }
}

class CrucibleAssessmentContract {
  final int? questionCount;
  final Duration? attemptDuration;
  final String? paperStructure;

  const CrucibleAssessmentContract({
    this.questionCount,
    this.attemptDuration,
    this.paperStructure,
  });

  bool get isResolved => questionCount != null && attemptDuration != null && paperStructure != null;
}

