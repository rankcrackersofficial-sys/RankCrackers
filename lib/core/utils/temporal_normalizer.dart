import 'package:cloud_firestore/cloud_firestore.dart';

/// Governed Temporal Normalizer for RankCrackers
/// Guarantees safe conversion of Firestore Timestamp, DateTime, legacy epoch ms (int), and ISO strings
/// into strongly-typed Dart DateTime objects without throwing runtime cast exceptions.
class TemporalNormalizer {
  const TemporalNormalizer._();

  /// Parse required temporal field with fallback if null or invalid
  static DateTime parseRequired(
    Object? raw, {
    DateTime? fallback,
    String fieldName = 'temporal_field',
  }) {
    final parsed = parseOptional(raw, fieldName: fieldName);
    if (parsed != null) return parsed;
    if (fallback != null) return fallback;
    return DateTime.fromMillisecondsSinceEpoch(0);
  }

  /// Parse optional temporal field (returns null if raw is null or unrecognized)
  static DateTime? parseOptional(
    Object? raw, {
    String fieldName = 'temporal_field',
  }) {
    if (raw == null) return null;

    if (raw is Timestamp) {
      return raw.toDate();
    }

    if (raw is DateTime) {
      return raw;
    }

    if (raw is int) {
      return DateTime.fromMillisecondsSinceEpoch(raw);
    }

    if (raw is String) {
      return DateTime.tryParse(raw);
    }

    // Dynamic map with _seconds / _nanoseconds from JSON or REST APIs
    if (raw is Map) {
      final seconds = raw['_seconds'] ?? raw['seconds'];
      final nanoseconds = raw['_nanoseconds'] ?? raw['nanoseconds'] ?? 0;
      if (seconds is int && nanoseconds is int) {
        return Timestamp(seconds, nanoseconds).toDate();
      }
    }

    return null;
  }
}
