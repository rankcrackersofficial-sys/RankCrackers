import 'package:cloud_firestore/cloud_firestore.dart';

/// The only lifecycle states exposed to Founder/Admin web telemetry.
enum AutomationRunStatus {
  queued,
  generating,
  verifying,
  reconciling,
  autoPassed,
  autoRepaired,
  autoHold,
  failed,
}

AutomationRunStatus automationRunStatusFromValue(Object? value) {
  switch (value?.toString()) {
    case 'generating':
      return AutomationRunStatus.generating;
    case 'verifying':
      return AutomationRunStatus.verifying;
    case 'reconciling':
      return AutomationRunStatus.reconciling;
    case 'auto_passed':
      return AutomationRunStatus.autoPassed;
    case 'auto_repaired':
      return AutomationRunStatus.autoRepaired;
    case 'auto_hold':
      return AutomationRunStatus.autoHold;
    case 'failed':
      return AutomationRunStatus.failed;
    case 'queued':
    default:
      return AutomationRunStatus.queued;
  }
}

String automationRunStatusLabel(AutomationRunStatus status) {
  switch (status) {
    case AutomationRunStatus.autoPassed:
      return 'AUTO-PASSED';
    case AutomationRunStatus.autoRepaired:
      return 'AUTO-REPAIRED';
    case AutomationRunStatus.autoHold:
      return 'AUTO-HOLD';
    case AutomationRunStatus.generating:
      return 'AI GENERATING';
    case AutomationRunStatus.verifying:
      return 'AI VERIFYING';
    case AutomationRunStatus.reconciling:
      return 'AI RECONCILING';
    case AutomationRunStatus.failed:
      return 'FAILED';
    case AutomationRunStatus.queued:
      return 'QUEUED';
  }
}

class AutomationRunTelemetry {
  final String id;
  final AutomationRunStatus status;
  final String domain;
  final double confidence;
  final bool publicationEligible;
  final bool founderVerificationRequired;
  final bool founderPolicyOverrideAvailable;
  final String decisionReason;
  final String? exceptionId;
  final DateTime? updatedAt;

  final String? workerId;
  final String? workerVersion;
  final Map<String, dynamic>? generatorResult;
  final Map<String, dynamic>? verifierResult;
  final String? sourceHash;

  const AutomationRunTelemetry({
    required this.id,
    required this.status,
    required this.domain,
    required this.confidence,
    required this.publicationEligible,
    required this.founderVerificationRequired,
    required this.founderPolicyOverrideAvailable,
    required this.decisionReason,
    required this.exceptionId,
    required this.updatedAt,
    this.workerId,
    this.workerVersion,
    this.generatorResult,
    this.verifierResult,
    this.sourceHash,
  });

  factory AutomationRunTelemetry.fromSnapshot(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? const <String, dynamic>{};
    final rawTimestamp = data['updatedAt'] ?? data['completedAt'];
    return AutomationRunTelemetry(
      id: snapshot.id,
      status: automationRunStatusFromValue(data['status']),
      domain: (data['domain'] ?? 'general').toString(),
      confidence: _confidence(data['confidence']),
      publicationEligible: data['publicationEligible'] == true,
      founderVerificationRequired: data['founderVerificationRequired'] == true,
      founderPolicyOverrideAvailable:
          data['founderPolicyOverrideAvailable'] == true,
      decisionReason:
          (data['decisionReason'] ?? data['reason'] ?? 'Awaiting sync')
              .toString(),
      exceptionId: data['exceptionId']?.toString(),
      updatedAt: _dateTime(rawTimestamp),
      workerId: data['workerId']?.toString(),
      workerVersion: data['workerVersion']?.toString(),
      generatorResult: data['generatorResult'] is Map
          ? Map<String, dynamic>.from(data['generatorResult'] as Map)
          : null,
      verifierResult: data['verifierResult'] is Map
          ? Map<String, dynamic>.from(data['verifierResult'] as Map)
          : null,
      sourceHash: data['sourceHash']?.toString(),
    );
  }

  static double _confidence(Object? value) {
    final parsed = double.tryParse(value?.toString() ?? '');
    if (parsed == null) return 0;
    return parsed.clamp(0, 1).toDouble();
  }

  static DateTime? _dateTime(Object? value) {
    if (value is Timestamp) return value.toDate();
    if (value is DateTime) return value;
    return null;
  }
}

class AutomationExceptionTelemetry {
  final String id;
  final String runId;
  final String status;
  final String severity;
  final String reason;
  final double confidence;
  final bool routineContentVerificationRequired;
  final String? aiPolicyRecommendation;
  final String? ruleId;
  final String? founderAction;
  final Map<String, dynamic>? affectedItemsScope;
  final DateTime? createdAt;

  const AutomationExceptionTelemetry({
    required this.id,
    required this.runId,
    required this.status,
    required this.severity,
    required this.reason,
    required this.confidence,
    required this.routineContentVerificationRequired,
    this.aiPolicyRecommendation,
    this.ruleId,
    this.founderAction,
    this.affectedItemsScope,
    this.createdAt,
  });

  factory AutomationExceptionTelemetry.fromSnapshot(
    DocumentSnapshot<Map<String, dynamic>> snapshot,
  ) {
    final data = snapshot.data() ?? const <String, dynamic>{};
    final rawConfidence = double.tryParse(data['confidence']?.toString() ?? '');
    final rawCreatedAt = data['createdAt'];
    return AutomationExceptionTelemetry(
      id: snapshot.id,
      runId: (data['runId'] ?? '').toString(),
      status: (data['status'] ?? 'open').toString(),
      severity: (data['severity'] ?? 'HIGH').toString(),
      reason: (data['reason'] ?? 'No evidence').toString(),
      confidence: (rawConfidence ?? 0).clamp(0, 1).toDouble(),
      routineContentVerificationRequired:
          data['routineContentVerificationRequired'] == true,
      aiPolicyRecommendation: data['aiPolicyRecommendation']?.toString() ??
          data['recommendation']?.toString(),
      ruleId: data['ruleId']?.toString() ?? data['policyRuleId']?.toString(),
      founderAction:
          (data['founderAction'] ?? 'POLICY_DECISION_ONLY').toString(),
      affectedItemsScope: data['affectedItemsScope'] is Map
          ? Map<String, dynamic>.from(data['affectedItemsScope'] as Map)
          : null,
      createdAt: rawCreatedAt is Timestamp
          ? rawCreatedAt.toDate()
          : (rawCreatedAt is DateTime ? rawCreatedAt : null),
    );
  }
}

class AutomationTelemetryRepository {
  AutomationTelemetryRepository({FirebaseFirestore? firestore})
      : _firestore = firestore ?? FirebaseFirestore.instance;

  final FirebaseFirestore _firestore;

  Stream<List<AutomationRunTelemetry>> watchRuns({int limit = 100}) {
    return _firestore
        .collection('automation_runs')
        .limit(limit)
        .snapshots()
        .map((snapshot) {
      final runs = snapshot.docs
          .map(AutomationRunTelemetry.fromSnapshot)
          .toList(growable: false);
      runs.sort((a, b) => (b.updatedAt ?? DateTime(1970))
          .compareTo(a.updatedAt ?? DateTime(1970)));
      return runs;
    });
  }

  Stream<List<AutomationExceptionTelemetry>> watchOpenExceptions({
    int limit = 100,
  }) {
    return _firestore
        .collection('automation_exceptions')
        .where('status', isEqualTo: 'open')
        .limit(limit)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map(AutomationExceptionTelemetry.fromSnapshot)
            .toList(growable: false));
  }

  /// Founder-Level Policy Override:
  /// Applies systemic policy override (e.g. Rule POL-902) to the grouped exception
  /// and updates the underlying run to auto_passed without atom micro-approvals.
  Future<void> applyPolicyOverride({
    required String exceptionId,
    required String runId,
    required String ruleId,
    String? note,
  }) async {
    final batch = _firestore.batch();
    final exceptionRef =
        _firestore.collection('automation_exceptions').doc(exceptionId);
    batch.update(exceptionRef, {
      'status': 'overridden',
      'founderAction': 'POLICY_OVERRIDE_APPLIED',
      'policyRuleId': ruleId,
      'overrideNote': note ?? 'Applied Founder Policy Rule $ruleId',
      'resolvedAt': FieldValue.serverTimestamp(),
    });

    if (runId.isNotEmpty) {
      final runRef = _firestore.collection('automation_runs').doc(runId);
      batch.update(runRef, {
        'status': 'auto_passed',
        'publicationEligible': true,
        'decisionReason': 'Auto-promoted via Founder Policy Override ($ruleId)',
        'founderPolicyOverrideAvailable': false,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
  }

  /// Maintain exception in Auto-Hold (Gate 12)
  Future<void> keepInAutoHold({
    required String exceptionId,
    String? reason,
  }) async {
    await _firestore
        .collection('automation_exceptions')
        .doc(exceptionId)
        .update({
      'status': 'held_by_policy',
      'holdReason': reason ?? 'Maintained in Auto-Hold by Founder directive',
      'updatedAt': FieldValue.serverTimestamp(),
    });
  }

  /// Escalate exception to Academic Council
  Future<void> escalateToCouncil({
    required String exceptionId,
  }) async {
    await _firestore
        .collection('automation_exceptions')
        .doc(exceptionId)
        .update({
      'status': 'escalated_to_council',
      'escalatedAt': FieldValue.serverTimestamp(),
    });
  }
}
