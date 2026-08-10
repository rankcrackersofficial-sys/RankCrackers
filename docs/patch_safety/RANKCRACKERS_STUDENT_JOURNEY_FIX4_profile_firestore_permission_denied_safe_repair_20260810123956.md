# RANKCRACKERS STUDENT JOURNEY FIX4

## Profile Firestore Permission-Denied Root-Cause Audit and Safe Repair

Verdict target: RANKCRACKERS_STUDENT_JOURNEY_FIX4_PROFILE_FIRESTORE_PERMISSION_DENIED_SAFE_REPAIR_PASSED

## Starting State

- Starting HEAD: $head
- Known unrelated dirty file: ndroid/app/build.gradle.kts
- Gradle hash: $gradleHash
- Required Gradle hash: 4319efa3f9e08cc36fa19ee480112de9edb938f4

## Exact Failing Contract

Profile setup writes after local session save/navigation.

App-side caller:

- lib/features/auth/presentation/screens/unified_identity_screen.dart

Service:

- lib/core/firebase/firestore_service.dart
- Method: FirestoreService.saveUserProfile

Firestore path:

- users/{uid}

Operation:

- set(profileData, SetOptions(merge: true))

Expected auth:

- equest.auth.uid == uid

Payload from profile setup:

- 
ame
- city
- state
- mobile
- onboardingCompleted
- selectedExam
- selectedExamName
- updatedAt
- email
- photoUrl

## Rule Contract

Current irestore.rules for users/{userId}:

- create allowed when signed-in user writes own doc
- update allowed when signed-in user writes own doc
- update explicitly rejects changes to sensitive fields:
  - ole
  - ccessLevel
  - ounder
  - dmin

This rule is correct and was not weakened.

## Root Cause

FirestoreService.saveUserProfile injected privileged fields when the UID matched FounderIdentity.founderUid:

- ole = founder
- dmin = true
- ounder = true
- ccessLevel = 9

That made a personal profile setup write attempt modify sensitive governance fields from the client. The rule correctly rejects that update, producing permission-denied.

## Safe Repair

Removed only the client-side privileged-field injection from saveUserProfile.

Profile setup remains allowed to write personal profile fields only.

Founder/admin identity remains read-side/governance-side through:

- auth claims
- founder identity checks
- dedicated founder/read-side role injection logic in etchUserProfile

## Verification

- dart analyze lib\core\firebase\firestore_service.dart: PASS
- Firestore rules: UNCHANGED
- Auth logic: UNCHANGED
- Profile payload fields: UNCHANGED
- Profile write path: UNCHANGED
- Operation remains merge-set to users/{uid}
- Gradle hash preserved: $gradleHash

## Safety Proof

- NO_FIRESTORE_RULES_LOOSENING
- NO_AUTH_CHANGE
- NO_PROFILE_SCHEMA_EXPANSION
- NO_ROUTE_CHANGE
- NO_STUDENT_DELIVERY
- NO_DEPLOY
- NO_ATOMIC_CELL_MUTATION
- ANDROID_GRADLE_HASH_PRESERVED

## Remaining Proof Needed

A live authenticated device run should now verify:

- profile setup no longer red-screens on background cloud sync
- CLOUD SYNC COMPLETE appears for the profile write
- loading/success IDENTITY ESTABLISHED visual path can be captured from the real flow
