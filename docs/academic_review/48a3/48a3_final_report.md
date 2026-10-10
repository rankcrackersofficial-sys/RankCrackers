# GATE 48A3 — INDIA MASTER PHYSICAL SET VERIFICATION REPORT

## GATE EXECUTIVE SUMMARY
- **GATE**: GATE 48A3 — INDIA MASTER PHYSICAL SET VERIFIER
- **AGENT**: AGENT-2 — INDIA MASTER INDEPENDENT VERIFIER
- **MODE**: STRICT READ-ONLY
- **VERDICT**: **48A3_PHYSICAL_INDIA_IDENTITY_SET_VERIFIED**
- **TIMESTAMP**: 2026-09-10T12:05:27.718Z

---

## 1. PHYSICAL ROW EXTRACTION & EXACT UNIQUE COUNT
- **RAW_ROW_COUNT**: 238
- **EXACT_UNIQUE_MISSION_ID_COUNT**: **214**
- **DUPLICATE_ID_ROW_COUNT**: 24

> **Finding**: Recomputing identity sets directly from physical upstream artifacts (without hardcoded constants or proxy total claims) proves that the exact count of unique India mission identities is **214** (not 215).

---

## 2. DISPOSITION SETS BREAKDOWN
- **NATIONAL_CLEAN**: 45
- **NATIONAL_HOLD**: 8
- **STATE_UT_CLEAN**: 140
- **STATE_UT_HOLD**: 6
- **POINTER**: 2
- **EXCLUDED**: 5
- **ARTICLE315_SUPPORTED**: 13
- **ARTICLE315_UNRESOLVED**: 11
- **JUDICIAL_CONFIRMED**: 4
- **JUDICIAL_UNRESOLVED**: 4

---

## 3. BUCKET EXCLUSIVITY & MULTI-LANE MEMBERSHIP
- **MULTI_BUCKET_ID_COUNT**: 24
- **NO_BUCKET_ID_COUNT**: 0

*Note*: Multi-bucket memberships represent items that appear in State/UT filter ledgers and were reclassified/audited under Article 315 residual ledgers in 48C.

---

## 4. 48C DELTA MEASUREMENT
- **Article 315 Supported IDs**: 13
- **Article 315 Unresolved IDs**: 11
- **Judicial Confirmed IDs**: 4
- **Judicial Unresolved IDs**: 4
- **Tripura Observed IDs**: jrbt_tripura_group_cd, tpsc_tripura_tcs_tps, trbt_tripura_stgt_stpgt, trbt_tripura_ttet, tripura_police_constable, tripura_tet

---

## 5. TRIPURA IDENTITY OBSERVATIONS
- **Observed Mission IDs**: jrbt_tripura_group_cd, tpsc_tripura_tcs_tps, trbt_tripura_stgt_stpgt, trbt_tripura_ttet, tripura_police_constable, tripura_tet
- **Conflict Status**: `UNBOUND_ALIAS_DISCREPANCY`
- **Assessment**: Upstream artifacts hold both `trbt_tripura_ttet` and `tripura_tet`. No explicit producer binding exists to merge them into a single canonical alias.

---

## 6. STATIC INTEGRITY & DETERMINISM AUDIT
- **HARDCODED_RESULT_METRIC_COUNT**: 0
- **MANUALLY_TYPED_MISSION_ID_RESULT_COUNT**: 0
- **SECOND_RUN_DATA_HASH_MISMATCH_COUNT**: 0
- **Static Integrity Certified**: YES
- **Determinism Certified**: YES

---

## 7. ZERO MUTATION PROOF
- **PRODUCTION_WRITE_COUNT**: 0
- **MISSION_CREATE_COUNT**: 0
- **MISSION_DELETE_COUNT**: 0
- **S2_JOB_COUNT**: 0

---

## FINAL VERDICT STATEMENT
```
48A3_PHYSICAL_INDIA_IDENTITY_SET_VERIFIED
```
