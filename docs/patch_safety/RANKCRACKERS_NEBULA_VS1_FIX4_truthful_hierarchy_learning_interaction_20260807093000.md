# NEBULA VS1-FIX4 Truthful Hierarchy + Learning Interaction Repair

## Architect Verdict

`NEBULA_VS1_FIX4_TRUTHFUL_HIERARCHY_LEARNING_INTERACTION_REPAIR_COMPLETED_WITH_VISUAL_PROOF_PENDING_MANUAL_PIXEL_ACCEPTANCE`

Starting HEAD: `fdb86c42c5e3c171e0415bae04746eec00397a8c`  
Branch: `safety/rc-g2-pre-notification-schema`

This phase fixes the real product defects found in FIX3 manual screenshot review. It does not mutate canonical syllabus data, does not publish student content, does not deploy, and does not write Firestore.

## What Changed

- Fake `General Unit` / `General Chapter` no longer appears as student truth. The UI now shows `Unit hierarchy pending verification` / `Chapter hierarchy pending verification` when source hierarchy is not proven.
- Schedule readiness arithmetic is corrected at display level: Schedule 1 shows `10 focused topics` and `DigiBook: 2 ready, 8 being prepared`.
- Phase Detail is now a dedicated selected-phase state, not a list of all phases pretending to be detail.
- Schedule Detail is now a dedicated selected-schedule state with actual allocated topic labels where available.
- Assessment preview removes raw TeX-like `$...\text{...}...$` display and uses student-safe plain text.
- Formula Register and Common Misconceptions no longer leak internal formula IDs, misconception IDs, or atom IDs on student-facing surfaces.
- Self-Checks no longer reveal model answers immediately. They show `Reveal explanation (preview)` and state that progress is not saved.
- Concept Reader now shows an actual selected concept explanation and links to formula/misconception/example support.
- Coming Soon is available as a clean standalone unavailable-content state.
- Mission landing copy is now truthful: syllabus inventory and Crucible structure are available; reviewed assessments are still being prepared.

## Validation

- `flutter analyze` on modified NEBULA files: PASS
- `flutter test test\nebula_vs0\nebula_vs0_preview_ui_completeness_test.dart --reporter compact --no-pub`: PASS
- FIX4 visual matrix: `23/23` PASS
- Unexpected duplicate screenshot hashes: `0`

Evidence paths:

- Screenshots: `docs/patch_safety/nebula_vs1_fix4_truthful_hierarchy_screenshots_20260807093000`
- Matrix: `docs/patch_safety/nebula_vs1_fix4_visual_runner_20260807093000`
- Contact sheets: `docs/patch_safety/nebula_vs1_fix4_contact_sheets_20260807093000`

## Safety Proof

- NO_FIRESTORE_WRITE
- NO_STUDENT_PUBLISH
- NO_DEPLOY
- NO_CANONICAL_SYLLABUS_DATA_MUTATION
- NO_CRUCIBLE_ALLOCATION_MUTATION
- KNOWN_UNRELATED_DIRTY_FILE_PRESERVED: `android/app/build.gradle.kts`

## Acceptance Boundary

Code/test/harness proof is complete, but final premium visual acceptance still requires actual pixel review of the new FIX4 screenshots. This is intentional: generated PNGs prove the harness, not product taste by themselves.
