import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_dependency_graph_validator.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_dependency_graph.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_work_order.dart';

void main() {
  group('AcademicFactoryWorkOrderPlanner', () {
    test('round trips work order JSON', () {
      final order = _workOrder(targetCount: 1);

      final decoded = AcademicFactoryWorkOrder.fromJson(order.toJson());

      expect(decoded.workOrderId, order.workOrderId);
      expect(decoded.runId, order.runId);
      expect(decoded.missionId, order.missionId);
      expect(decoded.canonicalTargetIds, order.canonicalTargetIds);
      expect(decoded.requestedJobTypes, order.requestedJobTypes);
    });

    test('plans one AMTN as eleven deterministic base jobs', () {
      final jobs = const AcademicFactoryWorkOrderPlanner().buildJobs(
        _workOrder(targetCount: 1),
      );

      expect(jobs, hasLength(11));
      expect(
        jobs.where(
          (job) => job.type == AcademicFactoryJobType.digibookRepair,
        ),
        isEmpty,
      );
      expect(
        jobs.where(
          (job) => job.type == AcademicFactoryJobType.crucibleRepair,
        ),
        isEmpty,
      );
      expect(jobs.map((job) => job.idempotencyKey).toSet(), hasLength(11));
    });

    test('plans full 417 AMTN graph as 4587 deterministic base jobs', () {
      final jobs = const AcademicFactoryWorkOrderPlanner().buildJobs(
        _workOrder(targetCount: 417),
      );
      final graph = AcademicFactoryDependencyGraph(jobs: jobs);
      final validation =
          const AcademicFactoryDependencyGraphValidator().validate(
        graph,
      );

      expect(jobs, hasLength(4587));
      expect(jobs.map((job) => job.idempotencyKey).toSet(), hasLength(4587));
      expect(validation.isValid, isTrue);
      expect(validation.missingDependencyCount, 0);
      expect(validation.cycleCount, 0);
      expect(validation.crossAmtnDependencyCount, 0);
    });
  });

  group('AcademicFactoryDependencyGraphValidator', () {
    test('accepts closed acyclic graph', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: const AcademicFactoryWorkOrderPlanner().buildJobs(
          _workOrder(targetCount: 1),
        ),
      );

      final result = const AcademicFactoryDependencyGraphValidator().validate(
        graph,
      );

      expect(result.isValid, isTrue);
      expect(result.issues, isEmpty);
    });

    test('fails closed on missing dependency', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: 'draft',
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['missing'],
          ),
        ],
      );

      final result = const AcademicFactoryDependencyGraphValidator().validate(
        graph,
      );

      expect(result.isValid, isFalse);
      expect(result.missingDependencyCount, 1);
    });

    test('fails closed on dependency cycle', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: 'a',
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['b'],
          ),
          _job(
            id: 'b',
            type: AcademicFactoryJobType.digibookValidation,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['a'],
          ),
        ],
      );

      final result = const AcademicFactoryDependencyGraphValidator().validate(
        graph,
      );

      expect(result.isValid, isFalse);
      expect(result.cycleCount, 1);
    });

    test('fails closed on cross AMTN dependency', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: 'source-a',
            canonicalTargetId: 'AMTN-A',
            type: AcademicFactoryJobType.sourceValidation,
            state: AcademicFactoryJobState.approved,
            outputHash: 'hash-a',
          ),
          _job(
            id: 'draft-b',
            canonicalTargetId: 'AMTN-B',
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['source-a'],
          ),
        ],
      );

      final result = const AcademicFactoryDependencyGraphValidator().validate(
        graph,
      );

      expect(result.isValid, isFalse);
      expect(result.crossAmtnDependencyCount, 1);
    });

    test('fails closed when ready job has unresolved dependencies', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: 'source',
            type: AcademicFactoryJobType.sourceValidation,
            state: AcademicFactoryJobState.waitingDependency,
          ),
          _job(
            id: 'draft',
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.ready,
            dependencyJobIds: const <String>['source'],
          ),
        ],
      );

      final result = const AcademicFactoryDependencyGraphValidator().validate(
        graph,
      );

      expect(result.isValid, isFalse);
      expect(
        result.issues.any(
          (issue) => issue.startsWith('READY_WITH_UNRESOLVED_DEPENDENCIES'),
        ),
        isTrue,
      );
    });
  });
}

AcademicFactoryWorkOrder _workOrder({required int targetCount}) {
  return AcademicFactoryWorkOrder(
    workOrderId: 'wo-1',
    runId: 'run-1',
    missionId: 'jee_main_2026',
    canonicalTargetIds: List<String>.generate(
      targetCount,
      (index) => 'AMTN-${index.toString().padLeft(3, '0')}',
    ),
    requestedJobTypes:
        AcademicFactoryWorkOrderPlanner.deterministicBaseJobTypes,
    createdAtUtc: DateTime.utc(2026, 8, 16),
  );
}

AcademicFactoryJob _job({
  required String id,
  required AcademicFactoryJobType type,
  required AcademicFactoryJobState state,
  String canonicalTargetId = 'AMTN-001',
  List<String> dependencyJobIds = const <String>[],
  String? outputHash,
}) {
  final now = DateTime.utc(2026, 8, 16);
  return AcademicFactoryJob(
    jobId: id,
    runId: 'run-1',
    missionId: 'jee_main_2026',
    canonicalTargetId: canonicalTargetId,
    type: type,
    state: state,
    dependencyJobIds: dependencyJobIds,
    attemptCount: 0,
    maxAttempts: 3,
    idempotencyKey: 'run-1:$id:v1',
    outputHash: outputHash,
    createdAtUtc: now,
    updatedAtUtc: now,
  );
}
