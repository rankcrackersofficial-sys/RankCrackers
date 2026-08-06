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
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 2);

    expect(find.text('Mechanics Foundations'), findsOneWidget);
    await expectVisibleAfterScroll(tester, 'Formula Register');
    await expectVisibleAfterScroll(tester, 'FOR_01');
    await expectVisibleAfterScroll(
        tester, 'v_avg = Total Distance / Total Time');
    await expectVisibleAfterScroll(tester, 'Common Misconceptions');
    await expectVisibleAfterScroll(tester, 'INCORRECT BELIEF');
    await expectVisibleAfterScroll(tester, 'Correct understanding');
    expectNoFlutterException(tester);
  });

  testWidgets('R2-FIX1 Crucible renders rebuild windows and test readiness',
      (tester) async {
    await pumpPreview(tester, size: const Size(393, 873), initialTabIndex: 1);

    expect(find.text('7-phase structure'), findsWidgets);
    await expectVisibleAfterScroll(tester, 'Rebuild Windows');
    await expectVisibleAfterScroll(tester, 'Rebuild Window 1');
    await expectVisibleAfterScroll(tester, 'STRUCTURAL_SLOT_ONLY');
    await expectVisibleAfterScroll(tester, 'Macro and Major Test Readiness');
    await expectVisibleAfterScroll(tester, 'Macro Test - macro_test_1');
    await expectVisibleAfterScroll(tester, 'Major Test - major_test_final');
    await expectVisibleAfterScroll(
        tester, 'Reason: REVIEWED_QUESTION_POOL_NOT_AVAILABLE');
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
      expect(find.text('JEE Main 2027 - Internal Preview'), findsOneWidget);
      await pumpPreview(tester, size: size, initialTabIndex: 1);
      await expectVisibleAfterScroll(tester, 'Rebuild Windows');
      await pumpPreview(tester, size: size, initialTabIndex: 2);
      await expectVisibleAfterScroll(tester, 'Formula Register');
      await expectVisibleAfterScroll(tester, 'Common Misconceptions');
      await pumpPreview(tester, size: size, initialTabIndex: 3);
      await expectVisibleAfterScroll(tester, 'INTERNAL ASSESSMENT PREVIEW');
      expectNoFlutterException(tester);
    });
  }
}
