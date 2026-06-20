import 'package:equatable/equatable.dart';

/// 🔱 SENTINEL NOTIFICATION CANDIDATE (Unified Architecture)
/// Represents a potential alert derived from system intelligence or opportunity matching.
class NotificationCandidate extends Equatable {
  final String id;
  
  // 🔱 Recruitment Context (Phase 9)
  final String? uid;
  final String? opportunityId;
  final double? relevanceScore;
  final bool? isUrgent;
  final bool? isNew;
  final List<String>? reasons;

  // 🔱 Discovery Context (Legacy/Sentinel)
  final String? recruitmentId;
  final String? title;
  final String? summary;
  final String? impactLevel;
  final String? type;
  final String? sourceUrl;
  final String? promotionBatchId;
  final String? status;
  final DateTime? createdAt;
  final DateTime? expiresAt;
  final Map<String, dynamic>? metadata;

  const NotificationCandidate({
    required this.id,
    this.uid,
    this.opportunityId,
    this.relevanceScore,
    this.isUrgent,
    this.isNew,
    this.reasons,
    this.recruitmentId,
    this.title,
    this.summary,
    this.impactLevel,
    this.type,
    this.sourceUrl,
    this.promotionBatchId,
    this.status,
    this.createdAt,
    this.expiresAt,
    this.metadata,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'uid': uid,
      'opportunityId': opportunityId,
      'relevanceScore': relevanceScore,
      'isUrgent': isUrgent,
      'isNew': isNew,
      'reasons': reasons,
      'recruitmentId': recruitmentId,
      'title': title,
      'summary': summary,
      'impactLevel': impactLevel,
      'type': type,
      'sourceUrl': sourceUrl,
      'promotionBatchId': promotionBatchId,
      'status': status,
      'createdAt': createdAt?.millisecondsSinceEpoch,
      'expiresAt': expiresAt?.millisecondsSinceEpoch,
      'metadata': metadata,
    };
  }

  factory NotificationCandidate.fromMap(Map<String, dynamic> map) {
    return NotificationCandidate(
      id: map['id'] ?? '',
      uid: map['uid'],
      opportunityId: map['opportunityId'],
      relevanceScore: (map['relevanceScore'] ?? 0.0).toDouble(),
      isUrgent: map['isUrgent'],
      isNew: map['isNew'],
      reasons: map['reasons'] != null ? List<String>.from(map['reasons']) : null,
      recruitmentId: map['recruitmentId'],
      title: map['title'],
      summary: map['summary'],
      impactLevel: map['impactLevel'],
      type: map['type'],
      sourceUrl: map['sourceUrl'],
      promotionBatchId: map['promotionBatchId'],
      status: map['status'],
      createdAt: map['createdAt'] != null ? DateTime.fromMillisecondsSinceEpoch(map['createdAt']) : null,
      expiresAt: map['expiresAt'] != null ? DateTime.fromMillisecondsSinceEpoch(map['expiresAt']) : null,
      metadata: map['metadata'],
    );
  }

  @override
  List<Object?> get props => [id, uid, opportunityId, relevanceScore, isUrgent, title];
}
