import 'package:equatable/equatable.dart';

/// EXAM CLOCK STATUS (Blueprint v1.0 - Sprint O)
enum ExamClockStatus {
  ON_TRACK,
  AT_RISK,
  OFF_TRACK
}

/// EXAM CLOCK NODE (Blueprint v1.0 - Document 52)
/// Tracks the temporal feasibility of the preparation plan.
class ExamClockNode extends Equatable {
  final String userId;
  final String realmId;
  
  final DateTime examDate;
  final int daysRemaining;
  
  final int topicsRemaining;
  final double coverageRemaining; // percentage
  final double readinessGap; // percentage target - current
  
  final ExamClockStatus status;
  final DateTime calculatedAt;

  const ExamClockNode({
    required this.userId,
    required this.realmId,
    required this.examDate,
    required this.daysRemaining,
    required this.topicsRemaining,
    required this.coverageRemaining,
    required this.readinessGap,
    required this.status,
    required this.calculatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'realmId': realmId,
      'examDate': examDate.toIso8601String(),
      'daysRemaining': daysRemaining,
      'topicsRemaining': topicsRemaining,
      'coverageRemaining': coverageRemaining,
      'readinessGap': readinessGap,
      'status': status.name,
      'calculatedAt': calculatedAt.toIso8601String(),
    };
  }

  factory ExamClockNode.fromMap(Map<String, dynamic> map) {
    return ExamClockNode(
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      examDate: DateTime.parse(map['examDate'] ?? DateTime.now().toIso8601String()),
      daysRemaining: map['daysRemaining'] ?? 0,
      topicsRemaining: map['topicsRemaining'] ?? 0,
      coverageRemaining: (map['coverageRemaining'] ?? 0.0).toDouble(),
      readinessGap: (map['readinessGap'] ?? 0.0).toDouble(),
      status: ExamClockStatus.values.byName(map['status'] ?? 'ON_TRACK'),
      calculatedAt: DateTime.parse(map['calculatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [userId, realmId, examDate, status, calculatedAt];
}
