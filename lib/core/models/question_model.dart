import 'question_difficulty.dart';
import '../utils/temporal_normalizer.dart';

/// 🔱 QUESTION MODEL (Document 27 Compliant)
/// The constitutional source of assessment evidence.
class QuestionModel {
  final String id;
  final String nodeId;
  final String? factId; 
  final List<String> atomicTopicIds; 
  final String examId;
  final String subjectId;
  final String question;
  final List<String> options;
  final int answerIndex;
  final QuestionDifficulty difficulty;
  
  // 🔱 GOVERNANCE FIELDS (Section 35-38)
  final String status; // draft, review, verified, published, archived
  final int version;
  final String lastAdminId;
  final String lastAction; 
  final DateTime updatedAt;
  final String? verifiedBy; // 🔱 Added: Human Authority Law
  final DateTime? verifiedAt; // 🔱 Added: Verification Traceability
  final String sourceType; 
  final bool isPYQ; // 🔱 Added: Constitutional Evidence Law
  
  // 🔱 C2-FIX2 HARDENED FIELDS
  final String? questionType; // mcq_single, numerical
  final String? solution; // explanation / worked solution
  final String? questionLineageId; // logical item identity key
  
  // 🔱 C2-FIX4 SECURITY & DECIMAL FIELDS
  final double? numericalAnswer; // signed decimal/double numerical answer

  const QuestionModel({
    required this.id,
    required this.nodeId,
    this.factId,
    this.atomicTopicIds = const [],
    required this.examId,
    required this.subjectId,
    required this.question,
    required this.options,
    required this.answerIndex,
    required this.difficulty,
    this.status = 'draft',
    this.version = 1,
    this.lastAdminId = 'system',
    this.lastAction = 'created',
    required this.updatedAt,
    this.verifiedBy,
    this.verifiedAt,
    this.sourceType = 'admin',
    this.isPYQ = false,
    this.questionType,
    this.solution,
    this.questionLineageId,
    this.numericalAnswer,
  });

  QuestionModel copyWith({
    String? id,
    String? nodeId,
    String? factId,
    List<String>? atomicTopicIds,
    String? examId,
    String? subjectId,
    String? question,
    List<String>? options,
    int? answerIndex,
    QuestionDifficulty? difficulty,
    String? status,
    int? version,
    String? lastAdminId,
    String? lastAction,
    DateTime? updatedAt,
    String? verifiedBy,
    DateTime? verifiedAt,
    String? sourceType,
    bool? isPYQ,
    String? questionType,
    String? solution,
    String? questionLineageId,
    double? numericalAnswer,
  }) {
    return QuestionModel(
      id: id ?? this.id,
      nodeId: nodeId ?? this.nodeId,
      factId: factId ?? this.factId,
      atomicTopicIds: atomicTopicIds ?? this.atomicTopicIds,
      examId: examId ?? this.examId,
      subjectId: subjectId ?? this.subjectId,
      question: question ?? this.question,
      options: options ?? this.options,
      answerIndex: answerIndex ?? this.answerIndex,
      difficulty: difficulty ?? this.difficulty,
      status: status ?? this.status,
      version: version ?? this.version,
      lastAdminId: lastAdminId ?? this.lastAdminId,
      lastAction: lastAction ?? this.lastAction,
      updatedAt: updatedAt ?? this.updatedAt,
      verifiedBy: verifiedBy ?? this.verifiedBy,
      verifiedAt: verifiedAt ?? this.verifiedAt,
      sourceType: sourceType ?? this.sourceType,
      isPYQ: isPYQ ?? this.isPYQ,
      questionType: questionType ?? this.questionType,
      solution: solution ?? this.solution,
      questionLineageId: questionLineageId ?? this.questionLineageId,
      numericalAnswer: numericalAnswer ?? this.numericalAnswer,
    );
  }

  /// Returns a copy of the question with correct answer and solution stripped out.
  QuestionModel toStudentSafeProjection() {
    return QuestionModel(
      id: id,
      nodeId: nodeId,
      factId: factId,
      atomicTopicIds: atomicTopicIds,
      examId: examId,
      subjectId: subjectId,
      question: question,
      options: options,
      answerIndex: -1, // Staged sentinel / masked value
      difficulty: difficulty,
      status: status,
      version: version,
      lastAdminId: lastAdminId,
      lastAction: lastAction,
      updatedAt: updatedAt,
      verifiedBy: verifiedBy,
      verifiedAt: verifiedAt,
      sourceType: sourceType,
      isPYQ: isPYQ,
      questionType: questionType,
      solution: null, // Private solution hidden
      questionLineageId: questionLineageId,
      numericalAnswer: null, // Private numerical answer hidden
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'nodeId': nodeId,
      'factId': factId,
      'atomicTopicIds': atomicTopicIds,
      'examId': examId,
      'subjectId': subjectId,
      'question': question,
      'options': options,
      'answerIndex': answerIndex,
      'difficulty': difficulty.name,
      'status': status,
      'version': version,
      'lastAdminId': lastAdminId,
      'lastAction': lastAction,
      'updatedAt': updatedAt.millisecondsSinceEpoch,
      'verifiedBy': verifiedBy,
      'verifiedAt': verifiedAt?.millisecondsSinceEpoch,
      'sourceType': sourceType,
      'isPYQ': isPYQ,
      'questionType': questionType,
      'solution': solution,
      'questionLineageId': questionLineageId,
      'numericalAnswer': numericalAnswer,
    };
  }

  factory QuestionModel.fromMap(Map<String, dynamic> map) {
    return QuestionModel(
      id: map['id'] ?? '',
      nodeId: map['nodeId'] ?? '',
      factId: map['factId'],
      atomicTopicIds: List<String>.from(map['atomicTopicIds'] ?? []),
      examId: map['examId'] ?? '',
      subjectId: map['subjectId'] ?? '',
      question: map['question'] ?? '',
      options: List<String>.from(map['options'] ?? []),
      answerIndex: map['answerIndex'] ?? 0,
      difficulty: QuestionDifficulty.values.firstWhere(
        (e) => e.name == map['difficulty'],
        orElse: () => QuestionDifficulty.medium,
      ),
      status: map['status'] ?? 'draft', 
      version: map['version'] ?? 1,
      lastAdminId: map['lastAdminId'] ?? 'system',
      lastAction: map['lastAction'] ?? 'verified',
      updatedAt: TemporalNormalizer.parseRequired(
        map['updatedAt'],
        fallback: DateTime.fromMillisecondsSinceEpoch(0),
        fieldName: 'updatedAt',
      ),
      verifiedBy: map['verifiedBy'],
      verifiedAt: TemporalNormalizer.parseOptional(
        map['verifiedAt'],
        fieldName: 'verifiedAt',
      ),
      sourceType: map['sourceType'] ?? 'admin',
      isPYQ: map['isPYQ'] ?? false,
      questionType: map['questionType'],
      solution: map['solution'],
      questionLineageId: map['questionLineageId'],
      numericalAnswer: map['numericalAnswer'] != null 
          ? (map['numericalAnswer'] as num).toDouble() 
          : null,
    );
  }
}
