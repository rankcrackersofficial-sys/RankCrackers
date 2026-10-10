import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../../features/progress/data/models/user_progress.dart';
import '../firebase/firestore_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// WRITE BUFFER ENGINE (Hardened)
/// Implements Priority C: Optimized persistent local buffering.
/// Prevents data loss on app kill and reduces Firestore overhead.
class WriteBufferEngine {
  static final WriteBufferEngine _instance = WriteBufferEngine._internal();
  factory WriteBufferEngine() => _instance;
  WriteBufferEngine._internal();

  static WriteBufferEngine get instance => _instance;

  final Map<String, UserProgress> _buffer = {};
  Timer? _flushTimer;
  static const Duration _flushInterval = Duration(seconds: 30);
  static const String _storageKey = 'persistent_write_buffer';

  /// INITIALIZES BUFFER RECOVERY
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonMap = prefs.getString(_storageKey);
    if (jsonMap != null) {
      final Map<String, dynamic> data = json.decode(jsonMap);
      data.forEach((nodeId, value) {
        _buffer[nodeId] = UserProgress.fromMap(Map<String, dynamic>.from(value));
      });
      debugPrint('WRITE BUFFER: ${_buffer.length} updates recovered from disk.');
    }
  }

  /// BUFFERS A PROGRESS UPDATE
  Future<void> bufferUpdate(UserProgress progress) async {
    _buffer[progress.nodeId] = progress;
    await _persistBuffer(); // Save to disk immediately on every event
    
    _flushTimer ??= Timer(_flushInterval, flush);
  }

  Future<void> _persistBuffer() async {
    final prefs = await SharedPreferences.getInstance();
    final data = _buffer.map((k, v) => MapEntry(k, v.toMap()));
    await prefs.setString(_storageKey, json.encode(data));
  }

  /// BATCH COMMITS TO FIRESTORE
  /// Implements All-or-Nothing Batched Upload.
  Future<void> flush() async {
    if (_buffer.isEmpty) return;

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final List<Map<String, dynamic>> items = [];
    final List<String> nodeIds = _buffer.keys.toList();

    for (var nodeId in nodeIds) {
      final progress = _buffer[nodeId]!;
      final map = progress.toMap();
      map['id'] = nodeId; // Required for uploadBatch idempotency
      items.add(map);
    }

    try {
      // Execute Idempotent Batch Upload
      await FirestoreService.uploadBatch('users/${user.uid}/progress', items);
      
      // Clear buffer only on success
      _buffer.removeWhere((key, value) => nodeIds.contains(key));
      await _persistBuffer(); // Update disk storage
      debugPrint('WRITE BUFFER FLUSHED: ${items.length} updates committed.');
    } catch (e) {
      debugPrint('WRITE BUFFER ERROR: Flush failed - $e. Retrying in next cycle.');
    } finally {
      _flushTimer = null;
    }
  }

  /// EMERGENCY FLUSH (e.g. Session Exit)
  Future<void> forceFlush() async {
    _flushTimer?.cancel();
    await flush();
  }

  bool get hasPendingUpdates => _buffer.isNotEmpty;
}
