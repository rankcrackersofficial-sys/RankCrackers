import 'package:equatable/equatable.dart';

/// 🔱 COVERAGE NODE (Blueprint v1.0 - Document 48)
/// Tracks the Breadth of a student's engagement with an Atomic Topic.
class CoverageNode extends Equatable {
  final String id; // [userId]_[atomicTopicId]
  final String userId;
  final String realmId;
  final String atomicTopicId;

  final bool discovered; // Seen in syllabus/listing
  final bool studied; // DigiBook Unit viewed
  final bool assessed; // Crucible Node attempted

  final int digibookViews;
  final int crucibleAttempts;

  final double coverageScore; // 0.0 to 100.0
  final String status; // UNTOUCHED, DISCOVERED, ENGAGED, COVERED, REINFORCED
  
  final DateTime lastActivity;

  const CoverageNode({
    required this.id,
    required this.userId,
    required this.realmId,
    required this.atomicTopicId,
    this.discovered = false,
    this.studied = false,
    this.assessed = false,
    this.digibookViews = 0,
    this.crucibleAttempts = 0,
    this.coverageScore = 0.0,
    this.status = 'UNTOUCHED',
    required this.lastActivity,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'userId': userId,
      'realmId': realmId,
      'atomicTopicId': atomicTopicId,
      'discovered': discovered,
      'studied': studied,
      'assessed': assessed,
      'digibookViews': digibookViews,
      'crucibleAttempts': crucibleAttempts,
      'coverageScore': coverageScore,
      'status': status,
      'lastActivity': lastActivity.toIso8601String(),
    };
  }

  factory CoverageNode.fromMap(Map<String, dynamic> map) {
    return CoverageNode(
      id: map['id'] ?? '',
      userId: map['userId'] ?? '',
      realmId: map['realmId'] ?? '',
      atomicTopicId: map['atomicTopicId'] ?? '',
      discovered: map['discovered'] ?? false,
      studied: map['studied'] ?? false,
      assessed: map['assessed'] ?? false,
      digibookViews: map['digibookViews'] ?? 0,
      crucibleAttempts: map['crucibleAttempts'] ?? 0,
      coverageScore: (map['coverageScore'] ?? 0.0).toDouble(),
      status: map['status'] ?? 'UNTOUCHED',
      lastActivity: DateTime.parse(map['lastActivity'] ?? DateTime.now().toIso8601String()),
    );
  }

  CoverageNode copyWith({
    bool? discovered,
    bool? studied,
    bool? assessed,
    int? digibookViews,
    int? crucibleAttempts,
    double? coverageScore,
    String? status,
    DateTime? lastActivity,
  }) {
    return CoverageNode(
      id: id,
      userId: userId,
      realmId: realmId,
      atomicTopicId: atomicTopicId,
      discovered: discovered ?? this.discovered,
      studied: studied ?? this.studied,
      assessed: assessed ?? this.assessed,
      digibookViews: digibookViews ?? this.digibookViews,
      crucibleAttempts: crucibleAttempts ?? this.crucibleAttempts,
      coverageScore: coverageScore ?? this.coverageScore,
      status: status ?? this.status,
      lastActivity: lastActivity ?? this.lastActivity,
    );
  }

  @override
  List<Object?> get props => [id, userId, coverageScore, status];
}
