import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/presentation/screens/account_recovery_screen.dart';
import '../../../../helpers/firebase_test_setup.dart';

class _FakeAuthRepository implements AuthRepository {
  @override
  Stream<User?> get authStateChanges => Stream.value(null);

  @override
  User? get currentUser => null;

  @override
  bool get isEmailVerified => false;

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  setUpAll(() async {
    await ensureFirebaseInitializedForTests();
  });

  group('AccountRecoveryScreen Widget Tests (R3A2C)', () {
    testWidgets('1. Renders AccountRecoveryScreen with Reset Password and Continue with Google', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(_FakeAuthRepository()),
          ],
          child: const MaterialApp(
            home: AccountRecoveryScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Account Recovery'), findsOneWidget);
      expect(find.text('Access Your Account'), findsOneWidget);
      expect(find.text('Reset Password via Email'), findsOneWidget);
      expect(find.text('Continue with Google'), findsWidgets);
      expect(find.text('Use your Google account to continue'), findsOneWidget);
      expect(find.text('Back to Sign In'), findsOneWidget);
    });

    testWidgets('2. Invariant 11: Does NOT claim guaranteed existing account recovery or phone recovery', (tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authRepositoryProvider.overrideWithValue(_FakeAuthRepository()),
          ],
          child: const MaterialApp(
            home: AccountRecoveryScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Recover your existing RankCrackers account'), findsNothing);
      expect(find.text('Phone OTP Recovery'), findsNothing);
      expect(find.text('Recover with Mobile'), findsNothing);
    });
  });
}
