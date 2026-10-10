import 'package:cloud_firestore/cloud_firestore.dart';

/// NOTIFICATION INTELLIGENCE (v1.2 - Hardened & Compiled)
class NotificationIntelligence {
  final VacancyIntelligence vacancy;
  final ExamIntelligence exam;
  final EligibilityMatrix eligibility;
  final List<AtomicNotificationRule> atomicRules;
  final UserRelevanceEngine userRelevance;
  final ImportantDates dates;
  final FeeMatrix fees;

  NotificationIntelligence({
    required this.vacancy,
    required this.exam,
    required this.eligibility,
    required this.atomicRules,
    required this.userRelevance,
    required this.dates,
    required this.fees,
  });

  Map<String, dynamic> toMap() => {
    'vacancy': vacancy.toMap(),
    'exam': exam.toMap(),
    'eligibility': eligibility.toMap(),
    'atomic_rules': atomicRules.map((e) => e.toMap()).toList(),
    'user_relevance': userRelevance.toMap(),
    'dates': dates.toMap(),
    'fees': fees.toMap(),
  };

  factory NotificationIntelligence.fromMap(Map<String, dynamic> map) {
    return NotificationIntelligence(
      vacancy: VacancyIntelligence.fromMap(map['vacancy'] ?? {}),
      exam: ExamIntelligence.fromMap(map['exam'] ?? {}),
      eligibility: EligibilityMatrix.fromMap(map['eligibility'] ?? {}),
      atomicRules: (map['atomic_rules'] as List? ?? [])
          .map((e) => AtomicNotificationRule.fromMap(Map<String, dynamic>.from(e as Map)))
          .toList(),
      userRelevance: UserRelevanceEngine.fromMap(map['user_relevance'] ?? {}),
      dates: ImportantDates.fromMap(map['dates'] ?? {}),
      fees: FeeMatrix.fromMap(map['fees'] ?? {}),
    );
  }

  NotificationIntelligence copyWith({
    VacancyIntelligence? vacancy,
    ExamIntelligence? exam,
    EligibilityMatrix? eligibility,
    List<AtomicNotificationRule>? atomicRules,
    UserRelevanceEngine? userRelevance,
    ImportantDates? dates,
    FeeMatrix? fees,
  }) {
    return NotificationIntelligence(
      vacancy: vacancy ?? this.vacancy,
      exam: exam ?? this.exam,
      eligibility: eligibility ?? this.eligibility,
      atomicRules: atomicRules ?? this.atomicRules,
      userRelevance: userRelevance ?? this.userRelevance,
      dates: dates ?? this.dates,
      fees: fees ?? this.fees,
    );
  }
}

class VacancyIntelligence {
  final int totalVacancies;
  final List<Map<String, dynamic>> postWise;
  final List<Map<String, dynamic>> districtWise;
  final List<Map<String, dynamic>> categoryWise;
  final List<Map<String, dynamic>> specialBreakdown;

  VacancyIntelligence({
    this.totalVacancies = 0,
    this.postWise = const [],
    this.districtWise = const [],
    this.categoryWise = const [],
    this.specialBreakdown = const [],
  });

  Map<String, dynamic> toMap() => {
    'total_vacancies': totalVacancies,
    'post_wise': postWise,
    'district_wise': districtWise,
    'category_wise': categoryWise,
    'special_breakdown': specialBreakdown,
  };

  factory VacancyIntelligence.fromMap(Map<String, dynamic> map) => VacancyIntelligence(
    totalVacancies: map['total_vacancies'] ?? 0,
    postWise: List<Map<String, dynamic>>.from(map['post_wise'] ?? []),
    districtWise: List<Map<String, dynamic>>.from(map['district_wise'] ?? []),
    categoryWise: List<Map<String, dynamic>>.from(map['category_wise'] ?? []),
    specialBreakdown: List<Map<String, dynamic>>.from(map['special_breakdown'] ?? []),
  );
}

class ExamIntelligence {
  final List<String> stages;
  final List<String> papers;
  final Map<String, dynamic> negativeMarking;
  final Map<String, dynamic> normalization;
  final List<String> selectionProcess;

  ExamIntelligence({
    this.stages = const [],
    this.papers = const [],
    this.negativeMarking = const {},
    this.normalization = const {},
    this.selectionProcess = const [],
  });

  Map<String, dynamic> toMap() => {
    'stages': stages,
    'papers': papers,
    'negative_marking': negativeMarking,
    'normalization': normalization,
    'selection_process': selectionProcess,
  };

  factory ExamIntelligence.fromMap(Map<String, dynamic> map) => ExamIntelligence(
    stages: List<String>.from(map['stages'] ?? []),
    papers: List<String>.from(map['papers'] ?? []),
    negativeMarking: Map<String, dynamic>.from(map['negative_marking'] ?? {}),
    normalization: Map<String, dynamic>.from(map['normalization'] ?? {}),
    selectionProcess: List<String>.from(map['selection_process'] ?? []),
  );
}

class EligibilityMatrix {
  final int? minimumAge;
  final int? maximumAge;
  final List<String> education;
  final List<String> experience;

  EligibilityMatrix({
    this.minimumAge,
    this.maximumAge,
    this.education = const [],
    this.experience = const [],
  });

  Map<String, dynamic> toMap() => {
    'min_age': minimumAge,
    'max_age': maximumAge,
    'education': education,
    'experience': experience,
  };

  factory EligibilityMatrix.fromMap(Map<String, dynamic> map) => EligibilityMatrix(
    minimumAge: map['min_age'],
    maximumAge: map['max_age'],
    education: List<String>.from(map['education'] ?? []),
    experience: List<String>.from(map['experience'] ?? []),
  );
}

class AtomicNotificationRule {
  final String ruleId;
  final String type;
  final String statement;
  final int page;
  final double confidence;

  AtomicNotificationRule({
    required this.ruleId,
    required this.type,
    required this.statement,
    required this.page,
    this.confidence = 0.0,
  });

  Map<String, dynamic> toMap() => {
    'rule_id': ruleId,
    'type': type,
    'statement': statement,
    'page': page,
    'confidence': confidence,
  };

  factory AtomicNotificationRule.fromMap(Map<String, dynamic> map) => AtomicNotificationRule(
    ruleId: map['rule_id'] ?? '',
    type: map['type'] ?? '',
    statement: map['statement'] ?? '',
    page: map['page'] ?? 0,
    confidence: (map['confidence'] ?? 0.0).toDouble(),
  );
}

class UserRelevanceEngine {
  final List<String> eligibleCategories;
  final List<String> specialBenefits;
  final List<String> criticalActions;

  UserRelevanceEngine({
    this.eligibleCategories = const [],
    this.specialBenefits = const [],
    this.criticalActions = const [],
  });

  Map<String, dynamic> toMap() => {
    'eligible_categories': eligibleCategories,
    'special_benefits': specialBenefits,
    'critical_actions': criticalActions,
  };

  factory UserRelevanceEngine.fromMap(Map<String, dynamic> map) => UserRelevanceEngine(
    eligibleCategories: List<String>.from(map['eligible_categories'] ?? []),
    specialBenefits: List<String>.from(map['special_benefits'] ?? []),
    criticalActions: List<String>.from(map['critical_actions'] ?? []),
  );
}

class ImportantDates {
  final DateTime? applicationStart;
  final DateTime? applicationEnd;
  final DateTime? examDate;

  ImportantDates({
    this.applicationStart,
    this.applicationEnd,
    this.examDate,
  });

  Map<String, dynamic> toMap() => {
    'start': applicationStart != null ? Timestamp.fromDate(applicationStart!) : null,
    'end': applicationEnd != null ? Timestamp.fromDate(applicationEnd!) : null,
    'exam': examDate != null ? Timestamp.fromDate(examDate!) : null,
  };

  factory ImportantDates.fromMap(Map<String, dynamic> map) => ImportantDates(
    applicationStart: map['start'] != null ? (map['start'] as Timestamp).toDate() : null,
    applicationEnd: map['end'] != null ? (map['end'] as Timestamp).toDate() : null,
    examDate: map['exam'] != null ? (map['exam'] as Timestamp).toDate() : null,
  );
}

class FeeMatrix {
  final int general;
  final int reserved;

  FeeMatrix({
    this.general = 0,
    this.reserved = 0,
  });

  Map<String, dynamic> toMap() => {
    'general': general,
    'reserved': reserved,
  };

  factory FeeMatrix.fromMap(Map<String, dynamic> map) => FeeMatrix(
    general: map['general'] ?? 0,
    reserved: map['reserved'] ?? 0,
  );
}
