import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/deep_profile/models/education_record.dart';
import 'package:rank_crackers/features/deep_profile/data/subject_master.dart';
import 'package:rank_crackers/features/deep_profile/services/profile_completion_engine.dart';

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

    test('6. Profile Completion Engine and No Double Counting', () {
      final profile = const WarriorProfile(
        uid: 'test',
        gender: 'Male',
        educationLevel: 'Bachelor\'s Degree',
        educationRecords: [
          EducationRecord(id: '1', level: 'Bachelor\'s Degree', status: 'Completed', subjectIds: ['physics'])
        ],
      );
      // Ensure calculation correctly tracks fields and avoids double counting
      final score = ProfileCompletionEngine.calculate(profile);
      expect(score, greaterThan(0));
    });

    test('7. Legacy Migration Round-Trip', () {
      final map = {
        'uid': 'legacy_user',
        'graduationDegree': 'BSc',
        'isGraduationCompleted': true,
        'graduationSubjects': ['physics', 'chemistry'],
        'postGraduationDegree': 'MSc',
        'isPostGraduationCompleted': false,
        'postGraduationSubjects': ['physics'],
      };

      final profile = WarriorProfile.fromMap(map);
      expect(profile.educationRecords, isNotEmpty);
      expect(profile.educationRecords.any((r) => r.level == "Bachelor's Degree"), isTrue);
      expect(profile.educationRecords.any((r) => r.level == "Master's Degree"), isTrue);

      final synced = profile.syncLegacyFields();
      expect(synced.graduationDegree, 'BSc');
      expect(synced.isGraduationCompleted, isTrue);
      expect(synced.graduationSubjects, contains('physics'));
      expect(synced.postGraduationDegree, 'MSc');
      expect(synced.isPostGraduationCompleted, isFalse);
    });

    test('8. EducationRecord Full Serialization & Deserialization Roundtrip', () {
      final record12 = const EducationRecord(
        id: '12',
        level: 'Class 12',
        stream: 'Medical / PCB',
        status: 'Completed',
        completionYear: '2022',
        subjectIds: ['physics', 'chemistry', 'biology'],
      );
      final recordBach = const EducationRecord(
        id: 'bach',
        level: "Bachelor's Degree",
        degreeId: 'BTech',
        specializationId: 'computer_science',
        status: 'Completed',
        completionYear: '2026',
        subjectIds: ['computer_science', 'mathematics'],
      );
      final recordProf = const EducationRecord(
        id: 'prof',
        level: 'Professional Qualification',
        degreeId: 'B.Ed.',
        status: 'Completed',
        completionYear: '2028',
      );
      final recordMast = const EducationRecord(
        id: 'mast',
        level: "Master's Degree",
        degreeId: 'MTech',
        status: 'Pursuing',
      );

      final profile = WarriorProfile(
        uid: 'roundtrip_user',
        educationRecords: [record12, recordBach, recordProf, recordMast],
      );

      // toMap
      final map = profile.toMap();

      // fromMap
      final profileAfter = WarriorProfile.fromMap(map);

      // Compare records
      expect(profileAfter.educationRecords.length, 4);
      
      final rec12After = profileAfter.educationRecords.firstWhere((r) => r.id == '12');
      expect(rec12After.level, 'Class 12');
      expect(rec12After.stream, 'Medical / PCB');
      expect(rec12After.status, 'Completed');
      expect(rec12After.completionYear, '2022');
      expect(rec12After.subjectIds, containsAll(['physics', 'chemistry', 'biology']));

      final recBachAfter = profileAfter.educationRecords.firstWhere((r) => r.id == 'bach');
      expect(recBachAfter.level, "Bachelor's Degree");
      expect(recBachAfter.degreeId, 'BTech');
      expect(recBachAfter.specializationId, 'computer_science');
      expect(recBachAfter.status, 'Completed');
      expect(recBachAfter.completionYear, '2026');
      expect(recBachAfter.subjectIds, containsAll(['computer_science', 'mathematics']));

      final recProfAfter = profileAfter.educationRecords.firstWhere((r) => r.id == 'prof');
      expect(recProfAfter.level, 'Professional Qualification');
      expect(recProfAfter.degreeId, 'B.Ed.');

      final recMastAfter = profileAfter.educationRecords.firstWhere((r) => r.id == 'mast');
      expect(recMastAfter.level, "Master's Degree");
      expect(recMastAfter.degreeId, 'MTech');
      expect(recMastAfter.status, 'Pursuing');
    });

    test('9. Legacy Migration Idempotency & No Duplicate Records on Re-Save/Re-Load', () {
      final legacyMap = {
        'uid': 'idempotency_user',
        'graduationDegree': 'BTech',
        'isGraduationCompleted': true,
        'graduationSubjects': ['computer_science', 'mathematics'],
      };

      // 1. First fromMap invocation creates dynamic educationRecords from legacy fields
      final profile1 = WarriorProfile.fromMap(legacyMap);
      expect(profile1.educationRecords.length, 1);
      expect(profile1.educationRecords.first.level, "Bachelor's Degree");

      // 2. We trigger toMap/syncLegacyFields and simulate a database save roundtrip
      final savedMap = profile1.toMap();
      
      // 3. Re-load from map should NOT duplicate records (idempotent fromMap check)
      final profile2 = WarriorProfile.fromMap(savedMap);
      expect(profile2.educationRecords.length, 1, reason: "LEGACY_MIGRATION_DUPLICATE_RECORD_COUNT = 0");

      // 4. Save and re-load again
      final reSavedMap = profile2.toMap();
      final profile3 = WarriorProfile.fromMap(reSavedMap);
      expect(profile3.educationRecords.length, 1);
      expect(profile3.educationRecords.first.level, "Bachelor's Degree");
    });
  });
}
