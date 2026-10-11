> **SUPERSEDED 2026-10-11:** This earlier notification-only preparation plan is obsolete. The current contract requires Codex to upload both official notification and official syllabus before the AI Worker processes either. Use the canonical-base implementation branch and its refined contract: https://github.com/rankcrackersofficial-sys/RankCrackers/blob/codex/force-mission-docs-ai-worker-20261011/docs/patch_safety/RC_FORCE_MISSION_NOTIFICATION_WORKER_REMEDIATION_PLAN_20261011.md

# Force-Created Mission → Official Notification → AI Worker Form: Remediation Plan

**Status:** implementation preparation only; no runtime code changed  
**Prepared:** 2026-10-11  
**Repository:** `rankcrackersofficial-sys/RankCrackers`  
**Preparation branch:** `codex/rc-audit-remediation-prep-20261011`  
**Base:** `5161592ddafb42f1ecc8923cc7b7b0309934cc83`

## Authority and scope

- Treat repository implementation, tests, schemas, and accepted runtime records as the implementation authority.
- The Google Drive book is a downstream document. Do not use it to justify behavior or resolve code conflicts. Update it only after the implementation is accepted.
- The Drive `RC_WORKER_TRAINING_5_validation.txt` is historical test evidence, not a specification: it reports dry-run-only processing and that `pro_verification_queue`, `verification_runs`, and `founder_review_queue` did not exist in that snapshot.
- This plan covers a single governed vertical slice: an authorized Codex force-creates an internal mission shell, attaches the official notification bytes to that mission, and the RankCrackers AI worker produces a source-proven notification-form draft for Founder review.
- “Force-create” does not mean public release. No student catalog, student-visible mission state, publication, question generation, or syllabus/topic materialization may happen in this slice.
- No broad re-audit is required before implementation. Resolve the single dependency in Step 0, implement Steps 1–5 in order, and run the acceptance gates once.

## Current code evidence and blockers

| Area | Current code path | Observed gap |
|---|---|---|
| Mission creation | `lib/features/admin/presentation/widgets/mission_control/mission_creation_center.dart`; `functions/services/mission_cycle_store.js`; `functions/handle_sentinel_action.js` | Creation requires an already matched notification and syllabus/source preflight. It cannot create the internal shell first and attach the official notification afterwards. |
| Upload binding | Founder `MissionAssetForm`; `UniversalIngestionService.registerSource()` | Notification upload is sent with `recruitmentId: 'AUTO_DETECT'`; bytes are put in `ingestion_refinery/{hash}`, not a mission-scoped official-document record. |
| Notification-specific AI extraction | `functions/helpers/prompts.js`; active `functions/workers/sentinel_worker.js` | Upload intent `recruitment_notification` has no matching prompt case (the case is `recruitment`), so it can fall through to the generic summary. The worker writes a broad `sentinel_drafts` record, not the governed notification form. |
| Form drafting | `functions/notification_schemas/notification_extraction_contract.js`; `functions/services/notification_form_draft_builder.js` | A strict source-proof contract and a pure draft builder exist, but the active worker path does not connect page extractions → schema → builder → persisted review draft. |
| Source safety | `functions/services/mission_source_preflight.js` | Official-domain, language, SHA and authority checks already exist. `PRODUCTION_SOURCE_CREATE_READY = false`; keep the safeguards and complete the official-byte path instead of bypassing them. |
| Page extraction | `functions/src/workers/queueWorker.ts`; active JS worker exports in `functions/index.js` | Page-wise extraction exists, but it does not produce the notification-form draft. The compiled/exported runtime path must be established and tested, not inferred from a TypeScript source file. |
| Unwired TypeScript trigger | `functions/src/workers/ingestionTrigger.ts`; `functions/src/index.ts`; `functions/index.js`; `functions/package.json` | The trigger listens to `founder_uploads`, while the active uploader writes elsewhere; its Jest-only early return is inverted for production, and its current hard-coded NEET syllabus atom path is unsafe for general uploads. It is not currently in the active JS export manifest. Do not activate it as-is. |
| Canonical mission authority | PR #4, `Canonicalize mission authority on mission_realms` | PR #4 is open and changes overlapping creation/lifecycle files. Remediation branch is based on the same pre-PR4 commit. A single canonical write contract must be chosen before touching these files. |

## Implementation sequence

### Step 0 — establish one canonical mission write boundary

**Files:** PR #4 changes to `functions/services/mission_cycle_store.js`, `functions/handle_sentinel_action.js`, `functions/index.js`, Firestore rules/indexes, and relevant Flutter reads.

1. Resolve PR #4 before editing these overlapping files: integrate its accepted canonical contract into this branch or explicitly carry the remediation on top of the finalized canonical branch. Do not implement two competing lifecycle authorities.
2. Mission identity and every lifecycle mutation must go through the canonical `mission_realms/{missionId}` service. Do not write legacy mission projections as authorities.
3. Use an existing non-public canonical draft state if one meets the requirements. If not, introduce a dedicated internal preparation state and update the canonical transition validator, rules, and indexes consistently.
4. Confirm the new state is unreadable by Student/catalog surfaces and cannot be published without Founder approval.

**Gate:** one canonical mission write path; no direct client write; hidden/internal state is demonstrably excluded from Student reads.

### Step 1 — authorized, idempotent mission bootstrap

**Files:** `functions/handle_sentinel_action.js`; `functions/services/mission_cycle_store.js`; active `functions/index.js`; focused tests adjacent to those services.

1. Add a server-side operation for the Codex force-create action that creates the canonical internal mission shell before notification upload.
2. Require authenticated, server-verifiable Codex/Founder authority; never trust a client-supplied `actorRole`, `official=true`, or mission status. Reject unauthenticated or unauthorized calls.
3. Require stable permanent exam identity plus cycle/session identity and validate identity collisions through the canonical registry. Do not use `AUTO_DETECT`.
4. Make retries idempotent using a stable request key. Same request returns the same mission ID; conflicting identity or payload fails closed.
5. Store provenance for requester, request key, timestamp, selected authority, exam identity, and initial internal state. No student/catalog/material side effects.

**Gate:** auth matrix, duplicate retry, identity collision and no-student-visibility tests pass.

### Step 2 — attach actual official notification bytes to that mission

**Files:** Founder `MissionAssetForm` and its upload service; `UniversalIngestionService.registerSource()`; `mission_source_preflight.js`; notification upload tests.

1. The Codex acquisition/upload request must identify the exact `missionId`, authority, official source URL, document type, and cycle. Remove `AUTO_DETECT` from this path.
2. Verify the official authority/domain and document language/type using existing preflight rules. Fetch/store the actual bytes; compute SHA-256 from those bytes. A URL or portal-text result alone is not an uploaded official notification.
3. Store immutable metadata and bytes under the canonical mission, using a content-addressed record such as `mission_realms/{missionId}/official_documents/{sha256}` plus the corresponding Storage object. Preserve source URL, authority, original filename, MIME type, byte size, hash, acquisition time, and actor.
4. Enqueue AI processing only after storage readback confirms the bytes and SHA match. Duplicate upload of the same hash is an idempotent no-op; a source/hash/mission mismatch fails closed.
5. Keep mission in the internal preparation state. Upload completion must never publish or expose the mission.

**Gate:** valid official bytes attach to exactly one mission; unofficial domain, absent bytes, wrong hash, wrong mission, non-English/unsupported source and duplicate retry are tested.

### Step 3 — route notification uploads into strict page-wise processing

**Files:** active `functions/index.js`; `functions/workers/sentinel_worker.js`; existing page-wise extraction code under `functions/src/workers/queueWorker.ts` only if brought into the real package entrypoint; `functions/package.json`; queue/schema tests.

1. Use one deployable entrypoint. Verify `functions/package.json` `main`, compiled output, and exported Firebase functions together. Do not assume `functions/src/index.ts` is deployed when package main exports root `index.js`.
2. Enqueue one deterministic job keyed by mission ID + official document SHA + schema version. Retry/duplicate events must not create duplicate page extraction or drafts.
3. Verify stored-byte SHA before parsing. Use page-wise extraction with stable page numbers and persist the extraction ID and page text/proof.
4. Keep notification processing separate from syllabus/PYQ/materialization pipelines. No hard-coded NEET atoms or exam-specific content may run for arbitrary uploads.
5. Quarantine or remove the unsafe `ingestionTrigger.ts` behavior. If it is retained, replace the Jest guard with an explicit safe runtime gate, remove all hard-coded academic atoms, and prove it consumes the same mission-bound queue contract before exporting it.

**Gate:** deployment export inventory includes only the intended trigger; actual package entrypoint tests run; no arbitrary upload can create syllabus/topic/question records.

### Step 4 — extract and persist the governed notification-form draft

**Files:** `functions/helpers/prompts.js`; `functions/notification_schemas/*`; `functions/services/notification_form_draft_builder.js`; active `functions/workers/sentinel_worker.js`; focused worker/schema tests.

1. Add a notification-specific structured extraction prompt/schema for `recruitment_notification`; do not allow this intent to fall through to general summary output.
2. Select the schema by verified exam/authority/cycle and notification type. Reject unsupported schema/authority combinations instead of guessing.
3. Give the AI worker only the verified page-wise extractions tied to the mission's document SHA. Extract fields supported by the registered schema; every populated field must carry `source_document_id`, page number, verbatim excerpt, confidence, and page extraction ID per the existing contract.
4. Use the existing draft builder/validator or tighten them as needed. Persist a deterministic mission-scoped notification draft with schema version, document SHA, extraction run ID, field-level proof, confidence, and audit timestamps.
5. Missing, ambiguous, conflicting, low-confidence or unproved fields stay blank/flagged and the draft remains `PENDING_FOUNDER_REVIEW`. The worker may not mark the notification verified, change official mission variables, publish, or create academic content.
6. Do not treat `sentinel_drafts` raw summary/fullText as the notification form. The form draft must be a distinct schema-validated object linked to the official document and mission.

**Gate:** the active worker turns a known page-proof fixture into an exact schema-valid draft; removing any required page proof blocks that field; generic prompt fallback is impossible; review state remains pending.

### Step 5 — review path and narrowly scoped acceptance

**Files:** notification review service/UI only if needed; Firestore rules; backend integration tests.

1. Provide a Founder-only review action for the generated draft that shows source link, SHA, page excerpt, confidence, missing fields and conflicts. Approval is explicit and auditable.
2. Only Founder approval may finalize the notification binding and allow the mission state to advance. Approval cannot rewrite source bytes or erase provenance.
3. Do not change Student UI or student behavior for this work.
4. Add one emulator-backed end-to-end test: authorized bootstrap → official-byte upload → deterministic page extraction → AI notification form draft → Founder review pending.
5. Negative assertions: no mission student/catalog projection, no publication, no questions/syllabus atoms, no writes from an unauthorized actor, no acceptance when official-source or page proof fails.

## Required acceptance commands and evidence

Run only after Steps 0–5 are implemented:

- Unit tests for bootstrap authorization, stable ID/idempotency, identity collision, source preflight, hash mismatch, schema selection, field proof, confidence/missing-field handling, and retry behavior.
- Firebase Emulator integration test for the entire upload-to-draft vertical slice.
- Functions package build plus an export-inventory test against the actual configured `main`.
- Existing mission-cycle/source-preflight/schema tests, including the canonical mission tests from PR #4 if Step 0 integrates them.
- Assert all disallowed side effects are absent: Student/catalog visibility, publication, syllabus/topic/question creation.
- Record real test output and commit SHA in the eventual implementation acceptance note. Do not claim readiness from dry-run, static guard, or book text alone.

## Completion definition

The requested mechanism is ready only when an authorized Codex action can create a hidden canonical mission before notification upload; verified official notification bytes and SHA are immutably bound to that exact mission; the deployed AI worker consumes those bytes through page-wise extraction and writes the schema-validated, field-source-proven notification form draft; all missing/low-confidence fields remain for Founder review; and the emulator-backed positive and negative gates pass.

Until those conditions pass, status is **not ready for production use**. Do not enable autonomous processing or publish missions. Update the Google Drive book only after accepted implementation and test evidence exist.
