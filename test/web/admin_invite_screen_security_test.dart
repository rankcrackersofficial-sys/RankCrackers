import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/auth/presentation/screens/admin_invite_screen.dart';

void main() {
  testWidgets('secret invitation token never becomes visible', (tester) async {
    const secret = 'private-one-time-token-0123456789';
    await tester.pumpWidget(const MaterialApp(
      home: AdminInviteScreen(token: secret),
    ));
    expect(find.textContaining(secret), findsNothing);
    expect(find.text('Secure Admin Invitation'), findsOneWidget);
    expect(find.textContaining('No invitation has been accepted'), findsOneWidget);
    expect(find.textContaining('server verification'), findsOneWidget);
  });

  testWidgets('empty token is denied without implying authorization', (tester) async {
    await tester.pumpWidget(const MaterialApp(
      home: AdminInviteScreen(token: ''),
    ));
    expect(find.textContaining('valid invitation link is required'), findsOneWidget);
    expect(find.textContaining('No invitation has been accepted'), findsOneWidget);
  });
}
