import 'package:firebase_auth/firebase_auth.dart';
import '../../features/crucible/models/crucible_protocol_state.dart';
import '../../features/crucible/models/crucible_schedule.dart';
import '../firebase/firestore_service.dart';

/// 🔱 CRUCIBLE REPOSITORY
/// Access layer for protocol states and tactical schedules.
class CrucibleRepository {
  static Future<void> saveProtocolState(CrucibleProtocolState state) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;
    await FirestoreService.saveProtocolState(user.uid, state);
  }

  static Stream<CrucibleProtocolState?> streamProtocolState(String recruitmentId) {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return Stream.value(null);
    return FirestoreService.streamProtocolState(user.uid, recruitmentId);
  }

  static Future<void> saveSchedule(CrucibleSchedule schedule) async {
    await FirestoreService.saveSchedule(schedule);
  }

  static Stream<List<CrucibleSchedule>> streamSchedules(String recruitmentId) {
    return FirestoreService.streamSchedules(recruitmentId);
  }
}
