import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_initial_activation_engine.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';

void main() {
  const activationEngine = AcademicFactoryInitialActivationEngine();

  final created = DateTime.utc(2026, 8, 16, 10);

  AcademicFactoryJob makeJob({
    required String id,
    required AcademicFactoryJobState state,
    List<String> dependencyJobIds = const [],
  }) {
    return AcademicFactoryJob(
      jobId: id,
      runId: 'run-1',
      missionId: 'jee_main_2026',
      canonicalTargetId: 'AMTN-001',
      type: AcademicFactoryJobType.sourceAcquisition,
      state: state,
      dependencyJobIds: dependencyJobIds,
      attemptCount: 0,
      maxAttempts: 3,
      idempotencyKey: 'key-$id',
      createdAtUtc: created,
      updatedAtUtc: created,
    );
  }

  group('AcademicFactoryInitialActivationEngine', () {
    test('activates planned job with no dependencies', () {
      final job = makeJob(id: '1', state: AcademicFactoryJobState.planned);
      final activated = activationEngine.activate(
        jobs: [job],
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );

      expect(activated.first.state, AcademicFactoryJobState.ready);
      expect(activated.first.updatedAtUtc, DateTime.utc(2026, 8, 16, 10, 1));
    });

    test('does not activate planned job with dependencies', () {
      final job = makeJob(
        id: '1',
        state: AcademicFactoryJobState.planned,
        dependencyJobIds: const ['dependency-1'],
      );
      final activated = activationEngine.activate(
        jobs: [job],
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );

      expect(activated.first.state, AcademicFactoryJobState.planned);
    });

    test('does not activate non-planned job with no dependencies', () {
      final job =
          makeJob(id: '1', state: AcademicFactoryJobState.waitingDependency);
      final activated = activationEngine.activate(
        jobs: [job],
        eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1),
      );

      expect(activated.first.state, AcademicFactoryJobState.waitingDependency);
    });

    test('non-UTC timestamp throws FormatException', () {
      final job = makeJob(id: '1', state: AcademicFactoryJobState.planned);
      expect(
        () => activationEngine.activate(
          jobs: [job],
          eventAtUtc: DateTime.utc(2026, 8, 16, 10, 1).toLocal(),
        ),
        throwsFormatException,
      );
    });
  });
}
