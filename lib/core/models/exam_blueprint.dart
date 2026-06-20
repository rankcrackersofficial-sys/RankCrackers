/// 🔱 EXAM BLUEPRINT MODELS
/// The "Tactical Rulebook" layer. Defines technical constraints of the battle.

library;

class SubjectSpec {
  final String subjectId;
  final String title;
  final int paperIndex; // 1 for Paper 1, 2 for Paper 2 etc.
  final double marksWeight;
  final int questionCount;
  final bool isMandatory;
  final double qualifyingThreshold; // e.g. 0.40 for 40%

  const SubjectSpec({
    required this.subjectId,
    required this.title,
    required this.paperIndex,
    required this.marksWeight,
    required this.questionCount,
    this.isMandatory = true,
    this.qualifyingThreshold = 0.0,
  });

  Map<String, dynamic> toMap() {
    return {
      'subjectId': subjectId,
      'title': title,
      'paperIndex': paperIndex,
      'marksWeight': marksWeight,
      'questionCount': questionCount,
      'isMandatory': isMandatory,
      'qualifyingThreshold': qualifyingThreshold,
    };
  }

  factory SubjectSpec.fromMap(Map<String, dynamic> map) {
    return SubjectSpec(
      subjectId: map['subjectId'] ?? '',
      title: map['title'] ?? '',
      paperIndex: map['paperIndex'] ?? 0,
      marksWeight: (map['marksWeight'] ?? 0.0).toDouble(),
      questionCount: map['questionCount'] ?? 0,
      isMandatory: map['isMandatory'] ?? true,
      qualifyingThreshold: (map['qualifyingThreshold'] ?? 0.0).toDouble(),
    );
  }
}

class ExamBlueprint {
  final String id;
  final String recruitmentId;
  final List<SubjectSpec> subjects;
  final double negativeMarking; // e.g. 0.33
  final double marksPerQuestion;
  final double totalMarks;
  final int durationMinutes;
  final String status; // draft, review, verified, published, archived
  final int version; 
  final String? promotionBatchId; // 🔱 Added: For referential tracking

  const ExamBlueprint({
    required this.id,
    required this.recruitmentId,
    required this.subjects,
    required this.negativeMarking,
    required this.marksPerQuestion,
    required this.totalMarks,
    required this.durationMinutes,
    this.status = 'draft',
    this.version = 1,
    this.promotionBatchId,
  });

  ExamBlueprint copyWith({
    String? id,
    String? recruitmentId,
    List<SubjectSpec>? subjects,
    double? negativeMarking,
    double? marksPerQuestion,
    double? totalMarks,
    int? durationMinutes,
    String? status,
    int? version,
    String? promotionBatchId,
  }) {
    return ExamBlueprint(
      id: id ?? this.id,
      recruitmentId: recruitmentId ?? this.recruitmentId,
      subjects: subjects ?? this.subjects,
      negativeMarking: negativeMarking ?? this.negativeMarking,
      marksPerQuestion: marksPerQuestion ?? this.marksPerQuestion,
      totalMarks: totalMarks ?? this.totalMarks,
      durationMinutes: durationMinutes ?? this.durationMinutes,
      status: status ?? this.status,
      version: version ?? this.version,
      promotionBatchId: promotionBatchId ?? this.promotionBatchId,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'recruitmentId': recruitmentId,
      'subjects': subjects.map((x) => x.toMap()).toList(),
      'negativeMarking': negativeMarking,
      'marksPerQuestion': marksPerQuestion,
      'totalMarks': totalMarks,
      'durationMinutes': durationMinutes,
      'status': status,
      'version': version,
      'promotionBatchId': promotionBatchId,
    };
  }

  factory ExamBlueprint.fromMap(Map<String, dynamic> map) {
    return ExamBlueprint(
      id: map['id'] ?? '',
      recruitmentId: map['recruitmentId'] ?? '',
      subjects: (map['subjects'] as List?)
              ?.map((x) => SubjectSpec.fromMap(x))
              .toList() ??
          [],
      negativeMarking: (map['negativeMarking'] ?? 0.0).toDouble(),
      marksPerQuestion: (map['marksPerQuestion'] ?? 0.0).toDouble(),
      totalMarks: (map['totalMarks'] ?? 0.0).toDouble(),
      durationMinutes: map['durationMinutes'] ?? 0,
      status: map['status'] ?? 'draft', 
      version: map['version'] ?? 1,
      promotionBatchId: map['promotionBatchId'],
    );
  }
}

/// 🔱 Backward Compatibility Bridge
typedef ExamNotification = ExamBlueprint;
