import 'package:firebase_auth/firebase_auth.dart';
import '../../features/crucible/models/crucible_protocol_state.dart';
import '../../features/crucible/models/crucible_schedule.dart';
import '../firebase/firestore_service.dart';

/// CRUCIBLE REPOSITORY
/// Access layer for protocol states and tactical schedules.
class CrucibleRepository {
  static Future<void> saveProtocolState(CrucibleProtocolState state) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveProtocolState(user.uid, state);
  }

  static Stream<CrucibleProtocolState?> streamProtocolState(String recruitmentId) async* {
    if (recruitmentId.isEmpty) {
      print('CrucibleRepository: streamProtocolState - recruitmentId is empty (unresolved/loading state)');
      yield null;
      return;
    }
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) {
      print('CrucibleRepository: streamProtocolState - user is null');
      yield null;
      return;
    }
    print('CrucibleRepository: streamProtocolState - uid: ${user.uid}, recruitmentId: $recruitmentId');
    try {
      await for (final state in FirestoreService.streamProtocolState(user.uid, recruitmentId)) {
        yield state;
      }
    } catch (err) {
      print('CrucibleRepository: streamProtocolState - caught error: $err');
      yield null;
    }
  }

  static Future<void> saveSchedule(CrucibleSchedule schedule) async {
    await FirestoreService.saveSchedule(schedule);
  }

  static Stream<List<CrucibleSchedule>> streamSchedules(String recruitmentId) {
    return FirestoreService.streamSchedules(recruitmentId);
  }
}
