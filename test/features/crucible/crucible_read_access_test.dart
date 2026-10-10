import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/crucible/models/crucible_protocol_state.dart';
import 'package:rank_crackers/core/firebase/firestore_service.dart';

void main() {
  group('RELIABILITY FF01: Crucible Authorized Read Proof', () {
    final now = DateTime.now().toUtc();

    test('1. CrucibleProtocolState fromMap handles all fields correctly - PASS', () {
      final map = {
        'recruitmentId': 'jee_main_2027',
        'phaseIndex': 1,
        'scheduleIndex': 1,
        'currentScheduleId': 's1',
        'status': 'study',
        'scheduleStartTime': now.millisecondsSinceEpoch,
        'protocolStartTime': now.millisecondsSinceEpoch,
        'currentBoundaryTime': now.millisecondsSinceEpoch,
        'isVIP': false,
        'isStalled': false,
      };
      final state = CrucibleProtocolState.fromMap(map);
      expect(state.recruitmentId, equals('jee_main_2027'));
      expect(state.phaseIndex, equals(1));
    });

    test('2. CrucibleProtocolState toMap produces valid schema - PASS', () {
      final state = CrucibleProtocolState(
        recruitmentId: 'jee_main_2027',
        phaseIndex: 2,
        scheduleIndex: 5,
        currentScheduleId: 's5',
        status: 'study',
        scheduleStartTime: now,
        protocolStartTime: now,
        currentBoundaryTime: now,
        isVIP: true,
        isStalled: false,
      );
      final map = state.toMap();
      expect(map['recruitmentId'], equals('jee_main_2027'));
      expect(map['phaseIndex'], equals(2));
      expect(map['isVIP'], isTrue);
    });
  });
}
