import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/opportunities/services/opportunity_matching_service.dart';
import 'package:rank_crackers/features/opportunities/models/opportunity.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/deep_profile/models/education_record.dart';

void main() {
  group('🔱 Opportunity Matching with Education History', () {
    final baseTime = DateTime.now();

    test('1. Precision 10+2 Subject Match (PCM)', () {
      final opportunity = Opportunity(
        id: 'opp_pcm',
        title: 'Engineering Entry',
        department: 'Dept',
        state: 'Central',
        totalPosts: 10,
        notificationDate: baseTime,
        lastDate: baseTime,
        officialPdfUrl: '',
        status: 'published',
        eligibleMissionIds: const ['jee_main_2027'],
        requiredSubjects: const ['physics', 'chemistry', 'mathematics'],
      );

      // Student has Physics and Chemistry but missing Mathematics
      final profile = const WarriorProfile(
        uid: 'student_1',
        educationRecords: [
          EducationRecord(
            id: 'rec_12',
            level: 'Class 12',
            status: 'Completed',
            subjectIds: ['physics', 'chemistry', 'english'], // Missing 'mathematics'
          )
        ],
      );

      final result = OpportunityMatchingService.evaluate(profile: profile, opportunity: opportunity);
      expect(result.eligible, isFalse);
      expect(result.missingRequirements.first, contains('Missing required 10+2 subjects'));
    });

    test('2. Level-specific Subject Isolation (UG vs PG)', () {
       final opportunity = Opportunity(
        id: 'opp_ug_spec',
        title: 'Grad Specialist',
        department: 'Dept',
        state: 'Central',
        totalPosts: 10,
        notificationDate: baseTime,
        lastDate: baseTime,
        officialPdfUrl: '',
        status: 'published',
        eligibleMissionIds: const ['rpsc_1st_grade'],
        requiresGraduation: true,
        acceptedUgSubjects: const ['history'],
      );

      // Student has History in PG but NOT in UG
      final profile = const WarriorProfile(
        uid: 'student_2',
        educationRecords: [
          EducationRecord(
            id: 'rec_ug',
            level: 'Bachelor\'s Degree',
            status: 'Completed',
            degreeId: 'BSc',
            subjectIds: ['physics', 'chemistry'], // No History
          ),
          EducationRecord(
            id: 'rec_pg',
            level: 'Master\'s Degree',
            status: 'Completed',
            degreeId: 'MA',
            subjectIds: ['history'], // History is here
          ),
        ],
      );

      final result = OpportunityMatchingService.evaluate(profile: profile, opportunity: opportunity);

      // Should FAIL because opportunity requires 'history' in UG
      expect(result.eligible, isFalse);
      expect(result.missingRequirements.first, contains('Required UG subject specialization not found'));
    });

    test('3. Degree Completion Status Enforcement', () {
        final opportunity = Opportunity(
            id: 'opp_grad',
            title: 'Graduate Role',
            department: 'Dept',
            state: 'Central',
            totalPosts: 10,
            notificationDate: baseTime,
            lastDate: baseTime,
            officialPdfUrl: '',
            status: 'published',
            requiresGraduation: true,
        );

        // Student is pursuing Bachelor's
        final profile = const WarriorProfile(
            uid: 'student_3',
            educationRecords: [
                EducationRecord(
                    id: 'rec_ug',
                    level: 'Bachelor\'s Degree',
                    status: 'Pursuing', // Not completed
                    degreeId: 'BA',
                )
            ],
        );

        final result = OpportunityMatchingService.evaluate(profile: profile, opportunity: opportunity);
        expect(result.eligible, isFalse);
        expect(result.missingRequirements.first, contains('Incomplete or incompatible graduation degree'));
    });
  });
}
