import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/opportunities/models/opportunity.dart';
import 'package:rank_crackers/features/opportunities/services/career_signal_engine.dart';
import 'package:rank_crackers/features/opportunities/services/opportunity_matching_service.dart';
import '../../fixtures/career_signal_fixtures.dart';

void main() {
  group('Sovereign Career Signals Matrix & Eligibility Tests (REPAIRED)', () {
    
    final fixtures = CareerSignalFixtures.getGovernedTestFixtures();

    final neetBioProfile = WarriorProfile(
      uid: 'test_student_neet',
      currentEducationStage: 'Class 12',
      subjectsStudied: const ['physics', 'chemistry', 'biology'],
      highestQualification: 'Class 12 Board',
      academicStream: 'Medical / PCB',
    );

    final jeePcmProfile = WarriorProfile(
      uid: 'test_student_jee',
      currentEducationStage: 'Class 12',
      subjectsStudied: const ['physics', 'chemistry', 'mathematics'],
      highestQualification: 'Class 12 Board',
      academicStream: 'Non-Medical / PCM',
    );

    test('1. PCB + NEET matches MBBS signals', () {
      final signals = CareerSignalEngine.compute(
        profile: neetBioProfile,
        recruitmentId: 'neet_ug_2027',
        activeMissionName: 'NEET UG 2027',
        dbOpportunities: fixtures,
      );

      expect(signals.any((s) => s.title.contains('MBBS')), isTrue);
      expect(signals.first.relevanceState, 'Profile Matched');
    });

    test('2. PCM + JEE matches BTech signals', () {
      final signals = CareerSignalEngine.compute(
        profile: jeePcmProfile,
        recruitmentId: 'jee_main_2027',
        activeMissionName: 'JEE Main 2027',
        dbOpportunities: fixtures,
      );

      expect(signals.any((s) => s.title.contains('BTech')), isTrue);
      expect(signals.first.relevanceState, 'Profile Matched');
    });

    test('3. Mission Isolation: JEE student does not see NEET signals', () {
      final signals = CareerSignalEngine.compute(
        profile: jeePcmProfile,
        recruitmentId: 'jee_main_2027',
        activeMissionName: 'JEE Main 2027',
        dbOpportunities: fixtures,
      );

      expect(signals.any((s) => s.title.contains('MBBS')), isFalse);
    });

    test('4. Subject mismatch flags more information needed', () {
      final commerceProfile = WarriorProfile(
        uid: 'test_student_commerce',
        subjectsStudied: const ['accountancy'],
      );

      final signals = CareerSignalEngine.compute(
        profile: commerceProfile,
        recruitmentId: 'jee_main_2027',
        activeMissionName: 'JEE Main 2027',
        dbOpportunities: fixtures,
      );

      expect(signals.first.relevanceState, 'More Information Needed');
      expect(signals.first.reasonCodes.any((r) => r.contains('Missing required 10+2 subjects')), isTrue);
    });

    test('5. false eligibility prevention ensures non-qualifying students are never marked Eligible', () {
      final evaluation = OpportunityMatchingService.evaluate(
        profile: neetBioProfile, // Missing math
        opportunity: fixtures.firstWhere((o) => o.id == 'opp_jee_cs'),
      );
      expect(evaluation.eligible, isFalse);
    });
  });
}
