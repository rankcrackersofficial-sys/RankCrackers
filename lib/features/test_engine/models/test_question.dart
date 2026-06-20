class TestQuestion {
  final String id;
  final String questionEn;
  final String questionHi;
  final List<String> optionsEn;
  final List<String> optionsHi;
  final int correctIndex;
  final double negativeMarks;

  const TestQuestion({
    required this.id,
    required this.questionEn,
    required this.questionHi,
    required this.optionsEn,
    required this.optionsHi,
    required this.correctIndex,
    required this.negativeMarks,
  });
}
