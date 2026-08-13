import 'dart:math';
import '../../../core/models/question_model.dart';
import '../models/crucible_schedule.dart';

/// 🔱 MICRO TEST ENGINE (C2 Compliant)
/// Sovereign authority for gating, validating, and assembling Micro Tests.
class MicroTestEngine {

  // ===================================================
  // 1. QUESTION ELIGIBILITY GATE
  // ===================================================

  /// Deterministically evaluates a question's eligibility for a given schedule.
  /// Returns a rejection reason string if ineligible, or null if fully eligible.
  static String? checkQuestionEligibility(
    QuestionModel question,
    String scheduleId,
    List<String> allowedAtomIds,
  ) {
    // A. Schema Invalidation Checks
    if (question.id.isEmpty) return 'schema invalid: missing questionId';
    if (question.question.trim().isEmpty) return 'schema invalid: missing stem';
    if (question.examId.isEmpty) return 'schema invalid: missing examId';
    if (question.subjectId.isEmpty) return 'schema invalid: missing subjectId';
    if (question.options.isEmpty) return 'schema invalid: missing options';
    
    // Malformed options checks
    if (question.options.length != 4) {
      return 'answer key unverified: MCQs must have exactly 4 options';
    }
    for (final opt in question.options) {
      if (opt.trim().isEmpty) {
        return 'answer key unverified: option contains empty string';
      }
    }

    // Answer index boundary checks
    if (question.answerIndex < 0 || question.answerIndex >= question.options.length) {
      return 'answer key unverified: correct answer index out of bounds';
    }

    // B. Scope Leakage / Mapping Checks
    if (question.atomicTopicIds.isEmpty) {
      return 'mapping error: question must map to at least one atomic ID';
    }
    
    // Ensure ALL atomicTopicIds of the question are within the schedule's allowed list
    for (final atomId in question.atomicTopicIds) {
      if (!allowedAtomIds.contains(atomId)) {
        return 'mapping error: atom $atomId is outside the current schedule scope';
      }
    }

    // C. Source & Governance Checks
    if (question.status == 'draft') {
      return 'review failed: question is in draft status';
    }
    
    if (question.status != 'verified' && question.status != 'published') {
      return 'review failed: question is not academically verified or published';
    }

    // Provenance checks
    if (question.verifiedBy == null || question.verifiedBy!.trim().isEmpty) {
      return 'source not verified: missing verifier signature';
    }
    if (question.verifiedAt == null) {
      return 'source not verified: missing verification timestamp';
    }

    // Model self-review check (prevents AI self-promotion)
    if (question.verifiedBy == 'system' || question.verifiedBy == 'gemini') {
      return 'model-only promotion: question verified by model instead of human authority';
    }

    // D. Safe placeholders / preview checks
    final stemLower = question.question.toLowerCase();
    if (stemLower.contains('placeholder') || stemLower.contains('todo') || stemLower.contains('preview')) {
      return 'other: unsafe placeholder or preview content detected';
    }

    return null; // Fully eligible
  }

  // ===================================================
  // 2. DETERMINISTIC ASSEMBLY
  // ===================================================

  /// Assembles a Micro Test of exactly 50 questions from the pool.
  static List<QuestionModel> assembleMicroTest({
    required String scheduleId,
    required List<String> allowedAtomIds,
    required List<QuestionModel> pool,
    int requiredCount = 50,
    int seed = 42,
  }) {
    final List<QuestionModel> eligible = [];
    final Set<String> seenIds = {};

    for (final q in pool) {
      if (seenIds.contains(q.id)) continue;
      
      final eligibilityError = checkQuestionEligibility(q, scheduleId, allowedAtomIds);
      if (eligibilityError == null) {
        eligible.add(q);
        seenIds.add(q.id);
      }
    }

    if (eligible.length < requiredCount) {
      return []; // Deficit exists: NOT_READY
    }

    // Deterministic sort by ID to ensure a stable baseline
    eligible.sort((a, b) => a.id.compareTo(b.id));

    // Seeded random selection
    final random = Random(seed);
    final List<QuestionModel> selected = [];
    final tempPool = List<QuestionModel>.from(eligible);

    for (int i = 0; i < requiredCount; i++) {
      final index = random.nextInt(tempPool.length);
      selected.add(tempPool.removeAt(index));
    }

    return selected;
  }

  // ===================================================
  // 3. 42-SLOT MANIFEST GENERATION
  // ===================================================

  /// Produces the complete 42-slot Micro manifest.
  static List<Map<String, dynamic>> build42SlotManifest({
    required List<CrucibleSchedule> schedules,
    required List<QuestionModel> pool,
    required DateTime protocolStartTime,
  }) {
    final List<Map<String, dynamic>> manifests = [];

    // Filter schedules to study schedules (schedules 1 to 42)
    final studySchedules = schedules
        .where((s) => s.scheduleIndex >= 1 && s.scheduleIndex <= 42)
        .toList()
      ..sort((a, b) => a.scheduleIndex.compareTo(b.scheduleIndex));

    for (int i = 1; i <= 42; i++) {
      final schedule = studySchedules.firstWhere(
        (s) => s.scheduleIndex == i,
        orElse: () => CrucibleSchedule(
          id: 'sch_unknown_$i',
          recruitmentId: 'jee_main_2027',
          scheduleIndex: i,
          nodeIds: const [],
          atomicTopicIds: const [],
          scheduleType: 'study',
          targetHours: 4.0,
          blueprintId: 'default',
          digibookSessionId: 'default',
        ),
      );

      final phaseIndex = (i - 1) ~/ 6 + 1;
      final scheduleOffset = (i - 1) % 6;
      final phaseStart = protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
      final learningStart = phaseStart.add(Duration(days: scheduleOffset * 2));
      final temporalStart = learningStart.add(const Duration(hours: 47));
      final temporalEnd = learningStart.add(const Duration(hours: 48));

      // Calculate pool stats for this schedule
      int currentEligibleCount = 0;
      final List<String> blockerReasons = [];

      for (final q in pool) {
        final err = checkQuestionEligibility(q, schedule.id, schedule.atomicTopicIds);
        if (err == null) {
          currentEligibleCount++;
        }
      }

      final deficit = max(0, 50 - currentEligibleCount);
      if (deficit > 0) {
        blockerReasons.add('insufficient eligible questions');
      }

      // Check for held atoms
      bool hasHeldAtom = false;
      for (final q in pool) {
        for (final atomId in q.atomicTopicIds) {
          if (schedule.atomicTopicIds.contains(atomId)) {
            // Held atoms logic (unverified verifier or status unverified)
            if (q.status != 'verified' && q.status != 'published') {
              hasHeldAtom = true;
            }
          }
        }
      }
      if (hasHeldAtom) {
        blockerReasons.add('atom academically held');
      }

      manifests.add({
        'microTestId': 'micro_${i.toString().padLeft(2, '0')}',
        'scheduleId': schedule.id,
        'phaseId': 'phase_$phaseIndex',
        'scheduleIndex': i,
        'assignedAtomIds': schedule.atomicTopicIds,
        'temporalEligibilityStart': temporalStart,
        'temporalEligibilityEnd': temporalEnd,
        'requiredQuestionCount': 50,
        'currentEligibleQuestionCount': currentEligibleCount,
        'deficit': deficit,
        'readinessState': currentEligibleCount >= 50 ? 'READY' : 'NOT_READY',
        'blockerReasons': blockerReasons,
        'poolVersion': '1.0.0',
      });
    }

    return manifests;
  }
}
