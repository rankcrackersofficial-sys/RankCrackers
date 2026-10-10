import 'package:equatable/equatable.dart';
import '../../../core/authority/mission_exam_contract.dart';

/// TEST ARENA SCORING POLICY
/// Governs versioned marks policy for an assessment paper without silent defaults.
/// SCORING_POLICY_SILENT_DEFAULT_COUNT = 0
class TestArenaScoringPolicy extends Equatable {
  final String policyVersion;
  final int correctMarks;
  final int incorrectMarks;
  final int unattemptedMarks;
  final bool negativeMarkingOnNumerical;
  final Map<String, dynamic> sectionRules;

  const TestArenaScoringPolicy({
    required this.policyVersion,
    required this.correctMarks,
    required this.incorrectMarks,
    required this.unattemptedMarks,
    required this.negativeMarkingOnNumerical,
    this.sectionRules = const {},
  });

  /// Explicitly maps from a governed ExamPaperContract.
  factory TestArenaScoringPolicy.fromExamPaperContract(
    ExamPaperContract contract, {
    required String policyVersion,
  }) {
    return TestArenaScoringPolicy(
      policyVersion: policyVersion,
      correctMarks: contract.correctMark,
      incorrectMarks: contract.incorrectMark,
      unattemptedMarks: contract.unansweredMark,
      negativeMarkingOnNumerical: contract.negativeMarkingOnNumerical,
      sectionRules: contract.sectionRules,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'policyVersion': policyVersion,
      'correctMarks': correctMarks,
      'incorrectMarks': incorrectMarks,
      'unattemptedMarks': unattemptedMarks,
      'negativeMarkingOnNumerical': negativeMarkingOnNumerical,
      'sectionRules': sectionRules,
    };
  }

  factory TestArenaScoringPolicy.fromMap(Map<String, dynamic> map) {
    if (!map.containsKey('policyVersion') ||
        !map.containsKey('correctMarks') ||
        !map.containsKey('incorrectMarks') ||
        !map.containsKey('unattemptedMarks') ||
        !map.containsKey('negativeMarkingOnNumerical')) {
      throw ArgumentError('TestArenaScoringPolicy map missing required authority keys');
    }
    return TestArenaScoringPolicy(
      policyVersion: map['policyVersion'] as String,
      correctMarks: (map['correctMarks'] as num).toInt(),
      incorrectMarks: (map['incorrectMarks'] as num).toInt(),
      unattemptedMarks: (map['unattemptedMarks'] as num).toInt(),
      negativeMarkingOnNumerical: map['negativeMarkingOnNumerical'] as bool,
      sectionRules: Map<String, dynamic>.from(map['sectionRules'] ?? {}),
    );
  }

  @override
  List<Object?> get props => [
        policyVersion,
        correctMarks,
        incorrectMarks,
        unattemptedMarks,
        negativeMarkingOnNumerical,
        sectionRules,
      ];
}

/// TEST ARENA QUESTION ITEM
/// Standardized question delivery model for paper attempts.
/// Pre-submission security: answer keys, solutions, and internal metadata are suppressed in student runtime.
class TestArenaQuestionItem extends Equatable {
  final String questionId;
  final int questionNumber;
  final String subject; // 'Physics', 'Chemistry', 'Mathematics'
  final String questionType; // 'mcq_single', 'numerical'
  final String questionText;
  final List<String> options;
  final String? diagramUrl;
  final String? canonicalNodeId;
  final String? generationUnitId;
  final List<String> atomicFactIds;

  const TestArenaQuestionItem({
    required this.questionId,
    required this.questionNumber,
    required this.subject,
    required this.questionType,
    required this.questionText,
    this.options = const [],
    this.diagramUrl,
    this.canonicalNodeId,
    this.generationUnitId,
    this.atomicFactIds = const [],
  });

  /// Strips solution, answer keys and internal mastery links before delivery to candidate.
  Map<String, dynamic> toStudentDeliveryMap() {
    return {
      'questionId': questionId,
      'questionNumber': questionNumber,
      'subject': subject,
      'questionType': questionType,
      'questionText': questionText,
      'options': options,
      'diagramUrl': diagramUrl,
    };
  }

  factory TestArenaQuestionItem.fromMap(Map<String, dynamic> map) {
    return TestArenaQuestionItem(
      questionId: map['questionId'] ?? '',
      questionNumber: map['questionNumber'] ?? 1,
      subject: map['subject'] ?? '',
      questionType: map['questionType'] ?? 'mcq_single',
      questionText: map['questionText'] ?? '',
      options: List<String>.from(map['options'] ?? []),
      diagramUrl: map['diagramUrl'],
      canonicalNodeId: map['canonicalNodeId'],
      generationUnitId: map['generationUnitId'],
      atomicFactIds: List<String>.from(map['atomicFactIds'] ?? []),
    );
  }

  @override
  List<Object?> get props => [
        questionId,
        questionNumber,
        subject,
        questionType,
        questionText,
        options,
        diagramUrl,
        canonicalNodeId,
        generationUnitId,
        atomicFactIds,
      ];
}

/// TEST ARENA PAPER
/// Governed, immutable blueprint of questions, timing, domains, and scoring policy.
class TestArenaPaper extends Equatable {
  final String paperId;
  final String missionId;
  final String paperTitle;
  final String versionHash;
  final int totalQuestions;
  final int durationMinutes;
  final List<String> domainIds;
  final TestArenaScoringPolicy scoringPolicy;
  final List<TestArenaQuestionItem> questions;
  final bool isImmutable;

  const TestArenaPaper({
    required this.paperId,
    required this.missionId,
    required this.paperTitle,
    required this.versionHash,
    required this.totalQuestions,
    required this.durationMinutes,
    required this.domainIds,
    required this.scoringPolicy,
    required this.questions,
    this.isImmutable = true,
  });

  /// Fail-closed paper validation.
  bool get isReady =>
      paperId.isNotEmpty &&
      missionId.isNotEmpty &&
      versionHash.isNotEmpty &&
      totalQuestions > 0 &&
      questions.length == totalQuestions &&
      durationMinutes > 0 &&
      isImmutable;

  Map<String, dynamic> toMap() {
    return {
      'paperId': paperId,
      'missionId': missionId,
      'paperTitle': paperTitle,
      'versionHash': versionHash,
      'totalQuestions': totalQuestions,
      'durationMinutes': durationMinutes,
      'domainIds': domainIds,
      'scoringPolicy': scoringPolicy.toMap(),
      'questions': questions.map((q) => q.toStudentDeliveryMap()).toList(),
      'isImmutable': isImmutable,
    };
  }

  factory TestArenaPaper.fromMap(Map<String, dynamic> map) {
    return TestArenaPaper(
      paperId: map['paperId'] ?? '',
      missionId: map['missionId'] ?? '',
      paperTitle: map['paperTitle'] ?? '',
      versionHash: map['versionHash'] ?? '',
      totalQuestions: map['totalQuestions'] ?? 0,
      durationMinutes: map['durationMinutes'] ?? 0,
      domainIds: List<String>.from(map['domainIds'] ?? []),
      scoringPolicy: TestArenaScoringPolicy.fromMap(map['scoringPolicy'] ?? {}),
      questions: (map['questions'] as List<dynamic>?)
              ?.map((q) => TestArenaQuestionItem.fromMap(q))
              .toList() ??
          [],
      isImmutable: map['isImmutable'] ?? true,
    );
  }

  @override
  List<Object?> get props => [
        paperId,
        missionId,
        paperTitle,
        versionHash,
        totalQuestions,
        durationMinutes,
        domainIds,
        scoringPolicy,
        questions,
        isImmutable,
      ];
}
