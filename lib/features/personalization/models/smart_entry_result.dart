import 'package:equatable/equatable.dart';
import 'student_learning_level.dart';

/// SMART ENTRY RESULT
/// Multi-dimensional outcome of the provisional baseline diagnostic.
class SmartEntryResult extends Equatable {
  final LearningLevel globalLevel;
  final Map<String, LearningLevel> subjectLevels;
  final double classificationConfidence;
  final String diagnosticVersion;
  final List<String> evidenceItemIds;
  final bool isProvisional;
  final DateTime createdAt;

  const SmartEntryResult({
    required this.globalLevel,
    required this.subjectLevels,
    required this.classificationConfidence,
    required this.diagnosticVersion,
    required this.evidenceItemIds,
    this.isProvisional = true,
    required this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'globalLevel': globalLevel.name,
      'subjectLevels': subjectLevels.map((k, v) => MapEntry(k, v.name)),
      'classificationConfidence': classificationConfidence,
      'diagnosticVersion': diagnosticVersion,
      'evidenceItemIds': evidenceItemIds,
      'isProvisional': isProvisional,
      'createdAt': createdAt.millisecondsSinceEpoch,
    };
  }

  factory SmartEntryResult.fromMap(Map<String, dynamic> map) {
    return SmartEntryResult(
      globalLevel: LearningLevel.values.firstWhere(
        (e) => e.name == map['globalLevel'],
        orElse: () => LearningLevel.middle,
      ),
      subjectLevels: (map['subjectLevels'] as Map<String, dynamic>? ?? {}).map(
        (k, v) => MapEntry(
          k,
          LearningLevel.values.firstWhere(
            (e) => e.name == v,
            orElse: () => LearningLevel.middle,
          ),
        ),
      ),
      classificationConfidence: (map['classificationConfidence'] as num?)?.toDouble() ?? 0.5,
      diagnosticVersion: map['diagnosticVersion'] ?? 'v3.0',
      evidenceItemIds: List<String>.from(map['evidenceItemIds'] ?? []),
      isProvisional: map['isProvisional'] ?? true,
      createdAt: DateTime.fromMillisecondsSinceEpoch(map['createdAt'] ?? 0),
    );
  }

  @override
  List<Object?> get props => [
        globalLevel,
        subjectLevels,
        classificationConfidence,
        diagnosticVersion,
        evidenceItemIds,
        isProvisional,
        createdAt,
      ];
}
