import 'models/ai_provider.dart';
import 'models/ai_task_type.dart';

class AIProviderConfig {
  static AIProvider provider(AITaskType task) {
    // GEMINI SUPREMACY: All AI workers shifted to Gemini
    return AIProvider.geminiFlash;
  }
}
