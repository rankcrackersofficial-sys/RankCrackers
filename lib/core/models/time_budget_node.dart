import 'package:equatable/equatable.dart';

/// TIME BUDGET NODE (Blueprint v1.0 - Document 53)
/// Represents the daily distribution of study time across subjects or intelligence actions.
class TimeBudgetNode extends Equatable {
  final String userId;
  final String realmId;
  
  final int totalDailyMinutes;
  final Map<String, int> subjectAllocation; // Subject -> Minutes
  final Map<String, int> actionAllocation; // MASTER, PRACTICE, REVISE, etc. -> Minutes
  
  final DateTime calculatedAt;

  const TimeBudgetNode({
    required this.userId,
    required this.realmId,
    required this.totalDailyMinutes,
    required this.subjectAllocation,
    required this.actionAllocation,
    required this.calculatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'realmId': realmId,
      'totalDailyMinutes': totalDailyMinutes,
      'subjectAllocation': subjectAllocation,
      'actionAllocation': actionAllocation,
      'calculatedAt': calculatedAt.toIso8601String(),
    };
  }

  factory TimeBudgetNode.fromMap(Map<String, dynamic> map) {
    return TimeBudgetNode(
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      totalDailyMinutes: map['totalDailyMinutes'] ?? 0,
      subjectAllocation: Map<String, int>.from(map['subjectAllocation'] ?? {}),
      actionAllocation: Map<String, int>.from(map['actionAllocation'] ?? {}),
      calculatedAt: DateTime.parse(map['calculatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [userId, realmId, totalDailyMinutes, calculatedAt];
}
