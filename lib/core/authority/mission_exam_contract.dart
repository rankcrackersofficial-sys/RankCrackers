import 'package:equatable/equatable.dart';
import 'exam_pattern_authority.dart';

/// EXAM PAPER CONTRACT
/// Governs an individual paper within an official competitive examination.
class ExamPaperContract extends Equatable {
  final String paperId;
  final String paperName;
  final List<String> domainIds; // e.g. ['physics', 'chemistry', 'mathematics']
  final List<String> questionTypes; // e.g. ['mcq_single', 'numerical']
  final int totalQuestions;
  final int durationMinutes;
  final int totalMarks;
  final int correctMark;
  final int incorrectMark;
  final int unansweredMark;
  final bool negativeMarkingOnNumerical;
  final Map<String, dynamic> sectionRules;
  final double officialPacingMinutesPerQuestion;
  final List<String> paperDependencies;

  const ExamPaperContract({
    required this.paperId,
    required this.paperName,
    required this.domainIds,
    required this.questionTypes,
    required this.totalQuestions,
    required this.durationMinutes,
    required this.totalMarks,
    required this.correctMark,
    required this.incorrectMark,
    required this.unansweredMark,
    required this.negativeMarkingOnNumerical,
    this.sectionRules = const {},
    required this.officialPacingMinutesPerQuestion,
    this.paperDependencies = const [],
  });

  @override
  List<Object?> get props => [
        paperId,
        paperName,
        domainIds,
        questionTypes,
        totalQuestions,
        durationMinutes,
        totalMarks,
        correctMark,
        incorrectMark,
        unansweredMark,
        negativeMarkingOnNumerical,
        sectionRules,
        officialPacingMinutesPerQuestion,
        paperDependencies,
      ];
}

/// MISSION EXAM CONTRACT
/// Governs official examination blueprint, multiple papers, and scoring contracts per mission.
class MissionExamContract extends Equatable {
  final String missionId;
  final String recruitmentId;
  final int targetYear;
  final String authoritySource;
  final String authorityVersion;
  final ExamPatternAuthorityStatus authorityStatus;
  final List<ExamPaperContract> papers;
  final DateTime? effectiveFrom;
  final String? supersededBy;

  const MissionExamContract({
    required this.missionId,
    required this.recruitmentId,
    required this.targetYear,
    required this.authoritySource,
    required this.authorityVersion,
    required this.authorityStatus,
    required this.papers,
    this.effectiveFrom,
    this.supersededBy,
  });

  /// Canonical provisional baseline for JEE Main 2027 (Paper 1 based on latest official 2026 authority).
  static const MissionExamContract jeeMain2027Contract = MissionExamContract(
    missionId: 'jee_main_2026',
    recruitmentId: 'jee_main_2027',
    targetYear: 2027,
    authoritySource: 'NTA JEE Main Official Bulletin (Latest Baseline 2026)',
    authorityVersion: '2026.1-PROVISIONAL',
    authorityStatus: ExamPatternAuthorityStatus.provisionalLatestOfficialBaseline,
    papers: [
      ExamPaperContract(
        paperId: 'paper_1',
        paperName: 'Paper 1 (B.E. / B.Tech)',
        domainIds: ['physics', 'chemistry', 'mathematics'],
        questionTypes: ['mcq_single', 'numerical'],
        totalQuestions: 75,
        durationMinutes: 180,
        totalMarks: 300,
        correctMark: 4,
        incorrectMark: -1,
        unansweredMark: 0,
        negativeMarkingOnNumerical: true,
        sectionRules: {
          'physics': {'mcq': 20, 'numerical': 5},
          'chemistry': {'mcq': 20, 'numerical': 5},
          'mathematics': {'mcq': 20, 'numerical': 5},
        },
        officialPacingMinutesPerQuestion: 2.4,
      ),
    ],
  );

  @override
  List<Object?> get props => [
        missionId,
        recruitmentId,
        targetYear,
        authoritySource,
        authorityVersion,
        authorityStatus,
        papers,
        effectiveFrom,
        supersededBy,
      ];
}

/// MISSION EXAM CONTRACT REGISTRY
/// Resolves mission-specific exam contracts without silent fallbacks.
class MissionExamContractRegistry {
  static final Map<String, MissionExamContract> _registry = {
    'jee_main': MissionExamContract.jeeMain2027Contract,
    'jee_main_2026': MissionExamContract.jeeMain2027Contract,
    'jee_main_2027': MissionExamContract.jeeMain2027Contract,
  };

  /// Resolves contract for given mission ID.
  /// Returns null if not registered (NO SILENT DEFAULT FALLBACK to JEE).
  static MissionExamContract? getContract(String missionId) {
    final cleanId = missionId.toLowerCase().trim();
    for (final entry in _registry.entries) {
      if (cleanId.contains(entry.key)) {
        return entry.value;
      }
    }
    return null; // Fail-closed: SILENT_DEFAULT_EXAM_CONTRACT = 0
  }

  /// Registers or overrides a contract for testing or new mission onboarding.
  static void registerContract(String missionId, MissionExamContract contract) {
    _registry[missionId.toLowerCase().trim()] = contract;
  }
}
