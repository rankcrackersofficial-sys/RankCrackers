import 'dart:math';
import '../../../core/models/question_model.dart';
import '../models/crucible_schedule.dart';
import 'micro_test_engine.dart';

/// MACRO TEST ENGINE (C5-R1 Compliant)
/// Deterministic assembly and manifest verification for Macro assessments.
class MacroTestEngine {
  static const int macroTargetQuestionCount = 100;
  static const int macroDurationMinutes = 120;

  // ===================================================
  // 1. STABLE SEED DERIVATION
  // ===================================================

  /// Stable platform-independent seed derivation based on canonical macro inputs.
  static int deriveSeed({
    required String macroTestId,
    required String scheduleId,
    required String poolVersion,
    required String assemblyVersion,
    required int attemptOrdinal,
  }) {
    final key = '$macroTestId:$scheduleId:$poolVersion:$assemblyVersion:$attemptOrdinal';
    int hash = 2166136261;
    for (int i = 0; i < key.length; i++) {
      hash = (hash ^ key.codeUnitAt(i)) * 16777619;
      hash = hash & 0xFFFFFFFF; // Clamp to 32-bit unsigned
    }
    return hash;
  }

  // ===================================================
  // 2. DETERMINISTIC MACRO ASSEMBLY
  // ===================================================

  /// Deterministically assembles Macro test questions for a student attempt from a verified phase question bank.
  /// Enforces:
  /// 1. Minimum verified phase bank requirement (bank < minimumPhaseBankDepth => returns [])
  /// 2. Phase integration student attempt selection (e.g. 50 questions for JEE Main 2027)
  static List<QuestionModel> assembleMacroTest({
    required String macroTestId,
    required String scheduleId,
    required List<String> allowedAtomIds,
    required List<QuestionModel> pool,
    required String recruitmentId,
    dynamic policy, // Supports MacroPolicy
    int? requiredCount, // Legacy parameter compatibility
    int? requiredBankCount,
    int? attemptCount,
    QuestionTrustSnapshot? trustSnapshot,
    int? manualSeed,
  }) {
    final List<QuestionModel> eligible = [];
    final Set<String> seenIds = {};
    final Set<String> seenLineages = {};

    for (final q in pool) {
      if (seenIds.contains(q.id)) continue;

      if (q.examId != recruitmentId) {
        continue;
      }

      final eligibilityError = MicroTestEngine.checkQuestionEligibility(
        q,
        scheduleId,
        allowedAtomIds,
        trustSnapshot: trustSnapshot,
      );
      if (eligibilityError == null) {
        final lineage = q.questionLineageId ?? q.id;
        if (seenLineages.contains(lineage)) {
          continue;
        }
        eligible.add(q);
        seenIds.add(q.id);
        seenLineages.add(lineage);
      }
    }

    final minBank = requiredBankCount ?? (requiredCount ?? 100);
    if (eligible.length < minBank) {
      return []; // Phase Bank Deficit exists: NOT_READY
    }

    eligible.sort((a, b) => a.id.compareTo(b.id));

    final seed = manualSeed ?? deriveSeed(
      macroTestId: macroTestId,
      scheduleId: scheduleId,
      poolVersion: '1.0.0',
      assemblyVersion: '1.0.0',
      attemptOrdinal: 1,
    );

    final targetAttemptCount = attemptCount ?? (requiredCount ?? eligible.length);
    final countToSelect = min(targetAttemptCount, eligible.length);

    final random = Random(seed);
    final List<QuestionModel> selected = [];
    final tempPool = List<QuestionModel>.from(eligible);

    for (int i = 0; i < countToSelect; i++) {
      final index = random.nextInt(tempPool.length);
      selected.add(tempPool.removeAt(index));
    }

    return selected;
  }

  // ===================================================
  // 3. 7-SLOT MACRO MANIFEST GENERATION
  // ===================================================

  /// Produces the complete 7-slot Macro manifest.
  static List<Map<String, dynamic>> build7SlotMacroManifest({
    required List<CrucibleSchedule> schedules,
    required List<QuestionModel> pool,
    required DateTime protocolStartTime,
    QuestionTrustSnapshot? trustSnapshot,
  }) {
    final List<Map<String, dynamic>> manifests = [];

    for (int phaseIndex = 1; phaseIndex <= 7; phaseIndex++) {
      final phaseStart = protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
      
      // Macro test window is active between Day 14 09:00 AM and Day 14 11:00 AM (12 days 23 hours to 13 days 1 hour elapsed within phase)
      final temporalStart = phaseStart.add(const Duration(days: 12, hours: 23));
      final temporalEnd = phaseStart.add(const Duration(days: 13, hours: 1));

      // Retrieve all atoms assigned to study schedules in this phase
      final List<String> phaseAtomIds = [];
      final int startIdx = (phaseIndex - 1) * 6 + 1;
      final int endIdx = phaseIndex * 6;

      for (int i = startIdx; i <= endIdx; i++) {
        final sched = schedules.firstWhere(
          (s) => s.scheduleIndex == i,
          orElse: () => CrucibleSchedule(
            id: 'sch_jee_main_2027_$i',
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
        phaseAtomIds.addAll(sched.atomicTopicIds);
      }
      final uniquePhaseAtomIds = phaseAtomIds.toSet().toList()..sort();

      int currentEligibleCount = 0;
      final Set<String> blockerReasonsSet = {};

      for (final q in pool) {
        final err = MicroTestEngine.checkQuestionEligibility(
          q,
          'sch_jee_main_2027_$endIdx', // Mapped to end schedule of phase
          uniquePhaseAtomIds,
          trustSnapshot: trustSnapshot,
        );
        if (err == null) {
          currentEligibleCount++;
        } else {
          if (err == 'TRUST_SNAPSHOT_NOT_READY') {
            blockerReasonsSet.add('TRUST_SNAPSHOT_NOT_READY');
          } else if (err.startsWith('source provenance unresolved')) {
            blockerReasonsSet.add('source provenance unresolved');
          } else if (err.startsWith('review authority unresolved')) {
            blockerReasonsSet.add('review authority unresolved');
          } else if (err.startsWith('answer schema invalid')) {
            blockerReasonsSet.add('answer schema invalid');
          } else if (err.startsWith('answer key academically unverified')) {
            blockerReasonsSet.add('answer key academically unverified');
          } else if (err.startsWith('solution verification missing where required')) {
            blockerReasonsSet.add('solution verification missing where required');
          } else if (err.startsWith('atom/source mapping invalid')) {
            blockerReasonsSet.add('atom/source mapping invalid');
          } else if (err.startsWith('unproven PYQ claim')) {
            blockerReasonsSet.add('unproven PYQ claim');
          } else if (err.startsWith('student publication gate false')) {
            blockerReasonsSet.add('student publication gate false');
          } else if (err.startsWith('superseded/conflicting version')) {
            blockerReasonsSet.add('superseded/conflicting version');
          } else if (err.startsWith('schema/type invalid')) {
            blockerReasonsSet.add('schema/type invalid');
          } else {
            blockerReasonsSet.add('other');
          }
        }
      }

      final deficit = max(0, 100 - currentEligibleCount);
      if (deficit > 0) {
        blockerReasonsSet.add('insufficient eligible questions');
      }

      manifests.add({
        'macroTestId': 'macro_${phaseIndex.toString().padLeft(2, '0')}',
        'phaseId': 'phase_$phaseIndex',
        'assignedAtomIds': uniquePhaseAtomIds,
        'temporalEligibilityStart': temporalStart,
        'temporalEligibilityEnd': temporalEnd,
        'requiredQuestionCount': 100,
        'currentEligibleQuestionCount': currentEligibleCount,
        'deficit': deficit,
        'readinessState': currentEligibleCount >= 100 ? 'READY' : 'NOT_READY',
        'blockerReasons': blockerReasonsSet.toList()..sort(),
        'poolVersion': '1.0.0',
      });
    }

    return manifests;
  }
}
