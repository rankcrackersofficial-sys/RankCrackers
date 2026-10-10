import 'package:flutter/foundation.dart';
import '../../features/crucible/models/crucible_node.dart';

/// CRUCIBLE COVERAGE ENGINE (Audit GAP-H5)
/// Measures diversity, distribution, and density of assessments.
class CrucibleCoverageEngine {
  
  static Map<String, dynamic> measureCluster(List<CrucibleNode> nodes) {
    if (nodes.isEmpty) return {'coverage': 0.0, 'isValid': false};

    final types = nodes.map((e) => e.nodeType).toSet();
    final difficulties = nodes.map((e) => e.difficulty).toList();
    final pyqCount = nodes.where((e) => e.pyqIds.isNotEmpty).length;

    // Diversity Score: How many different types of nodes?
    // Requirement: MCQ, ASSERTION_REASON, CONCEPT_TRAP, REVISION, DIAGNOSTIC
    double diversity = (types.length / 5.0) * 100;

    // Difficulty Balance: Average difficulty target ~3
    double avgDifficulty = difficulties.isEmpty ? 0 : difficulties.reduce((a, b) => a + b) / difficulties.length;
    double balance = (1.0 - (avgDifficulty - 3.0).abs() / 2.0).clamp(0.0, 1.0) * 100;

    // PYQ Density
    double density = (pyqCount / nodes.length) * 100;

    return {
      'coverage': 100.0, // Cluster exists
      'node_diversity': diversity,
      'difficulty_balance': balance,
      'pyq_density': density,
      'isValid': diversity >= 60 && density > 0,
    };
  }
}
