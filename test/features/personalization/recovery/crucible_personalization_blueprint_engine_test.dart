import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/engines/crucible_personalization_blueprint_engine.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';

void main() {
  test('treatment creates bounded deterministic blueprint', () {
    final t = DateTime.utc(2026, 8, 16);
    final d = StudentTreatmentDecision(
        studentId: 's',
        targetAmtnId: 'a',
        missionId: 'jee_main_2026',
        createdAtUtc: t,
        schemaVersion: 3,
        directives: [
          const StudentTreatmentDirective(
              type: StudentTreatmentType.independentPractice,
              targetAmtnId: 'a',
              reasons: {StudentTreatmentReason.stablePerformance},
              urgency: StudentTreatmentUrgency.normal,
              surfaces: {StudentTreatmentSurface.crucible})
        ]);
    final b = const CruciblePersonalizationBlueprintEngine()
        .build(decision: d, createdAtUtc: t);
    expect(b.totalQuestionCount, greaterThanOrEqualTo(8));
    expect(b.totalQuestionCount, lessThanOrEqualTo(20));
  });
}
