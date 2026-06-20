import '../models/recruitment.dart';
import '../firebase/firestore_service.dart';

/// 🔱 RECRUITMENT REPOSITORY
/// Access layer for mission targets.
class RecruitmentRepository {
  static Future<List<Recruitment>> fetchAll() async {
    return FirestoreService.fetchRecruitments();
  }

  /// 🔱 Learner Discovery: Fetch only published recruitments.
  static Future<List<Recruitment>> fetchPublished() async {
    return FirestoreService.fetchPublishedRecruitments();
  }

  static Future<List<Recruitment>> fetchByState(String state) async {
    final published = await fetchPublished();
    return published.where((r) => r.state.toLowerCase() == state.toLowerCase()).toList();
  }

  /// 🔱 Exam Category Filtering (Amendment v3.0)
  static Future<List<Recruitment>> fetchByStateAndCategory(String state, String category) async {
    final stateMissions = await fetchByState(state);
    return stateMissions.where((r) => r.examCategory == category).toList();
  }

  /// 🔱 State Visibility Law: Returns only states containing published missions.
  static Future<List<String>> getPublishedStates() async {
    return FirestoreService.fetchPublishedStates();
  }

  static Stream<List<Recruitment>> stream() {
    return FirestoreService.streamRecruitments();
  }

  static Stream<List<Recruitment>> streamDrafts() {
    return stream().map((list) => list.where((r) => r.status != 'published').toList());
  }
}
