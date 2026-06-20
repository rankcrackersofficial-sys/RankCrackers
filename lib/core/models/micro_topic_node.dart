import 'dart:convert';
import 'package:equatable/equatable.dart';

import 'question_model.dart';
import 'atomic_fact.dart';

/// 🔱 MICRO TOPIC NODE (The Sovereign Index)
/// Represents the pure Knowledge Index. Heavy content is decoupled.
class MicroTopicNode extends Equatable {
  final String id;
  final String examId;
  final String variantId;
  final String subjectId;
  final String chapterId;
  final String title;
  final String titleHindi;
  final String learningOutcome; // 🔱 Article 35: Constitutional Learning Objective
  final String subjectHindi;
  final String chapterHindi;
  final String description;

  // 🔱 THE SOVEREIGN POINTER
  final String contentRegistryId; // Maps to Storage/JSON payload

  // 🔱 THE ATOMIC UNIT (Article 6)
  final List<String> atomicTopicIds; 
  final int factCount; 

  // 🔱 THE RELATIONAL BACKBONE (Article 14)
  final List<String> prerequisiteIds;
  final List<String> dependentIds;
  final List<String> relatedIds;
  final List<String> revisionChainIds;

  // 🔱 METADATA
  final int difficulty;
  final int importance;
  final int weightage;
  final String status;
  
  // 🔱 DIAGNOSTIC FIELDS (Article 15)
  final bool isDiagnosticEligible;
  final int pyqFrequency;

  // 🔱 ADMINISTRATIVE METADATA
  final String sourceBook;
  final String sourcePage;
  final String sourceUploadId;
  final String? promotionBatchId;

  // 🔱 DECOUPLED CONTENT PROXIES (For stability during transition)
  String get beginnerContent => '';
  String get intermediateContent => '';
  String get proContent => '';
  String get academicContent => '';
  List<String> get oneLiners => const [];
  List<String> get revisionPoints => const [];
  List<AtomicFact> get facts => const [];
  List<QuestionModel> get easyMcqs => const [];
  List<QuestionModel> get mediumMcqs => const [];
  List<QuestionModel> get hardMcqs => const [];
  List<String> get pyqs => const [];
  List<QuestionModel> get diagnosticEasy => const [];
  List<QuestionModel> get diagnosticMedium => const [];
  List<QuestionModel> get diagnosticHard => const [];

  const MicroTopicNode({
    required this.id,
    required this.examId,
    this.variantId = '',
    required this.subjectId,
    required this.chapterId,
    required this.title,
    required this.titleHindi,
    this.learningOutcome = '',
    required this.subjectHindi,
    required this.chapterHindi,
    required this.description,
    required this.contentRegistryId,
    this.atomicTopicIds = const [],
    this.factCount = 0,
    this.prerequisiteIds = const [],
    this.dependentIds = const [],
    this.relatedIds = const [],
    this.revisionChainIds = const [],
    required this.difficulty,
    required this.importance,
    this.weightage = 1,
    this.status = 'draft',
    this.isDiagnosticEligible = true,
    this.pyqFrequency = 0,
    this.sourceBook = '',
    this.sourcePage = '',
    this.sourceUploadId = '',
    this.promotionBatchId,
  });

  // 🔱 LEGACY GETTERS FOR STABILIZATION
  String get subject => subjectId;
  String get chapter => chapterId;
  String get topic => title;
  String get topicHindi => titleHindi;
  List<String> get linkedNodeIds => [...prerequisiteIds, ...dependentIds, ...relatedIds];

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'examId': examId,
      'variantId': variantId,
      'subjectId': subjectId,
      'chapterId': chapterId,
      'title': title,
      'titleHindi': titleHindi,
      'learningOutcome': learningOutcome,
      'subjectHindi': subjectHindi,
      'chapterHindi': chapterHindi,
      'description': description,
      'contentRegistryId': contentRegistryId,
      'atomicTopicIds': atomicTopicIds,
      'factCount': factCount,
      'prerequisiteIds': prerequisiteIds,
      'dependentIds': dependentIds,
      'relatedIds': relatedIds,
      'revisionChainIds': revisionChainIds,
      'difficulty': difficulty,
      'importance': importance,
      'weightage': weightage,
      'status': status,
      'isDiagnosticEligible': isDiagnosticEligible,
      'pyqFrequency': pyqFrequency,
      'sourceBook': sourceBook,
      'sourcePage': sourcePage,
      'sourceUploadId': sourceUploadId,
      'promotionBatchId': promotionBatchId,
    };
  }

  factory MicroTopicNode.fromMap(Map<String, dynamic> map) {
    return MicroTopicNode(
      id: map['id'] ?? '',
      examId: map['examId'] ?? '',
      variantId: map['variantId'] ?? '',
      subjectId: map['subjectId'] ?? '',
      chapterId: map['chapterId'] ?? '',
      title: map['title'] ?? '',
      titleHindi: map['titleHindi'] ?? '',
      learningOutcome: map['learningOutcome'] ?? '',
      subjectHindi: map['subjectHindi'] ?? '',
      chapterHindi: map['chapterHindi'] ?? '',
      description: map['description'] ?? '',
      contentRegistryId: map['contentRegistryId'] ?? '',
      atomicTopicIds: List<String>.from(map['atomicTopicIds'] ?? []),
      factCount: map['factCount'] ?? 0,
      prerequisiteIds: List<String>.from(map['prerequisiteIds'] ?? []),
      dependentIds: List<String>.from(map['dependentIds'] ?? []),
      relatedIds: List<String>.from(map['relatedIds'] ?? []),
      revisionChainIds: List<String>.from(map['revisionChainIds'] ?? []),
      difficulty: map['difficulty'] ?? 2,
      importance: map['importance'] ?? 3,
      weightage: map['weightage'] ?? 1,
      status: map['status'] ?? 'draft',
      isDiagnosticEligible: map['isDiagnosticEligible'] ?? true,
      pyqFrequency: map['pyqFrequency'] ?? 0,
      sourceBook: map['sourceBook'] ?? '',
      sourcePage: map['sourcePage'] ?? '',
      sourceUploadId: map['sourceUploadId'] ?? '',
      promotionBatchId: map['promotionBatchId'],
    );
  }

  MicroTopicNode copyWith({
    String? id,
    String? examId,
    String? variantId,
    String? subjectId,
    String? chapterId,
    String? title,
    String? titleHindi,
    String? learningOutcome,
    String? subjectHindi,
    String? chapterHindi,
    String? description,
    String? contentRegistryId,
    List<String>? atomicTopicIds,
    int? factCount,
    List<String>? prerequisiteIds,
    List<String>? dependentIds,
    List<String>? relatedIds,
    List<String>? revisionChainIds,
    int? difficulty,
    int? importance,
    int? weightage,
    String? status,
    bool? isDiagnosticEligible,
    int? pyqFrequency,
    String? sourceBook,
    String? sourcePage,
    String? sourceUploadId,
    String? promotionBatchId,
  }) {
    return MicroTopicNode(
      id: id ?? this.id,
      examId: examId ?? this.examId,
      variantId: variantId ?? this.variantId,
      subjectId: subjectId ?? this.subjectId,
      chapterId: chapterId ?? this.chapterId,
      title: title ?? this.title,
      titleHindi: titleHindi ?? this.titleHindi,
      learningOutcome: learningOutcome ?? this.learningOutcome,
      subjectHindi: subjectHindi ?? this.subjectHindi,
      chapterHindi: chapterHindi ?? this.chapterHindi,
      description: description ?? this.description,
      contentRegistryId: contentRegistryId ?? this.contentRegistryId,
      atomicTopicIds: atomicTopicIds ?? this.atomicTopicIds,
      factCount: factCount ?? this.factCount,
      prerequisiteIds: prerequisiteIds ?? this.prerequisiteIds,
      dependentIds: dependentIds ?? this.dependentIds,
      relatedIds: relatedIds ?? this.relatedIds,
      revisionChainIds: revisionChainIds ?? this.revisionChainIds,
      difficulty: difficulty ?? this.difficulty,
      importance: importance ?? this.importance,
      weightage: weightage ?? this.weightage,
      status: status ?? this.status,
      isDiagnosticEligible: isDiagnosticEligible ?? this.isDiagnosticEligible,
      pyqFrequency: pyqFrequency ?? this.pyqFrequency,
      sourceBook: sourceBook ?? this.sourceBook,
      sourcePage: sourcePage ?? this.sourcePage,
      sourceUploadId: sourceUploadId ?? this.sourceUploadId,
      promotionBatchId: promotionBatchId ?? this.promotionBatchId,
    );
  }

  String toJson() => json.encode(toMap());

  @override
  List<Object?> get props => [
        id,
        examId,
        variantId,
        subjectId,
        chapterId,
        title,
        titleHindi,
        learningOutcome,
        subjectHindi,
        chapterHindi,
        description,
        contentRegistryId,
        atomicTopicIds,
        factCount,
        prerequisiteIds,
        dependentIds,
        relatedIds,
        revisionChainIds,
        difficulty,
        importance,
        weightage,
        status,
        isDiagnosticEligible,
        pyqFrequency,
        sourceBook,
        sourcePage,
        sourceUploadId,
        promotionBatchId,
      ];
}
