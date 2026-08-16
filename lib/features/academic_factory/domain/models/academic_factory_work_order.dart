/// Work-order planning contract for the RankCrackers Autonomous Academic
/// Factory.
///
/// CODE: AAF-002
///
/// This file is intentionally pure Dart. It does not import Firebase, Vertex,
/// Gemini, repositories, UI, workers, or runtime clients.
library;

import 'academic_factory_job.dart';
import 'academic_factory_types.dart';

final class AcademicFactoryWorkOrder {
  AcademicFactoryWorkOrder({
    required this.workOrderId,
    required this.runId,
    required this.missionId,
    required List<String> canonicalTargetIds,
    required List<AcademicFactoryJobType> requestedJobTypes,
    required this.createdAtUtc,
    this.maxParallelUnlocks = 24,
    this.maxAttemptsPerJob = 3,
    this.schemaVersion = currentSchemaVersion,
  })  : canonicalTargetIds = List<String>.unmodifiable(
          canonicalTargetIds.map((value) => value.trim()),
        ),
        requestedJobTypes = List<AcademicFactoryJobType>.unmodifiable(
          requestedJobTypes,
        ) {
    validate();
  }

  static const int currentSchemaVersion = 1;

  final int schemaVersion;
  final String workOrderId;
  final String runId;
  final String missionId;
  final List<String> canonicalTargetIds;
  final List<AcademicFactoryJobType> requestedJobTypes;
  final DateTime createdAtUtc;
  final int maxParallelUnlocks;
  final int maxAttemptsPerJob;

  int get targetCount => canonicalTargetIds.length;

  void validate() {
    _requireNonEmpty(workOrderId, 'workOrderId');
    _requireNonEmpty(runId, 'runId');
    _requireNonEmpty(missionId, 'missionId');

    if (schemaVersion <= 0) {
      throw const FormatException(
        'AcademicFactoryWorkOrder.schemaVersion must be positive.',
      );
    }

    if (!createdAtUtc.isUtc) {
      throw const FormatException(
        'AcademicFactoryWorkOrder.createdAtUtc must be UTC.',
      );
    }

    if (maxParallelUnlocks <= 0) {
      throw const FormatException(
        'AcademicFactoryWorkOrder.maxParallelUnlocks must be positive.',
      );
    }

    if (maxAttemptsPerJob <= 0) {
      throw const FormatException(
        'AcademicFactoryWorkOrder.maxAttemptsPerJob must be positive.',
      );
    }

    if (canonicalTargetIds.isEmpty) {
      throw const FormatException(
        'AcademicFactoryWorkOrder requires at least one canonical target.',
      );
    }

    final targetSet = <String>{};
    for (final targetId in canonicalTargetIds) {
      _requireNonEmpty(targetId, 'canonicalTargetId');
      if (!targetSet.add(targetId)) {
        throw FormatException(
          'Duplicate canonical target in work order: $targetId',
        );
      }
    }

    if (requestedJobTypes.isEmpty) {
      throw const FormatException(
        'AcademicFactoryWorkOrder requires at least one job type.',
      );
    }

    final typeSet = <AcademicFactoryJobType>{};
    for (final type in requestedJobTypes) {
      if (!typeSet.add(type)) {
        throw FormatException(
          'Duplicate requested job type: ${type.wireName}',
        );
      }
    }
  }

  Map<String, Object?> toJson() {
    validate();
    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'workOrderId': workOrderId,
      'runId': runId,
      'missionId': missionId,
      'canonicalTargetIds': canonicalTargetIds,
      'requestedJobTypes': requestedJobTypes
          .map((type) => type.wireName)
          .toList(growable: false),
      'createdAtUtc': createdAtUtc.toIso8601String(),
      'maxParallelUnlocks': maxParallelUnlocks,
      'maxAttemptsPerJob': maxAttemptsPerJob,
    };
  }

  factory AcademicFactoryWorkOrder.fromJson(Map<String, Object?> json) {
    return AcademicFactoryWorkOrder(
      schemaVersion: _readInt(json, 'schemaVersion'),
      workOrderId: _readString(json, 'workOrderId'),
      runId: _readString(json, 'runId'),
      missionId: _readString(json, 'missionId'),
      canonicalTargetIds: _readStringList(json, 'canonicalTargetIds'),
      requestedJobTypes: _readStringList(json, 'requestedJobTypes')
          .map(academicFactoryJobTypeFromWire)
          .toList(growable: false),
      createdAtUtc: _readUtcDateTime(json, 'createdAtUtc'),
      maxParallelUnlocks: _readInt(json, 'maxParallelUnlocks'),
      maxAttemptsPerJob: _readInt(json, 'maxAttemptsPerJob'),
    );
  }

  static void _requireNonEmpty(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException(
        'AcademicFactoryWorkOrder.$field must not be empty.',
      );
    }
  }
}

final class AcademicFactoryWorkOrderPlanner {
  const AcademicFactoryWorkOrderPlanner();

  static const List<AcademicFactoryJobType> deterministicBaseJobTypes =
      <AcademicFactoryJobType>[
    AcademicFactoryJobType.sourceAcquisition,
    AcademicFactoryJobType.sourceValidation,
    AcademicFactoryJobType.digibookDraft,
    AcademicFactoryJobType.digibookValidation,
    AcademicFactoryJobType.digibookProReview,
    AcademicFactoryJobType.digibookAssembly,
    AcademicFactoryJobType.digibookMaterialization,
    AcademicFactoryJobType.crucibleDraft,
    AcademicFactoryJobType.crucibleValidation,
    AcademicFactoryJobType.crucibleProReview,
    AcademicFactoryJobType.crucibleMaterialization,
  ];

  List<AcademicFactoryJob> buildJobs(AcademicFactoryWorkOrder workOrder) {
    workOrder.validate();
    final requested = workOrder.requestedJobTypes.toSet();
    final jobs = <AcademicFactoryJob>[];

    for (final targetId in workOrder.canonicalTargetIds) {
      for (final type in workOrder.requestedJobTypes) {
        jobs.add(
          AcademicFactoryJob(
            jobId: jobIdFor(
              runId: workOrder.runId,
              canonicalTargetId: targetId,
              type: type,
            ),
            runId: workOrder.runId,
            missionId: workOrder.missionId,
            canonicalTargetId: targetId,
            type: type,
            state: _dependenciesFor(
              runId: workOrder.runId,
              canonicalTargetId: targetId,
              type: type,
              requestedTypes: requested,
            ).isEmpty
                ? AcademicFactoryJobState.planned
                : AcademicFactoryJobState.waitingDependency,
            dependencyJobIds: _dependenciesFor(
              runId: workOrder.runId,
              canonicalTargetId: targetId,
              type: type,
              requestedTypes: requested,
            ),
            attemptCount: 0,
            maxAttempts: workOrder.maxAttemptsPerJob,
            idempotencyKey: idempotencyKeyFor(
              runId: workOrder.runId,
              canonicalTargetId: targetId,
              type: type,
            ),
            createdAtUtc: workOrder.createdAtUtc,
            updatedAtUtc: workOrder.createdAtUtc,
          ),
        );
      }
    }

    return List<AcademicFactoryJob>.unmodifiable(jobs);
  }

  static String jobIdFor({
    required String runId,
    required String canonicalTargetId,
    required AcademicFactoryJobType type,
  }) {
    return '$runId::$canonicalTargetId::${type.wireName}';
  }

  static String idempotencyKeyFor({
    required String runId,
    required String canonicalTargetId,
    required AcademicFactoryJobType type,
  }) {
    return '$runId:$canonicalTargetId:${type.wireName}:v1';
  }

  static List<String> _dependenciesFor({
    required String runId,
    required String canonicalTargetId,
    required AcademicFactoryJobType type,
    required Set<AcademicFactoryJobType> requestedTypes,
  }) {
    final dependencyTypes = _dependencyTypesFor(type);
    return dependencyTypes
        .where(requestedTypes.contains)
        .map(
          (dependencyType) => jobIdFor(
            runId: runId,
            canonicalTargetId: canonicalTargetId,
            type: dependencyType,
          ),
        )
        .toList(growable: false);
  }

  static List<AcademicFactoryJobType> _dependencyTypesFor(
    AcademicFactoryJobType type,
  ) {
    switch (type) {
      case AcademicFactoryJobType.sourceAcquisition:
        return const <AcademicFactoryJobType>[];
      case AcademicFactoryJobType.sourceValidation:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.sourceAcquisition,
        ];
      case AcademicFactoryJobType.digibookDraft:
      case AcademicFactoryJobType.crucibleDraft:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.sourceValidation,
        ];
      case AcademicFactoryJobType.digibookValidation:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.digibookDraft,
        ];
      case AcademicFactoryJobType.digibookProReview:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.digibookValidation,
        ];
      case AcademicFactoryJobType.digibookRepair:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.digibookProReview,
        ];
      case AcademicFactoryJobType.digibookAssembly:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.digibookProReview,
        ];
      case AcademicFactoryJobType.digibookMaterialization:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.digibookAssembly,
        ];
      case AcademicFactoryJobType.crucibleValidation:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.crucibleDraft,
        ];
      case AcademicFactoryJobType.crucibleProReview:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.crucibleValidation,
        ];
      case AcademicFactoryJobType.crucibleRepair:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.crucibleProReview,
        ];
      case AcademicFactoryJobType.crucibleMaterialization:
        return const <AcademicFactoryJobType>[
          AcademicFactoryJobType.crucibleProReview,
        ];
    }
  }
}

String _readString(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! String || value.trim().isEmpty) {
    throw FormatException(
      'AcademicFactoryWorkOrder.$key must be a non-empty string.',
    );
  }
  return value;
}

int _readInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int) {
    throw FormatException('AcademicFactoryWorkOrder.$key must be an integer.');
  }
  return value;
}

DateTime _readUtcDateTime(Map<String, Object?> json, String key) {
  final parsed = DateTime.parse(_readString(json, key));
  if (!parsed.isUtc) {
    throw FormatException('AcademicFactoryWorkOrder.$key must be UTC.');
  }
  return parsed;
}

List<String> _readStringList(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! List) {
    throw FormatException('AcademicFactoryWorkOrder.$key must be a List.');
  }
  return value.map((item) {
    if (item is! String || item.trim().isEmpty) {
      throw FormatException(
        'AcademicFactoryWorkOrder.$key values must be non-empty strings.',
      );
    }
    return item;
  }).toList(growable: false);
}
