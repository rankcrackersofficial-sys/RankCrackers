import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/widgets/premium_button.dart';
import '../../../../shared/session/session_manager.dart';

class DiagnosticQuestion {
  final String id;
  final String questionText;
  final List<String> options;
  final int correctOptionIndex;
  final String explanation;
  final String conceptInsight;

  DiagnosticQuestion({
    required this.id,
    required this.questionText,
    required this.options,
    required this.correctOptionIndex,
    required this.explanation,
    required this.conceptInsight,
  });

  factory DiagnosticQuestion.fromMap(Map<String, dynamic> map, String id) {
    return DiagnosticQuestion(
      id: id,
      questionText: map['question'] ?? '',
      options: List<String>.from(map['options'] ?? []),
      correctOptionIndex: map['correctIndex'] ?? 0,
      explanation: map['explanation'] ?? '',
      conceptInsight: map['insight'] ?? 'Critical logic for competitive exams.',
    );
  }
}

class DiagnosticTestScreen extends ConsumerStatefulWidget {
  const DiagnosticTestScreen({super.key});

  @override
  ConsumerState<DiagnosticTestScreen> createState() =>
      _DiagnosticTestScreenState();
}

class _DiagnosticTestScreenState extends ConsumerState<DiagnosticTestScreen> {
  int currentQuestionIndex = 0;
  int? selectedOptionIndex;
  bool showFeedback = false;
  bool isLoading = true;
  List<DiagnosticQuestion> questions = [];

  @override
  void initState() {
    super.initState();
    _hydrateMissionTruth();
  }

  Future<void> _hydrateMissionTruth() async {
    final examId = await SessionManager.getExamId();
    if (examId == null) {
      if (mounted) context.go(AppRoutes.missionRealm);
      return;
    }

    try {
      // 🔱 PHYSICAL HYDRATION: Fetching real AI-generated assessment pool
      final snapshot = await FirebaseFirestore.instance
          .collection('mcq_pool')
          .where('examId', isEqualTo: examId)
          .limit(5)
          .get();

      if (snapshot.docs.isEmpty) {
        // Fallback if AI hasn't generated specific questions yet
        _loadUniversalDiagnostic();
      } else {
        setState(() {
          questions = snapshot.docs
              .map((doc) => DiagnosticQuestion.fromMap(doc.data(), doc.id))
              .toList();
          isLoading = false;
        });
      }
    } catch (e) {
      _loadUniversalDiagnostic();
    }
  }

  void _loadUniversalDiagnostic() {
    setState(() {
      // 🔱 FAKE UNIVERSAL CONTENT DISABLED
      questions = [];
      isLoading = false;
    });
  }

  void _submitAnswer() {
    if (selectedOptionIndex == null) return;
    setState(() => showFeedback = true);
  }

  void _nextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
      setState(() {
        currentQuestionIndex++;
        selectedOptionIndex = null;
        showFeedback = false;
      });
    } else {
      context.go(AppRoutes.diagnosticResult);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.gold)),
      );
    }

    if (questions.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_clock_rounded,
                  color: AppColors.gold, size: 64),
              const SizedBox(height: 24),
              Text('Diagnostic Not Ready', style: AppTypography.hero),
              const SizedBox(height: 14),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 40),
                child: Text(
                  'The diagnostic chamber is being calibrated for your mission realm. Please check back later.',
                  textAlign: MainAxisAlignment.center,
                  style: AppTypography.body,
                ),
              ),
              const SizedBox(height: 32),
              PremiumButton(
                text: "Back to Realms",
                onTap: () => context.go(AppRoutes.missionRealm),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            children: [
              Expanded(
                child: CustomScrollView(
                  physics: const BouncingScrollPhysics(),
                  slivers: [
                    _buildDiagnosticHeader(),
                    _buildAssessmentFocus(),
                    _buildAdaptiveMetrics(),
                    _buildQuestionChamber(),
                    _buildCognitiveReflection(),
                    const SliverToBoxAdapter(child: SizedBox(height: 40)),
                  ],
                ),
              ),
              SafeArea(
                top: false,
                minimum: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: PremiumButton(
                  text: showFeedback
                      ? (currentQuestionIndex == questions.length - 1
                          ? "Finish Assessment"
                          : "Next Question")
                      : "Submit Answer",
                  onTap: showFeedback ? _nextQuestion : _submitAnswer,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // DIAGNOSTIC HEADER 🔱
  // ==========================================================
  Widget _buildDiagnosticHeader() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Diagnostic Chamber', style: AppTypography.hero),
            const SizedBox(height: 14),
            Text(
              'Assessment is not judgment. It is cognitive mapping.',
              style: AppTypography.body,
            ),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // ASSESSMENT FOCUS CARD 🔱
  // ==========================================================
  Widget _buildAssessmentFocus() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Adaptive Focus', style: AppTypography.cardTitle),
              const SizedBox(height: 18),
              Text(
                'Analyzing real-world patterns for the selected mission realm.',
                style: AppTypography.body,
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ==========================================================
  // ADAPTIVE METRICS GRID 🔱
  // ==========================================================
  Widget _buildAdaptiveMetrics() {
    return SliverPadding(
      padding: const EdgeInsets.all(20),
      sliver: SliverGrid(
        delegate: SliverChildListDelegate(
          [
            _metricCard(
                icon: Icons.psychology_rounded,
                value: '82%',
                label: 'Retention'),
            _metricCard(
                icon: Icons.flash_on_rounded, value: '14s', label: 'Reaction'),
            _metricCard(
                icon: Icons.memory_rounded, value: 'Moderate', label: 'Recall'),
            _metricCard(
                icon: Icons.auto_graph_rounded,
                value: 'Stable',
                label: 'Focus'),
          ],
        ),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
          childAspectRatio: 1.12,
        ),
      ),
    );
  }

  Widget _metricCard(
      {required IconData icon, required String value, required String label}) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderSoft),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppColors.gold, size: 22),
          const SizedBox(height: 12),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(value,
                maxLines: 1, style: AppTypography.hero.copyWith(fontSize: 32)),
          ),
          const SizedBox(height: 8),
          Text(label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.label),
        ],
      ),
    );
  }

  // ==========================================================
  // QUESTION CHAMBER 🔱
  // ==========================================================
  Widget _buildQuestionChamber() {
    if (questions.isEmpty) {
      return const SliverToBoxAdapter(child: SizedBox.shrink());
    }
    final q = questions[currentQuestionIndex];

    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildQuestionCard(question: q.questionText),
            const SizedBox(height: 30),
            ...List.generate(q.options.length, (index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: GestureDetector(
                  onTap: () {
                    if (!showFeedback) {
                      setState(() => selectedOptionIndex = index);
                    }
                  },
                  child: _optionCard(
                    option: q.options[index],
                    selected: selectedOptionIndex == index,
                  ),
                ),
              );
            }),
            if (showFeedback) _buildExplanation(q),
          ],
        ),
      ),
    );
  }

  Widget _buildQuestionCard({required String question}) {
    return DarkCard(
      padding: const EdgeInsets.all(24),
      child: Text(question,
          style: AppTypography.body
              .copyWith(height: 1.8, fontSize: 18, color: Colors.white)),
    );
  }

  Widget _optionCard({required String option, required bool selected}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: selected
            ? AppColors.gold.withValues(alpha: 0.1)
            : AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border:
            Border.all(color: selected ? AppColors.gold : AppColors.borderSoft),
      ),
      child: Row(
        children: [
          Expanded(
              child: Text(option,
                  style: AppTypography.body.copyWith(
                      color:
                          selected ? Colors.white : AppColors.secondaryText))),
        ],
      ),
    );
  }

  Widget _buildExplanation(DiagnosticQuestion q) {
    return Padding(
      padding: const EdgeInsets.only(top: 20),
      child: DarkCard(
        backgroundColor: AppColors.surface2,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.psychology_rounded,
                    color: Colors.greenAccent, size: 20),
                const SizedBox(width: 10),
                Text("Correct Insight",
                    style: AppTypography.cardTitle
                        .copyWith(color: Colors.greenAccent)),
              ],
            ),
            const SizedBox(height: 12),
            Text(q.explanation, style: AppTypography.body),
            const SizedBox(height: 18),
            Text("तथ्यात्मक समझ (Concept Insight)",
                style: AppTypography.label.copyWith(color: AppColors.gold)),
            const SizedBox(height: 8),
            Text(q.conceptInsight,
                style: AppTypography.body.copyWith(fontSize: 13)),
          ],
        ),
      ),
    );
  }

  // ==========================================================
  // COGNITIVE REFLECTION 🔱
  // ==========================================================
  Widget _buildCognitiveReflection() {
    return SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: DarkCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('तुलनात्मक प्रतिबिंब (Cognitive Reflection)',
                  style:
                      AppTypography.cardTitle.copyWith(color: AppColors.gold)),
              const SizedBox(height: 14),
              Text(
                'आपकी प्रतिक्रिया का समय (Reaction Time) स्थिर है, लेकिन कुछ क्षेत्रों में सटीकता की आवश्यकता है।',
                style: AppTypography.body.copyWith(height: 1.6),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
