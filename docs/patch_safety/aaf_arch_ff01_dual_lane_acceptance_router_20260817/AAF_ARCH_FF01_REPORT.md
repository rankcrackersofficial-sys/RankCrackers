# AAF-ARCH-FF01 Dual-Lane Acceptance And Fix Router

Verdict: AAF_ARCH_FF01_DUAL_LANE_ACCEPTANCE_AND_FIX_ROUTER_READY

This is a ChatGPT control-tower artifact only. It does not modify backend, Functions, worker, provider, queue, publication, or academic content code.

## Ownership Boundary

ChatGPT owns architect review, commit/authority reconciliation, audit/evidence docs, cumulative status, and exact next commands.

Android Studio owns AAF-004D, workers, queue, Functions integration, and Git ancestry authority.

Anti-Gravity owns AAF-006B real verifier backend, provider transport, policy bridge, and verifier execution implementation.

## 004D Acceptance Matrix

PASS requires:

- Current HEAD contains accepted AAF-004D implementation ancestry or explicit supersession evidence.
- Non-ancestral FIX2 semantic changes are preserved or explicitly superseded.
- 13/13 canonical worker bindings are present.
- 0 non-canonical worker type registrations.
- 0 duplicate handler ownership collisions.
- Real compile passes.
- Targeted registry/semantic tests pass.
- No history rewrite/reset/cherry-pick unless separately authorized.
- External dirty work is preserved.

PASS verdict:
AAF_004D_FINAL_GIT_ANCESTRY_AND_SEMANTIC_SUPERSESSION_ACCEPTED

Failure router:

- Missing FIX2 semantic change -> AAF-004D-PREQ12-FIX3-SURGICAL-SEMANTIC-SUPERSESSION-REPAIR
- Ancestry unclear -> AAF-004D-PREQ12-FIX3-COMMIT-ANCESTRY-EVIDENCE-REPAIR
- Worker parity regression -> AAF-004D-FIX5-CANONICAL-WORKER-PARITY-REPAIR
- Compile failure -> AAF-004D-FIX5-REAL-COMPILE-LOCK-REPAIR
- Unauthorized staged scope -> AAF-004D-PREQ12-BLOCKED-BY-UNAUTHORIZED-STAGED-SCOPE

## 006B Acceptance Matrix

PASS requires:

- 006B consumes locked 006A policy and does not reinterpret it.
- Source hash, evidence hash, claim hash, source pack hash, input manifest hash, and approved evidence set hash are bound.
- Source locators are bound.
- Model memory is not evidence.
- Source conflict overrides provider pass.
- Provider finding remains separate from governed decision.
- Provider disagreement cannot auto-pass.
- Stale temporal and stale pre-repair results fail closed.
- 006L request-envelope schema compatibility is 112/112.
- No shared executeProvider silent geminiFlash substitution.
- Provider/model identity is locked.
- No ai_tasks lifecycle authority.
- No sentinel_drafts writes.
- Verifier direct AAF state writes = 0.
- Tests use fake provider only.
- Live model calls = 0.
- Real benchmark submitted = 0/112.
- Real Wave-1 submitted = 0/552.
- Publication = false.

PASS verdict:
AAF_006B_R2_REAL_INDEPENDENT_VERIFIER_BACKEND_ACCEPTED_FOR_112_CASE_QUALIFICATION

Failure router:

- Policy parity mismatch -> AAF-006B-R2-FIX1-006A-POLICY-PARITY-REPAIR
- Silent provider substitution -> AAF-006B-R2-FIX1-SILENT-PROVIDER-SUBSTITUTION-QUARANTINE
- Source boundary gap -> AAF-006B-R2-FIX1-SOURCE-BOUNDARY-AND-HASH-BINDING-REPAIR
- Legacy lifecycle ownership violation -> AAF-006B-R2-FIX1-LEGACY-LIFECYCLE-OWNERSHIP-QUARANTINE
- Live calls detected -> AAF-006B-R2-ABORTED-BY-LIVE-PROVIDER-EXECUTION
- Premature benchmark submission -> AAF-006B-R2-ABORTED-BY-PREMATURE-BENCHMARK-SUBMISSION
- Publication leak -> AAF-006B-R2-ABORTED-BY-PUBLICATION-ELIGIBILITY-LEAK
- Compile failure -> AAF-006B-R2-FIX1-REAL-COMPILE-LOCK-REPAIR

## 006M Real Qualification Contract

Unlock requires:

- AAF-004D final authority reconciliation accepted.
- AAF-006B R2 accepted.
- AAF-006A policy locked.
- AAF-006K/006L launch/control-plane locked.
- AAF-006F evaluator locked.
- AAF-006G ceremony locked.
- AAF-006J ledger locked.

Real qualification must run exactly 112 benchmark cases, enforce 63 zero-tolerance cases, prevent oracle leakage, keep real Wave-1 at 0/552 until qualification, and keep publication false.

## Cumulative Progress Template

- AAF-001-003: LOCKED
- AAF-004A/B/C: LOCKED
- AAF-004D: PENDING_FINAL_AUTHORITY_RECONCILIATION
- AAF-005: ACCEPTED
- AAF-006A: LOCKED
- AAF-006C-006L: LOCKED
- AAF-006B: PENDING_R2_ACCEPTANCE
- Real benchmark: 0/112
- Real Wave-1: 0/552
- Publication: FALSE

## Safety

- CHATGPT_BACKEND_SOURCE_FILES_MODIFIED: 0
- CHATGPT_FUNCTIONS_FILES_MODIFIED: 0
- CHATGPT_WORKER_FILES_MODIFIED: 0
- CHATGPT_PROVIDER_CODE_MODIFIED: 0
- REAL_PROVIDER_EXECUTION: NO
- REAL_BENCHMARK_CASES_SUBMITTED: 0
- REAL_WAVE1_CLAIMS_SUBMITTED: 0
- PUBLICATION: NO

Final line:
AAF_ARCHITECT_CONTROL_TOWER_IS_READY_TO_ACCEPT_OR_SURGICALLY_FIX_004D_AND_006B_WITHOUT_ANOTHER_DISCOVERY_CYCLE
