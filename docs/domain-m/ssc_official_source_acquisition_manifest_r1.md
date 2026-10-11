# Domain-M SSC official source acquisition manifest R1
Date: 2026-10-11
Status: DISCOVERY_ONLY — NOT INGESTED / NOT OFFICIAL_VERIFIED

## Mandatory controls
- Each row is an official authority-hosted English notification candidate. A source being English-language does not establish English-medium examination eligibility.
- Before force-creating a permanent mission, confirm explicit English-medium exam clause in the official notification and reconcile against the 18 historical Founder records.
- Never create year-specific permanent mission IDs. Keep year in recruitment cycle.
- No agent may assign OFFICIAL_VERIFIED; ingestion must compute its own SHA-256 from bytes.
- These URLs are source leads, not persisted provenance or worker execution evidence.

| Proposed canonical exam key | Existing Founder identity | Official notification URL | English exam-medium evidence | Status |
| --- | --- | --- | --- | --- |
| ssc_cgl | EXISTING_REPORTED_NOT_LIVE_RECONCILED | https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cgl_2026.pdf | PDF p.25 §13.8.1: questions in English and Hindi except English Comprehension; p.28 §13.9.7 Tier-II same | ELIGIBILITY_EVIDENCE_FOUND |
| ssc_selection_post | EXISTING_REPORTED_NOT_LIVE_RECONCILED | https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_RHQ_2026_phase_xiv.pdf | PDF p.18 §15.4: CBE conducted in Hindi and English, candidate chooses medium | ELIGIBILITY_EVIDENCE_FOUND |
| ssc_hindi_translators | EXISTING_REPORTED_NOT_LIVE_RECONCILED | https://ssc.gov.in/api/attachment/uploads/masterData/NoticeBoards/Notice_of_adv_cht_2026.pdf | PDF p.18 §12.2 bilingual translation and English essay; needs exam-medium gate review (not ordinary English-medium MCQ) | MANUAL_ELIGIBILITY_REVIEW |
| ssc_chsl | EXISTING_REPORTED_NOT_LIVE_RECONCILED | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED | PENDING |
| ssc_stenographer | EXISTING_REPORTED_NOT_LIVE_RECONCILED | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED | PENDING |
| ssc_gd | EXISTING_REPORTED_NOT_LIVE_RECONCILED | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED | PENDING |
| ssc_cpo | EXISTING_REPORTED_NOT_LIVE_RECONCILED | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED | PENDING |
| ssc_mts | EXISTING_REPORTED_NOT_LIVE_RECONCILED | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED | PENDING |
| ssc_je | EXISTING_REPORTED_NOT_LIVE_RECONCILED | NOT_YET_CONFIRMED | NOT_YET_CONFIRMED | PENDING |

## Registry reconciliation
Existing `functions/services/authority_intelligence/registries/central_registry.js` SSC knownMajorRecurringExams currently lists 7: `ssc_cgl`, `ssc_chsl`, `ssc_cpo`, `ssc_gd`, `ssc_mts`, `ssc_je`, `ssc_stenographer`.
Missing from this discovery inventory: Selection Post and Combined Hindi Translators. Do not infer these are missing in Founder database or canonical mission resolver from the authority-registry gap.

## Official portal leads
- https://ssc.gov.in/
- https://ssc.gov.in/home/answer-key
- https://ssc.gov.in/for-candidates/scheme-of-examination

## Required next execution evidence
- Exact Founder 18-record read-only snapshot and canonical mission ID mapping
- Official notification bytes + explicit English exam-medium clause for each exam
- Separate syllabus source/section and source-role binding
- Ingestion-generated SHA-256, durable storage provenance, actual worker IDs
- Distinguish source discovery, nonproduction execution, and production execution
