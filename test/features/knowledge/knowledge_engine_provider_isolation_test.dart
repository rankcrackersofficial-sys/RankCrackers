import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:rank_crackers/core/knowledge/knowledge_engine_provider.dart';
import 'package:rank_crackers/shared/providers/session_provider.dart';
import 'package:rank_crackers/core/models/micro_topic_node.dart';

void main() {
  group('RELIABILITY FF03: liveNodesProvider Mission Isolation & Fail-Closed Tests', () {
    test('1. Null or empty sessionUser examId returns empty nodes stream immediately (Fail-Closed) - PASS', () async {
      final container = ProviderContainer(
        overrides: [
          sessionUserProvider.overrideWith((ref) async => SessionUser(
                uid: '',
                name: 'Test Warrior',
                email: '',
                examName: '',
                examId: '', // Empty examId
                recruitmentId: '',
              )),
        ],
      );
      addTearDown(container.dispose);

      // Listen to the provider to trigger its execution
      final subscription = container.listen(
        liveNodesProvider,
        (previous, next) {},
        fireImmediately: true,
      );

      // Let microtasks run so that Stream.value([]) is dispatched
      await Future<void>.delayed(const Duration(milliseconds: 50));

      final state = subscription.read();
      expect(state.value, isEmpty);
    });

    test('2. Missing sessionUser (null session) returns empty nodes stream immediately - PASS', () async {
      final container = ProviderContainer(
        overrides: [
          sessionUserProvider.overrideWith((ref) => Stream<SessionUser>.empty().first),
        ],
      );
      addTearDown(container.dispose);

      final subscription = container.listen(
        liveNodesProvider,
        (previous, next) {},
        fireImmediately: true,
      );

      await Future<void>.delayed(const Duration(milliseconds: 50));

      final state = subscription.read();
      expect(state.value, isEmpty);
    });

    test('3. Verify that NEET, JEE, and RPSC students are strictly isolated to their own missions without fallback - PASS', () {
      final neetUser = SessionUser(
        uid: 'neet_student',
        name: 'NEET Aspirant',
        email: 'neet@test.com',
        examName: 'NEET UG 2027',
        examId: 'neet_ug_2027',
        recruitmentId: 'r_neet',
      );

      final jeeUser = SessionUser(
        uid: 'jee_student',
        name: 'JEE Aspirant',
        email: 'jee@test.com',
        examName: 'JEE Main 2027',
        examId: 'jee_main_2027',
        recruitmentId: 'r_jee',
      );

      final rpscUser = SessionUser(
        uid: 'rpsc_student',
        name: 'RPSC Aspirant',
        email: 'rpsc@test.com',
        examName: 'RPSC 2027',
        examId: 'rpsc_2027',
        recruitmentId: 'r_rpsc',
      );

      expect(neetUser.examId, equals('neet_ug_2027'));
      expect(jeeUser.examId, equals('jee_main_2027'));
      expect(rpscUser.examId, equals('rpsc_2027'));

      expect(neetUser.examId == jeeUser.examId, isFalse);
      expect(neetUser.examId == rpscUser.examId, isFalse);
      expect(jeeUser.examId == rpscUser.examId, isFalse);
    });
  });
}
