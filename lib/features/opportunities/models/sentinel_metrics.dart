class SentinelMetrics {
  final int newAlerts;
  final int expiringForms;
  final int highPriorityExams;

  SentinelMetrics({
    this.newAlerts = 0,
    this.expiringForms = 0,
    this.highPriorityExams = 0,
  });

  bool get isEmpty => newAlerts == 0 && expiringForms == 0 && highPriorityExams == 0;
}
