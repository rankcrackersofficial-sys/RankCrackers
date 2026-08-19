import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/utils/app_routes.dart'; // 🔱 Route import
import '../widgets/battle_engine_card.dart';
import '../widgets/mission_blueprint_card.dart';
import '../widgets/rebuild_zone_card.dart';
import '../widgets/tactical_roadmap_card.dart';
import '../widgets/live_timer_card.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../../shared/widgets/command_header.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/knowledge/coverage_engine.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';
import '../../core/crucible_clock_engine.dart';
import '../../core/battle_engine.dart';
import '../../core/crucible_master_engine.dart';
import '../providers/crucible_state_provider.dart';
import '../../models/crucible_protocol_state.dart';

/// 🔱 CRUCIBLE SCREEN
/// The tactical heart of the RankCrackers ecosystem.
class CrucibleScreen extends ConsumerStatefulWidget {
  const CrucibleScreen({super.key});

  @override
  ConsumerState<CrucibleScreen> createState() => _CrucibleScreenState();
}

class _CrucibleScreenState extends ConsumerState<CrucibleScreen> {
  String selectedExamId = 'ras';
  String selectedVariantId = '';

  @override
  void initState() {
    super.initState();
    loadMission();
  }

  Future<void> loadMission() async {
    final examId = await SessionManager.getExamId();
    final variantId = await SessionManager.getVariantId();
    if (mounted) {
      setState(() {
        selectedExamId = examId ?? 'ras';
        selectedVariantId = variantId ?? '';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final knowledge = KnowledgeEngine.instance;
    final states = knowledge.nodeStates;
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
    final readiness = ref.watch(missionReadinessProvider);
    final momentum = knowledge.momentumState;

    ref.listen<AsyncValue<SessionUser>>(sessionUserProvider, (previous, next) {
      if (next.hasValue) {
        loadMission();
      }
    });

    final protocolStateAsync = ref.watch(crucibleProtocolStateProvider);
    final protocolState = protocolStateAsync.valueOrNull ??
        CrucibleProtocolState(
          recruitmentId: selectedExamId,
          phaseIndex: 2,
          scheduleIndex: 1,
          currentScheduleId: 'sch_${selectedExamId}_1',
          status: 'study',
          scheduleStartTime: DateTime.now().subtract(const Duration(days: 16)),
          protocolStartTime: DateTime.now().subtract(const Duration(days: 16)),
          currentBoundaryTime: DateTime.now().add(const Duration(hours: 48)),
          isVIP: false,
          isStalled: false,
          lastProgressAt: DateTime.now(),
        );

    final currentDay = CrucibleClockEngine.getProtocolDay(state: protocolState, now: DateTime.now());
    final currentPhase = protocolState.phaseIndex;
    final progress = (currentDay / 99).clamp(0.0, 1.0);

    final nodes = knowledge.allNodes
        .where((e) => e.examId.toLowerCase() == selectedExamId.toLowerCase())
        .toList();

    final currentCycleDay = currentDay;
    final phase = currentPhase;

    final coverage = CoverageEngine.calculate(
      examId: selectedExamId,
      variantId: selectedVariantId,
      nodes: nodes,
      states: states,
      atomicStates: knowledge.atomicCoverageStates,
    );

    final hasCrucibleEvidence = nodes.isNotEmpty && coverage.totalNodes > 0;

    final plan =
        CrucibleMasterEngine.generatePlan(nodes: nodes, states: states);

    final missions = hasCrucibleEvidence
        ? (plan.isEmpty
            ? ['Awaiting tactical generation...']
            : plan.take(3).map((e) => e['topicName'].toString()).toList())
        : ['EVIDENCE PENDING'];
    final missionComplete =
        hasCrucibleEvidence ? coverage.coveragePercent : 0.0;
    final pending = hasCrucibleEvidence ? 1.0 - coverage.coveragePercent : 0.0;
    final weakCount = hasCrucibleEvidence ? coverage.weakNodes : 0;
    final weakAreas =
        hasCrucibleEvidence ? weakCount / coverage.totalNodes : 0.0;

    final priorityNode = BattleEngine.getPriorityNode(
      nodes,
      states,
      riskFactor: knowledge.riskState?.overallRisk ?? 0.0,
    );

    final macroTestActive =
        CrucibleClockEngine.isMacroTestWindow(enrollmentTime: protocolState.protocolStartTime);
    final rebuildMode =
        CrucibleClockEngine.isRebuildPhase(enrollmentTime: protocolState.protocolStartTime);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CommandHeader(
                  userName: sessionUser?.name ?? 'Warrior',
                  userPhoto: sessionUser?.photo,
                  examName: sessionUser?.examName ?? selectedExamId,
                  readiness: readiness,
                  momentum: momentum,
                  missionEvidenceVerified: hasCrucibleEvidence,
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.screenPadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 16),
                      Text('THE CRUCIBLE',
                          style: AppTypography.hero.copyWith(fontSize: 22)),
                      const SizedBox(height: 6),
                      Text(
                          '100 Day Tactical Ascension Protocol • Day $currentDay',
                          style: AppTypography.label),
                      const SizedBox(height: 28),
                      LiveTimerCard(
                          day: currentCycleDay,
                          phase: phase,
                          protocolState: protocolState),
                      const SizedBox(height: 24),
                      BattleEngineCard(
                        dayCount: currentDay,
                        progress: progress,
                        missionComplete: missionComplete,
                        pending: pending,
                        weakAreas: weakAreas,
                        activeTopics: missions,
                        hasEvidence: hasCrucibleEvidence,
                      ),
                      const SizedBox(height: 24),
                      MissionBlueprintCard(
                        hasEvidence: hasCrucibleEvidence,
                        missions: plan.map((e) {
                          final nodeId = e['topicId'].toString();
                          final node = knowledge.getNode(nodeId);

                          return {
                            'subject': e['topicName'],
                            'topics': 'Study Hours: ${e['hours']}',
                            'completed': 'In Progress',
                            'running': e['priority'].toString().toUpperCase(),
                            'locked': 'Next Session',
                            'onTap': node != null
                                ? () =>
                                    context.go(AppRoutes.digibook, extra: node)
                                : null,
                          };
                        }).toList(),
                      ),
                      const SizedBox(height: 24),
                      if (macroTestActive)
                        Container(
                          margin: const EdgeInsets.only(bottom: 20),
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.red.withValues(alpha: 0.08),
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                                color: Colors.red.withValues(alpha: 0.2)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.warning_amber, color: Colors.red),
                              SizedBox(width: 12),
                              Expanded(
                                  child: Text('Macro Test Window Active',
                                      style: TextStyle(
                                          color: Colors.red,
                                          fontWeight: FontWeight.bold))),
                            ],
                          ),
                        ),
                      if (rebuildMode) ...[
                        RebuildZoneCard(
                            weakZones: weakCount,
                            priorityTopic: priorityNode?.title ?? 'No Risk'),
                        const SizedBox(height: 24),
                      ],
                      TacticalRoadmapCard(
                        roadmap: [
                          {
                            'day': 'DAY $currentDay',
                            'firstTask': hasCrucibleEvidence &&
                                    missions.isNotEmpty &&
                                    missions[0] !=
                                        'Awaiting tactical generation...'
                                ? missions[0]
                                : 'EVIDENCE PENDING',
                            'secondTask':
                                hasCrucibleEvidence && missions.length > 1
                                    ? missions[1]
                                    : 'EVIDENCE PENDING',
                            'thirdTask': hasCrucibleEvidence
                                ? 'Revision Cycle'
                                : 'EVIDENCE PENDING',
                            'locked': false,
                          },
                          {
                            'day': 'DAY ${currentDay + 1}',
                            'firstTask':
                                hasCrucibleEvidence && missions.length > 2
                                    ? missions[2]
                                    : 'EVIDENCE PENDING',
                            'secondTask': hasCrucibleEvidence
                                ? 'Subject Drill'
                                : 'EVIDENCE PENDING',
                            'thirdTask': hasCrucibleEvidence
                                ? 'Daily Battle'
                                : 'EVIDENCE PENDING',
                            'locked': false,
                          },
                          {
                            'day': 'DAY ${currentDay + 2}',
                            'firstTask': '',
                            'secondTask': '',
                            'thirdTask': '',
                            'locked': true,
                          },
                        ],
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
