# FUP-2C-VERIFY5 Sandbox Rollback Authorization Ceremony

This ceremony document defines the authorization protocols for deleting exactly one sandbox verification document from the system.

## 1. Purpose
The purpose is to safely delete the sandbox document created for VERIFY5 without impacting any academic or production configurations.

## 2. Target Path
* **Collection**: `system_verification_sandbox`
* **Document ID**: `SANDBOX_TEST_DOC_001`
* **Path**: `system_verification_sandbox/SANDBOX_TEST_DOC_001`

## 3. Mutation Budget
* **Create**: `0`
* **Update**: `0`
* **Delete**: `1`

## 4. Non-Academic Nature
This operation is strictly non-academic. It must not touch:
* `syllabus_atoms`
* `topic_nodes`
* `page_extractions`
* Student progress or catalog data
* Crucible or DigiBook configurations
* Publishing state

## 5. Abort Conditions
The rollback operation must abort immediately if any of the following occur:
* Execution branch is not `safety/rc-g2-pre-notification-schema`
* Project ID is not `rankcrackers-55`
* Commit HEAD is not `d68c5bd5f9ca1e5d68a8589862f6c8729f0488a8`
* Target document `system_verification_sandbox/SANDBOX_TEST_DOC_001` does not exist before delete
* Token has expired or is invalid
* Token has been reused
* Missing explicit Founder rollback approval
* Hash verification mismatch
* Emulator environment is detected
* Mutation budget exceeded

## 6. Founder Rollback Approval
The Founder of RankCrackers explicitly authorizes this rollback using the following phrase:

> I, Founder of RankCrackers, authorize exactly one sandbox verification delete at system_verification_sandbox/SANDBOX_TEST_DOC_001. I do not authorize syllabus_atoms writes or deletes. I do not authorize topic_nodes writes or deletes. I do not authorize page_extractions writes or deletes. I do not authorize student publish. I do not authorize Crucible or DigiBook generation. I do not authorize production academic mutation.
