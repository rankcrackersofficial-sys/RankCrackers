import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/digibook_personalization_route_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

AafPersonalizationBridgeAuthority authority(
  DateTime t, {
  AafPublicProjectionStatus status = AafPublicProjectionStatus.current,
}) =>
    AafPersonalizationBridgeAuthority(
      studentId: 's',
      targetAmtnId: 'a',
      canonicalSemanticTopicId: 'topic-a',
      canonicalKnowledgeVersion: 3,
      publicProjectionId: 'pub-a-v3',
      status: status,
      studentStateVersion: 2,
      treatmentDecisionVersion: 2,
      routeVersion: 1,
      createdAtUtc: t,
      schemaVersion: AafPersonalizationBridgeAuthority.currentSchemaVersion,
    );

StudentTreatmentDecision decision(DateTime t) => StudentTreatmentDecision(
      studentId: 's',
      targetAmtnId: 'a',
      createdAtUtc: t,
      schemaVersion: 2,
      directives: const [
        StudentTreatmentDirective(
          type: StudentTreatmentType.conceptRepair,
          targetAmtnId: 'a',
          reasons: {StudentTreatmentReason.lowMastery},
          urgency: StudentTreatmentUrgency.high,
          surfaces: {StudentTreatmentSurface.digibook},
        ),
      ],
    );

void main() {
  test('PERS-09 contract is compatible with governed AAF-bound route', () {
    final t = DateTime.utc(2026, 8, 16);
    final r = const DigiBookPersonalizationRouteEngine().build(
      decision: decision(t),
      authority: authority(t),
      createdAtUtc: t,
    );
    expect(r.targetAmtnId, 'a');
    expect(r.authority.publicProjectionId, 'pub-a-v3');
    expect(r.authority.canonicalKnowledgeVersion, 3);
    expect(r.steps, isNotEmpty);
  });

  test('withdrawn AAF public projection cannot create DigiBook route', () {
    final t = DateTime.utc(2026, 8, 16);
    expect(
      () => const DigiBookPersonalizationRouteEngine().build(
        decision: decision(t),
        authority: authority(t, status: AafPublicProjectionStatus.withdrawn),
        createdAtUtc: t,
      ),
      throwsFormatException,
    );
  });
}
