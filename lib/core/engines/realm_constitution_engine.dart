import '../models/recruitment_realm.dart';

/// 🔱 RECRUITMENT REALM CONSTITUTION ENGINE (v1.1 - Hardened)
/// Enforces hard constitutional checks for Realm state transitions.
class RealmConstitutionEngine {
  
  /// 🔱 LAUNCH BLOCKER LAW
  /// Checks if a Realm is eligible to move to LIVE status.
  static Map<String, dynamic> validateLaunchEligibility(RecruitmentRealm? realm) {
    final List<String> blockingErrors = [];
    final List<String> warnings = [];

    if (realm == null) {
      blockingErrors.add("Recruitment Realm has NOT been created for this notification.");
      return {
        'canLaunch': false,
        'blockingErrors': blockingErrors,
        'warnings': [],
        'readinessScore': 0.0,
      };
    }

    // 🔱 Section 1: Verification Checks
    if (!realm.notificationVerified) blockingErrors.add("Official Notification is NOT verified.");
    if (!realm.syllabusVerified) blockingErrors.add("Official Syllabus is NOT verified.");
    if (!realm.pyqVerified) blockingErrors.add("Historical PYQ data is NOT verified.");
    if (!realm.digibookVerified) blockingErrors.add("DigiBook for this Realm has NOT been verified.");
    if (!realm.crucibleVerified) blockingErrors.add("Crucible assessment graph has NOT been verified.");

    // 🔱 Section 2: Generation Checks
    if (!realm.digibookGenerated) blockingErrors.add("DigiBook for this Realm has NOT been generated.");
    if (!realm.crucibleGenerated) blockingErrors.add("Crucible Session structure is NOT ready.");

    // 🔱 Section 3: Intelligence Validation
    if (!realm.coverageValidated) blockingErrors.add("Syllabus Coverage mapping has NOT passed validation.");
    
    // 🔱 COVERAGE LAW (Audit Sprint J)
    // In production, this checks the aggregate coverage score from all student/system nodes.
    // For now, we simulate the enforcement flag on the realm metadata or health.
    if (realm.metadata['aggregateCoverage'] != null && 
        (realm.metadata['aggregateCoverage'] as double) < 90.0) {
      blockingErrors.add("System-wide coverage is below constitutional threshold (90%).");
    }

    if (!realm.crucibleCoverageValidated) blockingErrors.add("Crucible Assessment Coverage has NOT been validated.");
    if (!realm.cruciblePyqMapped) warnings.add("PYQ mapping for Crucible nodes is incomplete.");
    if (!realm.masteryValidated) warnings.add("Mastery metrics have not been simulated yet.");
    if (!realm.riskValidated) warnings.add("Risk assessment for this recruitment is pending.");

    final bool canLaunch = blockingErrors.isEmpty;

    return {
      'canLaunch': canLaunch,
      'blockingErrors': blockingErrors,
      'warnings': warnings,
      'readinessScore': _calculateReadiness(realm),
    };
  }

  static double _calculateReadiness(RecruitmentRealm realm) {
    int score = 0;
    
    // 🔱 VERIFICATION WEIGHTS (Audit GAP-H6 Hardening)
    if (realm.notificationVerified) score += 15;
    if (realm.syllabusVerified) score += 15;
    if (realm.pyqVerified) score += 10;
    
    // 🔱 DIGIBOOK WEIGHTS
    if (realm.digibookGenerated) score += 5;
    if (realm.digibookVerified) score += 10;
    if (realm.digibookCoverageValidated) score += 5;
    
    // 🔱 CRUCIBLE WEIGHTS
    if (realm.crucibleGenerated) score += 5;
    if (realm.crucibleVerified) score += 10;
    if (realm.crucibleCoverageValidated) score += 5;
    if (realm.cruciblePyqMapped) score += 5;

    // 🔱 SYSTEM VALIDATION
    if (realm.coverageValidated) score += 5;
    if (realm.masteryValidated) score += 5;
    if (realm.riskValidated) score += 5;

    return score.toDouble() / 100.0;
  }
}
