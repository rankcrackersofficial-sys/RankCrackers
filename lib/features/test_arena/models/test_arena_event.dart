import 'package:equatable/equatable.dart';
import '../../../core/authority/mission_exam_contract.dart';

/// TEST ARENA EVENT TYPE
enum TestArenaEventType {
  missionMajor,
  standardizedMock,
  subjectDrill,
  speedBlitz,
}

/// TEST ARENA EVENT STATUS
/// Governs the strict lifecycle of competitive events.
enum TestArenaEventStatus {
  draft,
  reviewed,
  approved,
  scheduled,
  live,
  closed,
  ranked,
  archived,
}

/// TEST ARENA EVENT
/// Standardized, non-personalized competitive assessment event.
class TestArenaEvent extends Equatable {
  final String eventId;
  final String title;
  final String examId;
  final String paperId;
  final TestArenaEventType eventType;
  final TestArenaEventStatus status;
  final MissionExamContract examContract;
  final ExamPaperContract paperContract;
  final List<String> questionIds;
  final DateTime scheduledStart;
  final DateTime scheduledEnd;
  final bool isRankAuthoritative;

  const TestArenaEvent({
    required this.eventId,
    required this.title,
    required this.examId,
    required this.paperId,
    required this.eventType,
    required this.status,
    required this.examContract,
    required this.paperContract,
    required this.questionIds,
    required this.scheduledStart,
    required this.scheduledEnd,
    this.isRankAuthoritative = false,
  });

  bool get isLiveNow {
    final now = DateTime.now();
    return status == TestArenaEventStatus.live &&
        now.isAfter(scheduledStart) &&
        now.isBefore(scheduledEnd);
  }

  @override
  List<Object?> get props => [
        eventId,
        title,
        examId,
        paperId,
        eventType,
        status,
        examContract,
        paperContract,
        questionIds,
        scheduledStart,
        scheduledEnd,
        isRankAuthoritative,
      ];
}
