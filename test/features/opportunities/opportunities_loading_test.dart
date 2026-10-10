import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/opportunities/screens/opportunities_screen.dart';
import 'package:rank_crackers/features/deep_profile/providers/warrior_profile_provider.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/features/opportunities/providers/opportunities_provider.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:firebase_auth/firebase_auth.dart';

void main() {
  testWidgets('🔱 OpportunitiesScreen shows loading spinner when profile is null', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authNotifierProvider.overrideWith((ref) => MockAuthNotifier(const SecureAuthState(user: null), ref)),
          warriorProfileProvider.overrideWith((ref) => MockWarriorProfileNotifier(null)),
          sessionUserProvider.overrideWith((ref) => Future.value(SessionUser(
            uid: 'test',
            name: 'Warrior',
            email: 'test@example.com',
            examName: 'JEE Main',
            examId: 'jee',
            recruitmentId: '',
          ))),
        ],
        child: const MaterialApp(home: OpportunitiesScreen()),
      ),
    );

    // Initial state should show loader
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Check if background is preserved (header is visible)
    expect(find.text('Career Signals'), findsOneWidget);
  });
}

class MockWarriorProfileNotifier extends WarriorProfileNotifier {
  final dynamic initialValue;
  MockWarriorProfileNotifier(this.initialValue);

  @override
  get state => initialValue;
}

class MockAuthNotifier extends AuthNotifier {
  final SecureAuthState mockState;
  MockAuthNotifier(this.mockState, Ref ref) : super(AuthRepositoryMock(), ref);

  @override
  SecureAuthState get state => mockState;
}

class AuthRepositoryMock extends AuthRepository {
  @override
  get authStateChanges => const Stream.empty();
  @override
  get currentUser => null;
  @override
  Future<UserCredential?> authenticate({required String email, required String password}) async => null;
  @override
  Future<void> forgotPassword(String email) async {}
  @override
  Future<UserCredential?> signInWithGoogle() async => null;
  @override
  Future<void> signOut() async {}
  @override
  Future<UserCredential> createAccount({required String email, required String password}) => throw UnimplementedError();
  @override
  Future<UserCredential> signInWithEmail({required String email, required String password}) => throw UnimplementedError();
}
