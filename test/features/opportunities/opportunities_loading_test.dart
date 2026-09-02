import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/features/opportunities/screens/opportunities_screen.dart';
import 'package:rank_crackers/features/deep_profile/providers/warrior_profile_provider.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/features/opportunities/providers/opportunities_provider.dart';

void main() {
  testWidgets('🔱 OpportunitiesScreen shows loading spinner when profile is null', (tester) async {
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

    // Initial state should show loader
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    // Check if background is context-less (no header)
    expect(find.text('Career Signals'), findsNothing);
  });
}

class MockWarriorProfileNotifier extends WarriorProfileNotifier {
  final dynamic initialValue;
  MockWarriorProfileNotifier(this.initialValue);

  @override
  get state => initialValue;
}
