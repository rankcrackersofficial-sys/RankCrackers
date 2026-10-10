import '../../../core/models/micro_topic_node.dart';
import '../../../core/models/exam_blueprint.dart';
import '../../../core/utils/notification_weight_util.dart';

/// IMPORTANCE ENGINE
/// Calculates the tactical priority of a topic within a specific mission.

class ImportanceEngine {
  static double calculate({
    required MicroTopicNode node,
    required ExamBlueprint spec,
  }) {
    // 1. Board Signal (40%) - Normalized Marks
    final subject = spec.subjects.firstWhere(
      (s) => s.subjectId == node.subjectId,
      orElse: () => const SubjectSpec(
        subjectId: 'unknown',
        title: 'Unknown',
        paperIndex: 0,
        marksWeight: 0.0,
        questionCount: 0,
      ),
    );

    final boardSignal = NotificationWeightUtil.normalize(
      subject.marksWeight,
      spec.totalMarks,
    );

    // 2. Battle Signal (30%) - PYQ Frequency
    // Normalizing frequency against a benchmark of 50 PYQs per topic max.
    final battleSignal = (node.pyqFrequency / 50.0).clamp(0.0, 1.0);

    // 3. Graph Signal (30%) - Difficulty (Higher difficulty = Higher cost)
    // We treat Difficulty as a proxy for "Structural Cost" in this phase.
    final graphSignal = (node.difficulty / 5.0).clamp(0.0, 1.0);

    // Final Unified Importance Score (0.0 to 10.0)
    return (boardSignal * 4.0) + (battleSignal * 3.0) + (graphSignal * 3.0);
  }
}
