# FUP-2C-RX6D Prewrite Authorization

## Purpose

RX6D-PREWRITE is the final no-write authorization gate before any controlled syllabus atom expansion write. It generates a manifest and verifies count, ID, scope, approval, and rollback safety. It does not write Firestore.

## Input Chain

- RX6A: granularity and Crucible readiness audit
- RX6B: split/merge expansion blueprint
- RX6C: collision-free write dry-run
- RB1: subject balance and DigiBook over-expansion rebalance

## Current State

- Mission: `jee_main_2026`
- Current syllabus atoms: 224
- Rejected atoms excluded: 1
- Active worker/pagewise baseline: 104 / 64 / 37 / 3 / 0 / PE 118

## Final Prewrite Manifest Summary

- Manifest: `RX6D_CONTROLLED_EXPANSION_WRITE_MANIFEST`
- Future write target: `mission_realms/jee_main_2026/syllabus_atoms`
- Proposed create count: 206
- Merge recommendations: 2
- Source review holds: 26
- Human review holds: 6
- Rejected excluded: 1
- Write allowed in this phase: false

## Count Gate

- Current atoms: 224
- Proposed new planning atoms: 206
- Projected Math: 90
- Projected Physics: 110
- Projected Chemistry: 110
- Projected total planning: 310
- Projected deep learning: 1710
- Projected 100-day task equivalents: 210
- Verdict: COUNT_GATE_PASS

RB1 reconciles the raw RX6C 317 planning projection by deferring/compressing Physics/Chemistry proposals and turning some deep lessons into notes/traps.

## ID / Canonical Gate

- Existing atom IDs: 224
- Proposed new IDs: 206
- Collisions: 0
- Proposed duplicates: 0
- Rejected ID reuse: 0
- Missing parent: 0
- Cross-subject parent: 0
- Missing source proof: 0
- Duplicate canonical keys: 0
- Verdict: ID_GATE_PASS

## Write Scope Gate

Allowed future write target only:

`mission_realms/jee_main_2026/syllabus_atoms`

Disallowed targets checked:

- student_mission_catalog
- topic_nodes
- crucible_plans
- crucible_days
- digibook_units
- question_bank
- downloads
- official_documents publish flags
- page_extractions
- ai_queue mutation

Verdict: WRITE_SCOPE_PASS

## Approval / Status Gate

Every proposed atom defaults to:

- verificationStatus: NEEDS_REVIEW
- founderApproved: false
- studentTopicNodePublished: false
- topicNodePublished: false
- crucibleReady: false
- digibookReady: false
- requiresFounderReview: true
- requiresProVerification: true

Verdict: APPROVAL_GATE_PASS

## Pro Verification + Founder Review Requirements

RX6D-LIVE, if explicitly authorized later, may only create source-side review atoms. They must still go through Pro verification and Founder review before any student-facing publish.

## Rollback / Evidence Plan

Future RX6D-LIVE must use:

- runId strategy: `RX6D_LIVE_{timestamp}_{shortCommit}`
- createdByPhase: `FUP_2C_RX6D_LIVE`
- expected write count: 206
- before count: 224
- after count: 430

Rollback may delete only atoms matching both:

- `createdByPhase == FUP_2C_RX6D_LIVE`
- `runId == future runId`

Rollback must never delete original 224 atoms, topic_nodes, or student delivery data.

Evidence path:

`docs/patch_safety/FUP_2C_RX6D_LIVE_*`

## Risks

- Future live write must be explicit and confirmed.
- Student publish remains blocked.
- Created atoms are review inventory only, not learning delivery.

## Exact Next Phase Recommendation

AUTHORIZED_FOR_RX6D_LIVE_WRITE

This authorizes preparing an explicit RX6D-LIVE command, not running it automatically.