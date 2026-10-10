import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Founder upload is explicitly candidate-first and family-bound', () {
    final source =
        File('lib/web/founder/mission_control/mission_documents_tab.dart')
            .readAsStringSync();
    expect(source, contains("'activationState': 'CANDIDATE'"));
    expect(source, contains("'studentTruth': false"));
    expect(source,
        contains("'documentFamily': _documentFamilyFor(_documentType)"));
    expect(source, contains("'sourceSha256': hash"));
  });

  test('Document workspace exposes compact source authority decisions', () {
    final source =
        File('lib/web/founder/mission_control/mission_documents_tab.dart')
            .readAsStringSync();
    for (final label in const [
      'SOURCE AUTHORITY',
      'CANONICAL',
      'CANDIDATE',
      'VERIFICATION PENDING',
      'SUPERSEDED',
      'ACTIVATE VERIFIED SOURCE'
    ]) {
      expect(source, contains(label));
    }
    expect(source, contains('expectedActivationEpoch'));
    expect(source, contains('expectedCanonicalVersionId'));
  });

  test('Publish Gate fails closed on canonical source authority', () {
    final source = File(
            'lib/web/founder/mission_control/mission_publish_readiness_panel.dart')
        .readAsStringSync();
    for (final label in const [
      'CANONICAL SOURCE VERIFIED',
      'SOURCE VERSION CURRENT',
      'ACADEMIC DELTA APPLIED',
      'DOWNSTREAM VERIFICATION',
      'STALE SOURCE JOBS',
      'AMBIGUOUS DELTA'
    ]) {
      expect(source, contains(label));
    }
    expect(source, contains('canonicalVerified &&'));
    expect(source, contains('noAmbiguousDelta'));
  });

  test('canonical source authority cannot be directly written by clients', () {
    final rules = File('firestore.rules').readAsStringSync();
    expect(rules, contains('match /source_slots/{slotId}'));
    expect(rules, contains('match /source_versions/{versionId}'));
    expect(rules, contains('match /canonical_source_events/{eventId}'));
    expect(rules, contains('allow write: if false;'));
  });

  test('Student and Android surfaces are not imported by source authority UI',
      () {
    final source =
        File('lib/web/founder/mission_control/mission_documents_tab.dart')
            .readAsStringSync();
    expect(source, isNot(contains('features/home')));
    expect(source, isNot(contains('student_panel')));
    expect(source, isNot(contains('android/')));
  });
}
