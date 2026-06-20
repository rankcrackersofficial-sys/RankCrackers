import 'subject_model.dart';

class ExamSyllabusModel {

  final String examId;

  final String examName;

  final List<SubjectModel> subjects;

  const ExamSyllabusModel({

    required this.examId,

    required this.examName,

    required this.subjects,
  });
}