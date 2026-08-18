import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/syllabus_personalization_route_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

void main() {
  test('prerequisite nodes precede target', () {
    final t = DateTime.utc(2026, 8, 16);
    final d = StudentTreatmentDecision(
        studentId: 's',
        targetAmtnId: 'a',
        createdAtUtc: t,
        schemaVersion: 2,
        directives: [
          const StudentTreatmentDirective(
              type: StudentTreatmentType.prerequisiteRepair,
              targetAmtnId: 'a',
              prerequisiteAmtnIds: ['p'],
              reasons: {StudentTreatmentReason.prerequisiteBlocked},
              urgency: StudentTreatmentUrgency.blocking,
              surfaces: {StudentTreatmentSurface.syllabus})
        ]);
    final r = const SyllabusPersonalizationRouteEngine().build(
        studentId: 's',
        examId: 'exam',
        targetAmtnId: 'a',
        createdAtUtc: t,
        decision: d);
    expect(r.orderedNodes.first.amtnId, 'p');
    expect(r.orderedNodes[1].amtnId, 'a');
  });
}
