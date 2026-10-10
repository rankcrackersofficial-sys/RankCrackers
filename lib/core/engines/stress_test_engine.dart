import 'dart:math';
import '../models/micro_topic_node.dart';
import '../models/recruitment.dart';
import '../models/exam_blueprint.dart';

/// STRESS TEST ENGINE
/// Implements Phase 6.2: Physical stress testing for scaling validation.
class StressTestEngine {
  
  /// GENERATES CONFIGURABLE DATASET
  static Map<String, dynamic> generateDataset({
    required int nodeCount,
    required int atomsPerNode,
    String missionId = 'stress_mission',
  }) {
    final List<MicroTopicNode> nodes = [];
    final Random random = Random();

    for (int i = 0; i < nodeCount; i++) {
      final List<String> atoms = List.generate(atomsPerNode, (j) => 'atom_${i}_$j');
      
      nodes.add(MicroTopicNode(
        id: 'node_stress_$i',
        examId: missionId,
        subjectId: 'subject_${i % 5}',
        chapterId: 'chapter_${i % 50}',
        title: 'Stress Topic $i',
        titleHindi: 'तनाव विषय $i',
        subjectHindi: 'विषय ${i % 5}',
        chapterHindi: 'अध्याय ${i % 50}',
        description: 'Automated stress test node for performance profiling.',
        contentRegistryId: 'payload_stress_$i',
        atomicTopicIds: atoms,
        factCount: atomsPerNode,
        difficulty: random.nextInt(3) + 1,
        importance: random.nextInt(5) + 1,
        status: 'published',
      ));
    }

    final recruitment = Recruitment(
      id: 'rec_$missionId',
      recruitmentGroupId: 'stress_group',
      boardId: 'StressBoard',
      examId: missionId,
      examBlueprintId: 'bp_$missionId',
      title: 'Stress Mission $nodeCount',
      titleHindi: 'तनाव मिशन $nodeCount',
      year: 2026,
      state: 'Central',
      examCategory: 'competitive',
      status: 'published',
    );

    final blueprint = ExamBlueprint(
      id: 'bp_$missionId',
      recruitmentId: 'rec_$missionId',
      subjects: List.generate(5, (i) => SubjectSpec(
        subjectId: 'subject_$i', 
        title: 'Subject $i', 
        paperIndex: 1, 
        marksWeight: 200, 
        questionCount: 200
      )),
      negativeMarking: 0.33,
      marksPerQuestion: 1.0,
      totalMarks: 1000.0,
      durationMinutes: 180,
      status: 'published',
    );

    return {
      'recruitment': recruitment,
      'blueprint': blueprint,
      'nodes': nodes,
    };
  }

  // Legacy support
  static Map<String, dynamic> generateStressDataset() {
    return generateDataset(nodeCount: 1000, atomsPerNode: 10);
  }
}
