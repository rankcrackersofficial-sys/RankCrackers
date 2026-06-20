import 'package:equatable/equatable.dart';

/// 🔱 RECRUITMENT REALM (Blueprint v1.4 - Audit Hardened)
class RecruitmentRealm extends Equatable {
  final String realmId; 
  final String examName; // 🔱 Audit GAP A-5: Exam-Centric Identity
  final String recruitmentName;
  final String organization;
  final int examYear;
  final String advertisementNumber; // 🔱 Primary identity linkage
  final double realmDifficultyScore; // 🔱 Audit GAP Q-5: 0.0 to 1.0 (Competitive Factor)
  
  /// 🔱 STATUS FLOW: CANDIDATE -> VERIFIED -> READY -> DIGIBOOK_READY -> CRUCIBLE_READY -> ACTIVE -> LIVE
  /// Founder Lifecycle States: ACTIVE, PASSIVE, ARCHIVED
  final String status; 
  
  final String notificationId; 
  final String syllabusId; 

  // 🔱 ASSET REGISTRY (Sprint E.4)
  final List<String> notificationIds; // 🔱 Hardened: Multiple Linkage Law
  final List<String> syllabusIds; // 🔱 Hardened: Multiple Linkage Law
  final List<Map<String, dynamic>> assets;
  
  // 🔱 REALM HEALTH FLAGS (Audit GAP-6 Hardening)
  final bool notificationVerified;
  final bool syllabusVerified;
  final bool pyqVerified;

  final bool digibookGenerated;
  final bool digibookVerified;
  final bool digibookCoverageValidated; 
  final bool digibookPyqMapped; 

  final bool crucibleGenerated;
  final bool crucibleCoverageValidated;
  final bool cruciblePyqMapped;
  final bool crucibleVerified;

  final bool coverageValidated;
  final bool masteryValidated;
  final bool riskValidated;
  
  final Map<String, dynamic> metadata;
  final DateTime createdAt;
  final String createdBy;
  final DateTime updatedAt; // 🔱 Audit Fix: Lifecycle Traceability

  const RecruitmentRealm({
    required this.realmId,
    required this.examName,
    required this.recruitmentName,
    required this.organization,
    required this.examYear,
    this.advertisementNumber = '',
    this.realmDifficultyScore = 0.85, 
    this.status = 'PASSIVE', // 🔱 Default to Passive on creation
    required this.notificationId,
    required this.syllabusId,
    this.notificationIds = const [],
    this.syllabusIds = const [],
    this.assets = const [],
    this.notificationVerified = false,
    this.syllabusVerified = false,
    this.pyqVerified = false,
    this.digibookGenerated = false,
    this.digibookVerified = false,
    this.digibookCoverageValidated = false,
    this.digibookPyqMapped = false,
    this.crucibleGenerated = false,
    this.crucibleCoverageValidated = false,
    this.cruciblePyqMapped = false,
    this.crucibleVerified = false,
    this.coverageValidated = false,
    this.masteryValidated = false,
    this.riskValidated = false,
    this.metadata = const {},
    required this.createdAt,
    required this.createdBy,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'realm_id': realmId,
      'exam_name': examName,
      'recruitment_name': recruitmentName,
      'organization': organization,
      'exam_year': examYear,
      'advertisement_number': advertisementNumber,
      'realm_difficulty_score': realmDifficultyScore,
      'status': status,
      'notification_id': notificationId,
      'syllabus_id': syllabusId,
      'notification_ids': notificationIds,
      'syllabus_ids': syllabusIds,
      'assets': assets,
      'notification_verified': notificationVerified,
      'syllabus_verified': syllabusVerified,
      'pyq_verified': pyqVerified,
      'digibook_generated': digibookGenerated,
      'digibook_verified': digibookVerified,
      'digibook_coverage_validated': digibookCoverageValidated,
      'digibook_pyq_mapped': digibookPyqMapped,
      'crucible_generated': crucibleGenerated,
      'crucible_coverage_validated': crucibleCoverageValidated,
      'crucible_pyq_mapped': cruciblePyqMapped,
      'crucible_verified': crucibleVerified,
      'coverage_validated': coverageValidated,
      'mastery_validated': masteryValidated,
      'risk_validated': riskValidated,
      'metadata': metadata,
      'created_at': createdAt.toIso8601String(),
      'created_by': createdBy,
      'updated_at': updatedAt.toIso8601String(),
    };
  }

  factory RecruitmentRealm.fromMap(Map<String, dynamic> map) {
    return RecruitmentRealm(
      realmId: map['realm_id'] ?? '',
      examName: map['exam_name'] ?? '',
      recruitmentName: map['recruitment_name'] ?? '',
      organization: map['organization'] ?? '',
      examYear: map['exam_year'] ?? 0,
      advertisementNumber: map['advertisement_number'] ?? '',
      realmDifficultyScore: (map['realm_difficulty_score'] ?? 0.85).toDouble(),
      status: map['status'] ?? 'PASSIVE',
      notificationId: map['notification_id'] ?? '',
      syllabusId: map['syllabus_id'] ?? '',
      notificationIds: List<String>.from(map['notification_ids'] ?? []),
      syllabusIds: List<String>.from(map['syllabus_ids'] ?? []),
      assets: List<Map<String, dynamic>>.from(map['assets'] ?? []),
      notificationVerified: map['notification_verified'] ?? false,
      syllabusVerified: map['syllabus_verified'] ?? false,
      pyqVerified: map['pyq_verified'] ?? false,
      digibookGenerated: map['digibook_generated'] ?? false,
      digibookVerified: map['digibook_verified'] ?? false,
      digibookCoverageValidated: map['digibook_coverage_validated'] ?? false,
      digibookPyqMapped: map['digibook_pyq_mapped'] ?? false,
      crucibleGenerated: map['crucible_generated'] ?? false,
      crucibleCoverageValidated: map['crucible_coverage_validated'] ?? false,
      cruciblePyqMapped: map['crucible_pyq_mapped'] ?? false,
      crucibleVerified: map['crucible_verified'] ?? false,
      coverageValidated: map['coverage_validated'] ?? false,
      masteryValidated: map['mastery_validated'] ?? false,
      riskValidated: map['risk_validated'] ?? false,
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
      createdAt: DateTime.parse(map['created_at'] ?? DateTime.now().toIso8601String()),
      createdBy: map['created_by'] ?? 'System',
      updatedAt: DateTime.parse(map['updated_at'] ?? DateTime.now().toIso8601String()),
    );
  }

  @override
  List<Object?> get props => [realmId, status, notificationVerified, syllabusVerified, pyqVerified];
}
