import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// DIGIBOOK USER PREFERENCES SERVICE
/// Sovereign local storage for Student reading convenience:
/// - Saved / Bookmarks
/// - Recently Viewed
/// - Continue Reading
///
/// HARD LAW: None of these convenience states ever mutate mastery, weakness, coverage, or scores.
class DigiBookUserPreferencesService {
  static DigiBookUserPreferencesService? _instance;
  static DigiBookUserPreferencesService get instance =>
      _instance ??= DigiBookUserPreferencesService._();

  DigiBookUserPreferencesService._();

  static const String _kSavedKey = 'rc_digibook_saved_gus_v1';
  static const String _kRecentKey = 'rc_digibook_recent_gus_v1';
  static const String _kContinueKey = 'rc_digibook_continue_reading_v1';

  // In-memory fallback
  final Set<String> _savedGus = {};
  final List<String> _recentGus = [];
  Map<String, dynamic>? _continueReadingState;
  bool _isLoaded = false;

  Future<void> init() async {
    if (_isLoaded) return;
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedList = prefs.getStringList(_kSavedKey) ?? [];
      _savedGus.addAll(savedList);

      final recentList = prefs.getStringList(_kRecentKey) ?? [];
      _recentGus.addAll(recentList);

      final continueStr = prefs.getString(_kContinueKey);
      if (continueStr != null && continueStr.isNotEmpty) {
        _continueReadingState = jsonDecode(continueStr) as Map<String, dynamic>?;
      }
      _isLoaded = true;
    } catch (e) {
      debugPrint('DIGIBOOK PREFS: Failed to init SharedPreferences, using memory: $e');
      _isLoaded = true;
    }
  }

  // --- 1. SAVED / BOOKMARKS ---
  List<String> getSavedGuIds() => _savedGus.toList();

  bool isSaved(String guId) => _savedGus.contains(guId);

  Future<bool> toggleSave(String guId) async {
    await init();
    bool newlySaved;
    if (_savedGus.contains(guId)) {
      _savedGus.remove(guId);
      newlySaved = false;
    } else {
      _savedGus.add(guId);
      newlySaved = true;
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_kSavedKey, _savedGus.toList());
    } catch (_) {}
    return newlySaved;
  }

  // --- 2. RECENTLY VIEWED ---
  List<String> getRecentGuIds() => List.unmodifiable(_recentGus);

  Future<void> addRecent(String guId) async {
    await init();
    _recentGus.remove(guId);
    _recentGus.insert(0, guId);
    if (_recentGus.length > 10) {
      _recentGus.removeRange(10, _recentGus.length);
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_kRecentKey, _recentGus);
    } catch (_) {}
  }

  // --- 3. CONTINUE READING ---
  Map<String, dynamic>? getContinueReading() => _continueReadingState;

  Future<void> saveContinueReading({
    required String guId,
    required String topicTitle,
    required String subject,
    required double scrollPercent,
  }) async {
    await init();
    _continueReadingState = {
      'guId': guId,
      'topicTitle': topicTitle,
      'subject': subject,
      'scrollPercent': scrollPercent,
      'timestamp': DateTime.now().toIso8601String(),
    };
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_kContinueKey, jsonEncode(_continueReadingState));
    } catch (_) {}
  }
}
