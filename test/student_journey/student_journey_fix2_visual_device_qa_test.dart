// ignore_for_file: implementation_imports

import 'dart:convert';
import 'dart:io';
import 'dart:ui' as ui;

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_fonts/src/google_fonts_base.dart' as google_fonts_base;
import 'package:rank_crackers/core/knowledge/knowledge_engine_provider.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';
import 'package:rank_crackers/core/models/notification_item.dart';
import 'package:rank_crackers/features/opportunities/models/opportunity.dart';
import 'package:rank_crackers/features/opportunities/models/sentinel_metrics.dart';
import 'package:rank_crackers/features/opportunities/providers/opportunities_provider.dart';
import 'package:rank_crackers/features/opportunities/providers/opportunity_stats_provider.dart';
import 'package:rank_crackers/features/opportunities/providers/sentinel_intelligence_provider.dart';
import 'package:rank_crackers/core/models/recruitment.dart';
import 'package:rank_crackers/core/theme/app_theme.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/mission_realm_screen.dart';
import 'package:rank_crackers/features/auth/presentation/screens/unified_identity_screen.dart';
import 'package:rank_crackers/features/dashboard/presentation/screens/dashboard_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../helpers/firebase_test_setup.dart';

const _screenshotDir =
    'docs/patch_safety/student_journey_fix2_visual_device_qa_screenshots_20260807190000';

final _sampleMissions = <Recruitment>[
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
  Recruitment(
    id: 'jee-main-2026',
    recruitmentGroupId: 'jee-main',
    boardId: 'nta',
    examId: 'jee_main_2026',
    examBlueprintId: 'jee_main_2026_blueprint',
    title: 'JEE Main 2026',
    titleHindi: 'JEE Main 2026',
    year: 2026,
    state: 'Central',
    examCategory: 'competitive',
    status: 'published',
    variantCode: 'jee_main_2026_default',
  ),
];

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

Widget _screenFor(_JourneyCase journeyCase) {
  switch (journeyCase.screen) {
    case _JourneyScreen.login:
      return const UnifiedIdentityScreen(
          disableFirebaseAuthLookupForTest: true,
          disableAnimationsForTest: true);
    case _JourneyScreen.profileSetup:
      return const UnifiedIdentityScreen(
        forceProfileSetupForTest: true,
        disableFirebaseAuthLookupForTest: true,
      );
    case _JourneyScreen.missionRealm:
      return const MissionRealmScreen();
    case _JourneyScreen.dashboard:
      return const DashboardScreen(disableKnowledgeEngineInitForTest: true);
  }
}

Future<void> _pumpJourneyCase(
  WidgetTester tester,
  _JourneyCase journeyCase,
  GlobalKey boundaryKey,
) async {
  SharedPreferences.setMockInitialValues({
    'user_state': 'Rajasthan',
    'student_name': 'Aarav Sharma',
    'student_city': 'Jaipur',
    'exam_name': 'JEE Main 2027',
    'exam_id': 'jee_main_2027',
  });

  tester.view.physicalSize = journeyCase.size;
  tester.view.devicePixelRatio = 1;

  final media = MediaQueryData(
    size: journeyCase.size,
    devicePixelRatio: 1,
    padding: EdgeInsets.zero,
    viewPadding: EdgeInsets.zero,
    viewInsets: EdgeInsets.only(bottom: journeyCase.keyboardInset),
    textScaler: TextScaler.linear(journeyCase.textScale),
  );

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        authRepositoryProvider.overrideWithValue(_FakeAuthRepository()),
        authStateChangesProvider
            .overrideWith((ref) => Stream<User?>.value(null)),
        liveNodesProvider.overrideWith(
            (ref) => Stream<List<MicroTopicNode>>.value(const [])),
        allNodesProvider.overrideWithValue(const <MicroTopicNode>[]),
        allOpportunitiesProvider
            .overrideWith((ref) => Stream<List<Opportunity>>.value(const [])),
        activeOpportunitiesCountProvider
            .overrideWith((ref) => Stream<int>.value(0)),
        latestUpdatesCountProvider.overrideWith((ref) => Stream<int>.value(0)),
        sentinelMetricsProvider.overrideWith(
            (ref) => Stream<SentinelMetrics>.value(SentinelMetrics())),
        notificationListProvider.overrideWith(
            (ref) => Stream<List<NotificationItem>>.value(const [])),
        publishedRecruitmentsProvider.overrideWithValue(_sampleMissions),
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
            child: _screenFor(journeyCase),
          ),
        ),
      ),
    ),
  );
  await tester.pump(const Duration(milliseconds: 100));
  await tester.runAsync(() async {
    await Future<void>.delayed(const Duration(milliseconds: 150));
  });
  await tester.pump(const Duration(milliseconds: 100));

  if (journeyCase.focusFirstField) {
    final firstTextField = find.byType(TextField).first;
    if (firstTextField.evaluate().isNotEmpty) {
      await tester.tap(firstTextField, warnIfMissed: false);
      await tester.pump(const Duration(milliseconds: 120));
    }
  }
}

Future<Map<String, Object?>> _captureCase(
  WidgetTester tester,
  _JourneyCase journeyCase,
) async {
  final boundaryKey = GlobalKey();
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();
  await _pumpJourneyCase(tester, journeyCase, boundaryKey);

  final exception = tester.takeException();
  if (exception != null) {
    fail('${journeyCase.name} rendered with exception: $exception');
  }

  for (final marker in journeyCase.markers) {
    expect(
      find.textContaining(marker),
      findsWidgets,
      reason: '${journeyCase.name} missing marker: $marker',
    );
  }

  final boundary =
      boundaryKey.currentContext!.findRenderObject()! as RenderRepaintBoundary;
  final image = await boundary.toImage(pixelRatio: 1);
  final bytes = await image.toByteData(format: ui.ImageByteFormat.png);
  final output = File('$_screenshotDir/${journeyCase.fileName}');
  output.parent.createSync(recursive: true);
  output.writeAsBytesSync(bytes!.buffer.asUint8List());
  return {
    'filename': journeyCase.fileName,
    'screen': journeyCase.screen.name,
    'viewport':
        '${journeyCase.size.width.toInt()}x${journeyCase.size.height.toInt()}',
    'textScale': journeyCase.textScale,
    'keyboardInset': journeyCase.keyboardInset,
    'markers': journeyCase.markers,
    'pngBytes': output.lengthSync(),
    'dimensions': '${image.width}x${image.height}',
    'result': 'PASS',
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    await ensureFirebaseInitializedForTests();
    await _loadFontsForTest();
    Directory(_screenshotDir).createSync(recursive: true);
  });

  tearDownAll(() {
    final binding = TestWidgetsFlutterBinding.instance;
    binding.platformDispatcher.views.first.resetPhysicalSize();
    binding.platformDispatcher.views.first.resetDevicePixelRatio();
  });

  final cases = <_JourneyCase>[
    _JourneyCase.login('01_login_normal_mobile.png', const Size(360, 800)),
    _JourneyCase.login('02_login_compact_height.png', const Size(360, 640)),
    _JourneyCase.login(
      '03_login_keyboard_open.png',
      const Size(360, 640),
      keyboardInset: 280,
      focusFirstField: true,
    ),
    _JourneyCase.login(
      '04_login_large_text.png',
      const Size(393, 873),
      textScale: 1.3,
    ),
    _JourneyCase.profile(
        '05_profile_setup_normal_mobile.png', const Size(360, 800)),
    _JourneyCase.profile(
        '06_profile_setup_compact_height.png', const Size(360, 640)),
    _JourneyCase.profile(
      '07_profile_setup_keyboard_open.png',
      const Size(360, 640),
      keyboardInset: 280,
      focusFirstField: true,
    ),
    _JourneyCase.profile(
      '08_profile_setup_large_text.png',
      const Size(393, 873),
      textScale: 1.3,
    ),
    _JourneyCase.mission(
        '09_mission_realm_normal_mobile.png', const Size(360, 800)),
    _JourneyCase.mission(
        '10_mission_realm_compact_height.png', const Size(360, 640)),
    _JourneyCase.mission(
        '11_mission_realm_very_short_height.png', const Size(320, 568)),
    _JourneyCase.mission(
      '12_mission_realm_large_text.png',
      const Size(393, 873),
      textScale: 1.3,
    ),
    _JourneyCase.dashboard(
        '13_dashboard_normal_mobile.png', const Size(360, 800)),
    _JourneyCase.dashboard(
        '14_dashboard_compact_height.png', const Size(360, 640)),
    _JourneyCase.dashboard(
      '15_dashboard_large_text.png',
      const Size(393, 873),
      textScale: 1.3,
    ),
    _JourneyCase.dashboard(
        '16_dashboard_narrow_width.png', const Size(320, 568)),
  ];

  for (final journeyCase in cases) {
    testWidgets('Student Journey FIX2 ${journeyCase.name}', (tester) async {
      final record = await _captureCase(tester, journeyCase);
      File('$_screenshotDir/${journeyCase.name}.json').writeAsStringSync(
        const JsonEncoder.withIndent('  ').convert(record),
      );
    }, timeout: const Timeout(Duration(seconds: 15)));
  }
}

enum _JourneyScreen { login, profileSetup, missionRealm, dashboard }

class _JourneyCase {
  const _JourneyCase({
    required this.fileName,
    required this.screen,
    required this.size,
    required this.markers,
    this.textScale = 1,
    this.keyboardInset = 0,
    this.focusFirstField = false,
  });

  factory _JourneyCase.login(
    String fileName,
    Size size, {
    double textScale = 1,
    double keyboardInset = 0,
    bool focusFirstField = false,
  }) {
    return _JourneyCase(
      fileName: fileName,
      screen: _JourneyScreen.login,
      size: size,
      textScale: textScale,
      keyboardInset: keyboardInset,
      focusFirstField: focusFirstField,
      markers: const [
        'RankCrackers',
        'LOGIN / CONTINUE',
        'Continue with Google'
      ],
    );
  }

  factory _JourneyCase.profile(
    String fileName,
    Size size, {
    double textScale = 1,
    double keyboardInset = 0,
    bool focusFirstField = false,
  }) {
    return _JourneyCase(
      fileName: fileName,
      screen: _JourneyScreen.profileSetup,
      size: size,
      textScale: textScale,
      keyboardInset: keyboardInset,
      focusFirstField: focusFirstField,
      markers: const ['Full Name', 'Mobile Number', 'ESTABLISH IDENTITY'],
    );
  }

  factory _JourneyCase.mission(
    String fileName,
    Size size, {
    double textScale = 1,
  }) {
    return _JourneyCase(
      fileName: fileName,
      screen: _JourneyScreen.missionRealm,
      size: size,
      textScale: textScale,
      markers: const ['Mission Realm', 'SEARCH MISSION', 'AVAILABLE MISSIONS'],
    );
  }

  factory _JourneyCase.dashboard(
    String fileName,
    Size size, {
    double textScale = 1,
  }) {
    return _JourneyCase(
      fileName: fileName,
      screen: _JourneyScreen.dashboard,
      size: size,
      textScale: textScale,
      markers: const ['MISSION HUB', 'THE CRUCIBLE', 'DIGIBOOK'],
    );
  }

  String get name => fileName.replaceAll('.png', '');

  final String fileName;
  final _JourneyScreen screen;
  final Size size;
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
  Future<UserCredential?> authenticate(
          {required String email, required String password}) async =>
      null;

  @override
  Future<UserCredential> createAccount(
      {required String email, required String password}) {
    throw UnimplementedError('Visual QA does not create accounts.');
  }

  @override
  Future<void> forgotPassword(String email) async {}

  @override
  Future<UserCredential?> signInWithGoogle() async => null;

  @override
  Future<void> signOut() async {}

  @override
  Future<UserCredential> signInWithEmail(
      {required String email, required String password}) {
    throw UnimplementedError('Visual QA does not sign in.');
  }
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
