import 'package:flutter/foundation.dart';
import '../models/recruitment_realm.dart';
import '../models/notification_canonical.dart';
import '../models/syllabus_canonical.dart';

/// 🔱 RECRUITMENT REALM CREATION ENGINE (Blueprint v1.0)
/// Orchestrates the birth of a Recruitment Realm from verified components.

class RealmCreationEngine {
  
  /// VALIDATE & CREATE REALM (Hardened v1.1)
  static Future<RecruitmentRealm?> createRealm({
    required NotificationCanonical notification,
    required SyllabusCanonical syllabus,
    required String founderId,
    bool coverageValidationPassed = false,
  }) async {
    debugPrint("🔱 REALM ENGINE: Initiating creation protocol...");

    // 🔱 Section 2 & 16: Creation Conditions
    if (notification.feedback.status != 'verified') {
      debugPrint("🔱 REALM ENGINE ERROR: Notification not verified. Creation blocked.");
      return null;
    }

    // 🔱 SYLLABUS INTEGRITY CHECK
    if (syllabus.atomicTopics.isEmpty) {
      debugPrint("🔱 REALM ENGINE ERROR: Atomic Graph incomplete. Creation blocked.");
      return null;
    }

    // 🔱 COVERAGE VALIDATION (Audit Fix)
    if (!coverageValidationPassed) {
      debugPrint("🔱 REALM ENGINE ERROR: Coverage Validation failed. Creation blocked.");
      return null;
    }

    // 🔱 SECTION 4: Realm ID Law
    final org = notification.identity.organization.toLowerCase().replaceAll(' ', '_');
    final exam = notification.identity.recruitmentName.toLowerCase().replaceAll(' ', '_');
    final year = 2026; // Should be extracted
    
    final realmId = "rec_${org}_${exam}_$year";

    final realm = RecruitmentRealm(
      realmId: realmId,
      examName: notification.identity.recruitmentName, // 🔱 Using identity name as examName
      recruitmentName: notification.identity.recruitmentName,
      organization: notification.identity.organization,
      examYear: year,
      advertisementNumber: notification.identity.notificationNumber,
      status: 'READY',
      notificationId: notification.identity.notificationId,
      syllabusId: 'verified_syllabus_id', // Should be dynamic
      createdAt: DateTime.now(),
      createdBy: founderId,
      updatedAt: DateTime.now(),
      notificationVerified: true,
      syllabusVerified: true,
    );

    debugPrint("🔱 REALM ENGINE: Realm ${realm.realmId} is READY.");
    return realm;
  }

  /// 🔱 SECTION 12: Manual Override
  static Future<RecruitmentRealm> createManualRealm({
    required String reason,
    required String recruitmentName,
    required String organization,
    required int year,
    required String founderId,
  }) async {
    debugPrint("🔱 REALM ENGINE: Manual override triggered by Founder. Reason: $reason");
    
    final realmId = "rec_manual_${organization.toLowerCase()}_${recruitmentName.toLowerCase()}_$year";
    
    return RecruitmentRealm(
      realmId: realmId,
      examName: recruitmentName,
      recruitmentName: recruitmentName,
      organization: organization,
      examYear: year,
      status: 'ACTIVE',
      notificationId: 'manual_override',
      syllabusId: 'manual_override',
      createdAt: DateTime.now(),
      createdBy: founderId,
      updatedAt: DateTime.now(),
      metadata: {'manual_override_reason': reason},
    );
  }
}
