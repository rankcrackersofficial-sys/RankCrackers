import 'package:equatable/equatable.dart';

/// DIGIBOOK LAUNCH ARGS (Canonical Bridge Payload)
///
/// Holds governed identity and component payloads for rendering a private
/// DigiBook Generation Unit lesson on Android.
class DigiBookLaunchArgs extends Equatable {
  final String generationUnitId;
  final String canonicalNodeId;
  final String revisionId;
  final String subject;
  final String topicTitle;
  final String factSemantics;
  final String atomicFactSetHash;
  final List<String> atomicFactIds;
  final Map<String, dynamic>? rawLessonData;

  const DigiBookLaunchArgs({
    required this.generationUnitId,
    required this.canonicalNodeId,
    required this.revisionId,
    required this.subject,
    required this.topicTitle,
    required this.factSemantics,
    this.atomicFactSetHash = '',
    required this.atomicFactIds,
    this.rawLessonData,
  });

  bool get isFactComplete => factSemantics == 'SOURCE_FACT_COMPLETE';

  Map<String, dynamic>? get components =>
      rawLessonData?['components'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentOverview =>
      components?['overview'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentConcepts =>
      components?['concepts'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentFormulaRegister =>
      components?['formulaRegister'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentCommonMisconceptions =>
      components?['commonMisconceptions'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentWorkedExamples =>
      components?['workedExamples'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentSelfChecks =>
      components?['selfChecks'] as Map<String, dynamic>?;

  Map<String, dynamic>? get componentAssessmentPreview =>
      components?['assessmentPreview'] as Map<String, dynamic>?;

  @override
  List<Object?> get props => [
        generationUnitId,
        canonicalNodeId,
        revisionId,
        subject,
        topicTitle,
        factSemantics,
        atomicFactSetHash,
        atomicFactIds,
      ];
}
