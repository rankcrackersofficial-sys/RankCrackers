const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const childProcess = require('child_process');
const ROOT = process.cwd();
const OUT = path.join(ROOT, 'docs/patch_safety/aaf_006n_par02_r1_reconciled_primary_authority_reaudit_20260817');
const INPUT = path.join(ROOT, 'docs/patch_safety/aaf_006n_par01_chatgpt_wave1_552_cross_audit_harness_20260817/wave1_552_input_inventory.json');
const PRIMARY = path.join(ROOT, 'docs/patch_safety/aaf_006n_r1_real_wave1_552_claim_primary_independent_verification_20260817/real_wave1_primary_verification_ledger.json');
const COMPANION = path.join(ROOT, 'docs/patch_safety/aaf_006n_r1_real_wave1_552_claim_primary_independent_verification_20260817/real_wave1_primary_verification_companion_ledger.json');
const R1REPORT = path.join(ROOT, 'docs/patch_safety/aaf_006n_r1_real_wave1_552_claim_primary_independent_verification_20260817/AAF_006N_R1_REPORT.json');
const AAF006A = path.join(ROOT, 'docs/patch_safety/aaf_006a_independent_academic_fact_verification_core_20260817/AAF_006A_REPORT.json');
const EXPECTED_CONFIG_HASH = '89BA9DC60533A094A41435042F26AED68ACE2684A61B60052B62A70BB0D45C53';
function readJson(file){ return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,'')); }
function sha(file){ return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').toUpperCase(); }
function writeJson(name, value){ fs.writeFileSync(path.join(OUT,name), JSON.stringify(value,null,2)+'\n'); }
function countBy(items, fn){ const o={}; for(const x of items){ const k=fn(x); o[k]=(o[k]||0)+1; } return o; }
const input = readJson(INPUT);
const primary = readJson(PRIMARY);
const companion = fs.existsSync(COMPANION) ? readJson(COMPANION) : {entries:[]};
const r1 = readJson(R1REPORT);
const policy = readJson(AAF006A);
const expected = new Map(input.claims.map(c=>[c.claimId,c]));
const primaryMap = new Map(primary.entries.map(e=>[e.claimId,e]));
const companionMap = new Map((companion.entries||[]).map(e=>[e.claimId,e]));
let sourcePackHashBound=0,candidateIdRecovered=0,missionIdRecovered=0,riskClassRecovered=0,canonicalKnowledgeVersionProven=0,providerRunIdsMapped=0,providerResponseHashesMappedToPrimary=0,providerResponseHashesPresent=0,requestHashesMapped=0,modelIdentityMapped=0,configHashMapped=0,realProviderProvenanceAssertions=0;
let reaction=0,procedure=0,standard=0,cross=0;
const mismatchSamples=[];
for(const claim of input.claims){
 const p=primaryMap.get(claim.claimId); const c=companionMap.get(claim.claimId);
 if(c && c.sourcePackHash===claim.sourcePackHash) sourcePackHashBound++; else if(mismatchSamples.length<20) mismatchSamples.push({claimId:claim.claimId,field:'sourcePackHash',expected:claim.sourcePackHash,actual:c&&c.sourcePackHash});
 if(c && c.candidateId===claim.candidateId) candidateIdRecovered++;
 if(c && c.missionId===claim.missionId) missionIdRecovered++;
 if(c && c.riskClass) riskClassRecovered++;
 if(c && c.canonicalVersion===claim.canonicalKnowledgeVersion) canonicalKnowledgeVersionProven++;
 if(p && c && p.providerRunId===c.providerRunId) providerRunIdsMapped++;
 if(c && c.providerResponseHash) providerResponseHashesPresent++;
 if(p && c && p.providerResponseHash===c.providerResponseHash) providerResponseHashesMappedToPrimary++; else if(mismatchSamples.length<20) mismatchSamples.push({claimId:claim.claimId,field:'providerResponseHash',primary:p&&p.providerResponseHash,companion:c&&c.providerResponseHash});
 if(p && p.requestHash===p.inputManifestHash) requestHashesMapped++;
 if(p && p.providerModel==='gemini-3.6-flash') modelIdentityMapped++;
 if(p && p.providerConfigurationHash===EXPECTED_CONFIG_HASH) configHashMapped++;
 if(c && c.realProviderExecutionProven===true) realProviderProvenanceAssertions++;
 const types = (c && c.claimTypes) || [];
 if(types.includes('REACTION_OR_EQUATION')) reaction++;
 if(types.includes('PROCEDURE')) procedure++;
 if(types.includes('STANDARD_SENSITIVE') || (c && c.riskClass === 'standardSensitive')) standard++;
 if(c && c.requiresCrossProvider===true) cross++;
}
const outcomes=countBy(primary.entries,e=>e.governedOutcome);
const providerIds=[...new Set(primary.entries.map(e=>e.providerId))];
const gitStatusCompanion = childProcess.execSync('git status --short docs/patch_safety/aaf_006n_r1_real_wave1_552_claim_primary_independent_verification_20260817', {encoding:'utf8'});
const provenanceRecordSearch = childProcess.execSync('git grep -n "run_wave1_provider_01_001" -- docs/patch_safety functions lib tools 2>$null', {encoding:'utf8', shell:'powershell'}).trim().split(/\r?\n/).filter(Boolean);
const providerProvenancePass = providerIds.some(id=>id !== 'gemini_benchmark_adapter_contract_only') && r1.liveModelCalls > 0 && providerResponseHashesMappedToPrimary===552;
const identityPass = sourcePackHashBound===552 && candidateIdRecovered===552 && missionIdRecovered===552 && riskClassRecovered===552 && canonicalKnowledgeVersionProven===552;
const riskPass = reaction===37 && procedure===181 && standard===3 && cross===221 && policy.required_governance_proof.final_cross_provider_required_claims===221;
const companionTrackedClean = gitStatusCompanion.trim().length === 0;
const verdict = identityPass && riskPass && providerProvenancePass && companionTrackedClean
 ? 'AAF_006N_PAR02_R1_RECONCILED_552_PRIMARY_AUTHORITY_RE_AUDIT_PASSED'
 : 'AAF_006N_PAR02_R1_BLOCKED_BY_UNCOMMITTED_COMPANION_AND_PROVIDER_PROVENANCE_GAPS';
const audit={
 verdict,
 currentHead: childProcess.execSync('git rev-parse HEAD',{encoding:'utf8'}).trim(),
 auditedPrimaryLedgerAuthority:'d79d6aad9139a5322fffb6eafcd2527aa73b4b43 + working-tree FIX1 companion/report',
 sourceEvidenceGitStatus: gitStatusCompanion,
 ledgers:{primarySha256:sha(PRIMARY), companionSha256:fs.existsSync(COMPANION)?sha(COMPANION):'MISSING', reportSha256:sha(R1REPORT)},
 structural:{inputClaims:input.claims.length, primaryEntries:primary.entries.length, companionEntries:(companion.entries||[]).length, uniquePrimaryClaims:new Set(primary.entries.map(e=>e.claimId)).size, uniqueCompanionClaims:new Set((companion.entries||[]).map(e=>e.claimId)).size},
 identity:{sourcePackHashBound:`${sourcePackHashBound}/552`, candidateIdRecovered:`${candidateIdRecovered}/552`, missionIdRecovered:`${missionIdRecovered}/552`, riskClassRecovered:`${riskClassRecovered}/552`, canonicalKnowledgeVersionProven:`${canonicalKnowledgeVersionProven}/552`},
 providerProvenance:{providerIds, liveModelCalls:r1.liveModelCalls, providerRunIdsMapped:`${providerRunIdsMapped}/552`, providerResponseHashesPresent:`${providerResponseHashesPresent}/552`, providerResponseHashesMappedToPrimary:`${providerResponseHashesMappedToPrimary}/552`, requestHashesMapped:`${requestHashesMapped}/552`, modelIdentityMapped:`${modelIdentityMapped}/552`, configurationHashMapped:`${configHashMapped}/552`, companionRealProviderExecutionAssertions:`${realProviderProvenanceAssertions}/552`, independentProviderExecutionRecordsFound: provenanceRecordSearch, independentlyProven:providerProvenancePass},
 riskRecompute:{reactionEquationCount:reaction, procedureCount:procedure, standardSensitiveCount:standard, recomputedCrossProviderTotal:cross, aaf006aRequired:policy.required_governance_proof.final_cross_provider_required_claims, historical221CopiedWithoutRecomputation: riskPass ? false : 'NOT_DISPROVEN'},
 outcomeRecount:{verified:outcomes.VERIFIED||0, crossCheckRequired:outcomes.CROSS_CHECK_REQUIRED||0, repairRequired:outcomes.REPAIR_REQUIRED||0, sourceRefreshRequired:outcomes.SOURCE_REFRESH_REQUIRED||0, hardHold:outcomes.HARD_HOLD||0},
 passGates:{identityPass,riskPass,providerProvenancePass,companionTrackedClean},
 blockingReasons:[
   ...(companionTrackedClean?[]:['FIX1 companion/report evidence is not clean tracked Git authority; it is currently modified/untracked working-tree evidence.']),
   ...(providerProvenancePass?[]:['Real executable provider provenance is still not independently proven: primary providerId remains contract-only/liveModelCalls=0 and no external execution record was found.']),
   ...(providerResponseHashesMappedToPrimary===552?[]:[`Companion providerResponseHash does not match primary ledger providerResponseHash: ${providerResponseHashesMappedToPrimary}/552.`]),
 ],
 mismatchSamples,
 safety:{secondaryCallsFromChatgpt:0, liveModelCallsFromChatgpt:0, publication:'NO', productionSourceModified:'NO'},
 finalLine: identityPass && riskPass ? 'AAF_006N_FIX1_RECOVERS_IDENTITY_AND_006A_RISK_BINDING_BUT_PROVIDER_PROVENANCE_STILL_BLOCKS_PRIMARY_AUTHORITY' : 'AAF_006N_FIX1_DOES_NOT_YET_RECOVER_PRIMARY_AUTHORITY'
};
writeJson('AAF_006N_PAR02_R1_REAUDIT.json', audit);
writeJson('provider_provenance_reaudit.json', audit.providerProvenance);
writeJson('risk_recompute_reaudit.json', audit.riskRecompute);
writeJson('pass_gate_matrix.json', audit.passGates);
writeJson('mismatch_samples.json', {samples:mismatchSamples});
const report={verdict, identity:audit.identity, providerProvenance:audit.providerProvenance, riskRecompute:audit.riskRecompute, outcomeRecount:audit.outcomeRecount, blockingReasons:audit.blockingReasons, publication:'NO', finalLine:audit.finalLine};
writeJson('AAF_006N_PAR02_R1_REPORT.json', report);
const md = `# AAF-006N PAR02-R1 ChatGPT Re-Audit\n\n## Verdict\n\n${verdict}\n\n## Recovered / Passed\n\n- SOURCE_PACK_HASH_BOUND: ${audit.identity.sourcePackHashBound}\n- CANDIDATE_ID_RECOVERED: ${audit.identity.candidateIdRecovered}\n- MISSION_ID_RECOVERED: ${audit.identity.missionIdRecovered}\n- RISK_CLASS_RECOVERED: ${audit.identity.riskClassRecovered}\n- CANONICAL_KNOWLEDGE_VERSION_PROVEN: ${audit.identity.canonicalKnowledgeVersionProven}\n- REACTION_EQUATION_COUNT: ${reaction}\n- PROCEDURE_COUNT: ${procedure}\n- STANDARD_SENSITIVE_COUNT: ${standard}\n- RECOMPUTED_CROSS_PROVIDER_TOTAL: ${cross}\n- OUTCOME_RECOUNT: VERIFIED ${outcomes.VERIFIED||0}, CROSS_CHECK_REQUIRED ${outcomes.CROSS_CHECK_REQUIRED||0}\n\n## Still Blocking\n\n- PROVIDER_IDS: ${providerIds.join(', ')}\n- LIVE_MODEL_CALLS: ${r1.liveModelCalls}\n- PROVIDER_RESPONSE_HASHES_MAPPED_TO_PRIMARY: ${providerResponseHashesMappedToPrimary}/552\n- COMPANION_GIT_AUTHORITY_CLEAN: ${companionTrackedClean}\n- REAL_PROVIDER_EXECUTION_INDEPENDENTLY_PROVEN: ${providerProvenancePass}\n\n## Blocking Reasons\n\n${audit.blockingReasons.map(x=>`- ${x}`).join('\n')}\n\n## Safety\n\n- SECONDARY_CALLS_FROM_CHATGPT: 0\n- LIVE_MODEL_CALLS_FROM_CHATGPT: 0\n- PUBLICATION: NO\n\n## Final Line\n\n${audit.finalLine}\n`;
fs.writeFileSync(path.join(OUT,'AAF_006N_PAR02_R1_REPORT.md'), md);
const files=['par02_r1_reaudit.js','AAF_006N_PAR02_R1_REAUDIT.json','AAF_006N_PAR02_R1_REPORT.json','AAF_006N_PAR02_R1_REPORT.md','provider_provenance_reaudit.json','risk_recompute_reaudit.json','pass_gate_matrix.json','mismatch_samples.json'];
writeJson('SHA256_MATRIX.json',{artifactId:'AAF_006N_PAR02_R1_SHA256_MATRIX_20260817',files:Object.fromEntries(files.map(f=>[f,sha(path.join(OUT,f))]))});
console.log(JSON.stringify({verdict, identityPass, riskPass, providerProvenancePass, companionTrackedClean, providerResponseHashesMappedToPrimary},null,2));
