import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

Map<String, dynamic> loadJson(String path) {
  return jsonDecode(File(path).readAsStringSync()) as Map<String, dynamic>;
}

void main() {
  const base = 'assets/data/preview/jee_main_2027';

  test('NEBULA VS0 mission manifest keeps preview safety locks', () {
    final manifest = loadJson('$base/mission_preview_manifest.json');
    expect(manifest['missionId'], 'jee_main_2026');
    expect(manifest['displayMission'], 'JEE Main 2027');
    expect(manifest['previewOnly'], true);
    expect(manifest['studentPublishReady'], false);
    expect(manifest['productionMaterializationAuthorized'], false);
    expect(manifest['progressPersistenceEnabled'], false);
    final safety = manifest['safety'] as Map<String, dynamic>;
    expect(safety['noFirestoreProductionWrite'], true);
    expect(safety['noStudentPublication'], true);
    expect(safety['noFakeDigiBookContent'], true);
  });

  test('NEBULA VS0 syllabus includes canonical atoms and excludes held atoms',
      () {
    final syllabus = loadJson('$base/syllabus_preview_tree.json');
    final summary = syllabus['summary'] as Map<String, dynamic>;
    expect(summary['totalAtoms'], 430);
    expect(summary['previewEligibleAtoms'], 417);
    expect(summary['heldExcludedAtoms'], 13);
    expect(summary['subjectCounts'], containsPair('Physics', 165));
    expect(summary['subjectCounts'], containsPair('Chemistry', 160));
    expect(summary['subjectCounts'], containsPair('Mathematics', 92));
    expect(syllabus['studentPublishReady'], false);
  });

  test(
      'NEBULA VS0 Crucible plan has exact structural shape and atom allocation',
      () {
    final crucible = loadJson('$base/crucible_preview_plan.json');
    expect(crucible['cycleDays'], 100);
    expect(crucible['phaseCount'], 7);
    expect(crucible['scheduleCount'], 42);
    expect(crucible['rebuildWindowCount'], 7);
    expect(crucible['macroTestSlotCount'], 7);
    expect(crucible['majorTestSlotCount'], 1);
    expect((crucible['phases'] as List).length, 7);
    expect((crucible['schedules'] as List).length, 42);
    final allocation = crucible['allocationIntegrity'] as Map<String, dynamic>;
    expect(allocation['previewEligibleAtoms'], 417);
    expect(allocation['allocatedPrimaryAtoms'], 417);
    expect(allocation['uniqueAllocatedAtoms'], 417);
    expect(allocation['duplicateAllocationCount'], 0);
    expect(allocation['missingAllocationCount'], 0);
  });

  test('NEBULA VS0 Mechanics Foundations DigiBook demo is real pilot content',
      () {
    final catalog = loadJson('$base/digibook_preview_catalog.json');
    expect(catalog['studentPublishReady'], false);
    final units = catalog['units'] as List;
    expect(units.length, 1);
    final unit = units.first as Map<String, dynamic>;
    expect(unit['title'], 'Mechanics Foundations');
    expect(unit['contentLabel'], 'INTERNAL PILOT CONTENT');
    expect(unit['authorizedAtoms'], hasLength(2));
    expect(unit['sectionCount'], 8);
    expect(unit['formulaCount'], 7);
    expect(unit['misconceptionCount'], 8);
    expect(unit['workedExampleCount'], 7);
    expect(unit['selfCheckCount'], 10);
    expect(unit['studentPublishReady'], false);
  });

  test('NEBULA VS0 assessment preview remains internal and non-persistent', () {
    final manifest = loadJson('$base/assessment_preview_manifest.json');
    expect(manifest['studentPublishReady'], false);
    expect(manifest['progressPersistenceEnabled'], false);
    final assessment =
        (manifest['assessments'] as List).first as Map<String, dynamic>;
    expect(assessment['itemCount'], 12);
    expect(assessment['totalPoints'], 16);
    expect(assessment['state'], 'INTERNAL_ASSESSMENT_PREVIEW');
    expect(assessment['resultsSaved'], false);
    expect(assessment['masteryUpdated'], false);
    expect(assessment['officialAnswerKey'], false);
    expect(assessment['studentPublishReady'], false);
  });
}
