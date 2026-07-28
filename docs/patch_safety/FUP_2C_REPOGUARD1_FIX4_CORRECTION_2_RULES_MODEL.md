# Rules Security Model - Phase FUP-2C-REPOGUARD1-FIX4-CORRECTION-2

## 1. Non-Authorizing Statement
> [!IMPORTANT]
> This document does not authorize deployment, live execution, Firestore/Storage mutation, backfill, Founder approval, second gate, or token activation.

---

## 2. Rules Model Specifications

We added the following match rules block for the root collection `student_mission_catalog` to [firestore.rules](file:///C:/RankCrackers/RankCrackers-55/firestore.rules):

```javascript
    match /student_mission_catalog/{missionId} {
      allow read: if isFounder() || (
        request.auth != null &&
        resource.data.cardVisible == true &&
        resource.data.userPanelVisible == true &&
        resource.data.archived == false
      );
      allow write: if false; // Writes only via Cloud Functions (Admin SDK)
    }
```

---

## 3. Rules Test Execution Log

We executed rules verification locally using the Firestore and Firebase Auth Emulators on ports `8080` and `9099`.

### Command:
`node functions/test_firestore_rules.js`

### Output:
```text
=========================================
FIRESTORE RULES LOCAL EMULATOR TESTS
=========================================
Creating test user in Auth Emulator...
Test user created successfully.
✅ PASS: Unauthenticated visible read = DENIED
✅ PASS: Authenticated visible read = ALLOWED
✅ PASS: Authenticated hidden read = DENIED
✅ PASS: Authenticated archived read = DENIED
✅ PASS: Client create = DENIED
✅ PASS: Client update = DENIED
✅ PASS: Client delete = DENIED
-----------------------------------------
RULES TESTS COMPLETE: Passed 7 / 7
-----------------------------------------
```

### Exit Code:
`0` (Successful check)

---

## 4. Verification Verdict
* **FirestoreRulesValidation**: `PASS` (Real local emulator tests successfully executed and passed)
