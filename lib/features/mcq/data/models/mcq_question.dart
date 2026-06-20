class McqQuestion {
  final String question;
  final List<String> options;
  final int correctIndex;

  const McqQuestion({
    required this.question,
    required this.options,
    required this.correctIndex,
  });
}
