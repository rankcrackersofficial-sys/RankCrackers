import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../core/backend/crucible_repository.dart';
import '../../models/crucible_protocol_state.dart';
import '../../../../shared/providers/session_provider.dart';

final crucibleProtocolStateProvider = StreamProvider.autoDispose<CrucibleProtocolState?>((ref) {
  final sessionUserAsync = ref.watch(sessionUserProvider);
  return sessionUserAsync.when(
    data: (user) => CrucibleRepository.streamProtocolState(user.recruitmentId),
    loading: () => const Stream.empty(),
    error: (err, stack) => const Stream.empty(),
  );
});

final publishedCrucibleDaysProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, missionId) {
  return FirebaseFirestore.instance
      .collection('mission_realms').doc(missionId).collection('crucible_days')
      .where('status', isEqualTo: 'published').snapshots()
      .map((snap) => snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
});

final publishedCrucibleTestsProvider = StreamProvider.family<List<Map<String, dynamic>>, String>((ref, missionId) {
  return FirebaseFirestore.instance
      .collection('mission_realms').doc(missionId).collection('crucible_tests')
      .where('status', isEqualTo: 'published').snapshots()
      .map((snap) => snap.docs.map((doc) => {'id': doc.id, ...doc.data()}).toList());
});
