# Canonical Android Build, Release & Physical Verification Contract

**Mission**: `RC_ANDROID_CANONICAL_BUILD_RELEASE_AND_PHYSICAL_VERIFICATION_CONTRACT_43C`  
**Agent**: Agent-3 (Android Runtime / Build Provenance Auditor)  
**Chief Architect**: ChatGPT Main RankCrackers Project Chat  
**Canonical Build Root**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`  
**Committed HEAD Baseline**: `5381f32fe76ba431cbb86a249dc6793f7939193a`  
**Target Application ID**: `com.rankcrackers.app`  
**Accepted Debug APK SHA256**: `c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593`  

---

## 1. Canonical Build Root Law

- **`CANONICAL_ANDROID_BUILD_ROOT`**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`
- **Mandatory Pre-Build Working Directory Check**:
  Before running any Flutter build, every agent MUST execute:
  ```powershell
  cd /d C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06
  ```
- **Quarantine Classification**:
  Any APK built from `C:\RankCrackers\RankCrackers-55` or any other worktree is classified as `NON_CANONICAL_BUILD_EVIDENCE` and **cannot** be used as canonical product runtime proof.

---

## 2. Pre-Build Provenance Checklist & Source Fingerprints

### A. Pre-Build Git Commands:
```powershell
cd /d C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06
git rev-parse --show-toplevel
git branch --show-current
git rev-parse HEAD
git status --short
```

### B. Mandatory Source Fingerprint Verification:
The SHA256 of these 6 critical files inside `canonical-student-integration-06` MUST be verified before building:
1. `lib/features/dashboard/presentation/screens/dashboard_screen.dart` = `b859343f6599974a13782911c9acee2ff69989603aededd79c86f887c7dea558`
2. `lib/core/router/app_router.dart` = `99543470dc9769a9d28af215698f51ba8ce749fa22ee8e0da9afff340b9658e5`
3. `lib/core/utils/app_routes.dart` = `a516825ecc09f2677eee187cde92e2ab01ce282bf9befc0f8be5cb337cbfa6c0`
4. `lib/features/onboarding/presentation/screens/splash_screen.dart` = `e89887486ff6e12d96f4d5427254d206347131fb6fcdb8b8d3fede2c444ea427`
5. `assets/data/digibook_lessons/digibook_authority_bridge_manifest.json` = `5063013a5b468fb1ff71631951fb608751e169bc9030f1c510cb7fe6b3214cc6`
6. `lib/features/crucible/core/crucible_canonical_schedules.dart` = `44d27eb67ab77d6419313e98dd6f714ce35efcc30ff38bd5d634a6c4346e5e45`

**PASS Condition**: All 6 SHA256 values must match 100% byte-for-byte. If `SOURCE_FINGERPRINT_MATCH = NO`, stop before building.

---

## 3. APK Identity & Evidence Contract

- **`ANDROID_NAMESPACE`**: `com.rankcrackers.app`
- **`APPLICATION_ID`**: `com.rankcrackers.app`
- **`VERSION_NAME`**: `1.0.0` | **`VERSION_CODE`**: `1`
- **`MIN_SDK`**: `24` | **`TARGET_SDK`**: `36` | **`COMPILE_SDK`**: `36`

### Mandatory APK Evidence Fields:
Every build evidence report MUST log:
`BUILD_ROOT`, `BRANCH`, `HEAD`, `DIRTY_STATE`, `APK_PATH`, `APK_SHA256`, `APK_SIZE`, `APK_BUILD_TIMESTAMP`, `PACKAGE_ID`, `VERSION_NAME`, `VERSION_CODE`.

---

## 4. Root Repository vs Canonical Worktree APK Classification

1. **Root Repository APK (`C:\RankCrackers\RankCrackers-55\build\...`)**:
   - SHA256: `cea1cba04dba987e48ee9756ea996807642fb0a76a0273371b8d0fa5f6ec8a64`
   - Classification: `BUILD_ROOT = C:\RankCrackers\RankCrackers-55`, `AUTHORITY = ROOT_REPOSITORY_ONLY`, `CANONICAL_PRODUCT_RUNTIME_PROOF = NO`.
2. **Canonical Worktree APK (`C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06\build\...`)**:
   - SHA256: `c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593`
   - Classification: `BUILD_ROOT = canonical-student-integration-06`, `AUTHORITY = CANONICAL_WORKTREE_ACCEPTED`, `CANONICAL_PRODUCT_RUNTIME_PROOF = YES`.

---

## 5. Emulator Verification Contract (11-Step Journey)

| Step | Screen / Feature | Required Visible Proof | Required Route | Fail Condition |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Splash** | Native frame $\rightarrow$ Flutter splash (`"तेजस्वि नावधीतमस्तु। May Our Learning Be Radiant."`). | `/splash` | Render of old tagline on splash or crash. |
| 2 | **Auth / Session** | Login Screen or session handoff. | `/login` / `/` | Unhandled auth exception. |
| 3 | **Dashboard** | Mission Hub fold (Cards: `THE CRUCIBLE`, `Library`, `SYLLABUS`, `CAREER SIGNALS`). | `/` | Test Arena visible in Mission Hub or missing cards. |
| 4 | **Syllabus Root** | Subjects list (`Physics`, `Chemistry`, `Mathematics`). | `/syllabus` | Empty subject list or error screen. |
| 5 | **Syllabus Drilldown** | `Subject` $\rightarrow$ `Unit` $\rightarrow$ `Topic` $\rightarrow$ `Atom`. | `/syllabus/...` | Broken navigation or unhandled exception. |
| 6 | **Syllabus $\rightarrow$ DigiBook** | Multi-GU chooser or fail closed. | `/digibook/...` | Silent random GU open or unhandled crash. |
| 7 | **Library Root** | Header = `"Library"`, 56 lesson cards. | `/digibook` | Title = `"DigiBook Library"` or empty cards. |
| 8 | **Crucible Root** | 98-day rotating schedule (42 Micro, 7 Rebuild, 7 Macro). | `/crucible` | Day > 98 or Major visible inside Crucible. |
| 9 | **Career Signals** | Opportunity / Recruitment Hub. | `/recruitment` | Navigation to `/opportunities` or `Page Not Found`. |
| 10 | **Battle Tools Test Arena** | Test Arena card. | `/test-arena` | Unhandled routing error. |
| 11 | **Back Navigation** | Tap Back / Home. | `/` | Process restart or crash on Back tap. |

---

## 6. Founder Physical Device Contract

- **`SAME_APK_SHA_REQUIRED`**: **`YES`** (Physical phone verification MUST install the exact APK SHA256 already accepted on emulator).
- **`EMULATOR_SUBSTITUTION_ALLOWED`**: **`NO`** (Emulator proof cannot be called Founder physical device proof).
- **`FOUNDER_PHYSICAL_DEVICE_AVAILABLE = NO` Status**: When no physical device is attached via ADB (`adb devices -l`), report `42I_FOUNDER_DEVICE_NOT_AVAILABLE` and stop gracefully without failure.

---

## 7. Source vs Runtime Parity Law

Every runtime proof MUST document the complete **`RUNTIME_PROVENANCE_CHAIN`**:
$$\text{RUNTIME\_PROVENANCE\_CHAIN} = \text{WORKTREE} + \text{HEAD} + \text{DIRTY DIFF} + \text{CRITICAL SOURCE HASHES} + \text{APK SHA} + \text{DEVICE} + \text{SCREENSHOT/VIDEO}$$

If any link in this chain is missing, the runtime proof MUST be classified as **`PARTIAL`**.

---

## 8. Evidence Naming Standard

- **Screenshots**: `<mission>_<apk-short-sha>_<device>_<screen>_<timestamp>.png`
- **Video Recordings**: `<mission>_<apk-short-sha>_<device>_walkthrough_<timestamp>.mp4`

---

## 9. Log Evidence Commands

To capture runtime logs during verification:
```powershell
adb logcat -c
adb logcat -v time *:E
```
Search for: `GoException`, `permission-denied`, `uncaught exception`, `null ID`, `/opportunities`.

---

## 10. 11 Release-Blocking Conditions

1. Build invoked outside `CANONICAL_ANDROID_BUILD_ROOT`.
2. Source fingerprint mismatch against Agent-1 42E baselines.
3. Missing APK SHA256 in verification report.
4. Package ID mismatch (`com.rankcrackers.app`).
5. `flutter analyze` fatal errors in core `lib/` code.
6. `flutter test` failure on core integration tests.
7. Startup crash or unhandled runtime exception.
8. Route crash or `Page Not Found` on primary navigation paths.
9. Unsanitized internal technical language rendered on-screen.
10. Synthetic/fake academic data promoted to canonical without verification.
11. Founder physical device walkthrough mismatch when physical sign-off is required.

---

## 11. Physical Device Reconnect Procedure

When a real Founder Android phone is connected:
```powershell
adb devices -l
# 1. Verify physical serial (non-emulator)
# 2. Recompute canonical APK SHA256
# 3. Uninstall old package: adb uninstall com.rankcrackers.app
# 4. Install exact accepted APK: adb install "C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06\build\app\outputs\flutter-apk\app-debug.apk"
# 5. Launch app & record screen: adb shell screenrecord /sdcard/walkthrough.mp4
```

---

## 12. Final Report Manifest

```
===============================================================================
FINAL REPORT
===============================================================================

MISSION =
RC_ANDROID_CANONICAL_BUILD_RELEASE_AND_PHYSICAL_VERIFICATION_CONTRACT_43C

AGENT_ID =
AGENT-3

CANONICAL_BUILD_ROOT =
C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06

CANONICAL_APPLICATION_ID =
com.rankcrackers.app

CURRENT_CANONICAL_APK_SHA256 =
c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593

OLD_ROOT_APK_CANONICAL =
NO

PRE_BUILD_PROVENANCE_GATE_DEFINED =
YES

EMULATOR_ACCEPTANCE_CONTRACT_DEFINED =
YES

FOUNDER_PHYSICAL_CONTRACT_DEFINED =
YES

SAME_APK_SHA_PHYSICAL_LAW =
YES

RUNTIME_PROVENANCE_CHAIN_DEFINED =
YES

RELEASE_BLOCKER_SET_DEFINED =
YES

FOUNDER_PHYSICAL_PARITY_CURRENT_STATE =
OPEN_DEVICE_NOT_AVAILABLE

PRODUCT_MUTATION_COUNT = 0
GOVERNANCE_MUTATION_COUNT = 0
FIREBASE_MUTATION_COUNT = 0

FINAL_VERDICT =
43C_ANDROID_BUILD_AND_RUNTIME_PROVENANCE_CONTRACT_READY

===============================================================================
STOP. NO IMPLEMENTATION.
===============================================================================
```
