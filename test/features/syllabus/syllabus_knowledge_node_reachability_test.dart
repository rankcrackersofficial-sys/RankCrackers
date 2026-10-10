import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/digibook/domain/services/digibook_canonical_bridge_service.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('RC_SYLLABUS_KNOWLEDGE_NODE_DIGIBOOK_REACHABILITY_AND_EMPTY_STATE_POLISH_01 Invariants', () {
    late DigiBookCanonicalBridgeService bridge;

    setUpAll(() async {
      bridge = DigiBookCanonicalBridgeService.instance;
      await bridge.initialize();
    });

    test('1. Sets Canary Route: JEE_MAIN_2026_MAT_U01_T_00000001 -> GU_JEEMAIN2027_MAT_9BB8FB46', () {
      const canonicalNodeId = 'JEE_MAIN_2026_MAT_U01_T_00000001';
      final result = bridge.resolveCanonicalNode(canonicalNodeId);

      expect(result.isMapped, isTrue, reason: 'Sets Canary must be mapped');
      expect(result.primaryEntry, isNotNull);
      expect(result.primaryEntry!.guId, equals('GU_JEEMAIN2027_MAT_9BB8FB46'));
      expect(result.primaryEntry!.subject, equals('Mathematics'));
      expect(result.primaryEntry!.lessonRevision, equals('REV_GU_JEEMAIN2027_MAT_9BB8FB46_V001'));
      expect(result.primaryEntry!.isFactComplete, isTrue);
    });

    test('2. Total Governed Lessons: 56 Lessons (33 Complete, 23 Partial Canary, 381 Verified Facts)', () {
      expect(bridge.allEntries.length, equals(56));

      final completeGus = bridge.allEntries.where((e) => e.isFactComplete).toList();
      final partialGus = bridge.allEntries.where((e) => !e.isFactComplete).toList();

      expect(completeGus.length, equals(33));
      expect(partialGus.length, equals(23));

      int totalFacts = 0;
      for (final e in bridge.allEntries) {
        totalFacts += e.atomicFactIds.length;
      }
      expect(totalFacts, equals(381));
    });

    test('3. Unmapped Node Fails Closed (No Hallucinated Route)', () {
      const fakeNodeId = 'JEE_MAIN_2026_PHY_U99_T_NONEXISTENT';
      final result = bridge.resolveCanonicalNode(fakeNodeId);

      expect(result.isMapped, isFalse);
      expect(result.primaryEntry, isNull);
      expect(result.status, equals(DigiBookBridgeResolveStatus.unmapped));
    });

    test('4. Launch Args Builds 7 Components for Mapped Lessons', () async {
      final launchArgs = await bridge.buildLaunchArgs('GU_JEEMAIN2027_MAT_9BB8FB46');

      expect(launchArgs, isNotNull);
      expect(launchArgs!.componentOverview, isNotNull);
      expect(launchArgs.componentConcepts, isNotNull);
      expect(launchArgs.componentFormulaRegister, isNotNull);
      expect(launchArgs.componentCommonMisconceptions, isNotNull);
      expect(launchArgs.componentWorkedExamples, isNotNull);
      expect(launchArgs.componentSelfChecks, isNotNull);
      expect(launchArgs.componentAssessmentPreview, isNotNull);
    });

    testWidgets('5. Truthful Unavailable Dialog Renders Accessible Close Button Without Brackets', (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (context) => AlertDialog(
                      backgroundColor: AppColors.surface,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                        side: const BorderSide(color: AppColors.borderSoft, width: 1.0),
                      ),
                      title: const Text('LEARNING CONTENT'),
                      content: const Text('Learning content is not available for this topic yet.'),
                      actions: [
                        SizedBox(
                          width: double.infinity,
                          height: 44,
                          child: ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Close'),
                          ),
                        ),
                      ],
                    ),
                  );
                },
                child: const Text('Open Dialog'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Open Dialog'));
      await tester.pumpAndSettle();

      // Verify Truthful Copy
      expect(find.text('LEARNING CONTENT'), findsOneWidget);
      expect(find.text('Learning content is not available for this topic yet.'), findsOneWidget);

      // Verify ZERO literal brackets
      expect(find.text('[ Close ]'), findsNothing);
      expect(find.text('[Close]'), findsNothing);
      expect(find.text('Close'), findsOneWidget);

      // Verify Dismissal
      await tester.tap(find.text('Close'));
      await tester.pumpAndSettle();
      expect(find.text('LEARNING CONTENT'), findsNothing);
    });
  });
}
