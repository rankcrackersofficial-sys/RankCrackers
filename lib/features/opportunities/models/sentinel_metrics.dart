/// 🔱 SENTINEL METRICS
/// Intelligence data for the Sentinel dashboard.
class SentinelMetrics {
  final int masterySignals;
  final int riskAlerts;
  final int missionCriticals;
  final int newAlerts;
  final int expiringForms;
  final int highPriorityExams;

  SentinelMetrics({
    this.masterySignals = 0,
    this.riskAlerts = 0,
    this.missionCriticals = 0,
    this.newAlerts = 0,
    this.expiringForms = 0,
    this.highPriorityExams = 0,
  });

  bool get isEmpty =>
      masterySignals == 0 &&
      riskAlerts == 0 &&
      missionCriticals == 0 &&
      newAlerts == 0 &&
      expiringForms == 0 &&
      highPriorityExams == 0;
}
