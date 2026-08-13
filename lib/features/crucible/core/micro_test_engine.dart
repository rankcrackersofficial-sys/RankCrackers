import 'dart:math';
import '../../../core/models/question_model.dart';
import '../models/crucible_schedule.dart';

/// 🔱 MICRO TEST ENGINE (C2-FIX1 Compliant)
/// Hardened authority for Crucible Micro question contracts and academic safety gates.
class MicroTestEngine {

  // ===================================================
  // AUTHORITATIVE REGISTRIES FOR TRUST GATE RESOLUTION
  // ===================================================
  static final Set<String> verifiedFactIds = {};
  static final Map<String, String> factSourceDocuments = {}; // factId -> sourceDocumentId
  static final Set<String> heldFactIds = {}; // unverified or held facts
  
  static final Map<String, String> reviewerAuthorities = {}; // reviewerId -> role (e.g. 'PRO_REVIEWER')
  static final Set<String> verifiedAnswerKeys = {}; // questionId
  static final Set<String> studentReadyQuestionIds = {}; // questionId
  
  static final Map<String, String> pyqPaperEvidence = {}; // questionId -> officialPaperId
  
  static final Map<String, int> activeQuestionVersions = {}; // questionId -> activeVersion

  /// Clears all registries for testing containment.
  static void clearRegistries() {
    verifiedFactIds.clear();
    factSourceDocuments.clear();
    heldFactIds.clear();
    reviewerAuthorities.clear();
    verifiedAnswerKeys.clear();
    studentReadyQuestionIds.clear();
    pyqPaperEvidence.clear();
    activeQuestionVersions.clear();
  }

  // ===================================================
  // 1. QUESTION ELIGIBILITY GATES
  // ===================================================

  /// Validates a question against all academic governance and provenance contracts.
  /// Returns null if fully eligible, or a specific blocker string.
  static String? checkQuestionEligibility(
    QuestionModel question,
    String scheduleId,
    List<String> allowedAtomIds,
  ) {
    // -------------------------------------------------
    // A. Schema & Type Validity
    // -------------------------------------------------
    if (question.id.isEmpty || question.question.trim().isEmpty || question.examId.isEmpty || question.subjectId.isEmpty) {
      return 'schema/type invalid: missing basic fields';
    }

    // Determine type by options list length:
    final isMCQ = question.options.isNotEmpty;

    if (isMCQ) {
      if (question.options.length != 4) {
        return 'answer schema invalid: MCQ options count must equal 4';
      }
      for (final opt in question.options) {
        if (opt.trim().isEmpty) {
          return 'answer schema invalid: MCQ option contains empty text';
        }
      }
      if (question.answerIndex < 0 || question.answerIndex >= 4) {
        return 'answer schema invalid: MCQ answerIndex out of bounds';
      }
    } else {
      // Numerical / integer type: options are empty.
      // Do NOT artificially enforce options.length == 4.
      // Just check if answerIndex is valid (often 0 or a placeholder index)
      if (question.answerIndex < 0) {
        return 'schema/type invalid: numerical answer index must not be negative';
      }
    }

    // Unsafe placeholders
    final stemLower = question.question.toLowerCase();
    if (stemLower.contains('placeholder') || stemLower.contains('todo') || stemLower.contains('preview')) {
      return 'schema/type invalid: unsafe placeholder or preview content detected';
    }

    // -------------------------------------------------
    // B. Atom & Node Resolution (Scope Isolation)
    // -------------------------------------------------
    if (question.atomicTopicIds.isEmpty) {
      return 'atom/source mapping invalid: missing atomic mapping';
    }
    for (final atomId in question.atomicTopicIds) {
      if (!allowedAtomIds.contains(atomId)) {
        return 'atom/source mapping invalid: atom $atomId is outside schedule scope';
      }
    }

    // -------------------------------------------------
    // C. Source Provenance Gate
    // -------------------------------------------------
    if (question.factId == null || question.factId!.isEmpty) {
      return 'source provenance unresolved: missing factId';
    }
    if (!verifiedFactIds.contains(question.factId)) {
      return 'source provenance unresolved: factId ${question.factId} is unverified or unregistered';
    }
    if (heldFactIds.contains(question.factId)) {
      return 'source provenance unresolved: fact ${question.factId} is academically held/rejected';
    }
    final sourceDoc = factSourceDocuments[question.factId];
    if (sourceDoc == null || sourceDoc.isEmpty) {
      return 'source provenance unresolved: missing fact source document lineage';
    }

    // -------------------------------------------------
    // D. Reviewer Authority Gate (Human Authority Law)
    // -------------------------------------------------
    if (question.status == 'draft') {
      return 'review authority unresolved: question is in draft status';
    }
    if (question.verifiedBy == null || question.verifiedBy!.isEmpty) {
      return 'review authority unresolved: missing verification signature';
    }
    if (question.verifiedAt == null) {
      return 'review authority unresolved: missing verification date';
    }
    final role = reviewerAuthorities[question.verifiedBy];
    if (role == null || role == 'AI' || role == 'system') {
      return 'review authority unresolved: verifier has unverified review authority';
    }

    // -------------------------------------------------
    // E. Academic Key Verification Gate
    // -------------------------------------------------
    if (!verifiedAnswerKeys.contains(question.id)) {
      return 'answer key academically unverified: key lacks professional verification';
    }

    // -------------------------------------------------
    // F. PYQ Claim Proof
    // -------------------------------------------------
    if (question.isPYQ) {
      final paperEvidence = pyqPaperEvidence[question.id];
      if (paperEvidence == null || paperEvidence.isEmpty) {
        return 'unproven PYQ claim: missing official paper evidence for PYQ claim';
      }
    }

    // -------------------------------------------------
    // G. Publication / Student-Ready Gate
    // -------------------------------------------------
    if (question.status != 'published') {
      return 'student publication gate false: question status is not published';
    }
    if (!studentReadyQuestionIds.contains(question.id)) {
      return 'student publication gate false: publication eligibility has not been granted';
    }

    // -------------------------------------------------
    // H. Version / Supersession Safety
    // -------------------------------------------------
    final activeVersion = activeQuestionVersions[question.id];
    if (activeVersion != null && question.version < activeVersion) {
      return 'superseded/conflicting version: version is superseded';
    }

    return null; // Fully eligible
  }

  // ===================================================
  // 2. DETERMINISTIC MICRO ASSEMBLY
  // ===================================================

  /// Deterministically assembles exactly 50 eligible questions using a stable seed.
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

    // Stable sorting by ID
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

    final studySchedules = schedules
        .where((s) => s.scheduleIndex >= 1 && s.scheduleIndex <= 42)
        .toList()
      ..sort((a, b) => a.scheduleIndex.compareTo(b.scheduleIndex));

    for (int i = 1; i <= 42; i++) {
      final schedule = studySchedules.firstWhere(
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

      final phaseIndex = (i - 1) ~/ 6 + 1;
      final scheduleOffset = (i - 1) % 6;
      final phaseStart = protocolStartTime.add(Duration(days: (phaseIndex - 1) * 14));
      final learningStart = phaseStart.add(Duration(days: scheduleOffset * 2));
      final temporalStart = learningStart.add(const Duration(hours: 47));
      final temporalEnd = learningStart.add(const Duration(hours: 48));

      // Calculate pool stats for this schedule
      int currentEligibleCount = 0;
      final Set<String> blockerReasonsSet = {};

      for (final q in pool) {
        final err = checkQuestionEligibility(q, schedule.id, schedule.atomicTopicIds);
        if (err == null) {
          currentEligibleCount++;
        } else {
          // Parse specific blocker category from error string
          if (err.startsWith('source provenance unresolved')) {
            blockerReasonsSet.add('source provenance unresolved');
          } else if (err.startsWith('review authority unresolved')) {
            blockerReasonsSet.add('review authority unresolved');
          } else if (err.startsWith('answer schema invalid')) {
            blockerReasonsSet.add('answer schema invalid');
          } else if (err.startsWith('answer key academically unverified')) {
            blockerReasonsSet.add('answer key academically unverified');
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

      final deficit = max(0, 50 - currentEligibleCount);
      if (deficit > 0) {
        blockerReasonsSet.add('insufficient eligible questions');
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
        'blockerReasons': blockerReasonsSet.toList()..sort(),
        'poolVersion': '1.0.0',
      });
    }

    return manifests;
  }
}
