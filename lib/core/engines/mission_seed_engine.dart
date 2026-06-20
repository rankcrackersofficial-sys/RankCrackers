import '../models/recruitment.dart';
import '../models/exam_blueprint.dart';
import '../models/micro_topic_node.dart';

/// 🔱 MISSION SEED ENGINE
/// Generates the "Golden Path" dataset for Phase 4C End-to-End Testing.
class MissionSeedEngine {
  
  // ===================================================
  // PUNJAB SCHOOL LECTURER (Competitive) 🔱
  // ===================================================
  
  static Map<String, dynamic> generatePunjabMathematics() {
    final recruitmentId = 'punjab_sl_math_24';
    final blueprintId = 'bp_punjab_sl_150';
    
    final recruitment = Recruitment(
      id: recruitmentId,
      recruitmentGroupId: 'punjab_edu',
      boardId: 'PSEB',
      examId: 'sl_math',
      examBlueprintId: blueprintId,
      title: 'Punjab School Lecturer (Mathematics)',
      titleHindi: 'पंजाब स्कूल लेक्चरर (गणित)',
      year: 2024,
      state: 'Punjab',
      examCategory: 'competitive',
      status: 'published',
    );

    final blueprint = ExamBlueprint(
      id: blueprintId,
      recruitmentId: recruitmentId,
      subjects: const [
        SubjectSpec(subjectId: 'math', title: 'Mathematics', paperIndex: 1, marksWeight: 150.0, questionCount: 150),
      ],
      negativeMarking: 0.33,
      marksPerQuestion: 1.0,
      totalMarks: 150.0,
      durationMinutes: 150,
      status: 'published',
    );

    final node = MicroTopicNode(
      id: 'node_punjab_set_theory',
      examId: 'sl_math',
      subjectId: 'math',
      chapterId: 'Set Theory',
      title: 'Sets and Functions',
      titleHindi: 'समुच्चय और फलन',
      subjectHindi: 'गणित',
      chapterHindi: 'समुच्चय सिद्धांत',
      description: 'Fundamental concepts of sets, subsets, and power sets.',
      contentRegistryId: 'payload_punjab_set_theory',
      atomicTopicIds: const ['atom_set_def', 'atom_venn'],
      factCount: 2,
      prerequisiteIds: const [],
      difficulty: 2,
      importance: 5,
      status: 'published',
    );

    return {
      'recruitment': recruitment,
      'blueprint': blueprint,
      'nodes': [node],
    };
  }

  // ===================================================
  // UGC NET (Qualifying) 🔱
  // ===================================================

  static Map<String, dynamic> generateUgcNetPaper1() {
    final recruitmentId = 'ugc_net_june_24';
    final blueprintId = 'bp_ugc_net_p1';

    final recruitment = Recruitment(
      id: recruitmentId,
      recruitmentGroupId: 'ugc_nta',
      boardId: 'NTA',
      examId: 'ugc_net',
      examBlueprintId: blueprintId,
      title: 'UGC NET June 2024',
      titleHindi: 'यूजीसी नेट जून 2024',
      year: 2024,
      state: 'central',
      examCategory: 'qualifying',
      status: 'published',
    );

    final blueprint = ExamBlueprint(
      id: blueprintId,
      recruitmentId: recruitmentId,
      subjects: const [
        SubjectSpec(subjectId: 'p1', title: 'Paper 1 (General)', paperIndex: 1, marksWeight: 100.0, questionCount: 50),
      ],
      negativeMarking: 0.0,
      marksPerQuestion: 2.0,
      totalMarks: 100.0,
      durationMinutes: 60,
      status: 'published',
    );

    final node = MicroTopicNode(
      id: 'node_ugc_communication',
      examId: 'ugc_net',
      subjectId: 'p1',
      chapterId: 'Communication',
      title: 'Types and Barriers',
      titleHindi: 'प्रकार और बाधाएं',
      subjectHindi: 'पेपर 1',
      chapterHindi: 'संप्रेषण',
      description: 'Understanding effective classroom communication.',
      contentRegistryId: 'payload_ugc_communication',
      atomicTopicIds: const ['atom_comm_types'],
      factCount: 1,
      prerequisiteIds: const [],
      difficulty: 3,
      importance: 4,
      status: 'published',
    );

    return {
      'recruitment': recruitment,
      'blueprint': blueprint,
      'nodes': [node],
    };
  }
}
