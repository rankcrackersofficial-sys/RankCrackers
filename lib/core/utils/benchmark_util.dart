import 'package:flutter/foundation.dart';

/// 🔱 BENCHMARK RESULT
class BenchmarkResult {
  final String label;
  final int durationMs;
  final DateTime timestamp;

  const BenchmarkResult({
    required this.label,
    required this.durationMs,
    required this.timestamp,
  });

  @override
  String toString() => '🔱 BENCHMARK [$label]: ${durationMs}ms';
}

/// 🔱 BENCHMARK REPOSITORY
class BenchmarkRepository {
  static final List<BenchmarkResult> _results = [];
  static void add(BenchmarkResult result) {
    _results.add(result);
    debugPrint(result.toString());
  }
  static List<BenchmarkResult> get results => List.unmodifiable(_results);
  static void clear() => _results.clear();
}

/// 🔱 BENCHMARK UTIL
/// Precise timing utility for performance profiling.
class BenchmarkUtil {
  static final Map<String, Stopwatch> _watches = {};

  static void start(String label) {
    _watches[label] = Stopwatch()..start();
  }

  static int stop(String label) {
    final watch = _watches[label];
    if (watch == null) return 0;
    watch.stop();
    final elapsed = watch.elapsedMilliseconds;
    _watches.remove(label);
    
    BenchmarkRepository.add(BenchmarkResult(
      label: label,
      durationMs: elapsed,
      timestamp: DateTime.now(),
    ));

    return elapsed;
  }
}
