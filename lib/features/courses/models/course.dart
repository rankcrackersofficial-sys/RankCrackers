class Course {
  final String id;
  final String name;
  final String examType;
  final List<String> subjects;
  final int durationDays;
  final Map<String, bool> languageSupport;
  final double pricing;
  final int difficulty;

  const Course({
    required this.id,
    required this.name,
    required this.examType,
    required this.subjects,
    required this.durationDays,
    required this.languageSupport,
    required this.pricing,
    this.difficulty = 2,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'examType': examType,
      'subjects': subjects,
      'durationDays': durationDays,
      'languageSupport': languageSupport,
      'pricing': pricing,
      'difficulty': difficulty,
    };
  }

  factory Course.fromMap(Map<String, dynamic> map) {
    return Course(
      id: map['id'],
      name: map['name'],
      examType: map['examType'],
      subjects: List<String>.from(map['subjects']),
      durationDays: map['durationDays'],
      languageSupport: Map<String, bool>.from(map['languageSupport']),
      pricing: map['pricing'],
      difficulty: map['difficulty'] ?? 2,
    );
  }
}
