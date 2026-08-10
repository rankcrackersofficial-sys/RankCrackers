# RANKCRACKERS STUDENT JOURNEY FIX4-R4

## Verdict

RANKCRACKERS_STUDENT_JOURNEY_FIX4_R4_PROFILE_MISSION_PARITY_AND_ERROR_REPAIR_PASSED_WITH_EVIDENCE_LIMITATIONS

This phase was targeted repair only. It did not deploy, did not change Firestore rules, did not write production Firestore, did not publish student content, did not fabricate missions, and did not move Target Mission back onto the Profile page.

## Baseline

- Required lineage included: bf17498e8e08c47c1fd8f8a74965eb3296750855
- Starting HEAD for this phase: bf17498e8e08c47c1fd8f8a74965eb3296750855
- Known unrelated dirty file preserved: android/app/build.gradle.kts
- Required Gradle hash preserved: 4319efa3f9e08cc36fa19ee480112de9edb938f4

## Founder Correction Lock

Target Mission must not be on the Profile / Sovereign Identity page.

Current flow remains:

Profile / Sovereign Identity
-> establish identity only
-> Mission Realm
-> select target mission there

The Profile page does not contain Target Mission selection. Mission selection remains in Mission Realm.

## Profile Tonal Balance Repair

The Sovereign Identity page was too dark / near-black. The repair was limited to tonal hierarchy:

- deep navy page/card layering
- clearer profile card separation
- lifted input surfaces
- profile photo area given stronger premium separation
- existing metallic-gold ESTABLISH IDENTITY CTA preserved
- no profile rewrite
- no validation/auth/schema change

Physical Pixel evidence captured:

- pixel5_profile_tonal_latest.png
- pixel5_profile_tonal_latest_ui.xml

UI hierarchy proof includes:

- RankCrackers
- SOVEREIGN IDENTITY
- Profile Photo
- ESTABLISH IDENTITY

## Mission Realm Availability And Placement

### Source audit

Founder mission list source:

- widget: lib/features/admin/presentation/widgets/upload_center/widgets/mission_list.dart
- repository: RecruitmentRepository.stream()
- Firestore source: recruitments collection, no published-only filter

Student Mission Realm source:

- widget: lib/features/auth/presentation/screens/mission_realm_screen.dart
- provider: publishedRecruitmentsProvider
- repository: RecruitmentRepository.streamPublished()
- Firestore source: recruitments where status == published
- student filters: selectedState/Central + examCategory

Therefore Founder count and Student count are not required to match. Founder may see all missions; Student must see only eligible published missions that pass student filters.

### Emulator/local truth

The local Firestore emulator recruitment collection could not be used as authoritative mission truth because the emulator read contract still returns:

Property status is undefined on object. for list @ L44

To keep the non-production physical QA route usable without production reads, an emulator-only fallback loads existing repo canonical preview source:

assets/data/preview/jee_main_2027/assessment_preview_manifest.json

This fallback is active only when:

RC_USE_FIREBASE_EMULATOR=true

Production/default mode continues to use Firestore stream directly.

### Physical Pixel proof

Physical Pixel 5 device:

- 11251FDD4003TB

Backend proof:

- RC_FIREBASE_BACKEND=EMULATOR auth=192.168.1.8:9099 firestore=192.168.1.8:8080

Mission Realm physical UI proof:

- pixel5_final_mission_realm_attempt.png
- pixel5_final_mission_realm_attempt_ui.xml
- pixel5_mission_selected.png
- pixel5_mission_selected_ui.xml

Visible UI hierarchy proof includes:

- Mission Realm
- Select the mission you are preparing to dominate.
- COMPETITIVE
- QUALIFYING
- SEARCH MISSION
- COMPETITIVE MISSIONS
- JEE Main 2027
- Central • 2027
- SMART START
- QUICK START

This proves the Target Mission appears on the Mission Realm page, not the Profile page.

## Red-Screen / Runtime Error Repair

A real Flutter debug assertion was reproduced in physical-device logs:

ListTile background color or ink splashes may be invisible.

Root cause:

Mission Realm mission card placed a ListTile inside a decorated container without its own Material ancestor.

Repair:

The Mission Realm ListTile is wrapped in a transparent Material so Flutter ink/background behavior has the correct Material surface.

Final log scan did not reproduce the same ListTile assertion after the repair. Final route logs show app routed to /mission-realm on emulator backend.

## Knowledge Map Empty State Repair

Video showed rough state:

NO KNOWLEDGE MATRIX FOUND / RETRY SYNC

This was not accepted as premium student language. The route now shows a truthful first-use state:

- DigiBook is preparing your first map
- explains no matrix is available in this test session yet
- explicitly says no mastery/study data has been invented
- retry action changed to Check again / Checking...

No fake mastery data was created.

Visual rerun for this exact Knowledge Map state is still recommended in the next device QA pass.

## Android Back Swipe Repair

User reported Android back swipe exits the app from anywhere. MainNavigationShell now uses a PopScope guard:

- from non-dashboard bottom-nav tabs, back returns to Dashboard
- from Dashboard/root, accidental app exit is blocked
- bottom navigation UI/options unchanged

This is a targeted route safety repair, not a redesign.

Physical back-swipe visual proof is still recommended in the next device QA pass.

## Validation

- dart format: PASS on targeted files
- flutter analyze targeted files: PASS, no issues found
- physical Pixel app foreground: PASS
- Mission Realm visual hierarchy: PASS
- Mission card expand actions: PASS
- production Firestore write: NO
- production Firestore read: NO
- Firestore rules change: NO
- deploy: NO
- student publish: NO
- Gradle hash preserved: 4319efa3f9e08cc36fa19ee480112de9edb938f4

## Evidence Files

- flutter_run_pixel5_final2_stdout.log
- flutter_run_pixel5_final2_stderr.log
- pixel5_profile_tonal_latest.png
- pixel5_profile_tonal_latest_ui.xml
- pixel5_final_mission_realm_attempt.png
- pixel5_final_mission_realm_attempt_ui.xml
- pixel5_mission_selected.png
- pixel5_mission_selected_ui.xml

## Remaining Honest Limitations

- Founder-vs-student 3 mission discrepancy was audited at source-path level, but exact 3-mission production truth was not read because production read is prohibited.
- Emulator has an existing recruitments rules/fixture mismatch; fallback uses only existing repo preview source in emulator mode.
- Knowledge Map new empty state is code/analyze repaired, but fresh physical screenshot is still pending.
- Back-swipe guard is code/analyze repaired, but fresh physical gesture proof is still pending.

## Safety Proof

NO_PRODUCTION_READ
NO_PRODUCTION_WRITE
NO_RULES_CHANGE
NO_AUTH_ARCHITECTURE_CHANGE
NO_DEPLOY
NO_STUDENT_PUBLISH
NO_MISSION_FABRICATION
NO_HARDCODE_3_MISSIONS
NO_UI_OPTION_REMOVAL
NO_GRADLE_TOUCH