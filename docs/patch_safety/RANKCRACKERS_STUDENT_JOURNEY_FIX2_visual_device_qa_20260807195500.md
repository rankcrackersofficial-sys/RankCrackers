# RANKCRACKERS STUDENT JOURNEY FIX2 - Visual Device QA

Verdict: RANKCRACKERS_STUDENT_JOURNEY_FIX2_VISUAL_DEVICE_QA_PASS_WITH_HARNESS_FLAGS

This phase audits the normal student journey after NEBULA VS1 visual foundation acceptance:

- Login
- Profile setup
- Mission Realm
- Dashboard

The intent was not to redesign the journey. The intent was to catch compact-device, keyboard-open, large-text, narrow-screen, red-screen and overflow failures without removing existing UI options.

## Repository Lock

- Branch: safety/rc-g2-pre-notification-schema
- Baseline HEAD before FIX2 work: 8d1608e5a0436ad8cb9872165dcda1f5e9f6421d
- Known unrelated dirty file preserved: android/app/build.gradle.kts
- Required Gradle hash preserved: 4319efa3f9e08cc36fa19ee480112de9edb938f4

## Scoped Product Repair

A real compact-device blocker was found on the Login screen:

- Screen: UnifiedIdentityScreen
- Defect: Google sign-in row could overflow on narrow mobile width.
- Repair: button label was wrapped in a flexible single-line text container with ellipsis.
- UI option removed: NO
- Login flow weakened: NO
- Auth behavior changed in production: NO

## Test-Only Harness Controls

Default-off test hooks were added to keep visual QA deterministic:

- forceProfileSetupForTest
- disableFirebaseAuthLookupForTest
- disableAnimationsForTest
- disableKnowledgeEngineInitForTest on Dashboard

These are default false; production behavior remains unchanged.

Dashboard visual QA also overrides live stream providers with local empty values, so visual tests do not start Firestore-backed opportunity, notification, or syllabus streams.

## Visual Matrix Generated

Screenshot directory:

docs/patch_safety/student_journey_fix2_visual_device_qa_screenshots_20260807190000

Generated artifacts:

- PNG screenshots: 16 / 16
- JSON records: 16 / 16

Covered states:

1. Login normal mobile
2. Login compact height
3. Login keyboard open
4. Login large text
5. Profile setup normal mobile
6. Profile setup compact height
7. Profile setup keyboard open
8. Profile setup large text
9. Mission Realm normal mobile
10. Mission Realm compact height
11. Mission Realm very short height
12. Mission Realm large text
13. Dashboard normal mobile
14. Dashboard compact height
15. Dashboard large text
16. Dashboard narrow width

## Automated Pixel QA

Pixel audit evidence:

docs/patch_safety/RANKCRACKERS_STUDENT_JOURNEY_FIX2_pixel_audit_20260807194800.json

Automated checks:

- Red error screen risk: 0 / 16
- Flutter overflow stripe risk: 0 / 16
- Blank screenshot risk: 0 / 16
- Dimensions valid: 16 / 16

Important boundary: local image viewer access was blocked by Windows ACL, so this phase uses screenshot generation records and pixel-stat evidence rather than manual eyeball acceptance. This is why the verdict is PASS_WITH_HARNESS_FLAGS, not final premium manual visual acceptance.

## Profile Restore Audit

Relevant profile/identity sources located:

- lib/features/auth/presentation/screens/unified_identity_screen.dart - active login/profile setup flow.
- lib/features/deep_profile/screens/deep_profile_screen.dart - deeper profile source candidate.
- lib/features/profile/presentation/widgets/sacred_profile_citadel.dart - premium profile visual candidate.
- lib/features/profile/presentation/screens/profile_screen.dart - profile surface candidate.
- lib/features/profile/presentation/screens/exam_goal_selection_screen.dart - separate goal flow candidate.

Architectural lock:

- DO NOT rewrite profile from scratch.
- Restore/polish must compare active UnifiedIdentityScreen with DeepProfileScreen and SacredProfileCitadel before any design decision.
- No profile option should be removed silently.

## Validation Results

- dart analyze test/student_journey/student_journey_fix2_visual_device_qa_test.dart: PASS
- dart analyze lib/features/auth/presentation/screens/unified_identity_screen.dart: PASS in targeted phase
- dart analyze lib/features/dashboard/presentation/screens/dashboard_screen.dart: PASS
- flutter test visual harness: screenshots are generated, but test runner still times out after evidence write because of a pending async/timer lifecycle. This is recorded as a harness flag, not hidden.

## Safety Proof

- NO_FIRESTORE_WRITE
- NO_REVIEW_QUEUE_MUTATION
- NO_QUESTION_IMPORT
- NO_ATOMIC_CELL_MUTATION
- NO_STUDENT_DELIVERY
- NO_DEPLOY
- NO_PROFILE_REWRITE
- NO_UI_OPTION_REMOVAL
- NO_GRADLE_TOUCH

## Recommended Next Step

RANKCRACKERS_STUDENT_JOURNEY_FIX3_PROFILE_PREMIUM_RESTORE_AND_HARNESS_TIMER_CLOSURE

Scope:

1. Close the pending timer lifecycle in the visual harness.
2. Perform actual profile source comparison: UnifiedIdentityScreen vs DeepProfileScreen vs SacredProfileCitadel.
3. Restore/polish profile setup premium feel without changing available options.
4. Regenerate Login/Profile focused screenshots only.
5. Keep Mission Realm and Dashboard unchanged unless a new reproducible blocker appears.

