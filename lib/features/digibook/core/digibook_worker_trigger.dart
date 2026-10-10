import '../../../core/ai/ai_queue_service.dart';
import '../../../core/ai/models/ai_task_type.dart';

class DigiBookWorkerTrigger {
  // ===================================================
  // GENERATE DIGIBOOK 
  // ===================================================
  static Future<void> generate({
    required String nodeId,
    required String topic,
  }) async {
    await AIQueueService.push(
      type: AITaskType.digibook,
      payload: {
        'id': nodeId,
        'topic': topic,
      },
    );
  }
}
