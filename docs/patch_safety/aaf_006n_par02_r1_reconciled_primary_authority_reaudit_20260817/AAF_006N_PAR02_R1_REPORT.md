# AAF-006N PAR02-R1 ChatGPT Re-Audit

## Verdict

AAF_006N_PAR02_R1_BLOCKED_BY_UNCOMMITTED_COMPANION_AND_PROVIDER_PROVENANCE_GAPS

## Recovered / Passed

- SOURCE_PACK_HASH_BOUND: 552/552
- CANDIDATE_ID_RECOVERED: 552/552
- MISSION_ID_RECOVERED: 552/552
- RISK_CLASS_RECOVERED: 552/552
- CANONICAL_KNOWLEDGE_VERSION_PROVEN: 552/552
- REACTION_EQUATION_COUNT: 37
- PROCEDURE_COUNT: 181
- STANDARD_SENSITIVE_COUNT: 3
- RECOMPUTED_CROSS_PROVIDER_TOTAL: 221
- OUTCOME_RECOUNT: VERIFIED 331, CROSS_CHECK_REQUIRED 221

## Still Blocking

- PROVIDER_IDS: gemini_benchmark_adapter_contract_only
- LIVE_MODEL_CALLS: undefined
- PROVIDER_RESPONSE_HASHES_MAPPED_TO_PRIMARY: 0/552
- COMPANION_GIT_AUTHORITY_CLEAN: false
- REAL_PROVIDER_EXECUTION_INDEPENDENTLY_PROVEN: false

## Blocking Reasons

- FIX1 companion/report evidence is not clean tracked Git authority; it is currently modified/untracked working-tree evidence.
- Real executable provider provenance is still not independently proven: primary providerId remains contract-only/liveModelCalls=0 and no external execution record was found.
- Companion providerResponseHash does not match primary ledger providerResponseHash: 0/552.

## Safety

- SECONDARY_CALLS_FROM_CHATGPT: 0
- LIVE_MODEL_CALLS_FROM_CHATGPT: 0
- PUBLICATION: NO

## Final Line

AAF_006N_FIX1_RECOVERS_IDENTITY_AND_006A_RISK_BINDING_BUT_PROVIDER_PROVENANCE_STILL_BLOCKS_PRIMARY_AUTHORITY
