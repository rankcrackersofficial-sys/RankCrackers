import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/recruitment.dart';

void main() {
  group('RC_MISSION_LINK_01 canonical mission authority', () {
    test('Founder, Student, and audit configs use the same Firebase project',
        () {
      final firebaseRc = File('.firebaserc').readAsStringSync();
      final googleServices =
          File('android/app/google-services.json').readAsStringSync();
      final firebaseOptions =
          File('lib/firebase_options.dart').readAsStringSync();
      final backfill = File('functions/backfill_student_mission_catalog.js')
          .readAsStringSync();

      expect(firebaseRc, contains('rankcrackers-55'));
      expect(googleServices, contains('"project_id": "rankcrackers-55"'));
      expect(firebaseOptions, contains("projectId: 'rankcrackers-55'"));
      expect(backfill, contains("projectId: 'rankcrackers-55'"));
    });

    test('Student mission projection is lineage-bound to mission_realms', () {
      final firestore =
          File('lib/core/firebase/firestore_service.dart').readAsStringSync();
      final mirror = File('functions/callable/handle_sentinel_action.js')
          .readAsStringSync();
      final backfill = File('functions/backfill_student_mission_catalog.js')
          .readAsStringSync();

      expect(firestore, contains("studentMissionCatalogCollection"));
      expect(firestore, contains('_hasCanonicalMissionLineage'));
      expect(firestore, contains("sourceType == 'mission_realms'"));
      expect(firestore, contains("sourceMissionId == docId"));
      expect(mirror, contains('sourceMissionId: realmId'));
      expect(mirror, contains("sourceType: 'mission_realms'"));
      expect(backfill, contains('sourceMissionId: id'));
      expect(backfill, contains("sourceType: 'mission_realms'"));
    });

    test('Recruitment carries Student projection lineage to the UI layer', () {
      const recruitment = Recruitment(
        id: 'rec_nta_jee_main_2027',
        recruitmentGroupId: 'student_mission_catalog',
        boardId: 'NTA',
        examId: 'rec_nta_jee_main_2027',
        examBlueprintId: 'rec_nta_jee_main_2027_blueprint',
        title: 'JEE Main 2027',
        titleHindi: 'JEE Main 2027',
        year: 2027,
        state: 'Central',
        examCategory: 'competitive',
        sourceMissionId: 'rec_nta_jee_main_2027',
        sourceMissionVersion: '7',
        sourcePath: 'mission_realms/rec_nta_jee_main_2027',
        sourceType: 'mission_realms',
        studentPublicationState: 'LIVE',
      );

      final encoded = recruitment.toMap();
      expect(encoded['sourceMissionId'], 'rec_nta_jee_main_2027');
      expect(encoded['sourcePath'], 'mission_realms/rec_nta_jee_main_2027');
      expect(encoded['sourceType'], 'mission_realms');

      final decoded = Recruitment.fromMap(encoded);
      expect(decoded.sourceMissionId, recruitment.sourceMissionId);
      expect(decoded.sourceMissionVersion, recruitment.sourceMissionVersion);
      expect(
          decoded.studentPublicationState, recruitment.studentPublicationState);
    });

    test('JEE Main 2027 no longer collapses into the 2026 legacy pilot id', () {
      final registry =
          File('functions/canonical_mission_registry.js').readAsStringSync();
      final missionMirrorTest =
          File('functions/test_mission_mirror.js').readAsStringSync();

      expect(registry, isNot(contains("'jee main 2027'")));
      expect(missionMirrorTest, contains('rec_nta_jee_main_2027'));
      expect(
        missionMirrorTest,
        contains('does not map to jee_main_2026'),
      );
    });
  });
}
