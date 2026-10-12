import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/shared/session/session_manager.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() async {
    SessionManager.disableFirebaseForTest = true;
    SharedPreferences.setMockInitialValues({});
    await SessionManager.initialize();
  });

  test('missing selected mission stays unbound instead of defaulting to JEE', () {
    final user = SessionUser.getSync();

    expect(user.examId, isEmpty);
    expect(user.recruitmentId, isEmpty);
  });

  test('explicitly selected mission remains bound to the selected mission', () async {
    await SessionManager.saveMissionIdentity(
      examId: 'ssc_cgl',
      examName: 'SSC CGL',
      variantId: 'default',
      recruitmentId: 'ssc_cgl',
    );

    final user = SessionUser.getSync();

    expect(user.examId, 'ssc_cgl');
    expect(user.recruitmentId, 'ssc_cgl');
  });
}
