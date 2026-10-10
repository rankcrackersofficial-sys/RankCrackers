import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_fonts/src/google_fonts_base.dart' as google_fonts_base;
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/theme/app_theme.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/unified_identity_screen.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

import '../helpers/firebase_test_setup.dart';

const _outDir =
    'docs/patch_safety/student_journey_fix3b_r1_sovereign_identity_visual_qa_20260810114000';

final _missions = <Recruitment>[
  Recruitment(
    id: 'jee-main-2027',
    recruitmentGroupId: 'jee-main',
    boardId: 'nta',
    examId: 'jee_main_2027',
    examBlueprintId: 'jee_main_2027_blueprint',
    title: 'JEE Main 2027',
    titleHindi: 'JEE Main 2027',
    year: 2027,
    state: 'Central',
    examCategory: 'competitive',
    status: 'published',
    variantCode: 'jee_main_2027_default',
  ),
];

Future<void> main() async {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    SessionManager.disableFirebaseForTest = true;
    await ensureFirebaseInitializedForTests();
    await _loadFontsForTest();
    Directory(_outDir).createSync(recursive: true);
  });

  tearDownAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMessageHandler('flutter/assets', null);
    final view =
        TestWidgetsFlutterBinding.instance.platformDispatcher.views.first;
    view.resetPhysicalSize();
    view.resetDevicePixelRatio();
  });

  final cases = <_VisualCase>[
    _VisualCase(
      name: '01_disabled_cta_360',
      size: const Size(360, 800),
      mode: _VisualMode.disabled,
      markers: const ['Profile Photo', 'ESTABLISH IDENTITY'],
    ),
    _VisualCase(
      name: '02_enabled_cta_393',
      size: const Size(393, 873),
      mode: _VisualMode.enabled,
      markers: const ['Profile Photo', 'ESTABLISH IDENTITY'],
    ),
    _VisualCase(
      name: '03_compact_360',
      size: const Size(360, 640),
      mode: _VisualMode.enabled,
      markers: const ['ESTABLISH IDENTITY'],
    ),
    _VisualCase(
      name: '04_keyboard_open_360',
      size: const Size(360, 640),
      keyboardInset: 280,
      focusFirstField: true,
      mode: _VisualMode.enabled,
      markers: const ['ESTABLISH IDENTITY'],
    ),
    _VisualCase(
      name: '05_normal_412',
      size: const Size(412, 915),
      mode: _VisualMode.enabled,
      markers: const ['Profile Photo', 'ESTABLISH IDENTITY'],
    ),
    _VisualCase(
      name: '06_large_text_393',
      size: const Size(393, 873),
      textScale: 1.3,
      mode: _VisualMode.enabled,
      markers: const ['Profile Photo', 'ESTABLISH IDENTITY'],
    ),
  ];

  for (final visualCase in cases) {
    testWidgets('FIX3B-R1 ${visualCase.name}', (tester) async {
      final record = await _captureCase(tester, visualCase);
      File('$_outDir/${visualCase.name}.json').writeAsStringSync(
        const JsonEncoder.withIndent('  ').convert(record),
      );
    }, timeout: const Timeout(Duration(seconds: 60)));
  }
}

Future<Map<String, Object?>> _captureCase(
  WidgetTester tester,
  _VisualCase visualCase,
) async {
  final boundaryKey = GlobalKey();
  tester.view.physicalSize = visualCase.size;
  tester.view.devicePixelRatio = 1;

  final media = MediaQueryData(
    size: visualCase.size,
    devicePixelRatio: 1,
    padding: EdgeInsets.zero,
    viewPadding: EdgeInsets.zero,
    viewInsets: EdgeInsets.only(bottom: visualCase.keyboardInset),
    textScaler: TextScaler.linear(visualCase.textScale),
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(_FakeAuthRepository()),
        authStateChangesProvider
            .overrideWith((ref) => Stream<User?>.value(null)),
        publishedRecruitmentsProvider.overrideWithValue(_missions),
        publishedStatesProvider
            .overrideWithValue(const ['Rajasthan', 'Central']),
      ],
      child: RepaintBoundary(
        key: boundaryKey,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          theme: AppTheme.darkTheme,
          home: MediaQuery(
            data: media,
            child: const UnifiedIdentityScreen(
              forceProfileSetupForTest: true,
              disableFirebaseAuthLookupForTest: true,
              disableAnimationsForTest: true,
            ),
          ),
        ),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 100));
  await tester.pump(const Duration(milliseconds: 250));

  if (visualCase.mode == _VisualMode.enabled) {
    await _completeIdentityFields(tester);
  }

  if (visualCase.focusFirstField) {
    final firstTextField = find.byType(TextField).first;
    if (firstTextField.evaluate().isNotEmpty) {
      await tester.tap(firstTextField, warnIfMissed: false);
      await tester.pump(const Duration(milliseconds: 120));
    }
  }

  final exception = tester.takeException();
  if (exception != null) {
    fail('${visualCase.name} rendered with exception: $exception');
  }

  for (final marker in visualCase.markers) {
    expect(
      find.textContaining(marker),
      findsWidgets,
      reason: '${visualCase.name} missing marker: $marker',
    );
  }

  final boundary =
      boundaryKey.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  final output = File('$_outDir/${visualCase.name}.png');

  await tester.runAsync(() async {
    final image = await boundary.toImage(pixelRatio: 1);
    final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
    output.writeAsBytesSync(bytes!.buffer.asUint8List());
  });

  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();

  return <String, Object?>{
    'name': visualCase.name,
    'width': visualCase.size.width,
    'height': visualCase.size.height,
    'textScale': visualCase.textScale,
    'keyboardInset': visualCase.keyboardInset,
    'mode': visualCase.mode.name,
    'markers': visualCase.markers,
    'png': output.path,
    'notes': visualCase.mode == _VisualMode.enabled
        ? 'Integrated UnifiedIdentityScreen with all identity fields completed.'
        : 'Integrated UnifiedIdentityScreen disabled state before profile fields are completed.',
  };
}

Future<void> _completeIdentityFields(WidgetTester tester) async {
  await tester.enterText(
      find.widgetWithText(TextField, 'Full Name'), 'Aarav Sharma');
  await tester.pump(const Duration(milliseconds: 80));
  await tester.enterText(
      find.widgetWithText(TextField, 'Mobile Number'), '9876543210');
  await tester.pump(const Duration(milliseconds: 80));

  final dynamic state = tester.state(find.byType(UnifiedIdentityScreen));
  state.stateController.text = 'Rajasthan';
  state.districtController.text = 'Jaipur';
  state.setState(() {
    state.consentAccepted = true;
  });
  await tester.pump(const Duration(milliseconds: 160));
  await tester.ensureVisible(find.text('ESTABLISH IDENTITY'));
  await tester.pump(const Duration(milliseconds: 120));
}

Future<void> _loadFontsForTest() async {
  GoogleFonts.config.allowRuntimeFetching = false;
  final candidates = <String>[
    'E:/Programs/Flutter/flutter/bin/cache/artifacts/material_fonts/roboto-regular.ttf',
    'C:/src/flutter/bin/cache/artifacts/material_fonts/roboto-regular.ttf',
  ];
  final fontFile = candidates.map(File.new).firstWhere(
        (file) => file.existsSync(),
        orElse: () => File(candidates.first),
      );
  if (!fontFile.existsSync()) return;
  final bytes = await fontFile.readAsBytes();
  _installGoogleFontAssetFixture(bytes);
}

void _installGoogleFontAssetFixture(List<int> fontBytes) {
  const fontAssetKeys = <String>[
    'test_font_fixtures/Sora-Regular.ttf',
    'test_font_fixtures/Sora-Bold.ttf',
    'test_font_fixtures/Sora-ExtraBold.ttf',
    'test_font_fixtures/Sora-Black.ttf',
    'test_font_fixtures/Inter-Regular.ttf',
    'test_font_fixtures/Inter-Medium.ttf',
    'test_font_fixtures/Inter-SemiBold.ttf',
    'test_font_fixtures/Inter-Bold.ttf',
    'test_font_fixtures/Inter-ExtraBold.ttf',
    'test_font_fixtures/Poppins-Regular.ttf',
    'test_font_fixtures/Poppins-Medium.ttf',
    'test_font_fixtures/Poppins-SemiBold.ttf',
    'test_font_fixtures/Poppins-Bold.ttf',
    'test_font_fixtures/Poppins-ExtraBold.ttf',
    'test_font_fixtures/Cinzel-Regular.ttf',
    'test_font_fixtures/Cinzel-Bold.ttf',
    'test_font_fixtures/NotoSans-Regular.ttf',
  ];

  final assetBytes = <String, List<int>>{
    for (final key in fontAssetKeys) key: fontBytes,
    'assets/images/logo.png': File('assets/images/logo.png').readAsBytesSync(),
    'assets/images/google.png':
        File('assets/images/google.png').readAsBytesSync(),
  };

  google_fonts_base.assetManifest = _FontFixtureManifest(fontAssetKeys);

  final manifest = <String, Object?>{
    for (final key in assetBytes.keys)
      key: <Object?>[
        <Object?, Object?>{'asset': key}
      ],
  };
  final manifestBytes = const StandardMessageCodec().encodeMessage(manifest)!;

  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMessageHandler('flutter/assets', (ByteData? message) async {
    if (message == null) return null;
    final key = utf8.decode(
      message.buffer.asUint8List(message.offsetInBytes, message.lengthInBytes),
    );
    if (key == 'AssetManifest.bin') return manifestBytes;
    final bytes = assetBytes[key];
    if (bytes == null) return null;
    final data = Uint8List.fromList(bytes);
    return ByteData.view(data.buffer);
  });
}

class _FontFixtureManifest implements AssetManifest {
  const _FontFixtureManifest(this.assets);

  final List<String> assets;

  @override
  List<AssetMetadata>? getAssetVariants(String key) => null;

  @override
  List<String> listAssets() => assets;
}

enum _VisualMode { disabled, enabled }

class _VisualCase {
  const _VisualCase({
    required this.name,
    required this.size,
    required this.mode,
    required this.markers,
    this.textScale = 1,
    this.keyboardInset = 0,
    this.focusFirstField = false,
  });

  final String name;
  final Size size;
  final _VisualMode mode;
  final List<String> markers;
  final double textScale;
  final double keyboardInset;
  final bool focusFirstField;
}

class _FakeAuthRepository implements AuthRepository {
  @override
  Stream<User?> get authStateChanges => const Stream<User?>.empty();

  @override
  User? get currentUser => null;

  @override
  Future<UserCredential?> authenticate({
    required String email,
    required String password,
  }) async =>
      null;

  @override
  Future<UserCredential> createAccount({
    required String email,
    required String password,
  }) {
    throw UnimplementedError('Visual QA does not create accounts.');
  }

  @override
  Future<void> forgotPassword(String email) async {}

  @override
  Future<UserCredential?> signInWithGoogle() async => null;

  @override
  Future<void> signOut() async {}

  @override
  Future<UserCredential> signInWithEmail({
    required String email,
    required String password,
  }) {
    throw UnimplementedError('Visual QA does not sign in.');
  }
}
