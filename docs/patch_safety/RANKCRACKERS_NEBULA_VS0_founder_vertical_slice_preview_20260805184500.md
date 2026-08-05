# RANKCRACKERS NEBULA-VS0 Founder-Only Student-End Vertical Slice Preview

Verdict: **RANKCRACKERS_NEBULA_JEE_MAIN_2027_FOUNDER_VERTICAL_SLICE_PREVIEW_CODE_AND_DATA_PASS_BROWSER_PROOF_PENDING**

## Mission Identity

- Internal mission ID: jee_main_2026
- Student display: **JEE Main 2027**
- Route: /nebula-founder-preview
- Mode: Founder-only local/internal preview

## What This Builds

This phase creates the first truthful student-end vertical slice for Mission NEBULA. It is not a production publication. It gives the Founder a real preview of how the student will move through:

Mission NEBULA -> JEE Main 2027 -> Syllabus -> Atomic Topic -> Crucible Schedule -> Mechanics Foundations DigiBook -> Worked Example -> Self-Check -> Assessment Preview.

## Syllabus Inventory

- Total syllabus atoms: 430
- Preview-eligible canonical atoms: 417
- Held/excluded atoms: 13
- Subject counts: {"Chemistry":160,"Mathematics":92,"Physics":165}
- Unit count: 91
- Chapter count: 129
- Topic count: 366

Only preview-eligible canonical atoms appear in the normal syllabus tree. Held/rejected atoms are shown only in Founder diagnostics.

## Crucible Structural Preview

- 100-day cycle: YES
- 7 phases: YES
- 42 schedules: YES
- 7 rebuild windows: YES
- 7 macro-test slots: YES
- 1 major-test slot: YES
- Primary atom allocations: 417
- Unique allocated atoms: 417
- Duplicate allocation count: 0
- Missing allocation count: 0

Tests remain NOT_READY where reviewed question pools are unavailable. No fake test readiness is shown.

## DigiBook Demo

- Demo unit: **Mechanics Foundations**
- Content label: **INTERNAL PILOT CONTENT**
- Authorized pilot atoms: 2
- Sections: 8
- Formula entries: 7
- Misconceptions: 8
- Worked examples: 7
- Self-checks: 10

Important: the Mechanics pilot unit is real accepted internal content. It is bound as a Founder preview demo. It is not marked student-publish-ready.

## Assessment Preview

- Mechanics Foundations internal draft questions: 12
- Total points: 16
- State: INTERNAL_ASSESSMENT_PREVIEW
- Answer review: PENDING_INDEPENDENT_REVIEW
- Results saved: false
- Mastery updated: false
- Official answer key claim: false

## Files Created / Updated

- ssets/data/preview/jee_main_2027/mission_preview_manifest.json
- ssets/data/preview/jee_main_2027/syllabus_preview_tree.json
- ssets/data/preview/jee_main_2027/crucible_preview_plan.json
- ssets/data/preview/jee_main_2027/digibook_preview_catalog.json
- ssets/data/preview/jee_main_2027/assessment_preview_manifest.json
- unctions/tmp_nebula_vs0_founder_preview_bundle.js
- lib/features/preview/presentation/screens/nebula_founder_preview_screen.dart
- lib/core/utils/app_routes.dart
- lib/core/router/app_router.dart
- pubspec.yaml
- 	est/nebula_vs0_preview_bundle_test.dart

## Validation

- lutter test test\nebula_vs0_preview_bundle_test.dart: PASS
- Targeted lutter analyze for preview screen/router/routes: PASS

## Browser / Screenshot Proof

Pending next gate. Code/data validation is complete, but visual screenshot proof is not claimed in this phase.

## Safety Locks

- NO_PRODUCTION_DEPLOY
- NO_FIRESTORE_PRODUCTION_WRITE
- NO_RULES_DEPLOY
- NO_CALLABLE_DEPLOY
- NO_STUDENT_PUBLICATION
- NO_LIVE_CRUCIBLE_ACTIVATION
- NO_MASTERY_WRITE
- NO_COVERAGE_WRITE
- NO_STREAK_WRITE
- NO_QUESTION_PACK_ATTACHMENT
- NO_FAKE_TEST_DATA
- NO_FAKE_DIGIBOOK_CONTENT
- NO_SYLLABUS_ATOM_MUTATION
- NO_CANONICAL_KEY_MUTATION
- NO_TOPIC_NODE_PRODUCTION_PUBLISH

## Next Recommended Phase

**NEBULA_VS0_BROWSER_VISUAL_VALIDATION_ANDROID_VIEWPORT**

This next phase should run the route visually, capture Android-sized screenshots, and check overflow, scroll behavior, tab navigation, badge clarity, and back navigation.
