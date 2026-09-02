import 'package:equatable/equatable.dart';
import '../../personalization/models/student_learning_level.dart';

/// STUDENT CRUCIBLE LEDGER
/// Sovereign individual completion and mastery ledger.
/// Operates independently of the continuously rotating mission clock.
class StudentCrucibleLedger extends Equatable {
  final String uid;
  final String missionId;
  final DateTime joinedAt;
  final int joinedOrbit;
  final int joinedCycleDay;
  final int joinedScheduleIndex;
  final String firstCountedScheduleId;
  final LearningLevel currentLevel;
  final Set<String> completedScheduleIds;
  final Map<String, double> scheduleScores; // scheduleId -> weightedScore
  final Map<int, double> phaseMacroScores; // phaseIndex -> weightedScore
  final Set<String> backlogScheduleIds;
  final bool isMissionReady;

  const StudentCrucibleLedger({
    required this.uid,
    required this.missionId,
    required this.joinedAt,
    required this.joinedOrbit,
    required this.joinedCycleDay,
    required this.joinedScheduleIndex,
    required this.firstCountedScheduleId,
    required this.currentLevel,
    required this.completedScheduleIds,
    required this.scheduleScores,
    required this.phaseMacroScores,
    required this.backlogScheduleIds,
    this.isMissionReady = false,
  });

  /// Factory for new student onboarding.
  /// Guarantees PARTIAL_ENTRY_PUNISHMENT = 0:
  /// The in-progress partial schedule is open for immediate practice, but first formally counted schedule is the next full schedule (or current schedule if joined exactly at the boundary).
  factory StudentCrucibleLedger.createForNewJoiner({
    required String uid,
    required String missionId,
    required DateTime joinedAt,
    required int currentOrbit,
    required int currentCycleDay,
    required int currentScheduleIndex,
    required LearningLevel entryLevel,
    bool isExactScheduleBoundary = false,
  }) {
    final countedScheduleIndex = isExactScheduleBoundary ? currentScheduleIndex : currentScheduleIndex + 1;
    final firstCountedId = 'sch_${missionId}_$countedScheduleIndex';

    return StudentCrucibleLedger(
      uid: uid,
      missionId: missionId,
      joinedAt: joinedAt,
      joinedOrbit: currentOrbit,
      joinedCycleDay: currentCycleDay,
      joinedScheduleIndex: currentScheduleIndex,
      firstCountedScheduleId: firstCountedId,
      currentLevel: entryLevel,
      completedScheduleIds: const {},
      scheduleScores: const {},
      phaseMacroScores: const {},
      backlogScheduleIds: const {},
      isMissionReady: false,
    );
  }

  StudentCrucibleLedger copyWith({
    LearningLevel? currentLevel,
    Set<String>? completedScheduleIds,
    Map<String, double>? scheduleScores,
    Map<int, double>? phaseMacroScores,
    Set<String>? backlogScheduleIds,
    bool? isMissionReady,
  }) {
    return StudentCrucibleLedger(
      uid: uid,
      missionId: missionId,
      joinedAt: joinedAt,
      joinedOrbit: joinedOrbit,
      joinedCycleDay: joinedCycleDay,
      joinedScheduleIndex: joinedScheduleIndex,
      firstCountedScheduleId: firstCountedScheduleId,
      currentLevel: currentLevel ?? this.currentLevel,
      completedScheduleIds: completedScheduleIds ?? this.completedScheduleIds,
      scheduleScores: scheduleScores ?? this.scheduleScores,
      phaseMacroScores: phaseMacroScores ?? this.phaseMacroScores,
      backlogScheduleIds: backlogScheduleIds ?? this.backlogScheduleIds,
      isMissionReady: isMissionReady ?? this.isMissionReady,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'missionId': missionId,
      'joinedAt': joinedAt.millisecondsSinceEpoch,
      'joinedOrbit': joinedOrbit,
      'joinedCycleDay': joinedCycleDay,
      'joinedScheduleIndex': joinedScheduleIndex,
      'firstCountedScheduleId': firstCountedScheduleId,
      'currentLevel': currentLevel.name,
      'completedScheduleIds': completedScheduleIds.toList(),
      'scheduleScores': scheduleScores,
      'phaseMacroScores': phaseMacroScores.map((k, v) => MapEntry(k.toString(), v)),
      'backlogScheduleIds': backlogScheduleIds.toList(),
      'isMissionReady': isMissionReady,
    };
  }

  factory StudentCrucibleLedger.fromMap(Map<String, dynamic> map) {
    return StudentCrucibleLedger(
      uid: map['uid'] ?? '',
      missionId: map['missionId'] ?? '',
      joinedAt: DateTime.fromMillisecondsSinceEpoch(map['joinedAt'] ?? 0),
      joinedOrbit: map['joinedOrbit'] ?? 1,
      joinedCycleDay: map['joinedCycleDay'] ?? 1,
      joinedScheduleIndex: map['joinedScheduleIndex'] ?? 1,
      firstCountedScheduleId: map['firstCountedScheduleId'] ?? '',
      currentLevel: LearningLevel.values.firstWhere(
        (e) => e.name == map['currentLevel'],
        orElse: () => LearningLevel.middle,
      ),
      completedScheduleIds: Set<String>.from(map['completedScheduleIds'] ?? []),
      scheduleScores: Map<String, double>.from(map['scheduleScores'] ?? {}),
      phaseMacroScores: (map['phaseMacroScores'] as Map<String, dynamic>? ?? {}).map(
        (k, v) => MapEntry(int.parse(k), (v as num).toDouble()),
      ),
      backlogScheduleIds: Set<String>.from(map['backlogScheduleIds'] ?? []),
      isMissionReady: map['isMissionReady'] ?? false,
    );
  }

  @override
  List<Object?> get props => [
        uid,
        missionId,
        joinedAt,
        joinedOrbit,
        joinedCycleDay,
        joinedScheduleIndex,
        firstCountedScheduleId,
        currentLevel,
        completedScheduleIds,
        scheduleScores,
        phaseMacroScores,
        backlogScheduleIds,
        isMissionReady,
      ];
}
