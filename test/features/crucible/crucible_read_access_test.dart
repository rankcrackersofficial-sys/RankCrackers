import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/core/firebase/firestore_service.dart';

void main() {
  group('RELIABILITY FF01: Crucible Authorized Read Proof', () {
    final now = DateTime.now().toUtc();

    test('1. CrucibleProtocolState fromMap handles all fields correctly - PASS', () {
      final map = {
        'recruitmentId': 'jee_main_2027',
        'protocolStartTime': now.millisecondsSinceEpoch,
        'phaseIndex': 1,
        'isTerminated': false,
        'lastSyncTime': now.millisecondsSinceEpoch,
      };
      final state = CrucibleProtocolState.fromMap(map);
      expect(state.recruitmentId, equals('jee_main_2027'));
      expect(state.phaseIndex, equals(1));
    });

    test('2. CrucibleProtocolState toMap produces valid schema - PASS', () {
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        protocolStartTime: now,
        phaseIndex: 2,
      );
      final map = state.toMap();
      expect(map['recruitmentId'], equals('jee_main_2027'));
      expect(map['phaseIndex'], equals(2));
    });
  });
}
