import '../models/publish_eligibility_state.dart';
import '../models/recruitment.dart';
import '../models/exam_blueprint.dart';
import '../models/micro_topic_node.dart';
import '../models/question_model.dart';
import '../models/digibook_block.dart';

/// 🔱 PUBLISH ELIGIBILITY ENGINE
/// Sovereign authority for enforcing Mission Completeness (Document 26 Section 37).
class PublishEligibilityEngine {
  
  /// Validates if a mission is constitutionally ready for publication.
  static PublishEligibilityState validate({
    required Recruitment recruitment,
    required ExamBlueprint? blueprint,
    required List<MicroTopicNode> nodes,
    required List<DigiBookBlock> digiBookBlocks,
    required List<QuestionModel> questions,
  }) {
    final List<String> errors = [];

    // 1. Notification Reference (Section 32)
    final bool hasNotification = blueprint != null && blueprint.id == recruitment.examBlueprintId;
    if (!hasNotification) errors.add("Missing or mismatched Official Notification/Blueprint.");

    // 2. Atomic Syllabus (Section 33)
    final bool hasSyllabus = nodes.isNotEmpty;
    if (!hasSyllabus) errors.add("Mission Syllabus is empty.");

    // 3. DigiBook Support (Section 34)
    // Constitutional Rule: Every node must have at least one verified DigiBook block.
    final Set<String> nodesWithContent = digiBookBlocks.map((b) => b.atomicTopicId).toSet();
    bool allNodesCoveredByDigibook = true;
    for (var node in nodes) {
      if (!node.atomicTopicIds.any((id) => nodesWithContent.contains(id))) {
        allNodesCoveredByDigibook = false;
        break;
      }
    }
    final bool hasDigiBook = digiBookBlocks.isNotEmpty && allNodesCoveredByDigibook;
    if (!hasDigiBook) errors.add("Incomplete DigiBook coverage for syllabus topics.");

    // 4. Crucible Mapping (Section 35)
    // (Simplified: check if nodes exist as placeholders for protocol)
    final bool hasCrucible = nodes.every((n) => n.difficulty > 0 && n.importance > 0);
    if (!hasCrucible) errors.add("Incomplete Crucible prioritization metadata.");

    // 5. Assessment Configuration (Section 36)
    // Constitutional Rule: Every MicroTopic must have assessable questions.
    final Set<String> nodesWithQuestions = questions.map((q) => q.nodeId).toSet();
    final bool allNodesHaveQuestions = nodes.every((n) => nodesWithQuestions.contains(n.id));
    final bool hasAssessments = questions.isNotEmpty && allNodesHaveQuestions;
    if (!hasAssessments) errors.add("Incomplete Question Bank for Mission scope.");

    final bool isEligible = hasNotification && hasSyllabus && hasDigiBook && hasCrucible && hasAssessments;

    return PublishEligibilityState(
      isEligible: isEligible,
      hasNotification: hasNotification,
      hasSyllabus: hasSyllabus,
      hasDigiBook: hasDigiBook,
      hasCrucible: hasCrucible,
      hasAssessments: hasAssessments,
      errors: errors,
    );
  }
}
