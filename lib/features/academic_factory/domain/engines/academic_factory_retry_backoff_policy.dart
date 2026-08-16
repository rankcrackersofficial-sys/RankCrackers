/// Deterministic retry timing policy for transient failures in the
/// RankCrackers Autonomous Academic Factory.
///
/// CODE: AAF-003A
///
/// No jitter is applied at this pure-domain layer so tests and persisted
/// retry decisions remain deterministic. Runtime infrastructure may later
/// apply separately-governed dispatch spreading without changing the
/// canonical earliest retry time.
library;

import '../models/academic_factory_types.dart';

final class AcademicFactoryRetryBackoffPolicy {
  const AcademicFactoryRetryBackoffPolicy();

  bool supports(
    AcademicFactoryFailureClass failureClass,
  ) {
    return failureClass == AcademicFactoryFailureClass.transientProvider ||
        failureClass == AcademicFactoryFailureClass.rateLimited ||
        failureClass == AcademicFactoryFailureClass.timeout ||
        failureClass == AcademicFactoryFailureClass.sourceMissing ||
        failureClass == AcademicFactoryFailureClass.materializationFailed;
  }

  Duration delayFor({
    required AcademicFactoryFailureClass failureClass,
    required int attemptCount,
  }) {
    if (!supports(failureClass)) {
      throw ArgumentError.value(
        failureClass.wireName,
        'failureClass',
        'Failure class is not retry-backoff eligible.',
      );
    }

    if (attemptCount <= 0) {
      throw ArgumentError.value(
        attemptCount,
        'attemptCount',
        'attemptCount must be positive when calculating retry delay.',
      );
    }

    final base = _baseDelay(failureClass);
    final cap = _maximumDelay(failureClass);

    final exponent = attemptCount - 1 > 10 ? 10 : attemptCount - 1;

    final multiplier = 1 << exponent;

    final candidateSeconds = base.inSeconds * multiplier;

    final boundedSeconds =
        candidateSeconds > cap.inSeconds ? cap.inSeconds : candidateSeconds;

    return Duration(seconds: boundedSeconds);
  }

  DateTime nextRetryAtUtc({
    required AcademicFactoryFailureClass failureClass,
    required int attemptCount,
    required DateTime failedAtUtc,
  }) {
    if (!failedAtUtc.isUtc) {
      throw const FormatException(
        'failedAtUtc must be UTC.',
      );
    }

    return failedAtUtc.add(
      delayFor(
        failureClass: failureClass,
        attemptCount: attemptCount,
      ),
    );
  }

  Duration _baseDelay(
    AcademicFactoryFailureClass failureClass,
  ) {
    switch (failureClass) {
      case AcademicFactoryFailureClass.transientProvider:
        return const Duration(seconds: 30);

      case AcademicFactoryFailureClass.rateLimited:
        return const Duration(minutes: 1);

      case AcademicFactoryFailureClass.timeout:
        return const Duration(seconds: 30);

      case AcademicFactoryFailureClass.sourceMissing:
        return const Duration(minutes: 2);

      case AcademicFactoryFailureClass.materializationFailed:
        return const Duration(minutes: 1);

      case AcademicFactoryFailureClass.sourceInsufficient:
      case AcademicFactoryFailureClass.sourceMismatch:
      case AcademicFactoryFailureClass.validationFailed:
      case AcademicFactoryFailureClass.reviewDispute:
      case AcademicFactoryFailureClass.academicError:
      case AcademicFactoryFailureClass.formatError:
      case AcademicFactoryFailureClass.duplicate:
      case AcademicFactoryFailureClass.governanceBlocked:
      case AcademicFactoryFailureClass.unknown:
        throw ArgumentError.value(
          failureClass.wireName,
          'failureClass',
          'Failure class is not retry-backoff eligible.',
        );
    }
  }

  Duration _maximumDelay(
    AcademicFactoryFailureClass failureClass,
  ) {
    switch (failureClass) {
      case AcademicFactoryFailureClass.transientProvider:
        return const Duration(minutes: 15);

      case AcademicFactoryFailureClass.rateLimited:
        return const Duration(minutes: 30);

      case AcademicFactoryFailureClass.timeout:
        return const Duration(minutes: 10);

      case AcademicFactoryFailureClass.sourceMissing:
        return const Duration(hours: 1);

      case AcademicFactoryFailureClass.materializationFailed:
        return const Duration(minutes: 30);

      case AcademicFactoryFailureClass.sourceInsufficient:
      case AcademicFactoryFailureClass.sourceMismatch:
      case AcademicFactoryFailureClass.validationFailed:
      case AcademicFactoryFailureClass.reviewDispute:
      case AcademicFactoryFailureClass.academicError:
      case AcademicFactoryFailureClass.formatError:
      case AcademicFactoryFailureClass.duplicate:
      case AcademicFactoryFailureClass.governanceBlocked:
      case AcademicFactoryFailureClass.unknown:
        throw ArgumentError.value(
          failureClass.wireName,
          'failureClass',
          'Failure class is not retry-backoff eligible.',
        );
    }
  }
}
