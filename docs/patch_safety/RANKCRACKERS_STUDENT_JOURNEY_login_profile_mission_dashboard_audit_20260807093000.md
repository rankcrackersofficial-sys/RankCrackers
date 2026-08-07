# RankCrackers Student Journey Audit - Login, Profile, Mission Realm, Dashboard

## Architect Verdict

`RANKCRACKERS_STUDENT_JOURNEY_LOGIN_PROFILE_MISSION_DASHBOARD_AUDIT_COMPLETED_REPAIR_PHASE_REQUIRED`

This audit was requested alongside NEBULA FIX4 because students must enter the product without red screens, overflow errors, or a degraded profile creation experience.

## Current Flow Found

- `/login` and `/profileSetup` both route to `UnifiedIdentityScreen`.
- Mission selection routes to `MissionRealmScreen`.
- Main learner surface routes to `DashboardScreen` inside the root navigation shell.
- Deep profile exists separately as `DeepProfileScreen`.
- `exam_goal_selection_screen.dart` exists but is currently empty.

## Validation Run

- `flutter test test/smoke_test.dart --reporter compact --no-pub`: PASS
- Smoke coverage confirms basic widget construction for Mission Realm and Dashboard, but it does not prove small-screen overflow safety.
- Analyzer over auth/profile/deep_profile/dashboard surfaced pre-existing warnings; the most important product signal is layout risk, not compile failure.

## Key Findings

### Login / Profile Setup

`UnifiedIdentityScreen` is the active login/profile setup screen. It contains a large animated identity/profile form. It should be browser/device-tested separately at small Android heights, keyboard-open state, and slow auth state.

### Profile Creation Regression Concern

There are strong signs of multiple profile-era implementations:

- `lib/features/profile/presentation/screens/exam_goal_selection_screen.dart` is empty.
- `lib/features/deep_profile/screens/deep_profile_screen.dart` is a detailed tile-based profile screen.
- `lib/features/profile/presentation/widgets/sacred_profile_citadel.dart` is a premium visual profile widget candidate.

This means the older/better profile creation feel may still be partially present in the repo, but not wired as the primary `/profileSetup` flow. It should be reviewed before any profile UI rewrite.

### Mission Realm

`MissionRealmScreen` has a real overflow risk pattern:

- `SingleChildScrollView`
- `ConstrainedBox(minHeight: constraints.maxHeight)`
- `Column`
- `Spacer()`
- conditional `NeverScrollableScrollPhysics()` when mission count is small

This can create red-screen/overflow behavior on small devices, large text scale, empty mission states, or keyboard overlays. It should be repaired without removing existing mission options.

### Dashboard

Dashboard smoke construction passes. Analyzer has existing cleanup warnings. The dashboard uses scroll-based slivers, which is generally safer than the Mission Realm layout, but Battle Tools and compact grids still need visual device proof.

## Required Next Phase

`RANKCRACKERS_STUDENT_JOURNEY_FIX1_LOGIN_PROFILE_MISSION_DASHBOARD_OVERFLOW_AND_PROFILE_RESTORE_AUDIT`

Scope:

1. Build a deterministic small-device visual/smoke harness for Login, Profile Setup, Mission Realm, and Dashboard.
2. Test normal height, compact height, and keyboard/large-text states.
3. Repair Mission Realm overflow risk while preserving all existing UI options.
4. Compare current Profile Setup with DeepProfile/SacredProfileCitadel candidates.
5. Restore the better profile creation feel only after source comparison, not by guessing.
6. Keep student experience premium and frictionless.

## Safety Lock

- NO_FIRESTORE_WRITE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_UI_OPTION_REMOVAL
- PROFILE_CREATION_RESTORE_REQUIRES_SOURCE_COMPARISON
