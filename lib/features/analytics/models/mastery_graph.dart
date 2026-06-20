class MasteryNode {
  final String id;
  final String label;
  final double masteryValue;
  final List<String> connections;

  const MasteryNode({
    required this.id,
    required this.label,
    required this.masteryValue,
    this.connections = const [],
  });
}

class MasteryGraph {
  final String userId;
  final List<MasteryNode> nodes;

  const MasteryGraph({
    required this.userId,
    required this.nodes,
  });

  Map<String, double> get subjectMastery {
    // Logic to aggregate node mastery by subject category
    return {};
  }
}
