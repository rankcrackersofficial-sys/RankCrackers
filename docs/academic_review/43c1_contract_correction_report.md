# 43C1 Android Build & Runtime Provenance Contract Correction Report

**Mission**: `RC_ANDROID_BUILD_RUNTIME_PROVENANCE_CONTRACT_CORRECTION_43C1`  
**Agent**: Agent-3 (Android Runtime / Build Provenance Auditor)  
**Chief Architect**: ChatGPT Main RankCrackers Project Chat  
**Target Worktree**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`  
**Baseline HEAD**: `5381f32fe76ba431cbb86a249dc6793f7939193a`  

---

## 1. Audit Artifact Reconcile (Section 1)

- **`CONTRACT_FILE_EXISTS`**: **YES** (`docs/academic_review/android_build_release_verification_contract_43c.md`)
- **`TRACKED_OR_UNTRACKED`**: `UNTRACKED`
- **`CREATED_OR_MODIFIED_DURING_43C`**: **YES**
- **`43C_AUDIT_ARTIFACT_MUTATION_COUNT`**: **1**
- **`PRODUCT_SOURCE_MUTATION_COUNT`**: **0** (no Product Flutter/Dart source files changed in 43C or 43C1)

---

## 2. Correct PowerShell Build-Root Command (Section 2)

- **PowerShell Command**:
  ```powershell
  Set-Location "C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06"
  ```
- **Mandatory Pre-Build Verification Sequence**:
  ```powershell
  (Get-Location).Path
  git rev-parse --show-toplevel
  git branch --show-current
  git rev-parse HEAD
  git status --short
  ```
- Both `(Get-Location).Path` and `git rev-parse --show-toplevel` MUST equal `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`.

---

## 3. Versioned Fingerprint Law (Section 3)

- **`FINGERPRINT_AUTHORITY_VERSION`**: `BASELINE_V1` (the accepted 42E / 42G1 baseline hashes).
- **Handoff & Transition Law**:
  1. Agent-1 / Product mutator reports exact changed files for an authorized implementation wave.
  2. `flutter analyze` & `flutter test` pass.
  3. New post-wave source SHA256 hashes are calculated.
  4. Chief Architect accepts or rejects the new fingerprint set.
  5. Agent-3 updates `FINGERPRINT_AUTHORITY_VERSION` (e.g., `WAVE1A_POST_PATCH`) and builds the canonical APK.
  6. APK SHA256 binds strictly to that accepted fingerprint version.
- **`VERSIONED_FINGERPRINT_CONTRACT_DEFINED`**: **YES**

---

## 4. Correct Route Table & Syllabus Drilldown Model (Sections 4 & 5)

| Screen / Feature | Route Property | Canonical Route Path |
| :--- | :--- | :--- |
| **Splash Screen** | `AppRoutes.splash` | **`/`** |
| **Dashboard** | `AppRoutes.dashboard` | **`/dashboard`** |
| **Career Signals** | `AppRoutes.recruitment` | **`/recruitment`** |
| **Library Root** | `AppRoutes.digibook` | **`/digibook`** |
| **Crucible Root** | `AppRoutes.crucible` | **`/crucible`** |
| **Syllabus Root** | `AppRoutes.syllabus` | **`/syllabus`** |
| **Test Arena** | `AppRoutes.testArena` | **`/test-arena`** |

- **`43C_ROUTE_TABLE_CORRECTED`**: **YES**
- **`SYLLABUS_DRILLDOWN_ROUTING_MODEL`**: `SAME_SCREEN_STATE_NAVIGATION_STACK_AND_MODAL_GU_SHEET` (Subject $\rightarrow$ Unit $\rightarrow$ Topic drilldown uses an internal `_navigationStack` on `SyllabusScreen`; Atom node tap opens `DigiBookLessonSelectionSheet` modal sheet).

---

## 5. State-Dependent Test Arena Contract (Section 6)

- **`TEST_ARENA_STATE_DEPENDENT_CONTRACT`**: **YES**
  - **IF `readiness == false`**: Expected behavior = truthful `GovernedNotReadyPanel` modal/sheet; NO route crash.
  - **IF `readiness == true`**: Expected behavior = navigation to `/test-arena`; NO route crash.

---

## 6. Splash Copy Invariants (Section 7)

- **`LOCKED_SANSKRIT_TEXT`**: `"तेजस्वि नावधीतमस्तु।"`
- **`LOCKED_ENGLISH_TEXT`**: `"May Our Learning Be Radiant."`
- **`LOGO_IDENTITY_MUST_REMAIN_UNCHANGED`**: **YES**
- **Transitional Copy**: `"Preparing The Battlefield..."` is version-specific and scheduled for removal in future wave.

---

## 7. Current Founder Physical Device State & Final Report Manifest

- **`CURRENT_FOUNDER_PHYSICAL_STATE`**: `OPEN_DEVICE_NOT_AVAILABLE`
- **`43C1_DOCUMENT_MUTATION_COUNT`**: **0**
- **`PRODUCT_SOURCE_MUTATION_COUNT`**: **0**
- **`FIREBASE_MUTATION_COUNT`**: **0**
- **`GOVERNANCE_MUTATION_COUNT`**: **0**

```
===============================================================================
FINAL REPORT
===============================================================================

MISSION =
RC_ANDROID_BUILD_RUNTIME_PROVENANCE_CONTRACT_CORRECTION_43C1

AGENT_ID =
AGENT-3

43C_CORE_PROVENANCE_LAW =
ACCEPTED

43C_ROUTE_TABLE_CORRECTED =
YES

POWERSHELL_COMMAND_CORRECTED =
YES

VERSIONED_FINGERPRINT_CONTRACT_DEFINED =
YES

SPLASH_ROUTE =
/

DASHBOARD_ROUTE =
/dashboard

TEST_ARENA_STATE_DEPENDENT_CONTRACT =
YES

SYLLABUS_DRILLDOWN_ROUTING_MODEL =
SAME_SCREEN_STATE_NAVIGATION_STACK_AND_MODAL_GU_SHEET

43C_AUDIT_ARTIFACT_MUTATION_COUNT =
1

43C1_DOCUMENT_MUTATION_COUNT =
0

CURRENT_FOUNDER_PHYSICAL_STATE =
OPEN_DEVICE_NOT_AVAILABLE

PRODUCT_SOURCE_MUTATION_COUNT =
0

FIREBASE_MUTATION_COUNT =
0

GOVERNANCE_MUTATION_COUNT =
0

FINAL_VERDICT =
43C1_ANDROID_PROVENANCE_CONTRACT_CORRECTED

===============================================================================
STOP. DO NOT IMPLEMENT.
===============================================================================
```
