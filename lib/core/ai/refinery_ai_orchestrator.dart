import 'package:flutter/foundation.dart';
import '../services/ai_gateway_service.dart';
import 'models/ai_provider.dart';
import 'local_repair_engine.dart';

/// REFINERY AI ORCHESTRATOR (v4 Physical Failover)
/// Central authority for all AI task execution with a strict Gemini + Local fallback.
class RefineryAIOrchestrator {
  
  /// EXECUTE TASK WITH PHYSICAL FAILOVER
  /// Returns a Map containing 'result' and 'provider'.
  static Future<Map<String, dynamic>> execute({
    required String taskType,
    required Map<String, dynamic> payload,
  }) async {
    // Shifted to Gemini only for Cloud API
    final List<AIProvider> failoverChain = [
      AIProvider.geminiFlash,
      AIProvider.local,
    ];

    for (final provider in failoverChain) {
      try {
        Map<String, dynamic> result;

        // Step 1: On-Device Emergency Route
        if (provider == AIProvider.local) {
          if (taskType == 'canonical_repair') {
            result = await LocalRepairEngine.repair(text: payload['text'] ?? '');
          } else {
            throw Exception("Local processing not supported for $taskType");
          }
        } else {
          // Step 2: Cloud Proxy Route (Gemini Only)
          debugPrint("REFINERY AI: Attempting $taskType via ${provider.name}");
          result = await AIGatewayService.execute(
            taskType: taskType,
            provider: provider.name,
            payload: payload,
          );
        }

        return {
          'result': result,
          'provider': provider.name,
        };

      } catch (e) {
        debugPrint("REFINERY AI WARNING: ${provider.name} failed. Moving to next provider.");
        continue; 
      }
    }

    return {
      'status': 'error',
      'error_code': 'FAILOVER_EXHAUSTED',
      'provider': 'none',
    };
  }

  /// SPECIALIZED: REPAIR ORCHESTRATION
  static Future<Map<String, dynamic>> repair({
    required String sourceId,
    required String text,
    required String systemPrompt,
  }) async {
    return await execute(
      taskType: 'canonical_repair',
      payload: {
        'sourceId': sourceId,
        'text': text,
        'systemPrompt': systemPrompt,
      },
    );
  }
}
