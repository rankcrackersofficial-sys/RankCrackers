# Syllabus B3 and decomposition worker launch readiness — 2026-10-11

## Decision

Neither the legacy Syllabus B3 worker nor the decomposition (B4) worker is launch-ready. The current governed B3 executor is a strong isolated component, but is intentionally unregistered and has no production job producer. B4 is a legacy Gemini-backed worker with an unsafe, ungoverned materialization path. Keep both out of production activation until the gates below are closed and the deployed Functions entrypoint is verified.

This is a code-and-test assessment. The downstream book is not an authority source.

## What exists

| Capability | Code evidence | Runtime condition |
| --- | --- | --- |
| Syllabus extraction/materialization | `functions/src/workers/syllabusB3Executor.ts`, `functions/src/syllabus/b3StructuralMaterializer.ts`, B3 persistence repository | Executor validates exact source lineage, extraction IDs, completeness scope and sealed persistence. The AAF adapter exists in `functions/src/academicFactory/workers/syllabusB3AafWorker.ts`. |
| Governed B3 job completion | `functions/src/workers/syllabusLifecycleWorker.ts` and `functions/src/test/syllabusB3LifecycleCompletion.test.ts` | Completion proof is validated, but the AAF registry and launch-retirement tests intentionally quarantine `SYLLABUS_B3`. There is no accepted job producer that builds the executor input from verified backend documents. |
| Legacy B3 structure worker | `functions/src/workers/genericB3Worker.ts`, `functions/src/services/genericStructuredSyllabus.ts` | Accepts caller-provided scope and writes `structured_nodes`; it is not the governed B3 persistence/proof path. Do not use it as the production substitute. |
| Decomposition worker | `functions/src/workers/genericB4Worker.ts` | Uses Gemini with topic/subject prompt and writes `atomic_syllabus` rows marked `UNVERIFIED`. No governed B4 AAF adapter or proposal/review contract is wired. This is not an approved operational decomposition pipeline. |
| Firebase entrypoints | `functions/package.json` sets root `index.js`; `firebase.json` runs the TS build; root `functions/index.js` exports `queueWorker` but not the B3/B4/lifecycle/AAF triggers. | `functions/src/index.ts` exports a different set; compilation alone does not change the deployed root entrypoint. Also `queueWorker` currently returns when `JEST_WORKER_ID` is absent, so its normal production path is bypassed. Do not flip this global gate to launch syllabus processing: it also controls unrelated generic queue work. |
| B4 source binding | `functions/src/workers/syllabusLifecycleWorker.ts` supplies both `document_id` and `sourceSha256`; old B4 trigger preferred `source_document_id` as the SHA. | Fixed in this branch by requiring a 64-hex `sourceSha256`/ `source_sha256` independently from the document ID. Regression cases were added in `functions/src/test/b4TaskAuthority.test.ts`. |

## Strict launch design

1. Mission onboarding must persist both required official documents (notification and syllabus) with server-side verification state, SHA-256, immutable version, mission/cycle/authority binding and storage generation. Worker inputs reference those backend IDs and hashes only; workers do not visit external sites or upload documents.
2. A syllabus extraction job is created only from the verified official syllabus document and persisted verified page extractions. It emits a versioned, immutable proposal/revision with source spans and full lineage. It preserves source variable depth; no fabricated missing levels, no downstream book as evidence, and no silent scope inference.
3. Decomposition is a separate job with an explicit dependency on the accepted B3 revision. It may propose derived subtopics, but each proposal carries the parent B3 node, evidence/source lineage, model/prompt version and review status. It cannot alter official wording or the authoritative syllabus tree. Unsupported or ambiguous expansions stay in review/HOLD.
4. Both jobs use the governed AAF lease/claim/retry path, deterministic idempotency, exact mission-cycle-source binding and fail-closed status transitions. Outputs remain proposals until Founder review/approval. No automatic publication.
5. Export only the dedicated governed handlers from the deployed root entrypoint after isolated tests prove their boundaries. Do not export the legacy B3/B4 triggers or enable the entire generic queue as a shortcut.

## Remaining gates before PC launch

- Implement a backend-only source-pair readiness coordinator that rejects a missing, unverified, cross-cycle or mismatched notification/syllabus pair and creates a deterministic, auditable syllabus job.
- Register and dispatch the governed B3 AAF handler only after that coordinator supplies verified, typed executor input. Preserve the existing quarantine test until the complete gated path replaces it.
- Replace legacy B4 output writes with a governed decomposition proposal contract and review transition. Add tests for evidence lineage, no authority mutation, retries, stale B3 revision rejection, and no student-visible publication.
- Add tests for actual production exports from root `functions/index.js`, not only TypeScript module imports. Fix the production bypass at the correct trigger boundary without activating unrelated legacy tasks.
- Run Functions build, focused B3/B4 Jest tests, Firestore emulator integration tests and an end-to-end official-documents-to-review-proposal run on the PC repository checkout. Verify deployed function inventory after approved deployment.

## Verification recorded

- Branch base is the canonical-mission remediation PR branch; this branch remains a draft preparation branch.
- B4 authority parser regression tests added, but cannot be run in this workspace: the repository checkout, TypeScript, Jest and Firebase emulator are unavailable here.
- No GitHub Actions workflow run is associated with the current branch head.
- No deployment was performed. The branch is not launch-ready until every remaining gate above has test evidence.
