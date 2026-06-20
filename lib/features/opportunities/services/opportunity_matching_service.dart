import '../models/opportunity.dart';
import '../models/opportunity_match.dart';
import '../../deep_profile/models/warrior_profile.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// 🔱 OPPORTUNITY MATCHING SERVICE
/// Sovereign authority for evaluating warrior eligibility against recruitments.
class OpportunityMatchingService {
  static final _firestore = FirebaseFirestore.instance;
  static const String _collection = 'opportunity_matches';

  /// 🔱 EVALUATE ELIGIBILITY (Document 50A Phase 3)
  /// Performs precision matching between a warrior profile and an opportunity.
  static OpportunityMatch evaluate({
    required WarriorProfile profile,
    required Opportunity opportunity,
  }) {
    bool eligible = true;
    double matchScore = 0.0;
    final List<String> eligibilityReasons = [];
    final List<String> missingRequirements = [];
    final List<String> benefitReasons = [];

    // 🔱 Score Weights
    const double weightAge = 0.25;
    const double weightQual = 0.35;
    const double weightSubject = 0.15;
    const double weightBenefit = 0.15;
    const double weightDomicile = 0.10;

    // 1. AGE CHECK 🔱 (Precision calculation)
    if (profile.dateOfBirth != null) {
      final dob = profile.dateOfBirth!;
      final now = DateTime.now();
      int age = now.year - dob.year;
      if (now.month < dob.month || (now.month == dob.month && now.day < dob.day)) {
        age--;
      }

      if (age < opportunity.minimumAge) {
        eligible = false;
        missingRequirements.add('Minimum age not met (Required: ${opportunity.minimumAge})');
      } else if (age > opportunity.maximumAge) {
        eligible = false;
        missingRequirements.add('Maximum age exceeded (Limit: ${opportunity.maximumAge})');
      } else {
        matchScore += weightAge;
        eligibilityReasons.add('✓ Age eligible ($age years)');
      }
    }

    // 2. CATEGORY & RELAXATION CHECK 🔱
    if (profile.category.isNotEmpty) {
      matchScore += weightBenefit;
      eligibilityReasons.add('✓ Category matched (${profile.category})');
      if (profile.category != 'General') {
        benefitReasons.add('✓ ${profile.category} relaxation applicable');
      }
    }

    // 3. DOMICILE CHECK 🔱
    if (profile.domicileState.isNotEmpty) {
      if (profile.domicileState == opportunity.state) {
        matchScore += weightDomicile;
        eligibilityReasons.add('✓ State domicile matched (${profile.domicileState})');
      }
    }

    // 4. EDUCATION CHECK 🔱 (Precision Match)
    double qualAccumulator = 0.0;
    int qualChecks = 0;

    // A. Graduation Degree
    if (opportunity.requiresGraduation) {
      qualChecks++;
      if (profile.isGraduationCompleted && (opportunity.acceptedDegrees.isEmpty || opportunity.acceptedDegrees.contains(profile.graduationDegree))) {
        qualAccumulator += 1.0;
        eligibilityReasons.add('✓ Graduation degree matched');
      } else {
        eligible = false;
        missingRequirements.add('Required graduation degree not matched');
      }
    }

    // B. Post Graduation Degree
    if (opportunity.requiresPostGraduation) {
      qualChecks++;
      if (profile.isPostGraduationCompleted && (opportunity.acceptedPgDegrees.isEmpty || opportunity.acceptedPgDegrees.contains(profile.postGraduationDegree))) {
        qualAccumulator += 1.0;
        eligibilityReasons.add('✓ PG degree matched');
      } else {
        eligible = false;
        missingRequirements.add('Required PG degree not matched');
      }
    }

    // C. Professional Qualifications
    if (opportunity.acceptedProfessionalQualifications.isNotEmpty) {
      qualChecks++;
      bool profMatch = false;
      for (var reqId in opportunity.acceptedProfessionalQualifications) {
        if (profile.professionalCredentialIds.contains(reqId)) {
          profMatch = true;
          break;
        }
      }
      if (profMatch) {
        qualAccumulator += 1.0;
        eligibilityReasons.add('✓ Professional credentials matched');
      } else {
        eligible = false;
        missingRequirements.add('Required professional qualification missing');
      }
    }

    if (qualChecks > 0) {
      matchScore += (qualAccumulator / qualChecks) * weightQual;
    }

    // 5. SUBJECT CHECK 🔱
    double subjectAccumulator = 0.0;
    int subjectChecks = 0;

    // A. UG Subjects
    if (opportunity.acceptedUgSubjects.isNotEmpty) {
      subjectChecks++;
      bool ugMatch = false;
      for (var s in profile.graduationSubjects) {
        if (opportunity.acceptedUgSubjects.contains(s)) {
          ugMatch = true;
          break;
        }
      }
      if (ugMatch) {
        subjectAccumulator += 1.0;
        eligibilityReasons.add('✓ UG subject specialization matched');
      } else {
        eligible = false;
        missingRequirements.add('Required UG subject specialization not found');
      }
    }

    // B. PG Subjects
    if (opportunity.acceptedPgSubjects.isNotEmpty) {
      subjectChecks++;
      bool pgMatch = false;
      for (var s in profile.postGraduationSubjects) {
        if (opportunity.acceptedPgSubjects.contains(s)) {
          pgMatch = true;
          break;
        }
      }
      if (pgMatch) {
        subjectAccumulator += 1.0;
        eligibilityReasons.add('✓ PG subject specialization matched');
      } else {
        eligible = false;
        missingRequirements.add('Required PG subject specialization not found');
      }
    }

    if (subjectChecks > 0) {
      matchScore += (subjectAccumulator / subjectChecks) * weightSubject;
    }

    // 🔱 RESULT CONSOLIDATION
    return OpportunityMatch(
      uid: profile.uid,
      opportunityId: opportunity.id,
      eligible: eligible,
      matchScore: matchScore.clamp(0.0, 1.0),
      eligibilityReasons: eligibilityReasons,
      missingRequirements: missingRequirements,
      benefitReasons: benefitReasons,
    );
  }

  /// 🔱 PERSIST MATCH
  static Future<void> saveMatch(OpportunityMatch match) async {
    final docId = '${match.uid}_${match.opportunityId}';
    await _firestore.collection(_collection).doc(docId).set(match.toMap());
  }
}
