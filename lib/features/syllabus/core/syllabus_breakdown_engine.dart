import '../models/syllabus_chunk.dart';

class SyllabusBreakdownEngine {
  // ===================================================
  // BREAKDOWN RAW SYLLABUS 🔱 Updated for Mission Law
  // ===================================================
  static List<SyllabusChunk> process({
    required String rawSyllabus,
    required String subject,
  }) {
    final lines = rawSyllabus.split('\n').where((e) {
      return e.trim().isNotEmpty;
    }).toList();

    final List<SyllabusChunk> chunks = [];

    for (final line in lines) {
      final parts = line.split(':');
      if (parts.length < 2) {
        continue;
      }

      final chapter = parts.first.trim();
      final topics = parts.last.split(',').map((e) {
        return e.trim();
      }).toList();

      chunks.add(
        SyllabusChunk(
          subject: subject,
          chapter: chapter,
          microTopics: topics,
        ),
      );
    }

    return chunks;
  }
}
