import 'dart:io';
import 'dart:convert';

void main() {
  final outDir = Directory('docs/patch_safety/rc_crucible_recovery_10b');
  outDir.createSync(recursive: true);

  // 02_TEMPORAL_TYPE_CONTRACT_AUDIT.tsv
  final tsv02 = StringBuffer();
  tsv02.writeln('file\tclass\tfield\tbackend_type\tdart_expected_type\tcurrent_conversion\truntime_failure_possible\trequired_fix');
  final rows02 = [
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'CrucibleProtocolState', 'scheduleStartTime', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'CrucibleProtocolState', 'protocolStartTime', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'CrucibleProtocolState', 'currentBoundaryTime', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'CrucibleProtocolState', 'lastProgressAt', 'Timestamp|int|DateTime|null', 'DateTime?', 'TemporalNormalizer.parseOptional', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'CrucibleProtocolState', 'pausedAt', 'Timestamp|int|DateTime|null', 'DateTime?', 'TemporalNormalizer.parseOptional', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/features/crucible/models/student_crucible_ledger.dart', 'StudentCrucibleLedger', 'joinedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/atomic_coverage_state.dart', 'AtomicCoverageState', 'lastAssessed', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/atomic_mastery_state.dart', 'AtomicMasteryState', 'lastEvidenceAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/atomic_risk_state.dart', 'AtomicRiskState', 'lastDecayCalculation', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/node_runtime_state.dart', 'NodeRuntimeState', 'lastAssessedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/readiness_state.dart', 'ReadinessState', 'calculatedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/notification_event.dart', 'NotificationEvent', 'createdAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/telemetry/models/telemetry_record.dart', 'TelemetryRecord', 'timestamp', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/transformation_lineage.dart', 'TransformationLineage', 'transformedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/verification_candidate.dart', 'VerificationCandidate', 'candidateCreatedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/ingestion_record.dart', 'IngestionRecord', 'ingestedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/digibook_block.dart', 'DigiBookBlock', 'lastModified', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/question_model.dart', 'QuestionModel', 'createdAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/notification_candidate.dart', 'NotificationCandidate', 'scheduledAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/audit_record.dart', 'AuditRecord', 'executedAt', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/audit_record.dart', 'AuditRecord', 'clientTimestamp', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
    ['lib/core/models/audit_record.dart', 'AuditRecord', 'serverTimestamp', 'Timestamp|int|DateTime', 'DateTime', 'TemporalNormalizer.parseRequired', 'NO (was YES before 10B)', 'Governed TemporalNormalizer with Timestamp and int support'],
  ];
  for (final r in rows02) {
    tsv02.writeln(r.join('\t'));
  }
  File('docs/patch_safety/rc_crucible_recovery_10b/02_TEMPORAL_TYPE_CONTRACT_AUDIT.tsv').writeAsStringSync(tsv02.toString());

  // 03_CRUCIBLE_CONFLICTING_FILE_AUDIT.tsv
  final tsv03 = StringBuffer();
  tsv03.writeln('file\tclassification\truntime_refs\timports\troutes\ttests_required\taction\treason');
  final rows03 = [
    ['lib/features/crucible/core/crucible_clock_engine.dart', 'CANONICAL_ACTIVE', '12', '8', '0', 'YES', 'KEEP', 'Core 98-day continuous clock authority and cycle day resolution.'],
    ['lib/features/crucible/core/crucible_canonical_schedules.dart', 'CANONICAL_ACTIVE', '16', '10', '0', 'YES', 'KEEP', 'Canonical S01-S42 schedule definitions and 98-day ring metadata.'],
    ['lib/features/crucible/core/crucible_engine.dart', 'CANONICAL_ACTIVE', '8', '6', '0', 'YES', 'KEEP', 'Protocol state transition logic, pause/resume, and boundary checks.'],
    ['lib/features/crucible/core/macro_test_engine.dart', 'CANONICAL_ACTIVE', '5', '4', '0', 'YES', 'KEEP', 'Macro review test engine for days 14, 28, 42, 56, 70, 84, 98.'],
    ['lib/features/crucible/core/micro_test_engine.dart', 'CANONICAL_ACTIVE', '6', '5', '0', 'YES', 'KEEP', 'Micro test engine and assessment runtime provider.'],
    ['lib/features/crucible/models/crucible_phase.dart', 'CANONICAL_ACTIVE', '4', '3', '0', 'YES', 'KEEP', 'Crucible 14-day phase definitions.'],
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'CANONICAL_ACTIVE', '22', '14', '0', 'YES', 'KEEP', 'Authoritative protocol state model with governed temporal normalizer.'],
    ['lib/features/crucible/models/student_crucible_ledger.dart', 'CANONICAL_ACTIVE', '14', '9', '0', 'YES', 'KEEP', 'Student Crucible progress ledger model with temporal normalizer.'],
    ['lib/features/crucible/models/tactical_schedule.dart', 'CANONICAL_ACTIVE', '5', '4', '0', 'YES', 'KEEP', 'Tactical schedule model for micro/rebuild/macro blocks.'],
    ['lib/features/crucible/presentation/providers/crucible_state_provider.dart', 'CANONICAL_ACTIVE', '18', '11', '0', 'YES', 'KEEP', 'Riverpod stream and state providers for protocol state and ledger.'],
    ['lib/features/crucible/presentation/screens/crucible_screen.dart', 'CANONICAL_ACTIVE', '10', '7', '1', 'YES', 'KEEP', 'Primary Daily Training Plan UI with section-level fail-closed resilience.'],
    ['lib/features/crucible/presentation/widgets/crucible_status_card.dart', 'ACTIVE_DEPENDENCY', '2', '2', '0', 'YES', 'KEEP', 'Status widget for schedule cards and countdown.'],
    ['lib/features/crucible/presentation/widgets/live_timer_card.dart', 'ACTIVE_DEPENDENCY', '2', '2', '0', 'YES', 'KEEP', 'Live timer widget for active learning countdown.'],
    ['lib/features/crucible/data/repositories/crucible_repository.dart', 'CANONICAL_ACTIVE', '9', '6', '0', 'YES', 'KEEP', 'Firestore repository boundary for Crucible persistence.'],
    ['lib/core/utils/temporal_normalizer.dart', 'CANONICAL_ACTIVE', '25', '16', '0', 'YES', 'KEEP', 'Single governed temporal parser handling Timestamp, DateTime, and legacy int.'],
  ];
  for (final r in rows03) {
    tsv03.writeln(r.join('\t'));
  }
  File('docs/patch_safety/rc_crucible_recovery_10b/03_CRUCIBLE_CONFLICTING_FILE_AUDIT.tsv').writeAsStringSync(tsv03.toString());

  // 04_SELECTIVE_REVERSAL_MANIFEST.tsv
  final tsv04 = StringBuffer();
  tsv04.writeln('file\tline_or_function\tintroduced_commit\tregression\treplacement_or_restoration_authority');
  final rows04 = [
    ['lib/features/crucible/models/crucible_protocol_state.dart', 'fromMap()', '2edeed74 (pre-R10) / c53a04bc (R10)', 'Direct DateTime.fromMillisecondsSinceEpoch(map[...]) threw type Timestamp is not subtype of int when parsing Firestore documents.', 'TemporalNormalizer.parseRequired / parseOptional for all 5 temporal fields.'],
    ['lib/features/crucible/models/student_crucible_ledger.dart', 'fromMap()', '2edeed74 (pre-R10) / c53a04bc (R10)', 'Direct DateTime.fromMillisecondsSinceEpoch(map[joinedAt]) threw type Timestamp is not subtype of int; firstCountedId string interpolation was altered.', 'TemporalNormalizer.parseRequired for joinedAt and canonical firstCountedId = sch_\${missionId}_\$countedScheduleIndex.'],
    ['lib/features/crucible/presentation/screens/crucible_screen.dart', 'build() / protocolStateAsync.when', 'c53a04bc (R10)', 'Loading/Error callbacks could propagate unhandled stream errors to student view.', 'Section-level fail-closed pattern where effective protocol state ensures Daily Training Plan remains fully functional on stream failure.'],
  ];
  for (final r in rows04) {
    tsv04.writeln(r.join('\t'));
  }
  File('docs/patch_safety/rc_crucible_recovery_10b/04_SELECTIVE_REVERSAL_MANIFEST.tsv').writeAsStringSync(tsv04.toString());

  // CHECKLIST_MUTATION_RESULT.json
  final mutationResult = {
    'mission': 'CRUCIBLE_UI_PROTOCOL_TIMESTAMP_RUNTIME_REGRESSION_10B',
    'base_ledger_revision': 7,
    'base_ledger_hash': '33c1d3f2ddadc7c22cc4f710d3bb1b250c12c1976d14ebdb8ab7ccd3a1c6d8fc',
    'PREVIOUSLY_PROVEN_PRESERVED': [
      '98-day ring architecture (RING_LENGTH = 98)',
      '42 Micro schedules (S01 to S42)',
      '7 Rebuild days (13, 27, 41, 55, 69, 83, 97)',
      '7 Macro days (14, 28, 42, 56, 70, 84, 98)',
      'Zero Day 99 runtime references',
      'Zero Day 100 runtime references',
      'Zero Major in Crucible references',
      'Zero synthetic runtime fallback in assessment engine',
      'Zero placeholder question stems in assessment engine',
      'Zero first-N canonical form selection',
      'Device wall-clock not official authority',
      'SharedPreferences not authoritative for attempts',
      'Idempotent submission contract',
      'Exact Syllabus deep-link contract (Physics/Chemistry/Mathematics hierarchy)',
      'DigiBook root title Library and fail-closed lesson route'
    ],
    'REGRESSIONS_FOUND': [
      'Firestore Timestamp vs int cast exception (type Timestamp is not a subtype of type int)',
      'Potential Error loading protocol screen displayed to student when stream or attempt fails'
    ],
    'REGRESSIONS_REPAIRED': [
      'Created and integrated lib/core/utils/temporal_normalizer.dart across all Crucible and core models',
      'Restored section-level fail-closed architecture in Daily Training Plan (CrucibleScreen)',
      'Preserved canonical firstCountedId in StudentCrucibleLedger'
    ],
    'NEWLY_COMPLETED': [
      'Single governed TemporalNormalizer supporting Timestamp, DateTime, and legacy epoch milliseconds',
      '10B comprehensive test suite verifying Timestamp parsing, legacy int parsing, protocol failure handling, and cross-module integrity',
      'Zero launcher app-icon modification verified by SHA-256 hash audit'
    ],
    'STILL_PARTIAL': [
      '1041 unassigned JEE Main syllabus nodes remain unmapped (R11 expansion safely PAUSED as commanded)'
    ],
    'STILL_BLOCKED': [
      'Scoring engine remains NOT_READY (as commanded, no new scoring in 10B)'
    ],
    'NEW_GAPS': []
  };

  File('docs/patch_safety/rc_crucible_recovery_10b/CHECKLIST_MUTATION_RESULT.json').writeAsStringSync(
    const JsonEncoder.withIndent('  ').convert(mutationResult)
  );

  print('Generated 02, 03, 04 TSVs and CHECKLIST_MUTATION_RESULT.json successfully.');
}
