import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/models/node_runtime_state.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/widgets/command_header.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';

/// 🔱 SYLLABUS SCREEN
/// Displays the knowledge map with real-time runtime state tracking.
class SyllabusScreen extends ConsumerStatefulWidget {
  const SyllabusScreen({super.key});

  @override
  ConsumerState<SyllabusScreen> createState() => _SyllabusScreenState();
}

class _SyllabusScreenState extends ConsumerState<SyllabusScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<MicroTopicNode> nodes = [];
  List<MicroTopicNode> filteredNodes = [];

  @override
  void initState() {
    super.initState();
    nodes = KnowledgeEngine.instance.allNodes;
    filteredNodes = nodes;
  }

  void _onSearchChanged(String value) {
    setState(() {
      filteredNodes = nodes.where((node) {
        return node.topicHindi.toLowerCase().contains(value.toLowerCase()) ||
               node.topic.toLowerCase().contains(value.toLowerCase());
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final knowledge = KnowledgeEngine.instance;
    final sessionUser = ref.watch(sessionUserProvider).valueOrNull;
    final readiness = ref.watch(missionReadinessProvider);
    final momentum = knowledge.momentumState;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: CustomScrollView(
            physics: const BouncingScrollPhysics(),
            slivers: [
              SliverToBoxAdapter(
                child: CommandHeader(
                  userName: sessionUser?.name ?? 'Warrior',
                  userPhoto: sessionUser?.photo,
                  examName: sessionUser?.examName ?? 'Mission',
                  readiness: readiness,
                  momentum: momentum,
                ),
              ),
              _buildSearchSection(),
              _buildAdaptiveSummary(knowledge),
              _buildKnowledgeGrid(knowledge),
              const SliverToBoxAdapter(
                child: SizedBox(height: 120),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSearchSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('KNOWLEDGE MAP', style: AppTypography.hero.copyWith(fontSize: 22)),
            const SizedBox(height: 16),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderSoft),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _onSearchChanged,
                style: AppTypography.body,
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: 'Search Topics (खोजें...)',
                  hintStyle: AppTypography.body.copyWith(color: Colors.white10),
                  prefixIcon: const Icon(Icons.search_rounded, color: AppColors.gold),
                  contentPadding: const EdgeInsets.all(18),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAdaptiveSummary(KnowledgeEngine knowledge) {
    int mastered = 0;
    int weak = 0;

    for (final node in nodes) {
      final state = knowledge.getState(node.id);
      if (state != null) {
        if (state.mastery >= 0.85) mastered++;
        if (state.mastery < 0.50) weak++;
      }
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: [
            Expanded(child: _summaryCard('Mastered', mastered.toString())),
            const SizedBox(width: 12),
            Expanded(child: _summaryCard('Weak', weak.toString())),
          ],
        ),
      ),
    );
  }

  Widget _summaryCard(String title, String value) {
    return DarkCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: AppTypography.label),
          const SizedBox(height: 12),
          Text(value, style: AppTypography.hero),
        ],
      ),
    );
  }

  Widget _buildKnowledgeGrid(KnowledgeEngine knowledge) {
    return SliverPadding(
      padding: const EdgeInsets.all(20),
      sliver: SliverGrid(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final node = filteredNodes[index];
            final state = knowledge.getState(node.id) ?? NodeRuntimeState(nodeId: node.id);
            return _knowledgeNodeCard(node, state);
          },
          childCount: filteredNodes.length,
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 0.92,
        ),
      ),
    );
  }

  Widget _knowledgeNodeCard(MicroTopicNode node, NodeRuntimeState state) {
    return GestureDetector(
      onTap: () {
        context.go(AppRoutes.digibook, extra: node);
      },
      child: DarkCard(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              node.subjectHindi,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.cardTitle.copyWith(fontSize: 13, color: AppColors.gold),
            ),
            const SizedBox(height: 10),
            Text(
              node.topicHindi,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.subtitle.copyWith(color: AppColors.primaryText),
            ),
            const Spacer(),
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: LinearProgressIndicator(
                value: state.mastery,
                minHeight: 4,
                backgroundColor: Colors.white.withValues(alpha: 0.05),
                valueColor: AlwaysStoppedAnimation(
                  state.mastery > 0.7 ? AppColors.gold : AppColors.error.withValues(alpha: 0.6),
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  state.mastery >= 0.85
                      ? Icons.verified_rounded
                      : state.mastery < 0.50 
                        ? Icons.bolt_rounded 
                        : Icons.pending_rounded,
                  size: 14,
                  color: state.mastery >= 0.85 ? AppColors.gold : AppColors.secondaryText,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    state.mastery >= 0.85
                        ? 'Mastered'
                        : state.mastery < 0.50 ? 'Weak Zone' : 'In Progress',
                    style: AppTypography.label.copyWith(fontSize: 8, color: AppColors.secondaryText),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
