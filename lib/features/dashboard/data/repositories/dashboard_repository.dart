class DashboardTopicModel {

  final String topicId;

  final String topicName;

  final String subject;

  final double accuracy;

  final double decayRisk;

  final bool rebuildRequired;

  final bool isMastered;

  final int revisionCount;

  final int totalQuestions;

  final int correctAnswers;

  const DashboardTopicModel({

    required this.topicId,

    required this.topicName,

    required this.subject,

    required this.accuracy,

    required this.decayRisk,

    required this.rebuildRequired,

    required this.isMastered,

    required this.revisionCount,

    required this.totalQuestions,

    required this.correctAnswers,
  });
}

class DashboardRepository {

  static List<DashboardTopicModel>
  mapTopics(
      List<dynamic>
      nodes,
      ) {
    // MAPPED FROM LEGACY LOCAL DATA SOURCE: DISABLED
    // TODO: Bind to published authority/progress projections
    return [];
  }

  // =====================================
  // MASTERED COUNT
  // =====================================

  static int masteredCount(

      List<DashboardTopicModel>
      topics,
      ) {

    return topics.where(

          (topic) =>
      topic.isMastered,
    ).length;
  }

  // =====================================
  // REBUILD COUNT
  // =====================================

  static int rebuildCount(

      List<DashboardTopicModel>
      topics,
      ) {

    return topics.where(

          (topic) =>
      topic.rebuildRequired,
    ).length;
  }

  // =====================================
  // AVERAGE ACCURACY
  // =====================================

  static double averageAccuracy(

      List<DashboardTopicModel>
      topics,
      ) {

    if (topics.isEmpty) {

      return 0;
    }

    double total = 0;

    for (final topic
    in topics) {

      total +=
          topic.accuracy;
    }

    return total /
        topics.length;
  }
}
