import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/recruitment.dart';
import '../firebase/firestore_service.dart';

/// Student mission discovery repository.
///
/// The student-facing Mission Realm uses student_mission_catalog as its primary
/// source. The emulator fixture is derived from the locked sanitized production
/// export and is only reachable when RC_USE_FIREBASE_EMULATOR=true.
class RecruitmentRepository {
  static const bool _useFirebaseEmulator =
      bool.fromEnvironment('RC_USE_FIREBASE_EMULATOR');

  static Future<List<Recruitment>> _loadEmulatorCatalogFixture() async {
    if (!_useFirebaseEmulator) return const [];
    final raw = await rootBundle.loadString(
      'assets/data/emulator/founder_mission_exact_production_inventory_20260811065513.json',
    );
    final fixture = jsonDecode(raw) as Map<String, dynamic>;
    final missions = (fixture['missions'] as List<dynamic>? ?? const []);
    return missions
        .whereType<Map<String, dynamic>>()
        .where((mission) =>
            mission['userPanelVisible'] == true &&
            mission['cardVisible'] == true)
        .map(_fixtureMissionToRecruitment)
        .toList(growable: false);
  }

  static Recruitment _fixtureMissionToRecruitment(
      Map<String, dynamic> mission) {
    final realmId = mission['realmId'].toString();
    final missionId = (mission['missionId'] ?? realmId).toString();
    final title =
        (mission['displayName'] ?? mission['title'] ?? realmId).toString();
    final yearValue = mission['year'];
    final year = yearValue is int
        ? yearValue
        : int.tryParse(yearValue?.toString() ?? '') ?? 0;

    return Recruitment(
      id: realmId,
      recruitmentGroupId: 'student_mission_catalog',
      boardId: '',
      examId: missionId,
      examBlueprintId: '${missionId}_blueprint',
      title: title,
      titleHindi: title,
      year: year,
      state: 'Central',
      examCategory: 'category_pending',
      status: (mission['status'] ?? 'CATALOG_VISIBLE').toString(),
      examDifficulty: 0.6,
      variantCode: missionId,
      version: 'ONE_TIME_PRODUCTION_EXPORT_DERIVED_EMULATOR_ONLY',
    );
  }

  static Future<List<Recruitment>> fetchAll() async {
    return FirestoreService.fetchRecruitments();
  }

  /// Student Mission Realm source: student_mission_catalog.
  static Future<List<Recruitment>> fetchPublished() async {
    return FirestoreService.streamStudentMissionCatalogRecruitments().first;
  }

  static Future<List<Recruitment>> fetchByState(String state) async {
    final published = await fetchPublished();
    return published
        .where((r) =>
            r.state.toLowerCase() == state.toLowerCase() ||
            r.state.toLowerCase() == 'central')
        .toList();
  }

  static Future<List<Recruitment>> fetchByStateAndCategory(
      String state, String category) async {
    final stateMissions = await fetchByState(state);
    return stateMissions
        .where((r) =>
            r.examCategory == category || r.examCategory == 'category_pending')
        .toList();
  }

  static Future<List<String>> getPublishedStates() async {
    final missions = await fetchPublished();
    return missions.map((r) => r.state).toSet().toList();
  }

  static Stream<List<Recruitment>> stream() {
    return FirestoreService.streamRecruitments();
  }

  static Stream<List<Recruitment>> streamPublished() async* {
    try {
      await for (final missions
          in FirestoreService.streamStudentMissionCatalogRecruitments()) {
        if (missions.isNotEmpty || !_useFirebaseEmulator) {
          yield missions;
        } else {
          yield await _loadEmulatorCatalogFixture();
        }
      }
    } catch (_) {
      if (_useFirebaseEmulator) {
        yield await _loadEmulatorCatalogFixture();
      } else {
        yield const <Recruitment>[];
      }
    }
  }

  static Stream<List<Recruitment>> streamDrafts() {
    return stream()
        .map((list) => list.where((r) => r.status != 'published').toList());
  }
}
