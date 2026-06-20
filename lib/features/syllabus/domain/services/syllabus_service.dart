import '../../data/local_syllabus_database.dart';
import '../models/exam_syllabus_model.dart';

class SyllabusService {

  static ExamSyllabusModel loadExamSyllabus(
      String examId,
      ) {

    final subject =
    LocalSyllabusDatabase.getExamSyllabus(
      examId,
    );

    return ExamSyllabusModel(
      examId: subject.id,
      examName: subject.name,
      subjects: [subject],
    );
  }
}