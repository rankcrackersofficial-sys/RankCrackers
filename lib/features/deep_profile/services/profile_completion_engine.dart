import '../models/warrior_profile.dart';

/// 🔱 PROFILE COMPLETION ENGINE (Document 50A Hardened)
/// Calculates the visual completion percentage based on the Constitutional Weight Lock.
class ProfileCompletionEngine {
  /// 🔱 WEIGHT LOCK (Article 7)
  static const int weightDOB = 15;
  static const int weightGender = 10;
  static const int weightCategory = 15;
  static const int weightSAP = 10;
  static const int weightQualification = 25;
  static const int weightSubjects = 15;
  static const int weightEmployment = 10;

  /// 🔱 CALCULATE COMPLETION PERCENTAGE
  static double calculate(WarriorProfile profile) {
    double score = 0;

    if (profile.dateOfBirth != null) score += weightDOB;
    if (profile.gender.isNotEmpty) score += weightGender;
    if (profile.category.isNotEmpty) score += weightCategory;
    
    // 🔱 SAP Verification (Audit Fix #3)
    // Only grant weight if user has actively provided SAP data or verified non-SAP status.
    if (profile.sapCategory.isNotEmpty || profile.isSAP == true) {
      score += weightSAP;
    }

    if (profile.educationLevel.isNotEmpty) score += weightQualification;
    if (profile.subjects.isNotEmpty || profile.graduationSubjects.isNotEmpty) {
      score += weightSubjects;
    }
    if (profile.employmentStatus.isNotEmpty) score += weightEmployment;

    return score.clamp(0.0, 100.0);
  }
}
