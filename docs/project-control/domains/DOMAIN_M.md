# DOMAIN-M — Mission Production & Official Source Pipeline

**Status:** Founder-directed domain charter, 2026-10-11
**Room:** RankCrackers — DOMAIN-M — Mission Production
**Repository:** rankcrackersofficial-sys/RankCrackers
**Canonical base:** safety/rc-g2-pre-notification-schema
**Authority:** Founder/Master decisions and existing canonical GitHub contracts. This is an operational charter, not a replacement architecture.

## Mission
Own coordination of the end-to-end operational mission pipeline: bounded authority exam inventory, deduplication, permanent mission registration, real official English notification/syllabus/PYQ submission, deterministic ingestion, governed verification/extraction, OSA/DSD decomposition, downstream handoffs, exception management and mission-level readiness. Deliver running production evidence rather than more framework paperwork.

**Law:** AUTOMATE THE NORMAL PATH — ESCALATE THE EXCEPTION PATH. No blanket re-audit. Local failure → bounded repair → targeted regression, unless shared authority/data integrity is affected.

## Pipeline
Official authority inventory → deduplicate → register/reuse permanent mission → attach cycle → acquire and submit official English notification, syllabus and PYQs with original source URLs → ingestion-generated SHA/provenance/idempotency → worker verification and correct mission/cycle binding → notification extraction → syllabus extraction (faithful OSA) → derived DSD/Atomic Stop with verification → official PYQ/answer-key extraction and syllabus mapping → downstream academic and assessment workers → deterministic readiness gates → Founder Delivery Preview → mission-level Founder activation → governed Student publication.

Watch monitors future changes and discovers new exams; it is **not** a mandatory onboarding entrance gate.

## Responsibilities
- **AI agents:** acquire, deduplicate, register/create eligible missions, submit actual official English documents and original URLs. Agents never declare OFFICIAL_VERIFIED, fabricate sources or manually author academic content. System calculates hashes.
- **Deterministic ingestion:** calculate source hash/provenance, record versions, preserve evidence, idempotent retry and correct mission/cycle identity.
- **Governed workers:** verify provenance, official source and document identity, bind, extract notifications/syllabi/PYQs/answer keys, propose DSD and mappings under existing deterministic authority gates. Upload alone is never verification.
- **Founder:** routine create/upload/extract actions do not require approval; only material exceptions and final mission-level activation are escalated.
- **PYQ policy:** official original papers and official keys only for official status, including older years without arbitrary cutoff; preserve paper/year/shift/key provenance where available. Coaching or memory-based papers cannot be labelled official. Out-of-scope official PYQs trigger governed review, not silent syllabus expansion.

## Minimal identity and batches
Identity: missionId, official exam name, aliases, authority, official domain, exam family/jurisdiction, cycle, source endpoints and duplicate evidence. A permanent exam mission is not recreated annually. Work in bounded authority batches (SSC first, then other authorities independently); no uncontrolled mass registry creation. Missing English official documents are marked unavailable, not substituted.

## Cross-domain ownership
- **Domain-M:** mission pipeline operational owner, status and coordination.
- **Domain-A:** official syllabus authority (OSA), DSD, MABP, Atomic Stop, provenance and PYQ scope exceptions.
- **Domain-B:** DigiBook, pedagogy, teaching and Taught Content Authority; preserve accepted I1.
- **Domain-C:** question closure, Question Factory, Crucible and Test Arena.
- **Domain-D:** backend, ingestion, security, workers and runtime.
- **Domain-E:** Founder Web, exception presentation and Delivery Preview.
No competing authority contracts; one writer per contract/file set; Master resolves conflicts. Student Android UI/login/behavior remains frozen.

## Parallel lanes
A. Repair SSC CGL Hosting Identity Gate and prove deployment without relaxing security.
B. Reconcile bounded SSC permanent mission batch, dedupe and register eligible missing missions.
C. Submit real official English notification/syllabus/PYQ sources and trigger governed workers using verified interfaces.
D. Preserve Watch for future changes and new candidates. No lane must wait for unrelated lane completion.

## Exceptions and readiness
Escalate ambiguous duplicates, authority/source conflicts, invalid provenance, materially conflicting syllabus, worker failures, PYQ scope exceptions and publication readiness. Automated mission readiness summarizes Identity, Notification, Syllabus, Academic, Assessment and critical exception count. Never bypass verified/taught authority, supersession checks, Question Knowledge Closure or Student publication gates. Conceptual status progression is not permission to invent or force backend state transitions.

## First milestone: RC-DOMAIN-M-MISSION-BATCH-R1
**Measurable outcome:** Real bounded SSC mission inventory reconciled; eligible permanent missions registered without duplicates; genuine available English notification/syllabus/PYQ documents ingested with URLs and system hashes; workers demonstrably start verification/extraction; routine progression does not require Founder; exceptions are visible.

**Evidence:** repo/branch/HEAD, changed files, actual mission IDs, dedupe results, source URLs and ingestion hashes, worker run IDs/statuses, extraction evidence, targeted tests, exception evidence, blockers and next action. No fabricated counts, mock data as production proof or undocumented Firestore writes.

**Execution order:** read canonical contracts and current code → bounded gap analysis → smallest end-to-end implementation → targeted tests → independent agent review → Domain-M consolidated report to Master. Deploy/IAM expansion/production mutation/Student activation require separate explicit authorization.

**Reporting format:** STATUS | TASK_ID | HEAD | BATCH | MISSIONS | DOCUMENTS | WORKER_RUNS | TESTS | EXCEPTIONS | BLOCKERS | NEXT_ACTION.
