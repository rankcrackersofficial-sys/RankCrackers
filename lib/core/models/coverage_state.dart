class CoverageState {
  final String examId;
  final String? variantId;

  final int totalNodes;
  final int completedNodes;
  final int masteredNodes;
  final int weakNodes;

  final double coveragePercent;

  final List<String> uncoveredNodeIds;
  final List<String> weakNodeIds;

  const CoverageState({
    required this.examId,
    this.variantId,
    required this.totalNodes,
    required this.completedNodes,
    required this.masteredNodes,
    required this.weakNodes,
    required this.coveragePercent,
    required this.uncoveredNodeIds,
    required this.weakNodeIds,
  });
}