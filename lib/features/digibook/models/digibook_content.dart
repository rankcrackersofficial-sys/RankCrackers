import '../../../../core/models/atomic_fact.dart';
import '../../../../core/models/question_model.dart';

/// 🔱 DIGIBOOK CONTENT PAYLOAD
/// Decoupled heavy content layer for HyperScale performance.
class DigiBookContent {
  final String nodeId;
  final String learningOutcome; // 🔱 Article 30/36 Compliance
  
  // Immersive Text Layers
  final String beginnerContent;
  final String intermediateContent;
  final String proContent;
  final String academicContent;

  // Atomic Knowledge Layer
  final List<AtomicFact> facts;
  
  // Memory & Revision Layer
  final List<String> oneLiners;
  final List<String> revisionPoints;

  // Combat Layer (Heavier payloads)
  final List<QuestionModel> easyMcqs;
  final List<QuestionModel> mediumMcqs;
  final List<QuestionModel> hardMcqs;
  final List<String> pyqs;

  // Diagnostic Layer
  final List<QuestionModel> diagnosticEasy;
  final List<QuestionModel> diagnosticMedium;
  final List<QuestionModel> diagnosticHard;

  // 🔱 AUDIT TRAIL (Gap-2 Compliance)
  final Map<String, dynamic>? publicationAudit;

  const DigiBookContent({
    required this.nodeId,
    this.learningOutcome = '',
    required this.beginnerContent,
    required this.intermediateContent,
    required this.proContent,
    required this.academicContent,
    required this.facts,
    required this.oneLiners,
    required this.revisionPoints,
    required this.easyMcqs,
    required this.mediumMcqs,
    required this.hardMcqs,
    required this.pyqs,
    this.diagnosticEasy = const [],
    this.diagnosticMedium = const [],
    this.diagnosticHard = const [],
    this.publicationAudit,
  });

  Map<String, dynamic> toMap() {
    return {
      'nodeId': nodeId,
      'learningOutcome': learningOutcome,
      'beginnerContent': beginnerContent,
      'intermediateContent': intermediateContent,
      'proContent': proContent,
      'academicContent': academicContent,
      'facts': facts.map((x) => x.toMap()).toList(),
      'oneLiners': oneLiners,
      'revisionPoints': revisionPoints,
      'easyMcqs': easyMcqs.map((x) => x.toMap()).toList(),
      'mediumMcqs': mediumMcqs.map((x) => x.toMap()).toList(),
      'hardMcqs': hardMcqs.map((x) => x.toMap()).toList(),
      'pyqs': pyqs,
      'diagnosticEasy': diagnosticEasy.map((x) => x.toMap()).toList(),
      'diagnosticMedium': diagnosticMedium.map((x) => x.toMap()).toList(),
      'diagnosticHard': diagnosticHard.map((x) => x.toMap()).toList(),
      'publicationAudit': publicationAudit,
    };
  }

  factory DigiBookContent.fromMap(Map<String, dynamic> map) {
    return DigiBookContent(
      nodeId: map['nodeId'] ?? '',
      learningOutcome: map['learningOutcome'] ?? '',
      beginnerContent: map['beginnerContent'] ?? '',
      intermediateContent: map['intermediateContent'] ?? '',
      proContent: map['proContent'] ?? '',
      academicContent: map['academicContent'] ?? '',
      facts: (map['facts'] as List?)
          ?.map((x) => AtomicFact.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      oneLiners: List<String>.from(map['oneLiners'] ?? []),
      revisionPoints: List<String>.from(map['revisionPoints'] ?? []),
      easyMcqs: (map['easyMcqs'] as List?)
          ?.map((x) => QuestionModel.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      mediumMcqs: (map['mediumMcqs'] as List?)
          ?.map((x) => QuestionModel.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      hardMcqs: (map['hardMcqs'] as List?)
          ?.map((x) => QuestionModel.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      pyqs: List<String>.from(map['pyqs'] ?? []),
      diagnosticEasy: (map['diagnosticEasy'] as List?)
          ?.map((x) => QuestionModel.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      diagnosticMedium: (map['diagnosticMedium'] as List?)
          ?.map((x) => QuestionModel.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      diagnosticHard: (map['diagnosticHard'] as List?)
          ?.map((x) => QuestionModel.fromMap(Map<String, dynamic>.from(x)))
          .toList() ?? [],
      publicationAudit: map['publicationAudit'],
    );
  }
}
