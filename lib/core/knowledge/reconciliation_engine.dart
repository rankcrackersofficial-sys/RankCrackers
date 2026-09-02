import '../models/micro_topic_node.dart';
import '../../features/progress/data/models/user_progress.dart';

/**
 * 🔱 RECONCILIATION ENGINE
 * Detects orphans, stale projections, and consistency between factory and student realm.
 */
class ReconciliationEngine {

  /// 🛡️ DRY RUN RECONCILIATION
  /// Analyzes the alignment between nodes and student progress.
  static Map<String, dynamic> dryRun({
    required List<MicroTopicNode> activeNodes,
    required List<UserProgress> studentProgress,
  }) {
    final nodeIds = activeNodes.map((n) => n.id).toSet();
    final progressIds = studentProgress.map((p) => p.nodeId).toSet();

    // 1. Detect Orphans: Progress exists for a node not in current syllabus
    final orphans = progressIds.difference(nodeIds).toList();

    // 2. Detect Missing Projections: Node exists but no progress record (Awaiting First Touch)
    final missing = nodeIds.difference(progressIds).toList();

    // 3. Detect Stale Projections: Progress exists but version mismatch (Requires Factory Audit)
    // For now, we just count them if we had versioning in UserProgress
    final stale = <String>[];

    return {
      'timestamp': DateTime.now().toUtc().toIso8601String(),
      'status': 'AUDIT_COMPLETE',
      'metrics': {
        'totalNodes': nodeIds.length,
        'totalProgressRecords': progressIds.length,
        'orphanCount': orphans.length,
        'missingProjectionCount': missing.length,
        'staleCount': stale.length,
      },
      'orphans': orphans,
      'missing': missing,
    };
  }
}
