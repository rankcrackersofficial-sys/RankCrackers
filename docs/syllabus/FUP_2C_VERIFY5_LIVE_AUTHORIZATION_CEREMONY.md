# Founder Approval Ceremony Document
**Patch ID:** FUP-2C-VERIFY5-LIVE-AUTH-CEREMONY-1
**Status:** PENDING_FOUNDER_APPROVAL

## 1. Mission
`jee_main_2026`

## 2. Target Collection & Document
`system_verification_sandbox/SANDBOX_TEST_DOC_001`

## 3. Mutation Type
One-document sandbox verification create only.

## 4. Explicit Non-Academic Nature
This mutation is strictly non-academic:
- Not `syllabus_atoms`
- Not `topic_nodes`
- Not student content
- Not publish
- Not approval
- Not Crucible
- Not DigiBook
- Not academic production data

## 5. Maximum Mutation Budget
- **create:** 1
- **update:** 0
- **delete:** 0 (during create phase)

## 6. Abort Conditions
The execution must immediately abort if any of the following conditions are met:
- Wrong branch (must be `safety/rc-g2-pre-notification-schema`)
- Wrong project (must be `rankcrackers-55`)
- Wrong commit (must be `2e04e192c975134bff3c689d8cf4fb9ce8295d0d`)
- Wrong collection (must be `system_verification_sandbox`)
- Wrong document ID (must be `SANDBOX_TEST_DOC_001`)
- Target already exists in the live Firestore
- Deployed rules evidence insufficient if client-boundary test is required
- Missing second gate
- Missing active live token
- Token expired
- Reused token
- Payload checksum mismatch
- Rollback checksum mismatch
- Emulator host present
- Mutation budget exceeded
- Any attempt outside sandbox path

## 7. Founder Approval Text Block

```text
I, Founder of RankCrackers, authorize exactly one sandbox verification write to:
system_verification_sandbox/SANDBOX_TEST_DOC_001

I do not authorize syllabus_atoms writes.
I do not authorize topic_nodes writes.
I do not authorize student publish.
I do not authorize Crucible or DigiBook generation.
I do not authorize production academic mutation.
```

## 8. Approval Status
**Founder Explicit Live Approval:** false
(This must remain false until the Founder explicitly provides the exact text block above.)
