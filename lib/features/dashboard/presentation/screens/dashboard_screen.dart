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
import '../../../opportunities/presentation/widgets/sentinel_intelligence_card.dart';

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
    final coverage = knowledge.coverageState;
    final risk = knowledge.riskState;
    final momentum = knowledge.momentumState;
    final readiness = ref.watch(missionReadinessProvider);
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
    final nodes = ref.watch(allNodesProvider);

    final hasHeaderEvidence =
        nodes.isNotEmpty && coverage != null && coverage.totalNodes > 0;

    final priorityNode = BattleEngine.getPriorityNode(
      nodes,
      knowledge.nodeStates,
      riskFactor: risk?.overallRisk ?? 0.0,
    );

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
                          fontSize: 8,
                          letterSpacing: 1.2,
                          color: Colors.white12)),
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
                              () => context.push(AppRoutes.crucible),
                              color: Colors.orangeAccent,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _compactPillarCard(
                              Icons.menu_book_rounded,
                              'DIGIBOOK',
                              () => context.push(
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
                              Icons.account_tree_rounded,
                              'SYLLABUS',
                              () => context.push(AppRoutes.syllabus),
                              color: Colors.purpleAccent,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: _compactPillarCard(
                              Icons.travel_explore_rounded,
                              'CAREER SIGNALS',
                              () => context.push(AppRoutes.recruitment),
                              color: AppColors.gold,
                              secondary: true,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              // 🔱 FOLD 3: Battle Tools
              SliverPadding(
                padding: EdgeInsets.fromLTRB(
                    ResponsiveHelper.wp(context, 0.05),
                    ResponsiveHelper.sectionSpacing(context),
                    ResponsiveHelper.wp(context, 0.05),
                    0),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("BATTLE TOOLS",
                          style: AppTypography.label
                              .copyWith(fontSize: 8, color: Colors.white12)),
                      const SizedBox(height: 12),
                      const BattleToolsGrid(),
                    ],
                  ),
                ),
              ),

              // 🔱 FOLD 4: Intelligence & Feed
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      ResponsiveHelper.sectionSpacing(context),
                      ResponsiveHelper.wp(context, 0.05),
                      0),
                  child: const SentinelIntelligenceCard(),
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(
                      ResponsiveHelper.wp(context, 0.05),
                      12,
                      ResponsiveHelper.wp(context, 0.05),
                      0),
                  child: Consumer(
                    builder: (context, ref, child) {
                      final notificationsAsync =
                          ref.watch(notificationListProvider);
                      return notificationsAsync.maybeWhen(
                        data: (list) {
                          if (list.isEmpty) return const SizedBox.shrink();
                          final latest = list.first;
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
        padding: EdgeInsets.zero,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: color.withValues(alpha: secondary ? 0.48 : 0.68),
              size: secondary ? 16 : 18,
            ),
            const SizedBox(height: 2),
            Text(label,
                textAlign: TextAlign.center,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppTypography.label.copyWith(
                    fontSize: secondary ? 6.4 : 7,
                    fontWeight: FontWeight.bold,
                    color: secondary ? Colors.white54 : Colors.white70)),
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
                fontSize: 8, letterSpacing: 1.0, color: Colors.white30)),
        const SizedBox(height: 8),
        DarkCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                        priorityNode?.title ??
                            'Your first priority unlocks after the first assessment',
                        style: AppTypography.cardTitle.copyWith(fontSize: 13)),
                    Text(
                        priorityNode == null
                            ? 'No weakness has been inferred yet. Start learning to build your map.'
                            : state == null
                                ? 'Mastery evidence pending. Start learning to build a real priority signal.'
                                : 'Target: ${(state.mastery * 100).toInt()}% Mastery',
                        style: AppTypography.body
                            .copyWith(fontSize: 9, color: Colors.white38)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded,
                  color: Colors.white10, size: 12),
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
        Text("MISSION STATUS",
            style: AppTypography.label.copyWith(
                fontSize: 8, letterSpacing: 1.0, color: Colors.white30)),
        const SizedBox(height: 8),
        DarkCard(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _statusItem(
                "READINESS",
                hasReadinessEvidence
                    ? "${readiness.score.toInt()}%"
                    : "PENDING",
                hasReadinessEvidence ? AppColors.gold : Colors.white38,
              ),
              _statusItem(
                "COVERAGE",
                hasCoverageEvidence
                    ? "${(coverage.coveragePercent * 100).toInt()}%"
                    : "PENDING",
                hasCoverageEvidence ? Colors.blueAccent : Colors.white38,
              ),
              _statusItem(
                "STREAK",
                hasMomentumEvidence
                    ? "${momentum.studyStreakDays}d"
                    : "PENDING",
                hasMomentumEvidence ? Colors.orangeAccent : Colors.white38,
              ),
              _statusItem(
                "RISK",
                hasRiskEvidence
                    ? risk.highRisk
                        ? "HIGH"
                        : "LOW"
                    : "PENDING",
                hasRiskEvidence
                    ? risk.highRisk
                        ? Colors.redAccent
                        : Colors.greenAccent
                    : Colors.white38,
                showBorder: false,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statusItem(String label, String value, Color color, {bool showBorder = true}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 4),
        decoration: BoxDecoration(
          border: showBorder
              ? const Border(right: BorderSide(color: Colors.white10, width: 1.0))
              : null,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                value,
                maxLines: 1,
                textAlign: TextAlign.center,
                style: AppTypography.hero.copyWith(fontSize: 16, color: color),
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: AppTypography.label.copyWith(
                fontSize: 9,
                letterSpacing: 0.5,
                color: Colors.white38,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
