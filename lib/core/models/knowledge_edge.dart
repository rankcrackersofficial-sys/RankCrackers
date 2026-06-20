enum KnowledgeRelationType {
  parent,
  child,
  dependency,
  sibling,
  associative,
}

class KnowledgeEdge {
  final String sourceNodeId;
  final String targetNodeId;

  final KnowledgeRelationType relationType;

  final double weight;

  const KnowledgeEdge({
    required this.sourceNodeId,
    required this.targetNodeId,
    required this.relationType,
    this.weight = 1.0,
  });

  KnowledgeEdge copyWith({
    String? sourceNodeId,
    String? targetNodeId,
    KnowledgeRelationType? relationType,
    double? weight,
  }) {
    return KnowledgeEdge(
      sourceNodeId: sourceNodeId ?? this.sourceNodeId,
      targetNodeId: targetNodeId ?? this.targetNodeId,
      relationType: relationType ?? this.relationType,
      weight: weight ?? this.weight,
    );
  }
}