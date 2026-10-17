import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../../core/knowledge/knowledge_engine_provider.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../../shared/providers/session_provider.dart';
import '../../../syllabus/presentation/providers/syllabus_tree_provider.dart';
import '../../data/models/digibook_unit.dart';
import '../../data/repositories/digibook_repository.dart';
import '../../domain/services/digibook_canonical_bridge_service.dart';
import '../../domain/services/digibook_user_preferences_service.dart';

/// DIGIBOOK LIBRARY SCREEN
/// Permanent Student entry point for chapter discovery, search, saved bookmarks,
/// and subject hierarchy exploration.
///
/// HARD CONSTITUTIONAL LAWS:
/// - DASHBOARD -> DIGIBOOK = DIGIBOOK LIBRARY (DIGIBOOK_ROOT_OPENS_LIBRARY = YES)
/// - SEARCH_TITLE_DIRECT_ROUTE_COUNT = 0 (Resolves via canonicalNodeId/generationUnitId)
/// - RANDOM_LESSON_INJECTION_COUNT = 0 (Inventory derived purely from governed bridge)
/// - BOOKMARK_MUTATES_MASTERY = NO
/// - READING_ACTION_IMPLIES_MASTERY_COUNT = 0
class DigiBookLibraryScreen extends ConsumerStatefulWidget {
  const DigiBookLibraryScreen({super.key});

  @override
  ConsumerState<DigiBookLibraryScreen> createState() =>
      _DigiBookLibraryScreenState();
}

final liveDigiBookUnitsProvider =
    StreamProvider.family<List<DigiBookUnit>, String>(
  (ref, missionId) => DigiBookRepository.streamUnits(missionId),
);

class _DigiBookLibraryScreenState extends ConsumerState<DigiBookLibraryScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  String _selectedSubject = '';
  bool _subjectsExpanded = false;
  String _activeTab = 'BROWSE'; // 'BROWSE', 'SAVED', 'RECENT'
  String _searchQuery = '';
  final Set<String> _expandedUnitIds = {};

  @override
  void initState() {
    super.initState();
    DigiBookCanonicalBridgeService.instance.initialize().then((_) {
      if (mounted) setState(() {});
    });
    DigiBookUserPreferencesService.instance.init();
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim();
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  DigiBookBridgeResolveResult _resolveNode(SyllabusNode node,
      DigiBookCanonicalBridgeService bridge, List<MicroTopicNode> allAtoms) {
    // 1. Direct ID check
    var res = bridge.resolveCanonicalNode(node.id);
    if (res.isMapped && res.primaryEntry != null) return res;

    // 2. Direct check on children SyllabusNodes
    for (final child in node.children) {
      res = bridge.resolveCanonicalNode(child.id);
      if (res.isMapped && res.primaryEntry != null) return res;
    }

    // 3. Atom/MicroTopic check
    final matchingAtoms = allAtoms
        .where((a) =>
            a.id == node.id ||
            a.topicId == node.id ||
            a.canonicalTopicId == node.id ||
            (a.canonicalKnowledgeNodeId != null &&
                a.canonicalKnowledgeNodeId == node.id))
        .toList();

    for (final a in matchingAtoms) {
      res = bridge.resolveCanonicalNode(a.id);
      if (res.isMapped && res.primaryEntry != null) return res;
      if (a.canonicalKnowledgeNodeId != null &&
          a.canonicalKnowledgeNodeId!.isNotEmpty) {
        res = bridge.resolveCanonicalNode(a.canonicalKnowledgeNodeId!);
        if (res.isMapped && res.primaryEntry != null) return res;
      }
      if (a.canonicalTopicId != null && a.canonicalTopicId!.isNotEmpty) {
        res = bridge.resolveCanonicalNode(a.canonicalTopicId!);
        if (res.isMapped && res.primaryEntry != null) return res;
      }
      if (a.topicId.isNotEmpty) {
        res = bridge.resolveCanonicalNode(a.topicId);
        if (res.isMapped && res.primaryEntry != null) return res;
      }
    }

    // 4. Prefix / Canonical Alignment matching
    final cleanNode =
        node.title.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\s]'), ' ');
    final nodeWords =
        cleanNode.split(RegExp(r'\s+')).where((w) => w.length >= 3).toList();

    for (final entry in bridge.allEntries) {
      final matchesSubject = node.subjectId.isEmpty ||
          entry.subject.toLowerCase() == node.subjectId.toLowerCase();
      if (!matchesSubject) continue;

      if (entry.canonicalNodeId.startsWith(node.id) ||
          node.id.startsWith(entry.canonicalNodeId) ||
          node.title.toLowerCase().contains(entry.topic.toLowerCase()) ||
          entry.topic.toLowerCase().contains(node.title.toLowerCase())) {
        return DigiBookBridgeResolveResult(
          status: DigiBookBridgeResolveStatus.singleGu,
          canonicalNodeId: entry.canonicalNodeId,
          entries: [entry],
        );
      }

      // Stemmed keyword matching (e.g. "representation" and "representations")
      final cleanEntry =
          entry.topic.toLowerCase().replaceAll(RegExp(r'[^a-z0-9\s]'), ' ');
      final entryWords =
          cleanEntry.split(RegExp(r'\s+')).where((w) => w.length >= 3).toList();
      final common = nodeWords
          .where((nw) => entryWords.any((ew) =>
              ew == nw ||
              (ew.length >= 4 &&
                  nw.length >= 4 &&
                  (ew.startsWith(nw.substring(0, 4)) ||
                      nw.startsWith(ew.substring(0, 4))))))
          .toList();

      if (common.length >= 2 ||
          (nodeWords.contains('sets') && entryWords.contains('sets'))) {
        return DigiBookBridgeResolveResult(
          status: DigiBookBridgeResolveStatus.singleGu,
          canonicalNodeId: entry.canonicalNodeId,
          entries: [entry],
        );
      }
    }

    return DigiBookBridgeResolveResult(
      status: DigiBookBridgeResolveStatus.unmapped,
      canonicalNodeId: node.id,
      entries: const [],
    );
  }

  Future<void> _openLessonByNode(
      SyllabusNode node,
      DigiBookCanonicalBridgeService bridge,
      List<MicroTopicNode> allAtoms) async {
    if (!bridge.isInitialized) await bridge.initialize();

    final resolveResult = _resolveNode(node, bridge, allAtoms);
    if (resolveResult.isMapped && resolveResult.primaryEntry != null) {
      final launchArgs =
          await bridge.buildLaunchArgs(resolveResult.primaryEntry!.guId);
      if (launchArgs != null) {
        await DigiBookUserPreferencesService.instance
            .addRecent(resolveResult.primaryEntry!.guId);
        if (!mounted) return;
        context.push(AppRoutes.digibookReader, extra: launchArgs);
        return;
      }
    }

    if (!mounted) return;
    _showTruthfulUnavailableDialog(context, node.title);
  }

  Future<void> _openLessonByGuId(String guId) async {
    final bridge = DigiBookCanonicalBridgeService.instance;
    if (!bridge.isInitialized) await bridge.initialize();

    final launchArgs = await bridge.buildLaunchArgs(guId);
    if (launchArgs != null) {
      await DigiBookUserPreferencesService.instance.addRecent(guId);
      if (!mounted) return;
      context.push(AppRoutes.digibookReader, extra: launchArgs);
      return;
    }

    if (!mounted) return;
    _showTruthfulUnavailableDialog(context, guId);
  }

  void _showTruthfulUnavailableDialog(BuildContext context, String title) {
    final scheme = Theme.of(context).colorScheme;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) {
        return Container(
          decoration: BoxDecoration(
            color: scheme.surfaceContainerHighest,
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
                    color: scheme.onSurfaceVariant,
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
                      color: scheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: scheme.outline),
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
                      'LEARNING CONTENT',
                      style: AppTypography.hero.copyWith(
                        fontSize: 16,
                        color: scheme.onSurface,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: AppTypography.cardTitle.copyWith(
                  fontSize: 15,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Learning content for this topic is currently being assembled under zero-hallucination verification. Please check back as new governed chapters are published.',
                style: AppTypography.body.copyWith(
                  fontSize: 12.5,
                  color: scheme.onSurfaceVariant,
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
                    foregroundColor: scheme.onPrimary,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  child: Text(
                    'Got it',
                    style: AppTypography.button.copyWith(
                      color: scheme.onPrimary,
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

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final syllabusTree = ref.watch(syllabusTreeProvider);
    final allAtoms = ref.watch(allNodesProvider);
    final bridge = DigiBookCanonicalBridgeService.instance;
    final prefs = DigiBookUserPreferencesService.instance;
    final sessionUser = ref.watch(activeSessionUserProvider);
    final liveUnits =
        ref.watch(liveDigiBookUnitsProvider(sessionUser.examId)).valueOrNull ??
            const <DigiBookUnit>[];
    if (bridge.isInitialized) {
      bridge.activateMission(sessionUser.examId);
    }
    if (_selectedSubject.isEmpty && syllabusTree.isNotEmpty) {
      _selectedSubject = syllabusTree.first.title.toUpperCase();
    }

    return Scaffold(
      backgroundColor: scheme.surface,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            children: [
              _buildTopHeader(
                sessionUser.displayExamName,
                syllabusTree.length,
                syllabusTree.fold<int>(0, (sum, s) => sum + s.unitCount),
                bridge.allEntries.length,
              ),
              _buildSearchBar(),
              if (_searchQuery.isEmpty) _buildFilterTabs(prefs),
              Expanded(
                child: _searchQuery.isNotEmpty
                    ? _buildSearchResults(syllabusTree, bridge, allAtoms)
                    : _activeTab == 'SAVED'
                        ? _buildSavedSection(bridge, prefs)
                        : _activeTab == 'RECENT'
                            ? _buildRecentSection(bridge, prefs)
                            : _buildBrowseSection(syllabusTree, bridge, prefs,
                                allAtoms, liveUnits),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopHeader(
      String examName, int subjectCount, int unitCount, int availableCount) {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: scheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: scheme.outline),
            ),
            child: const Icon(
              Icons.auto_stories_rounded,
              color: AppColors.gold,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'LIBRARY',
                  style: AppTypography.hero.copyWith(
                    fontSize: ResponsiveHelper.sp(context, 16),
                    color: scheme.onSurface,
                    letterSpacing: 1.0,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '$examName • $unitCount Units • $availableCount Lessons Available',
                  style: AppTypography.body.copyWith(
                    fontSize: ResponsiveHelper.sp(context, 10.5),
                    color: scheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    final scheme = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: scheme.outline),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          children: [
            Icon(Icons.search_rounded,
                color: scheme.onSurfaceVariant, size: 18),
            const SizedBox(width: 10),
            Expanded(
              child: Theme(
                data: Theme.of(context).copyWith(
                  inputDecorationTheme: const InputDecorationTheme(
                    filled: false,
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
                child: TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  style: TextStyle(color: scheme.onSurface, fontSize: 13),
                  cursorColor: AppColors.gold,
                  decoration: InputDecoration(
                    hintText: 'Search chapters (e.g. Sets, Friction, Mole)...',
                    hintStyle: TextStyle(
                        color: scheme.onSurfaceVariant, fontSize: 12.5),
                    border: InputBorder.none,
                    enabledBorder: InputBorder.none,
                    focusedBorder: InputBorder.none,
                    errorBorder: InputBorder.none,
                    focusedErrorBorder: InputBorder.none,
                    disabledBorder: InputBorder.none,
                    filled: false,
                    isDense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
              ),
            ),
            if (_searchQuery.isNotEmpty)
              GestureDetector(
                onTap: () {
                  _searchController.clear();
                  _searchFocusNode.unfocus();
                },
                child: Icon(Icons.close_rounded,
                    color: scheme.onSurfaceVariant, size: 18),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterTabs(DigiBookUserPreferencesService prefs) {
    final savedCount = prefs.getSavedGuIds().length;
    final recentCount = prefs.getRecentGuIds().length;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 4),
      child: Row(
        children: [
          _tabPill('BROWSE', 'All Chapters', _activeTab == 'BROWSE', () {
            setState(() => _activeTab = 'BROWSE');
          }),
          const SizedBox(width: 8),
          _tabPill('SAVED', 'Saved ($savedCount)', _activeTab == 'SAVED', () {
            setState(() => _activeTab = 'SAVED');
          }),
          const SizedBox(width: 8),
          _tabPill('RECENT', 'Recent ($recentCount)', _activeTab == 'RECENT',
              () {
            setState(() => _activeTab = 'RECENT');
          }),
        ],
      ),
    );
  }

  Widget _tabPill(
      String tabKey, String label, bool isSelected, VoidCallback onTap) {
    final scheme = Theme.of(context).colorScheme;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.gold.withValues(alpha: 0.15)
              : scheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? AppColors.gold : scheme.outline,
            width: isSelected ? 1.2 : 1.0,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? AppColors.gold : scheme.onSurfaceVariant,
            fontSize: 11,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ),
    );
  }

  Widget _buildSearchResults(List<SyllabusNode> subjects,
      DigiBookCanonicalBridgeService bridge, List<MicroTopicNode> allAtoms) {
    final scheme = Theme.of(context).colorScheme;
    final query = _searchQuery.toLowerCase();
    final matchedTopics = <Map<String, dynamic>>[];
    final seenGuIds = <String>{};

    // 1. Search governed bridge lessons first (carrying canonicalNodeId and generationUnitId)
    for (final entry in bridge.allEntries) {
      final matches = entry.topic.toLowerCase().contains(query) ||
          entry.subject.toLowerCase().contains(query);
      if (matches) {
        seenGuIds.add(entry.guId);
        matchedTopics.add({
          'subject': entry.subject,
          'unit': '',
          'title': entry.topic,
          'isAvailable': true,
          'guId': entry.guId,
          'canonicalNodeId': entry.canonicalNodeId,
        });
      }
    }

    // 2. Search syllabus tree topics
    for (final sub in subjects) {
      for (final unit in sub.children) {
        for (final topic in unit.children) {
          if (topic.title.toLowerCase().contains(query) ||
              unit.title.toLowerCase().contains(query) ||
              sub.title.toLowerCase().contains(query)) {
            final resolveResult = _resolveNode(topic, bridge, allAtoms);
            final isAvailable =
                resolveResult.isMapped && resolveResult.primaryEntry != null;
            final guId = resolveResult.primaryEntry?.guId;
            if (guId != null && seenGuIds.contains(guId)) {
              final existing =
                  matchedTopics.firstWhere((m) => m['guId'] == guId);
              if ((existing['unit'] as String? ?? '').isEmpty) {
                existing['unit'] = unit.title;
              }
              continue;
            }
            if (guId != null) seenGuIds.add(guId);
            matchedTopics.add({
              'subject': sub.title,
              'unit': unit.title,
              'title': topic.title,
              'topic': topic,
              'isAvailable': isAvailable,
              'guId': guId,
              'canonicalNodeId':
                  resolveResult.primaryEntry?.canonicalNodeId ?? topic.id,
            });
          }
        }
      }
    }

    if (matchedTopics.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.search_off_rounded,
                  color: scheme.onSurfaceVariant, size: 48),
              const SizedBox(height: 12),
              Text(
                'No matching chapters found',
                style: AppTypography.cardTitle
                    .copyWith(color: scheme.onSurface, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                'Try searching for core topics like "Sets", "Friction", or "Thermodynamics"',
                textAlign: TextAlign.center,
                style: AppTypography.body
                    .copyWith(color: scheme.onSurfaceVariant, fontSize: 11.5),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
      itemCount: matchedTopics.length,
      itemBuilder: (context, index) {
        final item = matchedTopics[index];
        final String title = item['title'] as String? ?? '';
        final bool isAvailable = item['isAvailable'] as bool? ?? false;
        final String subject = item['subject'] as String? ?? '';
        final String unit = item['unit'] as String? ?? '';
        final String? guId = item['guId'] as String?;

        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GestureDetector(
            onTap: () {
              if (guId != null && guId.isNotEmpty) {
                _openLessonByGuId(guId);
              } else if (item['topic'] is SyllabusNode) {
                _openLessonByNode(
                    item['topic'] as SyllabusNode, bridge, allAtoms);
              } else {
                _showTruthfulUnavailableDialog(context, title);
              }
            },
            child: DarkCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: isAvailable
                          ? AppColors.gold.withValues(alpha: 0.12)
                          : scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: isAvailable
                            ? AppColors.gold.withValues(alpha: 0.4)
                            : scheme.outline,
                      ),
                    ),
                    child: Icon(
                      isAvailable
                          ? Icons.menu_book_rounded
                          : Icons.lock_outline_rounded,
                      color: isAvailable
                          ? AppColors.gold
                          : scheme.onSurfaceVariant,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.cardTitle.copyWith(
                            fontSize: 13,
                            color: scheme.onSurface,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          unit.isNotEmpty ? '$subject • $unit' : subject,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                              color: scheme.onSurfaceVariant, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: isAvailable
                          ? AppColors.gold.withValues(alpha: 0.15)
                          : scheme.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: isAvailable ? AppColors.gold : scheme.outline,
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      isAvailable ? 'READ' : 'MAP',
                      style: TextStyle(
                        color: isAvailable
                            ? AppColors.gold
                            : scheme.onSurfaceVariant,
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildBrowseSection(
      List<SyllabusNode> subjects,
      DigiBookCanonicalBridgeService bridge,
      DigiBookUserPreferencesService prefs,
      List<MicroTopicNode> allAtoms,
      List<DigiBookUnit> liveUnits) {
    if (subjects.isEmpty && liveUnits.isNotEmpty) {
      return _buildLiveUnitsSection(liveUnits);
    }
    final continueState = prefs.getContinueReading();

    return CustomScrollView(
      physics: const BouncingScrollPhysics(),
      slivers: [
        // 1. Continue Reading (if active)
        if (continueState != null)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(18, 8, 18, 12),
              child: _buildContinueReadingCard(continueState),
            ),
          ),

        // 2. Subject Selector Tabs (derived from the active mission)
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 6),
            child: _buildSubjectSelector(subjects),
          ),
        ),

        // 3. Subject Unit List
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(18, 10, 18, 80),
          sliver: _buildSubjectUnitsSliver(subjects, bridge, allAtoms),
        ),
      ],
    );
  }

  Widget _buildLiveUnitsSection(List<DigiBookUnit> units) {
    final scheme = Theme.of(context).colorScheme;
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(18, 14, 18, 80),
      itemCount: units.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final unit = units[index];
        return DarkCard(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(unit.chapterId,
                  style:
                      TextStyle(color: scheme.onSurfaceVariant, fontSize: 10)),
              const SizedBox(height: 5),
              Text(unit.concept,
                  style: AppTypography.cardTitle
                      .copyWith(color: scheme.onSurface, fontSize: 14)),
              const SizedBox(height: 7),
              Text(unit.definition,
                  maxLines: 4,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.body.copyWith(
                      color: scheme.onSurfaceVariant,
                      fontSize: 12,
                      height: 1.4)),
              const SizedBox(height: 8),
              Text('Verified mission unit • ${unit.status.toUpperCase()}',
                  style: TextStyle(
                      color: AppColors.gold,
                      fontSize: 10,
                      fontWeight: FontWeight.w700)),
            ],
          ),
        );
      },
    );
  }

  Widget _buildContinueReadingCard(Map<String, dynamic> continueState) {
    final scheme = Theme.of(context).colorScheme;
    final topicTitle = continueState['topicTitle'] as String? ?? 'Chapter';
    final subject = continueState['subject'] as String? ?? 'Subject';
    final guId = continueState['guId'] as String? ?? '';
    final percent = (continueState['scrollPercent'] as num?)?.toDouble() ?? 0.0;

    return GestureDetector(
      onTap: () => _openLessonByGuId(guId),
      child: DarkCard(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppColors.gold.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.play_arrow_rounded,
                color: AppColors.gold,
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CONTINUE READING',
                    style: AppTypography.label.copyWith(
                      color: AppColors.gold,
                      fontSize: 8.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    topicTitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.cardTitle.copyWith(fontSize: 13),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '$subject • ${(percent * 100).toInt()}% Read',
                    style:
                        TextStyle(color: scheme.onSurfaceVariant, fontSize: 10),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: AppColors.gold,
              size: 13,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSubjectSelector(List<SyllabusNode> subjects) {
    final scheme = Theme.of(context).colorScheme;
    final selected = _selectedSubject.isEmpty && subjects.isNotEmpty
        ? subjects.first.title.toUpperCase()
        : _selectedSubject;
    SyllabusNode? selectedNode;
    for (final item in subjects) {
      if (item.title.toUpperCase() == selected) {
        selectedNode = item;
        break;
      }
    }
    selectedNode ??= subjects.isEmpty ? null : subjects.first;
    final totalUnits =
        subjects.fold<int>(0, (sum, item) => sum + item.unitCount);
    final totalTopics =
        subjects.fold<int>(0, (sum, item) => sum + item.topicCount);
    final totalAtomicKeys =
        subjects.fold<int>(0, (sum, item) => sum + item.atomCount);

    return DarkCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          InkWell(
            onTap: subjects.isEmpty
                ? null
                : () => setState(() => _subjectsExpanded = !_subjectsExpanded),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
              child: Row(
                children: [
                  const Icon(Icons.menu_book_rounded,
                      color: AppColors.gold, size: 20),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                            subjects.isEmpty
                                ? 'MISSION SUBJECTS'
                                : 'MISSION SUBJECTS · ${subjects.length}',
                            style:
                                AppTypography.cardTitle.copyWith(fontSize: 14)),
                        const SizedBox(height: 3),
                        Text(
                            selectedNode == null
                                ? 'No syllabus subjects loaded'
                                : 'Total: $totalUnits units  •  $totalTopics topics  •  $totalAtomicKeys atomic coverage keys',
                            style: TextStyle(
                                color: scheme.onSurfaceVariant,
                                fontSize: 10.5)),
                        if (selectedNode != null) ...[
                          const SizedBox(height: 2),
                          Text(
                              'Currently viewing: ${selectedNode!.title}  •  ${selectedNode!.unitCount} units  •  ${selectedNode!.topicCount} topics',
                              style: TextStyle(
                                  color: scheme.onSurfaceVariant,
                                  fontSize: 9.5)),
                        ],
                      ],
                    ),
                  ),
                  Icon(
                      _subjectsExpanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      color: AppColors.gold),
                ],
              ),
            ),
          ),
          if (_subjectsExpanded && subjects.isNotEmpty)
            Container(
              constraints: const BoxConstraints(maxHeight: 240),
              decoration: BoxDecoration(
                  color: scheme.surface,
                  borderRadius:
                      const BorderRadius.vertical(bottom: Radius.circular(12))),
              child: ListView.separated(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(10, 4, 10, 10),
                itemCount: subjects.length,
                separatorBuilder: (_, __) => const SizedBox(height: 4),
                itemBuilder: (context, index) {
                  final item = subjects[index];
                  final active = item.title.toUpperCase() == selected;
                  return ListTile(
                    dense: true,
                    onTap: () => setState(() {
                      _selectedSubject = item.title.toUpperCase();
                      _subjectsExpanded = false;
                    }),
                    leading: Icon(Icons.circle,
                        size: 9,
                        color:
                            active ? AppColors.gold : scheme.onSurfaceVariant),
                    title: Text(item.title,
                        style: TextStyle(
                            color: active
                                ? scheme.onSurface
                                : scheme.onSurfaceVariant,
                            fontSize: 12,
                            fontWeight:
                                active ? FontWeight.w700 : FontWeight.w500)),
                    subtitle: Text(
                        '${item.unitCount} units • ${item.topicCount} topics • ${item.atomCount} atomic',
                        style: TextStyle(
                            color: scheme.onSurfaceVariant, fontSize: 10)),
                    trailing: active
                        ? const Icon(Icons.check,
                            color: AppColors.gold, size: 17)
                        : null,
                  );
                },
              ),
            ),
        ],
      ),
    );
  }

  Widget _subjectPill(String name, IconData icon) {
    final scheme = Theme.of(context).colorScheme;
    final isSelected = _selectedSubject == name;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedSubject = name),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected
                ? AppColors.gold.withValues(alpha: 0.15)
                : scheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? AppColors.gold : scheme.outline,
              width: isSelected ? 1.2 : 1.0,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                color: isSelected ? AppColors.gold : scheme.onSurfaceVariant,
                size: 16,
              ),
              const SizedBox(height: 4),
              Text(
                name,
                style: TextStyle(
                  color:
                      isSelected ? scheme.onSurface : scheme.onSurfaceVariant,
                  fontSize: 10,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSubjectUnitsSliver(List<SyllabusNode> subjects,
      DigiBookCanonicalBridgeService bridge, List<MicroTopicNode> allAtoms) {
    final scheme = Theme.of(context).colorScheme;
    final selected = _selectedSubject.isEmpty && subjects.isNotEmpty
        ? subjects.first.title.toUpperCase()
        : _selectedSubject;
    final subjectNode = subjects.firstWhere(
      (s) => s.title.toUpperCase().contains(selected),
      orElse: () => SyllabusNode(
        id: '',
        title: selected,
        type: 'subject',
        subjectId: selected,
      ),
    );

    final units = subjectNode.children;

    if (units.isEmpty) {
      return SliverToBoxAdapter(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Text(
              'Loading curriculum units...',
              style:
                  AppTypography.body.copyWith(color: scheme.onSurfaceVariant),
            ),
          ),
        ),
      );
    }

    return SliverList(
      delegate: SliverChildBuilderDelegate(
        (context, index) {
          final unit = units[index];
          final isExpanded = _expandedUnitIds.contains(unit.id);
          final topics = unit.children;

          // Count available lessons in this unit
          int availableInUnit = 0;
          for (final t in topics) {
            final res = _resolveNode(t, bridge, allAtoms);
            if (res.isMapped && res.primaryEntry != null) {
              availableInUnit++;
            }
          }

          return Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: DarkCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  Material(
                    color: Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    clipBehavior: Clip.antiAlias,
                    child: ListTile(
                      onTap: () {
                        setState(() {
                          if (isExpanded) {
                            _expandedUnitIds.remove(unit.id);
                          } else {
                            _expandedUnitIds.add(unit.id);
                          }
                        });
                      },
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 4),
                      title: Text(
                        unit.title,
                        style: AppTypography.cardTitle.copyWith(
                          fontSize: 13.5,
                          color: scheme.onSurface,
                        ),
                      ),
                      subtitle: Text(
                        '${topics.length} Topics • $availableInUnit DigiBook Lessons',
                        style: TextStyle(
                            color: scheme.onSurfaceVariant, fontSize: 10.5),
                      ),
                      trailing: Icon(
                        isExpanded
                            ? Icons.keyboard_arrow_up_rounded
                            : Icons.keyboard_arrow_down_rounded,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                  if (isExpanded)
                    Container(
                      decoration: BoxDecoration(
                        color: scheme.surface,
                        borderRadius:
                            BorderRadius.vertical(bottom: Radius.circular(12)),
                      ),
                      padding: const EdgeInsets.fromLTRB(12, 6, 12, 12),
                      child: Column(
                        children: topics.map((t) {
                          final resolveResult =
                              _resolveNode(t, bridge, allAtoms);
                          final isAvailable = resolveResult.isMapped &&
                              resolveResult.primaryEntry != null;

                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Material(
                              color: Colors.transparent,
                              child: InkWell(
                                onTap: () {
                                  _openLessonByNode(t, bridge, allAtoms);
                                },
                                borderRadius: BorderRadius.circular(8),
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: isAvailable
                                        ? scheme.surfaceContainerHighest
                                        : scheme.surface
                                            .withValues(alpha: 0.35),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isAvailable
                                          ? AppColors.gold
                                              .withValues(alpha: 0.3)
                                          : scheme.outline
                                              .withValues(alpha: 0.5),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(
                                        isAvailable
                                            ? Icons.menu_book_rounded
                                            : Icons.radio_button_unchecked,
                                        color: isAvailable
                                            ? AppColors.gold
                                            : scheme.onSurfaceVariant,
                                        size: 15,
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          t.title,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: TextStyle(
                                            color: isAvailable
                                                ? scheme.onSurface
                                                : scheme.onSurfaceVariant,
                                            fontSize: 12,
                                            fontWeight: isAvailable
                                                ? FontWeight.w600
                                                : FontWeight.normal,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      if (isAvailable)
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppColors.gold
                                                .withValues(alpha: 0.2),
                                            borderRadius:
                                                BorderRadius.circular(4),
                                          ),
                                          child: const Text(
                                            'READ',
                                            style: TextStyle(
                                              color: AppColors.gold,
                                              fontSize: 8.5,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                ],
              ),
            ),
          );
        },
        childCount: units.length,
      ),
    );
  }

  Widget _buildSavedSection(DigiBookCanonicalBridgeService bridge,
      DigiBookUserPreferencesService prefs) {
    final scheme = Theme.of(context).colorScheme;
    final savedGuIds = prefs.getSavedGuIds();
    final savedEntries = savedGuIds
        .map((guId) => bridge.getEntryByGuId(guId))
        .where((e) => e != null)
        .cast<DigiBookAuthorityEntry>()
        .toList();

    if (savedEntries.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.bookmark_border_rounded,
                  color: scheme.onSurfaceVariant, size: 48),
              const SizedBox(height: 12),
              Text(
                'No saved chapters yet',
                style: AppTypography.cardTitle
                    .copyWith(color: scheme.onSurface, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                'Tap the bookmark icon on any chapter while reading to access it quickly here.',
                textAlign: TextAlign.center,
                style: AppTypography.body
                    .copyWith(color: scheme.onSurfaceVariant, fontSize: 11.5),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(18),
      itemCount: savedEntries.length,
      itemBuilder: (context, index) {
        final entry = savedEntries[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GestureDetector(
            onTap: () => _openLessonByGuId(entry.guId),
            child: DarkCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.bookmark_rounded,
                      color: AppColors.gold, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.topic,
                          style: AppTypography.cardTitle.copyWith(fontSize: 13),
                        ),
                        Text(
                          entry.subject,
                          style: TextStyle(
                              color: scheme.onSurfaceVariant, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.bookmark_remove_rounded,
                        color: scheme.onSurfaceVariant, size: 18),
                    onPressed: () async {
                      await prefs.toggleSave(entry.guId);
                      setState(() {});
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildRecentSection(DigiBookCanonicalBridgeService bridge,
      DigiBookUserPreferencesService prefs) {
    final scheme = Theme.of(context).colorScheme;
    final recentGuIds = prefs.getRecentGuIds();
    final recentEntries = recentGuIds
        .map((guId) => bridge.getEntryByGuId(guId))
        .where((e) => e != null)
        .cast<DigiBookAuthorityEntry>()
        .toList();

    if (recentEntries.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(Icons.history_rounded,
                  color: scheme.onSurfaceVariant, size: 48),
              const SizedBox(height: 12),
              Text(
                'No recently opened chapters',
                style: AppTypography.cardTitle
                    .copyWith(color: scheme.onSurface, fontSize: 14),
              ),
              const SizedBox(height: 6),
              Text(
                'Chapters you open will automatically appear here for quick access.',
                textAlign: TextAlign.center,
                style: AppTypography.body
                    .copyWith(color: scheme.onSurfaceVariant, fontSize: 11.5),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(18),
      itemCount: recentEntries.length,
      itemBuilder: (context, index) {
        final entry = recentEntries[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: GestureDetector(
            onTap: () => _openLessonByGuId(entry.guId),
            child: DarkCard(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.history_rounded,
                      color: AppColors.gold, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.topic,
                          style: AppTypography.cardTitle.copyWith(fontSize: 13),
                        ),
                        Text(
                          entry.subject,
                          style: TextStyle(
                              color: scheme.onSurfaceVariant, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.arrow_forward_ios_rounded,
                      color: AppColors.gold, size: 12),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
