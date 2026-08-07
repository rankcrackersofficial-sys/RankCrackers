# RANKCRACKERS STUDENT JOURNEY FIX1

Verdict: RANKCRACKERS_STUDENT_JOURNEY_FIX1_MISSION_REALM_OVERFLOW_REPAIR_AND_PROFILE_RESTORE_AUDIT_PASS

## Context

NEBULA VS1 visual foundation is accepted at prototype level after FIX5/R5. Student Journey FIX1 is now authorized for Login, Profile, Mission Realm, and Dashboard audit/repair.

This commit is intentionally narrow. It does not redesign the journey and does not rewrite the profile flow from scratch.

## Repository Lock

- Official repo: C:\RankCrackers\RankCrackers-55
- Branch: safety/rc-g2-pre-notification-schema
- Start HEAD: 78acb29f72794fa6c2c6501d45205075637cdf51
- Unrelated dirty file preserved: android/app/build.gradle.kts
- Unrelated dirty file hash: 4319efa3f9e08cc36fa19ee480112de9edb938f4

## What Was Repaired

### Mission Realm overflow safety

The Mission Realm screen had a compact-device risk pattern:

- SingleChildScrollView with conditional NeverScrollableScrollPhysics
- ConstrainedBox(minHeight: viewport height)
- Column with Spacer

On short Android heights, keyboard-open states, large text, or expanded mission cards, this can push content into red-screen overflow.

The repair keeps every existing user option intact and changes only layout behavior:

- Mission Realm is always scrollable with BouncingScrollPhysics.
- The main content Column now uses mainAxisSize: MainAxisSize.min.
- The bottom Spacer is replaced with responsive spacing.
- SMART START and QUICK START options remain unchanged.
- State change, category selector, search, and mission list behavior remain unchanged.

## Profile Source Comparison

Profile repair is not done blindly in this phase.

Current route evidence:

- /login uses UnifiedIdentityScreen.
- /profile-setup uses UnifiedIdentityScreen.
- /deep-profile uses DeepProfileScreen.
- SacredProfileCitadel exists as a premium profile visual component.
- exam_goal_selection_screen.dart currently has length 0 and is not a usable restore source.

Architectural decision:

- DO NOT REWRITE PROFILE FROM SCRATCH.
- Future profile restoration must compare UnifiedIdentityScreen, DeepProfileScreen, and SacredProfileCitadel before UI changes.
- This phase records the restore candidates and avoids changing profile options.

## Dashboard Audit

DashboardScreen uses CustomScrollView with slivers and BouncingScrollPhysics. No Mission-Realm-style Spacer/minHeight overflow repair was applied in this slice.

Dashboard compact-device visual QA is still required in a later visual gate.

## Validation

- dart format: PASS on edited files.
- dart analyze lib/features/auth/presentation/screens/mission_realm_screen.dart test/smoke_test.dart: PASS.
- flutter test test/smoke_test.dart --plain-name "Mission Realm compact layout keeps scrolling available" --reporter compact --no-pub --timeout 60s: PASS.
- git diff --check on edited files: PASS.

Note: a broader initial smoke run timed out before completion, so it is not claimed as a full-suite pass in this evidence.

## Files Changed

- lib/features/auth/presentation/screens/mission_realm_screen.dart
- test/smoke_test.dart
- docs/patch_safety/RANKCRACKERS_STUDENT_JOURNEY_FIX1_login_profile_mission_dashboard_overflow_profile_restore_20260807183000.md
- docs/patch_safety/RANKCRACKERS_STUDENT_JOURNEY_FIX1_login_profile_mission_dashboard_overflow_profile_restore_20260807183000.json

## Safety Proof

NO_FIRESTORE_WRITE
NO_REVIEW_QUEUE_MUTATION
NO_QUESTION_IMPORT
NO_ATOMIC_CELL_MUTATION
NO_STUDENT_DELIVERY
NO_DEPLOY
NO_UI_OPTION_REMOVAL
NO_PROFILE_REWRITE_FROM_SCRATCH
UNRELATED_ANDROID_GRADLE_FILE_PRESERVED

## Next Recommended Phase

RANKCRACKERS_STUDENT_JOURNEY_FIX2_VISUAL_DEVICE_QA

Scope:

- Login compact Android view
- Login keyboard-open view
- Profile setup compact Android view
- Mission Realm compact Android view after overflow repair
- Dashboard compact Android view
- Verify no red overflow, no hidden primary action, no profile option loss

If profile quality remains below the earlier premium feel, then start:

RANKCRACKERS_PROFILE_RESTORE_SOURCE_COMPARISON_FIX

That phase must compare UnifiedIdentityScreen, DeepProfileScreen, and SacredProfileCitadel before any profile UI restoration.