import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

/// AI GATEWAY SERVICE
/// Implements Phase 11: Secure Server-Side AI Execution.
/// Replaces direct client-side Gemini calls to protect API keys.
class AIGatewayService {
  static final _functions = FirebaseFunctions.instance;

  /// SECURE EXECUTION
  /// Calls a Firebase Cloud Function which holds the sovereign API keys.
  static Future<Map<String, dynamic>> execute({
    required String taskType,
    required String provider,
    required Map<String, dynamic> payload,
  }) async {
    try {
      debugPrint("AI GATEWAY: Requesting $taskType via $provider (Secure Proxy)");
      
      // Authority: Call HTTPS Callable function
      final HttpsCallable callable = _functions.httpsCallable('processAITask');
      
      final result = await callable.call({
        'taskType': taskType,
        'provider': provider,
        'payload': payload,
      });

      return Map<String, dynamic>.from(result.data);
    } catch (e) {
      debugPrint("AI GATEWAY ERROR: Secure execution failed - $e");
      rethrow;
    }
  }
}
