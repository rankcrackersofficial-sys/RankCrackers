import 'dart:math';
import '../../../core/models/question_model.dart';
import '../../crucible/models/mission_crucible_blueprint.dart';
import '../models/student_learning_level.dart';
import '../models/smart_entry_result.dart';

/// DIAGNOSTIC ITEM RESPONSE
class DiagnosticItemResponse {
  final String questionId;
  final String domainId; // e.g. 'physics', 'history', 'reasoning', etc.
  final DifficultyBand difficulty;
  final bool isCorrect;
  final bool isSkipped;
  final Duration timeSpent;

  const DiagnosticItemResponse({
    required this.questionId,
    required this.domainId,
    required this.difficulty,
    required this.isCorrect,
    this.isSkipped = false,
    required this.timeSpent,
  });

  /// Alias for backward compatibility with subjectId callers.
  String get subjectId => domainId;
}

/// ASSESSMENT WINDOW EVIDENCE
/// Evidence package collected across a full Micro or Macro window.
class AssessmentWindowEvidence {
  final String windowId;
  final String windowType; // 'MICRO', 'MACRO'
  final String domainId; // subject or domain ID
  final int totalQuestions;
  final int correctCount;
  final double weightedScore; // Difficulty-weighted performance
  final double averageTimePerQuestionSeconds;
  final DateTime timestamp;

  const AssessmentWindowEvidence({
    required this.windowId,
    required this.windowType,
    required this.domainId,
    required this.totalQuestions,
    required this.correctCount,
    required this.weightedScore,
    required this.averageTimePerQuestionSeconds,
    required this.timestamp,
  });

  /// Alias for backward compatibility with subjectId callers.
  String get subjectId => domainId;
}

/// SMART ENTRY ENGINE (Universal Domain-Agnostic Core)
/// Implements multi-domain adaptive calibration and level evolution with hysteresis.
/// Consumes SmartEntryBlueprint to support any mission's domain topology (JEE, NEET, RPSC, UPSC, etc.).
class SmartEntryEngine {
  // ===================================================
  // 1. SMART ENTRY DIAGNOSTIC ASSEMBLY
  // ===================================================

  /// Assembles the two-stage Smart Entry diagnostic paper dynamically from SmartEntryBlueprint.
  /// Stage A: Common calibration items across all blueprint domains.
  /// Stage B: Adaptive items for domains with high classification uncertainty.
  static List<QuestionModel> assembleSmartEntryPaper({
    required List<QuestionModel> pool,
    SmartEntryBlueprint? blueprint,
    String? targetedDomainId,
  }) {
    final bp = blueprint ?? MissionCrucibleBlueprint.jeeMain2027Blueprint.smartEntryBlueprint;
    final List<QuestionModel> paper = [];

    // Stage A: Calibration items per domain
    for (final domain in bp.domainIds) {
      final domainPool = pool.where((q) => q.subjectId.toLowerCase() == domain.toLowerCase()).toList();
      final foundation = domainPool.where((q) => DifficultyBand.fromDynamic(q.difficulty) == DifficultyBand.foundation).toList();
      final standard = domainPool.where((q) => DifficultyBand.fromDynamic(q.difficulty) == DifficultyBand.standard).toList();
      final high = domainPool.where((q) => DifficultyBand.fromDynamic(q.difficulty) == DifficultyBand.highJeeMain).toList();

      final itemsNeeded = bp.calibrationItemsPerDomain;
      final fCount = (itemsNeeded * 0.4).round();
      final sCount = (itemsNeeded * 0.4).round();
      final hCount = itemsNeeded - fCount - sCount;

      paper.addAll(foundation.take(fCount));
      paper.addAll(standard.take(sCount));
      paper.addAll(high.take(hCount));
    }

    // Stage B: If targeted domain has low confidence, add adaptive targeted items
    if (targetedDomainId != null && paper.length < bp.maxTotalQuestions) {
      final remainingSlots = bp.maxTotalQuestions - paper.length;
      final targetPool = pool
          .where((q) =>
              q.subjectId.toLowerCase() == targetedDomainId.toLowerCase() &&
              !paper.any((p) => p.id == q.id))
          .toList();
      paper.addAll(targetPool.take(min(remainingSlots, bp.maxAdaptiveTargetItems)));
    }

    return paper;
  }

  // ===================================================
  // 2. MULTI-DIMENSIONAL SCORING & CLASSIFICATION
  // ===================================================

  /// Evaluates Smart Entry responses dynamically for any domain set.
  static SmartEntryResult evaluateDiagnostic({
    required List<DiagnosticItemResponse> responses,
    SmartEntryBlueprint? blueprint,
    DateTime? submissionTime,
  }) {
    final bp = blueprint ?? MissionCrucibleBlueprint.jeeMain2027Blueprint.smartEntryBlueprint;
    if (responses.isEmpty) {
      final Map<String, LearningLevel> defaultLevels = {
        for (var domain in bp.domainIds) domain: LearningLevel.middle,
      };
      return SmartEntryResult(
        globalLevel: LearningLevel.middle,
        subjectLevels: defaultLevels,
        classificationConfidence: 0.5,
        diagnosticVersion: 'v3.0',
        evidenceItemIds: const [],
        isProvisional: true,
        createdAt: submissionTime ?? DateTime.now(),
      );
    }

    final Map<String, List<DiagnosticItemResponse>> byDomain = {};
    for (final domain in bp.domainIds) {
      byDomain[domain.toLowerCase()] = [];
    }

    for (final r in responses) {
      final d = r.domainId.toLowerCase();
      byDomain.putIfAbsent(d, () => []).add(r);
    }

    final Map<String, LearningLevel> domainLevels = {};

    byDomain.forEach((domain, items) {
      if (items.isEmpty) {
        domainLevels[domain] = LearningLevel.middle;
        return;
      }

      double domainScore = 0.0;
      double domainMax = 0.0;

      for (final item in items) {
        double weight = 1.0;
        if (item.difficulty == DifficultyBand.standard) weight = 1.5;
        if (item.difficulty == DifficultyBand.highJeeMain) weight = 2.0;

        domainMax += weight;
        if (item.isCorrect) {
          domainScore += weight;
        } else if (item.isSkipped) {
          domainScore += 0.0;
        } else {
          domainScore = max(0.0, domainScore - (weight * 0.25));
        }
      }

      final ratio = domainMax > 0 ? (domainScore / domainMax) : 0.5;

      if (ratio >= 0.75) {
        domainLevels[domain] = LearningLevel.pro;
      } else if (ratio >= 0.40) {
        domainLevels[domain] = LearningLevel.middle;
      } else {
        domainLevels[domain] = LearningLevel.novice;
      }
    });

    // Global classification derivation
    final proCount = domainLevels.values.where((l) => l == LearningLevel.pro).length;
    final noviceCount = domainLevels.values.where((l) => l == LearningLevel.novice).length;
    final totalDomains = domainLevels.length;

    LearningLevel globalLevel = LearningLevel.middle;
    if (proCount >= (totalDomains / 2).ceil()) {
      globalLevel = LearningLevel.pro;
    } else if (noviceCount >= (totalDomains / 2).ceil()) {
      globalLevel = LearningLevel.novice;
    }

    final double confidence = (responses.length / bp.maxTotalQuestions).clamp(0.6, 0.95);

    return SmartEntryResult(
      globalLevel: globalLevel,
      subjectLevels: domainLevels,
      classificationConfidence: confidence,
      diagnosticVersion: 'v3.0',
      evidenceItemIds: responses.map((r) => r.questionId).toList(),
      isProvisional: true,
      createdAt: submissionTime ?? DateTime.now(),
    );
  }

  // ===================================================
  // 3. LEVEL EVOLUTION WITH HYSTERESIS
  // ===================================================

  /// Evaluates level evolution using evidence across at least 2 distinct assessment windows.
  static LearningLevel evaluateLevelEvolution({
    required LearningLevel currentLevel,
    required List<AssessmentWindowEvidence> history,
  }) {
    if (history.length < 2) {
      return currentLevel;
    }

    final recentWindows = history.length > 5 ? history.sublist(history.length - 5) : history;
    final avgScore = recentWindows.map((e) => e.weightedScore).reduce((a, b) => a + b) / recentWindows.length;

    switch (currentLevel) {
      case LearningLevel.novice:
        if (avgScore >= 0.75 && recentWindows.every((w) => w.weightedScore >= 0.60)) {
          return LearningLevel.middle;
        }
        return LearningLevel.novice;

      case LearningLevel.middle:
        if (avgScore >= 0.85 && recentWindows.every((w) => w.weightedScore >= 0.70)) {
          return LearningLevel.pro;
        } else if (avgScore < 0.35 && recentWindows.every((w) => w.weightedScore < 0.45)) {
          return LearningLevel.novice;
        }
        return LearningLevel.middle;

      case LearningLevel.pro:
        if (avgScore < 0.55 && recentWindows.every((w) => w.weightedScore < 0.65)) {
          return LearningLevel.middle;
        }
        return LearningLevel.pro;
    }
  }

  // ===================================================
  // 4. LEARNING LOAD SIGNAL
  // ===================================================

  /// Computes the non-medical learning load signal from behavioral metrics.
  static LearningLoadStatus computeLearningLoad({
    required double skipRate,
    required double easyItemAccuracy,
    required int consecutiveErrors,
    required double timeUtilizationRatio,
  }) {
    if (consecutiveErrors >= 4 || (skipRate > 0.40 && easyItemAccuracy < 0.50) || timeUtilizationRatio > 1.25) {
      return LearningLoadStatus.highDemand;
    } else if (easyItemAccuracy >= 0.85 && consecutiveErrors <= 1 && skipRate < 0.15) {
      return LearningLoadStatus.low;
    }
    return LearningLoadStatus.balanced;
  }
}
