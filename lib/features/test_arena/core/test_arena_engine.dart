import '../../../core/authority/mission_exam_contract.dart';
import '../../../core/models/question_model.dart';
import '../models/test_arena_event.dart';
import '../models/test_arena_result.dart';

/// STUDENT PAPER RESPONSE
class StudentPaperResponse {
  final String questionId;
  final String domainId;
  final String questionType; // 'mcq_single', 'numerical'
  final dynamic studentAnswer; // int (MCQ index) or double (numerical)
  final dynamic verifiedCorrectAnswer;
  final bool isAnswered;
  final Duration timeSpent;

  const StudentPaperResponse({
    required this.questionId,
    required this.domainId,
    required this.questionType,
    this.studentAnswer,
    this.verifiedCorrectAnswer,
    required this.isAnswered,
    required this.timeSpent,
  });

  bool get isCorrect {
    if (!isAnswered || studentAnswer == null || verifiedCorrectAnswer == null) {
      return false;
    }
    if (questionType == 'numerical') {
      final s = double.tryParse(studentAnswer.toString());
      final v = double.tryParse(verifiedCorrectAnswer.toString());
      return s != null && v != null && s == v;
    }
    return studentAnswer.toString() == verifiedCorrectAnswer.toString();
  }
}

/// TEST ARENA ENGINE (Generic Mission-Agnostic Competitive Core)
/// Sovereign authority for standardized benchmarking, official exam simulation, and competitive ranking.
class TestArenaEngine {
  // ===================================================
  // 1. STANDARDIZED MAJOR ASSEMBLY
  // ===================================================

  /// Assembles a standardized, non-personalized Major test paper from MissionExamContract.
  /// Standardized: IDENTICAL benchmark structure for all students (No Novice/Middle/Pro variants).
  static List<QuestionModel> assembleMajorPaper({
    required MissionExamContract contract,
    required ExamPaperContract paper,
    required List<QuestionModel> pool,
  }) {
    final List<QuestionModel> selected = [];

    for (final domain in paper.domainIds) {
      final domainPool = pool.where((q) => q.subjectId.toLowerCase() == domain.toLowerCase()).toList();

      final sectionRule = paper.sectionRules[domain] as Map<String, dynamic>?;
      if (sectionRule != null) {
        final mcqCount = (sectionRule['mcq'] as num?)?.toInt() ?? 20;
        final numCount = (sectionRule['numerical'] as num?)?.toInt() ?? 5;

        final mcqs = domainPool.where((q) => q.questionType == 'mcq_single').toList();
        final nums = domainPool.where((q) => q.questionType == 'numerical').toList();

        selected.addAll(mcqs.take(mcqCount));
        selected.addAll(nums.take(numCount));
      } else {
        final itemsPerDomain = paper.totalQuestions ~/ paper.domainIds.length;
        selected.addAll(domainPool.take(itemsPerDomain));
      }
    }

    return selected;
  }

  // ===================================================
  // 2. SERVER-AUTHORITATIVE ATTEMPT SCORING
  // ===================================================

  /// Scores a completed paper attempt using the authoritative paper contract rules.
  static TestArenaResult scoreAttempt({
    required TestArenaEvent event,
    required String uid,
    required List<StudentPaperResponse> responses,
    required bool isLiveAttempt,
    DateTime? completionTime,
  }) {
    final paper = event.paperContract;
    int totalRawScore = 0;
    final Map<String, int> domainScores = {};

    for (final domain in paper.domainIds) {
      domainScores[domain] = 0;
    }

    for (final resp in responses) {
      final domain = resp.domainId.toLowerCase();
      int itemScore = 0;

      if (!resp.isAnswered) {
        itemScore = paper.unansweredMark;
      } else if (resp.isCorrect) {
        itemScore = paper.correctMark;
      } else {
        // Negative marking check
        if (resp.questionType == 'numerical' && !paper.negativeMarkingOnNumerical) {
          itemScore = 0;
        } else {
          itemScore = paper.incorrectMark;
        }
      }

      totalRawScore += itemScore;
      domainScores[domain] = (domainScores[domain] ?? 0) + itemScore;
    }

    return TestArenaResult(
      eventId: event.eventId,
      uid: uid,
      rawScore: totalRawScore,
      domainScores: domainScores,
      isLiveAttempt: isLiveAttempt,
      completedAt: completionTime ?? DateTime.now(),
    );
  }

  // ===================================================
  // 3. RANKING & PERCENTILE COMPUTATION
  // ===================================================

  /// Computes official event rankings for all valid live participants.
  /// Late historical attempts receive historical benchmark percentiles (Fake live AIR strictly forbidden).
  static List<TestArenaResult> computeEventRankings({
    required String eventId,
    required List<TestArenaResult> results,
  }) {
    final liveResults = results.where((r) => r.isLiveAttempt).toList();
    final historicalResults = results.where((r) => !r.isLiveAttempt).toList();

    // Sort live results descending by score
    liveResults.sort((a, b) => b.rawScore.compareTo(a.rawScore));

    final totalLive = liveResults.length;
    final List<TestArenaResult> rankedLive = [];

    for (int i = 0; i < totalLive; i++) {
      final rank = i + 1;
      final percentile = totalLive > 1
          ? (((totalLive - rank) / (totalLive - 1)) * 100.0)
          : 100.0;

      rankedLive.add(liveResults[i].copyWith(
        eventRank: rank,
        participantCount: totalLive,
        percentile: double.parse(percentile.toStringAsFixed(2)),
      ));
    }

    // Benchmark historical results against live distribution without altering live ranks
    final List<TestArenaResult> benchmarkedHistorical = [];
    for (final h in historicalResults) {
      if (liveResults.isEmpty) {
        benchmarkedHistorical.add(h.copyWith(historicalBenchmarkPercentile: 50.0));
      } else {
        final belowCount = liveResults.where((r) => r.rawScore < h.rawScore).length;
        final histPercentile = (belowCount / liveResults.length) * 100.0;
        benchmarkedHistorical.add(h.copyWith(
          historicalBenchmarkPercentile: double.parse(histPercentile.toStringAsFixed(2)),
        ));
      }
    }

    return [...rankedLive, ...benchmarkedHistorical];
  }

  // ===================================================
  // 4. TEST ARENA → CRUCIBLE FEEDBACK
  // ===================================================

  /// Generates formative training feedback from standardized performance without mutating Test Arena ranking records.
  static Map<String, dynamic> generateCrucibleFeedback({
    required TestArenaResult result,
    required List<StudentPaperResponse> responses,
  }) {
    final totalQuestions = responses.length;
    final answeredQuestions = responses.where((r) => r.isAnswered).length;
    final correctQuestions = responses.where((r) => r.isCorrect).length;
    final accuracy = answeredQuestions > 0 ? (correctQuestions / answeredQuestions) : 0.0;

    final weakDomains = <String>[];
    result.domainScores.forEach((domain, score) {
      if (score < 40) {
        weakDomains.add(domain);
      }
    });

    return {
      'rawScore': result.rawScore,
      'percentile': result.percentile ?? result.historicalBenchmarkPercentile ?? 0.0,
      'accuracy': accuracy,
      'weakDomains': weakDomains,
      'requiresTimedExecutionDrill': accuracy > 0.70 && answeredQuestions < (totalQuestions * 0.70),
      'requiresConceptualRebuild': accuracy < 0.40,
    };
  }
}
