import '../../shared/session/session_manager.dart';
import 'telemetry_engine.dart';

class StudentRouteTelemetry {
  StudentRouteTelemetry._();
  static final StudentRouteTelemetry instance = StudentRouteTelemetry._();
  String? _lastLocation;
  DateTime? _lastCapturedAt;

  Future<void> report(String location) async {
    final now = DateTime.now();
    if (_lastLocation == location &&
        _lastCapturedAt != null &&
        now.difference(_lastCapturedAt!) < const Duration(seconds: 2)) {
      return;
    }
    _lastLocation = location;
    _lastCapturedAt = now;
    final recruitmentId = SessionManager.selectedRecruitmentIdSync();
    if (recruitmentId == null ||
        recruitmentId.isEmpty ||
        recruitmentId == 'unresolved') {
      return;
    }
    await TelemetryEngine.instance.capture(
      eventName: 'student_surface_opened',
      durationMs: 0,
      recruitmentId: recruitmentId,
      metadata: <String, dynamic>{
        'surface': _surfaceFor(location),
        'route': location,
      },
    );
  }

  String _surfaceFor(String location) {
    final normalized = location.split('?').first;
    if (normalized == '/') return 'splash';
    final segments = normalized.split('/').where((part) => part.isNotEmpty);
    return segments.isEmpty ? 'unknown' : segments.first;
  }
}
