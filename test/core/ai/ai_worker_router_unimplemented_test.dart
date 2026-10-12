import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/core/ai/ai_worker_router.dart';
import 'package:rank_crackers/core/ai/models/ai_task_type.dart';

void main() {
  test('Unimplemented AI task routes never resolve as success', () async {
    for (final task in <AITaskType>[
      AITaskType.weakness,
      AITaskType.revision,
      AITaskType.battle,
      AITaskType.semanticDuplicate,
      AITaskType.chunking,
    ]) {
      await expectLater(
        AIWorkerRouter.route(task: task, payload: const {}),
        throwsA(isA<UnsupportedError>()),
        reason: 'Missing worker must not silently complete: ${task.name}',
      );
    }
  });
}
