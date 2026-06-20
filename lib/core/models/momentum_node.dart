import 'package:equatable/equatable.dart';

/// 🔱 MOMENTUM STATUS (Blueprint v1.0 - Sprint N)
enum MomentumStatus {
  RISING,
  STABLE,
  DECLINING,
  COLLAPSING
}

/// 🔱 MOMENTUM NODE (Blueprint v1.0 - Document 50)
/// Tracks a user's performance trajectory over time.
class MomentumNode extends Equatable {
  final String userId;
  final String realmId;
  
  // 🔱 Metrics (7-day trend)
  final double masteryGrowth;
  final double coverageGrowth;
  final double missionCompletionRate;
  final double battleAccuracy;

  final MomentumStatus status;
  final DateTime calculatedAt;

  const MomentumNode({
    required this.userId,
    required this.realmId,
    required this.masteryGrowth,
    required this.coverageGrowth,
    required this.missionCompletionRate,
    required this.battleAccuracy,
    required this.status,
    required this.calculatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'realmId': realmId,
      'masteryGrowth': masteryGrowth,
      'coverageGrowth': coverageGrowth,
      'missionCompletionRate': missionCompletionRate,
      'battleAccuracy': battleAccuracy,
      'status': status.name,
      'calculatedAt': calculatedAt.toIso8601String(),
    };
  }

  factory MomentumNode.fromMap(Map<String, dynamic> map) {
    return MomentumNode(
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      masteryGrowth: (map['masteryGrowth'] ?? 0.0).toDouble(),
      coverageGrowth: (map['coverageGrowth'] ?? 0.0).toDouble(),
      missionCompletionRate: (map['missionCompletionRate'] ?? 0.0).toDouble(),
      battleAccuracy: (map['battleAccuracy'] ?? 0.0).toDouble(),
      status: MomentumStatus.values.byName(map['status'] ?? 'STABLE'),
      calculatedAt: DateTime.parse(map['calculatedAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [userId, realmId, status, calculatedAt];
}
