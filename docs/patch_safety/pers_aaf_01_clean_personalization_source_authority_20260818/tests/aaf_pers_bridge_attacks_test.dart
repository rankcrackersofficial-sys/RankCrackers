import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/personalization/domain/models/aaf_personalization_bridge.dart';
import 'package:rank_crackers/features/personalization/domain/models/student_treatment_decision.dart';
import 'package:rank_crackers/features/personalization/domain/engines/digibook_personalization_route_engine.dart';

void main() {
  group('PERS-AAF-01 Bridge Security and Fail-Closed Attacks', () {
    final t = DateTime.utc(2026, 8, 18);

    AafPersonalizationBridgeAuthority validAuth({
      AafPublicProjectionStatus status = AafPublicProjectionStatus.current,
      String studentId = 's1',
      String targetAmtnId = 'amtn1',
      int canonicalKnowledgeVersion = 1,
      int studentStateVersion = 1,
      int treatmentDecisionVersion = 1,
      int routeVersion = 1,
      DateTime? time,
      int schemaVersion = AafPersonalizationBridgeAuthority.currentSchemaVersion,
    }) {
      return AafPersonalizationBridgeAuthority(
        studentId: studentId,
        targetAmtnId: targetAmtnId,
        canonicalSemanticTopicId: 'topic1',
        canonicalKnowledgeVersion: canonicalKnowledgeVersion,
        publicProjectionId: 'pub1',
        status: status,
        studentStateVersion: studentStateVersion,
        treatmentDecisionVersion: treatmentDecisionVersion,
        routeVersion: routeVersion,
        createdAtUtc: time ?? t,
        schemaVersion: schemaVersion,
      );
    }

    StudentTreatmentDecision validDecision({
      String studentId = 's1',
      String targetAmtnId = 'amtn1',
      DateTime? time,
    }) {
      return StudentTreatmentDecision(
        studentId: studentId,
        targetAmtnId: targetAmtnId,
        createdAtUtc: time ?? t,
        schemaVersion: 2,
        directives: [
          const StudentTreatmentDirective(
            type: StudentTreatmentType.conceptRepair,
            targetAmtnId: 'amtn1',
            reasons: {StudentTreatmentReason.lowMastery},
            urgency: StudentTreatmentUrgency.high,
            surfaces: {StudentTreatmentSurface.digibook},
          ),
        ],
      );
    }

    test('1. Valid bridge contract configuration - PASS', () {
      final auth = validAuth();
      expect(() => auth.validate(), returnsNormally);
      expect(auth.isCurrentAndEligible, isTrue);
    });

    test('2. Attack: Referencing unverified content - FAIL CLOSED', () {
      final auth = validAuth(status: AafPublicProjectionStatus.unverified);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('3. Attack: Referencing withdrawn content - FAIL CLOSED', () {
      final auth = validAuth(status: AafPublicProjectionStatus.withdrawn);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('4. Attack: Referencing superseded content - FAIL CLOSED', () {
      final auth = validAuth(status: AafPublicProjectionStatus.superseded);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('5. Attack: Non-UTC timestamp in authority - FAIL CLOSED', () {
      final localTime = DateTime(2026, 8, 18);
      final auth = validAuth(time: localTime);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('6. Attack: Empty studentId in authority - FAIL CLOSED', () {
      final auth = validAuth(studentId: '  ');
      expect(() => auth.validate(), throwsFormatException);
    });

    test('7. Attack: Empty targetAmtnId in authority - FAIL CLOSED', () {
      final auth = validAuth(targetAmtnId: '');
      expect(() => auth.validate(), throwsFormatException);
    });

    test('8. Attack: Negative knowledge version - FAIL CLOSED', () {
      final auth = validAuth(canonicalKnowledgeVersion: -5);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('9. Attack: Zero knowledge version - FAIL CLOSED', () {
      final auth = validAuth(canonicalKnowledgeVersion: 0);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('10. Attack: Zero student state version - FAIL CLOSED', () {
      final auth = validAuth(studentStateVersion: 0);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('11. Attack: Zero treatment decision version - FAIL CLOSED', () {
      final auth = validAuth(treatmentDecisionVersion: 0);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('12. Attack: Zero route version - FAIL CLOSED', () {
      final auth = validAuth(routeVersion: 0);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('13. Attack: Zero schema version in authority - FAIL CLOSED', () {
      final auth = validAuth(schemaVersion: 0);
      expect(() => auth.validate(), throwsFormatException);
    });

    test('14. Attack: Identity studentId mismatch during engine build - FAIL CLOSED', () {
      final auth = validAuth(studentId: 'student_a');
      final dec = validDecision(studentId: 'student_b');
      expect(
        () => const DigiBookPersonalizationRouteEngine().build(
          decision: dec,
          authority: auth,
          createdAtUtc: t,
        ),
        throwsFormatException,
      );
    });

    test('15. Attack: Identity targetAmtnId mismatch during engine build - FAIL CLOSED', () {
      final auth = validAuth(targetAmtnId: 'amtn_x');
      final dec = validDecision(targetAmtnId: 'amtn_y');
      expect(
        () => const DigiBookPersonalizationRouteEngine().build(
          decision: dec,
          authority: auth,
          createdAtUtc: t,
        ),
        throwsFormatException,
      );
    });

    test('16. Attack: Non-UTC timestamp during route build - FAIL CLOSED', () {
      final localTime = DateTime(2026, 8, 18);
      expect(
        () => const DigiBookPersonalizationRouteEngine().build(
          decision: validDecision(),
          authority: validAuth(),
          createdAtUtc: localTime,
        ),
        throwsFormatException,
      );
    });

    test('17. Invalidation: AAF version mismatch is detected', () {
      final auth = validAuth(canonicalKnowledgeVersion: 2);
      expect(auth.matchesCanonicalVersion(2), isTrue);
      expect(auth.matchesCanonicalVersion(3), isFalse);
    });

    test('18. Attack: Directive with mismatched targetAmtnId - FAIL CLOSED', () {
      final dec = StudentTreatmentDecision(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        createdAtUtc: t,
        schemaVersion: 2,
        directives: [
          const StudentTreatmentDirective(
            type: StudentTreatmentType.conceptRepair,
            targetAmtnId: 'amtn_mismatched',
            reasons: {StudentTreatmentReason.lowMastery},
            urgency: StudentTreatmentUrgency.high,
            surfaces: {StudentTreatmentSurface.digibook},
          ),
        ],
      );
      expect(() => dec.validate(), throwsFormatException);
    });

    test('19. Attack: Prerequisite repair without prerequisite list - FAIL CLOSED', () {
      final directive = const StudentTreatmentDirective(
        type: StudentTreatmentType.prerequisiteRepair,
        targetAmtnId: 'amtn1',
        reasons: {StudentTreatmentReason.prerequisiteBlocked},
        urgency: StudentTreatmentUrgency.blocking,
        surfaces: {StudentTreatmentSurface.digibook},
        prerequisiteAmtnIds: [],
      );
      expect(() => directive.validate(), throwsFormatException);
    });

    test('20. Attack: Target declared as its own prerequisite - FAIL CLOSED', () {
      final directive = const StudentTreatmentDirective(
        type: StudentTreatmentType.prerequisiteRepair,
        targetAmtnId: 'amtn1',
        reasons: {StudentTreatmentReason.prerequisiteBlocked},
        urgency: StudentTreatmentUrgency.blocking,
        surfaces: {StudentTreatmentSurface.digibook},
        prerequisiteAmtnIds: ['amtn1'],
      );
      expect(() => directive.validate(), throwsFormatException);
    });

    test('21. Attack: Duplicate directive types in decision - FAIL CLOSED', () {
      final dec = StudentTreatmentDecision(
        studentId: 's1',
        targetAmtnId: 'amtn1',
        createdAtUtc: t,
        schemaVersion: 2,
        directives: [
          const StudentTreatmentDirective(
            type: StudentTreatmentType.conceptRepair,
            targetAmtnId: 'amtn1',
            reasons: {StudentTreatmentReason.lowMastery},
            urgency: StudentTreatmentUrgency.high,
            surfaces: {StudentTreatmentSurface.digibook},
          ),
          const StudentTreatmentDirective(
            type: StudentTreatmentType.conceptRepair,
            targetAmtnId: 'amtn1',
            reasons: {StudentTreatmentReason.stablePerformance},
            urgency: StudentTreatmentUrgency.normal,
            surfaces: {StudentTreatmentSurface.digibook},
          ),
        ],
      );
      expect(() => dec.validate(), throwsFormatException);
    });
  });
}
