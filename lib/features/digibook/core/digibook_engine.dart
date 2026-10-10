import '../../crucible/models/tactical_schedule.dart';
import '../models/digibook_session.dart';
import '../models/digibook_content.dart';

/// DIGIBOOK ENGINE (Document 28 Compliant)
/// Sovereign authority for mission-specific learning knowledge.
/// Implements the "One Level Up Law" and Atomic Topic Mapping.
class DigiBookEngine {
  
  // ===================================================
  // SESSION BUILDER 
  // ===================================================

  /// Orchestrates the generation of a mission-specific study session.
  static DigiBookSession build({
    required TacticalSchedule schedule,
    required Map<String, DigiBookContent> contentMap, // Decoupled
  }) {
    int estimatedMinutes = 0;

    for (final node in schedule.nodes) {
      final payload = contentMap[node.id];
      if (payload == null) continue;

      // CONTENT-WEIGHTED TIME LAW
      estimatedMinutes += (payload.beginnerContent.length ~/ 150) +
          (payload.intermediateContent.length ~/ 130) +
          (payload.proContent.length ~/ 110) +
          (payload.revisionPoints.length * 2) +
          (payload.oneLiners.length * 1) +
          (payload.facts.length * 3); 
    }

    return DigiBookSession(
      title: 'TACTICAL SESSION ${schedule.scheduleIndex + 1}',
      nodes: schedule.nodes,
      payloads: contentMap.values.toList(), // Simplified
      estimatedMinutes: estimatedMinutes,
    );
  }

  // ===================================================
  // ONE LEVEL UP LAW 
  // ===================================================

  /// Determines the appropriate content depth based on the recruitment target.
  /// Implements Document 28 Sections 28-35.
  static String determineContentDepth(String recruitmentId) {
    final id = recruitmentId.toLowerCase();
    
    // Elevation Mapping
    if (id.contains('reet')) return 'intermediate'; // REET -> 2nd Grade equivalent
    if (id.contains('2nd_grade')) return 'pro';      // 2nd Grade -> 1st Grade equivalent
    if (id.contains('1st_grade') || id.contains('school_lecturer')) return 'academic'; // 1st Grade -> Professor
    
    return 'beginner'; // Minimum entry level
  }

  // ===================================================
  // ATOMIC METRICS 
  // ===================================================

  /// Aggregates total MCQs across all difficulty layers in the session.
  static int totalMcqs(List<DigiBookContent> payloads) {
    return payloads.fold(0, (sum, payload) => 
      sum + payload.easyMcqs.length + payload.mediumMcqs.length + payload.hardMcqs.length);
  }

  /// Aggregates total original verified PYQs linked to the topics.
  static int totalPyqs(List<DigiBookContent> payloads) {
    return payloads.fold(0, (sum, payload) => sum + payload.pyqs.length);
  }

  /// Counts the total Knowledge Atoms (Facts) in the current session.
  static int totalAtomicFacts(List<DigiBookContent> payloads) {
    return payloads.fold(0, (sum, payload) => sum + payload.facts.length);
  }
}
