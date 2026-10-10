import 'dart:async';
import '../models/recruitment.dart';
import '../firebase/firestore_service.dart';

/// Student mission discovery repository.
///
/// The student-facing Mission Realm uses mission_realms as its only canonical
/// source. Student-card fields are stored on the realm parent and are not
/// reconstructed from a second catalog collection.
class RecruitmentRepository {
  static Future<List<Recruitment>> fetchAll() async {
    return FirestoreService.fetchRecruitments();
  }

  /// Student Mission Realm source: mission_realms.
  static Future<List<Recruitment>> fetchPublished() async {
    return FirestoreService.streamMissionRealmRecruitments().first;
  }

  static Future<List<Recruitment>> fetchByState(String state) async {
    final published = await fetchPublished();
    return published
        .where(
          (r) =>
              r.state.toLowerCase() == state.toLowerCase() ||
              r.state.toLowerCase() == 'central',
        )
        .toList();
  }

  static Future<List<Recruitment>> fetchByStateAndCategory(
    String state,
    String category,
  ) async {
    final stateMissions = await fetchByState(state);
    return stateMissions
        .where(
          (r) =>
              r.examCategory == category ||
              r.examCategory == 'category_pending',
        )
        .toList();
  }

  static Future<List<String>> getPublishedStates() async {
    final missions = await fetchPublished();
    return missions.map((r) => r.state).toSet().toList();
  }

  static Stream<List<Recruitment>> stream() {
    return FirestoreService.streamPublishedRecruitments();
  }

  static Stream<List<Recruitment>> streamPublished() async* {
    try {
      await for (final missions
          in FirestoreService.streamMissionRealmRecruitments()) {
        yield missions;
      }
    } catch (_) {
      yield const <Recruitment>[];
    }
  }

  static Stream<List<Recruitment>> streamDrafts() {
    return stream().map(
      (list) => list.where((r) => r.status != 'published').toList(),
    );
  }
}
