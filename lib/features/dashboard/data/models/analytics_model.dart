class DashboardAnalyticsModel {
  final double globalSyllabusCompletion;
  final int activeDailyStreak;
  final int totalQuestionsSolved;
  final List<Map<String, dynamic>> masterGraphNodes;
  final List<Map<String, dynamic>> immediateRevisionAlerts;

  DashboardAnalyticsModel({
    required this.globalSyllabusCompletion,
    required this.activeDailyStreak,
    required this.totalQuestionsSolved,
    required this.masterGraphNodes,
    required this.immediateRevisionAlerts,
  });

  factory DashboardAnalyticsModel.fromServerSchema(Map<String, dynamic> json) {
    return DashboardAnalyticsModel(
      globalSyllabusCompletion: (json['global_syllabus_completion'] as num?)?.toDouble() ?? 0.0,
      activeDailyStreak: json['active_daily_streak'] ?? 0,
      totalQuestionsSolved: json['total_questions_solved'] ?? 0,
      masterGraphNodes: List<Map<String, dynamic>>.from(json['master_graph_nodes'] ?? []),
      immediateRevisionAlerts: List<Map<String, dynamic>>.from(json['immediate_revision_alerts'] ?? []),
    );
  }
}
