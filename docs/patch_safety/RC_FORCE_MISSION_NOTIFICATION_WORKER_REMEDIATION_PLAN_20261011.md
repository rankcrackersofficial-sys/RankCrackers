# Mission + Official Notification + Official Syllabus → AI Worker Processing Contract

**State:** refined contract plus first code step (pure pair validator and unit tests); not wired into upload/callable/worker runtime, so the end-to-end mechanism is still incomplete  
**Date:** 2026-10-11  
**Repository:** `rankcrackersofficial-sys/RankCrackers`  
**Branch:** `codex/force-mission-docs-ai-worker-20261011`  
**Base:** open PR #4 head `a9a18a26540a30e0c48836752aa4448fb9048b45` (`codex/canonical-mission-realm-only`)

## Source of truth

Repository code, schemas, tests, Firestore rules, and accepted runtime evidence determine implementation behavior. The Google Drive book is downstream documentation: do not use it as source or as a conflict resolver. Update it only after code and tests are accepted.

The Drive worker-training validation file is historical supporting evidence, not a product contract. Its passing checks were dry-run/static checks; it explicitly reported the Pro-verification and Founder-review queues absent, and confirmed no AI/OCR/Firestore apply for the cited dry runs.

## Non-negotiable responsibility boundary

1. **Codex/orchestrator acquires and uploads both required files:** one official notification and one official syllabus for the exact same permanent exam identity, authority, and cycle.
2. **The backend verifies and binds each uploaded byte stream** to the mission before it is eligible for processing. A URL, search result, text snippet, user-set `isOfficial`, or metadata-only record is not a document upload.
3. **RankCrackers AI Worker is a consumer and processor only.** It reads the already-stored, verified notification and syllabus bytes/page extractions for its assigned mission. It does not browse official sites, search for replacement sources, download from external URLs, upload source files, or use `AUTO_DETECT`.
4. The Worker produces structured, source-proven drafts and queues governed follow-on work. It does not publish, expose a mission to Students, approve sources, invent missing content, or bypass Founder review.
5. “Force-create” means create the internal mission shell and force-attach the two required sources through a protected server path. It does not mean force-publish.

## Existing code facts this implementation must preserve

- PR #4 makes `mission_realms/{missionId}` the only authoritative mission record and retires legacy mission projections. The implementation branch is based on PR #4 so new lifecycle code must keep that boundary.
- `functions/services/mission_cycle_store.js` currently creates `INTERNAL_DRAFT` cycles after source bindings pass preflight. Its source validation is useful but cannot by itself implement “mission shell first, upload pair second.”
- `functions/services/canonical_mission_realm_store.js` already has canonical mission and official-document builders.
- `functions/services/mission_source_preflight.js` enforces registered authority/domain, source identity, English policy, verification, and byte SHA binding. Keep it fail-closed; do not switch off `PRODUCTION_SOURCE_CREATE_READY` or relax proof requirements as a shortcut.
- `lib/features/admin/presentation/widgets/upload_center/widgets/mission_asset_form.dart` currently forwards `recruitmentId: 'AUTO_DETECT'`. `lib/core/services/universal_ingestion_service.dart` stores files in `ingestion_refinery` and enqueues generic PDF parsing. This path is not sufficient for mission-paired source ingestion.
- `functions/workers/mission_enrichment_worker.js` currently preloads source records from `sentinel_drafts` / `ingestion_refinery`; it does not read a verified, mission-scoped official-document pair or create the notification form. Do not assume it satisfies the new contract without an explicit adapter and tests.
- `functions/workers/sentinel_worker.js` is a generic `ai_queue` worker. Its `recruitment_notification` intent does not have a specific prompt branch (the existing branch is `recruitment`), so a generic summary must never count as a notification or syllabus form.
- `functions/notification_schemas/notification_extraction_contract.js`, `schema_selector.js`, `exam_archetype_schemas.js`, and `notification_form_draft_builder.js` provide reusable source-proof and schema foundations. They must be called from the active deployed worker path and their outputs persisted under governed mission paths.
- `functions/src/workers/ingestionTrigger.ts` is not in the package's root JS entrypoint, listens to a different upload collection, has a Jest guard that returns in normal production, and includes hard-coded NEET syllabus atoms. Do not activate it. Remove/quarantine the hard-coded content path and prove the actual `functions/package.json` main/export inventory.

## Lifecycle and data contract

Use the canonical mission and cycle records from PR #4; do not create a second mission authority.

| Entity | Required contract |
|---|---|
| Mission shell | Canonical `mission_realms/{missionId}`; stable permanent exam identity and selected registered authority; internal/hidden preparation state; no Student/catalog visibility; provenance records the Codex request. |
| Cycle | Deterministic cycle key derived from official target year/discriminator. Same mission and cycle cannot be silently merged or duplicated. The cycle stays internal until both documents are verified and Founder-controlled transition occurs. |
| Official source document | Under `mission_realms/{missionId}/official_documents/{sha256}` (or the exact canonical path chosen by PR #4 rules); source type is exactly `notification` or `syllabus`; includes cycle key, authority key, official URL/domain, language, object path, MIME, byte size, SHA-256, acquisition actor/time, and verification result. Byte object is immutable/content-addressed. Trust fields are server-derived. |
| Source pair | For one mission/cycle, require exactly one active verified notification and one active verified syllabus. They must agree on permanent exam identity, authority, cycle, and language policy. Any mismatch blocks the pair; never pair documents by title similarity or `AUTO_DETECT`. Version/replacement creates a new pair version and invalidates stale work. |
| Processing job | Deterministic idempotency key from mission ID + cycle key + notification SHA + syllabus SHA + schema/contract version. Created only when both source records and byte readbacks pass verification. Carries exact document IDs and hashes; no external URLs for the worker to fetch. |
| Worker result | Separate notification-form draft and syllabus-structure draft, both linked to exact source SHA, schema/contract version, page extraction IDs, page numbers, excerpts, and confidence. Status remains `PENDING_FOUNDER_REVIEW`; omissions/conflicts/low confidence are explicit. |
| Follow-on work | Queue only from verified worker outputs. Any mission-variable, syllabus structure, or content pipeline must preserve source lineage and its existing governance gates. Founder approval is required before official mission facts become authoritative or Student-visible. |

Prefer existing canonical state fields where they meet these semantics. If a new state is needed, add it to the canonical transition validator, Firestore rules, indexes, and lifecycle tests in one change. Do not create a parallel lifecycle state in a generic upload record.

## Exact implementation order

### 1. Protected Codex mission bootstrap

**Touch:** `functions/callable/handle_sentinel_action.js`, `functions/services/canonical_mission_realm_store.js`, `functions/services/mission_cycle_store.js`, active `functions/index.js`, canonical mission rules/tests.

- Add an authorized server-side bootstrap operation which accepts permanent exam identity, registered authority, target cycle and stable request/idempotency key; it creates only the canonical hidden mission shell and internal cycle shell.
- Authorize through server-verified Founder/Codex orchestration credentials. Do not trust caller-supplied `actorRole`, `isOfficial`, status, or visibility flags. Reject an unauthenticated or unauthorized actor.
- Repeated identical request returns the same IDs; conflicting identity or cycle fails closed. Record actor, request digest, authority and time.
- Mission identity is permanent/year-independent; cycle identity is year-specific and deterministic.
- No source requirement is relaxed for finalizing/binding the cycle; no legacy projections or student-visible documents are written.

### 2. Two-source acquisition and upload finalization owned by Codex

**Touch:** add a dedicated trusted source-upload callable/service; `MissionAssetForm` only if it is the authorized operator surface; Firestore/Storage rules; source preflight and upload tests.

- Codex supplies two explicit source descriptors and the actual bytes: notification and syllabus. The server binds each to the shell's mission and cycle. The Worker is not involved in acquisition or upload.
- Use a scoped upload handshake for large files: server validates actor, mission, expected source type, registered official domain, and cycle; it returns a one-time mission/type/hash-scoped upload target. Finalize only after server reads back the stored bytes and independently recomputes the SHA-256.
- Validate each source using the existing canonical authority registry and preflight. A caller cannot self-certify a URL, domain, language, hash, or `verified` state. Unsupported, non-English, contradictory, empty, wrong-MIME, or mismatched bytes fail closed under the current source policy; do not translate silently.
- Persist immutable source records under the canonical mission and immutable Storage objects. Duplicate same-hash upload is idempotent. Replacing a file creates a new source version and supersedes the old pair safely.
- Never enqueue generic `pdfParse` work for these mission sources. The pair coordinator owns the one deterministic processing job and schedules it only after both sources verify. A missing one leaves the mission hidden in `WAITING_FOR_SOURCE_PAIR`.
- Ensure the uploader's service credentials cannot turn an upload into publication. Keep source-object writes separate from the Worker consumer's permissions.

### 3. Worker consumes the verified pair only

**Touch:** new focused pair processor or explicit adapter into `functions/workers/mission_enrichment_worker.js`; pagewise extraction implementation; root `functions/index.js`; `functions/package.json`; worker/export tests.

- Trigger from the verified pair/job, not from arbitrary upload or a website scout. Claim the deterministic job with a lease/transaction, retry safely, and mark terminal failures for review rather than looping.
- Load exact source records and stored bytes by mission-bound IDs; verify each byte hash again; process only the pinned pair version. The worker interface must not accept/follow external source URLs.
- Reuse pagewise text/OCR extraction, preserving page numbers and extraction IDs. Do not mark an empty/failed page complete; do not let text from another mission/cycle enter the job.
- Process notification and syllabus through separate strict task types and schemas. Never route either to general summary.
- Produce notification form fields with complete source proof per populated field. Produce syllabus structure as source-derived subject/chapter/topic candidates with page proof per row/atom; no invented additions. Missing/conflicting/low-confidence content stays flagged for review.
- Persist results in canonical mission-scoped review records. Only after the output record is transactionally persisted may the job become completed/awaiting-Founder-review.
- No source upload, external browsing, publication, student projection, exam fact mutation, questions, or book update occurs in worker processing.

### 4. Governed follow-on processing

**Touch:** source-to-cycle enrichment handoff and notification/syllabus review service; narrow review tests.

- Founder reviews both drafts against page excerpts and official source links. Approval is explicit per source pair/version and immutable in the audit trail.
- Only accepted drafts may feed the existing cycle enrichment/materialization pipeline. That pipeline must use these pinned backend sources; it must not initiate source discovery or silently fall back to another upload.
- Rejection or replacement invalidates downstream jobs/results derived from the replaced SHA and schedules a new idempotent run.
- Student/catalog publication remains a separate Founder-controlled lifecycle transition after normal validation.

### 5. Remove ambiguous legacy route and prove deployment wiring

**Touch:** `MissionAssetForm`, `UniversalIngestionService`, `functions/src/workers/ingestionTrigger.ts`, root exports, package-entrypoint tests.

- Remove `AUTO_DETECT` from mission official-source uploads. Make mission ID, cycle key, and source type required in that path.
- Route ordinary unrelated uploads separately; mission official sources must not accidentally enter generic parsing, recruitment candidate creation, or hard-coded exam atom generation.
- Quarantine `ingestionTrigger.ts` until it has the same verified pair contract, correct runtime gate, no hard-coded syllabus data, and an intentional export. Do not make the TypeScript source appear live without a compiled/root entrypoint.
- Build and inspect the configured package entrypoint. Test the actual deployed export names, not a source file's exports.

## Acceptance gate — run once after implementation

1. **Bootstrap:** authorization allow/deny matrix; stable idempotent retry; conflicting permanent identity; duplicate cycle; hidden shell and no legacy/student projections.
2. **Source pair:** valid official notification + syllabus for same authority/identity/cycle succeeds; notification-only never enqueues; mismatched cycle/authority, untrusted domain, caller-forged trust flags, missing byte object, SHA mismatch, duplicate and replacement cases fail/behave deterministically.
3. **Worker isolation:** prove it reads only mission-bound stored bytes and does not fetch source URLs, upload objects, or act on arbitrary generic uploads. Wrong/missing/stale pair version does no processing.
4. **Extraction:** notification and syllabus use distinct structured schemas; every populated form field/structure unit has correct page proof; empty, missing, conflicting, OCR-low-confidence and unsupported schema are review/block states, not fabricated values.
5. **End-to-end Emulator:** authorized Codex bootstrap → both official byte uploads → pair verification → one job → pagewise extraction → two persisted review drafts. Assert no Student/catalog exposure, publication, questions, hard-coded syllabus atoms, external fetch, or source upload by Worker.
6. **Runtime:** Functions build; root `main` export inventory; Firestore and Storage rules tests; canonical mission/cycle/source-preflight tests; retry/concurrency test.
7. **Evidence:** attach actual command output and implementation commit SHA. Static audits or Drive book claims alone are not readiness proof.

## Readiness decision

**Not ready for production until the acceptance gate passes.** A pure pair validator now exists at `functions/services/mission_official_source_pair.js`, with six focused tests at `functions/test/test_mission_official_source_pair.js` and an explicit `npm run test:mission-source-pair` command. It enforces exactly one verified notification and one verified syllabus for the same mission/cycle/authority, checks SHA/content-addressed IDs, requires canonical mission-scoped storage paths and source preflight, and builds a deterministic job payload containing no source URLs. It is not yet called by a deployed callable or worker; existing generic upload/worker paths therefore still do not satisfy this contract. Do not enable autonomy or publish while the pair processor is incomplete.

This implementation branch starts from PR #4's canonical mission head. Keep it isolated from the default safety branch until PR #4 is accepted; do not rebase lifecycle changes onto the old preparation branch and create a competing mission authority.
