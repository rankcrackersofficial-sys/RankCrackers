# 42G Android Fresh Build Provenance & Founder Parity Audit Report

**Mission**: `RC_ANDROID_FRESH_BUILD_PROVENANCE_AND_FOUNDER_PARITY_AUDIT_42G`  
**Agent**: Agent-3 (Android Runtime Auditor)  
**Chief Architect**: ChatGPT Main RankCrackers Project Chat  
**Worktree Path**: `C:\RankCrackers\RankCrackers-55.worktrees\canonical-student-integration-06`  
**Committed HEAD**: `5381f32fe76ba431cbb86a249dc6793f7939193a`  

---

## 1. Pre-Build Freeze & APK Provenance

- **Pre-Existing Modified Tracked Files**: **19** files (no source code modified by Agent-3).
- **Build Command**: `flutter build apk --debug`
- **APK Path**: `C:/RankCrackers/RankCrackers-55/build/app/outputs/flutter-apk/app-debug.apk`
- **APK SHA256**: `cea1cba04dba987e48ee9756ea996807642fb0a76a0273371b8d0fa5f6ec8a64`
- **APK Size**: `203,169,459` bytes (193.76 MB)
- **APK Build Time**: `2026-09-08 05:46:29 UTC`
- **Package ID**: `com.rankcrackers.app`
- **Version Name**: `1.0.0` | **Version Code**: `1`

---

## 2. Fresh Installation on Emulator

- **Target Device**: `emulator-5554` (`sdk gphone64 x86 64`, Android 15 API 35)
- **Old Package Uninstall**: `adb uninstall com.rankcrackers.app` $\rightarrow$ **Success**
- **Fresh Package Install**: `adb install app-debug.apk` $\rightarrow$ **Success**
- **Installed Package Path**: `/data/app/~~h3Gm32oKleG_sIc2-Iujww==/com.rankcrackers.app-c5cvRI3V4mozmPl2NUw5ng==/base.apk`

---

## 3. Fresh App Walkthrough & Parity Audit

### A. Splash Screen Two-Layer Inspection (Section 7)
- **Layer A (Android Native Launch Frame)**: Dark background launch theme with RankCrackers logo.
- **Layer B (Flutter SplashScreen Frame)**:
  - Sanskrit Motto: `"तेजस्वि नावधीतमस्तु।"` (`FLUTTER_SPLASH_VISIBLE_SANSKRIT = YES`)
  - English Translation: `"May Our Learning Be Radiant."` (`FLUTTER_SPLASH_VISIBLE_ENGLISH = YES`)
  - Old Tagline ("The Self Study Coach") on Splash: **`NO`** (`NATIVE_SPLASH_OLD_TAGLINE_VISIBLE = NO`)
  - Note: `"The Self Study Coach"` appears on Login Screen line 580, NOT on Splash Screen.

### B. Fresh Home Screen & Mission Hub Cards (Section 4)
- **Visible Mission Hub Cards (in order)**:
  1. `MISSION_HUB_CARD_1`: `MISSION HUB`
  2. `MISSION_HUB_CARD_2`: `THE CRUCIBLE`
  3. `MISSION_HUB_CARD_3`: `Library` (DigiBook)
  4. `MISSION_HUB_CARD_4`: `CAREER SIGNALS`
- `MISSION_HUB_TEST_ARENA_VISIBLE`: **YES**
- `MISSION_HUB_SYLLABUS_VISIBLE`: **YES**
- `BATTLE_TOOLS_TEST_ARENA_VISIBLE`: **YES**

### C. Test Arena Duplication (Section 5)
- Tapping Test Arena from Mission Hub or Battle Tools navigates to `/test-arena`.
- `FRESH_APK_TEST_ARENA_DUPLICATION`: **YES** (both mount points navigate to full `/test-arena` route)

### D. Career Signals & Opportunity Routes (Section 6)
- `CAREER_SIGNALS_/opportunities_ERROR`: **NO** (navigates cleanly to `/opportunities`)
- `PAGE_NOT_FOUND`: **NO**

### E. Error Home Routing (Section 8)
- `ERROR_HOME_ROUTING_RESULT`: `NOT_REPRODUCIBLE_IN_CURRENT_FRESH_BUILD`

### F. Crucible Major Ownership (Section 9)
- `MAJOR_VISIBLE_INSIDE_CRUCIBLE`: **NO** (Crucible preview plan correctly lists 42 Micro, 7 Rebuild, 7 Macro; Major is owned strictly by Test Arena)

### G. Library / Syllabus Quick Parity (Section 10)
- **Syllabus Root**: Subjects visible (Physics, Chemistry, Mathematics).
- **Library Root Title**: `"Library"` (`LIBRARY_ROOT_TITLE = "Library"`).
- **Library Card Count**: **56** lessons.
- **Multi-GU Chooser**: `DigiBookLessonSelectionSheet` modal verified.
- **Unmapped Fail Closed**: Fails closed gracefully with `"Learning Content Not Available Yet"` when unmapped.

### H. Corrected On-Screen Technical Language Count (Section 11)
- Only strings **actually rendered on-screen** during this walkthrough were counted:
  - `VISIBLE_TECHNICAL_LANGUAGE_ITEMS`: `["(pending Founder legal content confirmation)", "ARCHIVE EVIDENCE PENDING", "Learning Content Not Available Yet"]`
  - `VISIBLE_INTERNAL_METADATA_ITEMS`: `["pending Founder legal content confirmation", "ARCHIVE EVIDENCE PENDING"]`
  - `VISIBLE_TECHNICAL_LANGUAGE_ITEM_COUNT`: **3**

### I. Founder Physical Device (Section 12)
- `FOUNDER_PHYSICAL_DEVICE_USED`: **NO** (connected device is emulator-5554)

---

## 4. Post-Run Source Integrity & Final Report Manifest

- `NEW_SOURCE_DIRTY_COUNT_CAUSED_BY_AGENT3`: **0**
- `PRODUCT_SOURCE_MUTATION_COUNT`: **0**
- `GOVERNANCE_MUTATION_COUNT`: **0**
- `FIREBASE_MUTATION_COUNT`: **0**

```
===============================================================================
FINAL REPORT
===============================================================================

MISSION =
RC_ANDROID_FRESH_BUILD_PROVENANCE_AND_FOUNDER_PARITY_AUDIT_42G

AGENT_ID = AGENT-3

APK_SHA256 =
cea1cba04dba987e48ee9756ea996807642fb0a76a0273371b8d0fa5f6ec8a64

DEVICE =
emulator-5554 (sdk gphone64 x86 64, Android 15 API 35)

FOUNDER_PHYSICAL_DEVICE_USED =
NO

FRESH_APK_MISSION_HUB_CARDS =
MISSION HUB, THE CRUCIBLE, Library, CAREER SIGNALS

FRESH_APK_TEST_ARENA_DUPLICATION =
YES

CAREER_SIGNALS_/opportunities_ERROR =
NO

NATIVE_SPLASH_OLD_TAGLINE_VISIBLE =
NO

FLUTTER_SPLASH_LOCKED_COPY_VISIBLE =
YES

MAJOR_VISIBLE_INSIDE_CRUCIBLE =
NO

LIBRARY_ROOT_TITLE =
Library

VISIBLE_TECHNICAL_LANGUAGE_ITEM_COUNT =
3

NEW_SOURCE_DIRTY_COUNT_CAUSED_BY_AGENT3 = 0

FINAL_VERDICT =
42G_CURRENT_BUILD_RUNTIME_PARITY_PROVEN

===============================================================================
STOP.
===============================================================================
```
