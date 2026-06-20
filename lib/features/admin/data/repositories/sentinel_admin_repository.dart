import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter/foundation.dart';

/// 🔱 SENTINEL ADMIN REPOSITORY (P4 & P7 Audit Fix)
class SentinelAdminRepository {
  static final _firestore = FirebaseFirestore.instance;
  static final _functions = FirebaseFunctions.instance;

  static Stream<int> streamPendingDiscoveriesCount() {
    return _firestore
        .collection('sentinel_drafts')
        .where('status', isEqualTo: 'under_review')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamCriticalDiscoveriesCount() {
    return _firestore
        .collection('sentinel_drafts')
        .where('status', isEqualTo: 'under_review')
        .where('audit.impactLevel', isEqualTo: 'CRITICAL')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<int> streamHighDiscoveriesCount() {
    return _firestore
        .collection('sentinel_drafts')
        .where('status', isEqualTo: 'under_review')
        .where('audit.impactLevel', isEqualTo: 'HIGH')
        .snapshots()
        .map((snap) => snap.size);
  }

  static Stream<List<Map<String, dynamic>>> streamActivityTimeline() {
    return _firestore
        .collection('founder_activity_log')
        .orderBy('timestamp', descending: true)
        .limit(20)
        .snapshots()
        .map((snap) => snap.docs.map((doc) => doc.data()).toList());
  }

  static Future<void> handleAction({
    required String draftId,
    required String action,
    Map<String, dynamic>? payload,
  }) async {
    // 🔱 Audit: If corrections exist, ensure they are structured for the Feedback Engine
    if (payload != null && payload.containsKey('corrections')) {
      debugPrint("🔱 SENTINEL REPO: Packaging Correction Dataset for AI Feedback Loop...");
      // Wrap corrections with environmental metadata for Data Science
      payload['feedbackContext'] = {
        'timestamp': DateTime.now().toIso8601String(),
        'platform': 'Founder_Panel_V1.2',
        'isManualCorrection': true,
      };
    }

    await _functions.httpsCallable('handleSentinelAction').call({
      'draftId': draftId,
      'action': action,
      'payload': payload,
    });
  }

  /// 🔱 VERIFY KNOWLEDGE BLOCK
  static Future<void> verifyKnowledgeBlock(String blockId, {String status = 'verified'}) async {
    await _functions.httpsCallable('handleSentinelAction').call({
      'action': 'verify_knowledge_block',
      'payload': {
        'blockId': blockId,
        'status': status,
      }
    });
  }

  /// 🔱 LOG FOUNDER ACTIVITY
  /// Manually log actions like Preview or Download via Sovereign Proxy.
  static Future<void> logActivity({
    required String type,
    required String message,
    Map<String, dynamic>? metadata,
  }) async {
    // 🔱 Hardened v3.9: Direct write to log is now forbidden.
    await _functions.httpsCallable('handleSentinelAction').call({
      'action': 'log_founder_activity',
      'payload': {
        'type': type,
        'message': message,
        'metadata': metadata,
      }
    });
  }
}
