# RANKCRACKERS STUDENT JOURNEY FIX4-R4B

## Verdict

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4B_SHELL_CONTRACT_KNOWLEDGE_MAP_CRUCIBLE_AND_REDSCREEN_REPAIR_PASSED_WITH_VISUAL_PROOF_PENDING

## Starting Baseline

Starting HEAD before this repair:

a896e61e3f134ff96461d42bf886a5cdcfdd2614

Known unrelated dirty file preserved:

android/app/build.gradle.kts

Preserved hash:

4319efa3f9e08cc36fa19ee480112de9edb938f4

## Chief Architect Correction Lock

The video red screen is treated as a RankCrackers journey defect. It is not excluded from scope. The repair does not hide Flutter errors globally. The root class of the failure is handled by adding explicit Material ancestors around student-facing ListTile surfaces that can appear inside decorated/dark containers or overlays.

## Repairs Completed

### 1. Student Shell Contract

Dashboard primary learning hub now presents the locked student learning pillars:

- THE CRUCIBLE
- DIGIBOOK
- SYLLABUS

Career/opportunity access is not removed, but it is no longer presented as an equal `JOBS` learning pillar. It is renamed to `CAREER SIGNALS` as a secondary/satellite surface.

No mission count was hardcoded.
No opportunities feature was deleted.
No production data was read.

### 2. Dashboard State Semantics

The empty priority copy no longer says `No Active Weakness` with `Target: 0% Mastery` when no real weakness exists. It now truthfully tells the student that the first priority unlocks after assessment/learning evidence.

### 3. Knowledge Map State Contract

The syllabus/knowledge map empty state no longer shows a fake `0 Mastered / 0 Weak` map when no nodes exist. It now shows one truthful first-use state:

`Knowledge map is preparing`

and explicitly says no mastery, weakness, or progress data has been invented.

The DigiBook fallback already used the newer truthful state:

`DigiBook is preparing your first map`

### 4. Crucible Duration Contract

Student-facing Crucible duration text is aligned with the accepted 100-day architecture:

- `100 Day Tactical Ascension Protocol`
- `100 DAYS BATTLE`
- `Day X of 100`

This removes the 99-day contract mismatch found in the video.

### 5. Opportunities Language Audit Repair

The Opportunities feature remains present, but its first impression is less recruitment-portal-like:

- `OPPORTUNITIES` -> `CAREER SIGNALS`
- `PERSONAL RECRUITMENT REPORT` -> `CAREER ELIGIBILITY SNAPSHOT`
- `Eligible Recruitments` -> `Eligible Paths`
- `High Priority` -> `Priority Alerts`
- `MATCHES FOR YOU` -> `ELIGIBLE PATHS`

This is not final product acceptance for the Opportunities module. It is a tonal contract repair while preserving the feature for a later source/intent audit.

### 6. Red Screen / ListTile Material Guard

Student-facing ListTile locations were guarded with a Material ancestor where needed:

- Unified Identity selection dialog
- Mission Realm card was already guarded and remains guarded
- Archive asset tile
- Deep Profile subject selector

This addresses the RankCrackers-side `No Material widget found. ListTile widgets require a Material widget ancestor.` class of red screen without using a fake global error suppression.

## Validation

Targeted format:
PASS

Targeted Flutter analyze:
PASS

Analyzed files:

- lib/features/dashboard/presentation/screens/dashboard_screen.dart
- lib/features/crucible/presentation/screens/crucible_screen.dart
- lib/features/crucible/presentation/widgets/battle_engine_card.dart
- lib/features/syllabus/presentation/screens/syllabus_screen.dart
- lib/features/opportunities/screens/opportunities_screen.dart
- lib/features/auth/presentation/screens/unified_identity_screen.dart
- lib/features/archive/presentation/screens/archive_screen.dart
- lib/features/deep_profile/widgets/subject_selector_tile.dart

Old student-facing strings check:

- `99 Day` removed from scoped student UI
- `99 DAYS` removed from scoped student UI
- `Day X of 99` removed from scoped student UI
- `NO KNOWLEDGE MATRIX FOUND` not present in lib/core or lib/features search
- `RETRY SYNC` not present in lib/core or lib/features search
- `JOBS` primary dashboard label removed
- `PERSONAL RECRUITMENT REPORT` removed

Remaining `PRACTICE` hits are internal worker action constants, not the Dashboard primary hub label.

## Safety Proof

NO_PRODUCTION_READ
NO_PRODUCTION_WRITE
NO_RULES_CHANGE
NO_FIREBASE_CONFIG_SWAP
NO_DEPLOY
NO_STUDENT_PUBLISH
NO_MISSION_COUNT_HARDCODE
NO_FAKE_KNOWLEDGE_MATRIX
NO_FAKE_MASTERY
NO_OPPORTUNITIES_REMOVAL
NO_ERRORWIDGET_SUPPRESSION
KNOWN_GRADLE_DIRTY_FILE_PRESERVED

## Evidence Limitations

This is a source/analyze-level R4B repair. Physical Pixel visual proof is still pending for:

- Dashboard learning hub hierarchy
- Knowledge Map truthful empty state
- Crucible 100-day text
- Career Signals screen tone
- Back gesture behavior after the latest shell changes
- Absence of the ListTile red screen during real navigation

Recommended next gate:

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R5_DEVICE_GESTURE_AND_SHELL_VISUAL_QA
