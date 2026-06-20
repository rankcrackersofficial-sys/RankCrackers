import '../models/exam_blueprint.dart';
import '../firebase/firestore_service.dart';

/// 🔱 BLUEPRINT REPOSITORY
/// Access layer for tactical rulebooks.
class BlueprintRepository {
  static Future<ExamBlueprint?> getById(String id) async {
    return FirestoreService.fetchBlueprint(id);
  }

  static Stream<List<ExamBlueprint>> stream() {
    return FirestoreService.streamBlueprints();
  }
}
