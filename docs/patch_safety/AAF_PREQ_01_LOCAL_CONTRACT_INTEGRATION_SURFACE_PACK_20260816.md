# AAF-PREQ-01 Local Contract Integration Surface Pack

VERDICT:
AAF_PREQ_01_LOCAL_CONTRACT_INTEGRATION_SURFACE_PACK_COMPLETE

REPOSITORY_ROOT:
C:\RankCrackers\RankCrackers-55

BRANCH:
safety/rc-g2-pre-notification-schema

HEAD:
7f9cc8a9e51dd79b395f2e56ed54274b10cfb098

SCOPE_LOCK:
This pack extracts the local integration surface between AAF-002 planning/dependency contracts and the available AAF-003B lifecycle/failure/retry contracts. It does not implement Firestore queue code, Cloud Functions, source workers, Vertex/Gemini clients, DigiBook generation, materialization, scheduler, or publication.

NO_NEW_PRODUCT_CODE_CHANGES:
YES

EVIDENCE_ONLY_REPORT_CREATED:
YES

CONCURRENT_EXTERNAL_CHANGES:
Present before this report. Student-pillar/personalization tracked changes and multiple untracked work-lane artifacts were observed. They were not modified, staged, or normalized by PREQ-01.

## AAF_002_COMMIT_SCOPE

Commit `7f9cc8a9e51dd79b395f2e56ed54274b10cfb098` is the accepted AAF-002 production baseline. It includes AAF-001 core contracts, AAF-002 work-order/dependency/unlock contracts, tests, and 417-AMTN graph simulation evidence.

Authoritative status:
- AAF-001: ACCEPTED / LOCKED
- AAF-002: PRODUCTION_IMPLEMENTED / ACCEPTED / LOCKED
- AAF-003A: ACCEPTED / LOCKED
- AAF-003B: active local lifecycle surface, not queue adapter
- Student readiness: NOT_READY
- Publication readiness: BLOCKED
- 101% DigiBook automation: NOT_YET_CLOSED

## AAF_002_AUTHORITATIVE_FILES

Production files:
- lib/features/academic_factory/domain/models/academic_factory_work_order.dart
- lib/features/academic_factory/domain/models/academic_factory_dependency_graph.dart
- lib/features/academic_factory/domain/models/academic_factory_unlock_decision.dart
- lib/features/academic_factory/domain/engines/academic_factory_dependency_graph_validator.dart
- lib/features/academic_factory/domain/engines/academic_factory_dependency_unlock_engine.dart

Test files:
- test/features/academic_factory/domain/academic_factory_dependency_graph_validator_test.dart
- test/features/academic_factory/domain/academic_factory_dependency_unlock_engine_test.dart

Foundation dependency files:
- lib/features/academic_factory/domain/models/academic_factory_types.dart
- lib/features/academic_factory/domain/models/academic_factory_job.dart
- lib/features/academic_factory/domain/models/academic_factory_run.dart
- lib/features/academic_factory/domain/engines/academic_factory_transition_policy.dart

417 proof paths:
- docs/patch_safety/AAF_002B_ACTUAL_PLACEMENT_GRAPH_SIMULATION_REPORT_20260816.md
- docs/patch_safety/AAF_002B_ACTUAL_PLACEMENT_GRAPH_SIMULATION_REPORT_20260816.json

## AAF_002_PUBLIC_API_MATRIX

AcademicFactoryWorkOrder:
- deterministic work-order representation for one AMTN job plan
- carries run, mission, AMTN, job identity, job type, dependency keys, idempotency key, initial state, and metadata
- queue adapter must serialize it without changing domain meaning

AcademicFactoryDependencyGraph:
- validates work-order graph integrity before persistence
- rejects cycles, duplicate identities, missing dependencies, and cross-AMTN dependency bleed

AcademicFactoryUnlockDecision:
- represents dependency unlock result after job completion/state movement
- separates newly-ready jobs from blocked/not-yet-ready jobs

AcademicFactoryDependencyGraphValidator:
- local graph authority before any persistent queue write
- queue adapter must not bypass this validator

AcademicFactoryDependencyUnlockEngine:
- local unlock authority after dependency completion
- queue adapter consumes its decisions to wake waiting jobs

## PLANNING_AUTHORITY

AAF-002 is authoritative for local job planning and dependency graph validity. FF1 queue source may define persistence mechanics, but it must not invent dependency unlock behavior that conflicts with AAF-002.

## WORK_ORDER_TO_JOB_SUPPORTED

Supported: YES.

Mapping rule:
- each work order maps to one persistent queue job
- workOrder.idempotencyKey maps to persistent idempotency identity
- workOrder.jobType maps to AcademicFactoryJobType wire
- workOrder.initialState maps to AcademicFactoryJobState
- dependencies map to prerequisite job idempotency keys or durable job references

Forbidden:
- no direct content publication from work order
- no source acquisition side effects while planning
- no Firebase/Vertex/Gemini calls during planning

## DEPENDENCY_IDENTITY_MODEL

Dependency identity is idempotency-key based. The 417-AMTN graph proof validates:
- 417 AMTNs
- 4,587 deterministic base jobs
- 4,587 unique idempotency keys
- 0 duplicate idempotency keys
- 0 dependency cycles
- 0 missing dependencies
- 0 cross-AMTN dependencies

## INITIAL_STATE_CONTRACT

Expected queue initial state:
- jobs with no dependencies: ready
- jobs with unresolved dependencies: waiting_dependency
- graph-invalid jobs: never persisted as runnable jobs

Queue adapter must fail closed if a job cannot be mapped to one of the supported domain states.

## UNLOCK_ENGINE_API

AcademicFactoryDependencyUnlockEngine is the only local authority for dependency unlocking.

Expected queue use:
1. a job reaches dependency-satisfying terminal state
2. adapter loads dependent candidate jobs from queue source
3. adapter builds local graph/candidate view
4. unlock engine decides newly-ready jobs
5. adapter writes only the resulting safe state transitions

Forbidden:
- waking jobs by string matching alone
- waking jobs across mission/AMTN boundaries
- waking jobs when dependencies are missing or failed

## AAF_003B_PUBLIC_API_MATRIX

Local lifecycle/failure surface observed:
- AcademicFactoryFailureDecision
- AcademicFactoryFailurePolicy
- AcademicFactoryRetryBackoffPolicy
- AcademicFactoryJobLifecycleEngine

Adjacent progress surface observed:
- AcademicFactoryRunProgress
- AcademicFactoryRunProgressEvaluator

Queue adapter should treat lifecycle engine as the local transition authority. It should not write raw state changes directly unless the state change is first validated by the domain policy.

## JOB_SERIALIZATION_SCHEMA

Required persistent job fields for FF1 adapter design:
- jobId
- runId
- missionId
- amtnId
- jobType
- state
- idempotencyKey
- dependencyKeys
- attemptCount
- maxAttempts
- leaseOwner
- leaseExpiresAtUtc
- nextRetryAtUtc
- failureClass
- failureMessage
- outputHash
- createdAtUtc
- updatedAtUtc
- metadata

All timestamps must be UTC. Queue adapter must preserve wire enum strings, not Dart enum names.

## JOB_TYPE_WIRES

- source_acquisition
- source_validation
- digibook_draft
- digibook_validation
- digibook_pro_review
- digibook_repair
- digibook_assembly
- digibook_materialization
- crucible_draft
- crucible_validation
- crucible_pro_review
- crucible_repair
- crucible_materialization

## JOB_STATE_WIRES

- planned
- waiting_dependency
- ready
- leased
- running
- reviewing
- repair_required
- retry_wait
- hard_hold
- approved
- materializing
- published
- failed_terminal

## FAILURE_CLASS_WIRES

- transient_provider
- rate_limited
- timeout
- source_missing
- source_insufficient
- source_mismatch
- validation_failed
- review_dispute
- academic_error
- format_error
- duplicate
- materialization_failed
- governance_blocked
- unknown

## RUN_STATUS_WIRES

- planned
- running
- paused
- completed
- completed_with_holds
- failed
- cancelled

## TRANSITION_MATRIX

Allowed local transitions:
- planned -> waiting_dependency, ready, failed_terminal
- waiting_dependency -> ready, hard_hold, failed_terminal
- ready -> leased, hard_hold, failed_terminal
- leased -> running, retry_wait, hard_hold, failed_terminal
- running -> reviewing, repair_required, retry_wait, hard_hold, approved, materializing, failed_terminal
- reviewing -> repair_required, retry_wait, hard_hold, approved, failed_terminal
- repair_required -> ready, retry_wait, hard_hold, failed_terminal
- retry_wait -> ready, hard_hold, failed_terminal
- hard_hold -> ready, failed_terminal
- approved -> materializing, published, failed_terminal
- materializing -> published, retry_wait, hard_hold, failed_terminal
- published -> no forward transition
- failed_terminal -> no forward transition

## FAILURE_MATRIX

AcademicFactoryFailurePolicy behavior:
- transient_provider / rate_limited / timeout: retry until attempts exhausted, then hard_hold
- source_missing: retry/hard_hold for source_acquisition and source_validation; hard_hold for other job types
- source_insufficient / source_mismatch: hard_hold
- validation_failed / review_dispute / academic_error / format_error: repair for repairable content jobs unless exhausted or incompatible state; otherwise hard_hold
- duplicate: failed_terminal
- materialization_failed: retry/hard_hold for materialization jobs; hard_hold for other job types
- governance_blocked / unknown: hard_hold

Repairable content jobs:
- digibook_draft
- digibook_validation
- digibook_pro_review
- crucible_draft
- crucible_validation
- crucible_pro_review

## RETRY_MATRIX

Supported retry classes and deterministic backoff:
- transient_provider: base 30s, cap 15m
- rate_limited: base 1m, cap 30m
- timeout: base 30s, cap 10m
- source_missing: base 2m, cap 1h
- materialization_failed: base 1m, cap 30m

Backoff is deterministic exponential, capped, with no jitter in local domain policy. Queue scheduler may add operational jitter later only if it does not change domain retry eligibility.

## IDEMPOTENCY_CONTRACT

Required:
- every planned job has exactly one idempotency key
- queue writes must be create-if-absent or compare-and-safe-update
- duplicate event delivery must not create duplicate jobs
- same idempotency key with different job intent must fail closed
- retries reuse the same job identity; they do not create a new job
- repair jobs must carry deterministic repair linkage to the failed job

## AAF_002_TO_003B_COMPATIBILITY

Compatible surfaces:
- AAF-002 creates deterministic work orders and dependency graph
- AAF-003B claims, leases, starts, reviews, approves, materializes, publishes, retries, repairs, holds, and recovers expired leases
- AAF-002 unlock engine can wake waiting jobs after AAF-003B state changes

Required adapter bridge:
- WorkOrder -> AcademicFactoryJob persistence DTO
- dependencyKeys -> durable queue dependency index
- lifecycle transition -> atomic backend update
- failure decision -> persistent failure/retry/repair fields
- unlock decision -> safe waiting_dependency -> ready transitions

## QUEUE_ADAPTER_LOCAL_OPERATION_MATRIX

Planned operations for FF1 merge:
- planGraph: local only, no backend
- persistPlannedJobs: backend create with idempotency guard
- claimReadyJob: atomic lease compare/update
- renewLease: owner-only lease extension
- startJob: leased -> running
- markReviewing: running -> reviewing
- approveJob: reviewing/running -> approved with output hash
- materializeJob: approved -> materializing
- publishJob: materializing -> published, guarded by future materialization gate
- failJob: lifecycle failure policy decision
- wakeRetry: retry_wait -> ready when due
- recoverExpiredLease: expired lease -> retry/hard_hold via timeout policy
- unlockDependents: AAF-002 unlock engine-driven state wake

## BACKEND_ADAPTER_SEAMS

FF1 must provide exact source truth for:
- existing ai_queue collection/path schema
- current direct-write worker/export paths
- lease fields and claim semantics, if any exist
- retry fields and scheduler wake mechanism
- run/job document identity pattern
- current status enums and compatibility risks
- legacy direct-write behavior that must be quarantined
- required indexes/security/IAM shape
- emulator test strategy

No persistent queue adapter should be implemented before FF1 source pack is merged with this PREQ-01 surface.

## GRAPH_417_EVIDENCE_PATHS

- docs/patch_safety/AAF_002B_ACTUAL_PLACEMENT_GRAPH_SIMULATION_REPORT_20260816.md
- docs/patch_safety/AAF_002B_ACTUAL_PLACEMENT_GRAPH_SIMULATION_REPORT_20260816.json

Locked proof:
- 1 AMTN: 11 jobs
- 10 AMTNs: 110 jobs
- 50 AMTNs: 550 jobs
- 417 AMTNs: 4,587 jobs
- duplicate idempotency keys: 0
- cycles: 0
- missing dependencies: 0
- cross-AMTN dependencies: 0
- graph valid: YES

## SOURCE_FILES_AND_SHA256

- lib/features/academic_factory/domain/models/academic_factory_types.dart: E3513A29F80D46D701F1413F85003288B9E5277176CFC559A812FD2B2EFBDF5A
- lib/features/academic_factory/domain/models/academic_factory_job.dart: 57F3505249F0B021B8B9D6AC217EAF5274006D89B5029C0E1B0504630D72D28B
- lib/features/academic_factory/domain/models/academic_factory_run.dart: 916DDFDB77A93A91BA05AEACBD973ADB57CFE8289D31509D7110329E461FBFEE
- lib/features/academic_factory/domain/engines/academic_factory_transition_policy.dart: 501533051082A78FE77928D5CEDD2BC1AC5B911950A63FAF96A762DDBB10F111
- lib/features/academic_factory/domain/models/academic_factory_work_order.dart: 516EB1D3ED86B605F6D06B20953073A612887F2DB84B53FF9EF3CD80691C57C5
- lib/features/academic_factory/domain/models/academic_factory_dependency_graph.dart: 490B1D602258A0B4EF8412A2B2BC516DC65A4BEE77B7CD897139EC3C03C7561E
- lib/features/academic_factory/domain/models/academic_factory_unlock_decision.dart: 6F36E055E04F553DE1242815E829D4CB3D4C294652F53D326EF1BCC3F66FDA1E
- lib/features/academic_factory/domain/engines/academic_factory_dependency_graph_validator.dart: 38E17A64FBD541C3DEAEE2DB9C5EB704E50E341BD62EFA70A376A6DC33667A75
- lib/features/academic_factory/domain/engines/academic_factory_dependency_unlock_engine.dart: 264A042C72217F62911F6A64AA0AA6ED9350E3E1BA77363E7EBA3A4DBEA27FD9
- lib/features/academic_factory/domain/models/academic_factory_failure_decision.dart: E6DF93560E40CF4C9DFCEAA1E1BEC19436C893A8CD3680DCD960217D378C0871
- lib/features/academic_factory/domain/engines/academic_factory_failure_policy.dart: ADE8328737FED9153DFA725382E9D586AC9E4C1BC7149F009F08272E311926F9
- lib/features/academic_factory/domain/engines/academic_factory_retry_backoff_policy.dart: A764FD124E5F86937F97FC297658D13D2E1265EEFB5734F047BF7A6E99C269E1
- lib/features/academic_factory/domain/engines/academic_factory_job_lifecycle_engine.dart: 651F78C7F8C8DAC00F006022A6ACE6F0A4DE11107B9F71D99108E1BB114545D4
- lib/features/academic_factory/domain/models/academic_factory_run_progress.dart: 0983B4DBE1F881F858699590C39B514798A592460BB02DB5E1C01BC19968453C
- lib/features/academic_factory/domain/engines/academic_factory_run_progress_evaluator.dart: 2ACE3649A0B9243BDC701AF052FD3C0F2B5A0E7C84340E8CDC7C6E7EDE4D7C3B
- docs/patch_safety/AAF_002B_ACTUAL_PLACEMENT_GRAPH_SIMULATION_REPORT_20260816.md: 4718381EAA11EAB9EE801F64287CCC226F5C57FFD08E75223C9CDA3F5C6BF1C6
- docs/patch_safety/AAF_002B_ACTUAL_PLACEMENT_GRAPH_SIMULATION_REPORT_20260816.json: 10A29888F4A92AE8C90BC3FF8C4DA0202A730EF6D3B82C686CB8EAF95D349A15

## NO_NEW_AGENT_CHANGES

Product/source code changes by PREQ-01: NO.

Evidence-only artifact created by PREQ-01:
- docs/patch_safety/AAF_PREQ_01_LOCAL_CONTRACT_INTEGRATION_SURFACE_PACK_20260816.md

Concurrent external changes were present before this report and remain untouched.

## BLOCKERS_FOR_QUEUE_ADAPTER_FROM_LOCAL_DOMAIN_SIDE

No local AAF-002/003B blocker prevents adapter design, but FF1 is mandatory before code implementation.

Queue adapter is blocked on:
- exact existing ai_queue/backend schema
- exact worker direct-write paths
- Firestore transaction/lease constraints
- legacy direct-write quarantine plan
- source/provenance document model
- review/repair queue integration shape
- materialization/publication safety gate
- emulator-backed adapter test plan

FIREBASE_READ: NO
FIREBASE_WRITE: NO
VERTEX_USED: NO
GEMINI_USED: NO
ACADEMIC_CONTENT_GENERATED: NO
DEPLOYED: NO
GRADLE_TOUCHED: NO

FINAL_LINE:
AAF_PREQ_01_READY_TO_MERGE_WITH_FF1_QUEUE_SOURCE_PACK
