import 'tactical_schedule.dart';

class CruciblePhase {
  final int phaseIndex;
  final List<TacticalSchedule> schedules;
  final DateTime startDate;
  final DateTime macroTestTime;

  const CruciblePhase({
    required this.phaseIndex,
    required this.schedules,
    required this.startDate,
    required this.macroTestTime,
  });
}
