# Canonical Mission Realm Identity Report

Date: 2026-10-10

## Decision

`mission_realms/{missionId}` remains the only mission authority. Existing Founder cards are retained in place. Their Firestore document IDs are not renamed, copied, deleted, or recreated by this change.

The single runtime identity source is:

`functions/canonical_mission_registry.js`

Its `CANONICAL_MISSION_REALM_MANIFEST` contains the 18 records observed in the Founder panel, while `LEGACY_PARENT_BINDINGS` preserves the existing IDs for future cycle-independent resolution. The word “legacy” here means compatibility binding; it does not authorize deletion or recreation.

## Live Founder inventory observed

Observed on `https://rankcrackers.in/` in Founder → Mission Control:

| Metric | Live value |
|---|---:|
| Inventory cards | 18 |
| Founder drafts | 18 |
| Needs attention | 18 |
| Live for students | 0 |
| Passive / staged | 0 |
| Archived | 0 |
| Scope aggregate shown by deployed build | 17 |
| Aggregate central | 14 |
| Aggregate state | 3 |
| Aggregate UT | 0 |

Every observed card was `FOUNDER DRAFT`, `NEEDS ATTENTION`, and `STUDENT VISIBILITY: HIDDEN`. The common blockers were unproven mission state, unproven notification/syllabus, publication not approved or not proven, and student publication not active.

## Canonical 18-record manifest

| # | Preserved `missionId` | Official/short name | Authority | Scope | Identity decision |
|---:|---|---|---|---|---|
| 1 | `ssc_cgl` | SSC CGL — Combined Graduate Level Examination | SSC | Central | Keep in place |
| 2 | `ssc_selection_post` | SSC Selection Post | SSC | Central | Keep in place |
| 3 | `ssc_stenographer` | SSC Stenographer Grade C & D | SSC | Central | Keep in place |
| 4 | `upsc_cse_prelims` | UPSC Civil Services – Prelims | UPSC | Central | Keep in place |
| 5 | `rpsc_ras_prelims` | RPSC RAS – Prelims | RPSC | Rajasthan | Keep; English-medium evidence required before student publication |
| 6 | `uppsc_pcs_prelims` | UPPSC PCS – Prelims | UPPSC | Uttar Pradesh | Keep in place |
| 7 | `ssc_gd` | SSC GD | SSC | Central | Keep in place |
| 8 | `ssc_cpo` | SSC CPO | SSC | Central | Keep in place |
| 9 | `ssc_mts_havaldar` | SSC MTS & Havaldar | SSC | Central | Keep in place |
| 10 | `ssc_hindi_translators` | SSC Combined Hindi Translators | SSC | Central | Keep in place |
| 11 | `ssc_chsl` | SSC CHSL | SSC | Central | Keep in place |
| 12 | `ssc_je` | SSC Junior Engineer | SSC | Central | Keep in place |
| 13 | `RPSC_FIRST_GRADE2026_2026_1782713222215` | RPSC 1st Grade — School Lecturer | RPSC | Rajasthan | Keep; English-medium evidence required before student publication |
| 14 | `neet_(ug)-2027` | NEET (UG) | NTA | Central | Keep in place |
| 15 | `jee_main_2026` | JEE Main | NTA | Central | Keep in place |
| 16 | `e2e_prod_mission_1790940914968` | E2E production test record | — | Unclassified | Quarantine; never student-eligible |
| 17 | `m_prod_e2e_f5_1790946353278` | E2E production test record | — | Unclassified | Quarantine; never student-eligible |
| 18 | `test_mission_catalog_bridge` | TEST Mission Catalog Bridge | — | Unclassified | Orphan/test quarantine; never student-eligible |

The three unclassified records are represented for audit visibility only. They are not governed exam identities and are intentionally excluded from any future student mission creation list.

## Why the live count is 18 while the aggregate is 17

The checked-in implementation already subscribes once to `mission_realms`, derives cards from that snapshot, and computes the scope summary from the same rows. Therefore the checked-in implementation cannot legitimately produce one list of 18 and an aggregate of 17.

The live site is running an older/deployed artifact, not PR #4 HEAD `14413b143af991b5d89dcf8df604ba5ab835e4e1`. The old artifact is mixing an inventory surface with a realm aggregate. The orphaned `TEST Mission Catalog Bridge` card is also explicitly shown as missing its `mission_realms` authority document. This is the direct mismatch mechanism; it is not a valid second source of truth.

After the canonical build is deployed, the only valid invariant is:

```
TOTAL = CENTRAL + STATE + UT + UNCLASSIFIED
```

For the currently observed 18-card inventory, the corrected scope display must be `18 = 12 + 3 + 0 + 3` if all 18 cards are intentionally retained for audit visibility. If orphan/test records are removed from the live inventory, they must disappear from both the cards and all counters; they must not remain as a hidden extra source.

## Official source surfaces used for the next enrichment gate

The identity manifest stores authority/exam identity, not an unverified claim that a document has already been ingested. Official documents must be linked under `mission_realms/{missionId}/official_documents/{documentId}` only after source validation and Founder review.

- UPSC calendar and active examinations: `https://www.upsc.gov.in/examinations/exam-calendar` and `https://www.upsc.gov.in/examinations/active-exams`
- SSC official calendar: `https://ssc.gov.in/api/attachment/uploads/masterData/ExamCalendar/Tentative_Calendar2026_27_08012026.pdf`
- SSC official notices/scheme: `https://ssc.gov.in`
- NTA notice archive: `https://nta.ac.in/NoticeBoardArchive`
- JEE Main portal: `https://jeemain.nta.nic.in/`
- NEET UG bulletin and documents: `https://neet.nta.nic.in/admission-bulletin/`
- RPSC official portal: `https://rpsc.rajasthan.gov.in/`
- RSSB official portal: `https://rssb.rajasthan.gov.in/`
- UPPSC official portal: `https://uppsc.up.nic.in/`
- JEE Advanced official portal for the planned family: `https://jeeadv.ac.in/`

Official portal presence is not the same as a linked mission document. Each mission stays hidden until its notification, syllabus, medium evidence, and publication gates are separately satisfied.

## Scope expansion

The runtime resolver now has governed, fail-closed identity pairs for the remaining major public families requested by the Founder: UPSC NDA/CDS/CAPF/ESE/CMS/IFS/IES-ISS, SSC public families, NTA JEE Advanced/CUET/UGC-NET/CSIR-NET, RPSC major families, and RSSB major public families. This makes their IDs deterministic, but it does not silently create production realms. A family is created only through an approved source-backed materialization run.

For Rajasthan, the manifest and future creation policy use `ENGLISH_EVIDENCE_REQUIRED`. A Rajasthan mission without verified English medium evidence is retained as a governed draft candidate but cannot be made student-visible.

## Safety result

- Existing 18 records: preserved; no delete/recreate performed.
- Production Firestore writes: 0.
- Firestore deletion/reset: 0.
- Student publication: 0.
- Deployment: 0.
- Merge: 0.
- Canonical identity test: 55/55 passed.

The next operational step is a read-only production census against the deployed Functions environment, followed by a reviewed in-place metadata reconciliation for the 15 exam records. The three quarantined records must never be promoted by a generic “create mission” fallback.
