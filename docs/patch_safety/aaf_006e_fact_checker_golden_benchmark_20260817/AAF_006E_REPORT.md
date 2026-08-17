# AAF-006E Fact Checker Golden Benchmark

## Verdict

AAF_006E_FACT_CHECKER_GOLDEN_BENCHMARK_READY

## Baseline

- AAF-006D accepted commit: `bccb170f21550d14e94c507661ffd95691aaa72d`
- AAF-006D is current ancestry: YES
- Verification job alias is canonical ID: NO
- Original AMTN ID preserved requirement: YES
- Canonical semantic topic ID preserved requirement: YES
- Provisional cross-provider claims input: 221

## Benchmark Purpose

This evidence pack prepares source-grounded golden and adversarial cases for future independent academic fact-check workers. It does not run Gemini, Claude, Firebase, queue workers, or publication. The goal is to prove that future verifier workers can reject wrong chemistry claims, stale hashes, source conflicts, and unsafe publication attempts rather than merely returning a successful API response.

## Counters

- TOTAL_BENCHMARK_CASES: 26
- POSITIVE_CASES: 6
- NEGATIVE_CASES: 20
- REACTION_CASES: 5
- PROCEDURE_CASES: 5
- SOURCE_CONFLICT_CASES: 4
- UNSOURCED_PLAUSIBLE_CASES: 1
- HASH_ATTACK_CASES: 4
- STALE_VERSION_CASES: 2
- REPAIR_INVALIDATION_CASES: 2
- CANONICAL_REUSE_CASES: 4
- PROVISIONAL_CROSS_PROVIDER_CASES: 4

## Files

- `reaction_attack_cases.json`
- `procedure_attack_cases.json`
- `source_conflict_attack_cases.json`
- `hash_identity_attack_cases.json`
- `canonical_reuse_verification_cases.json`
- `cross_provider_routing_benchmark.json`
- `fact_checker_benchmark_manifest.json`
- `AAF_006E_REPORT.json`
- `AAF_006E_REPORT.md`

## Safety

- MODEL_FACT_CHECK_USED: NO
- GEMINI_USED: NO
- CLAUDE_USED: NO
- FIREBASE_READ: NO
- FIREBASE_WRITE: NO
- QUEUE_WRITE: NO
- PUBLICATION: NO
- CANONICAL_CONTENT_MODIFIED: NO

## SHA-256 Matrix

- `canonical_reuse_verification_cases.json`: `3BA0E5F52CD75BB2FEDE61FC8B9DE52906C03C7E7D4C9785241A3CD2A5FE9CBA`
- `cross_provider_routing_benchmark.json`: `505B1B6FC99ECDCC1445D1D41949F8277A88895BB383057ED4C83D9FB981987C`
- `fact_checker_benchmark_manifest.json`: `43A4AE33F543928B4C93EA55F80C906F0559839303980CFDB68A7265A34989A7`
- `hash_identity_attack_cases.json`: `533E620EBA301933BB8486F7330D9E4C3F483AF0E7CBE70F22004D54A3FBF673`
- `procedure_attack_cases.json`: `43C3286F530D0AC720515EF1A619B27B2A4121AD2650CD31A9A35137B71F2A73`
- `reaction_attack_cases.json`: `F5DB8BE77F38F9B2EBADA983E15D1C92549C136C1E85063970346AD5EDAF61BB`
- `source_conflict_attack_cases.json`: `D66B1526261FA6E452FCF4A941088146CB7D79EC683890A897DF58F0BD9EBF1B`
## Final Line

AAF_FACT_CHECK_WORKERS_MUST_PASS_SOURCE_GROUNDED_GOLDEN_AND_ADVERSARIAL_VALIDATION_BEFORE_PUBLICATION_AUTHORITY

