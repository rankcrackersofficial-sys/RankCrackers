import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:rank_crackers/core/theme/app_theme.dart';
import 'package:rank_crackers/features/preview/presentation/screens/nebula_founder_preview_screen.dart';

const _screenshotDir =
    'docs/patch_safety/nebula_vs0_r2_r1a_visual_screenshots_20260806124500';

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

Future<void> _pumpPreview(
  WidgetTester tester, {
  required GlobalKey boundaryKey,
  required Size size,
  required int initialTabIndex,
}) async {
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  await tester.pumpWidget(
    RepaintBoundary(
      key: boundaryKey,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        theme: AppTheme.darkTheme,
        home: NebulaFounderPreviewScreen(
          key: ValueKey<String>(
              'r1a-$initialTabIndex-${size.width}x${size.height}'),
          previewBundleForTest:
              Future<Map<String, dynamic>>.value(_loadPreviewBundle()),
          initialTabIndexForTest: initialTabIndex,
        ),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 100));
  await tester.runAsync(() async {
    await Future<void>.delayed(const Duration(milliseconds: 300));
  });
  await tester.pump(const Duration(milliseconds: 300));
  final exception = tester.takeException();
  if (exception != null) {
    fail('Preview pump exception: $exception');
  }
}

Future<void> _scrollToText(WidgetTester tester, String text) async {
  final target = find.text(text);
  for (var i = 0; i < 55 && target.evaluate().isEmpty; i++) {
    await tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, -320),
      warnIfMissed: false,
    );
    await tester.pump(const Duration(milliseconds: 80));
  }
  expect(target, findsWidgets, reason: '$text must render before screenshot.');
}

Future<void> _capture(GlobalKey boundaryKey, String fileName) async {
  final boundary =
      boundaryKey.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  final image = await boundary.toImage(pixelRatio: 1);
  final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
  final output = File('$_screenshotDir/$fileName');
  output.parent.createSync(recursive: true);
  output.writeAsBytesSync(bytes!.buffer.asUint8List());
}

Future<void> _captureState(
  WidgetTester tester, {
  required String fileName,
  required Size size,
  required int tabIndex,
  String? scrollTarget,
}) async {
  final boundaryKey = GlobalKey();
  await _pumpPreview(
    tester,
    boundaryKey: boundaryKey,
    size: size,
    initialTabIndex: tabIndex,
  );
  if (scrollTarget != null) {
    await _scrollToText(tester, scrollTarget);
  }
  await _capture(boundaryKey, fileName);
  final exception = tester.takeException();
  expect(exception, isNull);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    GoogleFonts.config.allowRuntimeFetching = false;
    await loadGoogleFontFamiliesForTest();
  });

  tearDownAll(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });

  final cases = <_ScreenshotCase>[
    _ScreenshotCase('01_digibook_overview_mobile.png', const Size(393, 873), 2),
    _ScreenshotCase('02_formula_register_mobile.png', const Size(393, 873), 2,
        'Formula Register'),
    _ScreenshotCase('03_formula_register_long_expression_mobile.png',
        const Size(412, 915), 2, 'v_avg = Total Distance / Total Time'),
    _ScreenshotCase('04_common_misconceptions_mobile.png', const Size(393, 873),
        2, 'Common Misconceptions'),
    _ScreenshotCase('05_misconception_detail_mobile.png', const Size(393, 873),
        2, 'Correct understanding'),
    _ScreenshotCase('06_worked_examples_mobile.png', const Size(393, 873), 2,
        'Worked Examples'),
    _ScreenshotCase(
        '07_self_checks_mobile.png', const Size(393, 873), 2, 'Self-Checks'),
    _ScreenshotCase('08_crucible_overview_mobile.png', const Size(393, 873), 1),
    _ScreenshotCase('09_rebuild_windows_mobile.png', const Size(393, 873), 1,
        'Rebuild Windows'),
    _ScreenshotCase('10_macro_test_not_ready_mobile.png', const Size(393, 873),
        1, 'Macro Test - macro_test_1'),
    _ScreenshotCase('11_major_test_not_ready_mobile.png', const Size(393, 873),
        1, 'Major Test - major_test_final'),
    _ScreenshotCase(
      '12_coming_soon_content_state_mobile.png',
      const Size(393, 873),
      2,
      'DigiBook is generated only from reviewed/accepted atomic teaching content. Empty fake reader pages are blocked.',
    ),
    _ScreenshotCase('13_full_digibook_desktop_fallback.png',
        const Size(1366, 768), 2, 'Formula Register'),
    _ScreenshotCase('14_full_crucible_desktop_fallback.png',
        const Size(1366, 768), 1, 'Rebuild Windows'),
  ];

  for (final screenshotCase in cases) {
    testWidgets('R2-R1A captures ${screenshotCase.fileName}', (tester) async {
      await _captureState(
        tester,
        fileName: screenshotCase.fileName,
        size: screenshotCase.size,
        tabIndex: screenshotCase.tabIndex,
        scrollTarget: screenshotCase.scrollTarget,
      );
      expect(File('$_screenshotDir/${screenshotCase.fileName}').existsSync(),
          isTrue);
    });
  }
}

class _ScreenshotCase {
  const _ScreenshotCase(this.fileName, this.size, this.tabIndex,
      [this.scrollTarget]);

  final String fileName;
  final Size size;
  final int tabIndex;
  final String? scrollTarget;
}
