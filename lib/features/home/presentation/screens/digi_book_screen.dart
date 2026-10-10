import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/dark_card.dart';
import '../../../../shared/widgets/tactical_button.dart';
import '../../../../core/models/micro_topic_node.dart';
import '../../../../core/models/node_runtime_state.dart';
import '../../../../core/knowledge/knowledge_engine.dart';
import '../../../../features/mcq/presentation/widgets/mcq_card.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/tactical_secure_layer.dart';
import '../../../../features/profile/data/models/user_profile_model.dart';
import '../../../../features/auth/presentation/providers/auth_provider.dart';
import '../../../../core/services/knowledge_content_service.dart';
import '../../../../core/utils/responsive_helper.dart';
import '../../../../shared/widgets/formatted_math_text.dart';
import '../../../digibook/models/digibook_content.dart';
import '../../../digibook/domain/models/digibook_launch_args.dart';
import '../../../digibook/domain/services/digibook_canonical_bridge_service.dart';
import '../../../digibook/domain/services/digibook_user_preferences_service.dart';
import '../../../digibook/presentation/widgets/visual/digibook_visual_registry.dart';

/// DIGIBOOK SCREEN
/// The primary immersive reading interface. State-aware and adaptive.
/// Supports both canonical bridge launch args (DigiBookLaunchArgs) and legacy nodes.
class DigiBookScreen extends ConsumerStatefulWidget {
  final MicroTopicNode? node;
  final DigiBookLaunchArgs? args;

  const DigiBookScreen({
    super.key,
    this.node,
    this.args,
  });

  @override
  ConsumerState<DigiBookScreen> createState() => _DigiBookScreenState();
}

class _DigiBookScreenState extends ConsumerState<DigiBookScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final DateTime _startTime = DateTime.now();
  final ScrollController _scrollController = ScrollController();
  double _maxScrollPercent = 0.0;

  // Content Summoning State
  Future<DigiBookContent?>? _contentFuture;
  DigiBookLaunchArgs? _currentArgs;
  MicroTopicNode? _currentNode;
  bool _isLoadingArgs = false;

  // Section Navigation Keys for In-Page Scrolling
  final _overviewKey = GlobalKey();
  final _conceptsKey = GlobalKey();
  final _formulasKey = GlobalKey();
  final _misconceptionsKey = GlobalKey();
  final _examplesKey = GlobalKey();
  final _selfChecksKey = GlobalKey();
  final _previewKey = GlobalKey();

  // Authentic Atomic Facts Cache (FactID -> {statement, factType, sourceCitation})
  Map<String, Map<String, dynamic>> _atomicFactsCache = {};
  bool _isLoadingFacts = true;

  // Interactive MCQ State
  final Map<int, int> _selectedMcqOptions = {};
  final Map<int, bool> _submittedMcqs = {};

  // Self-Check Interactive State (Index -> Selected Option Index)
  final Map<int, int> _selectedSelfCheckOptions = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    _currentArgs = widget.args;
    _currentNode = widget.node;

    _loadAtomicFactsCache();

    if (_currentArgs != null) {
      _loadCanonicalArgsData();
    } else if (_currentNode != null) {
      _contentFuture =
          KnowledgeContentService.fetchContent(_currentNode!.contentRegistryId);
    }

    _scrollController.addListener(() {
      if (_scrollController.hasClients) {
        final current = _scrollController.position.pixels;
        final max = _scrollController.position.maxScrollExtent;
        if (max > 0) {
          final percent = current / max;
          if (percent > _maxScrollPercent) _maxScrollPercent = percent;
        }
      }
    });
  }

  Future<void> _loadCanonicalArgsData() async {
    if (_currentArgs == null) return;
    if (_currentArgs!.rawLessonData != null) return;

    setState(() {
      _isLoadingArgs = true;
    });

    final bridge = DigiBookCanonicalBridgeService.instance;
    if (!bridge.isInitialized) await bridge.initialize();

    final args =
        await bridge.buildLaunchArgs(_currentArgs!.generationUnitId);

    if (mounted) {
      setState(() {
        if (args != null) _currentArgs = args;
        _isLoadingArgs = false;
      });
    }
  }

  Future<void> _loadAtomicFactsCache() async {
    try {
      final jsonStr = await rootBundle.loadString('assets/data/verified_atomic_facts_cache.json');
      final data = json.decode(jsonStr);
      final map = <String, Map<String, dynamic>>{};
      if (data is Map<String, dynamic>) {
        if (data.containsKey('facts') && data['facts'] is List) {
          for (final item in data['facts'] as List) {
            if (item is Map<String, dynamic>) {
              final id = (item['atomicFactId'] ?? item['factId']) as String?;
              if (id != null) map[id] = item;
            }
          }
        } else {
          for (final entry in data.entries) {
            if (entry.value is Map<String, dynamic>) {
              map[entry.key] = entry.value as Map<String, dynamic>;
            }
          }
        }
      }
      if (mounted) {
        setState(() {
          _atomicFactsCache = map;
          _isLoadingFacts = false;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isLoadingFacts = false;
        });
      }
    }
  }

  void _scrollToSection(GlobalKey key) {
    final ctx = key.currentContext;
    if (ctx != null) {
      Scrollable.ensureVisible(
        ctx,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  String _inferUnitName(DigiBookLaunchArgs args) {
    final id = args.canonicalNodeId;
    if (args.subject.toLowerCase() == 'mathematics') {
      return 'Sets, Relations and Functions';
    }
    if (args.subject.toLowerCase() == 'physics') {
      if (id.contains('U01') || args.generationUnitId.contains('PHY_9008')) return 'Units and Measurements';
      if (id.contains('U02')) return 'Kinematics';
      if (id.contains('U03') || args.generationUnitId.contains('PHY_FCA3') || args.generationUnitId.contains('PHY_10A1')) return 'Laws of Motion';
      if (id.contains('U04')) return 'Work, Energy and Power';
      if (id.contains('U05') || args.generationUnitId.contains('PHY_9A3C') || args.generationUnitId.contains('PHY_REM')) return 'Rotational Motion';
      if (id.contains('U06') || args.generationUnitId.contains('PHY_A8EB') || args.generationUnitId.contains('PHY_B821') || args.generationUnitId.contains('PHY_BACF')) return 'Gravitation';
      return 'Units and Measurements';
    }
    if (args.subject.toLowerCase() == 'chemistry') {
      if (id.contains('U01') || args.generationUnitId.contains('CHE_2679') || args.generationUnitId.contains('CHE_910B') || args.generationUnitId.contains('CHE_024A')) return 'Some Basic Concepts in Chemistry';
      if (id.contains('U02') || args.generationUnitId.contains('CHE_4DB2') || args.generationUnitId.contains('CHE_4DF3')) return 'Structure of Atom';
      return 'Some Basic Concepts in Chemistry';
    }
    return 'Fundamental Theory';
  }

  String _getCanonicalBreadcrumb(DigiBookLaunchArgs args) {
    final unit = _inferUnitName(args);
    return '${args.subject} › $unit › ${args.topicTitle}';
  }

  String _getCanonicalBreadcrumbShort(DigiBookLaunchArgs args) {
    return '${args.subject} › ${args.topicTitle}';
  }

  @override
  void didUpdateWidget(covariant DigiBookScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.args != null && widget.args != oldWidget.args) {
      setState(() {
        _currentArgs = widget.args;
        _selectedSelfCheckOptions.clear();
      });
      _loadCanonicalArgsData();
    } else if (widget.node != null && widget.node?.id != oldWidget.node?.id) {
      setState(() {
        _currentNode = widget.node;
        _contentFuture =
            KnowledgeContentService.fetchContent(_currentNode!.contentRegistryId);
      });
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final knowledge = KnowledgeEngine.instance;
    final nodeId = _currentArgs?.canonicalNodeId ?? _currentNode?.id ?? '';
    final state =
        knowledge.getState(nodeId) ?? NodeRuntimeState(nodeId: nodeId);
    final authState = ref.watch(authNotifierProvider);

    final user = UserProfile(
      uid: authState.user?.uid ?? 'unknown',
      name: authState.user?.displayName ?? 'Warrior',
      email: authState.user?.email ?? '',
      tier: SubscriptionTier.warrior,
    );

    // 1. CANONICAL BRIDGE MODE (DigiBookLaunchArgs)
    if (_currentArgs != null) {
      if (_isLoadingArgs) {
        return const Scaffold(
          backgroundColor: AppColors.background,
          body: Center(
              child: CircularProgressIndicator(color: AppColors.gold)),
        );
      }

      return TacticalSecureLayer(
        isPremium: !user.isElite,
        child: Scaffold(
          backgroundColor: const Color(0xFF090C10),
          body: Container(
            color: const Color(0xFF090C10),
            child: SafeArea(
              child: Column(
                children: [
                  _buildCanonicalTopBar(_currentArgs!),
                  _buildCompactSectionSelector(_currentArgs!),
                  Expanded(
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        _buildSevenComponentsReader(_currentArgs!),
                        _buildCanonicalAtomicFactsTab(_currentArgs!),
                        _buildCanonicalMcqTab(_currentArgs!),
                        _buildCanonicalOneLinersTab(_currentArgs!),
                        _buildMissionTab(_currentArgs!),
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

    // 2. LEGACY NODE MODE (MicroTopicNode)
    return FutureBuilder<DigiBookContent?>(
      future: _contentFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: AppColors.background,
            body: Center(
                child: CircularProgressIndicator(color: AppColors.gold)),
          );
        }

        if (snapshot.hasError || snapshot.data == null) {
          return Scaffold(
            backgroundColor: AppColors.background,
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.auto_stories_rounded,
                        color: AppColors.gold, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      "LEARNING CONTENT",
                      style: AppTypography.heading.copyWith(
                          color: AppColors.gold, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      "Learning content is not available for this topic yet.",
                      textAlign: TextAlign.center,
                      style: AppTypography.body
                          .copyWith(fontSize: 12, color: Colors.white70),
                    ),
                    const SizedBox(height: 24),
                    if (context.canPop())
                      SizedBox(
                        width: 140,
                        height: 44,
                        child: ElevatedButton(
                          onPressed: () => context.pop(),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.tacticalGold,
                            foregroundColor: Colors.black,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: Text(
                            'Close',
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
              ),
            ),
          );
        }

        final content = snapshot.data!;

        return TacticalSecureLayer(
          isPremium: !user.isElite,
          child: Scaffold(
            backgroundColor: AppColors.background,
            body: TacticalNoirBackground(
              child: SafeArea(
                child: Column(
                  children: [
                    _buildTopBar(state),
                    _buildSubtleTabBar(),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildImmersiveReader(state, content),
                          _buildAtomicFactsTab(content),
                          _buildMcqTab(state, content),
                          _buildOneLinersTab(content),
                          _buildMissionTab(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  // =========================================================================
  // CANONICAL SEVEN COMPONENTS READER
  // =========================================================================

  Widget _buildSevenComponentsReader(DigiBookLaunchArgs args) {
    return SingleChildScrollView(
      controller: _scrollController,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(
        horizontal: 20,
        vertical: 20,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. CANONICAL OPENING BLOCK (Section 10 & 11)
          Text(
            _getCanonicalBreadcrumb(args),
            style: const TextStyle(
              fontSize: 12.5,
              color: Color(0xFFA7ADB7),
              fontWeight: FontWeight.w500,
              letterSpacing: 0.3,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            args.topicTitle,
            style: const TextStyle(
              fontSize: 27,
              height: 1.25,
              fontWeight: FontWeight.w700,
              color: Color(0xFFF3F4F6),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 24),

          // 1. OVERVIEW COMPONENT (Flows directly on surface, reduced card wall)
          Container(
            key: _overviewKey,
            child: _buildComponent1Overview(args),
          ),
          const SizedBox(height: 32),

          // 2. CONCEPTS COMPONENT (Book style)
          Container(
            key: _conceptsKey,
            child: _buildComponent2Concepts(args),
          ),
          const SizedBox(height: 32),

          // 3. FORMULA REGISTER COMPONENT
          Container(
            key: _formulasKey,
            child: _buildComponent3FormulaRegister(args),
          ),
          const SizedBox(height: 32),

          // 4. COMMON MISCONCEPTIONS COMPONENT
          Container(
            key: _misconceptionsKey,
            child: _buildComponent4Misconceptions(args),
          ),
          const SizedBox(height: 32),

          // 5. WORKED EXAMPLES COMPONENT
          Container(
            key: _examplesKey,
            child: _buildComponent5WorkedExamples(args),
          ),
          const SizedBox(height: 32),

          // 6. SELF-CHECKS COMPONENT
          Container(
            key: _selfChecksKey,
            child: _buildComponent6SelfChecks(args),
          ),
          const SizedBox(height: 32),

          // 7. ASSESSMENT PREVIEW COMPONENT
          Container(
            key: _previewKey,
            child: _buildComponent7AssessmentPreview(args),
          ),
          const SizedBox(height: 40),

          // VERIFY READING / CHECK UNDERSTANDING BUTTON
          TacticalButton(
            title: "CHECK UNDERSTANDING",
            onTap: () async {
              final dwellTime =
                  DateTime.now().difference(_startTime).inSeconds / 60.0;
              await KnowledgeEngine.instance.recordReadingCompletion(
                nodeId: args.canonicalNodeId,
                dwellTimeMinutes: dwellTime,
                scrollDepthPercent: _maxScrollPercent,
              );
              if (mounted) {
                final evidence = dwellTime >= 2.0 && _maxScrollPercent >= 0.70;
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                  backgroundColor: const Color(0xFF161B22),
                  content: Text(
                    evidence
                        ? 'READING SESSION RECORDED'
                        : '⚠️ READING SESSION SAVED (INSUFFICIENT DWELL TIME)',
                    style: const TextStyle(color: Color(0xFFF3F4F6)),
                  ),
                ));
              }
            },
          ),
          const SizedBox(height: 24),

          // READER FOOTER - BOOK STYLE (Section 42)
          _buildReaderFooter(args),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  // --- 1. OVERVIEW ---
  Widget _buildComponent1Overview(DigiBookLaunchArgs args) {
    final overview = args.componentOverview;
    final overviewText = overview?['overviewText'] as String? ??
        'This canonical chapter establishes the fundamental theory, definitions, and mathematical structures for ${args.topicTitle}.';

    final whyMatters = _getGroundedWhyItMatters(args);
    final learnBullets = _getGroundedWhatYouLearn(args);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("1. OVERVIEW", Icons.explore_rounded),
        const SizedBox(height: 16),

        // Why this matters
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF252B33), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: const [
                  Icon(Icons.bolt_rounded, size: 16, color: Color(0xFFC3A568)),
                  SizedBox(width: 8),
                  Text(
                    "WHY THIS MATTERS",
                    style: TextStyle(
                      color: Color(0xFFC3A568),
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              FormattedMathText(
                whyMatters,
                style: const TextStyle(
                  color: Color(0xFFF3F4F6),
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // What you'll learn
        if (learnBullets.isNotEmpty) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF252B33), width: 1),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: const [
                    Icon(Icons.checklist_rounded, size: 16, color: Color(0xFFC3A568)),
                    SizedBox(width: 8),
                    Text(
                      "WHAT YOU'LL LEARN",
                      style: TextStyle(
                        color: Color(0xFFC3A568),
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ...learnBullets.map((b) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("• ", style: TextStyle(color: Color(0xFFC3A568), fontSize: 14)),
                      Expanded(
                        child: FormattedMathText(
                          b,
                          style: const TextStyle(
                            color: Color(0xFFF3F4F6),
                            fontSize: 13.5,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        // Core idea
        const Text(
          "CORE IDEA",
          style: TextStyle(
            color: Color(0xFFC3A568),
            fontSize: 11,
            fontWeight: FontWeight.bold,
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 8),
        FormattedMathText(
          overviewText,
          textAlign: TextAlign.justify,
          style: const TextStyle(
            color: Color(0xFFF3F4F6),
            fontSize: 16.0,
            height: 1.55,
          ),
        ),
      ],
    );
  }

  String _getGroundedWhyItMatters(DigiBookLaunchArgs args) {
    if (args.subject.toLowerCase() == 'mathematics') {
      return 'Sets provide the bedrock for relations, functions, calculus, and probability across the entire JEE Mathematics syllabus.';
    }
    if (args.subject.toLowerCase() == 'physics') {
      return 'Mastering quantitative foundations and physical dimensions is essential for error-free derivations and dimensional consistency across JEE Physics.';
    }
    if (args.subject.toLowerCase() == 'chemistry') {
      return 'Fundamental chemical concepts and atomic models form the prerequisite bridge to stoichiometry, equilibrium, and physical chemistry.';
    }
    return 'Establishes verified academic foundations for competitive JEE problem solving.';
  }

  List<String> _getGroundedWhatYouLearn(DigiBookLaunchArgs args) {
    final concepts = args.componentConcepts;
    final blocks = concepts?['blocks'] as List<dynamic>? ?? [];
    if (blocks.isNotEmpty) {
      return blocks.take(4).map((b) => (b['title'] as String? ?? 'Core Concept')).toList();
    }
    return [
      'Rigorous mathematical definitions and notation',
      'Governed theorems and operational axioms',
      'Canonical representation and problem structures',
    ];
  }

  // --- 2. CONCEPTS ---
  Widget _buildComponent2Concepts(DigiBookLaunchArgs args) {
    final compConcepts = args.componentConcepts;
    final blocks = (compConcepts?['blocks'] as List<dynamic>?) ??
        (compConcepts?['conceptBlocks'] as List<dynamic>?) ??
        [];
    final visualWidget = DigiBookVisualRegistry.resolveVisual(args);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("2. CONCEPTS", Icons.menu_book_rounded),
        const SizedBox(height: 16),
        if (blocks.isEmpty) ...[
          const Text(
            "Foundational conceptual blocks loaded.",
            style: TextStyle(color: Color(0xFFA7ADB7), fontSize: 14),
          ),
          if (visualWidget != null) ...[
            const SizedBox(height: 16),
            visualWidget,
          ],
        ]
        else ...[
          for (int i = 0; i < blocks.length; i++) ...[
            Builder(builder: (context) {
              final b = blocks[i];
              final title = b['title'] as String? ?? 'Concept';
              final content = b['contentMarkdown'] as String? ?? '';

              return Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Color(0xFFF3F4F6),
                        fontSize: 18.5,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 10),
                    FormattedMathText(
                      content,
                      textAlign: TextAlign.justify,
                      style: const TextStyle(
                        color: Color(0xFFF3F4F6),
                        fontSize: 16.0,
                        height: 1.55,
                      ),
                    ),
                    if (i == 0 && visualWidget != null) ...[
                      const SizedBox(height: 12),
                      visualWidget,
                    ],
                  ],
                ),
              );
            }),
          ],
        ],
      ],
    );
  }

  // --- 3. FORMULA REGISTER ---
  Widget _buildComponent3FormulaRegister(DigiBookLaunchArgs args) {
    final formulaReg = args.componentFormulaRegister;
    final formulaTable = formulaReg?['formulaTable'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("3. FORMULA REGISTER", Icons.functions_rounded),
        const SizedBox(height: 16),
        if (formulaTable.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF252B33), width: 1),
            ),
            child: const Text(
              "No quantitative formulas required for this conceptual topic.",
              style: TextStyle(color: Color(0xFFA7ADB7), fontSize: 13.5),
            ),
          )
        else
          ...formulaTable.map((item) {
            final Map<String, dynamic> f = Map<String, dynamic>.from(item);
            final name = f['name'] as String? ?? 'Formula';
            final expr = f['formula'] as String? ?? '';
            final constraints = f['constraints'] as String? ?? '';

            return Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 14),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF161B22),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF252B33), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFC3A568).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          "FORMULA",
                          style: TextStyle(
                            color: Color(0xFFC3A568),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(
                            color: Color(0xFFA7ADB7),
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFF101419),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFF252B33), width: 1),
                    ),
                    child: FormattedMathText(
                      expr,
                      style: const TextStyle(
                        color: Color(0xFFF3F4F6),
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        height: 1.4,
                      ),
                    ),
                  ),
                  if (constraints.isNotEmpty) ...[
                    const SizedBox(height: 10),
                    FormattedMathText(
                      constraints,
                      style: const TextStyle(
                        color: Color(0xFFA7ADB7),
                        fontSize: 13,
                        height: 1.4,
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
      ],
    );
  }

  // --- 4. COMMON MISCONCEPTIONS ---
  Widget _buildComponent4Misconceptions(DigiBookLaunchArgs args) {
    final misc = args.componentCommonMisconceptions;
    final status = misc?['status'] as String? ?? 'EVIDENCE_NOT_AVAILABLE';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("4. COMMON MISCONCEPTIONS", Icons.warning_amber_rounded),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF252B33), width: 1),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline_rounded,
                  color: Color(0xFFC3A568), size: 18),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  status == 'EVIDENCE_NOT_AVAILABLE'
                      ? "No verified misconception note is available for this lesson yet."
                      : "Verified misconception patterns loaded.",
                  style: const TextStyle(
                    color: Color(0xFFA7ADB7),
                    fontSize: 13.5,
                    height: 1.4,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- 5. WORKED EXAMPLES ---
  Widget _buildComponent5WorkedExamples(DigiBookLaunchArgs args) {
    final comp = args.componentWorkedExamples;
    final examples = comp?['workedExamples'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("5. WORKED EXAMPLES", Icons.psychology_rounded),
        const SizedBox(height: 16),
        if (examples.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF252B33), width: 1),
            ),
            child: const Text(
              "Guided examples prepared for target problem types.",
              style: TextStyle(color: Color(0xFFA7ADB7), fontSize: 13.5),
            ),
          )
        else
          ...examples.asMap().entries.map((entry) {
            final idx = entry.key;
            final Map<String, dynamic> ex =
                Map<String, dynamic>.from(entry.value);
            final title = ex['title'] as String? ?? 'Example ${idx + 1}';
            final problem = ex['problemStatement'] as String? ?? '';
            final steps = ex['stepByStepSolution'] as List<dynamic>? ?? [];
            final finalAns = ex['finalAnswer'] as String? ?? '';
            final diff = ex['difficulty'] as String? ?? 'STANDARD';

            return Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF161B22),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF252B33), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFC3A568).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "EXAMPLE ${idx + 1}",
                          style: const TextStyle(
                            color: Color(0xFFC3A568),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          title,
                          style: const TextStyle(
                            color: Color(0xFFF3F4F6),
                            fontSize: 13.5,
                            fontWeight: FontWeight.w600,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF252B33),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          diff,
                          style: const TextStyle(
                            color: Color(0xFFA7ADB7),
                            fontSize: 9.5,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    "PROBLEM",
                    style: TextStyle(
                      color: Color(0xFFA7ADB7),
                      fontSize: 10.5,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const SizedBox(height: 6),
                  FormattedMathText(
                    problem,
                    textAlign: TextAlign.justify,
                    style: const TextStyle(
                      color: Color(0xFFF3F4F6),
                      fontSize: 15.0,
                      height: 1.55,
                    ),
                  ),
                  if (steps.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    const Text(
                      "STEP-BY-STEP SOLUTION",
                      style: TextStyle(
                        color: Color(0xFFC3A568),
                        fontSize: 10.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                      ),
                    ),
                    const SizedBox(height: 8),
                    ...steps.map((step) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: FormattedMathText(
                        step.toString(),
                        style: const TextStyle(
                          color: Color(0xFFF3F4F6),
                          fontSize: 13.5,
                          height: 1.5,
                        ),
                      ),
                    )),
                  ],
                  if (finalAns.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF101419),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: const Color(0xFF4A8B6F).withValues(alpha: 0.4)),
                      ),
                      child: FormattedMathText(
                        "Final Answer: $finalAns",
                        style: const TextStyle(
                          color: Color(0xFF4A8B6F),
                          fontSize: 13.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
      ],
    );
  }

  // --- 6. SELF-CHECKS ---
  Widget _buildComponent6SelfChecks(DigiBookLaunchArgs args) {
    final comp = args.componentSelfChecks;
    final questions = comp?['selfChecks'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("6. SELF-CHECKS", Icons.fact_check_rounded),
        const SizedBox(height: 16),
        if (questions.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF161B22),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF252B33), width: 1),
            ),
            child: const Text(
              "Self-check questions prepared for knowledge verification.",
              style: TextStyle(color: Color(0xFFA7ADB7), fontSize: 13.5),
            ),
          )
        else
          ...questions.asMap().entries.map((entry) {
            final qIdx = entry.key;
            final Map<String, dynamic> q = Map<String, dynamic>.from(entry.value);
            final prompt = q['prompt'] as String? ?? '';
            final options = q['options'] as List<dynamic>? ?? [];
            final correctIdx = q['correctOptionIndex'] as int? ?? 0;
            final explanation = q['explanation'] as String? ?? '';
            final selectedOpt = _selectedSelfCheckOptions[qIdx];

            return Container(
              width: double.infinity,
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF161B22),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF252B33), width: 1),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: const Color(0xFFC3A568).withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          "QUESTION ${qIdx + 1}",
                          style: const TextStyle(
                            color: Color(0xFFC3A568),
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  FormattedMathText(
                    prompt,
                    style: const TextStyle(
                      color: Color(0xFFF3F4F6),
                      fontSize: 14.5,
                      fontWeight: FontWeight.w600,
                      height: 1.4,
                    ),
                  ),
                  const SizedBox(height: 14),
                  ...options.asMap().entries.map((optEntry) {
                    final oIdx = optEntry.key;
                    final oText = optEntry.value.toString();
                    final isSelected = selectedOpt == oIdx;
                    final isCorrect = oIdx == correctIdx;

                    Color borderColor = const Color(0xFF252B33);
                    Color bgColor = const Color(0xFF101419);
                    if (selectedOpt != null) {
                      if (isCorrect) {
                        borderColor = const Color(0xFF4A8B6F);
                        bgColor = const Color(0xFF4A8B6F).withValues(alpha: 0.1);
                      } else if (isSelected) {
                        borderColor = const Color(0xFF9E4A4A);
                        bgColor = const Color(0xFF9E4A4A).withValues(alpha: 0.1);
                      }
                    }

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 8),
                      child: InkWell(
                        onTap: () {
                          setState(() {
                            _selectedSelfCheckOptions[qIdx] = oIdx;
                          });
                        },
                        borderRadius: BorderRadius.circular(8),
                        child: Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: borderColor, width: 1),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 22,
                                height: 22,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: isSelected
                                        ? const Color(0xFFC3A568)
                                        : const Color(0xFF777F8B),
                                    width: 1.5,
                                  ),
                                ),
                                child: Text(
                                  String.fromCharCode(65 + oIdx),
                                  style: TextStyle(
                                    color: isSelected
                                        ? const Color(0xFFC3A568)
                                        : const Color(0xFFA7ADB7),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: FormattedMathText(
                                  oText,
                                  style: TextStyle(
                                    color: isSelected
                                        ? const Color(0xFFF3F4F6)
                                        : const Color(0xFFA7ADB7),
                                    fontSize: 13.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                  if (selectedOpt != null && explanation.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF101419),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFF252B33)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            selectedOpt == correctIdx
                                ? "✓ Correct"
                                : "✗ Explanation",
                            style: TextStyle(
                              color: selectedOpt == correctIdx
                                  ? const Color(0xFF4A8B6F)
                                  : const Color(0xFFC3A568),
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                            ),
                          ),
                          const SizedBox(height: 6),
                          FormattedMathText(
                            explanation,
                            style: const TextStyle(
                              color: Color(0xFFA7ADB7),
                              fontSize: 12.5,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            );
          }),
      ],
    );
  }

  // --- 7. ASSESSMENT PREVIEW ---
  Widget _buildComponent7AssessmentPreview(DigiBookLaunchArgs args) {
    final comp = args.componentAssessmentPreview;
    final patterns = comp?['problemPatterns'] as List<dynamic>? ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _componentHeader("7. ASSESSMENT PREVIEW", Icons.quiz_rounded),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF252B33), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "JEE MAIN EXAM FOCUS",
                style: TextStyle(
                  color: Color(0xFFC3A568),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.8,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Direct standard questions test subset axioms, Venn diagram operations, and set-builder notation.",
                style: TextStyle(
                  color: Color(0xFFF3F4F6),
                  fontSize: 14,
                  height: 1.5,
                ),
              ),
              if (patterns.isNotEmpty) ...[
                const SizedBox(height: 14),
                const Text(
                  "KEY PROBLEM PATTERNS",
                  style: TextStyle(
                    color: Color(0xFFA7ADB7),
                    fontSize: 10.5,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 8),
                ...patterns.map((p) => Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("• ", style: TextStyle(color: Color(0xFFC3A568), fontSize: 13)),
                      Expanded(
                        child: FormattedMathText(
                          p.toString(),
                          style: const TextStyle(
                            color: Color(0xFFA7ADB7),
                            fontSize: 13,
                            height: 1.4,
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReaderFooter(DigiBookLaunchArgs args) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFF252B33), width: 1)),
      ),
      child: Center(
        child: OutlinedButton.icon(
          onPressed: () => context.pop(),
          style: OutlinedButton.styleFrom(
            side: const BorderSide(color: Color(0xFFC3A568), width: 1),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          icon: const Icon(Icons.arrow_back_rounded, color: Color(0xFFC3A568), size: 18),
          label: const Text(
            "BACK TO LIBRARY",
            style: TextStyle(
              color: Color(0xFFC3A568),
              fontSize: 12,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
            ),
          ),
        ),
      ),
    );
  }

  // Helper Widget for Component Headers
  Widget _componentHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: const Color(0xFFC3A568)),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: Color(0xFFC3A568),
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.1,
          ),
        ),
      ],
    );
  }

  Widget _buildCanonicalTopBar(DigiBookLaunchArgs args) {
    final prefs = DigiBookUserPreferencesService.instance;
    final isSaved = prefs.isSaved(args.generationUnitId);

    return Container(
      height: 48,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF090C10),
        border: Border(bottom: BorderSide(color: Color(0xFF252B33), width: 1)),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Color(0xFFA7ADB7),
              size: 18,
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getCanonicalBreadcrumbShort(args),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFFA7ADB7),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                Text(
                  args.topicTitle,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13.5,
                    color: Color(0xFFF3F4F6),
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(
              isSaved ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
              color: const Color(0xFFC3A568),
              size: 22,
            ),
            tooltip: isSaved ? 'Remove from Saved' : 'Save Chapter',
            onPressed: () async {
              await prefs.toggleSave(args.generationUnitId);
              if (mounted) setState(() {});
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCanonicalAtomicFactsTab(DigiBookLaunchArgs args) {
    if (_isLoadingFacts) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFFC3A568)),
      );
    }

    final factIds = args.atomicFactIds;
    if (factIds.isEmpty) {
      return _buildEmptyState("No Key Facts bound for this chapter.");
    }

    final resolvedFacts = <Map<String, dynamic>>[];
    for (final id in factIds) {
      if (_atomicFactsCache.containsKey(id)) {
        resolvedFacts.add(_atomicFactsCache[id]!);
      }
    }

    if (resolvedFacts.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.menu_book_rounded, color: Color(0xFFC3A568), size: 40),
              SizedBox(height: 16),
              Text(
                "Academic Reconciliation",
                style: TextStyle(
                  color: Color(0xFFF3F4F6),
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              SizedBox(height: 8),
              Text(
                "Verified fact statements for this lesson are undergoing academic reconciliation.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Color(0xFFA7ADB7),
                  fontSize: 13,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: resolvedFacts.length,
      itemBuilder: (context, index) {
        final fact = resolvedFacts[index];
        final statement = fact['statement'] as String? ?? '';
        final factType = fact['factType'] as String? ?? 'KEY FACT';
        final rawCitation = fact['sourceCitation'] as String? ?? '';
        final locator = fact['sourceLocator'] as String? ?? '';
        final sourceCitation = rawCitation.isNotEmpty
            ? rawCitation
            : (locator.isNotEmpty ? 'NCERT Official • $locator' : 'NCERT Official');

        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF252B33), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC3A568).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      factType.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFFC3A568),
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    "#${index + 1}",
                    style: const TextStyle(
                      color: Color(0xFF777F8B),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              FormattedMathText(
                statement,
                style: const TextStyle(
                  color: Color(0xFFF3F4F6),
                  fontSize: 14.5,
                  height: 1.55,
                ),
              ),
              if (sourceCitation.isNotEmpty) ...[
                const SizedBox(height: 10),
                Text(
                  sourceCitation,
                  style: const TextStyle(
                    color: Color(0xFF777F8B),
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

  Widget _buildCanonicalMcqTab(DigiBookLaunchArgs args) {
    final comp = args.componentSelfChecks;
    final questions = comp?['selfChecks'] as List<dynamic>? ?? [];

    if (questions.isEmpty) return _buildEmptyState("No practice questions loaded.");

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: questions.length,
      itemBuilder: (context, index) {
        final q = Map<String, dynamic>.from(questions[index]);
        final prompt = q['prompt'] as String? ?? '';
        final options = q['options'] as List<dynamic>? ?? [];
        final correctIdx = q['correctOptionIndex'] as int? ?? 0;
        final explanation = q['explanation'] as String? ?? '';
        final selected = _selectedMcqOptions[index];
        final isSubmitted = _submittedMcqs[index] == true;

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF252B33), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC3A568).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      "PRACTICE QUESTION ${index + 1}",
                      style: const TextStyle(
                        color: Color(0xFFC3A568),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              FormattedMathText(
                prompt,
                style: const TextStyle(
                  color: Color(0xFFF3F4F6),
                  fontSize: 14.5,
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 14),
              ...options.asMap().entries.map((e) {
                final oIdx = e.key;
                final oText = e.value.toString();
                final isThisSelected = selected == oIdx;
                final isCorrect = oIdx == correctIdx;

                Color borderColor = const Color(0xFF252B33);
                Color bgColor = const Color(0xFF101419);
                if (isSubmitted) {
                  if (isCorrect) {
                    borderColor = const Color(0xFF4A8B6F);
                    bgColor = const Color(0xFF4A8B6F).withValues(alpha: 0.1);
                  } else if (isThisSelected) {
                    borderColor = const Color(0xFF9E4A4A);
                    bgColor = const Color(0xFF9E4A4A).withValues(alpha: 0.1);
                  }
                } else if (isThisSelected) {
                  borderColor = const Color(0xFFC3A568);
                  bgColor = const Color(0xFFC3A568).withValues(alpha: 0.08);
                }

                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: InkWell(
                    onTap: () {
                      if (!isSubmitted) {
                        setState(() {
                          _selectedMcqOptions[index] = oIdx;
                        });
                      }
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      decoration: BoxDecoration(
                        color: bgColor,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: borderColor, width: 1),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 22,
                            height: 22,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: isThisSelected
                                    ? const Color(0xFFC3A568)
                                    : const Color(0xFF777F8B),
                                width: 1.5,
                              ),
                            ),
                            child: Text(
                              String.fromCharCode(65 + oIdx),
                              style: TextStyle(
                                color: isThisSelected
                                    ? const Color(0xFFC3A568)
                                    : const Color(0xFFA7ADB7),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: FormattedMathText(
                              oText,
                              style: TextStyle(
                                color: isThisSelected
                                    ? const Color(0xFFF3F4F6)
                                    : const Color(0xFFA7ADB7),
                                fontSize: 13.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
              const SizedBox(height: 8),
              if (!isSubmitted)
                Align(
                  alignment: Alignment.centerRight,
                  child: ElevatedButton(
                    onPressed: selected != null
                        ? () {
                            setState(() {
                              _submittedMcqs[index] = true;
                            });
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC3A568),
                      foregroundColor: const Color(0xFF090C10),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                    ),
                    child: const Text("CHECK ANSWER", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                ),
              if (isSubmitted && explanation.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF101419),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFF252B33)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        selected == correctIdx ? "✓ Correct" : "✗ Explanation",
                        style: TextStyle(
                          color: selected == correctIdx
                              ? const Color(0xFF4A8B6F)
                              : const Color(0xFFC3A568),
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 6),
                      FormattedMathText(
                        explanation,
                        style: const TextStyle(
                          color: Color(0xFFA7ADB7),
                          fontSize: 12.5,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildCanonicalOneLinersTab(DigiBookLaunchArgs args) {
    final oneLiners = <Map<String, String>>[];
    for (final id in args.atomicFactIds) {
      if (_atomicFactsCache.containsKey(id)) {
        final f = _atomicFactsCache[id]!;
        oneLiners.add({
          'label': f['factType'] as String? ?? 'KEY CONCEPT',
          'text': f['statement'] as String? ?? '',
        });
      }
    }

    if (oneLiners.isEmpty) {
      final concepts = args.componentConcepts;
      final blocks = concepts?['blocks'] as List<dynamic>? ?? [];
      for (final b in blocks) {
        oneLiners.add({
          'label': 'CORE AXIOM',
          'text': '${b['title']}: ${b['contentMarkdown']}'.split('\n').first,
        });
      }
    }

    if (oneLiners.isEmpty) return _buildEmptyState("No One-Liners available.");

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: oneLiners.length,
      itemBuilder: (context, index) {
        final item = oneLiners[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF161B22),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF252B33), width: 1),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC3A568).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      item['label']!.toUpperCase(),
                      style: const TextStyle(
                        color: Color(0xFFC3A568),
                        fontSize: 9.5,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    "#${index + 1}",
                    style: const TextStyle(
                      color: Color(0xFF777F8B),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              FormattedMathText(
                item['text']!,
                style: const TextStyle(
                  color: Color(0xFFF3F4F6),
                  fontSize: 14.5,
                  height: 1.5,
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // =========================================================================
  // LEGACY BUILDERS (PRESERVED FOR BACKWARD COMPATIBILITY)
  // =========================================================================

  Widget _buildMissionTab([DigiBookLaunchArgs? args]) {
    final topic = args?.topicTitle ?? 'this chapter';
    final subject = args?.subject ?? 'JEE';

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFC3A568).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.military_tech_rounded, color: Color(0xFFC3A568), size: 36),
            ),
            const SizedBox(height: 18),
            const Text(
              "ACTIVE MISSION: JEE MAIN 2027",
              style: TextStyle(
                color: Color(0xFFC3A568),
                fontSize: 12,
                fontWeight: FontWeight.bold,
                letterSpacing: 1.0,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              "No active Crucible task for this lesson.",
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Color(0xFFF3F4F6),
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              "This lesson establishes verified foundational theory for $topic ($subject). When this unit appears in your Crucible target rotation, adaptive challenge sets and diagnostic drills will be assigned here.",
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFFA7ADB7),
                fontSize: 13,
                height: 1.5,
              ),
            ),
          ],
        ),
      ),
    );
  }



  Widget _buildTopBar(NodeRuntimeState state) {
    final title = _currentNode?.title ?? 'Topic';
    final subject = _currentNode?.subjectId ?? 'Subject';
    final chapter = _currentNode?.chapterId ?? 'Chapter';

    return Container(
      padding: EdgeInsets.fromLTRB(
          16,
          ResponsiveHelper.hp(context, 0.012),
          24,
          ResponsiveHelper.hp(context, 0.012)),
      decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: AppColors.borderSoft))),
      child: Row(
        children: [
          IconButton(
            onPressed: () => context.pop(),
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: AppColors.secondaryText,
              size: ResponsiveHelper.sp(context, 18),
            ),
          ),
          SizedBox(width: ResponsiveHelper.wp(context, 0.01)),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "$subject • $chapter".toUpperCase(),
                  style: AppTypography.label.copyWith(
                      fontSize: ResponsiveHelper.sp(context, 9),
                      letterSpacing: 1.2),
                ),
                SizedBox(height: ResponsiveHelper.hp(context, 0.005)),
                Text(
                  title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppTypography.cardTitle
                      .copyWith(fontSize: ResponsiveHelper.sp(context, 14)),
                ),
              ],
            ),
          ),
          Container(
            width: ResponsiveHelper.sp(context, 32),
            height: ResponsiveHelper.sp(context, 32),
            decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                    color: AppColors.gold.withValues(alpha: 0.2))),
            child: Center(
              child: Text(
                "${(state.mastery * 100).toInt()}%",
                style: AppTypography.label.copyWith(
                    fontSize: ResponsiveHelper.sp(context, 8),
                    letterSpacing: 0),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompactSectionSelector(DigiBookLaunchArgs args) {
    final sections = [
      {'label': 'Overview', 'isComponent': true, 'key': _overviewKey},
      {'label': 'Concepts', 'isComponent': true, 'key': _conceptsKey},
      {'label': 'Formulas', 'isComponent': true, 'key': _formulasKey},
      {'label': 'Misconceptions', 'isComponent': true, 'key': _misconceptionsKey},
      {'label': 'Examples', 'isComponent': true, 'key': _examplesKey},
      {'label': 'Self-Check', 'isComponent': true, 'key': _selfChecksKey},
      {'label': 'Preview', 'isComponent': true, 'key': _previewKey},
      {'label': 'Facts', 'tabIndex': 1},
      {'label': 'MCQs', 'tabIndex': 2},
      {'label': 'One-Liners', 'tabIndex': 3},
      {'label': 'Mission', 'tabIndex': 4},
    ];

    return Container(
      height: 38,
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Color(0xFF090C10),
        border: Border(bottom: BorderSide(color: Color(0xFF252B33), width: 1)),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: sections.length,
        itemBuilder: (context, index) {
          final s = sections[index];
          final label = s['label'] as String;
          final isComponent = s['isComponent'] == true;
          final tabIndex = s['tabIndex'] as int?;

          final isSelected = !isComponent && _tabController.index == tabIndex;

          return GestureDetector(
            onTap: () {
              if (isComponent) {
                if (_tabController.index != 0) {
                  _tabController.animateTo(0);
                  Future.delayed(const Duration(milliseconds: 150), () {
                    _scrollToSection(s['key'] as GlobalKey);
                  });
                } else {
                  _scrollToSection(s['key'] as GlobalKey);
                }
              } else if (tabIndex != null) {
                _tabController.animateTo(tabIndex);
              }
              setState(() {});
            },
            child: Container(
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                border: isSelected
                    ? const Border(
                        bottom: BorderSide(color: Color(0xFFC3A568), width: 2))
                    : null,
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected
                      ? const Color(0xFFC3A568)
                      : const Color(0xFFA7ADB7),
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSubtleTabBar() {
    return Container(
      width: double.infinity,
      alignment: Alignment.centerLeft,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        dividerColor: Colors.transparent,
        indicatorColor: AppColors.gold,
        labelColor: AppColors.gold,
        unselectedLabelColor: Colors.white30,
        labelPadding: EdgeInsets.symmetric(
            horizontal: ResponsiveHelper.wp(context, 0.06)),
        labelStyle: AppTypography.label.copyWith(
            fontWeight: FontWeight.w600,
            fontSize: ResponsiveHelper.sp(context, 12),
            letterSpacing: 1.0),
        tabs: const [
          Tab(text: "DIGIBOOK"),
          Tab(text: "FACTS"),
          Tab(text: "MCQS"),
          Tab(text: "ONE LINERS"),
          Tab(text: "MISSION")
        ],
      ),
    );
  }

  Widget _buildImmersiveReader(NodeRuntimeState state, DigiBookContent payload) {
    final String immersiveText = _getRenderedText(state, payload);
    final title = _currentNode?.title ?? 'Topic';

    return SingleChildScrollView(
      controller: _scrollController,
      physics: const BouncingScrollPhysics(),
      padding: EdgeInsets.symmetric(
          horizontal: ResponsiveHelper.wp(context, 0.05),
          vertical: ResponsiveHelper.hp(context, 0.035)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: AppTypography.hero.copyWith(
                  height: 1.3, fontSize: ResponsiveHelper.sp(context, 28))),
          SizedBox(height: ResponsiveHelper.hp(context, 0.035)),
          DarkCard(
            padding: EdgeInsets.symmetric(
                horizontal: ResponsiveHelper.wp(context, 0.06),
                vertical: ResponsiveHelper.hp(context, 0.03)),
            child: FormattedMathText(
              immersiveText,
              selectable: true,
              style: AppTypography.readingContent
                  .copyWith(fontSize: ResponsiveHelper.sp(context, 17)),
            ),
          ),
          SizedBox(height: ResponsiveHelper.hp(context, 0.035)),
          TacticalButton(
            title: "VERIFY READING",
            onTap: () async {
              if (_currentNode != null) {
                final dwellTime =
                    DateTime.now().difference(_startTime).inSeconds / 60.0;
                await KnowledgeEngine.instance.recordReadingCompletion(
                  nodeId: _currentNode!.id,
                  dwellTimeMinutes: dwellTime,
                  scrollDepthPercent: _maxScrollPercent,
                );
                if (mounted) {
                  final evidence = dwellTime >= 2.0 && _maxScrollPercent >= 0.70;
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                      content: Text(evidence
                          ? 'MISSION PROGRESS RECORDED'
                          : '⚠️ INSUFFICIENT READING EVIDENCE')));
                }
              }
            },
          ),
          SizedBox(height: ResponsiveHelper.hp(context, 0.035)),
          if (payload.revisionPoints.isNotEmpty) ...[
            _sectionLabel("STRATEGIC REVISION"),
            SizedBox(height: ResponsiveHelper.hp(context, 0.02)),
            DarkCard(
              padding: const EdgeInsets.all(22),
              backgroundColor: AppColors.surface2,
              child: Column(
                children: payload.revisionPoints
                    .map((point) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Padding(
                                  padding: EdgeInsets.only(
                                      top: ResponsiveHelper.hp(context, 0.008)),
                                  child: const Icon(Icons.circle,
                                      size: 4, color: AppColors.gold)),
                              const SizedBox(width: 12),
                              Expanded(
                                  child: FormattedMathText(
                                point,
                                style: AppTypography.body.copyWith(
                                    fontSize: ResponsiveHelper.sp(context, 15),
                                    height: 1.6),
                              )),
                            ],
                          ),
                        ))
                    .toList(),
              ),
            ),
          ],
          SizedBox(height: ResponsiveHelper.hp(context, 0.1)),
        ],
      ),
    );
  }

  String _getRenderedText(NodeRuntimeState state, DigiBookContent payload) {
    if (state.mastery < 0.4) return payload.beginnerContent;
    if (state.mastery < 0.8) return payload.intermediateContent;
    return payload.proContent;
  }

  Widget _buildMcqTab(NodeRuntimeState state, DigiBookContent payload) {
    final mcqs = state.mastery < 0.5 ? payload.easyMcqs : payload.hardMcqs;
    if (mcqs.isEmpty) return _buildEmptyState("Combat Data Missing");
    final nodeId = _currentNode?.id ?? '';

    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: mcqs.length,
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.only(bottom: 18),
        child: McqCard(
            nodeId: nodeId,
            mcq: mcqs[index],
            currentMastery: state.mastery),
      ),
    );
  }

  Widget _buildAtomicFactsTab(DigiBookContent payload) {
    if (payload.facts.isEmpty) return _buildEmptyState("No Atomic Facts found.");
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: payload.facts.length,
      itemBuilder: (context, index) {
        final fact = payload.facts[index];
        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: DarkCard(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.hub_rounded,
                        size: ResponsiveHelper.sp(context, 14),
                        color: AppColors.gold),
                    const SizedBox(width: 10),
                    Text(fact.subject.toUpperCase(),
                        style: AppTypography.label.copyWith(
                            fontSize: ResponsiveHelper.sp(context, 10))),
                  ],
                ),
                SizedBox(height: ResponsiveHelper.hp(context, 0.015)),
                FormattedMathText(
                  fact.statement,
                  style: AppTypography.body.copyWith(
                      fontSize: ResponsiveHelper.sp(context, 15),
                      height: 1.5),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildOneLinersTab(DigiBookContent payload) {
    if (payload.oneLiners.isEmpty) return _buildEmptyState("Axioms Missing");
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: payload.oneLiners.length,
      itemBuilder: (context, index) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: DarkCard(
          padding: EdgeInsets.symmetric(
              horizontal: ResponsiveHelper.wp(context, 0.06),
              vertical: ResponsiveHelper.hp(context, 0.03)),
          child: FormattedMathText(
            payload.oneLiners[index],
            selectable: true,
            style: AppTypography.readingContent
                .copyWith(fontSize: ResponsiveHelper.sp(context, 16)),
          ),
        ),
      ),
    );
  }

  Widget _sectionLabel(String text) => Text(text.toUpperCase(),
      style: AppTypography.label.copyWith(
          color: AppColors.secondaryText,
          fontSize: ResponsiveHelper.sp(context, 10)));

  Widget _buildEmptyState(String message) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.auto_stories_rounded,
              color: Colors.white.withValues(alpha: 0.05),
              size: ResponsiveHelper.sp(context, 64)),
          const SizedBox(height: 20),
          Text(message,
              style: AppTypography.section.copyWith(
                  color: Colors.white10,
                  fontSize: ResponsiveHelper.sp(context, 20))),
        ],
      ),
    );
  }
}
