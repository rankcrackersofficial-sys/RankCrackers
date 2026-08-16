/// Canonical immutable job contract for the RankCrackers
/// Autonomous Academic Factory.
///
/// CODE: AAF-001
library;

import 'academic_factory_types.dart';

final class AcademicFactoryJob {
  AcademicFactoryJob({
    required this.jobId,
    required this.runId,
    required this.missionId,
    required this.canonicalTargetId,
    required this.type,
    required this.state,
    required List<String> dependencyJobIds,
    required this.attemptCount,
    required this.maxAttempts,
    required this.idempotencyKey,
    required this.createdAtUtc,
    required this.updatedAtUtc,
    this.inputHash,
    this.outputHash,
    this.leaseOwner,
    this.leaseExpiresAtUtc,
    this.nextRetryAtUtc,
    this.failureClass,
    this.failureMessage,
    this.schemaVersion = currentSchemaVersion,
  }) : dependencyJobIds =
            List<String>.unmodifiable(dependencyJobIds.map((e) => e.trim())) {
    validate();
  }

  static const int currentSchemaVersion = 1;

  final String jobId;
  final String runId;
  final String missionId;
  final String canonicalTargetId;
  final AcademicFactoryJobType type;
  final AcademicFactoryJobState state;
  final List<String> dependencyJobIds;
  final int attemptCount;
  final int maxAttempts;
  final String idempotencyKey;

  final String? inputHash;
  final String? outputHash;

  final String? leaseOwner;
  final DateTime? leaseExpiresAtUtc;
  final DateTime? nextRetryAtUtc;

  final AcademicFactoryFailureClass? failureClass;
  final String? failureMessage;

  final DateTime createdAtUtc;
  final DateTime updatedAtUtc;
  final int schemaVersion;

  bool get isTerminal => state.isTerminal;

  bool get attemptsExhausted => attemptCount >= maxAttempts;

  void validate() {
    _requireNonEmpty(jobId, 'jobId');
    _requireNonEmpty(runId, 'runId');
    _requireNonEmpty(missionId, 'missionId');
    _requireNonEmpty(canonicalTargetId, 'canonicalTargetId');
    _requireNonEmpty(idempotencyKey, 'idempotencyKey');

    if (schemaVersion <= 0) {
      throw const FormatException(
        'AcademicFactoryJob.schemaVersion must be positive.',
      );
    }

    if (attemptCount < 0) {
      throw const FormatException(
        'AcademicFactoryJob.attemptCount cannot be negative.',
      );
    }

    if (maxAttempts <= 0) {
      throw const FormatException(
        'AcademicFactoryJob.maxAttempts must be positive.',
      );
    }

    if (attemptCount > maxAttempts) {
      throw const FormatException(
        'AcademicFactoryJob.attemptCount cannot exceed maxAttempts.',
      );
    }

    if (!createdAtUtc.isUtc || !updatedAtUtc.isUtc) {
      throw const FormatException(
        'AcademicFactoryJob timestamps must be UTC.',
      );
    }

    if (updatedAtUtc.isBefore(createdAtUtc)) {
      throw const FormatException(
        'AcademicFactoryJob.updatedAtUtc cannot precede createdAtUtc.',
      );
    }

    final dependencySet = <String>{};

    for (final dependencyId in dependencyJobIds) {
      if (dependencyId.isEmpty) {
        throw const FormatException(
          'AcademicFactoryJob dependencyJobIds cannot contain empty IDs.',
        );
      }

      if (dependencyId == jobId) {
        throw const FormatException(
          'AcademicFactoryJob cannot depend on itself.',
        );
      }

      if (!dependencySet.add(dependencyId)) {
        throw FormatException(
          'AcademicFactoryJob contains duplicate dependency: $dependencyId',
        );
      }
    }

    _validateOptionalHash(inputHash, 'inputHash');
    _validateOptionalHash(outputHash, 'outputHash');

    if (state.requiresLease) {
      _requireNonEmptyNullable(leaseOwner, 'leaseOwner');

      final expiry = leaseExpiresAtUtc;
      if (expiry == null || !expiry.isUtc) {
        throw const FormatException(
          'Leased/running/reviewing/materializing jobs require a UTC '
          'leaseExpiresAtUtc.',
        );
      }
    } else {
      if (leaseOwner != null || leaseExpiresAtUtc != null) {
        throw const FormatException(
          'Non-leased job states cannot retain lease metadata.',
        );
      }
    }

    if (state == AcademicFactoryJobState.retryWait) {
      final retryAt = nextRetryAtUtc;

      if (retryAt == null || !retryAt.isUtc) {
        throw const FormatException(
          'retry_wait jobs require a UTC nextRetryAtUtc.',
        );
      }
    } else if (nextRetryAtUtc != null) {
      throw const FormatException(
        'Only retry_wait jobs may define nextRetryAtUtc.',
      );
    }

    if (state.requiresFailure && failureClass == null) {
      throw FormatException(
        '${state.wireName} requires failureClass.',
      );
    }

    if (!state.requiresFailure && failureClass != null) {
      throw FormatException(
        '${state.wireName} cannot retain failureClass.',
      );
    }

    if (failureClass == null && failureMessage != null) {
      throw const FormatException(
        'failureMessage requires failureClass.',
      );
    }

    if (failureMessage != null && failureMessage!.trim().isEmpty) {
      throw const FormatException(
        'failureMessage cannot be blank.',
      );
    }

    if ((state == AcademicFactoryJobState.approved ||
            state == AcademicFactoryJobState.materializing ||
            state == AcademicFactoryJobState.published) &&
        outputHash == null) {
      throw FormatException(
        '${state.wireName} requires outputHash.',
      );
    }
  }

  Map<String, Object?> toJson() {
    validate();

    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'jobId': jobId,
      'runId': runId,
      'missionId': missionId,
      'canonicalTargetId': canonicalTargetId,
      'type': type.wireName,
      'state': state.wireName,
      'dependencyJobIds': dependencyJobIds,
      'attemptCount': attemptCount,
      'maxAttempts': maxAttempts,
      'idempotencyKey': idempotencyKey,
      'inputHash': inputHash,
      'outputHash': outputHash,
      'leaseOwner': leaseOwner,
      'leaseExpiresAtUtc': leaseExpiresAtUtc?.toIso8601String(),
      'nextRetryAtUtc': nextRetryAtUtc?.toIso8601String(),
      'failureClass': failureClass?.wireName,
      'failureMessage': failureMessage,
      'createdAtUtc': createdAtUtc.toIso8601String(),
      'updatedAtUtc': updatedAtUtc.toIso8601String(),
    };
  }

  factory AcademicFactoryJob.fromJson(Map<String, Object?> json) {
    final dependenciesRaw = json['dependencyJobIds'];

    if (dependenciesRaw is! List) {
      throw const FormatException(
        'AcademicFactoryJob.dependencyJobIds must be a List.',
      );
    }

    final dependencies = dependenciesRaw.map((value) {
      if (value is! String) {
        throw const FormatException(
          'AcademicFactoryJob dependency IDs must be strings.',
        );
      }
      return value;
    }).toList(growable: false);

    final failureWire = json['failureClass'];

    return AcademicFactoryJob(
      schemaVersion: _readInt(json, 'schemaVersion'),
      jobId: _readString(json, 'jobId'),
      runId: _readString(json, 'runId'),
      missionId: _readString(json, 'missionId'),
      canonicalTargetId: _readString(json, 'canonicalTargetId'),
      type: academicFactoryJobTypeFromWire(
        _readString(json, 'type'),
      ),
      state: academicFactoryJobStateFromWire(
        _readString(json, 'state'),
      ),
      dependencyJobIds: dependencies,
      attemptCount: _readInt(json, 'attemptCount'),
      maxAttempts: _readInt(json, 'maxAttempts'),
      idempotencyKey: _readString(json, 'idempotencyKey'),
      inputHash: _readNullableString(json, 'inputHash'),
      outputHash: _readNullableString(json, 'outputHash'),
      leaseOwner: _readNullableString(json, 'leaseOwner'),
      leaseExpiresAtUtc: _readNullableUtcDateTime(json, 'leaseExpiresAtUtc'),
      nextRetryAtUtc: _readNullableUtcDateTime(json, 'nextRetryAtUtc'),
      failureClass: failureWire == null
          ? null
          : academicFactoryFailureClassFromWire(
              _requireStringValue(failureWire, 'failureClass'),
            ),
      failureMessage: _readNullableString(json, 'failureMessage'),
      createdAtUtc: _readUtcDateTime(json, 'createdAtUtc'),
      updatedAtUtc: _readUtcDateTime(json, 'updatedAtUtc'),
    );
  }

  static void _requireNonEmpty(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException(
        'AcademicFactoryJob.$field must not be empty.',
      );
    }
  }

  static void _requireNonEmptyNullable(String? value, String field) {
    if (value == null || value.trim().isEmpty) {
      throw FormatException(
        'AcademicFactoryJob.$field must not be empty.',
      );
    }
  }

  static void _validateOptionalHash(String? value, String field) {
    if (value != null && value.trim().isEmpty) {
      throw FormatException(
        'AcademicFactoryJob.$field cannot be blank.',
      );
    }
  }
}

String _readString(Map<String, Object?> json, String key) {
  return _requireStringValue(json[key], key);
}

String _requireStringValue(Object? value, String key) {
  if (value is! String) {
    throw FormatException(
      'AcademicFactoryJob.$key must be a String.',
    );
  }
  return value;
}

String? _readNullableString(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];
  if (value == null) {
    return null;
  }
  return _requireStringValue(value, key);
}

int _readInt(Map<String, Object?> json, String key) {
  final value = json[key];
  if (value is! int) {
    throw FormatException(
      'AcademicFactoryJob.$key must be an int.',
    );
  }
  return value;
}

DateTime _readUtcDateTime(
  Map<String, Object?> json,
  String key,
) {
  final value = _readString(json, key);
  final parsed = DateTime.tryParse(value);

  if (parsed == null || !parsed.isUtc) {
    throw FormatException(
      'AcademicFactoryJob.$key must be a UTC ISO-8601 timestamp.',
    );
  }

  return parsed;
}

DateTime? _readNullableUtcDateTime(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! String) {
    throw FormatException(
      'AcademicFactoryJob.$key must be a String or null.',
    );
  }

  final parsed = DateTime.tryParse(value);

  if (parsed == null || !parsed.isUtc) {
    throw FormatException(
      'AcademicFactoryJob.$key must be a UTC ISO-8601 timestamp.',
    );
  }

  return parsed;
}
