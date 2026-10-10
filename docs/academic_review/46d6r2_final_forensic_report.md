# 46D6R2 RPSC Paper Family & Current Variant Forensic Report

**Mission**: `RC_RPSC_PAPER_FAMILY_AND_CURRENT_VARIANT_FORENSIC_46D6R2`  
**Agent**: `AGENT-3`  
**Role**: Official Source Intelligence & Deep RPSC Forensic Authority  
**Scope**: Read-Only Research & Offline Canonical Profile Artifacts  
**Status**: `46D6R2_RPSC_MISSION_INTELLIGENCE_SOURCE_COMPLETE`  

---

## 1. Executive Summary & Cross-Mission Status

| Mission ID | Canonical Exam | Target Year | 46D6R2 Status | S2 Profile Readiness |
|---|---|---|---|---|
| `jee_main_2026` | **JEE Main 2027** | 2027 | **ACCEPTED** (Preserved from 46D6R) | `JEE_S2_PROFILE_DRAFT_READY = YES` |
| `neet_(ug)-2027` | **NEET (UG)-2027** | 2027 | **ACCEPTED** (S2 Model Repaired) | `NEET_S2_PROFILE_DRAFT_READY = YES` |
| `RPSC_FIRST_GRADE2026_2026_1782713222215` | **RPSC 1st Grade** | 2026 | **ACCEPTED** (Forensic Grounding Complete) | `RPSC_S2_PROFILE_DRAFT_READY = YES` |

---

## 2. NEET S2 Subject Model Repair

### 2.1 Problem in Previous Draft
The previous draft included Botany and Zoology directly in `expectedSubjects` alongside Physics, Chemistry, and Biology, creating a risk that S2 OCR/ingestion pipelines would interpret NEET as a 4-subject or 5-subject examination paper.

### 2.2 Corrected Official Primary vs System Derived Model
- **Primary Official Expected Subjects (Count: 3)**:
  1. `Physics` (45 Qs / 180 Marks) — `SOURCE_VERIFIED`
  2. `Chemistry` (45 Qs / 180 Marks) — `SOURCE_VERIFIED`
  3. `Biology` (Official wording: *Biology (Botany & Zoology)*, 90 Qs / 360 Marks) — `SOURCE_VERIFIED`
- **System-Derived Taxonomy**:
  - `Botany` (45 Qs / 180 Marks) and `Zoology` (45 Qs / 180 Marks) are strictly maintained under `systemDerivedTaxonomy` as child disciplines for RankCrackers internal digibook mapping and diagnostic scoring.
- **Artifact Created**: [`46d6r2_neet_s2_subject_model.json`](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d6r2_neet_s2_subject_model.json).

---

## 3. RPSC Paper Family Architecture & Universal Model Revocation

### 3.1 Revocation of Universal Common Paper Model
The assumption that a single Paper-I (`rpsc_paper_1_gk_gs`) is reused universally across all 23 entities is **REVOKED**:
```text
RPSC_UNIVERSAL_COMMON_PAPER_MODEL_REVOKED = YES
```

### 3.2 Canonical Three-Tier Paper Families
Official RPSC syllabus registry defines three distinct examination and syllabus authorities:

```text
RPSC School Lecturer Recruitment
│
├── 1. ACADEMIC_LECTURER_FAMILY (21 Disciplines)
│     ├── Paper-I: General Awareness and General Studies (Academic GK/GS)
│     └── Paper-II: Subject Concerned (Senior Sec + Grad + PG + Pedagogy)
│
├── 2. PHYSICAL_EDUCATION_FAMILY (1 Cadre Entity)
│     ├── Paper-I: General Awareness & General Studies (Physical Education Specific)
│     └── Paper-II: Physical Education Subject & Sports Pedagogy
│
└── 3. COACH_FAMILY (1 Parent Cadre Post)
      ├── Paper-I: General Awareness & Sports Science (Coaching Specific)
      └── Paper-II: Sport-Specific Discipline Paper (6 Active Specializations)
```

- **Unmapped Variants**: `UNMAPPED_RPSC_VARIANT_TO_PAPER_FAMILY_COUNT = 0`.
- **Artifact Created**: [`46d6r2_rpsc_paper_family_matrix.json`](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d6r2_rpsc_paper_family_matrix.json).

---

## 4. RPSC Coach Cycle Reconciliation (Current vs Historical)

### 4.1 Structural Model
- **Model**: `PARENT_POST_WITH_OFFICIAL_SPECIALIZATIONS`
- **Official Source**: Advt. No. 06/2025-26 Section 1 (Post & Vacancy Table) and Section 8 (Scheme & Syllabus of Examination).
- **Semantics**: Coach is advertised as a parent post in the service cadre with officially partitioned vacancies for specific sports. All coach candidates take Coach Paper-I and their respective Sport Paper-II.

### 4.2 Three Independent Sets
1. **`RPSC_COACH_CURRENT_RECRUITMENT_SUBVARIANTS`** (Active 2025 Baseline — 6 Sports):
   - **`Athletics` (एथलेटिक्स)**
   - **`Basketball` (बास्केटबॉल)**
   - **`Handball` (हैंडबॉल)**
   - **`Kabaddi` (कबड्डी)**
   - **`Table Tennis` (टेबल टेनिस)**
   - **`Volleyball` (वॉलीबॉल)**
2. **`RPSC_COACH_PRIOR_RECRUITMENT_SUBVARIANTS`** (Historical Exclusions — 5 Sports):
   - `Football` (फुटबॉल)
   - `Gymnastics` (जिमनास्टिक)
   - `Hockey` (हॉकी)
   - `Kho-Kho` (खो-खो)
   - `Wrestling` (कुश्ती)
3. **`RPSC_COACH_HISTORICAL_UNION`** (11 Total Sports).
- **Rule**: Only the 6 active sports enter the active 2025 baseline profile.
- **Artifact Created**: [`46d6r2_rpsc_coach_cycle_reconciliation.json`](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d6r2_rpsc_coach_cycle_reconciliation.json).

---

## 5. Agriculture Source Chain Forensic

- **Primary Recruitment Advertisement**: `Advt. No. 06/2025-26`.
- **Agriculture Advertisement**: **`Advt. No. 09/2025-26`** for School Lecturer (School Education Department) - 2025 (Agriculture / कृषि).
- **Relationship**: `SUPPLEMENTAL_ADVERTISEMENT` (Published 2025-09-12).
- **Official Syllabus**: Published on **13 Oct 2025** (`School_Lecturer_2025_Paper_II_Agriculture_13Oct2025.pdf`).
- **Source Binding**: Agriculture is explicitly bound to `Advt. No. 09/2025-26` + `13-Oct-2025 Syllabus Document`.
- **Artifact Created**: [`46d6r2_rpsc_source_chain.json`](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d6r2_rpsc_source_chain.json).

---

## 6. Applicable Corrigenda Chain

- **Corrigendum No. 01/2025-26** (Date: 2025-08-14): Clarification on category reservations and age relaxations.
- **Corrigendum No. 02/2025-26** (Date: 2025-10-18): Application window extension, examination instructions, and OMR 5th option rules.
- **Applicable Corrigendum Count**: **2**.

---

## 7. Canonical Variant Counts & S2 Context

- **Academic Disciplines**: **21**
- **Physical Education Entity**: **1**
- **Coach Parent Post**: **1**
- **Coach Active Specializations**: **6**
- **Distinct Parent Entities Count**: **23** (21 Academic + 1 Phy Edu + 1 Coach Parent)
- **Student-Selectable Variants Count**: **28** (21 Academic + 1 Phy Edu + 6 Coach Sports)
- **Current Backend Variants**: 2 (`["English", "Hindi"]`)
- **Missing Selectable Variants**: 26
- **S2 Profile Readiness**: `RPSC_S2_PROFILE_DRAFT_READY = YES` (Contextual lookup per Paper Family fully wired).

---

## 8. Required Final Report Block

```text
===============================================================================
RC_RPSC_PAPER_FAMILY_AND_CURRENT_VARIANT_FORENSIC_46D6R2
FINAL FORENSIC REPORT
===============================================================================

NEET_PRIMARY_EXPECTED_SUBJECTS =
["Physics", "Chemistry", "Biology"]

NEET_SYSTEM_DERIVED_CHILD_DISCIPLINES =
["Botany", "Zoology"]

RPSC_PAPER_FAMILY_COUNT =
3

RPSC_PAPER_FAMILIES =
["ACADEMIC_LECTURER_FAMILY", "PHYSICAL_EDUCATION_FAMILY", "COACH_FAMILY"]

RPSC_UNIVERSAL_COMMON_PAPER_MODEL_REVOKED =
YES

RPSC_ACTIVE_ACADEMIC_VARIANT_COUNT =
21

RPSC_ACTIVE_PHYSICAL_EDUCATION_ENTITY_COUNT =
1

RPSC_ACTIVE_COACH_PARENT_COUNT =
1

RPSC_ACTIVE_COACH_SPECIALIZATION_COUNT =
6

RPSC_ACTIVE_COACH_SPECIALIZATIONS =
["Athletics", "Basketball", "Handball", "Kabaddi", "Table Tennis", "Volleyball"]

RPSC_HISTORICAL_COACH_SPECIALIZATIONS_EXCLUDED_FROM_ACTIVE =
["Football", "Gymnastics", "Hockey", "Kho-Kho", "Wrestling"]

RPSC_ACTIVE_STUDENT_SELECTABLE_VARIANT_COUNT =
28

AGRICULTURE_SOURCE_ADVERTISEMENT =
Advt. No. 09/2025-26 (Supplemental Advertisement for School Lecturer Agriculture, Cycle 2025)

APPLICABLE_CORRIGENDUM_COUNT =
2

UNMAPPED_RPSC_VARIANT_TO_PAPER_FAMILY_COUNT =
0

GENERIC_SOURCE_REFERENCE_COUNT =
0

UNLOCATED_SOURCE_VERIFIED_FIELD_COUNT =
0

JEE_S2_PROFILE_DRAFT_READY =
YES

NEET_S2_PROFILE_DRAFT_READY =
YES

RPSC_S2_PROFILE_DRAFT_READY =
YES

PRODUCTION_WRITE_COUNT =
0

46D5_VERIFIER_PRESERVED =
YES

FINAL_VERDICT =
46D6R2_RPSC_MISSION_INTELLIGENCE_SOURCE_COMPLETE

STOP.
DO NOT MATERIALIZE.
===============================================================================
```
