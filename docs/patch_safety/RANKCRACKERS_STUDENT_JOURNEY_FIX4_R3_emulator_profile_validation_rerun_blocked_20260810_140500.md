# RANKCRACKERS STUDENT JOURNEY FIX4-R3 RERUN

Verdict: RANKCRACKERS_STUDENT_JOURNEY_FIX4_R3_BLOCKED_BY_PRE_PROFILE_EMULATOR_RECRUITMENTS_RULE_CONTRACT

This is not a profile establishment pass. The app correctly launched in explicit Firebase emulator mode, but the real Profile Setup save/read-back path was not reached because an earlier student journey read failed against Firestore Emulator rules.

## Baseline

- Starting HEAD: 8fe0915d888b89b43c6c012ad89cdd0236e4a108
- Known unrelated dirty file: android/app/build.gradle.kts
- Known unrelated Gradle hash preserved: 4319efa3f9e08cc36fa19ee480112de9edb938f4
- Android target used: emulator-5554 / RankCrackers_QA_API35
- Firebase Auth Emulator: 127.0.0.1:9099
- Firestore Emulator: 127.0.0.1:8080
- Android emulator app host route: 10.0.2.2

## What Passed

- Android emulator target was available.
- Firebase Auth and Firestore emulators started locally.
- App launched with explicit Dart defines:
  - RC_USE_FIREBASE_EMULATOR=true
  - RC_FIREBASE_EMULATOR_HOST=10.0.2.2
- Startup diagnostic proved emulator backend:

```text
RC_FIREBASE_BACKEND=EMULATOR auth=10.0.2.2:9099 firestore=10.0.2.2:8080
```

- No production backend fallback was observed in startup logs.

## Blocking Failure

Before Profile Setup save/read-back could be executed, the app routed through `/login` and attempted to read the `recruitments` collection from Firestore Emulator. That read was denied by the current rules/query contract:

```text
Listen for Query(target=Query(recruitments order by __name__);limitType=LIMIT_TO_FIRST) failed: Status{code=PERMISSION_DENIED, description=
Property status is undefined on object. for 'list' @ L44, cause=null}
[cloud_firestore/permission-denied] The caller does not have permission to execute the specified operation.
publishedRecruitmentsProvider.<anonymous closure> (package:rank_crackers/features/auth/presentation/providers/mission_realm_provider.dart:11:47)
```

Therefore the following R3 targets remain unproven:

- users/{uid} emulator write
- users/{uid} emulator read-back
- before-write payload key capture from the real submit path
- stored key set after write
- real loading state screenshot
- real IDENTITY ESTABLISHED seal screenshot

## Interpretation

This is not a production write failure. It is an emulator-only pre-profile access contract blocker. The app did not proceed to production Firestore, and there is no evidence of production Auth or production Firestore usage in this R3 rerun.

The likely next phase should be narrow:

1. Audit `publishedRecruitmentsProvider` and the `recruitments` read contract.
2. Audit Firestore rule line 44 for list/query expectations.
3. Decide whether the emulator needs a valid seed recruitment document, or whether the app/rules contract needs a safe repair.
4. Do not loosen rules blindly.
5. Do not run profile save until the pre-profile emulator read path is unblocked safely.

## Evidence Files

- Flutter run log: docs/patch_safety/rankcrackers_fix4_r3_flutter_run_emulator.log
- Flutter run stderr log: docs/patch_safety/rankcrackers_fix4_r3_flutter_run_emulator.err.log
- Firebase emulator stdout log: docs/patch_safety/rankcrackers_fix4_r3_firebase_emulators.out.log
- Firebase emulator stderr log: docs/patch_safety/rankcrackers_fix4_r3_firebase_emulators.err.log

## Safety Proof

- NO_PRODUCTION_WRITE
- NO_PRODUCTION_AUTH_OBSERVED
- NO_RULES_CHANGE
- NO_FIREBASE_CONFIG_SWAP
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_PROFILE_REDESIGN
- NO_PROFILE_SAVE_COMPLETED
- NO_USERS_UID_WRITE_COMPLETED
