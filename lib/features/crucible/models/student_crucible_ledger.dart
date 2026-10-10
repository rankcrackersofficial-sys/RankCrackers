import 'package:equatable/equatable.dart';
import '../../personalization/models/student_learning_level.dart';
import '../../../core/utils/temporal_normalizer.dart';

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
    final rawScores = map['scheduleScores'];
    final parsedScheduleScores = <String, double>{};
    if (rawScores is Map) {
      rawScores.forEach((k, v) {
        if (v is num) parsedScheduleScores[k.toString()] = v.toDouble();
      });
    }

    final rawMacroScores = map['phaseMacroScores'];
    final parsedMacroScores = <int, double>{};
    if (rawMacroScores is Map) {
      rawMacroScores.forEach((k, v) {
        final parsedKey = int.tryParse(k.toString());
        if (parsedKey != null && v is num) {
          parsedMacroScores[parsedKey] = v.toDouble();
        }
      });
    }

    return StudentCrucibleLedger(
      uid: map['uid']?.toString() ?? '',
      missionId: map['missionId']?.toString() ?? '',
      joinedAt: TemporalNormalizer.parseRequired(
        map['joinedAt'],
        fallback: DateTime.fromMillisecondsSinceEpoch(0),
        fieldName: 'joinedAt',
      ),
      joinedOrbit: (map['joinedOrbit'] as num?)?.toInt() ?? 1,
      joinedCycleDay: (map['joinedCycleDay'] as num?)?.toInt() ?? 1,
      joinedScheduleIndex: (map['joinedScheduleIndex'] as num?)?.toInt() ?? 1,
      firstCountedScheduleId: map['firstCountedScheduleId']?.toString() ?? '',
      currentLevel: LearningLevel.values.firstWhere(
        (e) => e.name == map['currentLevel'],
        orElse: () => LearningLevel.middle,
      ),
      completedScheduleIds: map['completedScheduleIds'] is List
          ? Set<String>.from((map['completedScheduleIds'] as List).map((e) => e.toString()))
          : const {},
      scheduleScores: parsedScheduleScores,
      phaseMacroScores: parsedMacroScores,
      backlogScheduleIds: map['backlogScheduleIds'] is List
          ? Set<String>.from((map['backlogScheduleIds'] as List).map((e) => e.toString()))
          : const {},
      isMissionReady: map['isMissionReady'] == true,
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
