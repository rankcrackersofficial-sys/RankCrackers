import '../models/node_runtime_state.dart';
import '../models/question_model.dart';
import '../../features/assessment/models/cognitive_profile.dart';
import '../../features/profile/data/models/user_profile_model.dart';
import '../../features/digibook/core/digibook_engine.dart';
import '../../features/digibook/models/digibook_content.dart';

/// 🔱 LEARNING STATE ENGINE
/// Manages the delivery layer and combat difficulty based on user progress.
class LearningStateEngine {
  // ===================================================
  // ADAPTIVE DELIVERY (DIGIBOOK) 🔱
  // ===================================================
  static String getRenderLayer({
    required DigiBookContent payload, // 🔱 Document 46A: Using payload
    required NodeRuntimeState state,
    required CognitiveProfile profile,
    required UserProfile user,
    required String recruitmentId,
  }) {
    // 1. ONE LEVEL UP LAW (Constitutional Depth) 🔱
    final String floorLevel = DigiBookEngine.determineContentDepth(recruitmentId);

    // 2. Warrior Tier Restriction
    if (!user.isElite) {
      return _getContentByLevel(payload, floorLevel);
    }

    // 3. Elite Tier Adaptive Logic
    double mastery = state.mastery;
    double depth = profile.conceptualDepth;

    if (mastery < 0.3 || depth < 0.4) {
      return _getContentByLevel(payload, floorLevel);
    } 
    
    // Dynamic escalation
    if (mastery > 0.8 && depth > 0.7) {
      if (floorLevel == 'pro') return payload.academicContent.isNotEmpty ? payload.academicContent : payload.proContent;
      if (floorLevel == 'intermediate') return payload.proContent;
    }

    return _getContentByLevel(payload, floorLevel);
  }

  static String _getContentByLevel(DigiBookContent payload, String level) {
    switch (level) {
      case 'intermediate':
        return payload.intermediateContent;
      case 'pro':
        return payload.proContent;
      case 'academic':
        return payload.academicContent.isNotEmpty ? payload.academicContent : payload.proContent;
      default:
        return payload.beginnerContent;
    }
  }

  static bool isLayerLocked(String targetLevel, UserProfile user) {
    if (targetLevel == 'beginner') return false;
    return !user.isElite;
  }

  // ===================================================
  // ADAPTIVE COMBAT (MCQ) 🔱
  // ===================================================
  static List<QuestionModel> getAdaptiveMcqs({
    required DigiBookContent payload, // 🔱 Decoupled
    required double currentMastery,
  }) {
    if (currentMastery < 0.4) {
      return payload.easyMcqs;
    } else if (currentMastery < 0.75) {
      return payload.mediumMcqs;
    } else {
      return payload.hardMcqs;
    }
  }

  // ===================================================
  // LEGACY COMPATIBILITY METHODS 🔱
  // ===================================================
  static bool needsBattle(NodeRuntimeState state) {
    return state.mastery < 0.6 || state.activeBattle;
  }

  static bool needsRevision(NodeRuntimeState state) {
    return state.mastery >= 0.6 && state.mastery < 0.85;
  }

  static bool mastered(NodeRuntimeState state) {
    return state.mastery >= 0.85;
  }
}
