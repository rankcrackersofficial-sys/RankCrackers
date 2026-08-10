import 'dart:async';
import 'dart:convert';

import 'package:flutter/services.dart';

import '../models/recruitment.dart';
import '../firebase/firestore_service.dart';

/// 🔱 RECRUITMENT REPOSITORY
/// Access layer for mission targets.
class RecruitmentRepository {
  static const bool _useFirebaseEmulator =
      bool.fromEnvironment('RC_USE_FIREBASE_EMULATOR');

  static Future<List<Recruitment>> _loadEmulatorPreviewMissions() async {
    if (!_useFirebaseEmulator) return const [];
    final raw = await rootBundle.loadString(
      'assets/data/preview/jee_main_2027/assessment_preview_manifest.json',
    );
    final manifest = jsonDecode(raw) as Map<String, dynamic>;
    final missionId = manifest['missionId']?.toString() ?? 'jee_main_2026';
    final displayMission =
        manifest['displayMission']?.toString() ?? 'JEE Main 2027';

    return [
      Recruitment(
        id: missionId,
        recruitmentGroupId: 'jee_main_preview',
        boardId: 'nta',
        examId: missionId,
        examBlueprintId: '${missionId}_blueprint_preview',
        title: displayMission,
        titleHindi: displayMission,
        year: 2027,
        state: 'Central',
        examCategory: 'competitive',
        status: 'published',
        examDifficulty: 0.82,
        variantCode: 'preview',
        version: 'preview-nonprod',
      ),
    ];
  }

  static Future<List<Recruitment>> fetchAll() async {
    return FirestoreService.fetchRecruitments();
  }

  /// 🔱 Learner Discovery: Fetch only published recruitments.
  static Future<List<Recruitment>> fetchPublished() async {
    return FirestoreService.fetchPublishedRecruitments();
  }

  static Future<List<Recruitment>> fetchByState(String state) async {
    final published = await fetchPublished();
    return published
        .where((r) => r.state.toLowerCase() == state.toLowerCase())
        .toList();
  }

  /// 🔱 Exam Category Filtering (Amendment v3.0)
  static Future<List<Recruitment>> fetchByStateAndCategory(
      String state, String category) async {
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

  static Stream<List<Recruitment>> streamPublished() async* {
    if (!_useFirebaseEmulator) {
      yield* FirestoreService.streamPublishedRecruitments();
      return;
    }

    try {
      await for (final missions
          in FirestoreService.streamPublishedRecruitments()) {
        if (missions.isNotEmpty) {
          yield missions;
        } else {
          yield await _loadEmulatorPreviewMissions();
        }
      }
    } catch (_) {
      yield await _loadEmulatorPreviewMissions();
    }
  }

  static Stream<List<Recruitment>> streamDrafts() {
    return stream()
        .map((list) => list.where((r) => r.status != 'published').toList());
  }
}
