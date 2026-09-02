import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/opportunities/services/career_signal_engine.dart';
import 'package:rank_crackers/features/opportunities/models/opportunity.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';

void main() {
  group('🔱 CareerSignalEngine Authority Logic', () {
    final baseTime = DateTime.now();

    test('1. Canonical Mission Matching: Signal generated only if missionId matches', () {
      final profile = const WarriorProfile(uid: 'test');
      final opportunities = [
        Opportunity(
          id: 'opp_jee',
          title: 'JEE Opportunity',
          department: 'Dept',
          state: 'Central',
          totalPosts: 10,
          notificationDate: baseTime,
          lastDate: baseTime,
          officialPdfUrl: '',
          status: 'published',
          eligibleMissionIds: const ['jee_main_2027'],
        ),
        Opportunity(
          id: 'opp_neet',
          title: 'NEET Opportunity',
          department: 'Dept',
          state: 'Central',
          totalPosts: 10,
          notificationDate: baseTime,
          lastDate: baseTime,
          officialPdfUrl: '',
          status: 'published',
          eligibleMissionIds: const ['neet_ug_2027'],
        ),
      ];

      final signals = CareerSignalEngine.compute(
        profile: profile,
        recruitmentId: 'jee_main_2027',
        activeMissionName: 'JEE Main 2027',
        dbOpportunities: opportunities,
      );

      expect(signals.length, 1);
      expect(signals.first.opportunityId, 'opp_jee');
    });

    test('2. No Heuristic Match: Titles containing mission keywords do not auto-match if ID is missing', () {
       final profile = const WarriorProfile(uid: 'test');
       final opportunities = [
        Opportunity(
          id: 'opp_mismatch',
          title: 'Advanced JEE Pathways', // Contains JEE
          department: 'Dept',
          state: 'Central',
          totalPosts: 10,
          notificationDate: baseTime,
          lastDate: baseTime,
          officialPdfUrl: '',
          status: 'published',
          eligibleMissionIds: const ['other_mission'], // Does NOT contain jee_main_2027
        ),
      ];

      final signals = CareerSignalEngine.compute(
        profile: profile,
        recruitmentId: 'jee_main_2027',
        activeMissionName: 'JEE Main 2027',
        dbOpportunities: opportunities,
      );

      expect(signals.isEmpty, isTrue);
    });

    test('3. Stricter Subject Match (PCB): All subjects must be present for NEET signals', () {
        final opportunity = Opportunity(
          id: 'opp_neet',
          title: 'NEET',
          department: 'Health',
          state: 'Central',
          totalPosts: 100,
          notificationDate: baseTime,
          lastDate: baseTime,
          officialPdfUrl: '',
          status: 'published',
          eligibleMissionIds: const ['neet_ug_2027'],
          requiredSubjects: const ['Physics', 'Chemistry', 'Biology'],
        );

        // Case A: Missing Biology
        final profileA = const WarriorProfile(
            uid: 'student_a',
            subjectsStudied: ['Physics', 'Chemistry', 'Mathematics'], // Missing Bio
        );

        final signalsA = CareerSignalEngine.compute(
            profile: profileA,
            recruitmentId: 'neet_ug_2027',
            activeMissionName: 'NEET',
            dbOpportunities: [opportunity],
        );

        expect(signalsA.first.relevanceState, 'More Information Needed');
        expect(signalsA.first.reasonCodes.any((r) => r.contains('Missing required subjects')), isTrue);

        // Case B: Full match
        final profileB = const WarriorProfile(
            uid: 'student_b',
            subjectsStudied: ['Physics', 'Chemistry', 'Biology'],
        );

        final signalsB = CareerSignalEngine.compute(
            profile: profileB,
            recruitmentId: 'neet_ug_2027',
            activeMissionName: 'NEET',
            dbOpportunities: [opportunity],
        );

        expect(signalsB.first.relevanceState, 'Profile Matched');
    });

    test('4. Incomplete Graduation Completion Blocks Eligibility', () {
        final opportunity = Opportunity(
          id: 'opp_ias',
          title: 'UPSC IAS',
          department: 'UPSC',
          state: 'Central',
          totalPosts: 100,
          notificationDate: baseTime,
          lastDate: baseTime,
          officialPdfUrl: '',
          status: 'published',
          eligibleMissionIds: const ['jee_main_2027'], // Using JEE to match our test session
          requiresGraduation: true,
          acceptedDegrees: const ['BA', 'BSc', 'BTech'],
        );

        // Case A: Degree is Bachelor's but not marked Completed
        final profileA = const WarriorProfile(
            uid: 'student_a',
            highestQualification: "Bachelor's",
            graduationDegree: 'BTech',
            isGraduationCompleted: false, // Incomplete
            degreeCompletionStatus: 'Enrolled',
        );

        final signalsA = CareerSignalEngine.compute(
            profile: profileA,
            recruitmentId: 'jee_main_2027',
            activeMissionName: 'JEE',
            dbOpportunities: [opportunity],
        );

        expect(signalsA.first.relevanceState, 'More Information Needed');
        expect(signalsA.first.reasonCodes.any((r) => r.contains('graduation degree')), isTrue);
    });
  });
}
