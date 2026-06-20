import 'package:equatable/equatable.dart';

/// 🔱 WARRIOR PROFILE MODEL (Document 50A Phase 7 Hardened)
/// Represents the comprehensive eligibility and educational profile of a warrior.
class WarriorProfile extends Equatable {
  final String uid;
  final DateTime? dateOfBirth;
  final String gender;
  
  // 🔱 Eligibility Baseline
  final String state;
  final String district;
  final String domicileState; 
  final String category; // General, OBC, SC, ST, EWS
  final String subCategory;
  final String maritalStatus;
  
  // 🔱 Special Relaxations
  final bool isSAP; // Specially Abled Person
  final String sapCategory;
  final bool isWidow;
  final bool isDivorcee;
  final bool isSeparatedWoman;

  // 🔱 Qualification Layer
  final String educationLevel;
  final String graduationDegree; // e.g. BA, BSc, BTech
  final String graduationStream;
  final bool isGraduationCompleted;
  final List<String> subjects;
  final List<String> graduationSubjects;

  // 🔱 Post Graduation
  final bool isPostGraduationCompleted;
  final String postGraduationDegree; // e.g. MA, MSc, MTech
  final String postGraduationStream;
  final List<String> postGraduationSubjects;

  // 🔱 Professional & Technical Qualifications (Phase 7 Dynamic)
  final List<String> professionalCredentialIds; 
  final bool isBedCompleted;
  final bool isDeledCompleted;
  final bool isBstcCompleted;
  final bool isNetQualified;
  final bool isSetQualified;
  final bool isPhdCompleted;
  final bool isLawGraduate;
  final String nursingQualification; // ANM, GNM, BSc Nursing, MSc Nursing
  final String engineeringBranch; // Civil, Mechanical, etc.

  // 🔱 Eligibility Tests
  final bool isCtetQualified;
  final bool isReetQualified;
  final bool isTetQualified;

  // 🔱 Operational Data
  final String employmentStatus;
  final double completionPercent;

  const WarriorProfile({
    required this.uid,
    this.dateOfBirth,
    this.gender = '',
    this.state = '',
    this.district = '',
    this.domicileState = '',
    this.category = '',
    this.subCategory = '',
    this.maritalStatus = '',
    this.isSAP = false,
    this.sapCategory = '',
    this.isWidow = false,
    this.isDivorcee = false,
    this.isSeparatedWoman = false,
    this.educationLevel = '',
    this.graduationDegree = '',
    this.graduationStream = '',
    this.isGraduationCompleted = false,
    this.subjects = const [],
    this.graduationSubjects = const [],
    this.isPostGraduationCompleted = false,
    this.postGraduationDegree = '',
    this.postGraduationStream = '',
    this.postGraduationSubjects = const [],
    this.professionalCredentialIds = const [],
    this.isBedCompleted = false,
    this.isDeledCompleted = false,
    this.isBstcCompleted = false,
    this.isNetQualified = false,
    this.isSetQualified = false,
    this.isPhdCompleted = false,
    this.isLawGraduate = false,
    this.nursingQualification = '',
    this.engineeringBranch = '',
    this.isCtetQualified = false,
    this.isReetQualified = false,
    this.isTetQualified = false,
    this.employmentStatus = '',
    this.completionPercent = 0.0,
  });

  WarriorProfile copyWith({
    String? uid,
    DateTime? dateOfBirth,
    String? gender,
    String? state,
    String? district,
    String? domicileState,
    String? category,
    String? subCategory,
    String? maritalStatus,
    bool? isSAP,
    String? sapCategory,
    bool? isWidow,
    bool? isDivorcee,
    bool? isSeparatedWoman,
    String? educationLevel,
    String? graduationDegree,
    String? graduationStream,
    bool? isGraduationCompleted,
    List<String>? subjects,
    List<String>? graduationSubjects,
    bool? isPostGraduationCompleted,
    String? postGraduationDegree,
    String? postGraduationStream,
    List<String>? postGraduationSubjects,
    List<String>? professionalCredentialIds,
    bool? isBedCompleted,
    bool? isDeledCompleted,
    bool? isBstcCompleted,
    bool? isNetQualified,
    bool? isSetQualified,
    bool? isPhdCompleted,
    bool? isLawGraduate,
    String? nursingQualification,
    String? engineeringBranch,
    bool? isCtetQualified,
    bool? isReetQualified,
    bool? isTetQualified,
    String? employmentStatus,
    double? completionPercent,
  }) {
    return WarriorProfile(
      uid: uid ?? this.uid,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      state: state ?? this.state,
      district: district ?? this.district,
      domicileState: domicileState ?? this.domicileState,
      category: category ?? this.category,
      subCategory: subCategory ?? this.subCategory,
      maritalStatus: maritalStatus ?? this.maritalStatus,
      isSAP: isSAP ?? this.isSAP,
      sapCategory: sapCategory ?? this.sapCategory,
      isWidow: isWidow ?? this.isWidow,
      isDivorcee: isDivorcee ?? this.isDivorcee,
      isSeparatedWoman: isSeparatedWoman ?? this.isSeparatedWoman,
      educationLevel: educationLevel ?? this.educationLevel,
      graduationDegree: graduationDegree ?? this.graduationDegree,
      graduationStream: graduationStream ?? this.graduationStream,
      isGraduationCompleted: isGraduationCompleted ?? this.isGraduationCompleted,
      subjects: subjects ?? this.subjects,
      graduationSubjects: graduationSubjects ?? this.graduationSubjects,
      isPostGraduationCompleted: isPostGraduationCompleted ?? this.isPostGraduationCompleted,
      postGraduationDegree: postGraduationDegree ?? this.postGraduationDegree,
      postGraduationStream: postGraduationStream ?? this.postGraduationStream,
      postGraduationSubjects: postGraduationSubjects ?? this.postGraduationSubjects,
      professionalCredentialIds: professionalCredentialIds ?? this.professionalCredentialIds,
      isBedCompleted: isBedCompleted ?? this.isBedCompleted,
      isDeledCompleted: isDeledCompleted ?? this.isDeledCompleted,
      isBstcCompleted: isBstcCompleted ?? this.isBstcCompleted,
      isNetQualified: isNetQualified ?? this.isNetQualified,
      isSetQualified: isSetQualified ?? this.isSetQualified,
      isPhdCompleted: isPhdCompleted ?? this.isPhdCompleted,
      isLawGraduate: isLawGraduate ?? this.isLawGraduate,
      nursingQualification: nursingQualification ?? this.nursingQualification,
      engineeringBranch: engineeringBranch ?? this.engineeringBranch,
      isCtetQualified: isCtetQualified ?? this.isCtetQualified,
      isReetQualified: isReetQualified ?? this.isReetQualified,
      isTetQualified: isTetQualified ?? this.isTetQualified,
      employmentStatus: employmentStatus ?? this.employmentStatus,
      completionPercent: completionPercent ?? this.completionPercent,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'dateOfBirth': dateOfBirth?.millisecondsSinceEpoch,
      'gender': gender,
      'state': state,
      'district': district,
      'domicileState': domicileState,
      'category': category,
      'subCategory': subCategory,
      'maritalStatus': maritalStatus,
      'isSAP': isSAP,
      'sapCategory': sapCategory,
      'isWidow': isWidow,
      'isDivorcee': isDivorcee,
      'isSeparatedWoman': isSeparatedWoman,
      'educationLevel': educationLevel,
      'graduationDegree': graduationDegree,
      'graduationStream': graduationStream,
      'isGraduationCompleted': isGraduationCompleted,
      'subjects': subjects,
      'graduationSubjects': graduationSubjects,
      'isPostGraduationCompleted': isPostGraduationCompleted,
      'postGraduationDegree': postGraduationDegree,
      'postGraduationStream': postGraduationStream,
      'postGraduationSubjects': postGraduationSubjects,
      'professionalCredentialIds': professionalCredentialIds,
      'isBedCompleted': isBedCompleted,
      'isDeledCompleted': isDeledCompleted,
      'isBstcCompleted': isBstcCompleted,
      'isNetQualified': isNetQualified,
      'isSetQualified': isSetQualified,
      'isPhdCompleted': isPhdCompleted,
      'isLawGraduate': isLawGraduate,
      'nursingQualification': nursingQualification,
      'engineeringBranch': engineeringBranch,
      'isCtetQualified': isCtetQualified,
      'isReetQualified': isReetQualified,
      'isTetQualified': isTetQualified,
      'employmentStatus': employmentStatus,
      'completionPercent': completionPercent,
    };
  }

  factory WarriorProfile.fromMap(Map<String, dynamic> map) {
    return WarriorProfile(
      uid: map['uid'] ?? '',
      dateOfBirth: map['dateOfBirth'] != null ? DateTime.fromMillisecondsSinceEpoch(map['dateOfBirth']) : null,
      gender: map['gender'] ?? '',
      state: map['state'] ?? '',
      district: map['district'] ?? '',
      domicileState: map['domicileState'] ?? '',
      category: map['category'] ?? '',
      subCategory: map['subCategory'] ?? '',
      maritalStatus: map['maritalStatus'] ?? '',
      isSAP: map['isSAP'] ?? false,
      sapCategory: map['sapCategory'] ?? '',
      isWidow: map['isWidow'] ?? false,
      isDivorcee: map['isDivorcee'] ?? false,
      isSeparatedWoman: map['isSeparatedWoman'] ?? false,
      educationLevel: map['educationLevel'] ?? '',
      graduationDegree: map['graduationDegree'] ?? '',
      graduationStream: map['graduationStream'] ?? '',
      isGraduationCompleted: map['isGraduationCompleted'] ?? false,
      subjects: List<String>.from(map['subjects'] ?? []),
      graduationSubjects: List<String>.from(map['graduationSubjects'] ?? []),
      isPostGraduationCompleted: map['isPostGraduationCompleted'] ?? false,
      postGraduationDegree: map['postGraduationDegree'] ?? '',
      postGraduationStream: map['postGraduationStream'] ?? '',
      postGraduationSubjects: List<String>.from(map['postGraduationSubjects'] ?? []),
      professionalCredentialIds: List<String>.from(map['professionalCredentialIds'] ?? []),
      isBedCompleted: map['isBedCompleted'] ?? false,
      isDeledCompleted: map['isDeledCompleted'] ?? false,
      isBstcCompleted: map['isBstcCompleted'] ?? false,
      isNetQualified: map['isNetQualified'] ?? false,
      isSetQualified: map['isSetQualified'] ?? false,
      isPhdCompleted: map['isPhdCompleted'] ?? false,
      isLawGraduate: map['isLawGraduate'] ?? false,
      nursingQualification: map['nursingQualification'] ?? '',
      engineeringBranch: map['engineeringBranch'] ?? '',
      isCtetQualified: map['isCtetQualified'] ?? false,
      isReetQualified: map['isReetQualified'] ?? false,
      isTetQualified: map['isTetQualified'] ?? false,
      employmentStatus: map['employmentStatus'] ?? '',
      completionPercent: (map['completionPercent'] ?? 0.0).toDouble(),
    );
  }

  @override
  List<Object?> get props => [
        uid,
        dateOfBirth,
        gender,
        state,
        district,
        domicileState,
        category,
        subCategory,
        maritalStatus,
        isSAP,
        sapCategory,
        isWidow,
        isDivorcee,
        isSeparatedWoman,
        educationLevel,
        graduationDegree,
        graduationStream,
        isGraduationCompleted,
        subjects,
        graduationSubjects,
        isPostGraduationCompleted,
        postGraduationDegree,
        postGraduationStream,
        postGraduationSubjects,
        professionalCredentialIds,
        isBedCompleted,
        isDeledCompleted,
        isBstcCompleted,
        isNetQualified,
        isSetQualified,
        isPhdCompleted,
        isLawGraduate,
        nursingQualification,
        engineeringBranch,
        isCtetQualified,
        isReetQualified,
        isTetQualified,
        employmentStatus,
        completionPercent,
      ];
}
