import 'dart:convert';
import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';
import 'package:rank_crackers/features/digibook/domain/models/digibook_launch_args.dart';
import 'package:rank_crackers/shared/widgets/formatted_math_text.dart';

void main() {
  group('RC DigiBook Syllabus Canonical Bridge Invariants', () {
    late DigiBookCanonicalBridgeService bridge;

    setUpAll(() async {
      bridge = DigiBookCanonicalBridgeService.instance;

      // Load manifest directly from filesystem for test harness
      final manifestFile =
          File('docs/academic_review/digibook_authority_bridge_manifest.json');
      expect(manifestFile.existsSync(), isTrue,
          reason: 'Authority bridge manifest file must exist.');

      final rawJson = await manifestFile.readAsString();
      final Map<String, dynamic> data = jsonDecode(rawJson);

      bridge.initializeFromMap(data);
      expect(bridge.isInitialized, isTrue);
    });

    test('1. Sets Canary Route: Syllabus node JEE_MAIN_2026_MAT_U01_T_00000001 -> GU_JEEMAIN2027_MAT_9BB8FB46',
        () async {
      const canonicalNodeId = 'JEE_MAIN_2026_MAT_U01_T_00000001';
      final result = bridge.resolveCanonicalNode(canonicalNodeId);

      expect(result.isMapped, isTrue,
          reason: 'CANONICAL_SYLLABUS_TO_DIGIBOOK_ROUTE must be YES.');
      expect(result.isMultiGu, isFalse);
      expect(result.entries.length, equals(1));

      final entry = result.primaryEntry!;
      expect(entry.guId, equals('GU_JEEMAIN2027_MAT_9BB8FB46'),
          reason: 'OPENED_GU_ID must be GU_JEEMAIN2027_MAT_9BB8FB46.');
      expect(entry.subject, equals('Mathematics'));
      expect(entry.lessonRevision, equals('REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001'));
      expect(entry.factSemantics, equals('SOURCE_FACT_COMPLETE'));
      expect(entry.atomicFactIds.length, equals(16),
          reason: 'SYLLABUS_TO_ATOMICFACT_CHAIN_PROVEN must be YES.');

      // Verify dynamic revision loading (not hardcoded)
      final launchArgs = await bridge.buildLaunchArgs(entry.guId);
      expect(launchArgs, isNotNull);
      expect(launchArgs!.generationUnitId, equals('GU_JEEMAIN2027_MAT_9BB8FB46'));
      expect(launchArgs.revisionId, equals('REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001'),
          reason: 'SYLLABUS_MAPPING_HARDCODES_REVISION = NO.');
    });

    test('2. Multi-GU Topic Support: 1 topic -> multiple GUs mapped', () {
      const multiGuNodeId = 'JEE_MAIN_2026_CHE_U01_T_00000005';
      final result = bridge.resolveCanonicalNode(multiGuNodeId);

      expect(result.isMapped, isTrue);
      expect(result.isMultiGu, isTrue,
          reason: 'MULTI_GU_TOPIC_SUPPORTED must be YES.');
      expect(result.entries.length, equals(2));

      final guIds = result.entries.map((e) => e.guId).toList();
      expect(guIds, contains('GU_JEEMAIN2027_CHE_024AF105'));
      expect(guIds, contains('GU_JEEMAIN2027_CHE_AFF61328'));
    });

    test('3. Unmapped Topic Fail-Closed: Zero title guessing permitted', () {
      const unmappedNodeId = 'JEE_MAIN_2026_MAT_U99_T_99999999';
      final result = bridge.resolveCanonicalNode(unmappedNodeId);

      expect(result.isMapped, isFalse,
          reason: 'UNMAPPED_TOPIC_GUESSED_ROUTE must be 0.');
      expect(result.entries, isEmpty);

      // Verify title lookup is strictly disabled
      final titleAttempt = bridge.allEntries.where((e) => e.topic.contains('Sets'));
      expect(titleAttempt, isNotEmpty);
      // Hard identity law forbids routing by title string match
      expect(result.status, equals(DigiBookBridgeResolveStatus.unmapped));
    });

    test('4. Backend Truth & Partial Lesson Accuracy: 56 GUs total', () {
      expect(bridge.allEntries.length, equals(56),
          reason: '56 private DigiBook lessons exist.');

      final completeGus =
          bridge.allEntries.where((e) => e.isFactComplete).toList();
      final partialGus =
          bridge.allEntries.where((e) => !e.isFactComplete).toList();

      expect(completeGus.length, equals(33));
      expect(partialGus.length, equals(23));

      for (final partial in partialGus) {
        expect(partial.factSemantics, equals('PARTIAL_CANARY'),
            reason:
                'PARTIAL_SOURCE_LESSON_MISREPRESENTED_AS_COMPLETE must be 0.');
      }
    });

    test('5. Seven Components Verification for Sets Canary Lesson', () async {
      const guId = 'GU_JEEMAIN2027_MAT_9BB8FB46';
      final launchArgs = await bridge.buildLaunchArgs(guId);

      expect(launchArgs, isNotNull);
      final rawLesson = launchArgs!.rawLessonData;
      expect(rawLesson, isNotNull);

      final components = rawLesson!['components'] as Map<String, dynamic>;
      expect(components.keys, containsAll([
        'overview',
        'concepts',
        'formulaRegister',
        'commonMisconceptions',
        'workedExamples',
        'selfChecks',
        'assessmentPreview',
      ]), reason: 'Preserve seven lesson components.');

      // Check Component 3: Formula Register LaTeX Notation
      final formulaTable =
          components['formulaRegister']['formulaTable'] as List<dynamic>;
      expect(formulaTable.length, equals(6));
      final elementMembership = formulaTable.firstWhere(
          (f) => f['name'] == 'Element Membership');
      expect(elementMembership['formula'], contains(r'\in'));

      final formattedFormula = FormattedMathText.formatMathString(
          elementMembership['formula']);
      expect(formattedFormula, contains('∈'));

      // Check Component 6: Self-Checks Interactive MCQs
      final selfChecks =
          components['selfChecks']['selfChecks'] as List<dynamic>;
      expect(selfChecks.length, equals(2));
      final sc1 = selfChecks.first as Map<String, dynamic>;
      expect(sc1['prompt'], contains('P(P(A))'));
      expect(sc1['correctOptionIndex'], equals(2));
      expect(sc1['options'], equals(['0', '1', '2', '4']));
    });
  });
}
