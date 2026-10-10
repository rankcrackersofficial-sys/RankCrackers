import '../models/test_arena_event.dart';
import '../models/test_arena_paper.dart';
import '../../../core/authority/mission_exam_contract.dart';

/// NON-PRODUCTION TEST FIXTURE HARNESS
/// Isolated staging harness used strictly for unit testing and Founder device runtime validation.
/// Does NOT contain synthetic academic content in normal student runtime.
class TestArenaFixtureHarness {
  static const String fixtureEventId = 'TEST_FIXTURE_EVENT_JEE2027_01';
  static const String fixturePaperId = 'TEST_FIXTURE_PAPER_JEE2027_01';
  static const String fixtureVersionHash = '7a9d3e8f4c2b1a0e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e';

  /// Builds a test-safe fixture event for runtime verification.
  static TestArenaEvent createStagingEvent({
    DateTime? startTime,
    DateTime? endTime,
  }) {
    final now = DateTime.now();
    final start = startTime ?? now.subtract(const Duration(minutes: 5));
    final end = endTime ?? now.add(const Duration(hours: 3));

    return TestArenaEvent(
      eventId: fixtureEventId,
      title: 'Staging Diagnostic Assessment (Non-Production Fixture)',
      examId: 'jee_main_2027',
      paperId: fixturePaperId,
      eventType: TestArenaEventType.missionMajor,
      status: TestArenaEventStatus.live,
      examContract: MissionExamContract.jeeMain2027Contract,
      paperContract: MissionExamContract.jeeMain2027Contract.papers.first,
      questionIds: const [
        'FIXTURE_Q_PHY_01',
        'FIXTURE_Q_PHY_02',
        'FIXTURE_Q_CHE_01',
        'FIXTURE_Q_CHE_02',
        'FIXTURE_Q_MAT_01',
        'FIXTURE_Q_MAT_02',
      ],
      scheduledStart: start,
      scheduledEnd: end,
      isRankAuthoritative: false,
    );
  }

  /// Builds a test-safe fixture paper containing structural placeholder questions.
  static TestArenaPaper createStagingPaper() {
    return const TestArenaPaper(
      paperId: fixturePaperId,
      missionId: 'jee_main_2027',
      paperTitle: 'Staging Standardized Benchmark Paper',
      versionHash: fixtureVersionHash,
      totalQuestions: 6,
      durationMinutes: 180,
      domainIds: ['physics', 'chemistry', 'mathematics'],
      scoringPolicy: TestArenaScoringPolicy(
        policyVersion: 'FIXTURE_JEE_MAIN_2027_POLICY_V1',
        correctMarks: 4,
        incorrectMarks: -1,
        unattemptedMarks: 0,
        negativeMarkingOnNumerical: true,
      ),
      questions: [
        TestArenaQuestionItem(
          questionId: 'FIXTURE_Q_PHY_01',
          questionNumber: 1,
          subject: 'Physics',
          questionType: 'mcq_single',
          questionText: 'A particle moves along a straight line such that its velocity is given by v(t) = 3t^2 + 2t m/s. Find the displacement between t = 0 and t = 2 s.',
          options: ['12 m', '16 m', '20 m', '24 m'],
          canonicalNodeId: 'JEE_MAIN_2026_PHY_U02_T_057cee13',
          generationUnitId: 'GU_JEEMAIN2027_PHY_057CEE13',
        ),
        TestArenaQuestionItem(
          questionId: 'FIXTURE_Q_PHY_02',
          questionNumber: 2,
          subject: 'Physics',
          questionType: 'numerical',
          questionText: 'A block of mass 2 kg rests on a frictionless plane inclined at 30 degrees. Calculate the net acceleration along the incline (g = 9.8 m/s^2).',
          options: [],
          canonicalNodeId: 'JEE_MAIN_2026_PHY_U03_T_00000002',
          generationUnitId: 'GU_JEEMAIN2027_PHY_0059FC83',
        ),
        TestArenaQuestionItem(
          questionId: 'FIXTURE_Q_CHE_01',
          questionNumber: 3,
          subject: 'Chemistry',
          questionType: 'mcq_single',
          questionText: 'Calculate the molar mass of an organic compound containing 40% Carbon, 6.7% Hydrogen, and 53.3% Oxygen by mass with empirical formula CH2O (n = 2).',
          options: ['30 g/mol', '60 g/mol', '90 g/mol', '180 g/mol'],
          canonicalNodeId: 'JEE_MAIN_2026_CHE_U01_T_00000001',
          generationUnitId: 'GU_JEEMAIN2027_CHE_910B0B49',
        ),
        TestArenaQuestionItem(
          questionId: 'FIXTURE_Q_CHE_02',
          questionNumber: 4,
          subject: 'Chemistry',
          questionType: 'numerical',
          questionText: 'Determine the maximum number of electrons that can be accommodated in a principal quantum shell with n = 3.',
          options: [],
          canonicalNodeId: 'JEE_MAIN_2026_CHE_U02_T_00000001',
          generationUnitId: 'GU_JEEMAIN2027_CHE_4DB27569',
        ),
        TestArenaQuestionItem(
          questionId: 'FIXTURE_Q_MAT_01',
          questionNumber: 5,
          subject: 'Mathematics',
          questionType: 'mcq_single',
          questionText: 'Let A = {1, 2, 3, 4} and B = {2, 4, 6, 8}. Find the cardinality of the symmetric difference A Delta B.',
          options: ['2', '4', '6', '8'],
          canonicalNodeId: 'JEE_MAIN_2026_MAT_U01_T_00000001',
          generationUnitId: 'GU_JEEMAIN2027_MAT_9BB8FB46',
        ),
        TestArenaQuestionItem(
          questionId: 'FIXTURE_Q_MAT_02',
          questionNumber: 6,
          subject: 'Mathematics',
          questionType: 'numerical',
          questionText: 'Evaluate the limit as x approaches 0 of (sin(3x) / x).',
          options: [],
          canonicalNodeId: 'JEE_MAIN_2026_MAT_U05_T_00000001',
        ),
      ],
    );
  }

  /// Verified answer keys for the staging paper.
  static Map<String, dynamic> get stagingAnswerKeys => {
        'FIXTURE_Q_PHY_01': 1, // '16 m' (index 1)
        'FIXTURE_Q_PHY_02': 4.9, // 4.9 m/s^2
        'FIXTURE_Q_CHE_01': 1, // '60 g/mol' (index 1)
        'FIXTURE_Q_CHE_02': 18, // 18 electrons
        'FIXTURE_Q_MAT_01': 1, // 4 (index 1)
        'FIXTURE_Q_MAT_02': 3.0, // 3
      };
}
