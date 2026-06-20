class ExamRuleEngine {

  static bool usesUnattemptedOption(
    String examName,
  ) {

    const rajasthanExams = {

      'RAS',
      'RPSC EO RO',
      'Patwar',
      'LDC',
      'REET',
      'Rajasthan CET',
      'Police Constable',
      'RPSC 1st Grade',
      'RPSC 2nd Grade',
    };

    return rajasthanExams.contains(
      examName,
    );
  }
}
