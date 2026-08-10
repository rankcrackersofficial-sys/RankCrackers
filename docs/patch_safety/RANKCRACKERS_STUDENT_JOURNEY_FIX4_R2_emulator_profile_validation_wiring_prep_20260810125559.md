# RANKCRACKERS STUDENT JOURNEY FIX4-R2

## Emulator Profile Validation Wiring Prep

Verdict target: RANKCRACKERS_STUDENT_JOURNEY_FIX4_R2_EMULATOR_PROFILE_VALIDATION_WIRING_PREP_PASSED

## Baseline

- Starting HEAD: $head
- Required R1 accepted baseline: c94ff10d6798426f6a722d713bbf599bf1ab84b4
- Known unrelated dirty file: ndroid/app/build.gradle.kts
- Gradle hash: $gradleHash
- Required Gradle hash: 4319efa3f9e08cc36fa19ee480112de9edb938f4

## Files Modified

- lib/core/firebase/firebase_emulator_config.dart
- lib/main.dart
- 	est/student_journey/student_journey_fix4_r2_emulator_config_test.dart
- Evidence-only formatting repair: docs/patch_safety/RANKCRACKERS_STUDENT_JOURNEY_FIX4_R1_safe_nonprod_validation_blocked_20260810124520.md

## Opt-In Mechanism

Default launch remains production config:

- RC_USE_FIREBASE_EMULATOR=false by default

Explicit QA emulator launch requires:

- --dart-define=RC_USE_FIREBASE_EMULATOR=true
- --dart-define=RC_FIREBASE_EMULATOR_HOST=<explicit host>

Optional port overrides:

- --dart-define=RC_FIREBASE_AUTH_EMULATOR_PORT=9099
- --dart-define=RC_FIRESTORE_EMULATOR_PORT=8080

For Android emulator, likely host is 10.0.2.2. For a physical Android device, use an explicit host strategy such as adb reverse or LAN host. This was not hard-coded.

## Wiring Behavior

The app now calls emulator configuration immediately after Firebase.initializeApp and before SessionManager.initialize, Auth, or Firestore reads/writes.

When emulator mode is disabled:

- app logs RC_FIREBASE_BACKEND=PRODUCTION_CONFIG_DEFAULT
- no emulator connection calls are made
- production Firebase options remain unchanged

When emulator mode is enabled:

- Auth emulator connects to the explicit host/port
- Firestore emulator connects to the same explicit host/port family
- app logs RC_FIREBASE_BACKEND=EMULATOR auth=<host>:<port> firestore=<host>:<port>

Fail-closed behavior:

- emulator mode with empty host throws StateError
- invalid ports throw StateError
- release mode rejects emulator mode
- no silent fallback to production when emulator mode is misconfigured

## Verification

- dart analyze lib/main.dart lib/core/firebase/firebase_emulator_config.dart: PASS
- lutter test test/student_journey/student_journey_fix4_r2_emulator_config_test.dart: PASS, 4/4
- lutter build apk --debug: PASS

## Not Performed In R2

- No live profile save
- No Firestore write
- No Auth emulator user creation
- No production backend call
- No deploy

## Safety Proof

- NO_PRODUCTION_WRITE
- NO_FIRESTORE_WRITE
- NO_FIRESTORE_RULES_CHANGE
- NO_AUTH_SCHEMA_CHANGE
- NO_FIREBASE_OPTIONS_REPLACEMENT
- NO_GOOGLE_SERVICES_REPLACEMENT
- NO_FIREBASERC_CHANGE
- NO_DEPLOY
- ANDROID_GRADLE_HASH_PRESERVED

## Next Gate

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R3_EMULATOR_PROFILE_ESTABLISHMENT_SAVE_READBACK_VALIDATION

R3 will start Auth + Firestore emulators, launch app with explicit Dart defines, run Profile Setup UI, verify users/{uid} write/read-back, and capture loading plus IDENTITY ESTABLISHED success seal. Production remains untouched.