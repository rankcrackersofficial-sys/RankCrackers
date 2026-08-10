# RANKCRACKERS STUDENT JOURNEY FIX4-R4D-FIX1

## Verdict
RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4D_FIX1_BLOCKED_BY_ANDROID_OAUTH_APP_IDENTITY

## What Was Proven
- Google auth implementation: LEGACY_GOOGLE_SIGN_IN (`google_sign_in` 6.3.0).
- Android package in app: `com.rankcrackers.app`.
- Firebase project: `rankcrackers-55`.
- `google-services.json` contains Android OAuth client and Web/client type entry.
- Samsung target: SM-S911B / RZCW12FBFXZ.
- Google Play Services is present on Samsung.

## Root Cause
The local debug build signing SHA-1 does not match the Android OAuth client certificate hash in `android/app/google-services.json`.

Firebase Android OAuth SHA-1:
`
D8:FA:24:96:36:ED:3C:E0:ED:47:28:2C:10:23:7A:EC:40:21:A1:5D
`

Local debug keystore SHA-1:
`
A8:96:3A:09:E3:48:5D:B7:60:6B:5B:CE:96:CA:74:F7:04:86:89:1C
`

Local debug keystore SHA-256:
`
63:F1:15:2E:55:E7:A1:74:FA:B5:86:C8:8D:28:05:0D:E3:29:3A:80:82:D4:25:D3:15:6F:F6:6F:0E:B7:29:4B
`

Package matches, but signing identity does not. This is enough to block reliable Android Google Sign-In and should not be hacked around in Flutter code.

## Product UI Change Kept
The email/password input surfaces were restyled toward the same minimal premium family as the Google and login buttons. They are no longer heavy/shaded containers.

## Google Auth Change
No auth bypass was added. Timeout increase was not kept as a solution. Firebase credential timeout remains 20 seconds.

## Required External Configuration Repair
Register the current debug SHA-1/SHA-256 for package `com.rankcrackers.app` in Firebase/Google Android OAuth configuration, then download/review the updated `google-services.json` before rerunning Samsung Google sign-in proof.

## Safety Proof
- NO_PRODUCTION_FIRESTORE_READ
- NO_PRODUCTION_FIRESTORE_WRITE
- NO_RULES_CHANGE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_GOOGLE_AUTH_BYPASS
- NO_FAKE_AUTH_USER
- NO_FIREBASE_CONFIG_SWAP
- Gradle hash preserved: `
4319efa3f9e08cc36fa19ee480112de9edb938f4
`

## Worktree Before Commit
```text
M android/app/build.gradle.kts
 M lib/features/auth/presentation/screens/unified_identity_screen.dart
?? docs/patch_safety/student_journey_fix_login_google_repair_20260810204000/
```
