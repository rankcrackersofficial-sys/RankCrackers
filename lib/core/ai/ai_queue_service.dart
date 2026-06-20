import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:path/path.dart' as p;
import 'models/ai_task_type.dart';
import 'ai_provider_config.dart';
import 'cache_first_engine.dart';
import 'token_control_engine.dart';
import 'workers/duplicate_detection_worker.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

/// 🔱 GLOBAL KEY FOR EMERGENCY ALERTS
final GlobalKey<ScaffoldMessengerState> aiQueueMessengerKey = GlobalKey<ScaffoldMessengerState>();

class AIQueueService {
  // ===================================================
  // PUSH TASK
  // ===================================================
  static Future<void> push({
    required AITaskType type,
    required Map<String, dynamic> payload,
  }) async {
    try {
      debugPrint('🔱 QUEUE: Pushing task type ${type.name}');
      final taskId = payload['id'] ?? 'task_${DateTime.now().millisecondsSinceEpoch}';
      debugPrint('🔱 QUEUE: Resolved Task ID: $taskId');

      // Auto File Type Detection (Audit Patch)
      if (payload['fileType'] == null && payload['fileName'] != null) {
        payload['fileType'] = p.extension(payload['fileName']).replaceFirst('.', '').toLowerCase();
      }

      // 1. DUPLICATE QUEUE PROTECTION
      final existingQueue = await FirebaseFirestore.instance
          .collection('ai_queue')
          .doc(taskId)
          .get();

      if (existingQueue.exists) {
        final existingStatus = existingQueue.data()?['status'];
        debugPrint('🔱 QUEUE: Existing task found with status: $existingStatus');
        
        await FirebaseFirestore.instance.collection('ai_queue').doc(taskId).update({
          'status': 'received',
          'updatedAt': FieldValue.serverTimestamp(),
          'manualTrigger': true,
        });
        return;
      }

      // 2. CACHE CHECK
      final cached = await CacheFirstEngine.exists(taskId);
      if (cached) {
        debugPrint('🔱 QUEUE: Cache Hit for $taskId. Skipping injection.');
        _showDebugNotice('CACHE HIT: Task already processed.');
        return;
      }

      // 3. PROVIDER SELECTION
      final provider = AIProviderConfig.provider(type);
      debugPrint('🔱 QUEUE: Selected Provider: ${provider.name}');

      // 4. TOKEN CHECK
      if (!TokenControlEngine.canExecute(provider.name)) {
        debugPrint('🔱 QUEUE: Token Limit reached for ${provider.name}');
        _showDebugNotice('TOKEN LIMIT: Provider ${provider.name} exhausted.');
        return;
      }

      // 5. PUSH TO CLOUD QUEUE
      debugPrint('🔱 QUEUE: Attempting direct injection...');
      await FirebaseFirestore.instance.collection('ai_queue').doc(taskId).set({
        'type': type.name,
        'provider': provider.name,
        'payload': payload,
        'status': 'received',
        'createdAt': FieldValue.serverTimestamp(),
        'manualTrigger': true,
      });
      debugPrint('🔱 QUEUE: Task $taskId successfully injected directly.');
      _showDebugNotice('SUCCESS: Task added to queue.', isError: false);

    } catch (e) {
      debugPrint('🔥 QUEUE CRITICAL ERROR: $e');
      _showDebugNotice('QUEUE ERROR: $e', isError: true);
      rethrow;
    }
  }

  static void _showDebugNotice(String message, {bool isError = true}) {
    if (aiQueueMessengerKey.currentState != null) {
      aiQueueMessengerKey.currentState!.showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: isError ? Colors.redAccent : Colors.greenAccent,
          duration: const Duration(seconds: 5),
        ),
      );
    }
  }
}
