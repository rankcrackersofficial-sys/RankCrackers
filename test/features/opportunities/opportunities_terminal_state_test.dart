import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/opportunities/screens/opportunities_screen.dart';
import 'package:rank_crackers/features/deep_profile/providers/warrior_profile_provider.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/features/opportunities/providers/opportunities_provider.dart';
import 'package:rank_crackers/features/deep_profile/models/warrior_profile.dart';
import 'package:rank_crackers/features/opportunities/models/opportunity.dart';

void main() {
  testWidgets('🔱 OpportunitiesScreen shows header even when profile is null', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
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

    await tester.pump();

    // Shell should be visible
    expect(find.text('Career Signals'), findsOneWidget);
    expect(find.byIcon(Icons.work_outline_rounded), findsOneWidget);

    // Loading indicator should be present
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Syncing Career Profile...'), findsOneWidget);
  });

  testWidgets('🔱 OpportunitiesScreen reaches EMPTY_GOVERNED terminal state when no opportunities found', (tester) async {
    final profile = const WarriorProfile(uid: 'test', currentEducationStage: '12th');

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          warriorProfileProvider.overrideWith((ref) => MockWarriorProfileNotifier(profile)),
          sessionUserProvider.overrideWith((ref) => Future.value(SessionUser(
            uid: 'test',
            name: 'Warrior',
            email: 'test@example.com',
            examName: 'JEE Main',
            examId: 'jee_main',
            recruitmentId: '',
          ))),
          allOpportunitiesProvider.overrideWith((ref) => Stream.value([])),
        ],
        child: const MaterialApp(home: OpportunitiesScreen()),
      ),
    );

    await tester.pumpAndSettle();

    // Terminal state: Empty
    expect(find.text('No Matching Career Signals'), findsOneWidget);
    expect(find.textContaining('JEE Main'), findsOneWidget);
  });
}

class MockWarriorProfileNotifier extends WarriorProfileNotifier {
  final dynamic initialValue;
  MockWarriorProfileNotifier(this.initialValue);

  @override
  get state => initialValue;

  @override
  Future<void> loadProfile(String uid) async {}
}
