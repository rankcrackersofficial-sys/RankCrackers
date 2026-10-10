import '../models/notification_candidate.dart';
import '../models/sentinel_draft.dart';
import '../firebase/firestore_service.dart';

/// SENTINEL NOTIFICATION SERVICE
/// Governs the creation and deduplication of Notification Candidates.
/// Implements Phase 4E-D (Constitutional Laws N1-N6).
class SentinelNotificationService {
  
  // ===================================================
  // CANDIDATE GENERATION 
  // ===================================================

  /// Generates a Notification Candidate from a validated Sentinel Draft.
  /// Implements N1 (Candidate First) and N2 (Impact Driven).
  static Future<void> createCandidateFromDraft({
    required SentinelDraft draft,
    required String impact, // LOW, MEDIUM, HIGH, CRITICAL
    required String type,
  }) async {
    // N3: Deduplication (Canonical ID based on type, recruitment, and version)
    final candidateId = 'cand_${draft.rawData['id']}_${type}_${draft.audit.contentVersion}';

    // N4: Expiry Logic (Standard: 30 days or based on exam date)
    final now = DateTime.now();
    final expires = now.add(const Duration(days: 30));

    final candidate = NotificationCandidate(
      id: candidateId,
      recruitmentId: draft.rawData['id'] ?? 'unknown',
      title: _generateConstitutionalTitle(draft, type),
      summary: draft.rawData['summary'] ?? 'New recruitment intelligence discovered.',
      impactLevel: impact,
      type: type,
      sourceUrl: draft.audit.sourceUrl,
      promotionBatchId: draft.audit.promotionBatchId ?? 'unknown',
      status: 'draft',
      createdAt: now,
      expiresAt: expires,
      metadata: {
        'workerVersion': draft.audit.workerVersion,
        'docHash': draft.audit.documentHash,
      },
    );

    // N5: Source Traceability (Stored in candidate record)
    await FirestoreService.saveNotificationCandidate(candidate);
  }

  // ===================================================
  // UTILITIES 
  // ===================================================

  /// Generates mission-relevant titles while adhering to User Trust Rule (N6).
  static String _generateConstitutionalTitle(SentinelDraft draft, String type) {
    final name = draft.rawData['title'] ?? 'Recruitment';
    switch (type) {
      case 'exam_date':
        return '$name: Exam Date Revised';
      case 'vacancies':
        return '$name: Vacancy Count Updated';
      case 'eligibility':
        return '$name: New Eligibility Criteria';
      case 'corrigendum':
        return '$name: Official Corrigendum Detected';
      default:
        return 'Intelligence Alert: $name';
    }
  }
}
