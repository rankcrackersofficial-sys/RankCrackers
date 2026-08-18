/// Builds analytics from governed student learning state only.
library;

import '../models/student_learning_state.dart';
import '../models/student_personalization_analytics.dart';

final class StudentPersonalizationAnalyticsEngine {
  const StudentPersonalizationAnalyticsEngine();

  StudentPersonalizationAnalytics derive({
    required StudentLearningState state,
    required DateTime nowUtc,
  }) {
    if (!nowUtc.isUtc) {
      throw const FormatException('nowUtc must be UTC.');
    }
    state.validate();

    final analytics = StudentPersonalizationAnalytics(
      studentId: state.studentId,
      targetAmtnId: state.amtnId,
      calculatedAtUtc: nowUtc,
      masteryTruth: _truthFor(state.masteryConfidence),
      retentionTruth: _truthFor(state.retentionConfidence),
      fluencyTruth: _truthFor(state.fluencyConfidence),
      prerequisiteTruth: _truthFor(state.prerequisiteConfidence),
      evidenceCount: state.totalEligibleEvidenceCount,
      schemaVersion: StudentPersonalizationAnalytics.currentSchemaVersion,
    );
    analytics.validate();
    return analytics;
  }

  StudentAnalyticsTruthState _truthFor(
    StudentLearningStateConfidence confidence,
  ) {
    switch (confidence) {
      case StudentLearningStateConfidence.insufficient:
        return StudentAnalyticsTruthState.insufficient;
      case StudentLearningStateConfidence.low:
      case StudentLearningStateConfidence.medium:
      case StudentLearningStateConfidence.high:
        return StudentAnalyticsTruthState.supported;
    }
  }
}
