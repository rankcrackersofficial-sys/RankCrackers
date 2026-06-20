import 'ai_result_cache.dart';

class CacheFirstEngine {
  static Future<bool> exists(String id) async {
    final result = await AIResultCache.get(id);
    return result != null;
  }
}
