# RANKCRACKERS STUDENT JOURNEY FIX4-R1

## Live Profile Establishment Validation - Safe Non-Production Gate

Verdict: `RANKCRACKERS_STUDENT_JOURNEY_FIX4_R1_BLOCKED_BY_PRODUCTION_BACKEND_CONFIGURATION`

## Baseline

- Required baseline: `4b5d5a0cae40655cf41228626a184053b1508313`
- Current HEAD: `4b5d5a0cae40655cf41228626a184053b1508313`
- Known unrelated dirty file allowed: `android/app/build.gradle.kts`
- Gradle hash: `4319efa3f9e08cc36fa19ee480112de9edb938f4`
- Required Gradle hash: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Safety Decision

The R1 validation was not executed against the live app because the current app configuration points at the production Firebase project.

No production Firestore write was attempted.

## Configuration Findings

Production project references found:

- `.firebaserc` default project: `rankcrackers-55`
- `lib/firebase_options.dart` Android projectId: `rankcrackers-55`
- `lib/firebase_options.dart` Web projectId: `rankcrackers-55`
- `android/app/google-services.json` project_id: `rankcrackers-55`

Emulator config exists in `firebase.json`:

- Auth emulator: `127.0.0.1:9099`
- Firestore emulator: `127.0.0.1:8080`
- Emulator UI: `127.0.0.1:4000`

But no app-side emulator connection hook was found in `lib/` for:

- `useFirestoreEmulator`
- `useAuthEmulator`
- `FIRESTORE_EMULATOR_HOST`
- `FIREBASE_AUTH_EMULATOR_HOST`

Therefore running real UI profile establishment now would target production Firebase.

## Required Validation Not Performed

Not performed because it would risk production write:

- Authenticated UID proof through real app UI
- `users/{uid}` profile write success
- post-write read-back
- loading CTA capture
- `IDENTITY ESTABLISHED` success seal capture

## FIX4 Repair Status

The client-contract repair remains accepted:

- privileged fields removed from client profile save payload
- Firestore rules unchanged
- profile path unchanged: `users/{uid}`
- operation unchanged: merge-set

Privileged fields that must not be sent by profile setup client write:

- `role`
- `accessLevel`
- `founder`
- `admin`

## Safety Proof

- NO_PRODUCTION_WRITE_ATTEMPTED
- NO_FIRESTORE_WRITE
- NO_FIRESTORE_RULES_CHANGE
- NO_AUTH_CHANGE
- NO_SCHEMA_CHANGE
- NO_ROUTE_CHANGE
- NO_STUDENT_DELIVERY
- NO_DEPLOY
- ANDROID_GRADLE_HASH_PRESERVED

## Recommended Next Gate

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R2_EMULATOR_PROFILE_VALIDATION_WIRING_PREP`

Purpose:

- Add or identify a debug/test-only emulator connection path for Auth + Firestore.
- Keep production Firebase untouched.
- Then run actual Profile Setup UI against emulator/non-production only.
- Capture loading and `IDENTITY ESTABLISHED` success seal from a real successful non-production save.