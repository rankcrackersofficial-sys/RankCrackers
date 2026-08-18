/// RankCrackers governed Student Evidence Event Contract.
///
/// CODE NO: PERS-01-R2
///
/// PURPOSE:
/// Define the canonical, immutable evidence-event vocabulary consumed by
/// RankCrackers personalization engines.
///
/// IMPORTANT:
/// 1. This file records observable learning evidence only.
/// 2. It does NOT calculate mastery, retention, fluency, treatment, or routes.
/// 3. It contains NO AI/LLM inference.
/// 4. It contains NO psychological/personality profiling.
/// 5. It contains NO Firebase/persistence logic.
/// 6. Academic coordinates remain explicit and auditable.
/// 7. Missing optional evidence remains missing; it is never fabricated.
/// 8. All timestamps are UTC.
/// 9. Durations are integer milliseconds and must be non-negative.
/// 10. Schema version: 2.
library;

enum StudentEvidenceSource {
  syllabus,
  digibook,
  crucible,
  practice,
  revision,
  diagnostic,
  doubtResolution,
  mentorVerification,
}

enum StudentEvidenceAction {
  nodeOpened,
  nodeCompleted,
  learningBlockViewed,
  questionPresented,
  answerSubmitted,
  answerChanged,
  hintRequested,
  explanationOpened,
  retryStarted,
  retrySubmitted,
  questionSkipped,
  sessionAbandoned,
  revisionStarted,
  revisionCompleted,
  diagnosticCompleted,
  doubtRaised,
  doubtResolved,
  mentorVerified,
}

enum StudentAnswerOutcome {
  correct,
  incorrect,
  partiallyCorrect,
  unanswered,
  notApplicable,
}

enum StudentEvidenceConfidence {
  unknown,
  low,
  medium,
  high,
}

enum StudentEvidenceDifficulty {
  unknown,
  foundational,
  easy,
  medium,
  hard,
  advanced,
}

/// Canonical immutable student evidence event.
///
/// The contract intentionally separates:
///
/// - WHAT happened: [action]
/// - WHERE it happened academically: [amtnId] / [syllabusNodeId]
/// - WHAT assessment object was involved: [questionId]
/// - WHAT the observed answer outcome was: [answerOutcome]
/// - HOW assisted the attempt was: retry/hints/explanation flags
/// - HOW long active work took: [activeDurationMs]
/// - WHAT governed baseline was expected: [expectedDurationMs]
/// - HOW trustworthy the producer is: [sourceConfidence]
///
/// No downstream engine is permitted to invent missing values.
final class StudentEvidenceEvent {
  static const int currentSchemaVersion = 2;

  const StudentEvidenceEvent({
    required this.eventId,
    required this.studentId,
    required this.source,
    required this.action,
    required this.occurredAtUtc,
    required this.sourceConfidence,
    required this.difficulty,
    required this.answerOutcome,
    required this.schemaVersion,
    this.sessionId,
    this.amtnId,
    this.syllabusNodeId,
    this.questionId,
    this.attemptId,
    this.activeDurationMs,
    this.expectedDurationMs,
    this.hintsUsed,
    this.answerChangeCount,
    this.wasRetry,
    this.wasSkipped,
    this.wasExplanationOpened,
    this.metadata = const <String, String>{},
  });

  final String eventId;
  final String studentId;

  /// Optional learning/assessment session identity.
  final String? sessionId;

  final StudentEvidenceSource source;
  final StudentEvidenceAction action;

  /// Canonical AMTN coordinate when available.
  final String? amtnId;

  /// Canonical syllabus-node coordinate when available.
  final String? syllabusNodeId;

  /// Governed question identity for assessment evidence when available.
  final String? questionId;

  /// Governed attempt identity when available.
  final String? attemptId;

  final DateTime occurredAtUtc;

  final StudentEvidenceConfidence sourceConfidence;
  final StudentEvidenceDifficulty difficulty;
  final StudentAnswerOutcome answerOutcome;

  /// Student active working time, excluding paused/background time.
  final int? activeDurationMs;

  /// Trusted governed timing baseline for the same assessment object.
  final int? expectedDurationMs;

  /// Number of hints explicitly used in this event/attempt.
  final int? hintsUsed;

  /// Number of answer changes explicitly observed.
  final int? answerChangeCount;

  /// True only when this evidence came from a retry attempt.
  final bool? wasRetry;

  /// True only when the question/task was explicitly skipped.
  final bool? wasSkipped;

  /// True only when a governed explanation was opened before completion.
  final bool? wasExplanationOpened;

  /// Non-academic, non-secret structured trace metadata.
  ///
  /// This map MUST NOT contain:
  /// - correct answers;
  /// - solutions;
  /// - psychological labels;
  /// - personality labels;
  /// - secrets/tokens.
  final Map<String, String> metadata;

  final int schemaVersion;

  bool get hasAcademicCoordinate =>
      _hasText(amtnId) || _hasText(syllabusNodeId);

  bool get hasQuestionIdentity => _hasText(questionId);

  bool get isAssessmentAction {
    switch (action) {
      case StudentEvidenceAction.questionPresented:
      case StudentEvidenceAction.answerSubmitted:
      case StudentEvidenceAction.answerChanged:
      case StudentEvidenceAction.hintRequested:
      case StudentEvidenceAction.explanationOpened:
      case StudentEvidenceAction.retryStarted:
      case StudentEvidenceAction.retrySubmitted:
      case StudentEvidenceAction.questionSkipped:
      case StudentEvidenceAction.mentorVerified:
        return true;

      case StudentEvidenceAction.nodeOpened:
      case StudentEvidenceAction.nodeCompleted:
      case StudentEvidenceAction.learningBlockViewed:
      case StudentEvidenceAction.sessionAbandoned:
      case StudentEvidenceAction.revisionStarted:
      case StudentEvidenceAction.revisionCompleted:
      case StudentEvidenceAction.diagnosticCompleted:
      case StudentEvidenceAction.doubtRaised:
      case StudentEvidenceAction.doubtResolved:
        return false;
    }
  }

  bool get isIndependentAttempt =>
      action == StudentEvidenceAction.answerSubmitted &&
      wasRetry != true &&
      wasSkipped != true &&
      (hintsUsed ?? 0) == 0 &&
      wasExplanationOpened != true;

  void validate() {
    _requireText(eventId, 'StudentEvidenceEvent.eventId');
    _requireText(studentId, 'StudentEvidenceEvent.studentId');

    _validateOptionalText(sessionId, 'StudentEvidenceEvent.sessionId');
    _validateOptionalText(amtnId, 'StudentEvidenceEvent.amtnId');
    _validateOptionalText(
      syllabusNodeId,
      'StudentEvidenceEvent.syllabusNodeId',
    );
    _validateOptionalText(questionId, 'StudentEvidenceEvent.questionId');
    _validateOptionalText(attemptId, 'StudentEvidenceEvent.attemptId');

    if (!occurredAtUtc.isUtc) {
      throw const FormatException(
        'StudentEvidenceEvent.occurredAtUtc must be UTC.',
      );
    }

    if (schemaVersion <= 0) {
      throw const FormatException(
        'StudentEvidenceEvent.schemaVersion must be positive.',
      );
    }

    _validateOptionalNonNegativeInt(
      activeDurationMs,
      'StudentEvidenceEvent.activeDurationMs',
    );
    _validateOptionalNonNegativeInt(
      expectedDurationMs,
      'StudentEvidenceEvent.expectedDurationMs',
    );
    _validateOptionalNonNegativeInt(
      hintsUsed,
      'StudentEvidenceEvent.hintsUsed',
    );
    _validateOptionalNonNegativeInt(
      answerChangeCount,
      'StudentEvidenceEvent.answerChangeCount',
    );

    if (expectedDurationMs != null && expectedDurationMs == 0) {
      throw const FormatException(
        'StudentEvidenceEvent.expectedDurationMs must be positive when supplied.',
      );
    }

    _validateMetadata();

    _validateActionSemantics();
  }

  void _validateActionSemantics() {
    if (wasSkipped == true && answerOutcome == StudentAnswerOutcome.correct) {
      throw const FormatException(
        'Skipped evidence cannot simultaneously be correct.',
      );
    }

    if (action == StudentEvidenceAction.questionSkipped &&
        wasSkipped == false) {
      throw const FormatException(
        'questionSkipped cannot explicitly set wasSkipped=false.',
      );
    }

    if (action == StudentEvidenceAction.retrySubmitted && wasRetry == false) {
      throw const FormatException(
        'retrySubmitted cannot explicitly set wasRetry=false.',
      );
    }

    if (action == StudentEvidenceAction.hintRequested &&
        hintsUsed != null &&
        hintsUsed! == 0) {
      throw const FormatException(
        'hintRequested cannot explicitly report zero hintsUsed.',
      );
    }

    if (action == StudentEvidenceAction.answerChanged &&
        answerChangeCount != null &&
        answerChangeCount! == 0) {
      throw const FormatException(
        'answerChanged cannot explicitly report zero answerChangeCount.',
      );
    }

    switch (action) {
      case StudentEvidenceAction.answerSubmitted:
      case StudentEvidenceAction.retrySubmitted:
      case StudentEvidenceAction.mentorVerified:
        // Outcome may intentionally remain notApplicable/unanswered so that
        // PERS-03 can fail it closed and record the reason.
        return;

      case StudentEvidenceAction.questionSkipped:
        if (answerOutcome == StudentAnswerOutcome.correct ||
            answerOutcome == StudentAnswerOutcome.incorrect ||
            answerOutcome == StudentAnswerOutcome.partiallyCorrect) {
          throw const FormatException(
            'questionSkipped cannot carry a scored answer outcome.',
          );
        }
        return;

      case StudentEvidenceAction.nodeOpened:
      case StudentEvidenceAction.nodeCompleted:
      case StudentEvidenceAction.learningBlockViewed:
      case StudentEvidenceAction.questionPresented:
      case StudentEvidenceAction.answerChanged:
      case StudentEvidenceAction.hintRequested:
      case StudentEvidenceAction.explanationOpened:
      case StudentEvidenceAction.retryStarted:
      case StudentEvidenceAction.sessionAbandoned:
      case StudentEvidenceAction.revisionStarted:
      case StudentEvidenceAction.revisionCompleted:
      case StudentEvidenceAction.diagnosticCompleted:
      case StudentEvidenceAction.doubtRaised:
      case StudentEvidenceAction.doubtResolved:
        // These actions can legally carry notApplicable outcome.
        return;
    }
  }

  void _validateMetadata() {
    for (final entry in metadata.entries) {
      if (entry.key.trim().isEmpty) {
        throw const FormatException(
          'StudentEvidenceEvent.metadata keys must not be empty.',
        );
      }

      if (entry.value.trim().isEmpty) {
        throw const FormatException(
          'StudentEvidenceEvent.metadata values must not be empty.',
        );
      }

      final normalizedKey = entry.key.trim().toLowerCase();

      const forbiddenKeys = <String>{
        'correctanswer',
        'correct_answer',
        'answerkey',
        'answer_key',
        'solution',
        'solutiontext',
        'solution_text',
        'psychology',
        'personality',
        'personalitylabel',
        'personality_label',
        'token',
        'accesstoken',
        'access_token',
        'refreshtoken',
        'refresh_token',
        'secret',
      };

      if (forbiddenKeys.contains(normalizedKey)) {
        throw FormatException(
          'StudentEvidenceEvent.metadata contains forbidden key '
          '"${entry.key}".',
        );
      }
    }
  }

  Map<String, Object?> toJson() {
    validate();

    return <String, Object?>{
      'schemaVersion': schemaVersion,
      'eventId': eventId,
      'studentId': studentId,
      'sessionId': sessionId,
      'source': source.wireName,
      'action': action.wireName,
      'amtnId': amtnId,
      'syllabusNodeId': syllabusNodeId,
      'questionId': questionId,
      'attemptId': attemptId,
      'occurredAtUtc': occurredAtUtc.toIso8601String(),
      'sourceConfidence': sourceConfidence.wireName,
      'difficulty': difficulty.wireName,
      'answerOutcome': answerOutcome.wireName,
      'activeDurationMs': activeDurationMs,
      'expectedDurationMs': expectedDurationMs,
      'hintsUsed': hintsUsed,
      'answerChangeCount': answerChangeCount,
      'wasRetry': wasRetry,
      'wasSkipped': wasSkipped,
      'wasExplanationOpened': wasExplanationOpened,
      'metadata': Map<String, String>.unmodifiable(metadata),
    };
  }

  factory StudentEvidenceEvent.fromJson(
    Map<String, Object?> json,
  ) {
    final rawMetadata = json['metadata'];
    final parsedMetadata = <String, String>{};

    if (rawMetadata != null) {
      if (rawMetadata is! Map) {
        throw const FormatException(
          'StudentEvidenceEvent.metadata must be an object.',
        );
      }

      for (final entry in rawMetadata.entries) {
        if (entry.key is! String || entry.value is! String) {
          throw const FormatException(
            'StudentEvidenceEvent.metadata must contain string pairs.',
          );
        }
        parsedMetadata[entry.key as String] = entry.value as String;
      }
    }

    final event = StudentEvidenceEvent(
      eventId: _readRequiredString(json, 'eventId'),
      studentId: _readRequiredString(json, 'studentId'),
      sessionId: _readOptionalString(json, 'sessionId'),
      source: StudentEvidenceSourceWire.parse(
        _readRequiredString(json, 'source'),
      ),
      action: StudentEvidenceActionWire.parse(
        _readRequiredString(json, 'action'),
      ),
      amtnId: _readOptionalString(json, 'amtnId'),
      syllabusNodeId: _readOptionalString(json, 'syllabusNodeId'),
      questionId: _readOptionalString(json, 'questionId'),
      attemptId: _readOptionalString(json, 'attemptId'),
      occurredAtUtc: _readRequiredUtcDateTime(
        json,
        'occurredAtUtc',
      ),
      sourceConfidence: StudentEvidenceConfidenceWire.parse(
        _readRequiredString(json, 'sourceConfidence'),
      ),
      difficulty: StudentEvidenceDifficultyWire.parse(
        _readRequiredString(json, 'difficulty'),
      ),
      answerOutcome: StudentAnswerOutcomeWire.parse(
        _readRequiredString(json, 'answerOutcome'),
      ),
      activeDurationMs: _readOptionalInt(
        json,
        'activeDurationMs',
      ),
      expectedDurationMs: _readOptionalInt(
        json,
        'expectedDurationMs',
      ),
      hintsUsed: _readOptionalInt(json, 'hintsUsed'),
      answerChangeCount: _readOptionalInt(
        json,
        'answerChangeCount',
      ),
      wasRetry: _readOptionalBool(json, 'wasRetry'),
      wasSkipped: _readOptionalBool(json, 'wasSkipped'),
      wasExplanationOpened: _readOptionalBool(
        json,
        'wasExplanationOpened',
      ),
      metadata: Map<String, String>.unmodifiable(parsedMetadata),
      schemaVersion: _readRequiredInt(
        json,
        'schemaVersion',
      ),
    );

    event.validate();
    return event;
  }

  static bool _hasText(String? value) =>
      value != null && value.trim().isNotEmpty;

  static void _requireText(String value, String field) {
    if (value.trim().isEmpty) {
      throw FormatException('$field must not be empty.');
    }
  }

  static void _validateOptionalText(
    String? value,
    String field,
  ) {
    if (value != null && value.trim().isEmpty) {
      throw FormatException('$field must not be empty when supplied.');
    }
  }

  static void _validateOptionalNonNegativeInt(
    int? value,
    String field,
  ) {
    if (value != null && value < 0) {
      throw FormatException('$field cannot be negative.');
    }
  }

  static String _readRequiredString(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value is! String || value.trim().isEmpty) {
      throw FormatException('$key must be a non-empty string.');
    }

    return value;
  }

  static String? _readOptionalString(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value == null) {
      return null;
    }

    if (value is! String || value.trim().isEmpty) {
      throw FormatException(
        '$key must be a non-empty string when supplied.',
      );
    }

    return value;
  }

  static int _readRequiredInt(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value is! int) {
      throw FormatException('$key must be an integer.');
    }

    return value;
  }

  static int? _readOptionalInt(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value == null) {
      return null;
    }

    if (value is! int) {
      throw FormatException(
        '$key must be an integer when supplied.',
      );
    }

    return value;
  }

  static bool? _readOptionalBool(
    Map<String, Object?> json,
    String key,
  ) {
    final value = json[key];

    if (value == null) {
      return null;
    }

    if (value is! bool) {
      throw FormatException(
        '$key must be a boolean when supplied.',
      );
    }

    return value;
  }

  static DateTime _readRequiredUtcDateTime(
    Map<String, Object?> json,
    String key,
  ) {
    final raw = _readRequiredString(json, key);
    final parsed = DateTime.tryParse(raw);

    if (parsed == null || !parsed.isUtc) {
      throw FormatException('$key must be a valid UTC timestamp.');
    }

    return parsed;
  }
}

extension StudentEvidenceSourceWire on StudentEvidenceSource {
  String get wireName {
    switch (this) {
      case StudentEvidenceSource.syllabus:
        return 'syllabus';
      case StudentEvidenceSource.digibook:
        return 'digibook';
      case StudentEvidenceSource.crucible:
        return 'crucible';
      case StudentEvidenceSource.practice:
        return 'practice';
      case StudentEvidenceSource.revision:
        return 'revision';
      case StudentEvidenceSource.diagnostic:
        return 'diagnostic';
      case StudentEvidenceSource.doubtResolution:
        return 'doubt_resolution';
      case StudentEvidenceSource.mentorVerification:
        return 'mentor_verification';
    }
  }

  static StudentEvidenceSource parse(String value) {
    switch (value.trim()) {
      case 'syllabus':
        return StudentEvidenceSource.syllabus;
      case 'digibook':
        return StudentEvidenceSource.digibook;
      case 'crucible':
        return StudentEvidenceSource.crucible;
      case 'practice':
        return StudentEvidenceSource.practice;
      case 'revision':
        return StudentEvidenceSource.revision;
      case 'diagnostic':
        return StudentEvidenceSource.diagnostic;
      case 'doubt_resolution':
        return StudentEvidenceSource.doubtResolution;
      case 'mentor_verification':
        return StudentEvidenceSource.mentorVerification;
      default:
        throw FormatException(
          'Unknown StudentEvidenceSource "$value".',
        );
    }
  }
}

extension StudentEvidenceActionWire on StudentEvidenceAction {
  String get wireName {
    switch (this) {
      case StudentEvidenceAction.nodeOpened:
        return 'node_opened';
      case StudentEvidenceAction.nodeCompleted:
        return 'node_completed';
      case StudentEvidenceAction.learningBlockViewed:
        return 'learning_block_viewed';
      case StudentEvidenceAction.questionPresented:
        return 'question_presented';
      case StudentEvidenceAction.answerSubmitted:
        return 'answer_submitted';
      case StudentEvidenceAction.answerChanged:
        return 'answer_changed';
      case StudentEvidenceAction.hintRequested:
        return 'hint_requested';
      case StudentEvidenceAction.explanationOpened:
        return 'explanation_opened';
      case StudentEvidenceAction.retryStarted:
        return 'retry_started';
      case StudentEvidenceAction.retrySubmitted:
        return 'retry_submitted';
      case StudentEvidenceAction.questionSkipped:
        return 'question_skipped';
      case StudentEvidenceAction.sessionAbandoned:
        return 'session_abandoned';
      case StudentEvidenceAction.revisionStarted:
        return 'revision_started';
      case StudentEvidenceAction.revisionCompleted:
        return 'revision_completed';
      case StudentEvidenceAction.diagnosticCompleted:
        return 'diagnostic_completed';
      case StudentEvidenceAction.doubtRaised:
        return 'doubt_raised';
      case StudentEvidenceAction.doubtResolved:
        return 'doubt_resolved';
      case StudentEvidenceAction.mentorVerified:
        return 'mentor_verified';
    }
  }

  static StudentEvidenceAction parse(String value) {
    switch (value.trim()) {
      case 'node_opened':
        return StudentEvidenceAction.nodeOpened;
      case 'node_completed':
        return StudentEvidenceAction.nodeCompleted;
      case 'learning_block_viewed':
        return StudentEvidenceAction.learningBlockViewed;
      case 'question_presented':
        return StudentEvidenceAction.questionPresented;
      case 'answer_submitted':
        return StudentEvidenceAction.answerSubmitted;
      case 'answer_changed':
        return StudentEvidenceAction.answerChanged;
      case 'hint_requested':
        return StudentEvidenceAction.hintRequested;
      case 'explanation_opened':
        return StudentEvidenceAction.explanationOpened;
      case 'retry_started':
        return StudentEvidenceAction.retryStarted;
      case 'retry_submitted':
        return StudentEvidenceAction.retrySubmitted;
      case 'question_skipped':
        return StudentEvidenceAction.questionSkipped;
      case 'session_abandoned':
        return StudentEvidenceAction.sessionAbandoned;
      case 'revision_started':
        return StudentEvidenceAction.revisionStarted;
      case 'revision_completed':
        return StudentEvidenceAction.revisionCompleted;
      case 'diagnostic_completed':
        return StudentEvidenceAction.diagnosticCompleted;
      case 'doubt_raised':
        return StudentEvidenceAction.doubtRaised;
      case 'doubt_resolved':
        return StudentEvidenceAction.doubtResolved;
      case 'mentor_verified':
        return StudentEvidenceAction.mentorVerified;
      default:
        throw FormatException(
          'Unknown StudentEvidenceAction "$value".',
        );
    }
  }
}

extension StudentAnswerOutcomeWire on StudentAnswerOutcome {
  String get wireName {
    switch (this) {
      case StudentAnswerOutcome.correct:
        return 'correct';
      case StudentAnswerOutcome.incorrect:
        return 'incorrect';
      case StudentAnswerOutcome.partiallyCorrect:
        return 'partially_correct';
      case StudentAnswerOutcome.unanswered:
        return 'unanswered';
      case StudentAnswerOutcome.notApplicable:
        return 'not_applicable';
    }
  }

  static StudentAnswerOutcome parse(String value) {
    switch (value.trim()) {
      case 'correct':
        return StudentAnswerOutcome.correct;
      case 'incorrect':
        return StudentAnswerOutcome.incorrect;
      case 'partially_correct':
        return StudentAnswerOutcome.partiallyCorrect;
      case 'unanswered':
        return StudentAnswerOutcome.unanswered;
      case 'not_applicable':
        return StudentAnswerOutcome.notApplicable;
      default:
        throw FormatException(
          'Unknown StudentAnswerOutcome "$value".',
        );
    }
  }
}

extension StudentEvidenceConfidenceWire on StudentEvidenceConfidence {
  String get wireName {
    switch (this) {
      case StudentEvidenceConfidence.unknown:
        return 'unknown';
      case StudentEvidenceConfidence.low:
        return 'low';
      case StudentEvidenceConfidence.medium:
        return 'medium';
      case StudentEvidenceConfidence.high:
        return 'high';
    }
  }

  static StudentEvidenceConfidence parse(String value) {
    switch (value.trim()) {
      case 'unknown':
        return StudentEvidenceConfidence.unknown;
      case 'low':
        return StudentEvidenceConfidence.low;
      case 'medium':
        return StudentEvidenceConfidence.medium;
      case 'high':
        return StudentEvidenceConfidence.high;
      default:
        throw FormatException(
          'Unknown StudentEvidenceConfidence "$value".',
        );
    }
  }
}

extension StudentEvidenceDifficultyWire on StudentEvidenceDifficulty {
  String get wireName {
    switch (this) {
      case StudentEvidenceDifficulty.unknown:
        return 'unknown';
      case StudentEvidenceDifficulty.foundational:
        return 'foundational';
      case StudentEvidenceDifficulty.easy:
        return 'easy';
      case StudentEvidenceDifficulty.medium:
        return 'medium';
      case StudentEvidenceDifficulty.hard:
        return 'hard';
      case StudentEvidenceDifficulty.advanced:
        return 'advanced';
    }
  }

  static StudentEvidenceDifficulty parse(String value) {
    switch (value.trim()) {
      case 'unknown':
        return StudentEvidenceDifficulty.unknown;
      case 'foundational':
        return StudentEvidenceDifficulty.foundational;
      case 'easy':
        return StudentEvidenceDifficulty.easy;
      case 'medium':
        return StudentEvidenceDifficulty.medium;
      case 'hard':
        return StudentEvidenceDifficulty.hard;
      case 'advanced':
        return StudentEvidenceDifficulty.advanced;
      default:
        throw FormatException(
          'Unknown StudentEvidenceDifficulty "$value".',
        );
    }
  }
}
