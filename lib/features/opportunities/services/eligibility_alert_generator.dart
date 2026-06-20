import '../../../core/models/notification_item.dart';
import '../models/opportunity.dart';
import '../models/opportunity_match.dart';
import 'notification_builder.dart';
import 'recruitment_alert_service.dart';

/// 🔱 ELIGIBILITY ALERT GENERATOR
/// Logic to determine if an opportunity match warrants a sentinel notification.
class EligibilityAlertGenerator {
  
  static Future<void> processMatches({
    required String uid,
    required List<Opportunity> opportunities,
    required List<OpportunityMatch> matches,
  }) async {
    // 🔱 Optimization: Map-based lookup for O(1) safety (Audit Fix #2)
    final Map<String, Opportunity> oppMap = {
      for (final o in opportunities) o.id : o
    };

    for (final match in matches) {
      // 🔱 Alert Law: Filter high-relevance matches for potential alerts
      if (match.eligible && match.matchScore > 80) {
        final opp = oppMap[match.opportunityId];
        
        if (opp == null) continue; // 🔱 Safe lookup (Audit Fix #3)

        // 🔱 Step 1: Create Candidate
        final candidate = RecruitmentAlertService.generateCandidate(
          uid: uid, 
          opportunity: opp, 
          match: match,
        );

        // 🔱 Step 2: Push to Governance Pipeline (Candidate -> Draft path)
        final title = 'TARGET ACQUIRED: ${opp.title}';
        await RecruitmentAlertService.pushToQueue(candidate, title);
      }
    }
  }

  static List<NotificationItem> scanForAlerts({
    required List<Opportunity> opportunities,
    required List<OpportunityMatch> matches,
  }) {
    final List<NotificationItem> alerts = [];
    final Map<String, Opportunity> oppMap = {
      for (final o in opportunities) o.id : o
    };

    for (final match in matches) {
      if (match.eligible && match.matchScore > 80) {
        final opp = oppMap[match.opportunityId];

        if (opp == null) continue;

        alerts.add(NotificationBuilder.fromOpportunityMatch(
          opportunity: opp, 
          match: match,
        ));
      }
    }

    return alerts;
  }
}
