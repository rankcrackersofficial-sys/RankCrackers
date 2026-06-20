import 'package:flutter/foundation.dart';

class DashboardLocalDatasource {

  final dynamic isar;

  DashboardLocalDatasource(
      this.isar,
      );

  // =========================================
  // SAVE TOPIC
  // =========================================

  Future<void> saveTopic(
      dynamic topic,
      ) async {
    return;
  }

  // =========================================
  // SAVE MULTIPLE TOPICS
  // =========================================

  Future<void> saveTopics(
      List<dynamic>
      topics,
      ) async {
    return;
  }

  // =========================================
  // GET ALL TOPICS
  // =========================================

  Future<List<dynamic>> getAllTopics() async {
    return [];
  }

  // =========================================
  // GET WEAK TOPICS
  // =========================================

  Future<List<dynamic>> getWeakTopics() async {
    return [];
  }

  // =========================================
  // MASTERED TOPICS
  // =========================================

  Future<int> masteredTopicsCount() async {
    return 0;
  }

  // =========================================
  // TOTAL REBUILD TARGETS
  // =========================================

  Future<int> rebuildTargetsCount() async {
    return 0;
  }

  // =========================================
  // CLEAR DATABASE
  // =========================================

  Future<void> clearAllData() async {
    return;
  }
}
