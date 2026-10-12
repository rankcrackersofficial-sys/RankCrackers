import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/dashboard/presentation/providers/dashboard_provider.dart';

void main() {
  test('dashboard metrics require a selected mission matching the engine graph', () {
    expect(
      hasCurrentSessionMissionMetrics(
        selectedMissionId: 'neet_ug_2027',
        engineMissionId: 'jee_main_2026',
        metricsBoundToSession: true,
      ),
      isFalse,
    );
  });

  test('dashboard metrics stay hidden until bound to the current session', () {
    expect(
      hasCurrentSessionMissionMetrics(
        selectedMissionId: 'neet_ug_2027',
        engineMissionId: 'neet_ug_2027',
        metricsBoundToSession: false,
      ),
      isFalse,
    );
  });

  test('dashboard metrics are available for the matching authorized session', () {
    expect(
      hasCurrentSessionMissionMetrics(
        selectedMissionId: 'neet_ug_2027',
        engineMissionId: 'neet_ug_2027',
        metricsBoundToSession: true,
      ),
      isTrue,
    );
  });

  test('dashboard metrics are hidden when no mission is selected', () {
    expect(
      hasCurrentSessionMissionMetrics(
        selectedMissionId: '',
        engineMissionId: 'jee_main_2026',
        metricsBoundToSession: true,
      ),
      isFalse,
    );
  });
}
