import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';

/// SYSTEM HEALTH REPOSITORY (v3.0 Sovereign Telemetry)
class HealthRepository {
  static final _firestore = FirebaseFirestore.instance;
  static final _functions = FirebaseFunctions.instance;

  static Stream<int> streamAIQueueSize() {
    return _firestore.collection('ai_queue').snapshots().map((snap) => snap.size);
  }

  static Stream<int> streamAIFailuresCount() {
    return _firestore.collection('ai_failed_tasks').snapshots().map((snap) => snap.size);
  }

  static Stream<bool> streamAiSystemStatus() {
    return _firestore
        .collection('system_config')
        .doc('global')
        .snapshots()
        .map((doc) => doc.data()?['aiEnabled'] ?? true);
  }

  static Future<void> toggleAiSystem(bool enabled) async {
    await _functions.httpsCallable('toggleAiSystem').call({'enabled': enabled});
  }

  /// Phase 3-7: Live Health Diagnostics
  static Future<Map<String, dynamic>> getLiveSystemHealth() async {
    final start = DateTime.now().millisecondsSinceEpoch;
    final Map<String, dynamic> health = {
      'providers': {},
      'services': {
        'auth': 'OFFLINE',
        'firestore': 'OFFLINE',
        'functions': 'OFFLINE',
      },
      'latency': {},
    };

    // Phase 3: Auth Health
    if (FirebaseAuth.instance.currentUser != null) {
      health['services']['auth'] = 'ONLINE';
    }

    // Phase 4: Firestore Health + Latency
    try {
      final fStart = DateTime.now().millisecondsSinceEpoch;
      await _firestore.collection('system_config').doc('global').get(const GetOptions(source: Source.server));
      health['services']['firestore'] = 'ONLINE';
      health['latency']['firestore'] = '${DateTime.now().millisecondsSinceEpoch - fStart}ms';
    } catch (e) {
      health['services']['firestore'] = 'ERROR';
    }

    // Phase 5: Cloud Functions Health
    try {
      final result = await _functions.httpsCallable('getSystemHealth').call();
      final data = Map<String, dynamic>.from(result.data);
      health['services']['functions'] = 'ONLINE';
      health['providers'] = data['providers'] ?? {};
      
      // Merge other service details from backend if any
      if (data['services'] != null) {
        final backendServices = data['services'] as Map;
        backendServices.forEach((key, value) {
          if (health['services'][key] == null || health['services'][key] == 'OFFLINE') {
            health['services'][key] = value.toString().toUpperCase();
          }
        });
      }
    } catch (e) {
      health['services']['functions'] = 'OFFLINE';
    }

    health['timestamp'] = DateTime.now().toIso8601String();
    health['latency']['total'] = '${DateTime.now().millisecondsSinceEpoch - start}ms';

    return health;
  }

  /// Phase 7: Gemini Direct Ping (Sovereign Verification)
  static Future<Map<String, dynamic>> pingGemini() async {
    final start = DateTime.now().millisecondsSinceEpoch;
    try {
      // Calling a lightweight function that specifically pings Gemini
      final result = await _functions.httpsCallable('processAITask').call({
        'provider': 'gemini',
        'taskType': 'health_ping',
        'payload': {'prompt': 'ping'}
      });
      
      return {
        'status': 'ONLINE',
        'latency': '${DateTime.now().millisecondsSinceEpoch - start}ms',
        'details': result.data
      };
    } catch (e) {
      return {
        'status': 'OFFLINE',
        'error': e.toString(),
        'latency': '${DateTime.now().millisecondsSinceEpoch - start}ms'
      };
    }
  }

  static Future<Map<String, dynamic>> getSystemHealth() async => getLiveSystemHealth();

  static Stream<List<Map<String, dynamic>>> streamDeadLetterQueue() {
    return _firestore
        .collection('ai_failed_tasks')
        .orderBy('timestamp', descending: true)
        .limit(20)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => doc.data()).toList());
  }

  static Stream<List<Map<String, dynamic>>> streamRecentBenchmarks() {
    return _firestore
        .collection('benchmarks')
        .orderBy('timestamp', descending: true)
        .limit(10)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => doc.data()).toList());
  }
}
