import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/opportunities/screens/opportunities_screen.dart';
import 'package:rank_crackers/features/deep_profile/providers/warrior_profile_provider.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/features/opportunities/providers/opportunities_provider.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/opportunities/models/opportunity.dart';
import 'package:rank_crackers/features/auth/presentation/providers/auth_provider.dart';
import 'package:rank_crackers/features/auth/domain/repositories/auth_repository.dart';
import 'package:firebase_auth/firebase_auth.dart';

void main() {
  testWidgets('🔱 OpportunitiesScreen shows header even when auth is resolving', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authNotifierProvider.overrideWith((ref) => MockAuthNotifier(const SecureAuthState(user: null), ref)),
          warriorProfileProvider.overrideWith((ref) => MockWarriorProfileNotifier(null)),
        ],
        child: const MaterialApp(home: OpportunitiesScreen()),
      ),
    );

    await tester.pump();

    // Shell should be visible
    expect(find.text('Career Signals'), findsOneWidget);
    expect(find.byIcon(Icons.work_outline_rounded), findsOneWidget);

    // Loading indicator should be present with auth resolving message
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Authenticating Access...'), findsOneWidget);
  });

  testWidgets('🔱 OpportunitiesScreen reaches EMPTY_GOVERNED terminal state when no opportunities found', (tester) async {
    final profile = const WarriorProfile(
      uid: 'test-uid',
      currentEducationStage: '12th',
      subjectsStudied: ['Physics', 'Chemistry'],
      highestQualification: '12th Pass',
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authNotifierProvider.overrideWith((ref) => MockAuthNotifier(SecureAuthState(user: MockUser(uid: 'test-uid')), ref)),
          warriorProfileProvider.overrideWith((ref) => MockWarriorProfileNotifier(profile)),
          sessionUserProvider.overrideWith((ref) => Future.value(SessionUser(
            uid: 'test-uid',
            name: 'Warrior',
            email: 'test@example.com',
            examName: 'JEE Main',
            examId: 'jee_main_2027',
            recruitmentId: 'jee_main_2027',
          ))),
          allOpportunitiesProvider.overrideWith((ref) => Stream.value([])),
        ],
        child: const MaterialApp(home: OpportunitiesScreen()),
      ),
    );

    await tester.pumpAndSettle();

    // Terminal state: Zero Published Opportunities (dbOpportunities is empty)
    expect(find.text('Zero Published Opportunities'), findsOneWidget);
    expect(find.textContaining('JEE Main'), findsAtLeastNWidgets(1));
  });

  testWidgets('🔱 OpportunitiesScreen reaches NO_MATCH terminal state when opportunities exist but mismatch mission', (tester) async {
    final profile = const WarriorProfile(
      uid: 'test-uid',
      currentEducationStage: '12th',
      subjectsStudied: ['Physics', 'Chemistry'],
      highestQualification: '12th Pass',
    );

    final opportunity = Opportunity(
        id: 'opp_neet',
        title: 'NEET Opportunity',
        department: 'Dept',
        state: 'Central',
        totalPosts: 10,
        notificationDate: DateTime.now(),
        lastDate: DateTime.now().add(const Duration(days: 10)),
        officialPdfUrl: '',
        status: 'published',
        eligibleMissionIds: const ['neet_ug_2027'], // Mismatch for JEE Main 2027
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          authNotifierProvider.overrideWith((ref) => MockAuthNotifier(SecureAuthState(user: MockUser(uid: 'test-uid')), ref)),
          warriorProfileProvider.overrideWith((ref) => MockWarriorProfileNotifier(profile)),
          sessionUserProvider.overrideWith((ref) => Future.value(SessionUser(
            uid: 'test-uid',
            name: 'Warrior',
            email: 'test@example.com',
            examName: 'JEE Main',
            examId: 'jee_main_2027',
            recruitmentId: 'jee_main_2027',
          ))),
          allOpportunitiesProvider.overrideWith((ref) => Stream.value([opportunity])),
        ],
        child: const MaterialApp(home: OpportunitiesScreen()),
      ),
    );

    await tester.pumpAndSettle();

    // Terminal state: No Matching Career Signals
    expect(find.text('No Matching Career Signals'), findsOneWidget);
  });
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

class MockWarriorProfileNotifier extends WarriorProfileNotifier {
  final dynamic initialValue;
  MockWarriorProfileNotifier(this.initialValue);

  @override
  get state => initialValue;

  @override
  Future<void> loadProfile(String uid) async {}
}

class MockUser implements User {
  @override
  final String uid;
  MockUser({required this.uid});

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
