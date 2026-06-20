/// 🔱 NOTIFICATION KNOWLEDGE GRAPH (v1.0)
class NotificationKnowledgeGraph {
  final List<String> linkedSyllabusTopics;
  final List<String> linkedAtomicTopics;
  final List<String> linkedPYQTopics;
  final List<String> linkedRules;

  NotificationKnowledgeGraph({
    this.linkedSyllabusTopics = const [],
    this.linkedAtomicTopics = const [],
    this.linkedPYQTopics = const [],
    this.linkedRules = const [],
  });

  Map<String, dynamic> toMap() => {
    'linked_syllabus_topics': linkedSyllabusTopics,
    'linked_atomic_topics': linkedAtomicTopics,
    'linked_pyq_topics': linkedPYQTopics,
    'linked_rules': linkedRules,
  };

  factory NotificationKnowledgeGraph.fromMap(Map<String, dynamic> map) => NotificationKnowledgeGraph(
    linkedSyllabusTopics: List<String>.from(map['linked_syllabus_topics'] ?? []),
    linkedAtomicTopics: List<String>.from(map['linked_atomic_topics'] ?? []),
    linkedPYQTopics: List<String>.from(map['linked_pyq_topics'] ?? []),
    linkedRules: List<String>.from(map['linked_rules'] ?? []),
  );
}
