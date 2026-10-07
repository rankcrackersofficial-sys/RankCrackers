import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';

/// DIGIBOOK REVISION SERVICE
/// Sovereign Mobile-Runtime Revision Authority
///
/// Resolves current governed revisions via Firestore or controlled memory override.
/// Enforces fail-closed behavior without Windows/local filesystem dependencies on physical devices.
class DigiBookRevisionService {
  static DigiBookRevisionService? _instance;
  static DigiBookRevisionService get instance =>
      _instance ??= DigiBookRevisionService._();

  DigiBookRevisionService._();

  FirebaseFirestore? get _db {
    try {
      return FirebaseFirestore.instance;
    } catch (_) {
      return null;
    }
  }

  // In-memory current revision pointers (guId -> revisionId)
  final Map<String, String> _currentPointers = {};

  // In-memory mock/controlled revision payloads (key: "guId:revisionId" -> raw JSON map)
  final Map<String, Map<String, dynamic>> _mockPayloadStore = {};

  /// Set in-memory current pointer override (e.g. for testing V001 -> V002 revision switch)
  void setPointerOverride(String guId, String revisionId) {
    _currentPointers[guId] = revisionId;
  }

  /// Clear in-memory current pointer override
  void clearPointerOverride(String guId) {
    _currentPointers.remove(guId);
  }

  /// Store mock revision payload for offline / unit test verification
  void setMockRevisionPayload(
      String guId, String revisionId, Map<String, dynamic> payload) {
    _mockPayloadStore['$guId:$revisionId'] = payload;
  }

  /// Resolves the current governed revision ID for a Generation Unit
  Future<String?> resolveCurrentRevisionId(String guId) async {
    // 1. Check in-memory override first
    if (_currentPointers.containsKey(guId)) {
      return _currentPointers[guId];
    }

    // 2. Fetch current pointer from Firestore `digibook_pointers` collection
    final firestore = _db;
    if (firestore != null) {
      try {
        final doc = await firestore
            .collection('digibook_pointers')
            .doc(guId)
            .get(const GetOptions(source: Source.serverAndCache));

        if (doc.exists && doc.data() != null) {
          final data = doc.data()!;
          final rev = data['currentRevisionId'] as String?;
          if (rev != null && rev.isNotEmpty) {
            return rev;
          }
        }
      } catch (e) {
        debugPrint('DIGIBOOK REVISION POINTER ERROR ($guId): $e');
      }
    }

    return null;
  }

  /// Fetches raw DigiBook lesson payload for a specific GU and revision
  Future<Map<String, dynamic>?> fetchRevisionPayload(
      String guId, String revisionId) async {
    // 1. Check controlled mock payload store
    final mockKey = '$guId:$revisionId';
    if (_mockPayloadStore.containsKey(mockKey)) {
      return _mockPayloadStore[mockKey];
    }

    // 2. Fetch from Firestore `digibook_revisions` collection
    final firestore = _db;
    if (firestore != null) {
      final docKey = '${guId}_$revisionId';
      try {
        final doc = await firestore
            .collection('digibook_revisions')
            .doc(docKey)
            .get(const GetOptions(source: Source.serverAndCache));

        if (doc.exists && doc.data() != null) {
          return doc.data()!;
        }
      } catch (e) {
        debugPrint('DIGIBOOK REVISION PAYLOAD ERROR ($docKey): $e');
      }
    }

    return null;
  }
}
