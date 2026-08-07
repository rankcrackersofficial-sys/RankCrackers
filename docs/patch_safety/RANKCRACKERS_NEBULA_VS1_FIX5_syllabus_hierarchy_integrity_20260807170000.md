# NEBULA VS1-FIX5 Syllabus Hierarchy Integrity Repair

## Architect Verdict

`NEBULA_VS1_FIX5_SYLLABUS_HIERARCHY_INTEGRITY_REPAIR_PASSED`

Starting HEAD: `2e864d835c9745b7988312faa7dd42c902ad3ecf`  
Branch: `safety/rc-g2-pre-notification-schema`

FIX5 is intentionally narrow. It does not rewrite canonical syllabus data. It repairs the student-facing preview rule so only trusted hierarchy labels are displayed. Suspicious or unproven Unit/Chapter labels are shown as pending verification.

## Audit Result

- Preview-eligible atoms audited: `417`
- Source hierarchy suspicious atoms detected: `293`
- Suspicious by subject: `{'Chemistry': 122, 'Mathematics': 92, 'Physics': 79}`
- Suspicious level counts: `{'unit': 243, 'chapter': 255}`
- Student-facing suspicious hierarchy display count after FIX5 guard: `0`

The source preview tree still contains generic/course-fragment/topic-like parents such as `General Unit`, `General Chapter`, `B.Tech.)`, and `Paper 1 B E B Tech ...`. FIX5 does not mutate those files. Instead, the student UI now renders unresolved hierarchy honestly:

- `Unit hierarchy pending verification`
- `Chapter hierarchy pending verification`

## Validation

- `flutter analyze` on modified NEBULA files: PASS
- `flutter test test\nebula_vs0\nebula_vs0_preview_ui_completeness_test.dart --reporter compact --no-pub`: PASS
- FIX5 visual matrix: `23/23` PASS
- Unexpected duplicate screenshot hashes: `0`

Evidence paths:

- Screenshots: `docs/patch_safety/nebula_vs1_fix5_hierarchy_integrity_screenshots_20260807170000`
- Matrix: `docs/patch_safety/nebula_vs1_fix5_hierarchy_visual_runner_20260807170000`

## Safety Proof

- NO_FIRESTORE_WRITE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_CANONICAL_SYLLABUS_DATA_MUTATION
- NO_CRUCIBLE_ALLOCATION_MUTATION
- Known unrelated dirty file preserved: `android/app/build.gradle.kts`

## Acceptance Boundary

This closes the code/test/harness hierarchy blocker. Final premium visual acceptance still requires the short R5 manual pixel review of the fresh FIX5 screenshots, especially Physics, Chemistry, Mathematics, and Atomic Topic Detail.
