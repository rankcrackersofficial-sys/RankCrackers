import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_factory_dependency_unlock_engine.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_dependency_graph.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_job.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_types.dart';
import 'package:rank_crackers/features/academic_factory/domain/models/academic_factory_work_order.dart';

void main() {
  group('AcademicFactoryDependencyUnlockEngine', () {
    test('unlocks source acquisition in initial one AMTN graph', () {
      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: AcademicFactoryDependencyGraph(
          jobs: const AcademicFactoryWorkOrderPlanner().buildJobs(
            _workOrder(targetCount: 1),
          ),
        ),
        maxParallelUnlocks: 20,
      );

      expect(plan.unlockableJobIds, hasLength(1));
      expect(plan.unlockableJobIds.single, contains('source_acquisition'));
    });

    test('unlocks source validation after source acquisition is approved', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: _id(AcademicFactoryJobType.sourceAcquisition),
            type: AcademicFactoryJobType.sourceAcquisition,
            state: AcademicFactoryJobState.approved,
            outputHash: 'source-acquisition-hash',
          ),
          _job(
            id: _id(AcademicFactoryJobType.sourceValidation),
            type: AcademicFactoryJobType.sourceValidation,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: <String>[
              _id(AcademicFactoryJobType.sourceAcquisition),
            ],
          ),
        ],
      );

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: graph,
        maxParallelUnlocks: 10,
      );

      expect(plan.unlockableJobIds, <String>[
        _id(AcademicFactoryJobType.sourceValidation),
      ]);
    });

    test('unlocks DigiBook and Crucible draft branches from source validation',
        () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: _id(AcademicFactoryJobType.sourceValidation),
            type: AcademicFactoryJobType.sourceValidation,
            state: AcademicFactoryJobState.approved,
            outputHash: 'source-validation-hash',
          ),
          _job(
            id: _id(AcademicFactoryJobType.digibookDraft),
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: <String>[
              _id(AcademicFactoryJobType.sourceValidation),
            ],
          ),
          _job(
            id: _id(AcademicFactoryJobType.crucibleDraft),
            type: AcademicFactoryJobType.crucibleDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: <String>[
              _id(AcademicFactoryJobType.sourceValidation),
            ],
          ),
        ],
      );

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: graph,
        maxParallelUnlocks: 10,
      );

      expect(
        plan.unlockableJobIds.toSet(),
        <String>{
          _id(AcademicFactoryJobType.digibookDraft),
          _id(AcademicFactoryJobType.crucibleDraft),
        },
      );
    });

    test('does not unlock when dependency is unresolved', () {
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
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['source'],
          ),
        ],
      );

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: graph,
        maxParallelUnlocks: 10,
      );

      expect(plan.unlockableJobIds, <String>['source']);
      expect(
        plan.decisions
            .firstWhere((decision) => decision.jobId == 'draft')
            .reasonCode,
        startsWith('WAITING_FOR_DEPENDENCIES'),
      );
    });

    test('blocks downstream when dependency failed terminal', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: 'source',
            type: AcademicFactoryJobType.sourceValidation,
            state: AcademicFactoryJobState.failedTerminal,
            failureClass: AcademicFactoryFailureClass.sourceMissing,
            failureMessage: 'source missing',
          ),
          _job(
            id: 'draft',
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['source'],
          ),
        ],
      );

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: graph,
        maxParallelUnlocks: 10,
      );

      expect(plan.unlockableJobIds, isEmpty);
      expect(
        plan.decisions
            .firstWhere((decision) => decision.jobId == 'draft')
            .reasonCode,
        startsWith('DEPENDENCY_FAILED'),
      );
    });

    test('blocks downstream when dependency is hard hold', () {
      final graph = AcademicFactoryDependencyGraph(
        jobs: <AcademicFactoryJob>[
          _job(
            id: 'source',
            type: AcademicFactoryJobType.sourceValidation,
            state: AcademicFactoryJobState.hardHold,
            failureClass: AcademicFactoryFailureClass.sourceInsufficient,
            failureMessage: 'source insufficient',
          ),
          _job(
            id: 'draft',
            type: AcademicFactoryJobType.digibookDraft,
            state: AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: const <String>['source'],
          ),
        ],
      );

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: graph,
        maxParallelUnlocks: 10,
      );

      expect(plan.unlockableJobIds, isEmpty);
      expect(
        plan.decisions
            .firstWhere((decision) => decision.jobId == 'draft')
            .reasonCode,
        startsWith('DEPENDENCY_ON_HOLD'),
      );
    });

    test('applies max parallel unlock cap', () {
      final jobs = const AcademicFactoryWorkOrderPlanner().buildJobs(
        _workOrder(targetCount: 10),
      );

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: AcademicFactoryDependencyGraph(jobs: jobs),
        maxParallelUnlocks: 3,
      );

      expect(plan.unlockableJobIds, hasLength(3));
    });

    test('fails closed when graph validation fails', () {
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

      final plan =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: graph,
        maxParallelUnlocks: 10,
      );

      expect(plan.unlockableJobIds, isEmpty);
      expect(plan.decisions.single.reasonCode, 'GRAPH_INVALID');
    });

    test('is order independent for unlockable IDs', () {
      final source = _job(
        id: 'source',
        type: AcademicFactoryJobType.sourceValidation,
        state: AcademicFactoryJobState.approved,
        outputHash: 'source-validation-hash',
      );
      final draft = _job(
        id: 'draft',
        type: AcademicFactoryJobType.digibookDraft,
        state: AcademicFactoryJobState.waitingDependency,
        dependencyJobIds: const <String>['source'],
      );

      final planA =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: AcademicFactoryDependencyGraph(jobs: <AcademicFactoryJob>[
          source,
          draft,
        ]),
        maxParallelUnlocks: 10,
      );
      final planB =
          const AcademicFactoryDependencyUnlockEngine().buildUnlockPlan(
        graph: AcademicFactoryDependencyGraph(jobs: <AcademicFactoryJob>[
          draft,
          source,
        ]),
        maxParallelUnlocks: 10,
      );

      expect(planA.unlockableJobIds.toSet(), planB.unlockableJobIds.toSet());
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

String _id(AcademicFactoryJobType type) {
  return AcademicFactoryWorkOrderPlanner.jobIdFor(
    runId: 'run-1',
    canonicalTargetId: 'AMTN-001',
    type: type,
  );
}

AcademicFactoryJob _job({
  required String id,
  required AcademicFactoryJobType type,
  required AcademicFactoryJobState state,
  String canonicalTargetId = 'AMTN-001',
  List<String> dependencyJobIds = const <String>[],
  String? outputHash,
  AcademicFactoryFailureClass? failureClass,
  String? failureMessage,
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
    failureClass: failureClass,
    failureMessage: failureMessage,
    createdAtUtc: now,
    updatedAtUtc: now,
  );
}
