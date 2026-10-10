# RC Multi-Authority New Mission Official Intelligence Batch (46D7)
## Agent-3 — Official Authority / Source Intelligence Lane

**Generated At**: 2026-09-09T19:58:00.000Z  
**Lanes Covered**: UPSC (Civil Services Prelims), SSC (9 Open Public Exam Families), UPPSC (PCS Prelims), RPSC (RAS Prelims)  
**Operating Policy**: `PRODUCTION_WRITES = 0` | `DEPLOYMENT = 0` | `MISSION_CREATION = 0` | `46D5_VERIFIER_PRESERVED = YES`

---

## 1. Executive Summary & Permanent Mission Identity Law

In accordance with the **Permanent Mission Identity Law (Section 0)**, all new missions are decoupled from cycle/year numbers in their permanent identity and canonical display names. Target cycles, official calendars, and source baselines are managed as cycle context:

$$\mathbf{PERMANENT\ MISSION\ FAMILY\ +\ CYCLE\ CONTEXT}$$

```mermaid
graph TD
    subgraph Permanent Identity [Stable Core - Zero Year In Name]
        UPSC["upsc_cse_prelims<br/>(UPSC Civil Services – Prelims)"]
        SSC["ssc_cgl, ssc_je, ssc_chsl, etc.<br/>(9 Individual SSC Missions)"]
        UPPSC["uppsc_pcs_prelims<br/>(UPPSC PCS – Prelims)"]
        RPSC["rpsc_ras_prelims<br/>(RPSC RAS – Prelims)"]
    end

    subgraph Cycle Context [Official Calendar vs Prior Baseline]
        C1["Preparation Target: 2027"]
        C2["Official Cycle Status: OFFICIAL_CALENDAR_PUBLISHED / PREPARATION_TARGET_UNANNOUNCED"]
        C3["Source Baseline: 2026 / 2025 / 2024 (PRIOR_OFFICIAL_BASELINE)"]
    end

    Permanent Identity --> Cycle Context
```

---

## 2. UPSC Civil Services – Prelims (`upsc_cse_prelims`)

### Official Calendar Authority (2027)
- **Authority**: Union Public Service Commission (UPSC), Dholpur House, New Delhi (`https://upsc.gov.in`)
- **Annual Calendar 2027**: Confirms Civil Services (Preliminary) Examination 2027:
  - Notification Scheduled: **13 January 2027**
  - Application Deadline: **02 February 2027**
  - Exam Scheduled Date: **23 May 2027** (Sunday)
- **Cycle Status**: `OFFICIAL_CALENDAR_PUBLISHED`
- **Notification Status**: `OFFICIAL_CALENDAR_PUBLISHED_NOTIFICATION_UNRELEASED` (Do NOT claim 2027 notification already exists).

### Source Baseline & Scheme (2026 Baseline)
- **Source Baseline**: CSE 2026 Notification (Advt. No. 05/2026-CSP dated 14.01.2026) -> `PRIOR_OFFICIAL_BASELINE`.
- **RankCrackers Scope**: `PRELIMS_OBJECTIVE_MCQ` (Mains and Personality Test recorded as unsupported future stages).
- **Paper-I (General Studies / GS-1)**:
  - 100 Qs / 200 Marks / 120 Mins / +2.00 correct, -0.66 (-1/3) negative.
  - Determines merit cutoff for Mains qualification.
  - 7 Subjects: Current Events, Indian History & National Movement, Indian & World Geography, Indian Polity & Governance, Economic & Social Development, Environmental Ecology & Climate Change, General Science.
- **Paper-II (CSAT / GS-2)**:
  - 80 Qs / 200 Marks / 120 Mins / +2.50 correct, -0.83 (-1/3) negative.
  - Qualifying nature: Minimum 33% (66 marks out of 200).
  - 5 Subjects: Reading Comprehension, Logical Reasoning & Analytical Ability, Decision Making & Problem Solving, General Mental Ability, Basic Numeracy & Data Interpretation (Class X level).

---

## 3. SSC Official Exam Family Inventory & Public Missions (9 Missions)

### Official Calendar Breakdown (13 Entries Total)
- **Departmental / Restricted (4 Entries - Excluded from Student Missions)**:
  1. Grade 'C' Stenographer LDCE (`DEPARTMENTAL_RESTRICTED`)
  2. JSA / LDC Grade LDCE (`DEPARTMENTAL_RESTRICTED`)
  3. SSA / UDC Grade LDCE (`DEPARTMENTAL_RESTRICTED`)
  4. Assistant Section Officer (ASO) LDCE (`DEPARTMENTAL_RESTRICTED`)
- **Public Open Recruitment (9 Supported Missions)**:
  1. **`ssc_cgl`** (SSC CGL): Tier-I (100 Qs / 200 M / 60 Mins) + Tier-II Paper-I (150 Qs / 390 M) + Paper-II Statistics (JSO Post Track).
  2. **`ssc_je`** (SSC Junior Engineer): 3 Discipline Variants (`Civil Engineering`, `Electrical Engineering`, `Mechanical Engineering`). Paper-I (200 Qs / 200 M) + Paper-II (100 Qs / 300 M Technical).
  3. **`ssc_selection_post`** (SSC Selection Post): 3 Educational Qualification Level Variants (`Matriculation Level`, `Higher Secondary (10+2) Level`, `Graduation and Above Level`). 100 Qs / 200 M / 60 Mins.
  4. **`ssc_chsl`** (SSC CHSL): Tier-I (100 Qs / 200 M / 60 Mins) + Tier-II (Section-I Math/Reasoning 180 M, Section-II English/GA 180 M, Section-III Computer 45 M).
  5. **`ssc_stenographer`** (SSC Stenographer Grade C & D): Single CBE (200 Qs / 200 M: 50 Reasoning, 50 GA, 100 English; no math). Steno C vs D is a cutoff / skill speed distinction (`POST_TRACK`), not separate CBE syllabi.
  6. **`ssc_hindi_translators`** (SSC Combined Hindi Translators): Paper-I CBE (200 Qs / 200 M: 100 General Hindi + 100 General English). Paper-II Descriptive is recorded as `UNSUPPORTED_STAGE`.
  7. **`ssc_mts_havaldar`** (SSC MTS & Havaldar): Session-I (40 Qs / 120 M, No Negative) + Session-II (50 Qs / 150 M, -1 Negative; Merit determining). Havaldar PET/PST recorded as `UNSUPPORTED_STAGE`.
  8. **`ssc_cpo`** (SSC CPO): Paper-I (200 Qs / 200 M) + Paper-II English (200 Qs / 200 M). PST/PET recorded as `UNSUPPORTED_STAGE`.
  9. **`ssc_gd`** (SSC GD Constable): 80 Qs / 160 M / 60 Mins (20 Reasoning, 20 GK/GA, 20 Elementary Math, 20 English/Hindi). PET/PST/DME recorded as `UNSUPPORTED_STAGE`.

### SSC Variant Law Conformance
- **`ACADEMIC_VARIANT` / `DISCIPLINE_VARIANT`**: Applied only where distinct academic syllabi/question papers exist (SSC JE disciplines; Selection Post qualification tiers).
- **`POST_TRACK`**: Applied for common-syllabus posts with differentiated cutoffs or qualifying modules (SSC CGL JSO, SSC Stenographer Grade C/D, SSC MTS vs Havaldar).
- **`SKILL_STAGE` / `PHYSICAL_STAGE`**: Typing tests, stenography dictation, PET/PST are classified as `OFFICIAL_STAGE_EXISTS = YES` with `CURRENT_RANKCRACKERS_SCOPE = UNSUPPORTED_STAGE`.

---

## 4. UP State Mission: UPPSC PCS – Prelims (`uppsc_pcs_prelims`)

- **Authority**: Uttar Pradesh Public Service Commission (UPPSC), Prayagraj (`https://uppsc.up.nic.in`)
- **Target Cycle**: 2027 (`PREPARATION_TARGET_UNANNOUNCED`)
- **Source Baseline**: Combined State / Upper Subordinate Services (PCS) Advt. No. A-1/E-1/2026 -> `PRIOR_OFFICIAL_BASELINE`.
- **RankCrackers Scope**: `PRELIMS_OBJECTIVE_MCQ`.
- **Paper-I: General Studies-I (सामान्य अध्ययन-I)**:
  - 150 Qs / 200 Marks / 120 Mins / +1.33 correct, -0.44 (-1/3) negative.
  - Determines merit for Mains. Includes dedicated **UP Special GK** (History, Culture, Geography, Economy, Polity of Uttar Pradesh).
- **Paper-II: General Studies-II / CSAT (सामान्य अध्ययन-II)**:
  - 100 Qs / 200 Marks / 120 Mins / +2.00 correct, -0.66 (-1/3) negative.
  - Qualifying nature: Minimum 33% (66 marks out of 200). Includes Class X Elementary Math, General English, and General Hindi.

---

## 5. RPSC RAS / State Services Mission (`rpsc_ras_prelims`)

- **Authority**: Rajasthan Public Service Commission (RPSC), Ajmer (`https://rpsc.rajasthan.gov.in`)
- **Target Cycle**: 2027 (`PREPARATION_TARGET_UNANNOUNCED`)
- **Source Baseline**: Advt. No. 02/2024-25 (Rajasthan State and Subordinate Services Combined Competitive Examination 2024) -> `PRIOR_OFFICIAL_BASELINE`.
- **Statutory Law**: Single mission family (`rpsc_ras_prelims`). RAS (Administrative) and RPS (Police) are post-selection service outcomes, not separate preliminary syllabi.
- **Single Preliminary Paper**: General Knowledge and General Science (सामान्य ज्ञान एवं सामान्य विज्ञान)
  - 150 Qs / 200 Marks / 180 Mins (3 Hours) / +1.33 correct, -0.44 (-1/3) negative.
  - **RPSC 5th Option Rule Bound**: 5 options per question (A, B, C, D, E). Darkening 5th option mandatory if unattempted (-1/3 deduction if blank; >10% blank causes candidate disqualification).
  - 11 Subjects: Rajasthan History & Culture, Indian History, World & Indian Geography, Rajasthan Geography, Indian Constitution & Polity, Rajasthan Political & Administrative System, Indian Economy, Rajasthan Economy, Science & Technology, Reasoning & Mental Ability, Current Affairs.

---

## 6. Generated 46D7 Artifact Manifest

| File Link | Description |
|---|---|
| [46d7_upsc_cse_prelims_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_upsc_cse_prelims_profile.json) | UPSC CSE Prelims Canonical Profile (GS-1 & CSAT) |
| [46d7_upsc_source_manifest.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_upsc_source_manifest.json) | UPSC 2027 Calendar & 2026 Notification Sources |
| [46d7_ssc_mission_inventory.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_mission_inventory.json) | Complete SSC 2026-27 Inventory (9 Public + 4 Dept) |
| [46d7_ssc_cgl_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_cgl_profile.json) | SSC CGL Profile (Tier-I & Tier-II Multi-Session) |
| [46d7_ssc_je_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_je_profile.json) | SSC JE Profile (Civil, Electrical, Mechanical) |
| [46d7_ssc_selection_post_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_selection_post_profile.json) | SSC Selection Post Profile (Matric, 10+2, Graduate) |
| [46d7_ssc_chsl_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_chsl_profile.json) | SSC CHSL Profile (Tier-I & Tier-II) |
| [46d7_ssc_stenographer_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_stenographer_profile.json) | SSC Stenographer Grade C & D Profile (No Math) |
| [46d7_ssc_hindi_translators_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_hindi_translators_profile.json) | SSC Combined Hindi Translators Profile (Paper-I) |
| [46d7_ssc_mts_havaldar_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_mts_havaldar_profile.json) | SSC MTS & Havaldar Profile (Session-I & II) |
| [46d7_ssc_cpo_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_cpo_profile.json) | SSC CPO Profile (Paper-I & Paper-II English) |
| [46d7_ssc_gd_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ssc_profiles/46d7_ssc_gd_profile.json) | SSC GD Constable Profile (80 Qs CBE) |
| [46d7_uppsc_pcs_prelims_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_uppsc_pcs_prelims_profile.json) | UPPSC PCS Prelims Canonical Profile (GS-1 & CSAT) |
| [46d7_uppsc_source_manifest.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_uppsc_source_manifest.json) | UPPSC Advt. A-1/E-1/2026 Source Manifest |
| [46d7_rpsc_ras_prelims_profile.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_rpsc_ras_prelims_profile.json) | RPSC RAS Prelims Canonical Profile (150 Qs + 5th Option) |
| [46d7_ras_source_manifest.json](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_ras_source_manifest.json) | RPSC Advt. 02/2024-25 Source Manifest |
| [46d7_new_mission_batch_report.md](file:///c:/RankCrackers/RankCrackers-55/docs/academic_review/46d7_new_mission_batch_report.md) | Comprehensive 46D7 Intelligence Report |

---

## 7. Zero-Hallucination & Governance Verification

- **`detect_placeholder_hashes.js`**: Passed with **0** findings across all 46D7 files.
- **`verify_46d5_independent_gate.js`**: Passed with exit code **0**.
- **Production Writes**: **0**.
- **Deployments**: **0**.
- **Student/Founder UI Mutated**: **0**.

---

## 8. Final Report Truth Block

```text
===============================================================================
FINAL REPORT — 46D7 MULTI-AUTHORITY NEW MISSION OFFICIAL INTELLIGENCE BATCH
===============================================================================

UPSC_CSE_PRELIMS_PROFILE_READY = YES

UPSC_2027_CALENDAR_AUTHORITY = YES

UPSC_2027_NOTIFICATION_PUBLISHED = NO

UPSC_SOURCE_BASELINE_CYCLE = 2026

SSC_OFFICIAL_CALENDAR_ENTRY_COUNT = 13

SSC_PUBLIC_MISSION_COUNT = 9

SSC_DEPARTMENTAL_RESTRICTED_COUNT = 4

SSC_PUBLIC_MISSIONS = [
  "ssc_cgl",
  "ssc_je",
  "ssc_selection_post",
  "ssc_chsl",
  "ssc_stenographer",
  "ssc_hindi_translators",
  "ssc_mts_havaldar",
  "ssc_cpo",
  "ssc_gd"
]

SSC_PROFILE_READY_COUNT = 9

UPPSC_PCS_PRELIMS_PROFILE_READY = YES

UPPSC_OFFICIAL_BASELINE = Advt. No. A-1/E-1/2026 (2026 Cycle)

RPSC_RAS_PRELIMS_PROFILE_READY = YES

RPSC_RAS_2027_OFFICIAL_ANNOUNCEMENT_FOUND = NO

RPSC_RAS_SOURCE_BASELINE_CYCLE = 2024 (Advt. No. 02/2024-25)

SOURCE_SYNTHESIS_COUNT = 0

PRODUCTION_WRITE_COUNT = 0

FINAL_VERDICT =
46D7_NEW_MISSION_OFFICIAL_INTELLIGENCE_BATCH_READY

STOP.
===============================================================================
```
