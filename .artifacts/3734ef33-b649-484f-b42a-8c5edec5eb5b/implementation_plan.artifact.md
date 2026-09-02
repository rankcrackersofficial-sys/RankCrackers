# RC Syllabus NEET-2027 End-to-End Completion Plan

This plan outlines the steps to complete the syllabus extraction, reconciliation, materialization, and publication for the NEET-2027 mission, following the `RC_SYLLABUS_NEET_2027_END_TO_END_COMPLETION_01` command.

## User Review Required

> [!IMPORTANT]
> The current status of the 124 pages is `pending_founder_verification`. This plan will transition them to `CONTENT_EXTRACTED_VERIFIED` or `NON_CONTENT_PAGE_VERIFIED` after the reconciliation script confirms their integrity and alignment with the accepted P09 logic.

## Open Questions

- None at this stage. All prior problems (P01-P10) are resolved/passed.

## Proposed Changes

### Phase 7 — 124-Page Reconciliation

#### [NEW] [reconcile_124_pages.js](file:///C:/RankCrackers/RankCrackers-55/functions/reconcile_124_pages.js)
Create a script to:
- Read all 124 `page_extractions` for the NEET-2027 document.
- Assign a disposition to each page: `CONTENT_EXTRACTED_VERIFIED` (for academic content), `NON_CONTENT_PAGE_VERIFIED` (for cover, TOC, headers), `AMBIGUOUS_HELD` (if any), or `FAILED_WITH_EXPLICIT_REASON`.
- Verify that every page has a `source_sha256` matching the authoritative hash.
- Report physical account totals (124/124).

### Phase 8 — Structured Syllabus Materialization

#### [MODIFY] [materialize_neet_full_v3.js](file:///C:/RankCrackers/RankCrackers-55/functions/materialize_neet_full_v3.js)
Update the script to:
- Use only verified extractions from Phase 7.
- Materialize the hierarchy: `SUBJECT -> UNIT -> TOPIC -> ATOMIC TOPIC`.
- Ensure every atomic topic has correct provenance (mission_id, document_id, source_sha256, page_number).
- Write to `mission_realms/neet_(ug)-2027/syllabus`.

### Phase 9 — Atomic Topic Reconciliation

- Capture final counts of discovered, canonical, and verified atomic topics.
- Ensure zero duplicates, orphans, or synthetic topics.

### Phase 10 — Independent Academic Quality Gate

- Perform full-set checks and sampling to verify grounding and scientific notation.
- Verify topic boundaries against physical source pages.

### Phase 11 — Governed Publication

- Publish the verified syllabus to the governed student-facing path (e.g., `student_catalog/neet_(ug)-2027`).

### Phase 12 — Student Delivery Proof

- Verify the data path from source to student UI.
- Report `STUDENT_VISIBLE_SOURCE_BACKED_TOPICS` and ensure `STUDENT_VISIBLE_SYNTHETIC_TOPICS = 0`.

## Verification Plan

### Automated Tests
- Run `reconcile_124_pages.js` to verify physical page account.
- Run `structural_validation_suite.js` (if exists) or equivalent to verify the syllabus hierarchy.

### Manual Verification
- Sampling of 5 random atomic topics across subjects to verify source grounding (page numbers and scientific fidelity).
