import 'package:equatable/equatable.dart';
import 'education_record.dart';

/// WARRIOR PROFILE MODEL (Document 50A Phase 8 Hardened)
/// Represents the comprehensive eligibility and educational profile of a warrior.
class WarriorProfile extends Equatable {
  final String uid;
  final DateTime? dateOfBirth;
  final String gender;
  
  // Eligibility Baseline
  final String state;
  final String district;
  final String domicileState; 
  final String category; // General, OBC, SC, ST, EWS
  final String subCategory;
  final String maritalStatus;
  
  // Special Relaxations
  final bool isSAP; // Specially Abled Person
  final String sapCategory;
  final bool isWidow;
  final bool isDivorcee;
  final bool isSeparatedWoman;

  // Qualification Layer
  final String educationLevel;
  final String graduationDegree; // e.g. BA, BSc, BTech
  final String graduationStream;
  final bool isGraduationCompleted;
  final List<String> subjects;
  final List<String> graduationSubjects;

  // Post Graduation
  final bool isPostGraduationCompleted;
  final String postGraduationDegree; // e.g. MA, MSc, MTech
  final String postGraduationStream;
  final List<String> postGraduationSubjects;

  // Professional & Technical Qualifications (Phase 7 Dynamic)
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

  // Eligibility Tests
  final bool isCtetQualified;
  final bool isReetQualified;
  final bool isTetQualified;

  // Operational Data
  final String employmentStatus;
  final double completionPercent;

  // Progressive Career Profile Fields
  final String currentEducationStage;
  final String academicStream;
  final List<String> subjectsStudied;
  final String highestQualification;
  final List<String> otherGoals;
  final List<String> careerInterests;
  final String preferredSector;
  final String locationPreference;
  final String studyPreference;
  final String degreeSpecialization;
  final String degreeCompletionStatus;
  final String degreeYearOfCompletion;

  // 🔱 PHASE 8: MULTI-EDUCATION HISTORY
  final List<EducationRecord> educationRecords;

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
    this.currentEducationStage = '',
    this.academicStream = '',
    this.subjectsStudied = const [],
    this.highestQualification = '',
    this.otherGoals = const [],
    this.careerInterests = const [],
    this.preferredSector = '',
    this.locationPreference = '',
    this.studyPreference = '',
    this.degreeSpecialization = '',
    this.degreeCompletionStatus = '',
    this.degreeYearOfCompletion = '',
    this.educationRecords = const [],
  });

  /// 🔱 DERIVE HIGHEST COMPLETED QUALIFICATION
  String get derivedHighestQualification {
    if (educationRecords.isEmpty) return highestQualification;

    final academicLevels = {
      'Class 10',
      'Class 12',
      'Diploma',
      'Bachelor\'s Degree',
      'Master\'s Degree',
      'Doctorate / PhD',
    };

    final completed = educationRecords
        .where((r) => r.status == 'Completed' && academicLevels.contains(r.level))
        .toList();

    if (completed.isEmpty) return 'No Qualification Verified';

    // Simplified rank for derivation
    final rankMap = {
      'Class 10': 1,
      'Class 12': 2,
      'Diploma': 3,
      'Bachelor\'s Degree': 4,
      'Master\'s Degree': 5,
      'Doctorate / PhD': 6,
    };

    completed.sort((a, b) {
      final rankA = rankMap[a.level] ?? 0;
      final rankB = rankMap[b.level] ?? 0;
      return rankB.compareTo(rankA); // Descending
    });

    return completed.first.level;
  }

  /// 🔱 SYNC LEGACY FIELDS FROM EDUCATION RECORDS
  WarriorProfile syncLegacyFields() {
    String hq = highestQualification;
    String gDeg = graduationDegree;
    bool isGradComp = isGraduationCompleted;
    List<String> gSubs = List<String>.from(graduationSubjects);
    String pgDeg = postGraduationDegree;
    bool isPgComp = isPostGraduationCompleted;
    List<String> pgSubs = List<String>.from(postGraduationSubjects);
    List<String> sStudied = List<String>.from(subjectsStudied);
    String degStatus = degreeCompletionStatus;

    // Derived Highest Qualification
    hq = derivedHighestQualification;

    // Sync from records
    for (var record in educationRecords) {
      if (record.level == "Bachelor's Degree") {
        gDeg = record.degreeId ?? '';
        isGradComp = record.status == 'Completed';
        gSubs = record.subjectIds;
        degStatus = record.status;
      } else if (record.level == "Master's Degree") {
        pgDeg = record.degreeId ?? '';
        isPgComp = record.status == 'Completed';
        pgSubs = record.subjectIds;
      } else if (record.level == "Class 12" || record.level == "Class 10") {
        // Merge subjects studied for 10/12 into a single list for simple consumers
        for (var sub in record.subjectIds) {
          if (!sStudied.contains(sub)) sStudied.add(sub);
        }
      }
    }

    return copyWith(
      highestQualification: hq,
      graduationDegree: gDeg,
      isGraduationCompleted: isGradComp,
      graduationSubjects: gSubs,
      postGraduationDegree: pgDeg,
      isPostGraduationCompleted: isPgComp,
      postGraduationSubjects: pgSubs,
      subjectsStudied: sStudied,
      degreeCompletionStatus: degStatus,
    );
  }

  /// Career Profile Complete Details Count
  int get careerProfileAddedCount {
    int count = 0;
    if (currentEducationStage.isNotEmpty) count++;
    if (academicStream.isNotEmpty) count++;
    if (subjectsStudied.isNotEmpty || (educationRecords.any((r) => r.subjectIds.isNotEmpty))) count++;
    if (educationRecords.isNotEmpty) count++;
    if (careerInterests.isNotEmpty) count++;
    if (otherGoals.isNotEmpty) count++;
    if (preferredSector.isNotEmpty || locationPreference.isNotEmpty || studyPreference.isNotEmpty) count++;
    return count;
  }

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
    String? currentEducationStage,
    String? academicStream,
    List<String>? subjectsStudied,
    String? highestQualification,
    List<String>? otherGoals,
    List<String>? careerInterests,
    String? preferredSector,
    String? locationPreference,
    String? studyPreference,
    String? degreeSpecialization,
    String? degreeCompletionStatus,
    String? degreeYearOfCompletion,
    List<EducationRecord>? educationRecords,
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
      currentEducationStage: currentEducationStage ?? this.currentEducationStage,
      academicStream: academicStream ?? this.academicStream,
      subjectsStudied: subjectsStudied ?? this.subjectsStudied,
      highestQualification: highestQualification ?? this.highestQualification,
      otherGoals: otherGoals ?? this.otherGoals,
      careerInterests: careerInterests ?? this.careerInterests,
      preferredSector: preferredSector ?? this.preferredSector,
      locationPreference: locationPreference ?? this.locationPreference,
      studyPreference: studyPreference ?? this.studyPreference,
      degreeSpecialization: degreeSpecialization ?? this.degreeSpecialization,
      degreeCompletionStatus: degreeCompletionStatus ?? this.degreeCompletionStatus,
      degreeYearOfCompletion: degreeYearOfCompletion ?? this.degreeYearOfCompletion,
      educationRecords: educationRecords ?? this.educationRecords,
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
      'currentEducationStage': currentEducationStage,
      'academicStream': academicStream,
      'subjectsStudied': subjectsStudied,
      'highestQualification': highestQualification,
      'otherGoals': otherGoals,
      'careerInterests': careerInterests,
      'preferredSector': preferredSector,
      'locationPreference': locationPreference,
      'studyPreference': studyPreference,
      'degreeSpecialization': degreeSpecialization,
      'degreeCompletionStatus': degreeCompletionStatus,
      'degreeYearOfCompletion': degreeYearOfCompletion,
      'educationRecords': educationRecords.map((x) => x.toMap()).toList(),
    };
  }

  factory WarriorProfile.fromMap(Map<String, dynamic> map) {
    var records = (map['educationRecords'] as List?)
        ?.map((x) => EducationRecord.fromMap(Map<String, dynamic>.from(x)))
        .toList() ?? [];

    if (records.isEmpty) {
      final List<EducationRecord> migrated = [];
      
      final String gradDeg = map['graduationDegree'] ?? '';
      if (gradDeg.isNotEmpty) {
        migrated.add(EducationRecord(
          id: 'migrated_ug',
          level: "Bachelor's Degree",
          degreeId: gradDeg,
          status: (map['isGraduationCompleted'] ?? false) ? 'Completed' : 'Pursuing',
          subjectIds: List<String>.from(map['graduationSubjects'] ?? []),
        ));
      }

      final String pgDeg = map['postGraduationDegree'] ?? '';
      if (pgDeg.isNotEmpty) {
        migrated.add(EducationRecord(
          id: 'migrated_pg',
          level: "Master's Degree",
          degreeId: pgDeg,
          status: (map['isPostGraduationCompleted'] ?? false) ? 'Completed' : 'Pursuing',
          subjectIds: List<String>.from(map['postGraduationSubjects'] ?? []),
        ));
      }

      final List<String> subStudied = List<String>.from(map['subjectsStudied'] ?? []);
      final String stage = map['currentEducationStage'] ?? '';
      if (subStudied.isNotEmpty) {
        if (stage == 'Class 10') {
          migrated.add(EducationRecord(
            id: 'migrated_10',
            level: 'Class 10',
            status: 'Completed',
            subjectIds: subStudied,
          ));
        } else {
          migrated.add(EducationRecord(
            id: 'migrated_12',
            level: 'Class 12',
            status: 'Completed',
            subjectIds: subStudied,
          ));
        }
      }
      records = migrated;
    }

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
      currentEducationStage: map['currentEducationStage'] ?? '',
      academicStream: map['academicStream'] ?? '',
      subjectsStudied: List<String>.from(map['subjectsStudied'] ?? []),
      highestQualification: map['highestQualification'] ?? '',
      otherGoals: List<String>.from(map['otherGoals'] ?? []),
      careerInterests: List<String>.from(map['careerInterests'] ?? []),
      preferredSector: map['preferredSector'] ?? '',
      locationPreference: map['locationPreference'] ?? '',
      studyPreference: map['studyPreference'] ?? '',
      degreeSpecialization: map['degreeSpecialization'] ?? '',
      degreeCompletionStatus: map['degreeCompletionStatus'] ?? '',
      degreeYearOfCompletion: map['degreeYearOfCompletion'] ?? '',
      educationRecords: records,
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
        currentEducationStage,
        academicStream,
        subjectsStudied,
        highestQualification,
        otherGoals,
        careerInterests,
        preferredSector,
        locationPreference,
        studyPreference,
        degreeSpecialization,
        degreeCompletionStatus,
        degreeYearOfCompletion,
        educationRecords,
      ];
}
