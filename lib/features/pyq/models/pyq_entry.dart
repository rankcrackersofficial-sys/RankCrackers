class PyqEntry {
  final String id;
  final String exam;
  final String subject;
  final String year;
  final String question;
  final String linkedNodeId;
  final int frequency;

  const PyqEntry({
    required this.id,
    required this.exam,
    required this.subject,
    required this.year,
    required this.question,
    required this.linkedNodeId,
    required this.frequency,
  });
}
