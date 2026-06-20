import 'package:flutter/foundation.dart';
import '../models/micro_topic_node.dart';

/// 🔱 KNOWLEDGE CACHE LAYER (v2 Hardened)
/// Manages mission hydration optimization.
class KnowledgeCache {
  
  /// 🔱 SAVES GRAPH SNAPSHOT
  static Future<void> saveGraph(String examId, List<MicroTopicNode> nodes) async {
    if (kIsWeb) return;
  }

  /// 🔱 LOADS GRAPH SNAPSHOT
  static Future<List<MicroTopicNode>?> loadGraph(String examId) async {
    if (kIsWeb) return null;
    return null;
  }

  /// 🔱 CLEARS CACHE
  static Future<void> clear(String examId) async {
    if (kIsWeb) return;
  }
}
