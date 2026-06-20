import 'package:equatable/equatable.dart';

/// 🔱 ATOMIC TOPIC (Document 30 Compliant - Hardened)
/// The smallest assessable unit and constitutional unit of coverage.
class AtomicTopic extends Equatable {
  final String id;
  final String microTopicId;
  final String macroTopicId;
  final String subjectId;
  final String title;
  final String description;
  final List<String> prerequisiteIds;
  final List<String> dependencyIds;
  
  // 🔱 CORE FLAGS
  final bool assessmentEligible;
  final bool digibookAvailable;
  final bool crucibleMapped;
  
  // 🔱 INTELLIGENCE METRICS (Audit v1.1)
  final int difficulty; // 1-5
  final int importance; // 1-5
  final int frequency; // Number of times asked across exams
  final int pyqCount; // Total PYQs linked
  final int? lastAskedYear;
  final double coverageWeight; // Weightage in syllabus coverage
  final double masteryWeight; // Impact on readiness score
  
  final String status; // draft, review, verified, published, archived
  final int version;

  const AtomicTopic({
    required this.id,
    required this.microTopicId,
    required this.macroTopicId,
    required this.subjectId,
    required this.title,
    required this.description,
    this.prerequisiteIds = const [],
    this.dependencyIds = const [],
    this.assessmentEligible = true,
    this.digibookAvailable = true,
    this.crucibleMapped = true,
    this.difficulty = 3,
    this.importance = 3,
    this.frequency = 0,
    this.pyqCount = 0,
    this.lastAskedYear,
    this.coverageWeight = 1.0,
    this.masteryWeight = 1.0,
    this.status = 'draft',
    this.version = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'microTopicId': microTopicId,
      'macroTopicId': macroTopicId,
      'subjectId': subjectId,
      'title': title,
      'description': description,
      'prerequisiteIds': prerequisiteIds,
      'dependencyIds': dependencyIds,
      'assessmentEligible': assessmentEligible,
      'digibookAvailable': digibookAvailable,
      'crucibleMapped': crucibleMapped,
      'difficulty': difficulty,
      'importance': importance,
      'frequency': frequency,
      'pyqCount': pyqCount,
      'lastAskedYear': lastAskedYear,
      'coverageWeight': coverageWeight,
      'masteryWeight': masteryWeight,
      'status': status,
      'version': version,
    };
  }

  factory AtomicTopic.fromMap(Map<String, dynamic> map) {
    return AtomicTopic(
      id: map['id'] ?? '',
      microTopicId: map['microTopicId'] ?? '',
      macroTopicId: map['macroTopicId'] ?? '',
      subjectId: map['subjectId'] ?? '',
      title: map['title'] ?? '',
      description: map['description'] ?? '',
      prerequisiteIds: List<String>.from(map['prerequisiteIds'] ?? []),
      dependencyIds: List<String>.from(map['dependencyIds'] ?? []),
      assessmentEligible: map['assessmentEligible'] ?? true,
      digibookAvailable: map['digibookAvailable'] ?? true,
      crucibleMapped: map['crucibleMapped'] ?? true,
      difficulty: map['difficulty'] ?? 3,
      importance: map['importance'] ?? 3,
      frequency: map['frequency'] ?? 0,
      pyqCount: map['pyqCount'] ?? 0,
      lastAskedYear: map['lastAskedYear'],
      coverageWeight: (map['coverageWeight'] ?? 1.0).toDouble(),
      masteryWeight: (map['masteryWeight'] ?? 1.0).toDouble(),
      status: map['status'] ?? 'draft',
      version: map['version'] ?? 1,
    );
  }

  AtomicTopic copyWith({
    String? id,
    String? microTopicId,
    String? macroTopicId,
    String? subjectId,
    String? title,
    String? description,
    List<String>? prerequisiteIds,
    List<String>? dependencyIds,
    bool? assessmentEligible,
    bool? digibookAvailable,
    bool? crucibleMapped,
    int? difficulty,
    int? importance,
    int? frequency,
    int? pyqCount,
    int? lastAskedYear,
    double? coverageWeight,
    double? masteryWeight,
    String? status,
    int? version,
  }) {
    return AtomicTopic(
      id: id ?? this.id,
      microTopicId: microTopicId ?? this.microTopicId,
      macroTopicId: macroTopicId ?? this.macroTopicId,
      subjectId: subjectId ?? this.subjectId,
      title: title ?? this.title,
      description: description ?? this.description,
      prerequisiteIds: prerequisiteIds ?? this.prerequisiteIds,
      dependencyIds: dependencyIds ?? this.dependencyIds,
      assessmentEligible: assessmentEligible ?? this.assessmentEligible,
      digibookAvailable: digibookAvailable ?? this.digibookAvailable,
      crucibleMapped: crucibleMapped ?? this.crucibleMapped,
      difficulty: difficulty ?? this.difficulty,
      importance: importance ?? this.importance,
      frequency: frequency ?? this.frequency,
      pyqCount: pyqCount ?? this.pyqCount,
      lastAskedYear: lastAskedYear ?? this.lastAskedYear,
      coverageWeight: coverageWeight ?? this.coverageWeight,
      masteryWeight: masteryWeight ?? this.masteryWeight,
      status: status ?? this.status,
      version: version ?? this.version,
    );
  }

  @override
  List<Object?> get props => [
        id,
        microTopicId,
        macroTopicId,
        subjectId,
        title,
        description,
        prerequisiteIds,
        dependencyIds,
        assessmentEligible,
        digibookAvailable,
        crucibleMapped,
        difficulty,
        importance,
        frequency,
        pyqCount,
        lastAskedYear,
        coverageWeight,
        masteryWeight,
        status,
        version,
      ];
}
