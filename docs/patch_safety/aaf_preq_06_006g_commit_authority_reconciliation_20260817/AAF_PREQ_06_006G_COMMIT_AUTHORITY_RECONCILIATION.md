# AAF-PREQ-06 006G Commit Authority Reconciliation

## Verdict

AAF_PREQ_06_006G_COMMIT_AUTHORITY_RECONCILIATION_PASSED_WITH_MIXED_SCOPE_CAVEAT

## Finding

AAF-006G evidence is valid and tracked, but it is not in an exclusive AAF-006G commit. The evidence files were included in mixed commit:

97eae067873403bdf09926576cea4c643b439c9e

Commit subject:

$subject

That commit also contains AAF-004B backend files. Therefore AAF-006G authority applies only to the five AAF-006G evidence paths, not to backend transaction-core files.

## 006G Evidence Status

- AAF-006G verdict: AAF_006G_VERIFIER_BENCHMARK_ACCEPTANCE_CEREMONY_READY
- Benchmark cases: 112
- Oracle cases: 112
- Zero-tolerance cases: 63
- Ceremony attacks passed: 9
- Ceremony attacks failed: 0
- Benchmark regeneration required: NO

## Authority Boundary

- AAF-006G exclusive commit: NO
- AAF-006G evidence status: VALID_TRACKED_IN_MIXED_COMMIT
- Product/backend authority granted by 006G: NO
- Backend authority belongs to separate AAF-004B lane.

## Safety

- FIREBASE_READ: NO
- FIREBASE_WRITE: NO
- QUEUE_WRITE: NO
- PUBLICATION: NO
- CANONICAL_CONTENT_MODIFIED: NO
- PRODUCT_CODE_MODIFIED_BY_THIS_RECONCILIATION: NO

## Final Line

AAF_006G_EVIDENCE_VALID_BUT_TRACKED_IN_MIXED_AAF004B_COMMIT_97EAE067873403BDF09926576CEA4C643B439C9E
