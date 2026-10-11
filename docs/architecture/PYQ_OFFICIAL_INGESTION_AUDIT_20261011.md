# PYQ official acquisition and processing audit

**Audit date:** 2026-10-11  
**Repository snapshot:** `codex/force-mission-docs-ai-worker-20261011` at `7e9f20a88b3232c234514df7ec8b53dea83ad309`  
**Remediation branch:** `codex/pyq-official-ingestion-20261011`  
**Verdict:** **NOT READY FOR PRODUCTION LAUNCH**

This audit uses the accepted PYQ authority contracts recorded in commit `cbac668` and the Drive artifact `FUP_2C_UI1_PYQ_DIGIBOOK_PATTERN_LOCK.md`. The later book/manuscript is not treated as source evidence.

## Agreed processing boundary

Mission creation and official notification/syllabus acquisition precede syllabus verification and atomic decomposition. PYQ discovery/acquisition starts only after the mission has a current, verified syllabus/DSD authority. The PYQ pipeline must then:

1. discover a paper from the competent authority's official archive;
2. acquire bytes, verify the official host/provenance, hash and retain immutable evidence;
3. preserve exact exam cycle, event, stage, paper/component, language, shift/session, booklet/set and question appearance identity where the authority provides those fields;
4. extract question appearances into a non-published staging area;
5. acquire the latest effective final/revised-final answer key independently and map answers to the exact appearance;
6. map PYQs to historical atoms and separately mark current-scope status without allowing PYQs to enlarge official syllabus;
7. review and promote eligible records into the central PYQ bank; then project by canonical question ID to DigiBook, Crucible or Test Arena under taught-content gates.

No official final key means the paper can remain official evidence, but its answer is not established. Candidate-login-restricted material remains restricted unless acquired through an authorized official route. Commercial compilations can support discovery/reconstruction only; they cannot be promoted as official evidence.

## Findings from the repository

| Severity | Finding | Evidence |
|---|---|---|
| Blocker | No dedicated backend PYQ acquisition/extraction worker or PYQ task is wired. | `functions/src/index.ts` exports no PYQ worker; `functions/src/academicFactory/core/aafJobRegistry.ts` has only 13 source/DigiBook/Crucible jobs; `functions/src/workers/storageTrigger.ts` contains only a PYQ placeholder comment. |
| Blocker | There is no safe post-syllabus handoff to PYQ. | The syllabus lifecycle queues B4 from B3 completion but has no verified B4→PYQ stage. Generic production queue policy allows only `pagewise_text_extraction_batch`; other legacy task types are quarantined. Adding a generic `pyq` queue item alone would not create a functioning worker. |
| Blocker | Admin UI allowed manual PYQ upload. | `lib/features/admin/presentation/widgets/upload_center/pyq_upload_center.dart` mounted `MissionAssetForm(assetType: 'pyq')` and `UploadQueuePanel(assetType: 'pyq')`. |
| Critical | The client “PYQ worker” returned fabricated SSC GD metadata independent of its input. | `lib/core/ai/workers/pyq_detection_worker.dart` returned fixed year, shift, count, difficulty and confidence values. |
| Critical | Linkage components are stubs, not extraction or syllabus mapping. | `lib/core/ai/workers/pyq_linkage_engine.dart` and `lib/core/engines/pyq_linkage_engine.dart` always return empty IDs and zero metrics. |
| Critical | Question persistence does not model the official evidence chain. | `QuestionRepository.save()` writes directly to `published_questions`; `QuestionModel` lacks source URI/hash/page locator, official appearance identity, answer-key version/supersession, authority option IDs and explicit current-vs-historical scope. |
| Critical | Existing publication rules do not provide the required staging/review contract. | `firestore.rules` lets a Founder create/update `published_questions` with a limited field allowlist; separate `pyq_evidence` and `answer_keys` are Founder-writable. No worker-only PYQ promotion transaction is wired. |
| Evidence limit | Checked-in acquisition registries are historical snapshots, not live source proof. | `46d9` (2026-09-09) records zero byte-verified papers/keys; `46d11` records discovery but zero local acquisition; `47c5` records SSC missions including CGL as `OFFICIAL_PYQ_ACCESS_RESTRICTED`, exact child count 0. These records must not be represented as current portal status. |

## Changes applied on this branch

- Removed the manual uploader and upload queue from the PYQ admin center. It now says automated official ingestion is not yet enabled and states the evidence gates required before publication.
- Replaced the client worker's hardcoded SSC GD “analysis” with explicit `not_processed` / `rejected` statuses and no academic metadata.

These changes stop false PYQ claims and accidental manual course upload; they do **not** implement server-side acquisition.

## Required implementation before launch

1. Define a mission-bound PYQ authority/source registry with official host allowlists, source-kind separation (paper vs answer key), access state and change/version tracking. Never use a general arbitrary-URL fetch.
2. Add a dedicated server queue contract and worker registration that is triggered idempotently only from the authoritative, current B4/DSD completion proof—not merely a mission-created event or a legacy `status=completed` value.
3. Implement official discovery/acquisition, byte/hash/provenance verification and explicit `ACCESS_RESTRICTED` / `NOT_FOUND` / `ACQUIRED` states. Do not bypass login, CAPTCHA or portal access controls.
4. Extract question appearances into immutable staging, retain physical page/source locators, and validate exact event/paper/shift/set identity. Extraction uncertainty must go to review.
5. Acquire and version final/revised-final keys separately; bind each answer to the exact appearance and option order. Provisional or third-party answers cannot be official.
6. Map to historical atoms and current syllabus separately; require explicit scope status. PYQ frequency may change emphasis only, never syllabus membership.
7. Write to a central PYQ evidence/bank through server-owned transactions; publish only after source, identity, extraction, answer, dedupe, mapping and review gates. Keep PYQ and internally authored questions in separate classes.
8. Add meaningful emulator/integration tests for idempotent acquisition, stale syllabus authority, source-domain rejection, duplicate source hashes, login-restricted portals, OCR uncertainty, exact shift/booklet/key matching, revised-key invalidation, dropped questions, historical-only scope, review holds and zero-PYQ non-blocking launch.

## Launch decision

**Do not mark PYQ ready and do not deploy this branch as the complete worker solution.** The safe UI/client corrections are prepared, but the core automatic acquisition and extraction worker, evidence staging, governed publication and end-to-end tests are still absent. The current architecture intentionally keeps PYQ optional: a mission with no legally/officially obtainable PYQs must continue its syllabus-led DigiBook/teaching/question path without invented or third-party “official” questions.
