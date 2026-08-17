# AAF-PREQ-08 006J Commit Authority Reconciliation

## Verdict

AAF_PREQ_08_006J_COMMIT_AUTHORITY_RECONCILIATION_PASSED_WITH_MIXED_SCOPE_CAVEAT

## Finding

AAF-006J evidence is valid and tracked, but it is not in an exclusive AAF-006J commit. The evidence files were included in mixed commit:

$mixed

Commit subject:

$subject

That commit also contains unctions/src/test/aafRegistry.test.ts. Therefore AAF-006J authority applies only to the eight AAF-006J evidence paths, not to test/backend files.

## 006J Evidence Status

- AAF-006J verdict: AAF_006J_IMMUTABLE_VERIFICATION_RESULT_LEDGER_AND_CLAIM_BINDING_READY
- Wave-1 total: 10
- Total substantive claims: 552
- Result ledger attack classes passed: 18
- Result ledger attack classes failed: 0
- Real verification results ingested: 0
- Publication eligible: FALSE
- Ledger regeneration required: NO

## Authority Boundary

- AAF-006J exclusive commit: NO
- AAF-006J evidence status: VALID_TRACKED_IN_MIXED_COMMIT
- Product/test authority granted by 006J: NO

## Safety

- MODEL_FACT_CHECK_USED: NO
- FIREBASE_READ: NO
- FIREBASE_WRITE: NO
- QUEUE_WRITE: NO
- PUBLICATION: NO
- CANONICAL_CONTENT_MODIFIED: NO
- PRODUCT_CODE_MODIFIED_BY_THIS_RECONCILIATION: NO

## Final Line

AAF_006J_EVIDENCE_VALID_BUT_TRACKED_IN_MIXED_COMMIT_4CA9A8F719C39A4E3A98F08CC975D4D8088BDEF1
