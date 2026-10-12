import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/session/session_manager.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../opportunities/providers/sentinel_intelligence_provider.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../crucible/core/battle_engine.dart';
import '../../../../core/models/coverage_state.dart';
import '../../../../core/models/risk_state.dart';
import '../../../../core/models/readiness_state.dart';
import '../../../../core/models/momentum_state.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../providers/dashboard_provider.dart';
import '../widgets/battle_tools/battle_tools_grid.dart';
import '../widgets/archive/archive_preview_card.dart';
import '../widgets/notifications/latest_updates_card.dart';
import '../../../../shared/widgets/command_header.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen(
      {super.key, this.disableKnowledgeEngineInitForTest = false});

  final bool disableKnowledgeEngineInitForTest;

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String userName = 'Warrior';
  String examName = 'UNSPECIFIED MISSION';
  String? userPhoto;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadData();
    if (!widget.disableKnowledgeEngineInitForTest) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!KnowledgeEngine.instance.isInitialized &&
            !KnowledgeEngine.instance.isLoading) {
          KnowledgeEngine.instance.initialize();
        }
      });
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    final name = await SessionManager.getStudentName();
    final photo = await SessionManager.getStudentPhoto();
    final eName = await SessionManager.getExamName();
    if (!mounted) return;
    setState(() {
      userName = name ?? 'Warrior';
      userPhoto = photo;
      examName = eName ?? 'Mission';
    });
  }

  @override
  Widget build(BuildContext context) {
    final knowledge = ref.watch(knowledgeEngineProvider);
    final selectedSession = ref.watch(activeSessionUserProvider);
    final metricsAreCurrent = hasCurrentSessionMissionMetrics(
      selectedMissionId: selectedSession.examId,
      engineMissionId: knowledge.activeRecruitment?.examId,
      metricsBoundToSession: knowledge.isMetricsValidForCurrentSession(),
    );
    final coverage = metricsAreCurrent ? knowledge.coverageState : null;
    final risk = metricsAreCurrent ? knowledge.riskState : null;
    final momentum = metricsAreCurrent ? knowledge.momentumState : null;
    final readiness = ref.watch(missionReadinessProvider);
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
    final nodes = ref.watch(allNodesProvider);

    final hasHeaderEvidence =
        nodes.isNotEmpty && coverage != null && coverage.totalNodes > 0;

    final priorityNode = metricsAreCurrent
        ? BattleEngine.getPriorityNode(
            nodes,
            knowledge.nodeStates,
            riskFactor: risk?.overallRisk ?? 0.0,
          )
        : null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: CustomScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            slivers: [
              // 🔱 FOLD 1: Command Level
              SliverToBoxAdapter(
                child: CommandHeader(
                  userName: sessionUser?.name ?? userName,
                  userPhoto: sessionUser?.photo ?? userPhoto,
                  examName: sessionUser?.examName ?? examName,
                  readiness: readiness,
                  momentum: momentum,
                  missionEvidenceVerified: hasHeaderEvidence,
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                      horizontal: ResponsiveHelper.wp(context, 0.05)),
                  child: _buildPreparationStatusSection(
                      coverage, risk, readiness, momentum, nodes, knowledge),
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      12,
                      ResponsiveHelper.wp(context, 0.05),
                      0),
                  child: _buildTodayFocusSection(priorityNode, knowledge),
                ),
              ),

              // 🔱 FOLD 2: Core Pillars
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      ResponsiveHelper.sectionSpacing(context),
                      ResponsiveHelper.wp(context, 0.05),
                      8),
                  child: Text('MISSION HUB',
                      style: AppTypography.label.copyWith(
                          fontSize: 11,
                          letterSpacing: 1.2,
                          fontWeight: FontWeight.bold,
                          color: Colors.white70)),
                ),
              ),

              SliverPadding(
                padding: EdgeInsets.symmetric(
                    horizontal: ResponsiveHelper.wp(context, 0.05)),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: _compactPillarCard(
                              Icons.local_fire_department,
                              'THE CRUCIBLE',
                              () => context.go(AppRoutes.crucible),
                              color: Colors.orangeAccent,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _compactPillarCard(
                              Icons.menu_book_rounded,
                              'DIGIBOOK',
                              () => context.go(
                                AppRoutes.digibook,
                                extra: priorityNode,
                              ),
                              color: Colors.blueAccent,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _compactPillarCard(
                              Icons.fact_check_outlined,
                              'SYLLABUS',
                              () => context.go(AppRoutes.syllabus),
                              color: AppColors.gold,
                              secondary: true,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _compactPillarCard(
                              Icons.work_outline_rounded,
                              'CAREER SIGNALS',
                              () => context.push(AppRoutes.opportunities),
                              color: Colors.cyanAccent,
                              secondary: true,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // 🔱 FOLD 3: Battle Tools (P0/P1 Compact Layout)
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      ResponsiveHelper.sectionSpacing(context),
                      ResponsiveHelper.wp(context, 0.05),
                      8),
                  child: Text('BATTLE TOOLS',
                      style: AppTypography.label.copyWith(
                          fontSize: 11,
                          letterSpacing: 1.2,
                          fontWeight: FontWeight.bold,
                          color: Colors.white70)),
                ),
              ),

              SliverPadding(
                padding: EdgeInsets.symmetric(
                    horizontal: ResponsiveHelper.wp(context, 0.05)),
                sliver: const SliverToBoxAdapter(
                  child: BattleToolsGrid(),
                ),
              ),

              // 🔱 FOLD 4: Intelligence Stream
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      ResponsiveHelper.sectionSpacing(context),
                      ResponsiveHelper.wp(context, 0.05),
                      8),
                  child: Text('LATEST UPDATES',
                      style: AppTypography.label.copyWith(
                          fontSize: 11,
                          letterSpacing: 1.2,
                          fontWeight: FontWeight.bold,
                          color: Colors.white70)),
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(
                      horizontal: ResponsiveHelper.wp(context, 0.05)),
                  child: Consumer(
                    builder: (context, ref, _) {
                      final notifsAsync = ref.watch(notificationListProvider);
                      return notifsAsync.maybeWhen(
                        data: (notifs) {
                          if (notifs.isEmpty) return const SizedBox.shrink();
                          final latest = notifs.first;
                          return LatestUpdatesCard(item: {
                            'tag': latest.source.toUpperCase(),
                            'title': latest.title,
                            'meta': 'Just now'
                          });
                        },
                        orElse: () => const SizedBox.shrink(),
                      );
                    },
                  ),
                ),
              ),



              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      12,
                      ResponsiveHelper.wp(context, 0.05),
                      0),
                  child: const ArchivePreviewCard(),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _compactPillarCard(IconData icon, String label, VoidCallback onTap,
      {required Color color, bool secondary = false}) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: color.withValues(alpha: secondary ? 0.85 : 1.0),
              size: secondary ? 22 : 24,
            ),
            const SizedBox(height: 6),
            Text(label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.label.copyWith(
                    fontSize: secondary ? 11 : 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white)),
          ],
        ),
      ),
    );
  }

  Widget _buildTodayFocusSection(
      MicroTopicNode? priorityNode, KnowledgeEngine knowledge) {
    final state =
        priorityNode != null ? knowledge.getState(priorityNode.id) : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("TODAY'S PRIORITY",
            style: AppTypography.label.copyWith(
                fontSize: 11,
                letterSpacing: 1.0,
                fontWeight: FontWeight.bold,
                color: Colors.white70)),
        const SizedBox(height: 8),
        DarkCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                        priorityNode?.title ??
                            'Your first priority unlocks after the first assessment',
                        style: AppTypography.cardTitle.copyWith(
                            fontSize: 14,
                            color: Colors.white,
                            fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text(
                        priorityNode == null
                            ? 'No weakness has been inferred yet. Start learning to build your map.'
                            : state == null
                                ? 'Mastery evidence pending. Start learning to build a real priority signal.'
                                : 'Target: ${(state.mastery * 100).toInt()}% Mastery',
                        style: AppTypography.body.copyWith(
                            fontSize: 12.5,
                            color: Colors.white70,
                            height: 1.35)),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward_ios_rounded,
                  color: AppColors.gold, size: 14),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPreparationStatusSection(
      CoverageState? coverage,
      RiskState? risk,
      ReadinessState? readiness,
      MomentumState? momentum,
      List<MicroTopicNode> nodes,
      KnowledgeEngine knowledge) {
    final hasMissionNodes = nodes.isNotEmpty;
    final hasCoverageEvidence =
        hasMissionNodes && coverage != null && coverage.totalNodes > 0;
    final hasMomentumEvidence =
        momentum != null && momentum.studyStreakDays > 0;
    final hasRiskEvidence = hasCoverageEvidence && risk != null;
    final hasReadinessEvidence = hasCoverageEvidence && readiness != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "MISSION STATUS",
          style: AppTypography.label.copyWith(
            fontSize: 11,
            letterSpacing: 1.2,
            fontWeight: FontWeight.bold,
            color: Colors.white70,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _isolatedStatusCard(
                label: "READINESS",
                value: hasReadinessEvidence ? "${readiness.score.toInt()}%" : "Pending",
                color: AppColors.gold,
                icon: Icons.military_tech_rounded,
                isPending: !hasReadinessEvidence,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _isolatedStatusCard(
                label: "COVERAGE",
                value: hasCoverageEvidence ? "${(coverage.coveragePercent * 100).toInt()}%" : "Pending",
                color: Colors.lightBlueAccent,
                icon: Icons.track_changes_rounded,
                isPending: !hasCoverageEvidence,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _isolatedStatusCard(
                label: "STREAK",
                value: hasMomentumEvidence ? "${momentum.studyStreakDays}d" : "Pending",
                color: Colors.orangeAccent,
                icon: Icons.local_fire_department_rounded,
                isPending: !hasMomentumEvidence,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _isolatedStatusCard(
                label: "RISK",
                value: hasRiskEvidence
                    ? (risk.highRisk ? "HIGH" : "LOW")
                    : "Pending",
                color: hasRiskEvidence
                    ? (risk.highRisk ? Colors.redAccent : Colors.greenAccent)
                    : Colors.white,
                icon: Icons.shield_outlined,
                isPending: !hasRiskEvidence,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _isolatedStatusCard({
    required String label,
    required String value,
    required Color color,
    required IconData icon,
    required bool isPending,
  }) {
    return DarkCard(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: Border.all(
        color: isPending
            ? AppColors.borderSoft
            : color.withValues(alpha: 0.35),
        width: 1.0,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.cardTitle.copyWith(
                  fontSize: 11.5,
                  letterSpacing: 1.1,
                  fontWeight: FontWeight.w700,
                  color: Colors.white70,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Icon(icon, color: color, size: 14),
              ),
            ],
          ),
          const SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: isPending
                ? Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.gold.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
                    ),
                    child: Text(
                      'Pending Evidence',
                      maxLines: 1,
                      style: AppTypography.label.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.gold.withValues(alpha: 0.8),
                        letterSpacing: 0.4,
                      ),
                    ),
                  )
                : Text(
                    value,
                    maxLines: 1,
                    style: AppTypography.hero.copyWith(
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      color: color,
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
