import '../models/recruitment.dart';
import '../models/exam_blueprint.dart';
import '../models/mission_context.dart';
import '../../features/crucible/models/crucible_protocol_state.dart';
import '../knowledge/knowledge_engine.dart';

/// 🔱 RECRUITMENT GATE ENGINE
/// Sovereign authority for managing the entry-gate to missions.
class RecruitmentGateEngine {
  // ===================================================
  // MISSION ACTIVATION 🔱
  // ===================================================

  /// Orchestrates the building of a complete Mission Context.
  static MissionContext buildContext({
    required Recruitment recruitment,
    required ExamBlueprint blueprint,
    required KnowledgeEngine knowledge,
  }) {
    if (knowledge.graph == null) {
      throw Exception("Knowledge Graph must be initialized before building MissionContext");
    }

    return MissionContext(
      recruitment: recruitment,
      blueprint: blueprint,
      graph: knowledge.graph!,
      states: knowledge.nodeStates,
      coverage: knowledge.coverageState!,
      risk: knowledge.riskState!,
      momentum: knowledge.momentumState!,
    );
  }

  /// Initializes a new 100-Day Protocol state for a mission.
  static CrucibleProtocolState initializeProtocol({
    required String recruitmentId,
    bool isVIP = false,
  }) {
    final now = DateTime.now();
    return CrucibleProtocolState(
      recruitmentId: recruitmentId,
      phaseIndex: 1,
      scheduleIndex: 1,
      currentScheduleId: 'sch_${recruitmentId}_1',
      status: 'study',
      scheduleStartTime: now,
      protocolStartTime: now,
      currentBoundaryTime: now.add(const Duration(hours: 48)), // Standard 2-day block
      isVIP: isVIP,
      isStalled: false,
      lastProgressAt: now,
    );
  }

  // ===================================================
  // VARIANT VALIDATION 🔱
  // ===================================================

  static bool validateVariant(Recruitment recruitment, String? userVariantCode) {
    if (recruitment.variantCode.isEmpty) return true;
    return recruitment.variantCode == userVariantCode;
  }
}
