class KnowledgeLink {
  final String sourceNode;
  final String targetNode;
  final double strength;

  const KnowledgeLink({
    required this.sourceNode,
    required this.targetNode,
    required this.strength,
  });
}
