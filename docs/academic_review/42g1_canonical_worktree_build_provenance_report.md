# 42G1 Canonical Worktree Build Binding & Runtime Proof Report

**Mission**: `RC_ANDROID_CANONICAL_WORKTREE_BUILD_BINDING_AND_RUNTIME_PROOF_42G1`  
**Agent**: Agent-3 (Android Runtime / APK Provenance Auditor)  
**Chief Architect**: ChatGPT Main RankCrackers Project Chat  
**Target Worktree**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`  
**Committed HEAD**: `5381f32fe76ba431cbb86a249dc6793f7939193a`  
**Branch**: `safety/rc-canonical-student-integration-06`  

---

## 1. Working Directory & Source Fingerprint Verification

- **`SHELL_CURRENT_DIRECTORY`**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`
- **`GIT_TOP_LEVEL`**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`
- **`BRANCH`**: `safety/rc-canonical-student-integration-06`
- **`HEAD`**: `5381f32fe76ba431cbb86a249dc6793f7939193a`

### Source Fingerprint Matching Against Agent-1 42E:
1. `lib/features/dashboard/presentation/screens/dashboard_screen.dart` = `b859343f6599974a13782911c9acee2ff69989603aededd79c86f887c7dea558` (MATCH)
2. `lib/core/router/app_router.dart` = `99543470dc9769a9d28af215698f51ba8ce749fa22ee8e0da9afff340b9658e5` (MATCH)
3. `lib/core/utils/app_routes.dart` = `a516825ecc09f2677eee187cde92e2ab01ce282bf9befc0f8be5cb337cbfa6c0` (MATCH)
4. `lib/features/onboarding/presentation/screens/splash_screen.dart` = `e89887486ff6e12d96f4d5427254d206347131fb6fcdb8b8d3fede2c444ea427` (MATCH)
5. `assets/data/digibook_lessons/digibook_authority_bridge_manifest.json` = `5063013a5b468fb1ff71631951fb608751e169bc9030f1c510cb7fe6b3214cc6` (MATCH)
6. `lib/features/crucible/core/crucible_canonical_schedules.dart` = `44d27eb67ab77d6419313e98dd6f714ce35efcc30ff38bd5d634a6c4346e5e45` (MATCH)
- **`SOURCE_FINGERPRINT_MATCH`**: **`YES`** (All 6 core files match 100% byte-for-byte!).

---

## 2. Android Configuration & Package ID Verification

- **`ANDROID_NAMESPACE`**: `com.rankcrackers.app`
- **`APPLICATION_ID`**: `com.rankcrackers.app`
- **`MANIFEST_PACKAGE_IF_PRESENT`**: `NONE`
- **`APK_PACKAGE_ID`**: `com.rankcrackers.app`
- **Package ID Resolution**: The physical compiled application ID is strictly `com.rankcrackers.app`.

---

## 3. Canonical Worktree APK Provenance

- **`BUILD_WORKING_DIRECTORY`**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`
- **`APK_ABSOLUTE_PATH`**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06\build\app\outputs\flutter-apk\app-debug.apk`
- **`APK_SHA256`**: `c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593`
- **`APK_FILE_SIZE`**: `230,645,718` bytes (219.96 MB)
- **`APK_BUILD_TIMESTAMP`**: `2026-09-08 06:00:51 UTC`
- **`OLD_42G_APK_AUTHORITY`**: **`ROOT_REPOSITORY_ONLY`** (Old 42G APK `cea1cba04dba987e48ee9756ea996807642fb0a76a0273371b8d0fa5f6ec8a64` was built from root repo; new 42G1 APK `c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593` is the sole canonical worktree proof).

---

## 4. Emulator Clean Installation & Walkthrough Proof

- **Target Device**: `emulator-5554` (`sdk gphone64 x86 64`, Android 15 API 35)
- **Uninstall Result**: `Success` (`com.rankcrackers.app`)
- **Install Result**: `Success` (`app-debug.apk` SHA `c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593`)
- **Splash Screen Proof**:
  - `NATIVE_SPLASH_VISIBLE_TEXT`: Logo
  - `FLUTTER_SPLASH_SANSKRIT`: `"तेजस्वि नावधीतमस्तु।"`
  - `FLUTTER_SPLASH_ENGLISH`: `"May Our Learning Be Radiant."`
  - `NATIVE_SPLASH_OLD_TAGLINE_VISIBLE`: **`NO`**
- **Dashboard Mission Hub Section Heading**: `MISSION HUB`
- **`MISSION_HUB_ACTUAL_CARD_COUNT`**: **4**
- **`MISSION_HUB_CARDS`**: `THE CRUCIBLE`, `Library`, `SYLLABUS`, `CAREER SIGNALS`
- **`MISSION_HUB_TEST_ARENA_VISIBLE`**: **`NO`** (Test Arena is absent from Mission Hub fold in 42E source)
- **`BATTLE_TOOLS_TEST_ARENA_VISIBLE`**: **`YES`** (Routes to `/test-arena` full page)
- **`CAREER_SIGNALS_ROUTE`**: `/recruitment` (`ANY_NAVIGATION_TO_/opportunities = NO`, `ANY_NAVIGATION_TO_/recruitment = YES`)
- **`LIBRARY_ROOT_TITLE`**: `"Library"` (56 cards loaded)
- **`MAJOR_VISIBLE_INSIDE_CRUCIBLE`**: **`NO`**

---

## 5. Post-Audit Source Integrity & Final Report Manifest

- `NEW_SOURCE_DIRTY_COUNT_CAUSED_BY_AGENT3`: **0**

```
===============================================================================
FINAL REPORT
===============================================================================

MISSION =
RC_ANDROID_CANONICAL_WORKTREE_BUILD_BINDING_AND_RUNTIME_PROOF_42G1

AGENT_ID =
AGENT-3

SHELL_CURRENT_DIRECTORY =
C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06

GIT_TOP_LEVEL =
C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06

BRANCH =
safety/rc-canonical-student-integration-06

HEAD =
5381f32fe76ba431cbb86a249dc6793f7939193a

SOURCE_FINGERPRINT_MATCH =
YES

APPLICATION_ID =
com.rankcrackers.app

APK_PACKAGE_ID =
com.rankcrackers.app

APK_ABSOLUTE_PATH =
C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06\build\app\outputs\flutter-apk\app-debug.apk

APK_SHA256 =
c5f36eb9c8d0a25fe6010b92d6218da31dd4ecb8ffb26738cd16694d6b6ab593

OLD_42G_APK_AUTHORITY =
ROOT_REPOSITORY_ONLY

DEVICE =
emulator-5554 (sdk gphone64 x86 64, Android 15 API 35)

FOUNDER_PHYSICAL_DEVICE_USED =
NO

MISSION_HUB_ACTUAL_CARD_COUNT =
4

MISSION_HUB_CARDS =
THE CRUCIBLE, Library, SYLLABUS, CAREER SIGNALS

MISSION_HUB_TEST_ARENA_VISIBLE =
NO

BATTLE_TOOLS_TEST_ARENA_VISIBLE =
YES

BATTLE_TOOLS_TEST_ARENA_BEHAVIOR =
FULL_PAGE (/test-arena)

CAREER_SIGNALS_ROUTE =
/recruitment

ANY_/opportunities_NAVIGATION =
NO

ANY_/recruitment_NAVIGATION =
YES

NATIVE_SPLASH_OLD_TAGLINE_VISIBLE =
NO

FLUTTER_SPLASH_LOCKED_COPY_VISIBLE =
YES

FLUTTER_SPLASH_LOADER_TEXT =
NONE

LIBRARY_ROOT_TITLE =
Library

LIBRARY_CARD_COUNT =
56

MAJOR_VISIBLE_INSIDE_CRUCIBLE =
NO

NEW_SOURCE_DIRTY_COUNT_CAUSED_BY_AGENT3 =
0

FINAL_VERDICT =
42G1_CANONICAL_WORKTREE_RUNTIME_BINDING_PROVEN

===============================================================================
STOP. NO IMPLEMENTATION.
===============================================================================
```
