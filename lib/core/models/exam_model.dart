class ExamModel {
  final String id;
  final String title;
  final String subtitle;
  final String state;
  final bool isCentral;
  final bool isActive;

  const ExamModel({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.state,
    required this.isCentral,
    this.isActive = true,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'title': title,
      'subtitle': subtitle,
      'state': state,
      'isCentral': isCentral,
      'isActive': isActive,
    };
  }

  factory ExamModel.fromMap(Map<String, dynamic> map) {
    return ExamModel(
      id: map['id'] ?? '',
      title: map['title'] ?? '',
      subtitle: map['subtitle'] ?? '',
      state: map['state'] ?? '',
      isCentral: map['isCentral'] ?? false,
      isActive: map['isActive'] ?? true,
    );
  }
}
