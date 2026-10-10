import 'package:flutter/foundation.dart';

/// TRUTH VALIDATION SERVICE (v2 Hardened)
/// Implements Phase 10 & 11: The Constitutional Truth Layer.
/// Operates with Canonical Entity Registry and Cross-Verification.
class TruthValidationService {
  
  // CANONICAL ENTITY REGISTRY (v2)
  // Physical list of sovereign entities to prevent spelling conflicts.
  static const Map<String, List<String>> _canonicalRegistry = {
    'Lala Lajpat Rai': ['Lala Lajpat Roy', 'Lajpat Rai', 'L.L. Rai'],
    'Mahatma Gandhi': ['M.K. Gandhi', 'Mohandas Gandhi', 'Bapu'],
    'Jawaharlal Nehru': ['Pt. Nehru', 'J.L. Nehru'],
  };

  /// VALIDATE KNOWLEDGE ATOM
  static Future<Map<String, dynamic>> validate(String text, {String? contextId}) async {
    debugPrint("TRUTH LAYER: Executing structural and entity validation.");

    // 1. ENTITY CROSS-VERIFICATION (Step 4 Upgrade)
    final entityConflicts = _verifyEntities(text);
    
    // 2. TEMPORAL LOGIC VALIDATION
    final temporalConflicts = _verifyTimeline(text);

    // 3. FACTUAL CONSISTENCY CHECK (Phase 11 Upgrade) 
    // Checks for known factual impossibilities (Hallucination Detection).
    final factConflicts = _verifyFactIntegrity(text);
    
    final allConflicts = [...entityConflicts, ...temporalConflicts, ...factConflicts];

    // 4. DYNAMIC CONFIDENCE SCORING
    final double confidence = _calculateConfidence(text, allConflicts);

    // 4. HUMAN AUTHORITY GATE
    String action = 'escalate';
    if (confidence > 0.92 && allConflicts.isEmpty) {
      action = 'recommend_approval'; 
    } else if (confidence < 0.35) {
      action = 'recommend_rejection';
    }

    return {
      'confidence': confidence,
      'conflicts': allConflicts,
      'recommendedAction': action,
      'validatedAt': DateTime.now().millisecondsSinceEpoch,
      'registry_applied': true,
    };
  }

  /// INTERNAL: ENTITY REGISTRY CHECK
  static List<String> _verifyEntities(String text) {
    final List<String> conflicts = [];
    
    _canonicalRegistry.forEach((canonical, variants) {
      bool foundCanonical = text.contains(canonical);
      for (var variant in variants) {
        if (text.contains(variant) && !foundCanonical) {
          conflicts.add("Entity Conflict: Found non-canonical variant '$variant'. Suggested: '$canonical'");
        }
      }
    });

    return conflicts;
  }

  /// INTERNAL: TIMELINE VALIDATION
  static List<String> _verifyTimeline(String text) {
    final List<String> conflicts = [];
    final yearRegex = RegExp(r'\b(1[0-7][0-9]{2}|2[1-9][0-9]{2})\b');
    
    if (yearRegex.hasMatch(text)) {
      conflicts.add("Temporal Conflict: Mention of out-of-bounds year detected in historical context.");
    }
    return conflicts;
  }

  /// INTERNAL: FACT INTEGRITY (Hallucination Detection)
  static List<String> _verifyFactIntegrity(String text) {
    final List<String> conflicts = [];
    
    // Example: Physical impossibility checks
    if (text.contains("became PM") && text.contains("1948")) {
      // Historical PM Truth check
      if (!text.contains("Jawaharlal Nehru")) {
        conflicts.add("Factual Conflict: Possible hallucination of 1948 Prime Minister.");
      }
    }

    if (text.contains("fundamental right") && text.contains("Article 320")) {
      conflicts.add("Factual Conflict: Article 320 is not a Fundamental Right.");
    }

    return conflicts;
  }

  /// INTERNAL: CONFIDENCE SCORING ENGINE
  static double _calculateConfidence(String text, List<String> conflicts) {
    double score = 1.0;
    score -= (conflicts.length * 0.25); // Heavier penalty for registry conflicts
    if (text.length < 150) score -= 0.1;
    return score.clamp(0.0, 1.0);
  }
}
