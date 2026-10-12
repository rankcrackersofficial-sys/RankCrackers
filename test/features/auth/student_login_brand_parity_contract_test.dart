import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('Student login keeps the approved Sanskrit and English brand pair', () {
    final login = File(
      'lib/features/auth/presentation/screens/unified_identity_screen.dart',
    ).readAsStringSync();
    final splash = File(
      'lib/features/onboarding/presentation/screens/splash_screen.dart',
    ).readAsStringSync();

    const sanskrit = 'तेजस्वि नावधीतमस्तु।';
    const english = 'May Our Learning Be Radiant.';
    expect(splash, contains(sanskrit));
    expect(login, contains(sanskrit));
    expect(splash, contains(english));
    expect(login, contains(english));
    expect(login, contains('"RankCrackers"'));
    expect(login, contains('"assets/images/logo.png"'));
  });

  test('Google sign-in uses the exact bundled real logo, not a fake fallback',
      () async {
    final login = File(
      'lib/features/auth/presentation/screens/unified_identity_screen.dart',
    ).readAsStringSync();
    final pubspec = File('pubspec.yaml').readAsStringSync();

    expect(login, contains('"assets/images/google.png"'));
    expect(login, isNot(contains('"assets/images/Google.png"')));
    expect(login, isNot(contains('Icons.g_mobiledata_rounded')));
    expect(pubspec, contains('assets/images/'));

    final asset = await rootBundle.load('assets/images/google.png');
    final bytes = asset.buffer.asUint8List();
    expect(bytes.length, greaterThan(200));
    expect(bytes.take(8).toList(),
        equals([137, 80, 78, 71, 13, 10, 26, 10]));
  });
}
