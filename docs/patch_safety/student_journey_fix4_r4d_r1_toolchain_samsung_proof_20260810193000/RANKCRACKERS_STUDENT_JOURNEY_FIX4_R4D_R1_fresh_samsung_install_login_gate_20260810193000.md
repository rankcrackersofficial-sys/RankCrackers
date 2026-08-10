# RANKCRACKERS STUDENT JOURNEY FIX4-R4D-R1

## Verdict

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4D_R1_BLOCKED_BY_GOOGLE_AUTH_ENVIRONMENT`

This is not a product-code regression. The R4D implementation commit `eff5dd5629675e5526efc4141239b14d4e214665` was preserved, no login product code was modified in R4D-R1, and the fresh Samsung install proof was completed. The remaining blocker is the Google/Firebase credential stage in the safe emulator-backed route.

## Baseline and Scope

- Starting HEAD: `eff5dd5629675e5526efc4141239b14d4e214665`
- Branch: `safety/rc-g2-pre-notification-schema`
- Device: Samsung `SM-S911B`, serial `RZCW12FBFXZ`
- Product code changes in R4D-R1: `NO`
- Known unrelated dirty file preserved: `android/app/build.gradle.kts`
- Required Gradle hash preserved: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Toolchain Stabilization Result

The earlier Flutter/Dart VM crash did not reproduce during the controlled verbose build. Build evidence now shows:

- Controlled verbose debug build: `EXIT_CODE=0`
- Deterministic debug build #1: `EXIT_CODE=0`
- Deterministic debug build #2: `EXIT_CODE=0`
- `TOOLCHAIN_VM_CRASH = 0` in this R4D-R1 run
- Fresh APK installed on Samsung: `Success`

APK proof:

- Path: `build/app/outputs/flutter-apk/app-debug.apk`
- Size: `230087435` bytes
- Package: `com.rankcrackers.app`
- Version: `1.0.0` / versionCode `1`
- Samsung install timestamp: `2026-08-10 20:17:48`

## Firebase Safety Route

- Firebase Auth emulator: `127.0.0.1:9099` listening
- Firestore emulator: `127.0.0.1:8080` listening
- Samsung adb reverse:
  - `tcp:9099 -> tcp:9099`
  - `tcp:8080 -> tcp:8080`
- Build dart-defines:
  - `RC_USE_FIREBASE_EMULATOR=true`
  - `RC_FIREBASE_EMULATOR_HOST=127.0.0.1`

Important evidence limitation: explicit backend diagnostic text was not found in logcat. However, the app was built with emulator defines and the local emulator route was proven before the auth test. There was no production Firestore write, no rules change, and no deploy.

## Fresh Samsung Login Visual Proof

Fresh valid PNG screenshots were captured by saving PNGs on-device and pulling them with adb. The earlier PowerShell `exec-out > file` screenshots were superseded because that route can corrupt binary PNG evidence.

Validated fresh screenshots:

- `01_login_initial_samsung_valid.png`
- `02_email_focus_samsung_valid.png`
- `03_password_focus_samsung_valid.png`
- `05_google_loading_samsung_valid.png`
- `07_google_final_state_samsung_valid.png`

UI XML verified these controls on the fresh installed app:

- `RankCrackers`
- `SOVEREIGN IDENTITY`
- `Email Address`
- `Password`
- `Show password`
- `Forgot Password?`
- `LOGIN / CONTINUE`
- `Continue with Google`

Pixel sampling from valid PNG shows the email/password interiors are low-luma restrained surfaces, not heavy raised shaded boxes. Google button remains visibly stronger, as expected for a CTA.

## Google Auth Gate Result

Google CTA lifecycle improved and proved on Samsung:

- `Opening Google...` loading state visible: `PASS`
- Google button re-enabled after terminal failure: `PASS`
- Infinite spinner count: `0`
- Raw technical error visible in captured UI: `0`
- RankCrackers foreground after final state: `PASS`

But Google sign-in did not complete. Log evidence shows the terminal failure stage:

`GOOGLE AUTH FLOW ERROR: FIREBASE_AUTH_CREDENTIAL/firebase-credential-timeout`

This means the remaining blocker is not the old visual/login input issue. It is the Google/Firebase credential completion stage in the safe emulator-backed route. Because auth did not complete, Login -> Profile transition and real profile continuity could not be accepted in this R4D-R1 gate.

## Safety Proof

- NO_PRODUCTION_READ
- NO_PRODUCTION_WRITE
- NO_RULES_CHANGE
- NO_FIREBASE_CONFIG_SWAP
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_LOGIN_REDESIGN
- NO_PROFILE_REWRITE
- NO_UI_OPTION_REMOVAL
- NO_GRADLE_SOURCE_EDIT

## Final Classification

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4D_R1_BLOCKED_BY_GOOGLE_AUTH_ENVIRONMENT`

R4D-R1 closes the Flutter VM crash blocker and proves fresh Samsung install/login visual safety. It does not close Google auth completion or Login -> Profile journey because the Firebase credential stage timed out.

## Recommended Next Phase

`R4D-R2_GOOGLE_FIREBASE_EMULATOR_CREDENTIAL_TIMEOUT_ROOT_CAUSE_AUDIT_OR_TEST_AUTH_ROUTE_DECISION`

The next phase should decide whether Google provider auth should be validated against Firebase Auth emulator, a dedicated non-production Firebase project, or a separate emulator email/test-auth route for journey QA. Do not loosen rules, do not use production Auth/Firestore, and do not proceed to full R5 until the login auth route is deterministic.
