# RANKCRACKERS STUDENT JOURNEY FIX4-R4D

## Verdict

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4D_IMPLEMENTED_ANALYZE_PASSED_BLOCKED_BY_FRESH_SAMSUNG_INSTALL_TOOLCHAIN_VM_CRASH

This is an honest partial lock, not a full R4D visual/device acceptance. The scoped code repair is implemented and targeted analyze is clean, but a fresh Samsung reinstall could not be completed because Flutter/Dart VM crashed twice during `compileFlutterBuildDebug`.

## Baseline

- Starting HEAD: `a49758743d13c576ab3c89f45c85f0e3949e50b0`
- Samsung route: physical Samsung device `SM S911B`, serial `RZCW12FBFXZ`
- Known unrelated dirty file preserved: `android/app/build.gradle.kts`
- Known Gradle hash preserved: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Old Evidence Correction

The earlier `r4d_google_after_tap.xml` evidence is not valid RankCrackers Google-auth evidence. Parsed UI labels prove that the foreground package was `com.whatsapp` and the visible screen was WhatsApp Linked Devices. It is retained only as evidence of why that old tap proof must be rejected.

## Implemented Repair

### Google Auth Gate

- Google sign-in now has explicit stages: `GOOGLE_ACCOUNT_PICKER`, `GOOGLE_CREDENTIAL_TOKEN`, `FIREBASE_AUTH_CREDENTIAL`.
- Stage timeouts added: 25 seconds for account picker, 20 seconds for Google token, 20 seconds for Firebase credential.
- Cancellation, timeout, platform, Firebase, and unknown failures are mapped to student-readable messages.
- Raw technical details remain in debug/evidence logs only.
- Duplicate sign-in calls are denied while loading.
- Loading state is cleared on success, cancel, timeout, platform failure, Firebase failure, and unknown exception.

### Premium Login Inputs

- Email/password fields no longer use the heavy filled card style.
- Login-only fields now use a restrained transparent/near-transparent surface, thin border, and focus-responsive gold line.
- Password visibility affordance is present and does not remove password behavior.
- Google CTA now has a loading/disabled state: `Opening Google...` with spinner.

## Samsung Evidence

Fresh Samsung UI evidence after the first installed repair build confirmed RankCrackers foreground and these login labels:

- `RankCrackers`
- `SOVEREIGN IDENTITY`
- `Show password`
- `Forgot Password?`
- `LOGIN / CONTINUE`
- `Continue with Google`

After a Google tap, the app returned to the login surface without a stuck spinner. No raw technical error was visible in the captured UI.

## Validation

- `dart format`: PASS
- Targeted `flutter analyze`: PASS, no issues found
- `git diff --check`: PASS
- Fresh debug APK build/install: BLOCKED by repeated Flutter/Dart VM crash in `compileFlutterBuildDebug`

## Safety Proof

- NO_PRODUCTION_WRITE
- NO_PRODUCTION_AUTH
- NO_RULES_CHANGE
- NO_FIREBASE_CONFIG_SWAP
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_PROFILE_REDESIGN
- NO_UI_OPTION_REMOVAL

## Next Step

Do not call this full R4D visual/device PASS yet. The correct next step is:

`RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4D_R1_FRESH_SAMSUNG_INSTALL_AFTER_FLUTTER_TOOLCHAIN_STABILIZATION`

That gate should only prove a fresh Samsung install of the already-implemented repair, then capture:

- minimal premium email/password fields,
- Google CTA loading state,
- final friendly error or account chooser,
- no infinite spinner,
- no red screen,
- no production backend write.
