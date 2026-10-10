# RANKCRACKERS — CRUCIBLE EXECUTABLE COMPILER AND STATE-MACHINE CONTRACT

Document ID: RC-CRUCIBLE-ECS-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Architecture / Runtime Not Yet Claimed
Authority Level: Subordinate Crucible executable architecture contract
Extends:
- CRUCIBLE_98_DAY_DAY_BY_DAY_CORE_OPERATING_SPECIFICATION.md
- CRUCIBLE_MICRO_MACRO_EXAM_BLUEPRINT_DERIVATION_SPECIFICATION.md
- CRUCIBLE_ASSESSMENT_EXECUTION_CONTRACT.md
Depends On:
- UNIVERSAL_MISSION_EXAMINATION_BLUEPRINT_AND_STUDENT_PROJECTION_CONTRACT.md
- TEACHING_EXECUTION_AND_TAUGHT_MANIFEST_EVIDENCE_CONTRACT.md
- QUESTION_ATOMIC_INTEGRITY_AND_KNOWLEDGE_CLOSURE_SPECIFICATION.md

## 1. Purpose
Translate Founder-locked Crucible law into deterministic compiler interfaces, immutable artifacts, state transitions, gates and failure outputs before runtime implementation.

## 2. Canonical Identity Reconciliation
The Universal Mission contract owns Stage and Component identity.
ComponentID is canonical for an assessment unit.
PaperID MUST NOT become a duplicate runtime entity.
Where an official Component is a paper, PaperID is an official-paper alias/projection bound 1:1 to ComponentID for that blueprint version.
All sizing, question and attempt joins persist canonical ComponentID plus official label metadata as required.

## 3. Compiler Pipeline
Verified Effective Examination Blueprint
-> Effective Student/Track Projection
-> Assessment Surface Resolver
-> Crucible Derivation Compiler
-> 98-Day Phase/Day Compiler
-> Knowledge Eligibility Compiler
-> Question Candidate Compiler
-> Test Instance Compiler
-> Attempt Evidence Processor
-> Diagnostic Delta Compiler
-> Rebuild Compiler
-> Macro Reconciliation Compiler
-> Immutable Phase State.

Each stage consumes immutable/versioned input fingerprints and emits a typed result. No stage may silently repair invalid upstream authority.

## 4. Core Input Fingerprint
Every compiled Crucible artifact binds:
missionId
cycleId
examBlueprintId + version
stageId
componentId
track/applicability context
syllabus version refs
derivationPolicyVersion
crucibleCalendarPolicyVersion
questionSelectionPolicyVersion
taughtBoundaryFingerprint where assessment-specific
learner/cohort context where personalized.

## 5. Assessment Surface Resolver
Input: Effective Blueprint + student applicability.
Output: exact applicable StageID/ComponentID surfaces.
Failure:
STRUCTURE_CLASSIFICATION_REVIEW_REQUIRED
NO_APPLICABLE_COMPONENT
BLUEPRINT_NOT_VERIFIED_EFFECTIVE
AMBIGUOUS_APPLICABILITY.

It may never average multiple components.

## 6. Derivation Compiler
Input: one resolved component + RC-CRUCIBLE-MMS policy.
Output:
derivationMode
official count/marks/duration facts
reference density where valid
Micro duration/count-or-marks envelope
Macro duration/count-or-marks envelope
section/component constraints
composition constraints
policy fingerprint
derivation proof.

States:
NOT_DERIVABLE
DERIVABLE_PARTIAL
DERIVABLE_COMPLETE
STALE
INVALIDATED.

## 7. 98-Day Compiler
Input: calendar policy + learner cycle anchor + applicable derivation artifacts.
Output: DayPlan 1..98 with role:
LEARNING_MICRO on relative 2/4/6/8/10/12
LEARNING on other Days 1-12
REBUILD on 13
MACRO on 14
repeated for seven phases.

It does not decide syllabus truth; it allocates authorized work envelopes.

## 8. DayPlan Identity
cycleInstanceId
phaseId
dayNumberGlobal
dayNumberPhase
dayRole
scheduledAcademicEnvelopeRefs
assessmentBlueprintRef?
carryForwardRepairRefs
retentionRefs
authorityFingerprint
state.

## 9. Day State Machine
PLANNED
-> AUTHORITY_RESOLVED
-> PACKAGE_COMPILED
-> AVAILABLE
-> IN_PROGRESS
-> EVIDENCE_PENDING
-> RECONCILED
-> CLOSED.

Exceptions:
BLOCKED_AUTHORITY
BLOCKED_PREREQUISITE
COVERAGE_GAP
QUESTION_GAP
STALE
INVALIDATED
SUPERSEDED.

Calendar passage alone never advances academic authority state.

## 10. Knowledge Eligibility Compiler
At assessment compilation time:
EligibleKnowledge =
EffectiveComponentScope
INTERSECT CurrentVerifiedSyllabus
INTERSECT ValidTaughtKnowledgeBoundary
INTERSECT QuestionKnowledgeClosedDependencies.

Output includes exact eligible dependency/atom/DSD refs and exclusion reasons.
Fail closed on missing or stale authority.

## 11. Question Candidate Compiler
Input:
test purpose
derived size/composition envelope
eligible knowledge
canonical QuestionID/version pool
prior exposure/family history
weakness/retention state
difficulty/calibration metadata.

Output is a candidate set with inclusion/exclusion reason per QuestionID.
Selection cannot manufacture questions, enlarge syllabus or change size policy.

## 12. Test Instance Compiler
Produces immutable TestBlueprintID then TestInstanceID.
Binds:
Micro/Macro type
cycle/phase/day
mission/stage/component
blueprint version
derivation proof
selection policy
knowledge-boundary fingerprint
QuestionID + QuestionVersion list
scoring/marking rules
duration
composition proof
security/repetition proof.

A compiled test is invalid if its proof cannot be reconstructed.

## 13. Micro State Machine
PLANNED
-> ELIGIBILITY_COMPILED
-> CANDIDATES_COMPILED
-> TEST_COMPILED
-> AVAILABLE
-> STARTED
-> SUBMITTED/TIME_EXPIRED
-> SCORED
-> DIAGNOSTIC_COMPILED
-> RECONCILED.

Exceptions:
COVERAGE_GAP
QUESTION_GAP
POLICY_CONFLICT
STALE_BEFORE_START
INVALIDATED.

## 14. Attempt Evidence
Every attempt event binds:
StudentAttemptID
TestInstanceID
QuestionID
QuestionVersion
response/scoring
timing where meaningful
knowledge dependencies
AtomID/DSD lineage
ComponentID
StageID
MissionID
ExamBlueprintVersion
policy fingerprints.

Events are append-only; regrading/reconciliation appends new evidence.

## 15. Diagnostic Delta Compiler
Consumes valid Micro attempt evidence and emits:
new weakness signals
repeated weakness
misconception signals
retention signals
difficulty-band behavior
repair requirements
confidence/evidence sufficiency
next-block recommendations bounded to authorized material.

It never directly grants TAUGHT or MASTERED authority.

## 16. Rebuild Compiler — Day 13
Consumes exactly the phase's six Micro deltas plus Days 1-12 taught/repair evidence and retained debt.
Output RebuildPlan:
exact target dependencies
reason/evidence refs
DigiBook/material version refs
repair method
verification probe policy
exit/recheck condition.

No new syllabus allocation. Verification probe != Micro 7.

## 17. Macro Compiler — Day 14
Re-runs current eligibility; it does not assume Day-12 eligibility is still valid.
Compiles phase integration/retention test within derived Macro envelope.
If eligible breadth cannot satisfy policy:
COVERAGE_LIMITED only when bounded reduction is explicitly authorized;
otherwise COVERAGE_GAP.

Macro != Major Test. Full/Major simulation remains Test Arena.

## 18. Phase Reconciliation
After Macro, compile immutable PhaseState:
entry fingerprint
scheduled vs taught coverage
six Micro refs/deltas
repair history
RebuildPlan/evidence
Macro evidence
strength/weakness state
retention/repair debt
current knowledge boundary
all policy/version fingerprints
next-phase inputs.

Phase N+1 consumes Phase N state; it is not a reset.

## 19. Staleness / Invalidation
Revalidation triggers include:
new effective exam blueprint/corrigendum
syllabus invalidation
taught-authority invalidation
question defect/version invalidation
policy supersession where effective rules require it.

Future unstarted artifacts may become STALE/INVALIDATED and recompile.
Started/submitted historical attempts retain original bindings and are never rewritten.

## 20. Idempotency
Every compiler request has deterministic semantic input fingerprint.
Same authoritative inputs + same policy versions => same semantic compilation result.
Retries must not create duplicate authority, duplicate attempts or duplicate phase transitions.

## 21. Concurrency
Only one active canonical TestInstance per learner + cycleInstance + phase + dayRole + component + policy generation unless explicit multi-component policy requires separate instances.
Competing compilations resolve by deterministic generation/version rule; losers remain non-authoritative audit artifacts or are discarded before publication.

## 22. Offline Boundary
Offline clients may execute an already authorized immutable TestInstance where product policy permits.
They may not locally derive a new authoritative blueprint, widen eligibility or mint canonical Question authority.
Queued attempt evidence remains provisional until server validation/reconciliation.

## 23. Failure Contract
Failures are typed outputs, never empty success:
BLUEPRINT_NOT_VERIFIED_EFFECTIVE
AMBIGUOUS_APPLICABILITY
NOT_DERIVABLE
POLICY_CONFLICT
TAUGHT_BOUNDARY_MISSING
COVERAGE_GAP
QUESTION_GAP
QUESTION_VERSION_INVALID
STALE_INPUT
PREREQUISITE_BLOCK
EVIDENCE_CONFLICT.

Each failure includes authority refs, blocking dimension and safe next action class.

## 24. Observability
For every compile/evaluate transition log:
correlation/compile ID
artifact ID/version
input fingerprints
policy versions
result state
failure code if any
decision proof refs
timestamp/source service.

Logs do not replace immutable domain evidence.

## 25. Runtime Decomposition Gate
These compiler boundaries are logical contracts, not a mandate for separate microservices.
Implementation may begin as modules/functions in the existing backend if atomicity, versioning, testing and auditability are preserved.
Split services only when independent scaling/security/lifecycle proves necessary.

## 26. Mandatory Pre-Implementation Tests
Contract fixtures must cover:
single objective paper
Pre + Mains
Paper-I + Paper-II
track-specific applicability
section-timed paper
descriptive/mark-timed paper
mixed paper
notification pending
corrigendum mid-cycle
untaught atom
question shortage
invalid question version
Day-13 no-new-content
Macro coverage limitation
offline replay
duplicate compile/idempotency
concurrent compile
historical attempt after upstream supersession.

## 27. Implementation Gate
Runtime implementation may start only when:
A. canonical identity mapping is conflict-free;
B. compiler input/output schemas are agreed;
C. failure codes are agreed;
D. fixture expectations are written;
E. existing runtime ownership/integration points are identified;
F. no Student-side UI/behavior mutation is required by the backend foundation work.

## 28. Final Executable Law
Authority is resolved before scheduling.
Scheduling is resolved before test compilation.
Taught eligibility is re-evaluated before every assessment.
Questions are selected only from closed eligible knowledge.
Evidence is append-only.
Rebuild repairs; it does not expand scope.
Macro integrates; it does not become Major.
Versions change forward; history never mutates backward.
