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
import '../providers/dashboard_scroll_provider.dart';
import '../widgets/battle_tools/battle_tools_grid.dart';
import '../widgets/archive/archive_preview_card.dart';
import '../widgets/notifications/latest_updates_card.dart';
import '../../../../shared/widgets/tactical_button.dart';
import '../../../../shared/widgets/command_header.dart';
import '../../../opportunities/providers/opportunity_stats_provider.dart';
import '../../../opportunities/providers/opportunity_match_provider.dart';
import '../../../deep_profile/providers/warrior_profile_provider.dart';
import '../../../opportunities/presentation/widgets/sentinel_intelligence_card.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String userName = 'Warrior';
  String examName = 'UNSPECIFIED MISSION'; 
  String? userPhoto;

  final ScrollController _scrollController = ScrollController();
  
  final GlobalKey _crucibleKey = GlobalKey();
  final GlobalKey _digibookKey = GlobalKey();
  final GlobalKey _syllabusKey = GlobalKey();
  final GlobalKey _opportunitiesKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _loadData();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!KnowledgeEngine.instance.isInitialized && !KnowledgeEngine.instance.isLoading) {
        KnowledgeEngine.instance.initialize();
      }
    });
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
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.05)),
                  child: _buildPreparationStatusSection(coverage, risk, readiness, momentum, nodes, knowledge),
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 12, ResponsiveHelper.wp(context, 0.05), 0),
                  child: _buildTodayFocusSection(priorityNode, knowledge),
                ),
              ),
              
              // 🔱 FOLD 2: Core Pillars
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), ResponsiveHelper.sectionSpacing(context), ResponsiveHelper.wp(context, 0.05), 8),
                  child: Text('MISSION HUB', style: AppTypography.label.copyWith(fontSize: 8, letterSpacing: 1.2, color: Colors.white12)),
                ),
              ),

              SliverPadding(
                padding: EdgeInsets.symmetric(horizontal: ResponsiveHelper.wp(context, 0.05)),
                sliver: SliverGrid.count(
                  crossAxisCount: 2,
                  crossAxisSpacing: 10,
                  mainAxisSpacing: 10,
                  childAspectRatio: 2.2,
                  children: [
                    _compactPillarCard(Icons.local_fire_department, 'PRACTICE', () => context.go(AppRoutes.crucible), color: Colors.orangeAccent),
                    _compactPillarCard(Icons.menu_book_rounded, 'DIGIBOOK', () => context.go(AppRoutes.digibook, extra: priorityNode), color: Colors.blueAccent),
                    _compactPillarCard(Icons.account_tree_rounded, 'SYLLABUS', () => context.go(AppRoutes.syllabus), color: Colors.purpleAccent),
                    _compactPillarCard(Icons.rocket_launch_rounded, 'JOBS', () => context.go(AppRoutes.recruitment), color: AppColors.gold),
                  ],
                ),
              ),

              // 🔱 FOLD 3: Battle Tools
              SliverPadding(
                padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), ResponsiveHelper.sectionSpacing(context), ResponsiveHelper.wp(context, 0.05), 0),
                sliver: SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text("BATTLE TOOLS", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white12)),
                      const SizedBox(height: 12),
                      const BattleToolsGrid(),
                    ],
                  ),
                ),
              ),

              // 🔱 FOLD 4: Intelligence & Feed
              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), ResponsiveHelper.sectionSpacing(context), ResponsiveHelper.wp(context, 0.05), 0),
                  child: const SentinelIntelligenceCard(),
                ),
              ),

              SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 12, ResponsiveHelper.wp(context, 0.05), 0),
                  child: Consumer(
                    builder: (context, ref, child) {
                      final notificationsAsync = ref.watch(notificationListProvider);
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
                  padding: EdgeInsets.fromLTRB(ResponsiveHelper.wp(context, 0.05), 12, ResponsiveHelper.wp(context, 0.05), 0),
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

  Widget _compactPillarCard(IconData icon, String label, VoidCallback onTap, {required Color color}) {
    return GestureDetector(
      onTap: onTap,
      child: DarkCard(
        padding: EdgeInsets.zero,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color.withValues(alpha: 0.6), size: 18),
            const SizedBox(height: 2),
            Text(label, style: AppTypography.label.copyWith(fontSize: 7, fontWeight: FontWeight.bold, color: Colors.white70)),
          ],
        ),
      ),
    );
  }

  Widget _buildTodayFocusSection(MicroTopicNode? priorityNode, KnowledgeEngine knowledge) {
    final state = priorityNode != null ? knowledge.getState(priorityNode.id) : null;
    final masteryValue = state?.mastery ?? 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("TODAY'S PRIORITY", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white12)),
        const SizedBox(height: 8),
        DarkCard(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(priorityNode?.title ?? 'No Active Weakness', style: AppTypography.cardTitle.copyWith(fontSize: 13)),
                    Text('Target: ${(masteryValue * 100).toInt()}% Mastery', style: AppTypography.body.copyWith(fontSize: 9, color: Colors.white24)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white10, size: 12),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPreparationStatusSection(CoverageState? coverage, RiskState? risk, ReadinessState? readiness, MomentumState? momentum, List<MicroTopicNode> nodes, KnowledgeEngine knowledge) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text("MISSION STATUS", style: AppTypography.label.copyWith(fontSize: 8, color: Colors.white12)),
        const SizedBox(height: 8),
        DarkCard(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _statusItem("READINESS", "${(readiness?.score ?? 0).toInt()}%", AppColors.gold),
              _statusItem("COVERAGE", "${((coverage?.coveragePercent ?? 0) * 100).toInt()}%", Colors.blueAccent),
              _statusItem("STREAK", "${momentum?.studyStreakDays ?? 0}d", Colors.orangeAccent),
              _statusItem("RISK", risk?.highRisk == true ? "HIGH" : "LOW", risk?.highRisk == true ? Colors.redAccent : Colors.greenAccent),
            ],
          ),
        ),
      ],
    );
  }

  Widget _statusItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: AppTypography.hero.copyWith(fontSize: 16, color: color)),
        Text(label, style: AppTypography.label.copyWith(fontSize: 6, color: Colors.white10)),
      ],
    );
  }
}
