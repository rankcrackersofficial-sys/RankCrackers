import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/deep_profile/models/education_record.dart';
import 'package:rank_crackers/features/deep_profile/data/subject_master.dart';

void main() {
  group('🔱 Career Profile Education History Logic', () {

    test('1. Derived Highest Qualification from multiple records', () {
      final profile = const WarriorProfile(
        uid: 'test',
        educationRecords: [
          EducationRecord(id: '1', level: 'Class 10', status: 'Completed'),
          EducationRecord(id: '2', level: 'Class 12', status: 'Completed'),
          EducationRecord(id: '3', level: 'Bachelor\'s Degree', status: 'Pursuing'),
        ],
      );

      expect(profile.derivedHighestQualification, 'Class 12');
    });

    test('2. syncLegacyFields updates scalar fields from records', () {
      final profile = const WarriorProfile(
        uid: 'test',
        educationRecords: [
          EducationRecord(
            id: '1',
            level: 'Bachelor\'s Degree',
            status: 'Completed',
            degreeId: 'BTech',
            subjectIds: ['computer_science', 'mathematics'],
          ),
        ],
      );

      final synced = profile.syncLegacyFields();

      expect(synced.highestQualification, 'Bachelor\'s Degree');
      expect(synced.graduationDegree, 'BTech');
      expect(synced.isGraduationCompleted, isTrue);
      expect(synced.graduationSubjects, contains('computer_science'));
    });

    test('3. Subject Suggestions are level and stream aware', () {
      final class10 = SubjectMaster.getSuggestions(level: 'Class 10');
      expect(class10, contains('Science'));
      expect(class10, isNot(contains('Accountancy')));

      final pcb = SubjectMaster.getSuggestions(level: 'Class 12', stream: 'Medical / PCB');
      expect(pcb, contains('Biology'));
      expect(pcb, isNot(contains('Accountancy')));

      final commerce = SubjectMaster.getSuggestions(level: 'Class 12', stream: 'Commerce');
      expect(commerce, contains('Accountancy'));
      expect(commerce, isNot(contains('Biology')));
    });

    test('4. Subject Normalization: "Mathematics" and "Math" mapping', () {
        expect(SubjectMaster.normalize('Mathematics'), 'mathematics');
        expect(SubjectMaster.normalize('math'), 'mathematics');
        expect(SubjectMaster.normalize('Physics'), 'physics');
    });

    test('5. Career Profile Added Count considers education records', () {
        final profile = const WarriorProfile(
            uid: 'test',
            educationRecords: [EducationRecord(id: '1', level: 'Class 10', status: 'Completed')],
        );
        expect(profile.careerProfileAddedCount, greaterThan(0));
    });
  });
}
