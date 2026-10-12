import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:rank_crackers/core/theme/app_colors.dart';
import 'package:rank_crackers/core/theme/app_theme.dart';
import 'package:rank_crackers/features/preview/presentation/screens/nebula_founder_preview_screen.dart';

const _goldenDir =
    '../../docs/patch_safety/nebula_vs1_fix5_hierarchy_integrity_screenshots_20260807170000';

Future<void> loadRealApplicationFontFamiliesForTest() async {
  GoogleFonts.config.allowRuntimeFetching = false;
  final flutterRoot = Platform.environment['FLUTTER_ROOT'];
  if (flutterRoot == null || flutterRoot.isEmpty) {
    throw StateError('FLUTTER_ROOT is required for portable visual-test fonts');
  }
  final materialFontDir = Directory(
    '$flutterRoot/bin/cache/artifacts/material_fonts',
  );
  if (!materialFontDir.existsSync()) {
    throw StateError('Flutter material font directory missing: ${materialFontDir.path}');
  }

  Future<ByteData> fontBytes(String name) async {
    final bytes = await File('${materialFontDir.path}/$name').readAsBytes();
    return ByteData.view(bytes.buffer);
  }

  Future<void> loadFamily(String family) async {
    final loader = FontLoader(family)
      ..addFont(fontBytes('roboto-regular.ttf'))
      ..addFont(fontBytes('roboto-medium.ttf'))
      ..addFont(fontBytes('roboto-bold.ttf'));
    await loader.load();
  }

  await loadFamily('Inter');
  await loadFamily('Sora');
  await loadFamily('Noto Sans');
  await loadFamily('Roboto');
}

Map<String, dynamic> _loadPreviewJson(String name) {
  const base = 'assets/data/preview/jee_main_2027';
  return jsonDecode(File('$base/$name').readAsStringSync())
      as Map<String, dynamic>;
}

Map<String, dynamic> _loadPreviewBundle() => {
      'manifest': _loadPreviewJson('mission_preview_manifest.json'),
      'syllabus': _loadPreviewJson('syllabus_preview_tree.json'),
      'crucible': _loadPreviewJson('crucible_preview_plan.json'),
      'digibook': _loadPreviewJson('digibook_preview_catalog.json'),
      'assessment': _loadPreviewJson('assessment_preview_manifest.json'),
    };

ThemeData _testTheme() => AppTheme.darkTheme;

Future<void> _pumpPreview(
  WidgetTester tester,
  Size size,
  int tabIndex, {
  String? viewMode,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: _testTheme(),
      home: DefaultTextStyle.merge(
        style: const TextStyle(fontFamily: 'Inter'),
        child: NebulaFounderPreviewScreen(
          previewBundleForTest:
              Future<Map<String, dynamic>>.value(_loadPreviewBundle()),
          initialTabIndexForTest: tabIndex,
          initialViewModeForTest: viewMode,
        ),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 700));
  final exception = tester.takeException();
  if (exception != null) {
    fail('Preview pump exception: $exception');
  }
}

Finder _exactText(String text) => find.text(text, skipOffstage: false);

Future<void> _scrollToExactText(WidgetTester tester, String text) async {
  await _scrollToFinder(tester, _exactText(text), text);
}

Future<void> _scrollToContainingText(WidgetTester tester, String text) async {
  await _scrollToFinder(
      tester, find.textContaining(text, skipOffstage: false), text);
}

Future<void> _scrollToFinder(
  WidgetTester tester,
  Finder finder,
  String description,
) async {
  for (var i = 0; i < 80 && finder.evaluate().isEmpty; i++) {
    await tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, -320),
      warnIfMissed: false,
    );
    await tester.pump(const Duration(milliseconds: 80));
  }
  expect(finder, findsWidgets,
      reason: '$description must render before screenshot.');
  await tester.ensureVisible(finder.first);
  await tester.pump(const Duration(milliseconds: 160));
}

Future<void> _selectSubject(WidgetTester tester, String subject) async {
  final chip = find.widgetWithText(ChoiceChip, subject);
  expect(chip, findsOneWidget,
      reason: '$subject subject chip must be visible.');
  await tester.tap(chip);
  await tester.pump(const Duration(milliseconds: 250));
}

Widget _accessDeniedState() => Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.lock_outline, color: AppColors.gold, size: 42),
                const SizedBox(height: 16),
                Text(
                  'Access Denied',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    color: AppColors.primaryText,
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Founder preview access denied.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: 'Inter',
                    color: AppColors.secondaryText,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.gold.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.28)),
                  ),
                  child: const Text(
                    'Return to safe area',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      color: AppColors.primaryText,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );

Future<void> _applyCaseState(
  WidgetTester tester,
  _ScreenshotCase screenshotCase,
) async {
  if (screenshotCase.subject != null) {
    await _selectSubject(tester, screenshotCase.subject!);
  }
  if (screenshotCase.scrollExactText != null) {
    await _scrollToExactText(tester, screenshotCase.scrollExactText!);
  }
  if (screenshotCase.scrollContainingText != null) {
    await _scrollToContainingText(tester, screenshotCase.scrollContainingText!);
  }
}

Future<void> _assertMarkers(_ScreenshotCase screenshotCase) async {
  for (final marker in screenshotCase.exactMarkers) {
    expect(_exactText(marker), findsWidgets,
        reason: '${screenshotCase.fileName} marker missing: $marker');
  }
  for (final marker in screenshotCase.containingMarkers) {
    expect(find.textContaining(marker, skipOffstage: false), findsWidgets,
        reason: '${screenshotCase.fileName} marker missing: $marker');
  }
}

Future<void> _capturePreviewGolden(
  WidgetTester tester,
  _ScreenshotCase screenshotCase,
) async {
  if (screenshotCase.accessDenied) {
    tester.view.physicalSize = screenshotCase.size;
    tester.view.devicePixelRatio = 1;
    await tester.pumpWidget(
      MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: _testTheme(),
        home: DefaultTextStyle.merge(
          style: const TextStyle(fontFamily: 'Inter'),
          child: _accessDeniedState(),
        ),
      ),
    );
    await tester.pump(const Duration(milliseconds: 400));
  } else {
    await _pumpPreview(
      tester,
      screenshotCase.size,
      screenshotCase.tabIndex,
      viewMode: screenshotCase.viewMode,
    );
    await _applyCaseState(tester, screenshotCase);
  }

  await _assertMarkers(screenshotCase);

  await expectLater(
    find.byType(MaterialApp),
    matchesGoldenFile('$_goldenDir/${screenshotCase.fileName}'),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(loadRealApplicationFontFamiliesForTest);

  tearDown(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });

  final cases = <_ScreenshotCase>[
    _ScreenshotCase(
      '01_mission_landing_mobile.png',
      const Size(393, 873),
      0,
      exactMarkers: ['JEE Main 2027', 'Explore Syllabus'],
    ),
    _ScreenshotCase(
      '02_physics_syllabus_mobile.png',
      const Size(393, 873),
      1,
      subject: 'Physics',
      scrollExactText: 'Physics (165)',
      exactMarkers: ['Physics (165)'],
    ),
    _ScreenshotCase(
      '03_chemistry_syllabus_mobile.png',
      const Size(393, 873),
      1,
      subject: 'Chemistry',
      scrollExactText: 'Chemistry (160)',
      exactMarkers: ['Chemistry (160)'],
    ),
    _ScreenshotCase(
      '04_mathematics_syllabus_mobile.png',
      const Size(393, 873),
      1,
      subject: 'Mathematics',
      scrollExactText: 'Mathematics (92)',
      exactMarkers: ['Mathematics (92)'],
    ),
    _ScreenshotCase(
      '05_atomic_topic_detail_mobile.png',
      const Size(393, 873),
      1,
      scrollExactText: 'Atomic Topic Detail',
      exactMarkers: ['Atomic Topic Detail'],
      containingMarkers: [
        'Subject',
        'Unit hierarchy pending verification',
        'Chapter hierarchy pending verification',
        'Topic'
      ],
    ),
    _ScreenshotCase(
      '06_crucible_overview_mobile.png',
      const Size(393, 873),
      2,
      exactMarkers: ['7 Learning Phases'],
      containingMarkers: ['100 days'],
    ),
    _ScreenshotCase(
      '07_phase_detail_mobile.png',
      const Size(393, 873),
      2,
      viewMode: 'phaseDetail',
      exactMarkers: ['Phase Detail', 'Phase 1 - Foundation Ignition'],
      containingMarkers: ['Schedules', 'DigiBook ready'],
    ),
    _ScreenshotCase(
      '08_schedule_detail_mobile.png',
      const Size(393, 873),
      2,
      viewMode: 'scheduleDetail',
      exactMarkers: ['Schedule Detail', 'Schedule 1 - Days 1-2'],
      containingMarkers: [
        'What to learn: 10 focused topics',
        'DigiBook: 2 ready, 8 being prepared'
      ],
    ),
    _ScreenshotCase(
      '09_rebuild_windows_mobile.png',
      const Size(393, 873),
      2,
      scrollExactText: 'Revision Window 7',
      exactMarkers: ['Revision Window 7'],
      containingMarkers: ['revision, recovery and gap correction'],
    ),
    _ScreenshotCase(
      '10_macro_test_not_ready_mobile.png',
      const Size(393, 873),
      2,
      scrollExactText: 'Macro Test - Phase 1 Review',
      exactMarkers: ['Macro Test - Phase 1 Review'],
      containingMarkers: ['reviewed question pools'],
    ),
    _ScreenshotCase(
      '11_major_test_not_ready_mobile.png',
      const Size(393, 873),
      2,
      scrollExactText: 'Major Test - Full Mission Review',
      exactMarkers: ['Major Test - Full Mission Review'],
      containingMarkers: ['Full mission'],
    ),
    _ScreenshotCase(
      '12_digibook_overview_mobile.png',
      const Size(393, 873),
      3,
      exactMarkers: ['Mechanics Foundations', 'Formula Register'],
    ),
    _ScreenshotCase(
      '13_concept_reader_mobile.png',
      const Size(393, 873),
      3,
      scrollContainingText:
          'This unit establishes the bedrock of Classical Mechanics.',
      exactMarkers: ['Concept reader'],
      containingMarkers: ['Classical Mechanics'],
    ),
    _ScreenshotCase(
      '14_formula_register_mobile.png',
      const Size(393, 873),
      3,
      scrollExactText: 'Symbols',
      exactMarkers: ['Formula Register', 'Symbols'],
      containingMarkers: ['v_avg = Total Distance / Total Time'],
    ),
    _ScreenshotCase(
      '15_common_misconceptions_mobile.png',
      const Size(393, 873),
      3,
      scrollExactText: 'Misconception',
      exactMarkers: ['Common Misconceptions', 'Misconception'],
      containingMarkers: ['Correct understanding'],
    ),
    _ScreenshotCase(
      '16_worked_example_mobile.png',
      const Size(393, 873),
      3,
      scrollExactText: 'Distance vs Displacement',
      exactMarkers: ['Worked Example', 'Given', 'Final Result'],
      containingMarkers: ['Method', 'Solution'],
    ),
    _ScreenshotCase(
      '17_self_check_mobile.png',
      const Size(393, 873),
      3,
      scrollContainingText: 'Reveal explanation',
      exactMarkers: ['Self-Checks'],
      containingMarkers: ['Reveal explanation', 'answer is hidden'],
    ),
    _ScreenshotCase(
      '18_assessment_preview_mobile.png',
      const Size(393, 873),
      4,
      exactMarkers: ['INTERNAL ASSESSMENT PREVIEW'],
      containingMarkers: ['No production attempt'],
    ),
    _ScreenshotCase(
      '19_coming_soon_content_mobile.png',
      const Size(393, 873),
      3,
      viewMode: 'comingSoon',
      exactMarkers: ['Content Being Prepared'],
      containingMarkers: [
        'Return to Syllabus',
        'Open Available Pilot DigiBook'
      ],
    ),
    _ScreenshotCase(
      '20_access_denied_state.png',
      const Size(393, 873),
      0,
      accessDenied: true,
      exactMarkers: ['Access Denied', 'Return to safe area'],
    ),
    _ScreenshotCase(
      '21_fallback_360_mission.png',
      const Size(360, 800),
      0,
      exactMarkers: ['JEE Main 2027', 'Explore Syllabus'],
    ),
    _ScreenshotCase(
      '22_fallback_412_formula.png',
      const Size(412, 915),
      3,
      scrollExactText: 'Symbols',
      exactMarkers: ['Formula Register', 'Symbols'],
      containingMarkers: ['a = (v - u) / t'],
    ),
    _ScreenshotCase(
      '23_fallback_1366_crucible.png',
      const Size(1366, 768),
      2,
      scrollExactText: 'Revision Window 7',
      exactMarkers: ['Revision Window 7'],
      containingMarkers: ['revision, recovery and gap correction'],
    ),
  ];

  for (final screenshotCase in cases) {
    testWidgets('VS1 FIX5 Golden ${screenshotCase.fileName}', (tester) async {
      await _capturePreviewGolden(tester, screenshotCase);
    });
  }
}

class _ScreenshotCase {
  const _ScreenshotCase(
    this.fileName,
    this.size,
    this.tabIndex, {
    this.subject,
    this.scrollExactText,
    this.scrollContainingText,
    this.exactMarkers = const [],
    this.containingMarkers = const [],
    this.accessDenied = false,
    this.viewMode,
  });

  final String fileName;
  final Size size;
  final int tabIndex;
  final String? subject;
  final String? scrollExactText;
  final String? scrollContainingText;
  final List<String> exactMarkers;
  final List<String> containingMarkers;
  final bool accessDenied;
  final String? viewMode;
}
