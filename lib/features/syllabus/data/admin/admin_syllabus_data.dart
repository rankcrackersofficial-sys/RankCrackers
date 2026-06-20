import '../models/syllabus_entity.dart';

class AdminSyllabusData {
  static const history = SyllabusEntity(
    exam: 'RPSC',
    subject: 'History',
    chapters: [
      ChapterEntity(
        id: 'MODERN_HISTORY',
        name: 'Modern History',
        microTopics: [
          'Political Causes of Revolt of 1857',
          'Major Events of Revolt of 1857',
          'Socio-Religious Reform Movements',
          'Indian National Congress',
          'Moderates vs Extremists',
        ],
      ),
    ],
  );
}
