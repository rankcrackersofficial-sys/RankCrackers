import 'package:equatable/equatable.dart';

/// 🔱 SYLLABUS CANONICAL (Blueprint v1.0)
/// The Constitutional Knowledge Contract for syllabus decomposition.
class SyllabusCanonical extends Equatable {
  final String subject;
  final String stage; // Pre, Mains, etc.
  final String paper;
  final List<AtomicSyllabusTopic> atomicTopics;
  final double confidenceScore;
  final Map<String, dynamic> metadata;

  const SyllabusCanonical({
    required this.subject,
    this.stage = 'Pre',
    this.paper = '1',
    required this.atomicTopics,
    this.confidenceScore = 0.0,
    this.metadata = const {},
  });

  Map<String, dynamic> toMap() {
    return {
      'subject': subject,
      'stage': stage,
      'paper': paper,
      'atomic_topics': atomicTopics.map((e) => e.toMap()).toList(),
      'confidence_score': confidenceScore,
      'metadata': metadata,
    };
  }

  factory SyllabusCanonical.fromMap(Map<String, dynamic> map) {
    return SyllabusCanonical(
      subject: map['subject'] ?? '',
      stage: map['stage'] ?? 'Pre',
      paper: map['paper'] ?? '1',
      atomicTopics: (map['atomic_topics'] as List? ?? [])
          .map((e) => AtomicSyllabusTopic.fromMap(e))
          .toList(),
      confidenceScore: (map['confidence_score'] ?? 0.0).toDouble(),
      metadata: Map<String, dynamic>.from(map['metadata'] ?? {}),
    );
  }

  @override
  List<Object?> get props => [subject, stage, paper, atomicTopics, confidenceScore];
}

class AtomicSyllabusTopic extends Equatable {
  final String atomicId; // polity_0001
  final String title;
  final List<MicroSyllabusTopic> microTopics;
  final int weightage;

  const AtomicSyllabusTopic({
    required this.atomicId,
    required this.title,
    required this.microTopics,
    this.weightage = 1,
  });

  Map<String, dynamic> toMap() {
    return {
      'atomic_id': atomicId,
      'title': title,
      'micro_topics': microTopics.map((e) => e.toMap()).toList(),
      'weightage': weightage,
    };
  }

  factory AtomicSyllabusTopic.fromMap(Map<String, dynamic> map) {
    return AtomicSyllabusTopic(
      atomicId: map['atomic_id'] ?? '',
      title: map['title'] ?? '',
      microTopics: (map['micro_topics'] as List? ?? [])
          .map((e) => MicroSyllabusTopic.fromMap(e))
          .toList(),
      weightage: map['weightage'] ?? 1,
    );
  }

  @override
  List<Object?> get props => [atomicId, title, microTopics, weightage];
}

class MicroSyllabusTopic extends Equatable {
  final String microId; // polity_0001_m001
  final String title;

  const MicroSyllabusTopic({
    required this.microId,
    required this.title,
  });

  Map<String, dynamic> toMap() {
    return {
      'micro_id': microId,
      'title': title,
    };
  }

  factory MicroSyllabusTopic.fromMap(Map<String, dynamic> map) {
    return MicroSyllabusTopic(
      microId: map['micro_id'] ?? '',
      title: map['title'] ?? '',
    );
  }

  @override
  List<Object?> get props => [microId, title];
}
