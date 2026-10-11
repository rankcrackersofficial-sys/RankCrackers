# Mission Official Sources, Workers and PYQ — Super Audit

**Audit date:** 2026-10-11  
**Scope:** forced mission creation → official notification + syllabus (“CIBS” interpreted as syllabus from context) → extraction/form drafts → verified syllabus/B3/B4 → automatic official PYQ acquisition → PYQ extraction/key mapping → reviewed repository/projections  
**Verdict:** **NOT END-TO-END READY. Fail-closed protections are stronger, but the trusted runtime path is not wired.**

## Evidence basis

This audit uses repository code and accepted source/authority contracts, including PYQ_ACQUISITION_REVIEW_AND_DELIVERY_SOP.md and PYQ_UNIVERSAL_AUTHORITY_AND_DATA_CONTRACT.md at accepted commit cbac668, plus the Drive artifact FUP_2C_UI1_PYQ_DIGIBOOK_PATTERN_LOCK.md. The later book/manuscript is downstream documentation and was not used as implementation evidence.

## Required runtime flow

1. Codex/orchestrator creates a hidden canonical mission shell using a stable request/idempotency key.
2. Codex acquires and uploads exactly one official notification and one official syllabus for the same permanent exam identity, authority and cycle. A backend finalizer verifies the stored bytes and independently computes hashes before recording immutable evidence.
3. Notification and syllabus processors consume only those pinned mission-scoped bytes/extractions. They create separate evidence-backed form/syllabus drafts for review; they do not acquire substitute sources or publish.
4. B1 page extraction, B3 structure and B4 atomic decomposition run from current verified source authority. Stale source versions cannot continue.
5. Only after current B4/DSD completion proof, a dedicated PYQ acquisition worker discovers and downloads available official PYQ papers and official key evidence. Paper and key are distinct source objects. Login-restricted/unavailable records remain explicitly restricted.
6. A PYQ appearance extractor writes immutable, non-published staging records with paper/event/shift/booklet/page identity. Exact latest effective official final/revised-final keys are mapped to exact appearances.
7. Historical and current-syllabus mappings remain separate. Review-gated canonical PYQ records then project by canonical ID into eligible products. PYQ evidence may adjust teaching emphasis but never expands official syllabus or bypasses taught-content gates.

## End-to-end findings

| Stage | Current code evidence | Audit status |
|---|---|---|
| Canonical mission authority | mission_realms is canonical in the accepted migration contract. handle_sentinel_action imports executeUnifiedMissionCreation; that operation requires existing notification and syllabus source IDs and preflights them before creating the cycle. No separate deployed “create hidden mission shell first” + idempotent bootstrap action was found. | **Missing requested order.** Mission shell → upload pair is not an operational callable flow. |
| Notification + syllabus upload | MissionAssetForm called UniversalIngestionService.registerSource with recruitmentId AUTO_DETECT; that writes the generic ingestion_refinery route. It is not a canonical mission/cycle pair upload. | **Unsafe legacy route; now disabled for core source types on this branch.** |
| Official source-pair validator | functions/services/mission_official_source_pair.js checks pair shape, role, mission/cycle/authority, declared SHA consistency, language and preflight, and creates deterministic pair task identity. It has focused unit tests. | **Useful pure contract, not runtime-integrated.** It trusts a backend attestation and supplied digest; a deployed finalizer must read bytes and compute the digest itself. No callable, transaction coordinator or queue adapter calls it. |
| Firestore/Storage authority | Firestore rules deny client writes to official document records and page extractions. Storage previously allowed Founder-client writes beneath mission_realms/{id}/official_documents/**. | **Mismatch fixed on this branch:** direct client Storage writes to official source bytes now fail closed; trusted backend writes remain possible through Admin SDK. |
| Notification extraction/form | CGL schemas, schema selector and notification_form_draft_builder.js exist. The live root entry exports Sentinel and mission enrichment workers, but no wired official-pair processor was found calling the schema selector/builder and persisting a source-proved notification form. Generic mission enrichment preloads sentinel_drafts and ingestion_refinery, not the verified official-document pair. | **Schema assets exist; official notification-to-form worker is missing.** |
| Syllabus page extraction | The TypeScript pagewise worker validates SHA before parsing and writes page extractions. Its production queue policy permits only pagewise_text_extraction_batch, quarantining other legacy queue work. | **B1 component exists, but the verified-pair creation/handoff is missing.** |
| B3/B4 decomposition | genericB3Worker, genericB4Worker and lifecycle code exist under functions/src. Firebase predeploy runs the TypeScript build, but functions/package.json points to root functions/index.js; that deployed entry explicitly exports the compiled page queue worker and selected JS workers, not the generic B3/B4 or syllabus lifecycle triggers. functions/src/index.ts exports do not automatically become root deployed exports. AAF registry also has no syllabus B3/B4 or PYQ jobs. | **Present as source code, not demonstrated as active deployed workers.** Both generic worker triggers also return early when FUNCTIONS_EMULATOR is set and Jest is not, so ordinary emulator runs skip B3/B4 execution. Do not solve this by exporting legacy workers without first fixing that gate and adding authority/current-source emulator regression tests. |
| PYQ acquisition/upload | No dedicated official PYQ source registry + acquisition worker + queue handoff is wired. Existing checked-in registries are dated snapshots: 46d9 has zero byte-verified papers/keys; 46d11 says discovered but zero locally acquired; 47c5 marks SSC PYQ access restricted with zero exact children. | **Missing. “Auto upload” is not implemented.** Historical records do not prove current live source availability. |
| PYQ appearance extraction | Flutter detection formerly returned hardcoded SSC GD 2024 metadata; linkage classes return empty IDs/zero metrics. No backend PYQ appearance extractor is registered. | **Missing; fabricated client result was removed on this branch.** |
| Answer authority + repository | Accepted contract requires separate question-paper and answer-key evidence, exact appearance matching, latest effective final/revised-final precedence, and explicit unresolved/restricted states. QuestionRepository.save() writes directly to published_questions; QuestionModel lacks the full evidence/appearance/key-version/current-scope chain. | **Governed staging/promotion and required provenance schema remain blockers.** |
| Student/product projection | Existing PYQ contract keeps PYQ optional and enforces verified syllabus + taught-content gates for scored learning. No automatic projection should be enabled before review and those gates. | **Keep blocked until upstream record authority is implemented.** |

The source-preflight module exports PRODUCTION_SOURCE_CREATE_READY as false, but the repository contains no runtime branch that reads this flag; it is descriptive, not an enforced creation gate. Actual safety currently depends on callers invoking the preflight and on the missing server finalizer doing physical-byte verification.

## Changes made in this remediation chain

- The PYQ admin screen no longer exposes manual upload or its generic upload queue.
- The client PyqDetectionWorker no longer returns fabricated exam, shift, question-count or confidence metadata.
- The generic MissionAssetForm now blocks notification, syllabus and PYQ assets and explains that AUTO_DETECT cannot establish mission authority. The upload handler has a second guard.
- Notification and syllabus screens no longer show legacy generic queue panels as if they were the authoritative worker state.
- Storage rules deny direct client writes under official mission-document paths, matching the Firestore server-only evidence-write boundary.
- The PYQ-specific and this end-to-end audit are recorded as architecture/audit files, separate from the book.
- The pure source-pair idempotency digest now includes `authorityKey`, and a regression test proves a changed authority creates a distinct task identity.

These changes prevent the wrong path from accepting or appearing to process official mission sources. They do **not** claim that the intended source pair, B3/B4 or PYQ workers are now implemented.

## Launch blockers and implementation order

1. Add a protected, idempotent server mission-shell bootstrap that uses canonical permanent identity and leaves the mission hidden. Define authorized Codex-orchestrator identity; do not trust client actor/source flags.
2. Add scoped source upload/finalization for notification and syllabus. Verify registered official host, mission/cycle/role, file type/size, server-read bytes and computed SHA. Persist immutable object + source record. Reject mismatches and stale replacements.
3. Call the pair validator from a transactionally idempotent pair coordinator. Enqueue only after both source objects are read back and validated. Worker receives document IDs/hashes/storage paths, never arbitrary external URLs.
4. Connect official page extraction to the notification schema/form-draft builder and verified syllabus corpus. Persist field/atom page proof and route uncertainty/missing required fields to review.
5. Wire the correct governed B3/B4 producers, current-source authority transitions and lifecycle triggers into actual functions/index.js deployment exports. Keep old generic queue quarantined; use explicit task contracts and claim/lease/idempotency behavior.
6. After current B4/DSD proof only, register a separate PYQ discovery/acquisition worker. Restrict hosts by authority registry; do not bypass login/CAPTCHA. Store paper and key independently, with byte hash and acquisition evidence.
7. Implement question-appearance extraction → exact-key mapping → historical/current scope mapping → review staging → server-only promotion → downstream projections. Keep unreleased-key answers unresolved and PYQ absence non-blocking.
8. Run one integrated Emulator gate: bootstrap → pair upload/finalize → page extraction → notification/syllabus draft → B3/B4 current proof → official PYQ acquisition status → appearance/key staging. Assert idempotency, stale-version rejection, no generic uploads, no student visibility, no invented facts, and no publication before review.

## Verification state

GitHub readback confirmed the edited files and rules on the remediation branch. The focused source-pair test file was executed directly against the branch readback (6/6 passed), including the authority-key regression. GitHub reports no workflow runs for the updated head; full Flutter build, Functions build, Firestore/Storage emulator rules, and end-to-end worker tests have not been executed in this session. **No merge or deployment was performed.**

## Decision

**Not ready to launch the force-mission → source-pair → worker → PYQ flow.** The branch now fails closed at generic client upload boundaries, but the secure bootstrap/finalizer, notification/syllabus processing integration, active B3/B4 lifecycle wiring, and dedicated PYQ acquisition/extraction/review implementation remain necessary before any production activation.
