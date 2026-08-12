# RANKCRACKERS Student Journey FIX4 R4E R3A

## Verdict

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4E_R3A_SAMSUNG_AUTH_GATE_PASSED_WITH_GOOGLE_ROUTE_FIX

## Baseline

- Starting HEAD: `0e22e31f6baa646cae40e8a1cb7df5e1ccbcd305`
- Device: Samsung SM-S911B
- Serial: `RZCW12FBFXZ`
- Backend mode: Firebase Emulator / non-production only
- Auth emulator: `127.0.0.1:9099` through `adb reverse`
- Firestore emulator: `127.0.0.1:8080` through `adb reverse`
- Gradle hash preserved: `4319efa3f9e08cc36fa19ee480112de9edb938f4`

## Repair Applied

The login/profile route could remain on the login screen after a successful Google FirebaseAuth sign-in because the profile screen decision used only the provider snapshot. The repair keeps the provider path, but allows the UI to recognize an already-established FirebaseAuth user:

`authState.user ?? FirebaseAuth.instance.currentUser`

This is not an auth bypass. The fallback only works when FirebaseAuth already has a real authenticated user.

## Email Flow Proof

- `E01_LOGIN_BUTTON_PRESSED`: PASS
- `E02_FORM_VALIDATION_PASS`: PASS
- `E03_FIREBASE_EMAIL_SIGNIN_STARTED`: PASS
- `E03_FIREBASE_EMAIL_CREATE_STARTED`: PASS
- `E04_FIREBASE_EMAIL_CREATE_RETURNED`: PASS
- `E05_AUTH_STATE_USER_PRESENT`: PASS
- `E06_ROUTE_DECISION_STARTED`: PASS
- `E07_ROUTE_DECISION_COMPLETE`: PASS

Result: Email/password flow reached Firebase Auth Emulator user state and legitimate profile setup route.

## Google Flow Proof

- `G00_PREVIOUS_GOOGLE_SESSION_CLEAR_STARTED`: PASS
- `G00_PREVIOUS_GOOGLE_SESSION_CLEAR_COMPLETE`: PASS
- `G01_GOOGLE_BUTTON_PRESSED`: PASS
- `G02_ACCOUNT_PICKER_REQUESTED`: PASS
- `G03_ACCOUNT_PICKER_RETURNED`: PASS
- `G04_ACCOUNT_SELECTED`: PASS
- `G05_GOOGLE_AUTH_REQUESTED`: PASS
- `G06_GOOGLE_AUTH_RETURNED`: PASS
- `G07_ID_TOKEN_PRESENT=true`: PASS
- `G08_ACCESS_TOKEN_PRESENT=true`: PASS
- `G09_FIREBASE_CREDENTIAL_CREATED`: PASS
- `G10_FIREBASE_SIGNIN_STARTED`: PASS
- `G11_FIREBASE_SIGNIN_RETURNED`: PASS
- `G12_AUTH_STATE_USER_PRESENT`: PASS
- `G13_ROUTE_DECISION_STARTED`: PASS
- `G14_ROUTE_DECISION_COMPLETE`: PASS

Result: Google account picker was visible, Google credential returned, Firebase Auth Emulator user was present, and the app reached the Profile Setup / Sovereign Identity route.

## User-Reported Issues Closed In This Gate

- Continue with Google no longer remains stuck on the login page after successful credential return.
- Google account picker path is proven; this run did not silently auto-pick a Gmail account.
- Email/password login fields remain in the premium/minimal style already repaired earlier.
- The profile route can now reflect a real FirebaseAuth user even if the provider snapshot lags for a frame.

## Evidence Handling

Raw screenshots and XML dumps were intentionally not committed because they contain personal Google account identifiers. This file records only sanitized markers and route results.

Known validation hazards encountered and isolated:

- Android 16 app compatibility dialog could block automation taps until dismissed.
- External app focus contamination occurred in earlier attempts and was not used as final proof.
- Final accepted proof used the RankCrackers foreground activity.

## Safety Proof

- NO_PRODUCTION_READ
- NO_PRODUCTION_WRITE
- NO_RULES_CHANGE
- NO_DEPLOY
- NO_STUDENT_PUBLISH
- NO_FIREBASE_CONFIG_SWAP
- NO_GRADLE_TOUCH

## Next Gate

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4E_R3

Samsung canonical Mission Realm and Dashboard validation can resume only after this auth gate. That next gate must verify:

- JEE Main 2027, NEET (UG)-2027, and RPSC 1st Grade from canonical emulator fixture
- no synthetic fallback mission
- no fake dashboard values
- selected mission context propagates correctly to Dashboard
