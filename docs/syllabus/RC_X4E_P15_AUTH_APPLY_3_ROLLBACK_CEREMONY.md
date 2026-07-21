# Founder Rollback Authorization Ceremony — RC-X4E-P15-AUTH-APPLY-3 Simulated Text Incident

## 1. Incident Identity
RC-X4E-P15-AUTH-APPLY-3 simulated text incident

## 2. Incident Verdict
RC_X4E_P15_AUTH_APPLY_3_IR1_SIMULATED_TEXT_CONFIRMED

## 3. Incident Type
FAKE_PAGE_EXTRACTION_WRITE

## 4. Severity
CRITICAL

## 5. Rollback Purpose
Remove corrupt simulated page records and restore affected queue tasks to queued status to allow for a proper native extraction apply later.

## 6. Exact Affected Page Records to Delete
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/1`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/2`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/3`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/4`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/5`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/6`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/7`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/8`
- `mission_realms/neet_(ug)-2027/official_documents/hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925/page_extractions/9`

## 7. Exact Task Docs to Reset
- `ai_queue/rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b1_p1_3`
- `ai_queue/rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b2_p4_6`
- `ai_queue/rc_x4a_pagewise_neet__ug__2027_hash_2b688f32bc58e5d5acdc4d61c8e6795a81419c40887a7e5c40b7d163174b4925_b3_p7_9`

## 8. Allowed Rollback Mutation Budget
- **Delete page_extractions**: 9
- **Update queue tasks**: 3
- **Total Max Writes/Deletes**: 12

## 9. Explicitly Not Authorized
- No delete outside pages 1–9.
- No queue reset outside the 3 specified tasks.
- No parent official document update.
- No syllabus_atoms write/delete.
- No topic_nodes write/delete.
- No student publish change.
- No deploy.
- No AI/OCR.
- No re-apply in the same patch.
- No Token-4 generation in the same patch.
- No VESTA/city changes.
