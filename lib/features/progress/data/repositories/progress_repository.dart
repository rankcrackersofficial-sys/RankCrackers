import '../../../../core/storage/local_storage_engine.dart';
import '../models/user_progress.dart';

class ProgressRepository {
  static const _key = 'user_progress';

  // ===================================================
  // SAVE
  // ===================================================
  static Future<void> saveProgress(List<UserProgress> progress) async {
    await LocalStorageEngine.save(
      key: _key,
      value: progress.map((e) => e.toMap()).toList(),
    );
  }

  // ===================================================
  // LOAD
  // ===================================================
  static Future<List<UserProgress>> loadProgress() async {
    final data = await LocalStorageEngine.load(_key);
    if (data == null) {
      return [];
    }
    return List.from(data).map((e) {
      return UserProgress.fromMap(e);
    }).toList();
  }
}
