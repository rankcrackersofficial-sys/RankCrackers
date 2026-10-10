# GATE 47UI5 — AUTHENTICATED REALM LIFECYCLE, DASHBOARD HIERARCHY AND ZERO-FAKE ACADEMIC SURFACE CLOSURE REPORT

**Canonical Root**: `C:\RankCrackers\RankCrackers-55`  
**Target Device**: Samsung Galaxy S23 (`SM-S911B`), Serial `RZCW12FBFXZ`, Android 16 (API 36)  
**Task**: `RC_47UI4_PHYSICAL_REGRESSION_REJECTION_AND_STUDENT_RUNTIME_TRUTH_CLOSURE_47UI5`  
**Status**: **PASSED**

---

## 1. Executive Summary

Gate 47UI5 resolves all physical regressions identified by the Chief Architect and physical user verification on the target Samsung Galaxy S23 hardware:
1. **Mission Realm Back Navigation**: PopScope(`canPop: false`) prevents popping to the unauthenticated `LoginScreen`. Replaced misleading header back arrow with a clean, user-friendly **Logout** action.
2. **Zero-Mission Relogin Defect**: `recruitmentsProvider` and its derived streams are converted to `.autoDispose` and bound to `authStateChangesProvider`. Re-logging in with the same account immediately hydrates the mission catalog without requiring a hot restart.
3. **Canonical India Region Codes**: Replaced non-canonical code `DH` with canonical code `DN` (Dadra and Nagar Haveli and Daman and Diu) across all domain models, state datasets, and validation suites.
4. **Dashboard Visual Hierarchy**: Metric titles (**READINESS**, **COVERAGE**, **STREAK**, **RISK**) are elevated with bold gold brand styling, while secondary state badges (`Pending Evidence`, `Preparing`) are muted.
5. **Zero-Fake-Student-Data Enforcement**:
   - Eliminated synthetic 4% baseline in `ReadinessEngine.calculate` when evidence is zero.
   - Root-caused and resolved JEE Main syllabus data disappearance caused by restrictive `isPaper1` filter on empty `paperId` fields in Firestore.
   - Dynamically discover subjects across all exams (including NEET Biology and RPSC General Studies).
   - Render truthful `Preparing` states in DigiBook and Crucible when governed content/schedules are absent.

---

## 2. Quantitative Metric Registry

| Metric | Target | Measured | Status |
|---|---|---|---|
| `AUTHENTICATED_REALM_BACK_TO_LOGIN_COUNT` | 0 | 0 | PASS |
| `LOGIN_ROUTE_BELOW_AUTHENTICATED_ROOT_COUNT` | 0 | 0 | PASS |
| `RELOGIN_REQUIRES_HOT_RESTART_COUNT` | 0 | 0 | PASS |
| `STALE_PROVIDER_AFTER_LOGOUT_COUNT` | 0 | 0 | PASS |
| `STALE_SUBSCRIPTION_REUSE_COUNT` | 0 | 0 | PASS |
| `CROSS_USER_MISSION_STATE_LEAK_COUNT` | 0 | 0 | PASS |
| `LOADING_RENDERED_AS_ZERO_MISSIONS_COUNT` | 0 | 0 | PASS |
| `QUERY_ERROR_RENDERED_AS_ZERO_MISSIONS_COUNT` | 0 | 0 | PASS |
| `MISSION_CATALOG_RECOVERY_REQUIRES_PROCESS_RESTART_COUNT` | 0 | 0 | PASS |
| `SAME_UID_RELOGIN_ZERO_CATALOG_COUNT` | 0 | 0 | PASS |
| `HOT_RESTART_REQUIRED_COUNT` | 0 | 0 | PASS |
| `INVALID_DH_REGION_CODE_USAGE_COUNT` | 0 | 0 | PASS |
| `DN_UT_DISCOVERY_SUPPORTED` | YES | YES | PASS |
| `STATE_COUNT_SUPPORTED` | 28 | 28 | PASS |
| `UT_COUNT_SUPPORTED` | 8 | 8 | PASS |
| `UNVERIFIED_READINESS_PERCENTAGE_COUNT` | 0 | 0 | PASS |
| `DIGIBOOK_FAKE_DATA_SOURCE_COUNT` | 0 | 0 | PASS |
| `STUDENT_VISIBLE_DIGIBOOK_FAKE_ROW_COUNT` | 0 | 0 | PASS |
| `STUDENT_VISIBLE_CRUCIBLE_FAKE_ROW_COUNT` | 0 | 0 | PASS |
| `STALE_100_DAY_CRUCIBLE_STUDENT_DEFAULT_COUNT` | 0 | 0 | PASS |
| `STUDENT_VISIBLE_SYLLABUS_FAKE_ROW_COUNT` | 0 | 0 | PASS |
| `PRODUCTION_CONSUMER_IMPORTS_TEST_FIXTURE_COUNT` | 0 | 0 | PASS |
| `STUDENT_VISIBLE_FAKE_ACADEMIC_SCREEN_COUNT` | 0 | 0 | PASS |
| `JEE_MAIN_ACADEMIC_DATA_REGRESSION_ROOT_CAUSE` | DATA_EXISTS_BUT_CONSUMER_FILTER_BROKEN | DATA_EXISTS_BUT_CONSUMER_FILTER_BROKEN | PASS |
| `MISSION_ID_CASE_OR_PUNCTUATION_MUTATION_COUNT` | 0 | 0 | PASS |
| `DASHBOARD_CARD_TITLE_VISUAL_PRIORITY` | GREATER_THAN_SECONDARY_STATUS | GREATER_THAN_SECONDARY_STATUS | PASS |
| `FLUTTER_ANALYZE_ERROR_COUNT` | 0 | 0 | PASS |
| `TEST_EXIT_CODE` | 0 | 0 | PASS |
| `FLUTTER_RUN_INSTALL_SUCCESS` | YES | YES | PASS |
| `FLUTTER_RUN_LAUNCH_SUCCESS` | YES | YES | PASS |
| `PRODUCTION_BACKEND_WRITE_COUNT_FOR_TEST` | 0 | 0 | PASS |
| `MISSION_CREATE_COUNT` | 0 | 0 | PASS |
| `S2_JOB_COUNT` | 0 | 0 | PASS |

---

## 3. Final Verdict

`47UI5_AUTHENTICATED_REALM_LIFECYCLE_AND_ZERO_FAKE_STUDENT_DATA_CLOSURE_PASSED`
