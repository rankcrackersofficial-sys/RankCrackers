import 'package:flutter/foundation.dart';

/// COVERAGE VALIDATION ENGINE (Audit GAP-3)
/// Ensures every Atomic Topic in a Syllabus has a corresponding DigiBook Unit.
class CoverageValidationEngine {
  
  static Map<String, dynamic> validate({
    required List<String> atomicTopicIds,
    required List<String> digibookUnitTopicIds,
  }) {
    debugPrint("COVERAGE ENGINE: Validating ${atomicTopicIds.length} atomic topics against ${digibookUnitTopicIds.length} units...");

    final Set<String> atomicSet = Set.from(atomicTopicIds);
    final Set<String> unitSet = Set.from(digibookUnitTopicIds);

    final missing = atomicSet.difference(unitSet).toList();
    final matchedCount = atomicSet.intersection(unitSet).length;
    final double coverage = atomicSet.isEmpty ? 0 : (matchedCount / atomicSet.length) * 100;

    return {
      'total_atomic_topics': atomicTopicIds.length,
      'total_digibook_units': digibookUnitTopicIds.length,
      'matched_count': matchedCount,
      'coverage_percentage': coverage,
      'missing_topic_ids': missing,
      'isValid': missing.isEmpty && atomicTopicIds.isNotEmpty,
    };
  }
}
