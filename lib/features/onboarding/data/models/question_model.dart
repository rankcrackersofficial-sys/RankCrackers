class QuestionModel {
  final String id;
  final String question;
  final List<String> options;
  final String subject;
  final String topic;
  final String nodeHierarchy;

  QuestionModel({
    required this.id,
    required this.question,
    required this.options,
    required this.subject,
    required this.topic,
    required this.nodeHierarchy,
  });

  factory QuestionModel.fromJson(Map<String, dynamic> json) {
    return QuestionModel(
      id: json['question_id'] ?? '',
      question: json['question'] ?? '',
      options: List<String>.from(json['options'] ?? []),
      subject: json['subject'] ?? '',
      topic: json['topic'] ?? '',
      nodeHierarchy: json['node_hierarchy'] ?? '',
    );
  }
}

class EvaluationResponse {
  final bool isCorrect;
  final int correctAnswerIndex;
  final String dynamicInsight;

  EvaluationResponse({
    required this.isCorrect,
    required this.correctAnswerIndex,
    required this.dynamicInsight,
  });

  factory EvaluationResponse.fromJson(Map<String, dynamic> json) {
    return EvaluationResponse(
      isCorrect: json['correct'] ?? false,
      correctAnswerIndex: json['correct_answer_index'] ?? 0,
      dynamicInsight: json['dynamic_insight'] ?? '',
    );
  }
}
