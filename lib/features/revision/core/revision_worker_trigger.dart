import '../../../core/ai/ai_queue_service.dart';
import '../../../core/ai/models/ai_task_type.dart';

class RevisionWorkerTrigger {
  // ===================================================
  // GENERATE REVISION 🔱
  // ===================================================
  static Future<void> generate({
    required String nodeId,
    required String topic,
  }) async {
    await AIQueueService.push(
      type: AITaskType.revision,
      payload: {
        'id': nodeId,
        'topic': topic,
      },
    );
  }
}
