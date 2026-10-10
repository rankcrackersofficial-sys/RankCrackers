import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/auth/presentation/screens/unified_identity_screen.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../helpers/firebase_test_setup.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() async {
    SharedPreferences.setMockInitialValues({});
    await ensureFirebaseInitializedForTests();
  });

  group('Profile Rehydration Verification Tests', () {
    testWidgets('UnifiedIdentityScreen disables lookups for test by default', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: UnifiedIdentityScreen(
                disableFirebaseAuthLookupForTest: true,
                disableAnimationsForTest: true,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Form should be rendered
      expect(find.byType(UnifiedIdentityScreen), findsOneWidget);
    });

    test('SessionManager completion resets status correctly', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();

      // Initially false
      expect(prefs.getBool('profile_completed'), isNull);

      await SessionManager.completeProfile(
        studentName: 'Yuvraj Singh',
        studentCity: 'Jaipur',
        consentAccepted: true,
      );

      expect(prefs.getBool('profile_completed'), true);
      expect(prefs.getString('student_name'), 'Yuvraj Singh');
      expect(prefs.getString('student_city'), 'Jaipur');
    });
  });
}
