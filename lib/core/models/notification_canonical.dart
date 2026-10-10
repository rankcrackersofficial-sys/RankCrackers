import 'notification/notification_identity.dart';
import 'notification/notification_intelligence.dart';
import 'notification/notification_graph.dart';
import 'notification/notification_evidence.dart';
import 'notification/notification_feedback.dart';

export 'notification/notification_identity.dart';
export 'notification/notification_intelligence.dart';
export 'notification/notification_graph.dart';
export 'notification/notification_evidence.dart';
export 'notification/notification_feedback.dart';

/// NOTIFICATION CANONICAL (v2.0 Modular Architecture)
/// Orchestrates the 5 pillars of notification intelligence.
class NotificationCanonical {
  final NotificationIdentity identity;
  final NotificationIntelligence intelligence;
  final NotificationKnowledgeGraph graph;
  final EvidenceMap evidence;
  final NotificationFeedback feedback;

  NotificationCanonical({
    required this.identity,
    required this.intelligence,
    required this.graph,
    required this.evidence,
    required this.feedback,
  });

  Map<String, dynamic> toMap() => {
    'identity': identity.toMap(),
    'intelligence': intelligence.toMap(),
    'graph': graph.toMap(),
    'evidence': evidence.toMap(),
    'feedback': feedback.toMap(),
  };

  factory NotificationCanonical.fromMap(Map<String, dynamic> map) => NotificationCanonical(
    identity: NotificationIdentity.fromMap(map['identity'] ?? {}),
    intelligence: NotificationIntelligence.fromMap(map['intelligence'] ?? {}),
    graph: NotificationKnowledgeGraph.fromMap(map['graph'] ?? {}),
    evidence: EvidenceMap.fromMap(map['evidence'] ?? {}),
    feedback: NotificationFeedback.fromMap(map['feedback'] ?? {}),
  );
}
