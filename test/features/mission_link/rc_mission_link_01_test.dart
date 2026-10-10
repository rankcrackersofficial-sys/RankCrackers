import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/models/recruitment.dart';

void main() {
  group('RC_MISSION_LINK_01 canonical mission authority', () {
    test(
      'Founder, Student, and audit configs use the same Firebase project',
      () {
        final firebaseRc = File('.firebaserc').readAsStringSync();
        final googleServices = File(
          'android/app/google-services.json',
        ).readAsStringSync();
        final firebaseOptions = File(
          'lib/firebase_options.dart',
        ).readAsStringSync();

        expect(firebaseRc, contains('rankcrackers-55'));
        expect(googleServices, contains('"project_id": "rankcrackers-55"'));
        expect(firebaseOptions, contains("projectId: 'rankcrackers-55'"));
      },
    );

    test(
      'Student mission discovery reads the canonical mission_realms source',
      () {
        final firestore = File(
          'lib/core/firebase/firestore_service.dart',
        ).readAsStringSync();

        expect(
          firestore,
          contains("missionRealmCollection = 'mission_realms'"),
        );
        expect(firestore, contains('streamMissionRealmRecruitments'));
        expect(firestore, contains("const sourceType = 'mission_realms'"));
        expect(firestore, contains('final sourceMissionId = docId'));
        expect(firestore, isNot(contains('student_mission_catalog')));
      },
    );

    test('Recruitment carries Student projection lineage to the UI layer', () {
      const recruitment = Recruitment(
        id: 'rec_nta_jee_main_2027',
        recruitmentGroupId: 'mission_realms',
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
        decoded.studentPublicationState,
        recruitment.studentPublicationState,
      );
    });

    test('JEE Main 2027 no longer collapses into the 2026 legacy pilot id', () {
      final registry = File(
        'functions/canonical_mission_registry.js',
      ).readAsStringSync();
      final canonicalStore = File(
        'functions/services/canonical_mission_realm_store.js',
      ).readAsStringSync();

      expect(registry, isNot(contains("'jee main 2027'")));
      expect(canonicalStore, contains('canonicalMissionPath'));
      expect(canonicalStore, contains('mission_realms/'));
    });
  });
}
