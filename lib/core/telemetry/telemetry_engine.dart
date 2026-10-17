import 'dart:async';
import '../../shared/session/session_manager.dart';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:crypto/crypto.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import '../firebase/firestore_service.dart';
import './models/telemetry_record.dart';

/// TELEMETRY ENGINE (v2 Hardened)
/// Sovereign authority for capturing and reporting real-world tactical performance.
/// Implements Session Tracking, Privacy Hashing, and Persistent Queuing.
class TelemetryEngine {
  static final TelemetryEngine _instance = TelemetryEngine._internal();
  factory TelemetryEngine() => _instance;
  TelemetryEngine._internal();

  static TelemetryEngine get instance => _instance;

  final List<TelemetryRecord> _buffer = [];
  Timer? _flushTimer;
  static const Duration _flushInterval = Duration(minutes: 1);
  static const String _storageKey = 'persistent_telemetry_queue';

  String? _deviceModel;
  String? _osVersion;
  String? _appVersion;
  String? _buildNumber;
  String? _sessionId;

  /// INITIALIZES PRODUCTION CONTEXT
  Future<void> init() async {
    // 1. Device Context
    final deviceInfo = DeviceInfoPlugin();
    if (Platform.isAndroid) {
      final androidInfo = await deviceInfo.androidInfo;
      _deviceModel = androidInfo.model;
      _osVersion = 'Android ${androidInfo.version.release}';
    } else if (Platform.isIOS) {
      final iosInfo = await deviceInfo.iosInfo;
      _deviceModel = iosInfo.utsname.machine;
      _osVersion = 'iOS ${iosInfo.systemVersion}';
    }

    // 2. Package Context
    final packageInfo = await PackageInfo.fromPlatform();
    _appVersion = packageInfo.version;
    _buildNumber = packageInfo.buildNumber;

    // 3. Session Lifecycle
    _sessionId =
        'sess_${DateTime.now().millisecondsSinceEpoch}_${_generateShortHash(DateTime.now().toIso8601String())}';

    // 4. Recovery: Hydrate from persistent storage
    await _hydrateQueue();

    debugPrint('TELEMETRY INITIALIZED: Session $_sessionId');
  }

  /// CAPTURES A PERFORMANCE EVENT
  Future<void> capture({
    required String eventName,
    required int durationMs,
    bool success = true,
    String? errorCode,
    String? recruitmentId,
    Map<String, dynamic> metadata = const {},
  }) async {
    final uid = FirebaseAuth.instance.currentUser?.uid ?? 'anonymous';
    final network = await _getNetworkType();
    final effectiveRecruitmentId =
        recruitmentId ?? SessionManager.selectedRecruitmentIdSync() ?? '';

    final record = TelemetryRecord(
      id: 'tel_${DateTime.now().microsecondsSinceEpoch}',
      eventName: eventName,
      durationMs: durationMs,
      success: success,
      errorCode: errorCode,
      sessionId: _sessionId ?? 'unknown',
      anonymizedUserId: _generateShortHash(uid),
      userId: uid,
      recruitmentId: effectiveRecruitmentId,
      deviceModel: _deviceModel ?? 'Unknown',
      osVersion: _osVersion ?? 'Unknown',
      appVersion: _appVersion ?? '1.0.0',
      buildNumber: _buildNumber ?? '1',
      networkType: network,
      timestamp: DateTime.now(),
      metadata: metadata,
    );

    _buffer.add(record);
    await _persistQueue(); // Security: Save to disk on every capture

    // Rolling Timer Hardening
    _flushTimer?.cancel();
    _flushTimer = Timer(_flushInterval, flush);

    if (kDebugMode) {
      debugPrint(
          'TELEMETRY: Captured $eventName in ${durationMs}ms [${success ? 'SUCCESS' : 'FAILED'}]');
    }
  }

  /// COMMITS BATTALION METRICS TO FIRESTORE
  Future<void> flush() async {
    if (_buffer.isEmpty) return;

    final currentUid = FirebaseAuth.instance.currentUser?.uid;
    if (currentUid == null || currentUid.isEmpty) return;

    // A persisted queue can contain records captured before authentication or
    // before a mission was selected. Firestore rules intentionally reject
    // those records; one invalid item must not poison the whole atomic batch.
    final validRecords = _buffer
        .where((record) =>
            record.userId == currentUid &&
            (record.recruitmentId ?? '').trim().isNotEmpty &&
            record.eventName.trim().isNotEmpty &&
            record.sessionId.trim().isNotEmpty)
        .toList();
    if (validRecords.isEmpty) {
      _buffer.clear();
      await _clearPersistentQueue();
      return;
    }

    final List<Map<String, dynamic>> items =
        validRecords.map((r) => r.toMap()).toList();

    try {
      // Authority: Batch upload to telemetry nexus
      await FirestoreService.uploadBatch('telemetry_nexus', items);

      _buffer.removeWhere((record) => validRecords.contains(record));
      await _clearPersistentQueue();
      debugPrint('TELEMETRY FLUSHED: ${items.length} records committed.');
    } catch (e) {
      debugPrint('TELEMETRY ERROR: Flush failed - $e. Retention active.');
    } finally {
      _flushTimer = null;
    }
  }

  /// INTERNAL: Persistence logic for offline/crash recovery
  Future<void> _persistQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = _buffer.map((r) => json.encode(r.toMap())).toList();
    await prefs.setStringList(_storageKey, jsonList);
  }

  Future<void> _hydrateQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = prefs.getStringList(_storageKey);
    if (jsonList != null && jsonList.isNotEmpty) {
      for (var item in jsonList) {
        _buffer.add(TelemetryRecord.fromMap(json.decode(item)));
      }
      debugPrint(
          'TELEMETRY RECOVERY: ${_buffer.length} records restored from disk.');
    }
  }

  Future<void> _clearPersistentQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }

  /// UTILITIES
  String _generateShortHash(String input) {
    return sha256.convert(utf8.encode(input)).toString().substring(0, 12);
  }

  Future<String> _getNetworkType() async {
    final result = await Connectivity().checkConnectivity();
    if (result.contains(ConnectivityResult.wifi)) return 'wifi';
    if (result.contains(ConnectivityResult.mobile)) return 'cellular';
    return 'offline';
  }

  void trackCriticalError(String error, StackTrace stack) {
    capture(
      eventName: 'crash_event',
      durationMs: 0,
      success: false,
      errorCode: 'CRITICAL_CRASH',
      metadata: {
        'error': error,
        'stack': stack.toString().substring(0, 500),
      },
    );
    flush();
  }
}
