import '../models/opportunity.dart';

/// 🔱 OPPORTUNITY FILTER SERVICE
/// Sovereign authority for categorizing and sorting opportunities.
class OpportunityFilterService {
  /// 🔱 CLOSING SOON
  /// Surfacing opportunities within the critical 7-day boundary.
  static List<Opportunity> getClosingSoon(List<Opportunity> list) {
    final now = DateTime.now();
    return list.where((o) {
      final diff = o.lastDate.difference(now).inDays;
      return diff >= 0 && diff <= 7;
    }).toList()
      ..sort((a, b) => a.lastDate.compareTo(b.lastDate));
  }

  /// 🔱 NEW THIS WEEK
  /// Highlighting recent releases within the last 7 days.
  static List<Opportunity> getNewThisWeek(List<Opportunity> list) {
    final now = DateTime.now();
    return list.where((o) {
      final diff = now.difference(o.notificationDate).inDays;
      return diff >= 0 && diff <= 7;
    }).toList()
      ..sort((a, b) => b.notificationDate.compareTo(a.notificationDate));
  }
}
