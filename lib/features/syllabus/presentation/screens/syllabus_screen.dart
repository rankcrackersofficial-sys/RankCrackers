import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/widgets/dark_card.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../shared/widgets/command_header.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../dashboard/presentation/providers/dashboard_provider.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../providers/syllabus_tree_provider.dart';
import '../../../digibook/domain/services/digibook_canonical_bridge_service.dart';

/// SYLLABUS SCREEN (v3 Hardened Hierarchy)
/// Implements Subject -> Unit -> Topic -> Atom drill-down in English with zero Hindi fallback.
class SyllabusScreen extends ConsumerStatefulWidget {
  const SyllabusScreen({super.key});

  @override
  ConsumerState<SyllabusScreen> createState() => _SyllabusScreenState();
}

class _SyllabusScreenState extends ConsumerState<SyllabusScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  final List<SyllabusNode> _navigationStack = [];

  @override
  void initState() {
    super.initState();
    DigiBookCanonicalBridgeService.instance.initialize();
  }

  Future<void> _onNodeTap(SyllabusNode node) async {
    if (node.type == 'subject' || node.type == 'unit') {
      setState(() {
        _navigationStack.add(node);
      });
      return;
    }

    if (node.type == 'topic') {
      if (node.children.isNotEmpty) {
        setState(() {
          _navigationStack.add(node);
        });
        return;
      }
      await _handleTopicTap(node);
      return;
    }

    if (node.type == 'atom') {
      await _handleTopicTap(node);
    }
  }

  Future<void> _handleTopicTap(SyllabusNode node) async {
    final bridge = DigiBookCanonicalBridgeService.instance;
    if (!bridge.isInitialized) await bridge.initialize();

    final resolveResult = bridge.resolveCanonicalNode(node.id);

    if (!resolveResult.isMapped || resolveResult.primaryEntry == null) {
      if (mounted) {
        _showTruthfulUnavailableDialog(node);
      }
      return;
    }

    final entry = resolveResult.primaryEntry!;
    final launchArgs = await bridge.buildLaunchArgs(entry.guId);
    if (launchArgs != null && mounted) {
      context.push(AppRoutes.digibookReader, extra: launchArgs);
    }
  }

  void _showTruthfulUnavailableDialog(SyllabusNode node) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Color(0xFF0F172A),
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
            border: Border(
              top: BorderSide(color: AppColors.gold, width: 1.5),
            ),
          ),
          padding: EdgeInsets.fromLTRB(
            20,
            16,
            20,
            MediaQuery.of(ctx).padding.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.white24,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppColors.surface2,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.borderSoft),
                    ),
                    child: const Icon(
                      Icons.menu_book_rounded,
                      color: AppColors.gold,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'SYLLABUS NODE',
                      style: AppTypography.hero.copyWith(
                        fontSize: 16,
                        color: Colors.white,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                node.title,
                style: AppTypography.cardTitle.copyWith(
                  fontSize: 15,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Learning and diagnostic content for this node is currently being assembled under zero-hallucination verification.',
                style: AppTypography.body.copyWith(
                  fontSize: 12.5,
                  color: Colors.white70,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.tacticalGold,
                    foregroundColor: Colors.black,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    'Got it',
                    style: AppTypography.button.copyWith(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  bool _onBack() {
    if (_navigationStack.isNotEmpty) {
      setState(() {
        _navigationStack.removeLast();
      });
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final knowledge = KnowledgeEngine.instance;
    final sessionUser =
        ref.watch(sessionUserProvider).valueOrNull ?? SessionUser.getSync();
    final readiness = ref.watch(missionReadinessProvider);
    final momentum = knowledge.momentumState;

    final tree = ref.watch(syllabusTreeProvider);
    final isSearching = _searchController.text.isNotEmpty;

    final hasFocus = _searchFocusNode.hasFocus;
    final hasQuery = _searchController.text.isNotEmpty;
    final hasNavigation = _navigationStack.isNotEmpty;

    return PopScope(
      canPop: !hasFocus && !hasQuery && !hasNavigation,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop) return;
        if (hasFocus) {
          _searchFocusNode.unfocus();
          setState(() {});
        } else if (hasQuery) {
          _searchController.clear();
          setState(() {});
        } else if (hasNavigation) {
          _onBack();
        }
      },
      child: Scaffold(
        backgroundColor: AppColors.background,
        body: TacticalNoirBackground(
          child: SafeArea(
            child: CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: CommandHeader(
                    userName: sessionUser.name,
                    userPhoto: sessionUser.photo,
                    examName: sessionUser.examName,
                    readiness: readiness,
                    momentum: momentum,
                    missionEvidenceVerified: true,
                  ),
                ),
                _buildSearchSection(),
                if (isSearching)
                  _buildSearchResults()
                else if (tree.isEmpty)
                  _buildTruthfulEmptyState(sessionUser.examName, knowledge)
                else ...[
                  _buildBreadcrumbs(sessionUser.examName),
                  _buildActiveLevel(tree),
                ],
                const SliverToBoxAdapter(
                  child: SizedBox(height: 120),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSearchSection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Syllabus',
                style: AppTypography.hero.copyWith(fontSize: 22, color: Colors.white)),
            const SizedBox(height: 12),
            Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderSoft),
              ),
              child: TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                style: AppTypography.body.copyWith(color: Colors.white),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  hintText: 'Search Topics...',
                  hintStyle: AppTypography.body.copyWith(color: Colors.white38),
                  prefixIcon:
                      const Icon(Icons.search_rounded, color: AppColors.gold),
                  contentPadding: const EdgeInsets.all(16),
                ),
                onChanged: (_) => setState(() {}),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreadcrumbs(String examName) {
    if (_navigationStack.isEmpty) {
      return SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          child: Text(
            '$examName • Complete Curriculum Map',
            style: const TextStyle(color: Colors.white54, fontSize: 11),
          ),
        ),
      );
    }

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
        child: Row(
          children: [
            GestureDetector(
              onTap: () => setState(() => _navigationStack.clear()),
              child: const Text('All',
                  style: TextStyle(color: AppColors.gold, fontSize: 12, fontWeight: FontWeight.bold)),
            ),
            for (int i = 0; i < _navigationStack.length; i++) ...[
              const Icon(Icons.chevron_right_rounded, color: Colors.white38, size: 14),
              GestureDetector(
                onTap: () {
                  setState(() {
                    _navigationStack.removeRange(i + 1, _navigationStack.length);
                  });
                },
                child: Text(
                  _navigationStack[i].title,
                  style: TextStyle(
                    color: i == _navigationStack.length - 1 ? Colors.white : AppColors.gold,
                    fontSize: 12,
                    fontWeight: i == _navigationStack.length - 1 ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActiveLevel(List<SyllabusNode> tree) {
    final List<SyllabusNode> currentNodes = _navigationStack.isEmpty
        ? tree
        : _navigationStack.last.children;

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final node = currentNodes[index];
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _syllabusNodeCard(node),
            );
          },
          childCount: currentNodes.length,
        ),
      ),
    );
  }

  Widget _syllabusNodeCard(SyllabusNode node) {
    final isLeaf = node.type == 'atom' || (node.type == 'topic' && node.children.isEmpty);

    return GestureDetector(
      onTap: () => _onNodeTap(node),
      child: DarkCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: node.type == 'subject'
                    ? Colors.orangeAccent.withValues(alpha: 0.12)
                    : node.type == 'unit'
                        ? Colors.blueAccent.withValues(alpha: 0.12)
                        : AppColors.gold.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: node.type == 'subject'
                      ? Colors.orangeAccent.withValues(alpha: 0.35)
                      : node.type == 'unit'
                          ? Colors.blueAccent.withValues(alpha: 0.35)
                          : AppColors.gold.withValues(alpha: 0.35),
                ),
              ),
              child: Icon(
                node.type == 'subject'
                    ? Icons.science_rounded
                    : node.type == 'unit'
                        ? Icons.folder_rounded
                        : Icons.menu_book_rounded,
                color: node.type == 'subject'
                    ? Colors.orangeAccent
                    : node.type == 'unit'
                        ? Colors.blueAccent
                        : AppColors.gold,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    node.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.cardTitle.copyWith(
                      fontSize: 14,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    node.type == 'subject'
                        ? '${node.unitCount} Units • ${node.atomCount} Topics'
                        : node.type == 'unit'
                            ? '${node.topicCount} Topics'
                            : 'Topic Node',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Icon(
              isLeaf ? Icons.arrow_forward_ios_rounded : Icons.chevron_right_rounded,
              color: AppColors.gold,
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    final query = _searchController.text.toLowerCase();
    final allNodes = ref.watch(allNodesProvider);
    final filtered = allNodes
        .where((n) => n.title.toLowerCase().contains(query) || n.topic.toLowerCase().contains(query))
        .toList();

    if (filtered.isEmpty) {
      return const SliverToBoxAdapter(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Center(
            child: Text('No matching topics found', style: TextStyle(color: Colors.white54)),
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final node = filtered[index];
            final sNode = SyllabusNode(
              id: node.id,
              title: node.title.isNotEmpty ? node.title : node.topic,
              type: 'topic',
              subjectId: node.subject,
            );
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _syllabusNodeCard(sNode),
            );
          },
          childCount: filtered.length,
        ),
      ),
    );
  }

  Widget _buildTruthfulEmptyState(String examName, KnowledgeEngine knowledge) {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: DarkCard(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.menu_book_rounded, color: AppColors.gold, size: 36),
              const SizedBox(height: 12),
              Text('Loading Syllabus for $examName...',
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.bold)),
            ],
          ),
        ),
      ),
    );
  }
}
