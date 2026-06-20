import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import '../models/opportunity.dart';
import '../models/opportunity_match.dart';
import '../../../core/models/notification_candidate.dart';

/// 🔱 SENTINEL NOTIFICATION SERVICE (Phase 9)
/// Orchestrates the generation and ranking of recruitment alerts.
class RecruitmentAlertService {
  static final _firestore = FirebaseFirestore.instance;

  /// 🔱 GENERATE CANDIDATE
  /// Implements Priority Model (Match 50%, Urgency 30%, Freshness 20%).
  static NotificationCandidate generateCandidate({
    required String uid,
    required Opportunity opportunity,
    required OpportunityMatch match,
  }) {
    final now = DateTime.now();
    
    // 🔱 Normalization Law: Ensure all scores are in 0.0 -> 1.0 range
    final normalizedMatch = match.matchScore / 100.0;

    // 1. URGENCY SCORE (30%)
    final daysToClosing = opportunity.lastDate.difference(now).inDays;
    double urgencyScore = 0.0;
    if (daysToClosing <= 1) {
      urgencyScore = 1.0;
    } else if (daysToClosing <= 3) {
      urgencyScore = 0.8;
    } else if (daysToClosing <= 7) {
      urgencyScore = 0.5;
    } else if (daysToClosing <= 30) {
      urgencyScore = 0.2;
    }

    // 2. FRESHNESS SCORE (20%)
    final daysSinceNotification = now.difference(opportunity.notificationDate).inDays;
    double freshnessScore = 0.0;
    if (daysSinceNotification <= 2) {
      freshnessScore = 1.0;
    } else if (daysSinceNotification <= 7) {
      freshnessScore = 0.5;
    }

    // 🔱 CONSTITUTIONAL PRIORITY FORMULA (Phase 9D Hardened)
    final double priority = 
        (normalizedMatch * 0.50) + 
        (urgencyScore * 0.30) + 
        (freshnessScore * 0.20);

    return NotificationCandidate(
      id: 'nc_${uid}_${opportunity.id}',
      uid: uid,
      opportunityId: opportunity.id,
      relevanceScore: priority,
      isUrgent: daysToClosing <= 3,
      isNew: daysSinceNotification <= 2,
      reasons: match.eligibilityReasons,
      createdAt: now,
      status: 'pending', // 🔱 Staging State
    );
  }

  /// 🔱 PUSH TO GOVERNANCE QUEUE
  /// Implements Transactional Deduplication and Staging (Audit Fix #2 & #4).
  static Future<void> pushToQueue(NotificationCandidate candidate, String title) async {
    final historyId = '${candidate.uid}_${candidate.opportunityId}';
    final historyRef = _firestore.collection('notification_history').doc(historyId);
    final candidateRef = _firestore.collection('notification_candidates').doc(candidate.id);
    final draftRef = _firestore.collection('sentinel_drafts').doc('draft_${candidate.id}');

    await _firestore.runTransaction((transaction) async {
      final historyDoc = await transaction.get(historyRef);
      
      if (historyDoc.exists) {
        debugPrint('🔱 DEDUPLICATION: Alert already exists in history for ${candidate.opportunityId}');
        return;
      }

      // 🔱 1. LOCK DEDUPLICATION (Audit Fix #2)
      // Renamed to 'discoveredAt' to prevent deadlock with Delivery Worker.
      transaction.set(historyRef, {
        'uid': candidate.uid,
        'opportunityId': candidate.opportunityId,
        'discoveredAt': FieldValue.serverTimestamp(),
      });

      // 🔱 2. PUSH TO CANDIDATES (The Ingestion Layer)
      transaction.set(candidateRef, {
        ...candidate.toMap(),
        'title': title,
        'serverTimestamp': FieldValue.serverTimestamp(),
      });

      // 🔱 3. PUSH TO SENTINEL DRAFTS (The Governance Layer - Audit Fix #5)
      // Physically implements: Candidate -> Draft transition
      transaction.set(draftRef, {
        'id': 'draft_${candidate.id}',
        'type': 'recruitment_alert',
        'status': 'under_review',
        'rawData': {
          ...candidate.toMap(),
          'title': title,
        },
        'audit': {
          'workerVersion': '9.4.0',
          'processedAt': FieldValue.serverTimestamp(),
          'provider': 'eligibility_engine',
        },
      });
    });
  }
}
