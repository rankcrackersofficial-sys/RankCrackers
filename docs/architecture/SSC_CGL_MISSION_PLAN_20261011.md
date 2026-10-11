# SSC Mission Plan and CGL Non-Production Pilot

**Date:** 2026-10-11
**Status:** bounded planning and local pilot only; no production mission/source write

## Evidence rule

The Anti Gravity/report rows are candidate input only. Current-cycle labels, totals, and readiness claims are not accepted without an exact authority-hosted notice or source artifact. The downstream book/manuscript is not implementation authority.

The bounded candidate set used here is the repository's SSC inventory (`docs/academic_review/46d7_ssc_mission_inventory.json`) reconciled against `functions/canonical_mission_registry.js`. The runtime manifest contains 18 Founder-visible identity records: 15 legitimate exam missions and 3 quarantined test/E2E records. No record was created, renamed, copied, or deleted.

## Deduplicated plan

| Candidate family | Classification | Canonical ID | Authority / jurisdiction | Official notification URL | Official syllabus URL | Publication/current-cycle evidence | English-availability clause | Evidence status |
|---|---|---|---|---|---|---|---|---|
| SSC CGL | EXISTING MISSION | `ssc_cgl` | SSC (`ssc` mission manifest; `auth_in_ssc` source-flow key), CENTRAL | `https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf` | `https://ssc.gov.in/api/attachment/uploads/masterData/Syllabus/CGL-syllabus-169635-.pdf` (official CGL 2024 syllabus artifact) | Notification was uploaded for 21-May-2026; syllabus is titled CGL 2024 and its exact publication date/current-2026 applicability is unresolved | 2026 notice: English/Hindi questions except English Comprehension in the cited scheme clauses; this is availability evidence, not a blanket English-medium/readiness claim | Notification and syllabus bytes locally hashed; pair staged only in local in-memory pilot; Founder review required for current-cycle syllabus binding |
| SSC Selection Post | EXISTING MISSION | `ssc_selection_post` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established in this bounded pass | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |
| SSC Stenographer Grade C & D | EXISTING MISSION | `ssc_stenographer` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |
| SSC CHSL | EXISTING MISSION | `ssc_chsl` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |
| SSC Combined Hindi Translators | EXISTING MISSION | `ssc_hindi_translators` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Bilingual/translation evidence is not equivalent to the ordinary English-medium MCQ gate | Candidate/registry evidence only; manual Founder review |
| SSC MTS & Havaldar | EXISTING MISSION | `ssc_mts_havaldar` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |
| SSC CPO | EXISTING MISSION | `ssc_cpo` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |
| SSC GD | EXISTING MISSION | `ssc_gd` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |
| SSC Junior Engineer | EXISTING MISSION | `ssc_je` | SSC, CENTRAL | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED; official portal only: `https://ssc.gov.in/for-candidates/syllabus` | Exact notification date and cycle status not established | Registry says `ENGLISH_AVAILABLE`; exact cycle notice clause not established | Candidate/registry evidence only; Founder review |

### Counts and quarantine

- Candidate families in this bounded SSC set: **9**.
- Existing legitimate canonical missions reused: **9**; new permanent mission candidates: **0**.
- Approved current cycles: **0**. The CGL 2026 row is a source/evidence pilot, not a production current-cycle approval.
- Founder-review rows: **9**; out of scope in this set: **0**.
- Canonical Founder identity records: **18 total = 15 legitimate + 3 quarantined**.
- Quarantine remains unchanged for `e2e_prod_mission_1790940914968`, `m_prod_e2e_f5_1790946353278`, and `test_mission_catalog_bridge`. They are not student missions and were not reused for the pilot.

## SSC CGL local pilot evidence

The following two artifacts were downloaded from SSC into a temporary local directory, hashed independently, and passed through the new internal invocation boundary with an in-memory Firestore store and fake private Admin Storage bucket. This is not a Firebase production write.

| Artifact | URL | Local SHA-256 | Bytes | Evidence note |
|---|---|---|---:|---|
| Notification | `https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf` | `54a01dda220cb8836f19983908e1f3fd14ddba8286781765a02765728a89e070` | 4,251,150 | Official 2026 notice; uploaded date surfaced as 2026-05-21 |
| Syllabus | `https://ssc.gov.in/api/attachment/uploads/masterData/Syllabus/CGL-syllabus-169635-.pdf` | `3ab83ad80406b7a7c3d51a40da404c722ee8921b816244b061ea35f7588fc78f` | 342,318 | Official CGL 2024 syllabus; current-2026 applicability remains unresolved |

Pilot result:

- canonical mission `ssc_cgl`, cycle key `2026`; hidden `PASSIVE` shell bootstrap succeeded;
- notification and syllabus used separate private object paths and independent hashes;
- the boundary's regression coverage proves idempotent pair coordination, and this pilot produced `MISSION_SOURCE_PAIR` with the worker-safe `documentId`/SHA/storage-path payload;
- worker payload contained no external fetch URL; no cycle was created;
- no notification/syllabus extraction worker, form writer, B3/B4 worker, PYQ worker, activation, or publication was invoked;
- because the syllabus artifact is a 2024 official document and the current CGL 2026 syllabus page currently exposes no exact downloadable row, this pilot does **not** prove current-cycle syllabus readiness.

## Next safe step

Bind the internal `authorizeCodexInvocation` adapter to a real authenticated Codex service identity and confirm the current-cycle syllabus artifact with Founder evidence. Only then should the production Admin Storage adapter be enabled against the selected Firebase project and a worker queue contract be added. No source activation or extraction is included in this plan.
