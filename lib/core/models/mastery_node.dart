import 'package:equatable/equatable.dart';

/// 🔱 MASTERY NODE (Blueprint v1.0 - Document 47)
/// Represents a user's mastery over a specific Atomic Topic.
class MasteryNode extends Equatable {
  final String id; // Format: [userId]_[atomicTopicId]
  final String userId;
  final String realmId;
  final String atomicTopicId;

  final double masteryScore; // 0.0 to 100.0
  final int totalAttempts;
  final int correctAttempts;
  final int streak;
  
  final DateTime lastAttempted;
  final String status; // UNSEEN, DISCOVERED, LEARNING, PRACTICING, MASTERED, DECAYING

  const MasteryNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.atomicTopicId,
    this.masteryScore = 0.0,
    this.totalAttempts = 0,
    this.correctAttempts = 0,
    this.streak = 0,
    required this.lastAttempted,
    this.status = 'UNSEEN',
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'atomicTopicId': atomicTopicId,
      'masteryScore': masteryScore,
      'totalAttempts': totalAttempts,
      'correctAttempts': correctAttempts,
      'streak': streak,
      'lastAttempted': lastAttempted.toIso8601String(),
      'status': status,
    };
  }

  factory MasteryNode.fromMap(Map<String, dynamic> map) {
    return MasteryNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      atomicTopicId: map['atomicTopicId'] ?? '',
      masteryScore: (map['masteryScore'] ?? 0.0).toDouble(),
      totalAttempts: map['totalAttempts'] ?? 0,
      correctAttempts: map['correctAttempts'] ?? 0,
      streak: map['streak'] ?? 0,
      lastAttempted: DateTime.parse(map['lastAttempted'] ?? DateTime.now().toIso8601String()),
      status: map['status'] ?? 'UNSEEN',
    );
  }

  MasteryNode copyWith({
    double? masteryScore,
    int? totalAttempts,
    int? correctAttempts,
    int? streak,
    DateTime? lastAttempted,
    String? status,
  }) {
    return MasteryNode(
      id: id,
      userId: userId,
      realmId: realmId,
      atomicTopicId: atomicTopicId,
      masteryScore: masteryScore ?? this.masteryScore,
      totalAttempts: totalAttempts ?? this.totalAttempts,
      correctAttempts: correctAttempts ?? this.correctAttempts,
      streak: streak ?? this.streak,
      lastAttempted: lastAttempted ?? this.lastAttempted,
      status: status ?? this.status,
    );
  }

  @override
  List<Object?> get props => [id, userId, realmId, atomicTopicId, masteryScore, status];
}
