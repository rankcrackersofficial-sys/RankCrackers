import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

void main() {
  test('🔱 SessionUser: No silent ras fallback on unresolved mission', () {
    SessionManager.disableFirebaseForTest = true;

    // Simulating clear session
    final session = SessionUser.getSync();

    expect(session.examId, isNot('ras'));
    expect(session.examId, 'unresolved');
    expect(session.examName, 'Unresolved Mission');
  });
}
