import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:rank_crackers/core/theme/app_theme.dart';
import 'package:rank_crackers/features/preview/presentation/screens/nebula_founder_preview_screen.dart';

Future<void> loadGoogleFontFamiliesForTest() async {
  final fontFile = File(
      'E:/Programs/Flutter/flutter/bin/cache/artifacts/material_fonts/roboto-regular.ttf');
  final bytes = await fontFile.readAsBytes();
  Future<void> loadFamily(String family) async {
    final loader = FontLoader(family)
      ..addFont(Future<ByteData>.value(ByteData.view(bytes.buffer)));
    await loader.load();
  }

  await loadFamily('Sora');
  await loadFamily('Inter');
  await loadFamily('Noto Sans');
}

Map<String, dynamic> loadPreviewJson(String name) {
  const base = 'assets/data/preview/jee_main_2027';
  return jsonDecode(File('$base/$name').readAsStringSync())
      as Map<String, dynamic>;
}

Map<String, dynamic> loadPreviewBundle() => {
      'manifest': loadPreviewJson('mission_preview_manifest.json'),
      'syllabus': loadPreviewJson('syllabus_preview_tree.json'),
      'crucible': loadPreviewJson('crucible_preview_plan.json'),
      'digibook': loadPreviewJson('digibook_preview_catalog.json'),
      'assessment': loadPreviewJson('assessment_preview_manifest.json'),
    };
Future<void> pumpPreview(
  WidgetTester tester, {
  Size size = const Size(393, 873),
  int initialTabIndex = 0,
  String? initialViewMode,
}) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();

  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);

  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: NebulaFounderPreviewScreen(
        key: ValueKey<String>('nebula-preview--x'),
        previewBundleForTest:
            Future<Map<String, dynamic>>.value(loadPreviewBundle()),
        initialTabIndexForTest: initialTabIndex,
        initialViewModeForTest: initialViewMode,
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 100));
  await tester.runAsync(() async {
    await Future<void>.delayed(const Duration(milliseconds: 600));
  });
  await tester.pump(const Duration(milliseconds: 300));
  final pumpException = tester.takeException();
  if (pumpException != null) {
    fail('Preview pump exception: $pumpException');
  }
}

Future<void> openTab(WidgetTester tester, String label) async {
  final tabFinder = find.widgetWithText(Tab, label);
  await tester.ensureVisible(tabFinder);
  await tester.tap(tabFinder);
  for (var i = 0; i < 8; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
  final pumpException = tester.takeException();
  if (pumpException != null) {
    fail('Preview pump exception: $pumpException');
  }
}

Future<void> expectVisibleAfterScroll(WidgetTester tester, String text) async {
  final target = find.text(text);
  for (var i = 0; i < 45 && target.evaluate().isEmpty; i++) {
    await tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, -320),
      warnIfMissed: false,
    );
    await tester.pump(const Duration(milliseconds: 80));
  }
  expect(target, findsWidgets);
}

void expectNoFlutterException(WidgetTester tester) {
  final exception = tester.takeException();
  expect(exception, isNull);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    GoogleFonts.config.allowRuntimeFetching = false;
    await loadGoogleFontFamiliesForTest();
  });

  test('R2-FIX1 data source exposes formula, misconception and rebuild inputs',
      () {
    final digibook = loadPreviewJson('digibook_preview_catalog.json');
    final unit = (digibook['units'] as List).first as Map<String, dynamic>;
    expect(unit['contentLabel'], 'INTERNAL PILOT CONTENT');
    expect(unit['formulaRegister'], hasLength(7));
    expect(unit['misconceptionRegister'], hasLength(8));
    expect(unit['workedExamples'], hasLength(7));
    expect(unit['selfCheckPrompts'], hasLength(10));

    final crucible = loadPreviewJson('crucible_preview_plan.json');
    expect(crucible['rebuildWindows'], hasLength(7));
    expect(crucible['macroTestSlots'], hasLength(7));
    expect(crucible['majorTestSlot']['status'], 'NOT_READY');
    expect(crucible['majorTestSlot']['reason'],
        'REVIEWED_FULL_MISSION_QUESTION_POOL_NOT_AVAILABLE');
  });

  test('R2-FIX1 production Founder guard remains source-backed and unchanged',
      () {
    final router = File('lib/core/router/app_router.dart').readAsStringSync();
    final identity =
        File('lib/core/constants/founder_identity.dart').readAsStringSync();

    expect(router, contains('FounderIdentity.isFounderUser'));
    expect(router, contains('FirebaseAuth.instance.currentUser'));
    expect(router, contains('Founder preview access denied.'));
    expect(identity, contains('founder.rcofficial@gmail.com'));

    final combined = '$router\n$identity';
    expect(combined, isNot(contains('RC_INTERNAL_PREVIEW_HARNESS')));
    expect(combined, isNot(contains('localStorage')));
    expect(combined, isNot(contains('queryParameters')));
  });

  testWidgets('R2-FIX1 DigiBook renders formula and misconception sections',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 3);

    expect(find.text('Mechanics Foundations'), findsOneWidget);
    await expectVisibleAfterScroll(tester, 'Formula Register');
    expect(find.text('FOR_01'), findsNothing);
    await expectVisibleAfterScroll(
        tester, 'v_avg = Total Distance / Total Time');
    await expectVisibleAfterScroll(tester, 'Common Misconceptions');
    await expectVisibleAfterScroll(tester, 'INCORRECT BELIEF');
    expect(find.text('MIS_02'), findsNothing);
    await expectVisibleAfterScroll(tester, 'Correct understanding');
    expectNoFlutterException(tester);
  });

  testWidgets('R2-FIX1 Crucible renders rebuild windows and test readiness',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 2);

    await expectVisibleAfterScroll(tester, 'How the Crucible works');
    await expectVisibleAfterScroll(tester, '7 Learning Phases');
    await expectVisibleAfterScroll(tester, 'Rebuild Windows');
    await expectVisibleAfterScroll(tester, 'Revision Window 1');
    await expectVisibleAfterScroll(tester, 'Macro and Major Test Readiness');
    await expectVisibleAfterScroll(tester, 'Macro Test - Phase 1 Review');
    await expectVisibleAfterScroll(tester, 'Major Test - Full Mission Review');
    await expectVisibleAfterScroll(
        tester, 'Test questions are under academic review.');
    expectNoFlutterException(tester);
  });

  testWidgets('VS1 mission landing is premium, truthful and preview-only',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873));

    expect(find.text('JEE Main 2027'), findsWidgets);
    expect(find.text('INTERNAL FOUNDER PREVIEW'), findsWidgets);
    expect(find.text('Explore Syllabus'), findsOneWidget);
    expect(find.text('View Crucible Plan'), findsOneWidget);
    expect(find.text('Open Pilot DigiBook'), findsOneWidget);
    await expectVisibleAfterScroll(tester, 'Syllabus Verified');
    await expectVisibleAfterScroll(tester, 'Structure Preview');
    await expectVisibleAfterScroll(tester, 'DigiBook Available');
    await expectVisibleAfterScroll(tester, 'Assessment Under Review');
    expect(find.text('Reviewed tests'), findsOneWidget);
    expect(find.text('In progress'), findsOneWidget);
    expect(find.textContaining('No score'), findsWidgets);
    expectNoFlutterException(tester);
  });

  testWidgets('VS1 assessment preview blocks production attempt language',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 4);

    expect(find.text('INTERNAL ASSESSMENT PREVIEW'), findsWidgets);
    expect(find.textContaining('Results will not be saved'), findsWidgets);
    await expectVisibleAfterScroll(tester,
        'No production attempt. No marks persistence. No official answer-key claim.');
    expect(find.textContaining('studentPublishReady = true'), findsNothing);
    expect(find.textContaining('PENDING_INDEPENDENT_REVIEW'), findsNothing);
    expect(find.textContaining('SINGLE_SELECT'), findsNothing);
    expect(find.textContaining('MF_ASI_01'), findsNothing);
    expect(find.textContaining(r'$20\text'), findsNothing);
    expectNoFlutterException(tester);
  });

  testWidgets('VS1-FIX4 truthful hierarchy and schedule detail states',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 1);
    await expectVisibleAfterScroll(tester, 'Atomic Topic Detail');
    expect(find.text('General Unit'), findsNothing);
    expect(find.text('General Chapter'), findsNothing);
    expect(find.textContaining('Unit hierarchy pending verification'),
        findsWidgets);
    expect(find.textContaining('Chapter hierarchy pending verification'),
        findsWidgets);

    final mathChip = find.widgetWithText(ChoiceChip, 'Mathematics');
    expect(mathChip, findsOneWidget);
    await tester.tap(mathChip);
    await tester.pump(const Duration(milliseconds: 250));
    expect(find.text('B.Tech.)'), findsNothing);
    expect(find.textContaining('Paper 1 B E B Tech'), findsNothing);
    expect(find.textContaining('Unit hierarchy pending verification'),
        findsWidgets);
    expect(find.textContaining('Chapter hierarchy pending verification'),
        findsWidgets);

    await pumpPreview(
      tester,
      size: const Size(393, 873),
      initialTabIndex: 2,
      initialViewMode: 'scheduleDetail',
    );
    expect(find.text('Schedule Detail'), findsWidgets);
    expect(
        find.textContaining('What to learn: 10 focused topics'), findsWidgets);
    expect(find.textContaining('DigiBook: 2 ready, 8 being prepared'),
        findsWidgets);
    expectNoFlutterException(tester);
  });

  testWidgets('VS1-FIX4 learning interactions hide answers and internal ids',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 3);
    await expectVisibleAfterScroll(tester, 'Reveal explanation (preview)');
    expect(find.textContaining('Model idea:'), findsNothing);
    expect(find.textContaining('JEE_2026_'), findsNothing);
    expect(find.textContaining('authorizedAtomId'), findsNothing);

    await pumpPreview(
      tester,
      size: const Size(393, 873),
      initialTabIndex: 3,
      initialViewMode: 'comingSoon',
    );
    expect(find.text('Content Being Prepared'), findsWidgets);
    expect(find.text('Self-Checks'), findsNothing);
    expect(find.text('Assessment Preview'), findsNothing);
    expectNoFlutterException(tester);
  });

  for (final size in <Size>[
    const Size(360, 800),
    const Size(393, 873),
    const Size(412, 915),
    const Size(1366, 768),
  ]) {
    testWidgets(
        'R2-FIX1 preview renders key tabs at ${size.width}x${size.height}',
        (tester) async {
      await pumpPreview(tester, size: size);
      expect(find.text('JEE Main 2027'), findsWidgets);
      await pumpPreview(tester, size: size, initialTabIndex: 2);
      await expectVisibleAfterScroll(tester, 'Rebuild Windows');
      await pumpPreview(tester, size: size, initialTabIndex: 3);
      await expectVisibleAfterScroll(tester, 'Formula Register');
      await expectVisibleAfterScroll(tester, 'Common Misconceptions');
      await pumpPreview(tester, size: size, initialTabIndex: 4);
      await expectVisibleAfterScroll(tester, 'INTERNAL ASSESSMENT PREVIEW');
      expectNoFlutterException(tester);
    });
  }
}
