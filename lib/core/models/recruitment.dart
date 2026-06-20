import 'package:equatable/equatable.dart';

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
  final String version;
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
    this.version = '1.0.0',
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
      'version': version,
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
      version: map['version'] ?? '1.0.0',
      examDate: map['examDate'] != null ? DateTime.parse(map['examDate']) : null,
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
    String? version,
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
      version: version ?? this.version,
      examDate: examDate ?? this.examDate,
    );
  }

  @override
  List<Object?> get props => [id, examId, title, year, status];
}
