import 'package:equatable/equatable.dart';

/// EXAM PATTERN AUTHORITY STATUS
enum ExamPatternAuthorityStatus {
  provisionalLatestOfficialBaseline,
  provisionalModelDraft,
  officialRatifiedBulletin,
}

/// EXAM PATTERN AUTHORITY
/// Canonical reference for official NTA exam patterns.
class ExamPatternAuthority extends Equatable {
  final String authoritySource;
  final String authorityVersion;
  final ExamPatternAuthorityStatus authorityStatus;
  final String examId;
  final int totalQuestions;
  final int totalMarks;
  final int durationMinutes;

  const ExamPatternAuthority({
    required this.authoritySource,
    required this.authorityVersion,
    required this.authorityStatus,
    required this.examId,
    required this.totalQuestions,
    required this.totalMarks,
    required this.durationMinutes,
  });

  /// Canonical provisional latest official authority: JEE Main 2026 Paper 1
  /// (75 questions, 300 marks, 180 minutes, Physics/Chemistry/Maths each 20 MCQ + 5 Numerical, negative marking on both).
  static const ExamPatternAuthority jeeMainProvisionalBaseline = ExamPatternAuthority(
    authoritySource: 'NTA JEE Main Official Bulletin (Provisional Reference: 2026 Paper-1)',
    authorityVersion: '2026.1-PROVISIONAL-BASELINE',
    authorityStatus: ExamPatternAuthorityStatus.provisionalLatestOfficialBaseline,
    examId: 'jee_main',
    totalQuestions: 75,
    totalMarks: 300,
    durationMinutes: 180,
  );

  @override
  List<Object?> get props => [
        authoritySource,
        authorityVersion,
        authorityStatus,
        examId,
        totalQuestions,
        totalMarks,
        durationMinutes,
      ];
}
