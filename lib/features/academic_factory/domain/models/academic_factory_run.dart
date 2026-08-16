/// Canonical factory-run contract for the RankCrackers
/// Autonomous Academic Factory.
///
/// CODE: AAF-001
library;

import 'academic_factory_types.dart';

final class AcademicFactoryRun {
  AcademicFactoryRun({
    required this.runId,
    required this.missionId,
    required this.status,
    required this.createdAtUtc,
    required this.updatedAtUtc,
    this.startedAtUtc,
    this.completedAtUtc,
    this.pauseReason,
    this.schemaVersion = currentSchemaVersion,
  }) {
    validate();
  }

  static const int currentSchemaVersion = 1;

  final String runId;
  final String missionId;
  final AcademicFactoryRunStatus status;

  final DateTime createdAtUtc;
  final DateTime updatedAtUtc;
  final DateTime? startedAtUtc;
  final DateTime? completedAtUtc;

  final String? pauseReason;
  final int schemaVersion;

  bool get isTerminal => status.isTerminal;

  void validate() {
    if (runId.trim().isEmpty) {
      throw const FormatException(
        'AcademicFactoryRun.runId must not be empty.',
      );
    }

    if (missionId.trim().isEmpty) {
      throw const FormatException(
        'AcademicFactoryRun.missionId must not be empty.',
      );
    }

    if (schemaVersion <= 0) {
      throw const FormatException(
        'AcademicFactoryRun.schemaVersion must be positive.',
      );
    }

    final timestamps = <DateTime?>[
      createdAtUtc,
      updatedAtUtc,
      startedAtUtc,
      completedAtUtc,
    ];

    for (final timestamp in timestamps) {
      if (timestamp != null && !timestamp.isUtc) {
        throw const FormatException(
          'AcademicFactoryRun timestamps must be UTC.',
        );
      }
    }

    if (updatedAtUtc.isBefore(createdAtUtc)) {
      throw const FormatException(
        'AcademicFactoryRun.updatedAtUtc cannot precede createdAtUtc.',
      );
    }

    if (startedAtUtc != null && startedAtUtc!.isBefore(createdAtUtc)) {
      throw const FormatException(
        'AcademicFactoryRun.startedAtUtc cannot precede createdAtUtc.',
      );
    }

    if (completedAtUtc != null && completedAtUtc!.isBefore(createdAtUtc)) {
      throw const FormatException(
        'AcademicFactoryRun.completedAtUtc cannot precede createdAtUtc.',
      );
    }

    if (startedAtUtc != null &&
        completedAtUtc != null &&
        completedAtUtc!.isBefore(startedAtUtc!)) {
      throw const FormatException(
        'AcademicFactoryRun.completedAtUtc cannot precede startedAtUtc.',
      );
    }

    switch (status) {
      case AcademicFactoryRunStatus.planned:
        if (startedAtUtc != null || completedAtUtc != null) {
          throw const FormatException(
            'A planned factory run cannot have start/completion timestamps.',
          );
        }
        break;

      case AcademicFactoryRunStatus.running:
        if (startedAtUtc == null || completedAtUtc != null) {
          throw const FormatException(
            'A running factory run requires startedAtUtc and must not '
            'have completedAtUtc.',
          );
        }
        break;

      case AcademicFactoryRunStatus.paused:
        if (startedAtUtc == null || completedAtUtc != null) {
          throw const FormatException(
            'A paused factory run requires startedAtUtc and must not '
            'have completedAtUtc.',
          );
        }

        if (pauseReason == null || pauseReason!.trim().isEmpty) {
          throw const FormatException(
            'A paused factory run requires pauseReason.',
          );
        }
        break;

      case AcademicFactoryRunStatus.completed:
      case AcademicFactoryRunStatus.completedWithHolds:
      case AcademicFactoryRunStatus.failed:
        if (startedAtUtc == null || completedAtUtc == null) {
          throw FormatException(
            '${status.wireName} requires startedAtUtc and completedAtUtc.',
          );
        }
        break;

      case AcademicFactoryRunStatus.cancelled:
        if (completedAtUtc == null) {
          throw const FormatException(
            'A cancelled factory run requires completedAtUtc.',
          );
        }
        break;
    }

    if (status != AcademicFactoryRunStatus.paused && pauseReason != null) {
      throw const FormatException(
        'pauseReason is only valid for a paused factory run.',
      );
    }
  }

  Map<String, Object?> toJson() {
    validate();

    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'runId': runId,
      'missionId': missionId,
      'status': status.wireName,
      'createdAtUtc': createdAtUtc.toIso8601String(),
      'updatedAtUtc': updatedAtUtc.toIso8601String(),
      'startedAtUtc': startedAtUtc?.toIso8601String(),
      'completedAtUtc': completedAtUtc?.toIso8601String(),
      'pauseReason': pauseReason,
    };
  }

  factory AcademicFactoryRun.fromJson(Map<String, Object?> json) {
    return AcademicFactoryRun(
      schemaVersion: _runReadInt(json, 'schemaVersion'),
      runId: _runReadString(json, 'runId'),
      missionId: _runReadString(json, 'missionId'),
      status: academicFactoryRunStatusFromWire(
        _runReadString(json, 'status'),
      ),
      createdAtUtc: _runReadUtcDateTime(json, 'createdAtUtc'),
      updatedAtUtc: _runReadUtcDateTime(json, 'updatedAtUtc'),
      startedAtUtc: _runReadNullableUtcDateTime(json, 'startedAtUtc'),
      completedAtUtc: _runReadNullableUtcDateTime(json, 'completedAtUtc'),
      pauseReason: _runReadNullableString(json, 'pauseReason'),
    );
  }
}

String _runReadString(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value is! String) {
    throw FormatException(
      'AcademicFactoryRun.$key must be a String.',
    );
  }

  return value;
}

String? _runReadNullableString(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! String) {
    throw FormatException(
      'AcademicFactoryRun.$key must be a String or null.',
    );
  }

  return value;
}

int _runReadInt(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value is! int) {
    throw FormatException(
      'AcademicFactoryRun.$key must be an int.',
    );
  }

  return value;
}

DateTime _runReadUtcDateTime(
  Map<String, Object?> json,
  String key,
) {
  final value = _runReadString(json, key);
  final parsed = DateTime.tryParse(value);

  if (parsed == null || !parsed.isUtc) {
    throw FormatException(
      'AcademicFactoryRun.$key must be a UTC ISO-8601 timestamp.',
    );
  }

  return parsed;
}

DateTime? _runReadNullableUtcDateTime(
  Map<String, Object?> json,
  String key,
) {
  final value = json[key];

  if (value == null) {
    return null;
  }

  if (value is! String) {
    throw FormatException(
      'AcademicFactoryRun.$key must be a String or null.',
    );
  }

  final parsed = DateTime.tryParse(value);

  if (parsed == null || !parsed.isUtc) {
    throw FormatException(
      'AcademicFactoryRun.$key must be a UTC ISO-8601 timestamp.',
    );
  }

  return parsed;
}
