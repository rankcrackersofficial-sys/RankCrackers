import 'package:equatable/equatable.dart';

Map<String, dynamic> _asStringDynamicMap(dynamic value) {
  if (value is Map) return Map<String, dynamic>.from(value);
  return const {};
}

/// 🔱 RECRUITMENT LAW: The Mission Identity.
/// Repesents an official recruitment (e.g., REET 2024, RAS 2025).
class Recruitment extends Equatable {
  final String id;
  final String recruitmentGroupId;
  final String boardId;
  final String examId;
  final String examBlueprintId;
  final String title;
  final String titleHindi;
  final int year;
  final String state;
  final String examCategory;
  final String status;
  final double examDifficulty;
  final String variantCode;
  final Map<String, dynamic> missionVariables;
  final String version;
  final String sourceMissionId;
  final String sourceMissionVersion;
  final String sourcePath;
  final String sourceType;
  final String studentPublicationState;
  final DateTime? examDate;

  const Recruitment({
    required this.id,
    required this.recruitmentGroupId,
    required this.boardId,
    required this.examId,
    required this.examBlueprintId,
    required this.title,
    required this.titleHindi,
    required this.year,
    required this.state,
    required this.examCategory,
    this.status = 'draft',
    this.examDifficulty = 0.6,
    this.variantCode = '',
    this.missionVariables = const {},
    this.version = '1.0.0',
    this.sourceMissionId = '',
    this.sourceMissionVersion = '',
    this.sourcePath = '',
    this.sourceType = '',
    this.studentPublicationState = '',
    this.examDate,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'recruitmentGroupId': recruitmentGroupId,
      'boardId': boardId,
      'examId': examId,
      'examBlueprintId': examBlueprintId,
      'title': title,
      'titleHindi': titleHindi,
      'year': year,
      'state': state,
      'examCategory': examCategory,
      'status': status,
      'examDifficulty': examDifficulty,
      'variantCode': variantCode,
      'missionVariables': missionVariables,
      'version': version,
      'sourceMissionId': sourceMissionId,
      'sourceMissionVersion': sourceMissionVersion,
      'sourcePath': sourcePath,
      'sourceType': sourceType,
      'studentPublicationState': studentPublicationState,
      'examDate': examDate?.toIso8601String(),
    };
  }

  factory Recruitment.fromMap(Map<String, dynamic> map) {
    return Recruitment(
      id: map['id'] ?? '',
      recruitmentGroupId: map['recruitmentGroupId'] ?? '',
      boardId: map['boardId'] ?? '',
      examId: map['examId'] ?? '',
      examBlueprintId: map['examBlueprintId'] ?? '',
      title: map['title'] ?? '',
      titleHindi: map['titleHindi'] ?? '',
      year: map['year'] ?? 0,
      state: map['state'] ?? '',
      examCategory: map['examCategory'] ?? '',
      status: map['status'] ?? 'draft',
      examDifficulty: (map['examDifficulty'] ?? 0.6).toDouble(),
      variantCode: map['variantCode'] ?? '',
      missionVariables: _asStringDynamicMap(map['missionVariables']),
      version: map['version'] ?? '1.0.0',
      sourceMissionId: map['sourceMissionId'] ?? '',
      sourceMissionVersion: map['sourceMissionVersion'] ?? '',
      sourcePath: map['sourcePath'] ?? '',
      sourceType: map['sourceType'] ?? '',
      studentPublicationState: map['studentPublicationState'] ?? '',
      examDate:
          map['examDate'] != null ? DateTime.parse(map['examDate']) : null,
    );
  }

  Recruitment copyWith({
    String? id,
    String? recruitmentGroupId,
    String? boardId,
    String? examId,
    String? examBlueprintId,
    String? title,
    String? titleHindi,
    int? year,
    String? state,
    String? examCategory,
    String? status,
    double? examDifficulty,
    String? variantCode,
    Map<String, dynamic>? missionVariables,
    String? version,
    String? sourceMissionId,
    String? sourceMissionVersion,
    String? sourcePath,
    String? sourceType,
    String? studentPublicationState,
    DateTime? examDate,
  }) {
    return Recruitment(
      id: id ?? this.id,
      recruitmentGroupId: recruitmentGroupId ?? this.recruitmentGroupId,
      boardId: boardId ?? this.boardId,
      examId: examId ?? this.examId,
      examBlueprintId: examBlueprintId ?? this.examBlueprintId,
      title: title ?? this.title,
      titleHindi: titleHindi ?? this.titleHindi,
      year: year ?? this.year,
      state: state ?? this.state,
      examCategory: examCategory ?? this.examCategory,
      status: status ?? this.status,
      examDifficulty: examDifficulty ?? this.examDifficulty,
      variantCode: variantCode ?? this.variantCode,
      missionVariables: missionVariables ?? this.missionVariables,
      version: version ?? this.version,
      sourceMissionId: sourceMissionId ?? this.sourceMissionId,
      sourceMissionVersion: sourceMissionVersion ?? this.sourceMissionVersion,
      sourcePath: sourcePath ?? this.sourcePath,
      sourceType: sourceType ?? this.sourceType,
      studentPublicationState:
          studentPublicationState ?? this.studentPublicationState,
      examDate: examDate ?? this.examDate,
    );
  }

  @override
  List<Object?> get props => [
        id,
        examId,
        title,
        year,
        status,
        missionVariables,
        sourceMissionId,
        sourceMissionVersion,
        sourcePath,
        sourceType,
        studentPublicationState
      ];
}
