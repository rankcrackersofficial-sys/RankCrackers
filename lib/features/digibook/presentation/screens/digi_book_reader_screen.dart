import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../domain/models/digibook_launch_args.dart';
import '../widgets/visual/digibook_visual_registry.dart';

/// DIGIBOOK READER SCREEN
/// Canonical reader surface rendering verified, governed private DigiBook lessons.
/// Consumes typed DigiBookLaunchArgs with zero reliance on legacy uncast types.
class DigiBookReaderScreen extends StatefulWidget {
  final DigiBookLaunchArgs args;

  const DigiBookReaderScreen({
    super.key,
    required this.args,
  });

  @override
  State<DigiBookReaderScreen> createState() => _DigiBookReaderScreenState();
}

class _DigiBookReaderScreenState extends State<DigiBookReaderScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final args = widget.args;
    final hasLessonData = args.rawLessonData != null && args.components != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildTopBar(context, args),
              if (!hasLessonData)
                Expanded(child: _buildUnavailableContent(context))
              else ...[
                _buildTabBar(),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildOverviewTab(context, args),
                      _buildConceptsTab(context, args),
                      _buildFormulasTab(context, args),
                      _buildPracticeTab(context, args),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopBar(BuildContext context, DigiBookLaunchArgs args) {
    return Container(
      padding: const EdgeInsets.fromLTRB(8, 8, 16, 10),
      decoration: const BoxDecoration(
        color: Color(0xFF0F172A),
        border: Border(bottom: BorderSide(color: AppColors.borderSoft, width: 1)),
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: AppColors.secondaryText,
              size: 20,
            ),
            onPressed: () {
              if (Navigator.of(context).canPop()) {
                context.pop();
              } else {
                context.go('/digibook');
              }
            },
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.4),
                          width: 0.8,
                        ),
                      ),
                      child: Text(
                        args.subject.toUpperCase(),
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.8,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  args.topicTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.cardTitle.copyWith(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabBar() {
    return Container(
      color: const Color(0xFF0B1120),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        indicatorColor: AppColors.gold,
        indicatorWeight: 2.5,
        labelColor: AppColors.gold,
        unselectedLabelColor: Colors.white54,
        labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
        unselectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.normal),
        tabs: const [
          Tab(text: 'OVERVIEW & VISUAL'),
          Tab(text: 'CONCEPTS'),
          Tab(text: 'FORMULAS'),
          Tab(text: 'PRACTICE'),
        ],
      ),
    );
  }

  Widget _buildOverviewTab(BuildContext context, DigiBookLaunchArgs args) {
    final overview = args.componentOverview;
    final overviewText = overview?['overviewText'] as String? ?? 'No overview summary available.';
    final visualWidget = DigiBookVisualRegistry.resolveVisual(args);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Governed Visual Simulation
          if (visualWidget != null) ...[
            visualWidget,
            const SizedBox(height: 16),
          ],

          // Overview Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1E293B),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.borderSoft),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.menu_book_rounded, color: AppColors.gold, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'CHAPTER OVERVIEW',
                      style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  overviewText,
                  style: AppTypography.body.copyWith(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConceptsTab(BuildContext context, DigiBookLaunchArgs args) {
    final conceptsData = args.componentConcepts;
    final blocks = (conceptsData?['blocks'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ??
        [];

    if (blocks.isEmpty) {
      return _buildEmptySection('No concept blocks recorded for this revision.');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: blocks.length,
      itemBuilder: (context, index) {
        final b = blocks[index];
        final title = b['title'] as String? ?? 'Concept ${index + 1}';
        final content = b['contentMarkdown'] as String? ?? '';

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderSoft),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTypography.cardTitle.copyWith(
                  color: AppColors.gold,
                  fontSize: 15,
                ),
              ),
              const SizedBox(height: 10),
              Text(
                content,
                style: AppTypography.body.copyWith(
                  color: Colors.white.withValues(alpha: 0.9),
                  fontSize: 13.5,
                  height: 1.5,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFormulasTab(BuildContext context, DigiBookLaunchArgs args) {
    final formulaData = args.componentFormulaRegister;
    final formulas = (formulaData?['formulaTable'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ??
        [];

    if (formulas.isEmpty) {
      return _buildEmptySection('No formulas registered for this concept module.');
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: formulas.length,
      itemBuilder: (context, index) {
        final f = formulas[index];
        final name = f['name'] as String? ?? 'Formula ${index + 1}';
        final formula = f['formula'] as String? ?? '';
        final constraints = f['constraints'] as String? ?? '';

        return Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.borderSoft),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 12),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.white12),
                ),
                child: Text(
                  formula,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
              if (constraints.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Constraints: $constraints',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 11,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildPracticeTab(BuildContext context, DigiBookLaunchArgs args) {
    final workedData = args.componentWorkedExamples;
    final workedList = (workedData?['workedExamples'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ??
        [];

    final selfCheckData = args.componentSelfChecks;
    final selfChecks = (selfCheckData?['selfChecks'] as List<dynamic>?)
            ?.map((e) => e as Map<String, dynamic>)
            .toList() ??
        [];

    if (workedList.isEmpty && selfChecks.isEmpty) {
      return _buildEmptySection('No practice examples available for this unit yet.');
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (workedList.isNotEmpty) ...[
          Text(
            'WORKED EXAMPLES',
            style: AppTypography.label.copyWith(color: AppColors.gold, fontSize: 11),
          ),
          const SizedBox(height: 10),
          ...workedList.map((w) {
            final title = w['title'] as String? ?? 'Example';
            final problem = w['problemStatement'] as String? ?? '';
            final steps = (w['stepByStepSolution'] as List<dynamic>?)
                    ?.map((e) => e.toString())
                    .toList() ??
                [];
            final answer = w['finalAnswer'] as String? ?? '';

            return Container(
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderSoft),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    problem,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.85),
                      fontSize: 13,
                    ),
                  ),
                  if (steps.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    const Divider(color: Colors.white10),
                    const SizedBox(height: 6),
                    ...steps.map((s) => Padding(
                          padding: const EdgeInsets.only(bottom: 6),
                          child: Text(
                            s,
                            style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.7),
                              fontSize: 12,
                            ),
                          ),
                        )),
                  ],
                  if (answer.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Answer: $answer',
                        style: const TextStyle(
                          color: AppColors.gold,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
        ],
      ],
    );
  }

  Widget _buildEmptySection(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Colors.white38, fontSize: 13),
        ),
      ),
    );
  }

  Widget _buildUnavailableContent(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.menu_book_rounded, color: AppColors.gold, size: 48),
            const SizedBox(height: 16),
            const Text(
              'Learning content is not available yet.',
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () {
                if (Navigator.of(context).canPop()) {
                  context.pop();
                } else {
                  context.go('/digibook');
                }
              },
              child: const Text('Return to Library'),
            ),
          ],
        ),
      ),
    );
  }
}

/// DIGIBOOK UNAVAILABLE SCREEN (Fail-Closed)
class DigiBookUnavailableScreen extends StatelessWidget {
  final String message;

  const DigiBookUnavailableScreen({
    super.key,
    this.message = 'Learning content is not available yet.',
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.menu_book_rounded, color: AppColors.gold, size: 48),
                const SizedBox(height: 16),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),
                OutlinedButton(
                  onPressed: () {
                    if (Navigator.of(context).canPop()) {
                      context.pop();
                    } else {
                      context.go('/digibook');
                    }
                  },
                  child: const Text('Return to Library'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
