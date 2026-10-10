# RANKCRACKERS — TEACHING EXECUTION AND TAUGHT MANIFEST EVIDENCE CONTRACT

Document ID: RC-ACADEMIC-TEM-001
Version: 0.1-DRAFT-CANONICAL-CANDIDATE
Status: Implementation-Ready Draft / Pending Retrospective Conflict Audit
Authority Level: Subordinate Academic Evidence Contract
Depends On:
- DIGIBOOK_AND_TAUGHT_CONTENT_AUTHORITY_CONTRACT.md
- RC-ACADEMIC-STR-001 Subject Teacher Resolution Constitution
- RC-ACADEMIC-APE-001 Atomic Pedagogy Execution Contract
- RC-ACADEMIC-DCP-001 DigiBook Content Production and Publication Contract
Conflict Rule: This contract refines Teaching Execution and Taught Manifest evidence. It does not weaken or silently supersede higher constitutional authority.

## 1. Purpose
Define exactly how immutable RELEASED DigiBook material becomes provably TAUGHT knowledge for a learner/cohort/context, and how that evidence is compiled into a versioned Taught Manifest and bounded Knowledge Boundary.

## 2. Constitutional Truth Separation
RELEASED != DELIVERED
DELIVERED != OPENED
OPENED != EXPOSED
EXPOSED != TEACHING_EXECUTED
TEACHING_EXECUTED != TAUGHT_AUTHORITY_GRANTED
TAUGHT != MASTERED
TAUGHT != AUTOMATIC_QUESTION_ELIGIBILITY

No state may be inferred solely from a weaker state.

## 3. Teaching Execution Identity
Canonical execution identity binds:
MissionID x Learner/CohortContext x ReleasedMaterialVersion x PedagogyVersion x ExecutionID x CompletionPolicyVersion

It also preserves syllabus, atom/objective, teacher interpretation, delivery variant, language and relevant session lineage.

## 4. Evidence Granularity
Evidence may exist at session, teaching-step, content-unit, objective, atom or bounded composition level.

Granularity must be no coarser than the claim being granted.
A parent taught claim cannot be inferred from a child event unless an explicit completion/aggregation rule proves full parent coverage.

## 5. Evidence Event
A policy-relevant event records:
- event_id
- execution_id
- learner/cohort context
- material version
- content/objective/atom refs
- event_type
- occurred_at
- observed_at
- source/device/client context where relevant
- sequence/replay identity
- payload fingerprint
- evidence strength/class
- policy version
- validation state

Events are immutable observations; corrections append reconciliation evidence rather than rewriting history.

## 6. Evidence Classes
TELEMETRY_ONLY — operational signal; cannot independently grant taught authority.
EXPOSURE_EVIDENCE — proves bounded material exposure only.
INTERACTION_EVIDENCE — proves required learner interaction occurred.
EXECUTION_EVIDENCE — proves a defined teaching step/completion condition executed.
CHECK_EVIDENCE — records bounded objective/check outcome.
REMEDIATION_EVIDENCE — records required repair execution/recheck.
AUTHORITY_EVIDENCE — compiled evidence satisfying the governing taught-authority policy.

A UI click or scroll is never upgraded to stronger evidence without an explicit validated rule.

## 7. Weak-Signal Law
OPEN, PAGE_VIEW, SCROLL, TIME_ON_PAGE, FOREGROUND_TIME and similar telemetry are insufficient alone to prove teaching.

They may support fraud/anomaly detection or bounded exposure evidence, but cannot independently establish TAUGHT.

## 8. Completion Policy
Every teaching execution binds an immutable CompletionPolicyVersion defining:
- required content/steps
- required interactions
- required checks where applicable
- allowed skips
- remediation requirements
- partial-credit/coverage rules
- interruption/resume behavior
- evidence sufficiency thresholds
- aggregation rules
- failure states

Policy changes do not retroactively rewrite historical executions.

## 9. Teaching Execution State Machine
CREATED
-> STARTED
-> IN_PROGRESS
-> EXECUTION_COMPLETE
-> EVIDENCE_COMPILED
-> TAUGHT_AUTHORITY_EVALUATED

Exception/change states:
INTERRUPTED
RESUMABLE
ABANDONED
EVIDENCE_INCOMPLETE
EVIDENCE_CONFLICT
INVALID
STALE
SUPERSEDED

EXECUTION_COMPLETE alone does not mean TAUGHT; evidence compilation and authority evaluation remain separate.

## 10. Partial Coverage
Partial execution grants only deterministically proven coverage.

Coverage can be tracked over objectives/content units/atoms according to policy.
No all-or-nothing parent shortcut is allowed unless the completion policy explicitly proves all required descendants.

## 11. Coverage Manifest
Compiled coverage records:
- execution_id
- exact material/pedagogy versions
- covered objective/content refs
- uncovered required refs
- remediation refs
- evidence refs
- coverage calculation policy
- coverage fingerprint
- compilation timestamp/status

Coverage is evidence, not mastery.

## 12. Objective Coverage
An objective is taught only when its required pedagogical components satisfy the bound completion policy.

Presence of an objective in released content does not grant taught status.
Exposure to one explanation does not prove all required objective components.

## 13. Atom Aggregation
An atom receives taught authority only under an explicit atom aggregation rule over required objectives/components.

Aggregation must account for required versus optional components and unresolved remediation.

No parent atom inference from arbitrary child completion.

## 14. Prerequisite Remediation Execution
When Atomic Pedagogy requires remediation, the execution records:
trigger -> repair action -> recheck/exit condition -> resulting evidence.

Skipping mandatory remediation blocks affected coverage authority.

## 15. Interruption and Resume
Resume must bind to the same compatible material/pedagogy/completion-policy authority or undergo revalidation.

If upstream material changes materially between interruption and resume, the system determines whether previous evidence remains valid, needs revalidation, or requires replay/remediation.

## 16. Replay and Idempotency
Repeated delivery, retries, duplicate client events or sync retries cannot multiply taught authority.

Stable event/execution identities and deterministic fingerprints deduplicate semantically identical evidence.

Repeated legitimate teaching may be retained as separate execution history without duplicating canonical taught coverage.

## 17. Offline Evidence
Offline-capable clients may queue evidence, but offline events are provisional until validated.

Validation checks identity, material/policy version, chronology, integrity/fingerprint, replay, authority freshness and impossible/conflicting sequences.

Offline capability must not become a fail-open authority path.

## 18. Clock and Ordering Safety
Client timestamps are observations, not sole authority.

Use occurred_at and trusted observed/ingested sequencing as needed.
Clock skew cannot silently reorder evidence into a false completion.
Ordering-sensitive policies use validated sequence identity/causal rules rather than trusting device wall-clock alone.

## 19. Conflicting Evidence
Conflicts produce EVIDENCE_CONFLICT and explicit reconciliation.

Examples include impossible ordering, incompatible material versions, duplicated identities with divergent payloads, completion before required steps, or stale execution against superseded authority.

Conflict is never resolved by silently choosing the most favorable event.

## 20. Evidence Integrity
Evidence events use immutable IDs/fingerprints and append-only audit semantics at the logical authority layer.

Tamper/anomaly signals may quarantine evidence.
Integrity design must support retry and offline workflows without falsely treating benign duplicates as fraud.

## 21. Taught Manifest
A Taught Manifest is the canonical compiled statement of what knowledge is proven taught under exact authority.

It records:
- taught_manifest_id/version
- mission and learner/cohort context
- syllabus/material/pedagogy/completion-policy versions
- objective/atom coverage
- execution/evidence refs
- granted/withheld coverage
- invalidation state
- manifest fingerprint
- compiled_at
- supersession lineage

## 22. Taught Manifest Immutability
Published/authoritative manifest versions are immutable evidence.
New evidence or corrections create a new manifest version/supersession relationship.

History is never rewritten to make a learner appear to have been taught knowledge earlier than evidence proves.

## 23. Taught Content Authority Grant
Grant requires:
- mission/applicability valid
- upstream syllabus/atom valid
- exact material RELEASED
- pedagogy authority valid
- completion policy valid
- required execution evidence valid
- required remediation satisfied
- no blocking evidence conflict
- no open upstream invalidation
- deterministic coverage compilation PASS

Grant is scoped only to proven knowledge boundary.

## 24. Withholding Is First-Class
The compiler records why authority was not granted:
NOT_EXECUTED
PARTIAL_COVERAGE
REQUIRED_STEP_MISSING
REMEDIATION_INCOMPLETE
EVIDENCE_INCOMPLETE
EVIDENCE_CONFLICT
MATERIAL_STALE
UPSTREAM_INVALIDATED
POLICY_MISMATCH
INTEGRITY_QUARANTINE

Absence of grant is not silently converted into failure/mastery status.

## 25. Knowledge Boundary
The Knowledge Boundary is a derived, versioned export of currently valid taught authority suitable for downstream Question Knowledge Closure.

It contains only knowledge proven under current applicable authority and preserves exact provenance to Taught Manifest entries.

It does not itself make questions eligible.

## 26. Mastery Boundary
Mastery is separate from taught authority.

Check evidence may later contribute to mastery models, but TEM cannot infer mastery merely from teaching completion.

TAUGHT is a delivery/authority fact; MASTERED is a learner-knowledge inference governed separately.

## 27. Question Knowledge Closure Handoff
TEM exports exact knowledge dependencies/objective/atom authority plus provenance and validity state.

Question Knowledge Closure determines whether a question's dependencies are fully inside the permitted knowledge boundary.

No chapter-name matching or coarse syllabus membership shortcut is sufficient.

## 28. Crucible Boundary
Crucible cannot infer eligibility from DigiBook release, page view or generic lesson completion.

It consumes valid downstream knowledge-closure decisions derived from current taught authority.

## 29. Test Arena Boundary
Test Arena may support explicit modes where not-yet-taught knowledge is intentionally assessed, but mode/policy must declare that distinction.

TEM still reports truthful taught status; it never fabricates teaching to satisfy a test mode.

## 30. Upstream Revision and Staleness
When syllabus, atom, teacher interpretation, pedagogy or material changes, deterministic impact analysis classifies existing taught evidence/manifest entries:
UNAFFECTED
REVALIDATION_REQUIRED
RETEACH_REQUIRED
RECHECK_REQUIRED
STALE
INVALID
SUPERSEDED

Historical teaching evidence remains historical truth even when it is no longer sufficient for current authority.

## 31. Editorial Versus Semantic Change
Non-semantic editorial changes may preserve taught authority after proven equivalence.
Semantic changes require bounded impact evaluation and may require reteaching/revalidation.

No global invalidation when precise impact is provably narrower.

## 32. Delivery Variant and Language Changes
Variant/language changes preserve prior taught authority only when semantic equivalence and completion-policy compatibility are proven.

Presentation differences alone do not erase valid evidence; semantic divergence cannot inherit authority silently.

## 33. Cohort Versus Learner Authority
Cohort teaching execution may prove delivery to a defined cohort only when membership and participation evidence satisfy policy.

Cohort delivery cannot automatically assert individual learner exposure/completion if individual proof is required by the policy.

The authority model explicitly distinguishes cohort-level and learner-level claims.

## 34. Privacy and Minimization
Collect only evidence necessary for academic authority, integrity and product operation.

Do not require invasive surveillance merely to prove teaching.
Camera, microphone, biometrics or similarly sensitive evidence are not default teaching requirements.

Evidence sufficiency must prefer minimally invasive deterministic signals.

## 35. Fraud/Anomaly Boundary
Anomaly detection may flag suspicious evidence but cannot independently rewrite academic history.

Quarantine/hold is distinct from guilt or invalidation.
Final authority decisions follow explicit policy and review where required.

## 36. Concurrency
Concurrent execution/evidence compilation cannot create conflicting effective Taught Manifest truth.

Multiple legitimate executions may coexist, but current manifest compilation is deterministic over accepted evidence and exact authority versions.

Use transactional/conditional/CAS-equivalent mechanisms for effective manifest publication.

## 37. Eventual Consistency
Temporary delayed events may leave authority PENDING/EVIDENCE_INCOMPLETE.

The system must prefer delayed grant over false grant.
Once late valid evidence arrives, deterministic recompilation may create a new manifest version.

## 38. Revocation and Withdrawal
If evidence is later proven invalid or upstream authority is withdrawn, current taught authority may be revoked/invalidated prospectively according to policy while preserving historical evidence and reason.

Revocation is explicit and auditable, never destructive deletion of history.

## 39. Manual Override
Exceptional override records:
actor/authority
reason
scope
evidence
previous decision
replacement decision
effective time
expiry/review condition
downstream impact

Manual override cannot erase contradictory evidence.

## 40. Legacy Migration
Legacy completion/progress records lacking sufficient provenance cannot be silently promoted to current Taught Content Authority.

Classify as LEGACY_TAUGHT_EVIDENCE_UNPROVEN until reconciled.
Migration may prove equivalence; it cannot invent historical execution evidence.

## 41. Observability
Track:
executions by state
evidence-incomplete backlog
conflict/quarantine count
partial coverage
remediation incomplete
manifest compilation failures
current/stale taught authority
revalidation/reteach backlog
offline evidence validation backlog
legacy-unproven evidence

These are governance/operational metrics, not mastery scores.

## 42. Complexity Gate
Not every telemetry event needs its own business-domain aggregate/service.

Separate persistence/objects are justified by audit, deduplication, offline sync, integrity, query, independent lifecycle or invalidation needs.

High-volume raw telemetry may use an appropriate event store while canonical authority stores retain only necessary evidence references/aggregates.

Precision must not create unnecessary runtime cost.

## 43. Minimum Acceptance Tests
TEM-001 released material alone grants no taught authority.
TEM-002 opening material grants no taught authority.
TEM-003 scroll/time-on-page alone grants no taught authority.
TEM-004 valid full execution compiles required coverage.
TEM-005 partial execution grants only proven subset.
TEM-006 parent atom is not inferred from incomplete children.
TEM-007 required remediation missing blocks affected coverage.
TEM-008 valid remediation and recheck can satisfy policy.
TEM-009 interruption preserves only valid prior evidence.
TEM-010 semantic material change during resume triggers impact evaluation.
TEM-011 duplicate events are idempotently handled.
TEM-012 retries cannot multiply authority.
TEM-013 legitimate repeated teaching preserves history without duplicate canonical coverage.
TEM-014 offline events remain provisional until validation.
TEM-015 clock skew cannot manufacture valid ordering.
TEM-016 conflicting duplicate payloads create evidence conflict.
TEM-017 impossible event sequence cannot grant authority.
TEM-018 stale material execution cannot grant new current authority.
TEM-019 manifest binds exact material/pedagogy/policy versions.
TEM-020 authoritative manifest is immutable.
TEM-021 late valid evidence creates deterministic recompilation/new manifest version.
TEM-022 taught does not imply mastered.
TEM-023 knowledge boundary does not itself make question eligible.
TEM-024 Crucible cannot use page view as eligibility.
TEM-025 Test Arena mode cannot falsify taught status.
TEM-026 editorial-equivalent change can preserve authority when proven.
TEM-027 semantic change triggers bounded revalidation/reteach.
TEM-028 language/variant equivalence cannot be assumed without policy.
TEM-029 cohort execution cannot falsely assert individual completion.
TEM-030 privacy-invasive evidence is not required by default.
TEM-031 anomaly flag does not silently invalidate history.
TEM-032 concurrency cannot publish conflicting current manifests.
TEM-033 eventual consistency delays grant rather than granting falsely.
TEM-034 revocation preserves historical evidence/reason.
TEM-035 manual override is fully auditable.
TEM-036 legacy progress is not falsely certified as taught.
TEM-037 PYQ absence has no effect on teaching evidence authority.
TEM-038 upstream invalidation propagates to current authority state.
TEM-039 withheld authority has an explicit reason.
TEM-040 every knowledge-boundary entry reconstructs to accepted evidence.
TEM-041 event payload fingerprint mismatch blocks acceptance.
TEM-042 completion-policy version changes do not rewrite historical executions.
TEM-043 required check missing cannot be inferred from UI completion.
TEM-044 Taught Manifest compilation is deterministic for same accepted evidence set.
TEM-045 embedded evidence references remain reconstructable under complexity compression.
TEM-046 raw telemetry retention design cannot become canonical academic authority by accident.

## 44. Acceptance Gates
TRUTH-SEPARATION PASS
EXECUTION IDENTITY PASS
EVIDENCE TYPING PASS
WEAK-SIGNAL SAFETY PASS
COMPLETION POLICY PASS
PARTIAL COVERAGE PASS
PREREQUISITE/REMEDIATION PASS
OFFLINE/REPLAY PASS
CLOCK/ORDERING PASS
EVIDENCE CONFLICT PASS
MANIFEST IMMUTABILITY PASS
TAUGHT-AUTHORITY PASS
KNOWLEDGE-BOUNDARY PASS
MASTERy-SEPARATION PASS
INVALIDATION PASS
COHORT/LEARNER ISOLATION PASS
PRIVACY/MINIMIZATION PASS
CONCURRENCY PASS
EVENTUAL-CONSISTENCY PASS
LEGACY MIGRATION SAFETY PASS
AUDITABILITY PASS
COMPLEXITY GATE PASS

DOCUMENTED != IMPLEMENTED.

## 45. Non-Negotiable Invariants
1. RELEASED never means TAUGHT.
2. OPENED/VIEWED/SCROLLED never independently means TAUGHT.
3. TAUGHT never means MASTERED.
4. Evidence strength cannot be silently upgraded.
5. Taught authority is no broader than proven coverage.
6. Partial execution yields only proven partial authority.
7. Required remediation cannot be silently skipped.
8. Duplicate/replayed events cannot multiply authority.
9. Offline evidence is provisional until validated.
10. Client clock alone cannot establish authoritative ordering.
11. Evidence conflicts fail closed for affected authority.
12. Taught Manifest versions are immutable and reconstructable.
13. Current authority retains exact upstream version bindings.
14. Semantic upstream changes receive deterministic impact analysis.
15. Historical teaching evidence is preserved even when current authority becomes stale.
16. Knowledge Boundary does not itself authorize questions.
17. Test modes cannot falsify taught truth.
18. Cohort evidence cannot silently become individual evidence.
19. Evidence collection is privacy-minimized.
20. Legacy progress is never falsely certified.
21. PYQ absence never affects legitimate teaching evidence.
22. Precision does not justify unnecessary runtime fragmentation.
23. Every current taught claim reconstructs to accepted evidence and verified syllabus authority.

## 46. Next Action
Reconcile QUESTION_REPOSITORY_AND_KNOWLEDGE_CLOSURE_CONTRACT.md against this exact Taught Manifest/Knowledge Boundary model. Add only missing rules; do not create a duplicate contract unless a real constitutional gap requires one.

Current status: DOCUMENTED. IMPLEMENTATION NOT CLAIMED. RETROSPECTIVE LEGACY-CONFLICT AUDIT PENDING.
