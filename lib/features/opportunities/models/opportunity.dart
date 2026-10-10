import 'package:equatable/equatable.dart';

/// OPPORTUNITY ENTITY (Document 50A Phase 6 Hardened)
/// Master structure for recruitment/notification data.
class Opportunity extends Equatable {
  final String id;
  final String title;
  final String department;
  final String state;
  final int totalPosts;
  final DateTime notificationDate;
  final DateTime lastDate;
  final String officialPdfUrl;
  final String status; // active, closed, archived

  // ELIGIBILITY LAYER
  final int minimumAge;
  final int maximumAge;
  final int generalRelaxation;
  final int obcRelaxation;
  final int scRelaxation;
  final int stRelaxation;
  final bool ewsRule;
  final bool sapRule;
  final bool widowRule;
  final bool divorceeRule;

  // QUALIFICATION REQUIREMENTS (Phase 6)
  final bool requiresGraduation;
  final bool requiresPostGraduation;
  final bool requiresBed;
  final bool requiresDeled;
  final bool requiresBstc;
  final bool requiresNet;
  final bool requiresSet;
  final bool requiresPhd;
  final bool requiresLawDegree;
  final bool requiresNursingQualification;
  final List<String> requiredSubjects;
  
  // SUBJECT MAPPING (Document 50A Phase 7 Hardened)
  final List<String> acceptedPgSubjects;
  final List<String> acceptedUgSubjects;

  // ACCEPTED CREDENTIALS (Explainability Layer)
  final List<String> acceptedDegrees;
  final List<String> acceptedPgDegrees;
  final List<String> acceptedProfessionalQualifications;

  final List<String> educationRequirements;
  final List<String> experienceRequirements;

  // VACANCY BUCKETS
  final int generalPosts;
  final int obcPosts;
  final int scPosts;
  final int stPosts;
  final int ewsPosts;
  final int sapPosts;
  final int womenPosts;

  final List<String> eligibleMissionIds;

  // PROVENANCE & GOVERNANCE
  final String sourceAuthority;
  final String sourceDocumentId;
  final String sourceVersion;
  final String? eligibilityRuleId;
  final String? eligibilityRuleVersion;

  const Opportunity({
    required this.id,
    required this.title,
    required this.department,
    required this.state,
    required this.totalPosts,
    required this.notificationDate,
    required this.lastDate,
    required this.officialPdfUrl,
    required this.status,
    this.minimumAge = 18,
    this.maximumAge = 40,
    this.generalRelaxation = 0,
    this.obcRelaxation = 3,
    this.scRelaxation = 5,
    this.stRelaxation = 5,
    this.ewsRule = true,
    this.sapRule = true,
    this.widowRule = true,
    this.divorceeRule = true,
    this.requiresGraduation = false,
    this.requiresPostGraduation = false,
    this.requiresBed = false,
    this.requiresDeled = false,
    this.requiresBstc = false,
    this.requiresNet = false,
    this.requiresSet = false,
    this.requiresPhd = false,
    this.requiresLawDegree = false,
    this.requiresNursingQualification = false,
    this.requiredSubjects = const [],
    this.acceptedPgSubjects = const [],
    this.acceptedUgSubjects = const [],
    this.acceptedDegrees = const [],
    this.acceptedPgDegrees = const [],
    this.acceptedProfessionalQualifications = const [],
    this.educationRequirements = const [],
    this.experienceRequirements = const [],
    this.generalPosts = 0,
    this.obcPosts = 0,
    this.scPosts = 0,
    this.stPosts = 0,
    this.ewsPosts = 0,
    this.sapPosts = 0,
    this.womenPosts = 0,
    this.eligibleMissionIds = const [],
    this.sourceAuthority = 'Governed Authority',
    this.sourceDocumentId = '',
    this.sourceVersion = 'v1.0.0',
    this.eligibilityRuleId,
    this.eligibilityRuleVersion,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'department': department,
      'state': state,
      'totalPosts': totalPosts,
      'notificationDate': notificationDate.millisecondsSinceEpoch,
      'lastDate': lastDate.millisecondsSinceEpoch,
      'officialPdfUrl': officialPdfUrl,
      'status': status,
      'minimumAge': minimumAge,
      'maximumAge': maximumAge,
      'generalRelaxation': generalRelaxation,
      'obcRelaxation': obcRelaxation,
      'scRelaxation': scRelaxation,
      'stRelaxation': stRelaxation,
      'ewsRule': ewsRule,
      'sapRule': sapRule,
      'widowRule': widowRule,
      'divorceeRule': divorceeRule,
      'requiresGraduation': requiresGraduation,
      'requiresPostGraduation': requiresPostGraduation,
      'requiresBed': requiresBed,
      'requiresDeled': requiresDeled,
      'requiresBstc': requiresBstc,
      'requiresNet': requiresNet,
      'requiresSet': requiresSet,
      'requiresPhd': requiresPhd,
      'requiresLawDegree': requiresLawDegree,
      'requiresNursingQualification': requiresNursingQualification,
      'requiredSubjects': requiredSubjects,
      'acceptedPgSubjects': acceptedPgSubjects,
      'acceptedUgSubjects': acceptedUgSubjects,
      'acceptedDegrees': acceptedDegrees,
      'acceptedPgDegrees': acceptedPgDegrees,
      'acceptedProfessionalQualifications': acceptedProfessionalQualifications,
      'educationRequirements': educationRequirements,
      'experienceRequirements': experienceRequirements,
      'generalPosts': generalPosts,
      'obcPosts': obcPosts,
      'scPosts': scPosts,
      'stPosts': stPosts,
      'ewsPosts': ewsPosts,
      'sapPosts': sapPosts,
      'womenPosts': womenPosts,
      'eligibleMissionIds': eligibleMissionIds,
      'sourceAuthority': sourceAuthority,
      'sourceDocumentId': sourceDocumentId,
      'sourceVersion': sourceVersion,
      'eligibilityRuleId': eligibilityRuleId,
      'eligibilityRuleVersion': eligibilityRuleVersion,
    };
  }

  factory Opportunity.fromMap(Map<String, dynamic> map) {
    return Opportunity(
      id: map['id'] ?? '',
      title: map['title'] ?? '',
      department: map['department'] ?? '',
      state: map['state'] ?? '',
      totalPosts: map['totalPosts'] ?? 0,
      notificationDate: DateTime.fromMillisecondsSinceEpoch(map['notificationDate'] ?? 0),
      lastDate: DateTime.fromMillisecondsSinceEpoch(map['lastDate'] ?? 0),
      officialPdfUrl: map['officialPdfUrl'] ?? '',
      status: map['status'] ?? 'active',
      minimumAge: map['minimumAge'] ?? 18,
      maximumAge: map['maximumAge'] ?? 40,
      requiresGraduation: map['requiresGraduation'] ?? false,
      requiresPostGraduation: map['requiresPostGraduation'] ?? false,
      requiresBed: map['requiresBed'] ?? false,
      requiresDeled: map['requiresDeled'] ?? false,
      requiresBstc: map['requiresBstc'] ?? false,
      requiresNet: map['requiresNet'] ?? false,
      requiresSet: map['requiresSet'] ?? false,
      requiresPhd: map['requiresPhd'] ?? false,
      requiresLawDegree: map['requiresLawDegree'] ?? false,
      requiresNursingQualification: map['requiresNursingQualification'] ?? false,
      requiredSubjects: List<String>.from(map['requiredSubjects'] ?? []),
      acceptedPgSubjects: List<String>.from(map['acceptedPgSubjects'] ?? []),
      acceptedUgSubjects: List<String>.from(map['acceptedUgSubjects'] ?? []),
      acceptedDegrees: List<String>.from(map['acceptedDegrees'] ?? []),
      acceptedPgDegrees: List<String>.from(map['acceptedPgDegrees'] ?? []),
      acceptedProfessionalQualifications: List<String>.from(map['acceptedProfessionalQualifications'] ?? []),
      educationRequirements: List<String>.from(map['educationRequirements'] ?? []),
      experienceRequirements: List<String>.from(map['experienceRequirements'] ?? []),
      generalPosts: map['generalPosts'] ?? 0,
      obcPosts: map['obcPosts'] ?? 0,
      scPosts: map['scPosts'] ?? 0,
      stPosts: map['stPosts'] ?? 0,
      ewsPosts: map['ewsPosts'] ?? 0,
      sapPosts: map['sapPosts'] ?? 0,
      womenPosts: map['womenPosts'] ?? 0,
      eligibleMissionIds: List<String>.from(map['eligibleMissionIds'] ?? []),
      sourceAuthority: map['sourceAuthority'] ?? 'Governed Authority',
      sourceDocumentId: map['sourceDocumentId'] ?? '',
      sourceVersion: map['sourceVersion'] ?? 'v1.0.0',
      eligibilityRuleId: map['eligibilityRuleId'],
      eligibilityRuleVersion: map['eligibilityRuleVersion'],
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        department,
        status,
        lastDate,
        generalPosts,
        obcPosts,
        scPosts,
        stPosts,
        ewsPosts,
        sapPosts,
        womenPosts,
        requiresGraduation,
        requiresPostGraduation,
        requiresBed,
        requiresDeled,
        requiresBstc,
        requiresNet,
        requiresSet,
        requiresPhd,
        requiresLawDegree,
        requiresNursingQualification,
        requiredSubjects,
        acceptedPgSubjects,
        acceptedUgSubjects,
        acceptedDegrees,
        acceptedPgDegrees,
        acceptedProfessionalQualifications,
        eligibleMissionIds,
        sourceAuthority,
        sourceDocumentId,
        sourceVersion,
      ];
}
