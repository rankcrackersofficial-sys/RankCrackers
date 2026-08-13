import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';
import 'package:meta/meta.dart';
import '../../../core/models/question_model.dart';
import '../models/crucible_schedule.dart';

/// 🔱 SOLUTION VERIFICATION RECORD
/// Binds solution verification status, version, text signature, and answer consistency.
class SolutionVerificationRecord {
  final String questionId;
  final String questionLineageId;
  final int version;
  final String solutionStatus; // e.g. 'verified'
  final String solutionHash; // SHA-256 hash of verified solution text
  final String reviewingAuthority;
  final String verifiedAnswerValue; // Must match answer key (MCQ index or Numerical decimal string)
  final DateTime verifiedAt;

  const SolutionVerificationRecord({
    required this.questionId,
    required this.questionLineageId,
    required this.version,
    required this.solutionStatus,
    required this.solutionHash,
    required this.reviewingAuthority,
    required this.verifiedAnswerValue,
    required this.verifiedAt,
  });
}

/// 🔱 QUESTION TRUST SNAPSHOT
/// An immutable, read-only container of authoritative academic evidence.
class QuestionTrustSnapshot {
  final Set<String> verifiedFactIds;
  final Map<String, String> factSourceDocuments; // factId -> sourceDocumentId
  final Set<String> heldFactIds; // unverified or held facts
  
  final Map<String, String> reviewerAuthorities; // reviewerId -> role
  final Set<String> verifiedAnswerKeys; // questionId
  final Map<String, String> verifiedAnswerKeyValues; // questionId -> expected answer value string
  final Set<String> studentReadyQuestionIds; // questionId
  
  final Map<String, String> pyqPaperEvidence; // questionId -> officialPaperId
  final Map<String, int> activeQuestionVersions; // lineageId -> activeVersion
  final Map<String, SolutionVerificationRecord> verifiedSolutions; // questionId -> solution record

  const QuestionTrustSnapshot({
    required this.verifiedFactIds,
    required this.factSourceDocuments,
    required this.heldFactIds,
    required this.reviewerAuthorities,
    required this.verifiedAnswerKeys,
    required this.verifiedAnswerKeyValues,
    required this.studentReadyQuestionIds,
    required this.pyqPaperEvidence,
    required this.activeQuestionVersions,
    required this.verifiedSolutions,
  });

  const QuestionTrustSnapshot.empty()
      : verifiedFactIds = const {},
        factSourceDocuments = const {},
        heldFactIds = const {},
        reviewerAuthorities = const {},
        verifiedAnswerKeys = const {},
        verifiedAnswerKeyValues = const {},
        studentReadyQuestionIds = const {},
        pyqPaperEvidence = const {},
        activeQuestionVersions = const {},
        verifiedSolutions = const {};
}

/// 🔱 QUESTION TRUST REPOSITORY
/// Authoritative trust store for resolving read-only academic evidence snapshots.
class QuestionTrustRepository {
  static QuestionTrustSnapshot _productionSnapshot = const QuestionTrustSnapshot.empty();
  static bool _isHydrated = false;

  static bool get isHydrated => _isHydrated;

  static QuestionTrustSnapshot getAuthoritativeSnapshot() {
    return _productionSnapshot;
  }

  /// Authoritative server-side/admin hydration path. Loaded by trust loaders.
  static void initializeAuthoritativeSnapshot(QuestionTrustSnapshot snapshot) {
    _productionSnapshot = snapshot;
    _isHydrated = true;
  }

  /// Test-only injection path. Isolated from production execution.
  @visibleForTesting
  static void initializeForTest(QuestionTrustSnapshot snapshot) {
    _productionSnapshot = snapshot;
    _isHydrated = true;
  }

  /// Test-only reset path.
  @visibleForTesting
  static void resetForTest() {
    _productionSnapshot = const QuestionTrustSnapshot.empty();
    _isHydrated = false;
  }
}

/// 🔱 MICRO TEST ENGINE (C2-FIX4 Compliant)
/// Authoritative gatekeeper for Crucible Micro factory assembly.
class MicroTestEngine {

  static const bool solutionRequiredForStudentReady = true;

  // ===================================================
  // 1. STABLE SEED DERIVATION
  // ===================================================

  /// Stable platform-independent seed derivation based on canonical inputs.
  /// Used ONLY for deterministic assembly reproducibility; NOT a security primitive.
  static int deriveSeed({
    required String microTestId,
    required String scheduleId,
    required String poolVersion,
    required String assemblyVersion,
    required int attemptOrdinal,
  }) {
    final key = '$microTestId:$scheduleId:$poolVersion:$assemblyVersion:$attemptOrdinal';
    int hash = 2166136261;
    for (int i = 0; i < key.length; i++) {
      hash = (hash ^ key.codeUnitAt(i)) * 16777619;
      hash = hash & 0xFFFFFFFF; // Clamp to 32-bit unsigned
    }
    return hash;
  }

  /// Cryptographic SHA-256 digest to verify solution text integrity.
  static String hashSolution(String? text) {
    if (text == null) return '';
    final clean = text.trim();
    final bytes = utf8.encode(clean);
    return sha256.convert(bytes).toString();
  }

  // ===================================================
  // 2. QUESTION ELIGIBILITY GATES
  // ===================================================

  /// Validates a question against the authoritative trust snapshot.
  /// Returns null if fully eligible, or a specific blocker string.
  static String? checkQuestionEligibility(
    QuestionModel question,
    String scheduleId,
    List<String> allowedAtomIds, {
    QuestionTrustSnapshot? trustSnapshot,
  }) {
    // -------------------------------------------------
    // Fail-Closed Hydration Check
    // -------------------------------------------------
    if (trustSnapshot == null && !QuestionTrustRepository.isHydrated) {
      return 'TRUST_SNAPSHOT_NOT_READY';
    }

    final trust = trustSnapshot ?? QuestionTrustRepository.getAuthoritativeSnapshot();

    // -------------------------------------------------
    // A. Explicit Question Type Gate
    // -------------------------------------------------
    if (question.questionType == null || question.questionType!.trim().isEmpty) {
      return 'schema/type invalid: type is unresolved';
    }

    final type = question.questionType!.trim();
    if (type == 'mcq_single') {
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
    } else if (type == 'numerical') {
      if (question.options.isNotEmpty) {
        return 'schema/type invalid: numerical options must be empty';
      }
      if (question.numericalAnswer == null) {
        return 'schema/type invalid: numericalAnswer must be present for numerical type';
      }
    } else {
      return 'schema/type invalid: unsupported question type';
    }

    // Basic fields validation
    if (question.id.isEmpty || question.question.trim().isEmpty || question.examId.isEmpty || question.subjectId.isEmpty) {
      return 'schema/type invalid: missing basic fields';
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
    if (!trust.verifiedFactIds.contains(question.factId)) {
      return 'source provenance unresolved: factId ${question.factId} is unverified or unregistered';
    }
    if (trust.heldFactIds.contains(question.factId)) {
      return 'source provenance unresolved: fact ${question.factId} is academically held/rejected';
    }
    final sourceDoc = trust.factSourceDocuments[question.factId];
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
    final role = trust.reviewerAuthorities[question.verifiedBy];
    if (role == null || role == 'AI' || role == 'system') {
      return 'review authority unresolved: verifier has unverified review authority';
    }

    // -------------------------------------------------
    // E. Academic Answer Key Gate
    // -------------------------------------------------
    if (!trust.verifiedAnswerKeys.contains(question.id)) {
      return 'answer key academically unverified: key lacks professional verification';
    }
    
    final expectedVal = trust.verifiedAnswerKeyValues[question.id];
    if (type == 'numerical') {
      final expectedDouble = double.tryParse(expectedVal ?? '');
      if (expectedDouble == null || expectedDouble != question.numericalAnswer) {
        return 'answer key academically unverified: answer key value conflict';
      }
    } else {
      if (expectedVal != question.answerIndex.toString()) {
        return 'answer key academically unverified: answer key value conflict';
      }
    }

    // -------------------------------------------------
    // F. Solution Verification Gate (Decoupled Concept)
    // -------------------------------------------------
    if (solutionRequiredForStudentReady) {
      if (question.solution == null || question.solution!.trim().isEmpty) {
        return 'solution verification missing where required: missing explanation/solution';
      }
      final solRecord = trust.verifiedSolutions[question.id];
      if (solRecord == null) {
        return 'solution verification missing where required: solution verification record is missing';
      }
      if (solRecord.version != question.version) {
        return 'solution verification missing where required: solution version mismatch';
      }
      if (solRecord.solutionStatus != 'verified') {
        return 'solution verification missing where required: solution status is not verified';
      }
      final currentHash = hashSolution(question.solution);
      if (solRecord.solutionHash != currentHash) {
        return 'solution verification missing where required: solution text hash mismatch';
      }
      if (type == 'numerical') {
        final expectedDouble = double.tryParse(solRecord.verifiedAnswerValue);
        if (expectedDouble == null || expectedDouble != question.numericalAnswer) {
          return 'solution verification missing where required: solution answer consistency mismatch';
        }
      } else {
        if (solRecord.verifiedAnswerValue != question.answerIndex.toString()) {
          return 'solution verification missing where required: solution answer consistency mismatch';
        }
      }
      final solReviewerRole = trust.reviewerAuthorities[solRecord.reviewingAuthority];
      if (solReviewerRole == null || solReviewerRole == 'AI' || solReviewerRole == 'system') {
        return 'solution verification missing where required: solution reviewer authority unresolved';
      }
    }

    // -------------------------------------------------
    // G. PYQ Claim Proof
    // -------------------------------------------------
    if (question.isPYQ) {
      final paperEvidence = trust.pyqPaperEvidence[question.id];
      if (paperEvidence == null || paperEvidence.isEmpty) {
        return 'unproven PYQ claim: missing official paper evidence for PYQ claim';
      }
    }

    // -------------------------------------------------
    // H. Publication / Student-Ready Gate
    // -------------------------------------------------
    if (question.status != 'published') {
      return 'student publication gate false: question status is not published';
    }
    if (!trust.studentReadyQuestionIds.contains(question.id)) {
      return 'student publication gate false: publication eligibility has not been granted';
    }

    // -------------------------------------------------
    // I. Version & Lineage Safety
    // -------------------------------------------------
    final lineageId = question.questionLineageId ?? question.id;
    final activeVersion = trust.activeQuestionVersions[lineageId];
    if (activeVersion != null && question.version < activeVersion) {
      return 'superseded/conflicting version: version is superseded';
    }

    return null; // Fully eligible
  }

  // ===================================================
  // 3. DETERMINISTIC MICRO ASSEMBLY
  // ===================================================

  /// Deterministically assembles exactly 50 eligible questions using a derived seed.
  static List<QuestionModel> assembleMicroTest({
    required String scheduleId,
    required List<String> allowedAtomIds,
    required List<QuestionModel> pool,
    int requiredCount = 50,
    QuestionTrustSnapshot? trustSnapshot,
    int? manualSeed,
  }) {
    final List<QuestionModel> eligible = [];
    final Set<String> seenIds = {};
    final Set<String> seenLineages = {};

    for (final q in pool) {
      if (seenIds.contains(q.id)) continue;
      
      final eligibilityError = checkQuestionEligibility(
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

    if (eligible.length < requiredCount) {
      return []; // Deficit exists: NOT_READY
    }

    eligible.sort((a, b) => a.id.compareTo(b.id));

    final seed = manualSeed ?? deriveSeed(
      microTestId: 'micro_unknown',
      scheduleId: scheduleId,
      poolVersion: '1.0.0',
      assemblyVersion: '1.0.0',
      attemptOrdinal: 1,
    );

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
  // 4. 42-SLOT MANIFEST GENERATION
  // ===================================================

  /// Produces the complete 42-slot Micro manifest.
  static List<Map<String, dynamic>> build42SlotManifest({
    required List<CrucibleSchedule> schedules,
    required List<QuestionModel> pool,
    required DateTime protocolStartTime,
    QuestionTrustSnapshot? trustSnapshot,
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

      int currentEligibleCount = 0;
      final Set<String> blockerReasonsSet = {};

      for (final q in pool) {
        final err = checkQuestionEligibility(
          q,
          schedule.id,
          schedule.atomicTopicIds,
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
