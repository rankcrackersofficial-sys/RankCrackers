# GATE 48A1 — INDIA MASTER MANIFEST V1.1 CONTROL REPORT

Executed: 2026-09-10T12:00:00.000Z
Agent: AGENT-2 — INDIA MASTER CONTROL LANE
Mode: STRICT READ-ONLY AGAINST PRODUCTION

## 1. Executive Summary

Agent-2 has successfully executed the **India Master Manifest V1.1 Correction & Recomputation** (`GATE_48A1_CS1`), incorporating deterministic physical evidence recovered in 48C and aligning live production evidence from 48B0 without mutating live production stores.

Key Results:
- **Total Unique India Missions Tracked**: **214** (verified via Set check).
- **Clean Canonical Missions (INDIA_CLEAN_SET)**: **174** (45 National + 129 State/UT).
  - 13 Article 315 missions recovered with exact row-specific official evidence in 48C have been promoted from `HOLD_EVIDENCE` to `CLEAN_CANONICAL`.
- **Hold Missions (INDIA_HOLD_SET)**: **33** (reduced from 46).
  - 11 Article 315 unresolved residual missions remain strictly on `HOLD_EVIDENCE`.
  - 8 Judicial missions remain in `HOLD_SET`:
    - 4 confirmed judicial missions (`delhi_judicial_service_prelims`, `rhc_civil_judge_prelims`, `mphc_civil_judge_prelims`, `gauhc_ajs_grade3_prelims`) marked as `CANONICAL_IDENTITY_CONFIRMED`, `PRODUCER_ROW_REQUIRED`, `MATERIALIZATION_HOLD`.
    - 4 unresolved judicial missions (`uppsc_pcs_j_prelims`, `bpsc_judicial_service_prelims`, `ppsc_pcs_j_prelims`, `hpsc_hcs_j_prelims`) marked as `SOURCE_UNRESOLVED`.
  - 8 National review hold missions remain on `HOLD_EVIDENCE`.
  - 6 State shell hold missions remain on `HOLD_EVIDENCE`.
  - 1 Tripura T-TET mission remains `HOLD_PATTERN` (`UNCERTIFIED`).
- **Regional Discovery Pointers (INDIA_POINTER_SET)**: **2** (`ssc_ladakh_selection_post`, `delhi_police_si`).
- **Excluded Non-Major / Legacy Missions (INDIA_EXCLUDED_SET)**: **5** (`an_erecruitment_cml`, `tnmrb_assistant_surgeon`, `ld_admin_group_c`, `mizoram_subordinate_services`, `npsc_nagaland_ctse`).

## 2. Recomputed Metrics & Quality Defects Elimination

```json
{
  "INDIA_MASTER_UNIQUE_MISSION_COUNT": 214,
  "INDIA_CLEAN_COUNT": 174,
  "INDIA_HOLD_COUNT": 33,
  "INDIA_POINTER_COUNT": 2,
  "INDIA_EXCLUDED_COUNT": 5,
  "NATIONAL_CLEAN_COUNT": 45,
  "STATE_UT_CLEAN_COUNT": 129,
  "ARTICLE315_HOLD_COUNT": 11,
  "ARTICLE315_RECOVERED_CLEAN_COUNT": 13,
  "JUDICIAL_HOLD_COUNT": 8,
  "JUDICIAL_PRODUCER_HOLD_COUNT": 4,
  "JUDICIAL_SOURCE_HOLD_COUNT": 4,
  "STATE_SHELL_HOLD_COUNT": 6,
  "NATIONAL_REVIEW_HOLD_COUNT": 8,
  "VARIANT_HOLD_COUNT": 0,
  "PATTERN_HOLD_COUNT": 1,
  "DH_USAGE_COUNT": 0,
  "HEURISTIC_CANONICAL_CLASSIFICATION_COUNT": 0,
  "DEFAULTED_AUTHORITY_COUNT": 0,
  "INVENTED_AUTHORITY_COUNT": 0,
  "SOURCE_VERIFIED_WITHOUT_EVIDENCE_COUNT": 0,
  "PATTERN_VERIFIED_WITHOUT_EVIDENCE_COUNT": 0,
  "CATEGORY_FIELD_CONTAINS_READINESS_STATE_COUNT": 0,
  "SMART_ENTRY_ENABLED_WITHOUT_ACADEMIC_PROOF_COUNT": 0,
  "QUICK_ENTRY_ENABLED_WITHOUT_DELIVERY_PROOF_COUNT": 0,
  "UNRESOLVED_CANONICAL_COLLISION_COUNT": 0,
  "ACADEMIC_START_READY_COUNT": 0,
  "PRODUCTION_WRITE_COUNT": 0,
  "MISSION_CREATE_COUNT": 0,
  "CAREER_SIGNAL_CREATE_COUNT": 0,
  "S2_JOB_COUNT": 0
}
```

## 3. Defect Fixes Applied

1. **`DH_USAGE_COUNT = 0`**: DNH & DD uses canonical UT code `DN` (`dnhdd_ssb_group_bc`). Zero legacy `DH` references exist.
2. **Zero Heuristics or Invented Authorities**: All authority IDs match exact commission indices.
3. **No Fake Source Coverage**: 11 unresolved Article 315 residuals and 4 unresolved judicial missions strictly remain `SOURCE_UNRESOLVED`.
4. **Exact Set Check Verification**: `new Set(missions.map(m => m.missionId)).size === 214`.

## 4. Live vs Master Field Comparison (48B0 Baseline)

- **Measured Live Baseline (48B0)**: 16 Union missions (15 Complete across 3 projections + 1 Orphan `test_mission_catalog_bridge`).
- **Field Deltas**:
  - `RPSC_FIRST_GRADE2026_2026_1782713222215`: Live SMC has `smartEntryEnabled = true`, `quickEntryEnabled = true`. Master overrides to `false`, `false` pending crucible readiness proof. SMC `variables` array has 28 items, but parent `variants` array & subcollection rows were missing in live MR; Master enforces 28 governed variants.
  - `jee_main_2026`: Live SMC has `smartEntryEnabled = true`, `quickEntryEnabled = true`. Master overrides to `false`, `false` pending crucible readiness proof.
  - `neet_(ug)-2027`: Live SMC has `category_pending` and state `Rajasthan`. Master normalizes to `medical_entrance` and NTA / Central.
  - `rpsc_ras_prelims`: Live SMC/REC has `STATE_ELIGIBLE`. Master normalizes to `STATE_SPECIFIC` and injects `examFamily = CIVIL_SERVICES`.
  - `test_mission_catalog_bridge`: Excluded live orphan (`EXCLUDED_LIVE_ORPHAN`).

## 5. Final Verdict

**48A1_INDIA_MASTER_V1_1_AND_48CS1_CAREER_SIGNAL_CONTROL_READY**
