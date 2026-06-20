class SyllabusEntity {
  final String exam;
  final String subject;
  final List<ChapterEntity> chapters;

  const SyllabusEntity({
    required this.exam,
    required this.subject,
    required this.chapters,
  });
}

class ChapterEntity {
  final String id;
  final String name;
  final List<String> microTopics;

  const ChapterEntity({
    required this.id,
    required this.name,
    required this.microTopics,
  });
}
