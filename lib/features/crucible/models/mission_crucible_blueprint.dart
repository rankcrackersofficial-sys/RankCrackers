import 'package:equatable/equatable.dart';

/// SMART ENTRY BLUEPRINT
/// Governs domain topology and item parameters for mission-specific diagnostic entry.
class SmartEntryBlueprint extends Equatable {
  final List<String> domainIds; // e.g. ['physics', 'chemistry', 'mathematics']
  final int calibrationItemsPerDomain; // e.g. 5
  final int maxAdaptiveTargetItems; // e.g. 10
  final int maxTotalQuestions; // e.g. 25
  final int durationMinutes; // e.g. 60
  final double confidenceThreshold; // e.g. 0.85

  const SmartEntryBlueprint({
    required this.domainIds,
    required this.calibrationItemsPerDomain,
    required this.maxAdaptiveTargetItems,
    required this.maxTotalQuestions,
    required this.durationMinutes,
    this.confidenceThreshold = 0.85,
  });

  int get totalCalibrationCount => domainIds.length * calibrationItemsPerDomain;

  @override
  List<Object?> get props => [
        domainIds,
        calibrationItemsPerDomain,
        maxAdaptiveTargetItems,
        maxTotalQuestions,
        durationMinutes,
        confidenceThreshold,
      ];
}

/// MICRO POLICY
/// Governs Micro test parameters for a specific mission profile.
class MicroPolicy extends Equatable {
  final int attemptQuestionCount; // e.g. 25 for JEE Main 2027
  final int attemptDurationMinutes; // e.g. 60
  final int minimumVerifiedBankDepth; // e.g. 50
  final double currentScheduleShareMin; // e.g. 0.70
  final double currentScheduleShareMax; // e.g. 0.85
  final double spacedRetrievalShareMin; // e.g. 0.15
  final double spacedRetrievalShareMax; // e.g. 0.30

  const MicroPolicy({
    required this.attemptQuestionCount,
    required this.attemptDurationMinutes,
    required this.minimumVerifiedBankDepth,
    this.currentScheduleShareMin = 0.70,
    this.currentScheduleShareMax = 0.85,
    this.spacedRetrievalShareMin = 0.15,
    this.spacedRetrievalShareMax = 0.30,
  });

  @override
  List<Object?> get props => [
        attemptQuestionCount,
        attemptDurationMinutes,
        minimumVerifiedBankDepth,
        currentScheduleShareMin,
        currentScheduleShareMax,
        spacedRetrievalShareMin,
        spacedRetrievalShareMax,
      ];
}

/// MACRO POLICY
/// Governs Macro test parameters for a specific mission profile.
class MacroPolicy extends Equatable {
  final int attemptQuestionCount; // e.g. 50 for JEE Main 2027
  final int attemptDurationMinutes; // e.g. 120
  final int minimumVerifiedPhaseBankDepth; // e.g. 100
  final int schedulesIntegrated; // e.g. 6

  const MacroPolicy({
    required this.attemptQuestionCount,
    required this.attemptDurationMinutes,
    required this.minimumVerifiedPhaseBankDepth,
    this.schedulesIntegrated = 6,
  });

  @override
  List<Object?> get props => [
        attemptQuestionCount,
        attemptDurationMinutes,
        minimumVerifiedPhaseBankDepth,
        schedulesIntegrated,
      ];
}

/// MISSION CRUCIBLE BLUEPRINT
/// Canonical blueprint defining training topology, cadence, and policies for a specific mission.
class MissionCrucibleBlueprint extends Equatable {
  final String missionId; // Canonical internal mission: e.g. 'jee_main_2026'
  final String
      recruitmentId; // Student-visible cohort projection: e.g. 'jee_main_2027'
  final String blueprintVersion;
  final int cycleLengthDays; // e.g. 98 for JEE Main 2027
  final int phaseCount; // e.g. 7
  final int schedulesPerPhase; // e.g. 6
  final int hoursPerSchedule; // e.g. 48
  final int learningHoursPerSchedule; // e.g. 47
  final int microHoursPerSchedule; // e.g. 1
  final int rebuildDurationHours; // e.g. 23
  final int macroDurationHours; // e.g. 2
  final int recoveryDurationHours; // e.g. 23
  final SmartEntryBlueprint smartEntryBlueprint;
  final MicroPolicy microPolicy;
  final MacroPolicy macroPolicy;

  const MissionCrucibleBlueprint({
    required this.missionId,
    required this.recruitmentId,
    required this.blueprintVersion,
    required this.cycleLengthDays,
    required this.phaseCount,
    required this.schedulesPerPhase,
    required this.hoursPerSchedule,
    required this.learningHoursPerSchedule,
    required this.microHoursPerSchedule,
    required this.rebuildDurationHours,
    required this.macroDurationHours,
    required this.recoveryDurationHours,
    required this.smartEntryBlueprint,
    required this.microPolicy,
    required this.macroPolicy,
  });

  int get totalSchedules => phaseCount * schedulesPerPhase;

  /// Canonical Founder-approved profile for JEE Main (Internal: jee_main_2026, Projection: jee_main_2027).
  static const MissionCrucibleBlueprint jeeMain2027Blueprint =
      MissionCrucibleBlueprint(
    missionId: 'jee_main_2026',
    recruitmentId: 'jee_main_2027',
    blueprintVersion: '2027.3-98DAY-CONTINUOUS-RING-CONSTITUTION',
    cycleLengthDays:
        98, // Continuous 98-Day Ring Constitution: 42 Micro Schedules (84 days) + 7 Rebuilds (7 days) + 7 Macros (7 days)
    phaseCount: 7,
    schedulesPerPhase: 6,
    hoursPerSchedule: 48,
    learningHoursPerSchedule: 47,
    microHoursPerSchedule: 1,
    rebuildDurationHours: 24, // Exact 1 calendar day (24h)
    macroDurationHours: 2, // 120 minutes assessment
    recoveryDurationHours:
        22, // 22h non-exclusive post-test buffer (2h + 22h = 24h calendar day)
    smartEntryBlueprint: SmartEntryBlueprint(
      domainIds: ['physics', 'chemistry', 'mathematics'],
      calibrationItemsPerDomain: 5,
      maxAdaptiveTargetItems: 10,
      maxTotalQuestions: 25,
      durationMinutes: 60,
      confidenceThreshold: 0.85,
    ),
    microPolicy: MicroPolicy(
      attemptQuestionCount: 25,
      attemptDurationMinutes: 60,
      minimumVerifiedBankDepth: 50,
      currentScheduleShareMin: 0.70,
      currentScheduleShareMax: 0.85,
      spacedRetrievalShareMin: 0.15,
      spacedRetrievalShareMax: 0.30,
    ),
    macroPolicy: MacroPolicy(
      attemptQuestionCount: 50,
      attemptDurationMinutes: 120,
      minimumVerifiedPhaseBankDepth: 100,
      schedulesIntegrated: 6,
    ),
  );

  /// SSC CGL 2026 source-bound Endless Circle profile.
  /// The 10:00 IST clock is resolved by the runtime protocol; this blueprint
  /// only carries the mission-specific cadence and assessment policies.
  static const MissionCrucibleBlueprint sscCgl2026Blueprint =
      MissionCrucibleBlueprint(
    missionId: 'ssc_cgl',
    recruitmentId: 'ssc_cgl',
    blueprintVersion: 'ssc-cgl-2026-endless-circle-v1',
    cycleLengthDays: 98,
    phaseCount: 7,
    schedulesPerPhase: 6,
    hoursPerSchedule: 48,
    learningHoursPerSchedule: 47,
    microHoursPerSchedule: 1,
    rebuildDurationHours: 46,
    macroDurationHours: 2,
    recoveryDurationHours: 0,
    smartEntryBlueprint: SmartEntryBlueprint(
      domainIds: [
        'quantitative_aptitude',
        'reasoning',
        'general_awareness',
        'english'
      ],
      calibrationItemsPerDomain: 5,
      maxAdaptiveTargetItems: 10,
      maxTotalQuestions: 20,
      durationMinutes: 60,
      confidenceThreshold: 0.85,
    ),
    microPolicy: MicroPolicy(
      attemptQuestionCount: 20,
      attemptDurationMinutes: 60,
      minimumVerifiedBankDepth: 40,
      currentScheduleShareMin: 0.70,
      currentScheduleShareMax: 0.85,
      spacedRetrievalShareMin: 0.15,
      spacedRetrievalShareMax: 0.30,
    ),
    macroPolicy: MacroPolicy(
      attemptQuestionCount: 50,
      attemptDurationMinutes: 60,
      minimumVerifiedPhaseBankDepth: 100,
      schedulesIntegrated: 6,
    ),
  );

  @override
  List<Object?> get props => [
        missionId,
        recruitmentId,
        blueprintVersion,
        cycleLengthDays,
        phaseCount,
        schedulesPerPhase,
        hoursPerSchedule,
        learningHoursPerSchedule,
        microHoursPerSchedule,
        rebuildDurationHours,
        macroDurationHours,
        recoveryDurationHours,
        smartEntryBlueprint,
        microPolicy,
        macroPolicy,
      ];
}

/// MISSION CRUCIBLE BLUEPRINT REGISTRY
/// Resolves mission-specific blueprints without silent fallback to JEE Main.
class MissionCrucibleBlueprintRegistry {
  static final Map<String, MissionCrucibleBlueprint> _registry = {
    'jee_main': MissionCrucibleBlueprint.jeeMain2027Blueprint,
    'jee_main_2026': MissionCrucibleBlueprint.jeeMain2027Blueprint,
    'jee_main_2027': MissionCrucibleBlueprint.jeeMain2027Blueprint,
    'ssc_cgl': MissionCrucibleBlueprint.sscCgl2026Blueprint,
    'ssc_cgl_2026': MissionCrucibleBlueprint.sscCgl2026Blueprint,
  };

  /// Resolves the blueprint for a given mission ID.
  /// Returns null if not configured (FAIL-CLOSED: JEE_PROFILE_FALLBACK_TO_OTHER_MISSIONS = 0).
  static MissionCrucibleBlueprint? getBlueprint(String missionId) {
    final cleanId = missionId.toLowerCase().trim();
    for (final entry in _registry.entries) {
      if (cleanId.contains(entry.key)) {
        return entry.value;
      }
    }
    return null; // Fail-closed: unconfigured mission profile
  }

  /// Registers or overrides a blueprint for testing or new mission onboarding.
  static void registerBlueprint(
      String missionId, MissionCrucibleBlueprint blueprint) {
    _registry[missionId.toLowerCase().trim()] = blueprint;
  }
}
