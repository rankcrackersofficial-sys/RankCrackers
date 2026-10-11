# Mission-neutral execution policy — Founder decision (11 October 2026)

Status: **ACTIVE ARCHITECTURE REQUIREMENT; PR #12 DRAFT; NO PRODUCTION RELEASE**

## Non-negotiable rule
All exam missions (existing or future) use the same governed, capability-based ingestion, extraction, syllabus, DigiBook, assessment and publication pipelines. A mission's name, board, subject or ID cannot select a special worker, default topic set, privileged queue, hidden workflow, exam-specific OCR correction or higher scheduling weight.

- Mission identity, authority, cycle, source type, subject/paper definitions, exam pattern and official documents are **verified data**, not hard-coded processing branches.
- The worker/engine registry may distinguish *capabilities* (e.g. PDF extraction, OCR, B3 hierarchy, B4 decomposition, DigiBook, Crucible) but not NEET/JEE/SSC/RPSC identities.
- A missing subject/paper/authority declaration is a **hold**, not permission to substitute JEE/NEET defaults.
- Verified bytes, source-page identity, provenance, review and Student-publication permissions remain mission-scoped and fail closed.
- Official source extracts cannot manufacture syllabus atoms, reviewed questions or published academic assets.
- Exam-named tests, archived documents, historical mission IDs and source-specific official DATA may remain, but never create executable priority or identity inference.

## Retired execution paths in PR #12
1. `functions/src/workers/ingestionTrigger.ts`: legacy NEET Cell Biology conveyor replaced with a non-trigger archival tombstone; its Firebase export removed from `functions/src/index.ts`.
2. `functions/src/workers/genericB3Worker.ts`: JEE default subject list, hard-coded paper matching, unreviewed generic subject aliases and exam-specific line skipping removed. Subjects are taken solely from authorized mission scope.
3. `functions/services/routing_classifier.js`: authority/exam branded header stripping removed; page routing uses document-structural text evidence only.
4. `functions/services/scientific_corrector.js`: no automatic page-bound scientific substitutions or free-form Gemini rewrite; compatibility boundary returns original OCR unchanged pending review.
5. `functions/materialize_neet_full*.js`, `functions/materialize_neet_syllabus*.js`, `tools/academic_factory/generate_neet_slice.js`, `quarantine_neet_slice.js`, `seed_jee_state.js`: fail-closed execution guards before Firebase initialization or any writes; historical source remains in Git.
6. `functions/services/real_source_adapter.js`: hard-coded CS4/CS5 exam-pilot adaptation not authorized as live processing. Available only as explicitly scoped read-only archival fixture in test environment.
7. `functions/services/mission_force_pipeline_runner.js`: removes SSC CGL default constant; accepts explicit, validated mission/authority/cycle fields only.

## Compatibility boundary
Existing year-suffixed mission IDs and historical official source records may be preserved to avoid identity corruption. Preservation is **not** a separate worker or exam-specific schedule. Do not delete or rename production records as part of this policy.

## Acceptance gate
- Functions TypeScript build and all Domain-M regressions pass at exact PR head.
- Mission-agnostic negative tests prove retired scripts cannot execute, generic B3 does not invent subjects, routing/OCR has no exam-specific corrections, and archived pilot adapters cannot run in live contexts.
- Real local-only Firebase Golden Slice at exact head remains a separate REQUIRED gate.
- Read-only deployed Functions inventory is needed to establish whether an older legacy trigger still exists in Firebase production; local source retirement is not proof of remote undeployment.
- No production writes, merges, deployments or Student Android/UI changes from this policy audit.

## Outstanding follow-ups
- Independent inventory of all deployed Functions, scheduled handlers and manual operator scripts.
- Audit older mission-derived career rulebook and compatibility migration utilities before any broader production release.
- Full Founder-Web compilation remains a separate existing release blocker.
