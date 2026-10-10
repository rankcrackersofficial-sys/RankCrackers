import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../core/theme/tactical_noir_background.dart';
import '../../../../core/utils/app_routes.dart';
import '../../../../core/widgets/dark_card.dart';
import '../../models/test_arena_event.dart';
import '../../models/test_arena_paper.dart';
import '../../models/test_arena_attempt.dart';
import '../../models/test_arena_result.dart';
import '../../core/test_arena_engine.dart';
import '../../core/test_arena_fixture_harness.dart';
import '../../../digibook/domain/models/digibook_launch_args.dart';
import '../../../digibook/domain/services/digibook_canonical_bridge_service.dart';

/// TEST ARENA ACTIVE TEST SCREEN
/// Full-screen, high-focus standardized exam interface.
/// Bottom navigation bar is hidden. Zero live correctness leaks during active attempt.
class TestArenaActiveTestScreen extends StatefulWidget {
  final TestArenaEvent event;
  final TestArenaPaper paper;
  final String uid;
  final bool isFixtureMode;

  const TestArenaActiveTestScreen({
    super.key,
    required this.event,
    required this.paper,
    required this.uid,
    this.isFixtureMode = false,
  });

  @override
  State<TestArenaActiveTestScreen> createState() => _TestArenaActiveTestScreenState();
}

class _TestArenaActiveTestScreenState extends State<TestArenaActiveTestScreen> {
  late TestArenaAttempt _attempt;
  int _currentQuestionIndex = 0;
  Timer? _countdownTimer;
  Duration _remainingTime = Duration.zero;
  TestArenaResult? _result;
  final TextEditingController _numericalController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _attempt = TestArenaEngine.initializeAttempt(
      attemptId: 'ATT_${DateTime.now().millisecondsSinceEpoch}_${widget.uid.hashCode.abs()}',
      uid: widget.uid,
      event: widget.event,
      paper: widget.paper,
    );
    _remainingTime = _attempt.remainingDuration;
    _startCountdown();
    _syncNumericalController();
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _numericalController.dispose();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      final remaining = _attempt.remainingDuration;
      setState(() {
        _remainingTime = remaining;
      });

      if (remaining <= Duration.zero) {
        timer.cancel();
        _handleAutoSubmit();
      }
    });
  }

  void _syncNumericalController() {
    final currentQ = widget.paper.questions[_currentQuestionIndex];
    final currentResp = _attempt.responses[currentQ.questionId];
    _numericalController.text = currentResp?.numericalAnswer ?? '';
  }

  void _handleOptionSelect(int optionIndex) {
    if (!_attempt.isActive) return;
    final currentQ = widget.paper.questions[_currentQuestionIndex];
    setState(() {
      _attempt = TestArenaEngine.recordAnswer(
        attempt: _attempt,
        questionId: currentQ.questionId,
        selectedOptionIndex: optionIndex,
        additionalTimeSpentSeconds: 2,
      );
    });
  }

  void _handleNumericalChange(String value) {
    if (!_attempt.isActive) return;
    final currentQ = widget.paper.questions[_currentQuestionIndex];
    setState(() {
      _attempt = TestArenaEngine.recordAnswer(
        attempt: _attempt,
        questionId: currentQ.questionId,
        numericalAnswer: value.trim(),
        additionalTimeSpentSeconds: 2,
      );
    });
  }

  void _handleClearResponse() {
    if (!_attempt.isActive) return;
    final currentQ = widget.paper.questions[_currentQuestionIndex];
    setState(() {
      _attempt = TestArenaEngine.recordAnswer(
        attempt: _attempt,
        questionId: currentQ.questionId,
        clearSelectedOption: true,
        clearNumericalAnswer: true,
      );
      _numericalController.clear();
    });
  }

  void _handleToggleMarkForReview() {
    if (!_attempt.isActive) return;
    final currentQ = widget.paper.questions[_currentQuestionIndex];
    setState(() {
      _attempt = TestArenaEngine.toggleMarkForReview(
        attempt: _attempt,
        questionId: currentQ.questionId,
      );
    });
  }

  void _handleAutoSubmit() {
    if (_attempt.isCompleted) return;
    final finalized = TestArenaEngine.finalizeSubmission(
      attempt: _attempt,
      isAutoSubmit: true,
    );

    setState(() {
      _attempt = finalized;
    });

    _computeAndShowResult();
  }

  void _handleManualSubmit() {
    final summary = _attempt.summary;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(
          'Submit Assessment',
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 17),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Please review your attempt statistics before finalizing:',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            const SizedBox(height: 14),
            _buildReviewStatRow('Total Questions', '${summary.totalQuestions}', Colors.white),
            _buildReviewStatRow('Answered', '${summary.answeredCount}', const Color(0xFF4CAF50)),
            _buildReviewStatRow('Unanswered', '${summary.unansweredCount}', Colors.white60),
            _buildReviewStatRow('Marked for Review', '${summary.markedForReviewCount}', AppColors.gold),
            const SizedBox(height: 14),
            const Text(
              'Once submitted, answers cannot be modified.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 11, fontStyle: FontStyle.italic),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('RETURN TO TEST', style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              final finalized = TestArenaEngine.finalizeSubmission(
                attempt: _attempt,
                isAutoSubmit: false,
              );
              setState(() {
                _attempt = finalized;
              });
              _computeAndShowResult();
            },
            child: const Text('SUBMIT TEST', style: TextStyle(fontWeight: FontWeight.w800)),
          ),
        ],
      ),
    );
  }

  void _computeAndShowResult() {
    _countdownTimer?.cancel();
    final keys = widget.isFixtureMode
        ? TestArenaFixtureHarness.stagingAnswerKeys
        : <String, dynamic>{};

    final result = TestArenaEngine.scoreAttempt(
      attempt: _attempt,
      paper: widget.paper,
      verifiedAnswerKeys: keys,
      isLiveAttempt: !widget.isFixtureMode,
    );

    setState(() {
      _result = result;
    });
  }

  void _openQuestionPalette() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'QUESTION PALETTE',
                    style: TextStyle(color: AppColors.gold, fontSize: 13, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: Colors.white70),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              // Legend Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildPaletteLegend(const Color(0xFF4CAF50), 'Answered'),
                  _buildPaletteLegend(Colors.white24, 'Unanswered'),
                  _buildPaletteLegend(AppColors.gold, 'Review'),
                ],
              ),
              const SizedBox(height: 16),
              // Grid of questions
              Flexible(
                child: GridView.builder(
                  shrinkWrap: true,
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 6,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                  ),
                  itemCount: widget.paper.questions.length,
                  itemBuilder: (context, index) {
                    final q = widget.paper.questions[index];
                    final resp = _attempt.responses[q.questionId];
                    final isAns = resp?.isAnswered ?? false;
                    final isRev = resp?.isMarkedForReview ?? false;
                    final isCur = index == _currentQuestionIndex;

                    Color bg = Colors.white.withValues(alpha: 0.05);
                    Color border = Colors.white12;
                    Color text = Colors.white70;

                    if (isAns && isRev) {
                      bg = AppColors.gold.withValues(alpha: 0.3);
                      border = AppColors.gold;
                      text = Colors.white;
                    } else if (isAns) {
                      bg = const Color(0xFF4CAF50).withValues(alpha: 0.25);
                      border = const Color(0xFF4CAF50);
                      text = Colors.white;
                    } else if (isRev) {
                      bg = AppColors.gold.withValues(alpha: 0.15);
                      border = AppColors.gold;
                      text = AppColors.gold;
                    }

                    if (isCur) {
                      border = Colors.white;
                    }

                    return InkWell(
                      onTap: () {
                        Navigator.pop(ctx);
                        setState(() {
                          _currentQuestionIndex = index;
                          _syncNumericalController();
                        });
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: bg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: border, width: isCur ? 2.0 : 1.0),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          '${index + 1}',
                          style: TextStyle(color: text, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_result != null) {
      return _buildResultView(_result!);
    }

    final currentQ = widget.paper.questions[_currentQuestionIndex];
    final currentResp = _attempt.responses[currentQ.questionId];
    final totalQuestions = widget.paper.questions.length;

    final hours = _remainingTime.inHours.toString().padLeft(2, '0');
    final minutes = (_remainingTime.inMinutes % 60).toString().padLeft(2, '0');
    final seconds = (_remainingTime.inSeconds % 60).toString().padLeft(2, '0');

    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: Column(
            children: [
              // 🔱 1. TOP EXAM HEADER (Zero Dashboard/Bottom Nav distractions)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  border: Border(bottom: BorderSide(color: Colors.white10)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            widget.isFixtureMode ? 'STAGING' : 'TEST ARENA',
                            style: const TextStyle(color: AppColors.gold, fontSize: 9, fontWeight: FontWeight.bold),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Q ${_currentQuestionIndex + 1} of $totalQuestions',
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ],
                    ),
                    // Authoritative Live Timer
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _remainingTime.inMinutes < 5
                            ? Colors.red.withValues(alpha: 0.2)
                            : Colors.white.withValues(alpha: 0.06),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: _remainingTime.inMinutes < 5 ? Colors.red : Colors.white12,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            Icons.timer_outlined,
                            size: 14,
                            color: _remainingTime.inMinutes < 5 ? Colors.red : AppColors.gold,
                          ),
                          const SizedBox(width: 5),
                          Text(
                            '$hours:$minutes:$seconds',
                            style: TextStyle(
                              color: _remainingTime.inMinutes < 5 ? Colors.red : Colors.white,
                              fontWeight: FontWeight.w700,
                              fontSize: 12,
                              fontFeatures: const [FontFeature.tabularFigures()],
                            ),
                          ),
                        ],
                      ),
                    ),
                    // Palette & Submit
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.grid_view_rounded, color: Colors.white70, size: 20),
                          onPressed: _openQuestionPalette,
                          tooltip: 'Question Palette',
                        ),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.gold,
                            foregroundColor: Colors.black,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          ),
                          onPressed: _handleManualSubmit,
                          child: const Text('SUBMIT', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 11)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // 🔱 2. QUESTION BODY AREA
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Subject & Type Tags
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            currentQ.subject.toUpperCase(),
                            style: const TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.05),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              currentQ.questionType == 'numerical' ? 'NUMERICAL VALUE' : 'SINGLE CHOICE',
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 9, fontWeight: FontWeight.w600),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // Question Text
                      Text(
                        currentQ.questionText,
                        style: AppTypography.body.copyWith(
                          color: Colors.white,
                          fontSize: 15,
                          height: 1.5,
                        ),
                      ),
                      const SizedBox(height: 20),

                      // MCQ Options or Numerical Input
                      if (currentQ.questionType == 'numerical') ...[
                        DarkCard(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Enter Numerical Value:',
                                style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                              ),
                              const SizedBox(height: 8),
                              TextField(
                                controller: _numericalController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true, signed: true),
                                style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                                decoration: InputDecoration(
                                  hintText: 'e.g. 4.5',
                                  hintStyle: const TextStyle(color: Colors.white30),
                                  filled: true,
                                  fillColor: Colors.white.withValues(alpha: 0.04),
                                  border: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(color: Colors.white12),
                                  ),
                                  focusedBorder: OutlineInputBorder(
                                    borderRadius: BorderRadius.circular(8),
                                    borderSide: const BorderSide(color: AppColors.gold),
                                  ),
                                ),
                                onChanged: _handleNumericalChange,
                              ),
                            ],
                          ),
                        ),
                      ] else ...[
                        for (int i = 0; i < currentQ.options.length; i++) ...[
                          _buildOptionTile(
                            index: i,
                            text: currentQ.options[i],
                            isSelected: currentResp?.selectedOptionIndex == i,
                          ),
                          const SizedBox(height: 10),
                        ],
                      ],
                    ],
                  ),
                ),
              ),

              // 🔱 3. BOTTOM ACTION CONTROLS
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  border: Border(top: BorderSide(color: Colors.white10)),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Mark for Review Button
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(
                          color: (currentResp?.isMarkedForReview ?? false) ? AppColors.gold : Colors.white24,
                        ),
                        backgroundColor: (currentResp?.isMarkedForReview ?? false)
                            ? AppColors.gold.withValues(alpha: 0.12)
                            : Colors.transparent,
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: Icon(
                        (currentResp?.isMarkedForReview ?? false) ? Icons.bookmark_rounded : Icons.bookmark_border_rounded,
                        size: 16,
                        color: (currentResp?.isMarkedForReview ?? false) ? AppColors.gold : Colors.white70,
                      ),
                      label: Text(
                        'REVIEW',
                        style: TextStyle(
                          color: (currentResp?.isMarkedForReview ?? false) ? AppColors.gold : Colors.white70,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      onPressed: _handleToggleMarkForReview,
                    ),
                    const SizedBox(width: 8),

                    // Clear Button
                    if (currentResp?.isAnswered ?? false) ...[
                      TextButton(
                        onPressed: _handleClearResponse,
                        child: const Text('Clear', style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                      ),
                      const SizedBox(width: 8),
                    ],

                    // Previous Button
                    IconButton(
                      icon: const Icon(Icons.chevron_left_rounded, color: Colors.white),
                      onPressed: _currentQuestionIndex > 0
                          ? () {
                              setState(() {
                                _currentQuestionIndex--;
                                _syncNumericalController();
                              });
                            }
                          : null,
                    ),

                    // Next Button
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.gold,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      icon: const Icon(Icons.chevron_right_rounded, size: 18),
                      label: Text(
                        _currentQuestionIndex < totalQuestions - 1 ? 'NEXT' : 'SUMMARY',
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 12),
                      ),
                      onPressed: () {
                        if (_currentQuestionIndex < totalQuestions - 1) {
                          setState(() {
                            _currentQuestionIndex++;
                            _syncNumericalController();
                          });
                        } else {
                          _handleManualSubmit();
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOptionTile({
    required int index,
    required String text,
    required bool isSelected,
  }) {
    final optionLabel = String.fromCharCode(65 + index); // 'A', 'B', 'C', 'D'

    return InkWell(
      onTap: () => _handleOptionSelect(index),
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.gold.withValues(alpha: 0.12)
              : Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: isSelected ? AppColors.gold : Colors.white12,
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isSelected ? AppColors.gold : Colors.white.withValues(alpha: 0.06),
              ),
              alignment: Alignment.center,
              child: Text(
                optionLabel,
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                text,
                style: TextStyle(
                  color: isSelected ? Colors.white : Colors.white70,
                  fontSize: 14,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaletteLegend(Color color, String label) {
    return Row(
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 6),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
      ],
    );
  }

  Widget _buildReviewStatRow(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }

  // ---------------------------------------------------------------------------
  // RESULT VIEW (GOVERNED POST-SUBMISSION / STAGING FEEDBACK)
  // ---------------------------------------------------------------------------
  Widget _buildResultView(TestArenaResult res) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: TacticalNoirBackground(
        child: SafeArea(
          child: SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.gold.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        'ASSESSMENT COMPLETE',
                        style: TextStyle(color: AppColors.gold, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  widget.paper.paperTitle,
                  style: AppTypography.hero.copyWith(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 4),
                Text(
                  'Completed on ${res.completedAt.toLocal().toString().split('.').first}',
                  style: const TextStyle(color: AppColors.textSecondary, fontSize: 12),
                ),
                const SizedBox(height: 16),

                // Score Overview Card
                DarkCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildScoreMetric('Score', '${res.totalScore} / ${res.maxScore}', AppColors.gold),
                          _buildScoreMetric('Accuracy', '${res.accuracy}%', Colors.white),
                          _buildScoreMetric('Attempted', '${res.totalAttempted} / ${widget.paper.totalQuestions}', Colors.white70),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Subject Performance
                const Text(
                  'SUBJECT BREAKDOWN',
                  style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                ),
                const SizedBox(height: 8),
                for (final subj in res.subjectScores.values) ...[
                  DarkCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(subj.subject, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
                        Text('${subj.score} / ${subj.maxScore}', style: const TextStyle(color: AppColors.gold, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                ],
                const SizedBox(height: 16),

                // Canonical Remediation Targets
                if (res.remediationTargets.isNotEmpty) ...[
                  const Text(
                    'CONCEPT REMEDIATION TARGETS',
                    style: TextStyle(color: AppColors.gold, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.1),
                  ),
                  const SizedBox(height: 8),
                  for (final rem in res.remediationTargets) ...[
                    DarkCard(
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          const Icon(Icons.menu_book_rounded, color: AppColors.gold, size: 18),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Q${rem.questionNumber} • ${rem.subject}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                                Text(
                                  rem.isContentAvailable ? 'DigiBook Lesson Available' : 'Remediation queued',
                                  style: TextStyle(
                                    color: rem.isContentAvailable ? const Color(0xFF4CAF50) : AppColors.textSecondary,
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (rem.isContentAvailable && rem.generationUnitId != null)
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.gold,
                                foregroundColor: Colors.black,
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                              ),
                              onPressed: () {
                                final bridge = DigiBookCanonicalBridgeService.instance;
                                final entry = bridge.getEntryByGuId(rem.generationUnitId!);
                                if (entry != null) {
                                  final args = DigiBookLaunchArgs(
                                    generationUnitId: entry.guId,
                                    canonicalNodeId: entry.canonicalNodeId,
                                    revisionId: entry.lessonRevision,
                                    subject: entry.subject,
                                    topicTitle: entry.topic,
                                    factSemantics: entry.factSemantics,
                                    atomicFactIds: entry.atomicFactIds,
                                  );
                                  context.push(AppRoutes.digibook, extra: args);
                                }
                              },
                              child: const Text('REMEDY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 10)),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                ],
                const SizedBox(height: 20),

                // Close Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white12,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => context.pop(),
                    child: const Text('CLOSE TEST ARENA', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildScoreMetric(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
      ],
    );
  }
}
