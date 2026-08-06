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
    '../../docs/patch_safety/nebula_vs1_fix1_golden_screenshots_20260806150500';

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

Future<void> _pumpPreview(WidgetTester tester, Size size, int tabIndex) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  await tester.pumpWidget(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      home: NebulaFounderPreviewScreen(
        previewBundleForTest:
            Future<Map<String, dynamic>>.value(_loadPreviewBundle()),
        initialTabIndexForTest: tabIndex,
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 700));
  final exception = tester.takeException();
  if (exception != null) {
    fail('Preview pump exception: $exception');
  }
}

Future<void> _scrollToText(WidgetTester tester, String text) async {
  final target = find.text(text);
  for (var i = 0; i < 64 && target.evaluate().isEmpty; i++) {
    await tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, -300),
      warnIfMissed: false,
    );
    await tester.pump(const Duration(milliseconds: 70));
  }
  expect(target, findsWidgets, reason: '$text must render before screenshot.');
}

Widget _accessDeniedState() => const Scaffold(
      backgroundColor: AppColors.background,
      body: Center(
        child: Text(
          'Founder preview access denied.',
          style: TextStyle(color: AppColors.textSecondary),
        ),
      ),
    );

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
        theme: AppTheme.darkTheme,
        home: _accessDeniedState(),
      ),
    );
    await tester.pump(const Duration(milliseconds: 300));
  } else {
    await _pumpPreview(tester, screenshotCase.size, screenshotCase.tabIndex);
    if (screenshotCase.scrollTarget != null) {
      await _scrollToText(tester, screenshotCase.scrollTarget!);
    }
  }

  await expectLater(
    find.byType(MaterialApp),
    matchesGoldenFile('$_goldenDir/${screenshotCase.fileName}'),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    GoogleFonts.config.allowRuntimeFetching = false;
    await loadGoogleFontFamiliesForTest();
  });

  tearDown(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });

  final cases = <_ScreenshotCase>[
    _ScreenshotCase('01_mission_landing_mobile.png', const Size(393, 873), 0),
    _ScreenshotCase(
        '02_physics_syllabus_mobile.png', const Size(393, 873), 1, 'Physics'),
    _ScreenshotCase('03_chemistry_syllabus_mobile.png', const Size(393, 873), 1,
        'Chemistry'),
    _ScreenshotCase('04_mathematics_syllabus_mobile.png', const Size(393, 873),
        1, 'Mathematics'),
    _ScreenshotCase('05_atomic_topic_detail_mobile.png', const Size(393, 873),
        1, 'Founder diagnostics - hidden from student tree'),
    _ScreenshotCase('06_crucible_overview_mobile.png', const Size(393, 873), 2),
    _ScreenshotCase('07_phase_detail_mobile.png', const Size(393, 873), 2,
        'Foundation Ignition'),
    _ScreenshotCase('08_schedule_detail_mobile.png', const Size(393, 873), 2,
        'Schedule 1 - Days 1-2'),
    _ScreenshotCase('09_rebuild_windows_mobile.png', const Size(393, 873), 2,
        'Rebuild Windows'),
    _ScreenshotCase('10_macro_test_not_ready_mobile.png', const Size(393, 873),
        2, 'Macro Test - macro_test_1'),
    _ScreenshotCase('11_major_test_not_ready_mobile.png', const Size(393, 873),
        2, 'Major Test - major_test_final'),
    _ScreenshotCase('12_digibook_overview_mobile.png', const Size(393, 873), 3),
    _ScreenshotCase('13_concept_reader_mobile.png', const Size(393, 873), 3,
        'Concept reader'),
    _ScreenshotCase('14_formula_register_mobile.png', const Size(393, 873), 3,
        'Formula Register'),
    _ScreenshotCase('15_common_misconceptions_mobile.png', const Size(393, 873),
        3, 'Common Misconceptions'),
    _ScreenshotCase('16_worked_example_mobile.png', const Size(393, 873), 3,
        'Worked Examples'),
    _ScreenshotCase(
        '17_self_check_mobile.png', const Size(393, 873), 3, 'Self-Checks'),
    _ScreenshotCase('18_assessment_preview_mobile.png', const Size(393, 873), 4,
        'INTERNAL ASSESSMENT PREVIEW'),
    _ScreenshotCase(
        '19_coming_soon_content_mobile.png',
        const Size(393, 873),
        3,
        'DigiBook is generated only from reviewed/accepted atomic teaching content. Empty fake reader pages are blocked.'),
    _ScreenshotCase(
        '20_access_denied_state.png', const Size(393, 873), 0, null, true),
    _ScreenshotCase('21_fallback_360_mission.png', const Size(360, 800), 0),
    _ScreenshotCase('22_fallback_412_formula.png', const Size(412, 915), 3,
        'Formula Register'),
    _ScreenshotCase('23_fallback_1366_crucible.png', const Size(1366, 768), 2,
        'Rebuild Windows'),
  ];

  for (final screenshotCase in cases) {
    testWidgets('VS1 Golden ${screenshotCase.fileName}', (tester) async {
      await _capturePreviewGolden(tester, screenshotCase);
    });
  }
}

class _ScreenshotCase {
  const _ScreenshotCase(this.fileName, this.size, this.tabIndex,
      [this.scrollTarget, this.accessDenied = false]);

  final String fileName;
  final Size size;
  final int tabIndex;
  final String? scrollTarget;
  final bool accessDenied;
}
