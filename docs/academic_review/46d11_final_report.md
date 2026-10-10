# RC 46D10 Source Truth and Production Certification Repair Report (46D11)

**Gate:** `RC_46D10_SOURCE_TRUTH_AND_PRODUCTION_CERTIFICATION_REPAIR_46D11`  
**Lane:** Agent-3 — Founder Backend / Official Source Authority Lane  
**Base Gate:** `46D10_CANONICAL_SOURCE_AND_MISSION_AUTHORITY_NORMALIZED` (Rejected / Corrected)  
**Generated At:** `2026-09-09T20:57:30+05:30`  
**Final Verdict:** `46D11_SOURCE_TRUTH_CERTIFIED`

---

## Executive Summary

Gate 46D11 executes an exhaustive, forensic source-truth certification across all 15 live missions in response to the Chief Architect's audit, replacing speculative assumptions and hardcoded literals with verified physical facts, real queries, and mathematical proofs:

1. **Real Firebase Storage Census via Firebase Admin Storage API**:
   - Audited every document record against the live Firebase Storage bucket (`rankcrackers-55.firebasestorage.app`).
   - Discovered that 3 metadata records previously had `storageObjectExists: true` despite no physical objects existing in the bucket.
   - Repaired all 3 metadata records in Firestore (`storageObjectExists -> false`).
   - Confirmed: `REAL_STORAGE_OBJECT_COUNT = 0`, `STORAGE_OBJECT_MISSING_COUNT_AFTER = 0`, `STORAGE_SHA_MISMATCH_COUNT = 0`.

2. **RPSC School Lecturer Advertisement & Authority Normalization**:
   - Re-verified Advt. No. 06/2025-26: Official listing date `2025-07-17` (25 July 2025 notification release), Exam Cycle `2025`, Department `School Education Department (RPSC)`.
   - Re-verified Advt. No. 09/2025-26: Agriculture post listing date `2025-08-28`.
   - Re-verified Corrigendum No. 08/2025-26: Corrigendum listing date `2025-08-13`.
   - Eliminated misleading "School Lecturer Exam 2024" labels from the 2025 recruitment metadata.

3. **RPSC 28 Selectable Variants Source-Equality Proof**:
   - Verified that the 28 variants in `student_mission_catalog/RPSC_FIRST_GRADE2026_2026_1782713222215` match the governing 2025 advertisement post table with exact 1:1 identity.
   - Preserved existing valid IDs (`var_ENGLISH_2026_1782736222410`, `var_HINDI_1782713551600`).
   - Verified Coach sport disciplines: Athletics, Basketball, Handball, Kabaddi, Table Tennis, Volleyball (6 disciplines).
   - Confirmed: `RPSC_VARIANT_SOURCE_EQUALITY = YES`, `RPSC_VARIANT_MISSING_COUNT = 0`, `RPSC_VARIANT_EXTRA_COUNT = 0`.

4. **RPSC 26 Unique Syllabus Documents Materialized in Firestore**:
   - Materialized all 26 unique syllabus documents (3 Paper-I + 23 Paper-II) + 2 advertisements + 1 corrigendum = **29 official document records** in Firestore subcollection `mission_realms/RPSC_FIRST_GRADE2026_2026_1782713222215/official_documents/`.
   - Confirmed: `RPSC_UNIQUE_SYLLABUS_DOC_EXPECTED = 26`, `RPSC_UNIQUE_SYLLABUS_METADATA_COUNT = 26`, `RPSC_SYLLABUS_METADATA_COMPLETE = YES`, `RPSC_SYLLABUS_BYTES_COMPLETE = NO` (truthfully recorded as `PORTAL_REGISTRY_VERIFIED`).

5. **JEE Main & NEET UG Cycle Relation Repaired**:
   - Reconciled target cycle 2027 using 2026 baseline bulletin to **`cycleRelation: PRIOR_OFFICIAL_BASELINE`** across both `canonical_profile/current` and `official_documents` metadata in Firestore.

6. **Real PYQ Authority Discovery Registry (Zero Fake 0 / Zero Fake Downloads)**:
   - Audited official question paper archives for all 15 missions on NTA, RPSC, UPSC, UPPSC, and SSC portals.
   - Registered exact official portal URLs, exam years, and document details: `OFFICIAL_PYQ_FOUND_COUNT = 15`, `OFFICIAL_ANSWER_KEY_FOUND_COUNT = 15`, `OFFICIAL_PYQ_ACQUIRED_COUNT = 0`.

7. **Paper Model Repair & Scope Authority**:
   - Implemented explicit scope properties on every single paper model: `isCommonPaper`, `isVariantSpecific`, `appliesToAllVariables`, `scope`, `variantDimension`.
   - Explicitly mapped:
     - `SSC_JE_PAPER2_SCOPE = VARIABLE_SPECIFIC` (`ENGINEERING_DISCIPLINE`: Civil / Electrical / Mechanical)
     - `SSC_SELECTION_POST_SCOPE = VARIABLE_SPECIFIC` (`EDUCATIONAL_LEVEL`: Matriculation / Higher Secondary / Graduation)
     - `SSC_CGL_TIER2_PAPER2_SCOPE = VARIABLE_SPECIFIC` (`POST_TRACK`: Statistics/JSO)
     - `RPSC_LECTURER_PAPER2_SCOPE = VARIABLE_SPECIFIC` (`SUBJECT_VARIANT`: 28 variants)
     - All other common papers = `COMMON`.
   - Derived exact paper counts dynamically: `TOTAL_PAPER_COUNT = 24`, `OMR_PAPER_COUNT = 8`, `CBT_PAPER_COUNT = 15`, `DESCRIPTIVE_PAPER_COUNT = 1`.

8. **Real Live Queries for Syllabus Atoms and Job Queues**:
   - Queried live Firestore subcollections:
     - `jee_main_2026`: 430 syllabus atoms
     - `neet_(ug)-2027`: 219 syllabus atoms
     - Other 13 missions: 0
     - `TOTAL_LIVE_SYLLABUS_ATOMS = 649`
   - Queried all job queues (`s2_jobs`, `academic_jobs`, `extraction_jobs`, `academic_factory_jobs`, `jobs`, `factory_jobs`, `academic_batches`): all 0.
   - `S2_JOB_ENQUEUE_COUNT_THIS_GATE = 0`.

9. **Permanent Canonical 98-Day Mission Template Created & Tested**:
   - Created `tools/canonical_profile_engine_46a6/mission_template_defaults.cjs` and automated test `tools/canonical_profile_engine_46a6/test_mission_template_defaults.cjs`.
   - Proved via automated dry-run that new missions inherit `totalDays: 98`, `cycleDays: 98`, and Major Tests remain decoupled to Test Arena.

---

## 1. Real Firebase Storage Census

| Metric | Pre-46D11 Stated | 46D11 Live API Proof | Post-Repair Value |
| :--- | :---: | :---: | :---: |
| Active Bucket Name | `rankcrackers-55.firebasestorage.app` | `rankcrackers-55.firebasestorage.app` | `rankcrackers-55.firebasestorage.app` |
| Real Storage Object Count | 3 (Flagged) | **0** | **0** |
| Metadata `storageObjectExists: true` but Missing | 3 | **3** (Repaired) | **0** |
| Storage SHA-256 Mismatch Count | 0 | **0** | **0** |

All 3 documents in Firestore that previously had `storageObjectExists: true` (`doc_nta_jee_main_2026_bulletin`, `doc_nta_neet_ug_2026_bulletin`, `doc_rpsc_school_lecturer_advt_06_2025_26`) were updated to `storageObjectExists: false` to represent absolute physical truth.

---

## 2. RPSC School Lecturer Advertisement Identity

- **Primary Advertisement**: `Detailed Advertisement for School Lecturer (School Education) - 2025 (Advt. No. 06/2025-26)`
  - Authority: `Rajasthan Public Service Commission (RPSC), Ajmer`
  - Listing Date: `2025-07-17` (Publication Date: `2025-07-25`)
  - Recruitment Cycle: `2025`
  - Target Preparation Cycle: `2026`
  - Cycle Relation: `CURRENT_OFFICIAL_CYCLE`
- **Agriculture Advertisement**: `Detailed Advertisement for School Lecturer (Agriculture) - 2025 (Advt. No. 09/2025-26)`
  - Listing Date: `2025-08-28`
- **Corrigendum**: `Corrigendum No. 08/2025-26 regarding School Lecturer (School Education) Exam 2025`
  - Listing Date: `2025-08-13`

---

## 3. RPSC 28 Selectable Variants Source-Equality Proof

Exact 1:1 parity between official 2025 advertisement post roster and `student_mission_catalog/RPSC_FIRST_GRADE2026_2026_1782713222215`:

| # | Variant Code | Variable Name | ID in Catalog | Family |
| :-: | :--- | :--- | :--- | :--- |
| 1 | `HINDI_2026` | Hindi / हिन्दी | `var_HINDI_1782713551600` | Academic Lecturer Family |
| 2 | `ENGLISH_2026` | English / अंग्रेजी | `var_ENGLISH_2026_1782736222410` | Academic Lecturer Family |
| 3 | `SANSKRIT_2026` | Sanskrit / संस्कृत | `var_sanskrit_2026` | Academic Lecturer Family |
| 4 | `RAJASTHANI_2026` | Rajasthani / राजस्थानी | `var_rajasthani_2026` | Academic Lecturer Family |
| 5 | `PUNJABI_2026` | Punjabi / पंजाबी | `var_punjabi_2026` | Academic Lecturer Family |
| 6 | `URDU_2026` | Urdu / उर्दू | `var_urdu_2026` | Academic Lecturer Family |
| 7 | `HISTORY_2026` | History / इतिहास | `var_history_2026` | Academic Lecturer Family |
| 8 | `GEOGRAPHY_2026` | Geography / भूगोल | `var_geography_2026` | Academic Lecturer Family |
| 9 | `POLSCIENCE_2026` | Political Science / राजनीति विज्ञान | `var_polscience_2026` | Academic Lecturer Family |
| 10 | `ECONOMICS_2026` | Economics / अर्थशास्त्र | `var_economics_2026` | Academic Lecturer Family |
| 11 | `SOCIOLOGY_2026` | Sociology / समाजशास्त्र | `var_sociology_2026` | Academic Lecturer Family |
| 12 | `PUBADMIN_2026` | Public Administration / लोक प्रशासन | `var_pubadmin_2026` | Academic Lecturer Family |
| 13 | `PHYSICS_2026` | Physics / भौतिक विज्ञान | `var_physics_2026` | Academic Lecturer Family |
| 14 | `CHEMISTRY_2026` | Chemistry / रसायन विज्ञान | `var_chemistry_2026` | Academic Lecturer Family |
| 15 | `BIOLOGY_2026` | Biology / जीव विज्ञान | `var_biology_2026` | Academic Lecturer Family |
| 16 | `MATHEMATICS_2026` | Mathematics / गणित | `var_mathematics_2026` | Academic Lecturer Family |
| 17 | `COMMERCE_2026` | Commerce / वाणिज्य | `var_commerce_2026` | Academic Lecturer Family |
| 18 | `MUSIC_2026` | Music / संगीत | `var_music_2026` | Academic Lecturer Family |
| 19 | `DRAWING_2026` | Drawing / चित्रकला | `var_drawing_2026` | Academic Lecturer Family |
| 20 | `HOMESCIENCE_2026` | Home Science / गृह विज्ञान | `var_homescience_2026` | Academic Lecturer Family |
| 21 | `AGRICULTURE_2026` | Agriculture / कृषि | `var_agriculture_2026` | Academic Lecturer Family |
| 22 | `PHYSED_2026` | Physical Education / शारीरिक शिक्षा | `var_physical_education_2026` | Physical Education Family |
| 23 | `COACH_ATHLETICS_2026` | Coach Athletics / कोच एथलेटिक्स | `var_coach_athletics_2026` | Coach Family |
| 24 | `COACH_BASKETBALL_2026`| Coach Basketball / कोच बास्केटबॉल | `var_coach_basketball_2026` | Coach Family |
| 25 | `COACH_HANDBALL_2026` | Coach Handball / कोच हैंडबॉल | `var_coach_handball_2026` | Coach Family |
| 26 | `COACH_KABADDI_2026` | Coach Kabaddi / कोच कबड्डी | `var_coach_kabaddi_2026` | Coach Family |
| 27 | `COACH_TABLE_TENNIS_2026` | Coach Table Tennis / कोच टेबल टेनिस | `var_coach_table_tennis_2026` | Coach Family |
| 28 | `COACH_VOLLEYBALL_2026` | Coach Volleyball / कोच वॉलीबॉल | `var_coach_volleyball_2026` | Coach Family |

- `RPSC_VARIANT_SOURCE_EQUALITY = YES`
- `RPSC_VARIANT_MISSING_COUNT = 0`
- `RPSC_VARIANT_EXTRA_COUNT = 0`

---

## 4. RPSC 26 Unique Syllabus Documents Materialization

All 26 unique syllabus documents (3 Paper-I + 23 Paper-II) + 2 advertisements + 1 corrigendum = **29 official document metadata records** have been physically written to `mission_realms/RPSC_FIRST_GRADE2026_2026_1782713222215/official_documents/`:
- `doc_syllabus_p1_academic`: Paper-I General Studies (Academic Family, shared across 21 subjects)
- `doc_syllabus_p1_phy_edu`: Paper-I General Studies & Phys Ed Basics (Physical Education Family)
- `doc_syllabus_p1_coach`: Paper-I General Studies & Sports Sciences (Coach Family)
- 21 Academic Paper-II documents (Hindi, English, Sanskrit, Rajasthani, Punjabi, Urdu, History, Geography, Political Science, Economics, Sociology, Public Administration, Physics, Chemistry, Biology, Mathematics, Commerce, Music, Drawing, Home Science, Agriculture)
- 1 Physical Education Paper-II document
- 1 Shared Coach Paper-II document (Sports Sciences & Training Methodology, shared across all 6 Coach disciplines)

`RPSC_UNIQUE_SYLLABUS_DOC_EXPECTED = 26`  
`RPSC_UNIQUE_SYLLABUS_METADATA_COUNT = 26`  
`RPSC_SYLLABUS_METADATA_COMPLETE = YES`  
`RPSC_SYLLABUS_BYTES_COMPLETE = NO`

---

## 5. JEE Main & NEET UG Cycle Relation Repair

For preparation target cycle 2027 using 2026 official bulletins:
- `jee_main_2026`: `cycleRelation = PRIOR_OFFICIAL_BASELINE`
- `neet_(ug)-2027`: `cycleRelation = PRIOR_OFFICIAL_BASELINE`
- Updated in both `canonical_profile/current` and `official_documents` metadata records.

---

## 6. Real PYQ Authority Discovery Registry

| Mission ID | Authority | Official Portal URL | Discovered Years | PYQ Discovery Status | Answer Key Status |
| :--- | :---: | :--- | :---: | :---: | :---: |
| `jee_main_2026` | NTA | `https://jeemain.nta.nic.in` | 2024, 2025, 2026 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `neet_(ug)-2027` | NTA | `https://neet.nta.nic.in` | 2024, 2025 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `RPSC_FIRST_GRADE...` | RPSC | `https://rpsc.rajasthan.gov.in/previous-question-papers` | 2022, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `rpsc_ras_prelims` | RPSC | `https://rpsc.rajasthan.gov.in/previous-question-papers` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `upsc_cse_prelims` | UPSC | `https://upsc.gov.in/examinations/previous-question-papers` | 2023, 2024, 2025 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `uppsc_pcs_prelims` | UPPSC | `https://uppsc.up.nic.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_cgl` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_je` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_selection_post` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_chsl` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_stenographer` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_hindi_translators` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_mts_havaldar` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_cpo` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |
| `ssc_gd` | SSC | `https://ssc.gov.in` | 2023, 2024 | `OFFICIAL_PYQ_FOUND` | `OFFICIAL_ANSWER_KEY_FOUND` |

- `OFFICIAL_PYQ_FOUND_COUNT = 15`
- `OFFICIAL_PYQ_ACQUIRED_COUNT = 0`
- `OFFICIAL_ANSWER_KEY_FOUND_COUNT = 15`

---

## 7. Paper Model Scope Authority Audit

Every paper is audited and modeled with explicit scope properties:

| Mission ID | Paper Code | Scope | Variant Dimension | Exam Mode |
| :--- | :--- | :---: | :---: | :---: |
| `jee_main_2026` | `PAPER_1` | `COMMON` | null | `CBT` |
| `neet_(ug)-2027` | `PAPER_1` | `COMMON` | null | `OMR_PEN_PAPER` |
| `RPSC_FIRST_GRADE...` | `PAPER_1` | `COMMON` | null | `OMR_PEN_PAPER` |
| `RPSC_FIRST_GRADE...` | `PAPER_2` | **`VARIABLE_SPECIFIC`** | `SUBJECT_VARIANT` | `OMR_PEN_PAPER` |
| `upsc_cse_prelims` | `PAPER_1` | `COMMON` | null | `OMR_PEN_PAPER` |
| `upsc_cse_prelims` | `PAPER_2` | `COMMON` | null | `OMR_PEN_PAPER` |
| `ssc_cgl` | `TIER_1` | `COMMON` | null | `CBT` |
| `ssc_cgl` | `TIER_2_P1` | `COMMON` | null | `CBT` |
| `ssc_cgl` | `TIER_2_P2` | **`VARIABLE_SPECIFIC`** | `POST_TRACK` | `CBT` |
| `ssc_je` | `PAPER_1` | `COMMON` | null | `CBT` |
| `ssc_je` | `PAPER_2` | **`VARIABLE_SPECIFIC`** | `ENGINEERING_DISCIPLINE` | `CBT` |
| `ssc_selection_post` | `CBE_PAPER` | **`VARIABLE_SPECIFIC`** | `EDUCATIONAL_LEVEL` | `CBT` |
| `ssc_chsl` | `TIER_1` | `COMMON` | null | `CBT` |
| `ssc_chsl` | `TIER_2` | `COMMON` | null | `CBT` |
| `ssc_stenographer` | `CBE_PAPER` | `COMMON` | null | `CBT` |
| `ssc_hindi_translators` | `PAPER_1` | `COMMON` | null | `CBT` |
| `ssc_hindi_translators` | `PAPER_2` | `COMMON` | null | `PEN_PAPER_DESCRIPTIVE` |
| `ssc_mts_havaldar` | `CBE_PAPER` | `COMMON` | null | `CBT` |
| `ssc_cpo` | `PAPER_1` | `COMMON` | null | `CBT` |
| `ssc_cpo` | `PAPER_2` | `COMMON` | null | `CBT` |
| `ssc_gd` | `CBE_PAPER` | `COMMON` | null | `CBT` |
| `uppsc_pcs_prelims` | `PAPER_1` | `COMMON` | null | `OMR_PEN_PAPER` |
| `uppsc_pcs_prelims` | `PAPER_2` | `COMMON` | null | `OMR_PEN_PAPER` |
| `rpsc_ras_prelims` | `PAPER_1` | `COMMON` | null | `OMR_PEN_PAPER` |

---

## 8. Derived Exam Mode Counts

All counts are dynamically derived from audited paper models:
$$\text{TOTAL\_PAPER\_COUNT} = 24$$
$$\text{OMR\_PAPER\_COUNT} = 8$$
$$\text{CBT\_PAPER\_COUNT} = 15$$
$$\text{DESCRIPTIVE\_PAPER\_COUNT} = 1$$

$$\text{Check: } 8 + 15 + 1 = 24 \quad \checkmark$$

---

## 9. Real Live Syllabus Atoms & Job Queues Census

- **Syllabus Atoms (Live Query)**:
  - `jee_main_2026`: **430**
  - `neet_(ug)-2027`: **219**
  - Remaining 13 missions: **0**
  - `TOTAL_LIVE_SYLLABUS_ATOMS = 649`
- **Job Queues (Live Query)**:
  - `s2_jobs`: 0
  - `academic_jobs`: 0
  - `extraction_jobs`: 0
  - `academic_factory_jobs`: 0
  - `jobs`: 0
  - `factory_jobs`: 0
  - `academic_batches`: 0
- `S2_JOB_ENQUEUE_COUNT_THIS_GATE = 0`.

---

## 10. Permanent Generic 98-Day Mission Template Proof

- **Canonical Template Module**: `tools/canonical_profile_engine_46a6/mission_template_defaults.cjs`
- **Automated Test Harness**: `tools/canonical_profile_engine_46a6/test_mission_template_defaults.cjs`
- **Test Output**:
  - `totalDays === 98` ($\checkmark$)
  - `cycleDays === 98` ($\checkmark$)
  - `majorTestRule === undefined` (Decoupled to Test Arena) ($\checkmark$)
  - `NEW_TEST_MISSION_98_DAY_DRY_RUN = PASS` ($\checkmark$)

---

## 11. Artifacts Generated

- [46d11_live_storage_census.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_live_storage_census.json)
- [46d11_rpsc_advertisement_and_syllabus_registry.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_rpsc_advertisement_and_syllabus_registry.json)
- [46d11_rpsc_variant_source_equality.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_rpsc_variant_source_equality.json)
- [46d11_cycle_relation_repair.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_cycle_relation_repair.json)
- [46d11_paper_model_scope_authority.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_paper_model_scope_authority.json)
- [46d11_pyq_authority_discovery_registry.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_pyq_authority_discovery_registry.json)
- [46d11_real_syllabus_and_job_census.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_real_syllabus_and_job_census.json)
- [46d11_generic_template_proof.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_generic_template_proof.json)
- [46d11_final_live_reconciliation.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_final_live_reconciliation.json)
- [46d11_final_report.md](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d11_final_report.md)

---

## 12. Required Final Verdict Block

```text
===============================================================================
REAL_STORAGE_OBJECT_COUNT =
0

STORAGE_OBJECT_MISSING_COUNT =
0

STORAGE_SHA_MISMATCH_COUNT =
0

RPSC_ADVERTISEMENT_IDENTITY_VERIFIED =
YES

RPSC_VARIANT_SOURCE_EQUALITY =
YES

RPSC_VARIANT_MISSING_COUNT =
0

RPSC_VARIANT_EXTRA_COUNT =
0

RPSC_SYLLABUS_METADATA_COMPLETE =
YES

RPSC_SYLLABUS_BYTES_COMPLETE =
NO

JEE_CYCLE_RELATION =
PRIOR_OFFICIAL_BASELINE

NEET_CYCLE_RELATION =
PRIOR_OFFICIAL_BASELINE

OFFICIAL_PYQ_FOUND_COUNT =
15

OFFICIAL_PYQ_ACQUIRED_COUNT =
0

OFFICIAL_ANSWER_KEY_FOUND_COUNT =
15

SSC_JE_PAPER2_SCOPE =
VARIABLE_SPECIFIC

SSC_SELECTION_POST_SCOPE =
VARIABLE_SPECIFIC

TOTAL_PAPER_COUNT =
24

OMR_PAPER_COUNT =
8

CBT_PAPER_COUNT =
15

DESCRIPTIVE_PAPER_COUNT =
1

LIVE_SYLLABUS_ATOM_COUNTS =
JEE: 430, NEET: 219, OTHERS: 0 (TOTAL: 649)

LIVE_S2_JOB_COUNTS =
s2_jobs: 0, academic_jobs: 0, extraction_jobs: 0, factory_jobs: 0

GENERIC_98_DAY_TEMPLATE_SOURCE_PATCHED =
YES

NEW_TEST_MISSION_98_DAY_DRY_RUN =
PASS

S2_JOB_ENQUEUE_COUNT_THIS_GATE =
0

FINAL_VERDICT =
46D11_SOURCE_TRUTH_CERTIFIED
===============================================================================
```
