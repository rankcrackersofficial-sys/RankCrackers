# RANKCRACKERS STUDENT JOURNEY FIX4 R4E R3B

## Verdict

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4E_R3B_FOUNDER_CATEGORY_CONTRACT_REPAIR_PASSED

## Scope

This gate repairs the source-backed Competitive / Qualifying mission category path without guessing categories and without touching production data.

## Problem

Founder Panel already had a Competitive / Qualifying mission category selector, but Student Mission Realm was not reliably reading the same field from `student_mission_catalog`. As a result, Samsung validation showed the exact three missions under `CATEGORY PENDING VERIFICATION`, and the old gold Competitive / Qualifying filters above mission search were absent.

## Repair

- Founder callable mission launch now normalizes mission category through one narrow contract:
  - `competitive`
  - `qualifying`
  - otherwise `category_pending`
- Unsafe backend default category fallback to `competitive` was removed.
- Student catalog shell writes preserve normalized category into:
  - `examCategory`
  - `exam_category`
  - `missionType`
- Student Firestore mapper now reads category in this order:
  - `examCategory`
  - `exam_category`
  - `missionType`
  - legacy `category`
  - legacy `type`
  - `category_pending`
- Mission Realm restored source-backed gold category filters above search:
  - `ALL`
  - `COMPETITIVE`
  - `QUALIFYING`
- Mission grouping now shows source-backed sections only when exact category values exist.
- Unknown, missing, empty, or unverified category remains under `CATEGORY PENDING VERIFICATION`.
- Mission category matching is exact, not substring/guess based.
- Smart Start / Diagnostic screen received a narrow overflow-safety repair:
  - bottom CTA moved into a bottom SafeArea with smaller minimum padding
  - metric grid made less vertically tight
  - metric cards no longer depend on Spacer in compact grid cells

## Important Truth Lock

Existing exported three Founder missions still do not get guessed into Competitive or Qualifying. Until their category is source-backed or Founder explicitly confirms historical category mapping, they remain pending verification.

Future missions created through Founder Panel with a valid category should now propagate end-to-end:

Founder category selector -> callable payload -> mission_realms / recruitments -> student_mission_catalog -> Flutter model -> Mission Realm category filters.

## Validation

- `node --check functions/callable/handle_sentinel_action.js`: PASS
- `node --check functions/backfill_student_mission_catalog.js`: PASS
- `flutter analyze lib/core/firebase/firestore_service.dart lib/features/auth/presentation/screens/mission_realm_screen.dart lib/features/onboarding/presentation/screens/diagnostic_test_screen.dart`: PASS
- `flutter test test/student_journey/student_journey_fix4_r4e_r2_contract_test.dart`: PASS
- Gradle guard hash: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Safety Proof

NO_PRODUCTION_READ
NO_PRODUCTION_WRITE
NO_RULES_CHANGE
NO_DEPLOY
NO_STUDENT_PUBLISH
NO_FIREBASE_CONFIG_SWAP
NO_GRADLE_TOUCH
NO_CATEGORY_GUESSING
NO_HARDCODED_2_COMPETITIVE_1_QUALIFYING

## Remaining Work

R4E-R3 Samsung Mission Realm + Dashboard validation should be rerun after this contract repair. The device proof must show what appears on Samsung with emulator/non-production backend. Dashboard validation remains pending.
