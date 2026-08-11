# RANKCRACKERS STUDENT JOURNEY FIX4-R4E-R1A

## Founder Mission Exact Record Export

Verdict:

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4E_R1A_BLOCKED_REQUIRES_ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT`

This is an evidence-only gate. No product code was changed.

## Baseline

- Branch: `safety/rc-g2-pre-notification-schema`
- Starting HEAD: `6be21cfbdc616286c118757a54da051a09652243`
- Known unrelated dirty file: `android/app/build.gradle.kts`
- Preserved Gradle hash: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Scope

R1A attempted to find an existing safe, non-production, repository-backed or Founder Panel export capability for the exact three Founder missions.

Absolute locks preserved:

- `NO_PRODUCTION_READ`
- `NO_PRODUCTION_WRITE`
- `NO_FIRESTORE_WRITE`
- `NO_FIRESTORE_UPDATE`
- `NO_BACKFILL`
- `NO_RULES_CHANGE`
- `NO_DEPLOY`
- `NO_STUDENT_PUBLISH`
- `NO_MISSION_REALM_REPAIR`
- `NO_DASHBOARD_REPAIR`
- `NO_MOJIBAKE_PATCH`
- `NO_FAKE_JEE_FALLBACK_REMOVAL`
- `NO_VISUAL_QA`
- `NO_MISSION_CREATION`
- `NO_MISSION_FABRICATION`
- `NO_MISSION_CATEGORY_GUESSING`
- `NO_VISIBILITY_GUESSING`
- `NO_HARDCODED_3_MISSIONS`
- `NO_GRADLE_TOUCH`

## Founder Panel Export Capability Audit

Searched repository areas:

- `lib/`
- `functions/`
- `scripts/`
- `docs/`
- `assets/`
- `test/`

Findings:

1. Founder Mission Control has read/display capability:
   - `lib/features/admin/presentation/widgets/mission_control/mission_control_center.dart`
   - Reads `mission_realms` by `status`.
   - Reads `recruitments` with `status == review` for mission creation queue.
   - This is UI display, not exact three-record export.

2. Founder web delivery preview has collection preview cards:
   - `lib/main_web.dart`
   - collection preview cards include `mission_realms` and `recruitments`.
   - This is not an exact parity export for `mission_realms`, `recruitments`, and `student_mission_catalog`.

3. Existing student catalog access method exists:
   - `FirestoreService.streamStudentMissionCatalog()`
   - Reads `student_mission_catalog` where:
     - `cardVisible == true`
     - `userPanelVisible == true`
     - `archived == false`
   - This supports student-safe read semantics, but does not export the Founder mission inventory.

4. Existing docs classify student catalog fields as student-safe:
   - `docs/patch_safety/FUP_2C_REPOGUARD1_FIX4_CORRECTION_2_CATALOG_ACCESS_AUDIT.md`
   - This proves public-safe field model, not exact current mission records.

5. Existing scripts mention the three pilot IDs:
   - `functions/canonical_mission_registry.js`
   - `functions/apply_student_catalog_readiness.js`
   - `functions/backfill_student_mission_catalog.js`
   - These are not acceptable as full Founder mission truth. They cannot prove exact current records, category split, visibility, or timestamps.

## Required Exact Inventory

Founder-stated reconciliation target:

- total: `3`
- competitive: `2`
- qualifying: `1`

Recovered exact records:

- `0 / 3`

No `FOUNDER_MISSION_EXACT_INVENTORY_*.json` was created because exact three records were not safely proven.

## Candidate Record Status

| Candidate | Source Evidence | Exact Founder Record Exported? | Eligibility |
|---|---|---:|---|
| `jee_main_2026` | Registry, JEE preview assets, tests, syllabus/PYQ evidence | No | `ELIGIBILITY_NOT_PROVEN` |
| `neet_(ug)-2027` | Registry, NEET evidence/docs, readiness script mention | No | `ELIGIBILITY_NOT_PROVEN` |
| `RPSC_FIRST_GRADE2026_2026_1782713222215` | Registry, readiness script mention | No | `ELIGIBILITY_NOT_PROVEN` |

## Three-Surface Parity

Parity across these paths was not recovered:

- `mission_realms/{realmId}`
- `recruitments/{realmId}`
- `student_mission_catalog/{realmId}`

Reason:

No safe local/export capability exposed the exact three existing records. Production read remains explicitly locked.

## Source Contract Verdict

`STUDENT_MISSION_CATALOG_IS_CANONICAL_STUDENT_SOURCE`

Reason:

- The repository contains a direct student catalog read method with visibility filters.
- Firestore rules/docs align authenticated student reads to `student_mission_catalog` visibility flags.
- Prior catalog access audit classifies the student catalog fields as public-safe.
- `recruitments` is still used by the current Mission Realm runtime, but it is not the safest final student source because it lacks the same explicit visibility contract.

Important nuance:

This verdict is architectural/source-contract only. It does not authorize rebinding the UI in R1A. R4E-R2 should use this after exact records are exported.

## Blocker

R1A cannot complete PASS because exact three Founder mission records were not recovered without production read.

Required next gate:

`ONE_TIME_READ_ONLY_PRODUCTION_MISSION_EXPORT`

Strict proposed scope:

- read only;
- three existing missions only;
- paths:
  - `mission_realms/{realmId}`
  - `recruitments/{same realmId}`
  - `student_mission_catalog/{same realmId}`
- no query sweep beyond required missions;
- no write;
- no update;
- no backfill;
- no deploy.

## Next After Export

After exact record export, R4E-R2 can safely perform:

- canonical Mission Realm binding;
- fake JEE runtime fallback removal from normal mission discovery;
- Dashboard fake-default cleanup;
- mojibake cleanup;
- source-backed category/count derivation.

