"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const independentFactVerifierBackend_1 = require("../academicFactory/services/independentFactVerifierBackend");
const backend = new independentFactVerifierBackend_1.SourceBoundIndependentVerifierBackend();
function launchBundle() {
    return {
        benchmarkCases: 112,
        zeroToleranceCases: 63,
        providerRequestEnvelopes: 112,
        uniqueCaseIds: 112,
        missingCases: 0,
        duplicateCases: 0,
        oracleLeakedToProvider: 'NO',
        evaluatorExpectationLeakedToProvider: 'NO',
        qualificationResultLeakedToProvider: 'NO',
        requestSetHashDeterminism: 'PASS',
    };
}
function envelope(overrides = {}) {
    return {
        caseId: 'BENCH_0001',
        verificationJobAlias: 'WAVE1_CHEM_PRACTICAL_01',
        originalAmtnId: 'AMTN_CHEM_0001',
        canonicalSemanticTopicId: 'CHEM_QUAL_ANALYSIS_0001',
        canonicalClaimId: 'CLAIM_0001',
        claimHash: 'claim_hash_0001',
        canonicalContentVersion: 4,
        sourcePackHash: 'source_pack_hash',
        inputManifestHash: 'input_manifest_hash',
        approvedEvidenceSetHash: 'approved_evidence_hash',
        sourceLocators: ['NCERT Lab Manual section 8.2'],
        evidenceExtractHashes: ['extract_hash_0001'],
        riskClass: 'stable',
        claimTypes: ['FACT'],
        hasSourceConflict: false,
        repairedAfterResult: false,
        ...overrides,
    };
}
function finding(env, overrides = {}) {
    return {
        providerId: 'gemini_benchmark_adapter_contract_only',
        finding: 'pass',
        resultClaimHash: env.claimHash,
        resultCanonicalContentVersion: env.canonicalContentVersion,
        resultOriginalAmtnId: env.originalAmtnId,
        resultCanonicalSemanticTopicId: env.canonicalSemanticTopicId,
        sourcePackHash: env.sourcePackHash,
        inputManifestHash: env.inputManifestHash,
        approvedEvidenceSetHash: env.approvedEvidenceSetHash,
        providerUsedModelMemoryAsEvidence: false,
        providerObservedSourceConflict: false,
        ...overrides,
    };
}
describe('AAF-006B independent verifier backend surface', () => {
    test('006L launch bundle schema is compatible 112/112', () => {
        const result = backend.validateLaunchBundle(launchBundle());
        expect(result.compatible).toBe(true);
        expect(result.requestEnvelopesCompatible).toBe('112/112');
        expect(result.failures).toEqual([]);
    });
    test('launch bundle fails closed on oracle leakage or denominator drift', () => {
        const result = backend.validateLaunchBundle({
            ...launchBundle(),
            providerRequestEnvelopes: 111,
            oracleLeakedToProvider: 'YES',
        });
        expect(result.compatible).toBe(false);
        expect(result.requestEnvelopesCompatible).toBe('BLOCKED');
        expect(result.failures).toContain('PROVIDER_REQUEST_ENVELOPES_NOT_112');
        expect(result.failures).toContain('ORACLE_LEAKED_TO_PROVIDER');
    });
    test('real provider execution adapter is disabled in R1', async () => {
        const adapter = new independentFactVerifierBackend_1.RealProviderExecutionDisabledAdapter();
        expect(adapter.liveExecutionAllowed).toBe(false);
        await expect(adapter.verify(envelope())).rejects.toThrow('REAL_PROVIDER_EXECUTION_DISABLED');
    });
    test('claim, source, manifest, evidence, AMTN, and topic hashes are bound', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { resultClaimHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.publicationEligible).toBe(false);
        expect(decision.reason).toContain('claim-hash');
    });
    test('model memory cannot become evidence', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { providerUsedModelMemoryAsEvidence: true }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('Model memory');
    });
    test('source conflict overrides provider pass', () => {
        const env = envelope({ hasSourceConflict: true });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('conflicting');
        expect(decision.sourceConflictOverridesProviderPass).toBe(true);
        expect(decision.publicationEligible).toBe(false);
    });
    test('stale pre-repair result cannot verify repaired claim', () => {
        const env = envelope({ repairedAfterResult: true });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.stalePreRepairResultCanVerifyRepairedClaim).toBe(false);
    });
    test('stale temporal claim cannot verify', () => {
        const env = envelope({
            riskClass: 'temporal',
            temporalVerifiedAsOfUtc: '2026-07-01T00:00:00Z',
        });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('stale');
        expect(decision.staleTemporalClaimCanVerify).toBe(false);
    });
    test('alias identity attack fails closed', () => {
        const env = envelope({ verificationJobAlias: 'CLAIM_0001' });
        const failures = backend.validateEnvelope(env);
        expect(failures).toContain('ALIAS_MATCHES_CANONICAL_CLAIM_ID');
    });
    test('reaction and procedure claims require cross-provider finding', () => {
        const env = envelope({ claimTypes: ['REACTION_OR_EQUATION', 'PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(backend.requiresCrossProvider(env)).toBe(true);
        expect(decision.verdict).toBe('disputed');
        expect(decision.escalationRequired).toBe(true);
    });
    test('standard-sensitive claims require cross-provider finding', () => {
        const env = envelope({ riskClass: 'standardSensitive' });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(backend.requiresCrossProvider(env)).toBe(true);
        expect(decision.verdict).toBe('disputed');
    });
    test('provider disagreement cannot auto-pass', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { finding: 'disputed' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('disputed');
        expect(decision.providerDisagreementCanAutoPass).toBe(false);
        expect(decision.publicationEligible).toBe(false);
    });
    test('cross-provider pass creates governed verification but not publication', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('verified');
        expect(decision.providerFindingSeparateFromGovernedDecision).toBe(true);
        expect(decision.publicationEligible).toBe(false);
    });
    test('006B does not own legacy ai_tasks, sentinel_drafts, or direct AAF writes', () => {
        expect(backend.usesAiTasksAsLifecycleAuthority).toBe(false);
        expect(backend.writesSentinelDrafts).toBe(false);
        expect(backend.verifierDirectAafStateWrites).toBe(0);
        expect(backend.aiMajorityVotingAllowed).toBe(false);
    });
    test('envelope validation fails if caseId is empty', () => {
        const env = envelope({ caseId: '' });
        expect(backend.validateEnvelope(env)).toContain('CASEID_EMPTY');
    });
    test('envelope validation fails if verificationJobAlias is empty', () => {
        const env = envelope({ verificationJobAlias: '' });
        expect(backend.validateEnvelope(env)).toContain('VERIFICATIONJOBALIAS_EMPTY');
    });
    test('envelope validation fails if originalAmtnId is empty', () => {
        const env = envelope({ originalAmtnId: '' });
        expect(backend.validateEnvelope(env)).toContain('ORIGINALAMTNID_EMPTY');
    });
    test('envelope validation fails if canonicalSemanticTopicId is empty', () => {
        const env = envelope({ canonicalSemanticTopicId: '' });
        expect(backend.validateEnvelope(env)).toContain('CANONICALSEMANTICTOPICID_EMPTY');
    });
    test('envelope validation fails if canonicalClaimId is empty', () => {
        const env = envelope({ canonicalClaimId: '' });
        expect(backend.validateEnvelope(env)).toContain('CANONICALCLAIMID_EMPTY');
    });
    test('envelope validation fails if claimHash is empty', () => {
        const env = envelope({ claimHash: '' });
        expect(backend.validateEnvelope(env)).toContain('CLAIMHASH_EMPTY');
    });
    test('envelope validation fails if sourcePackHash is empty', () => {
        const env = envelope({ sourcePackHash: '' });
        expect(backend.validateEnvelope(env)).toContain('SOURCEPACKHASH_EMPTY');
    });
    test('envelope validation fails if inputManifestHash is empty', () => {
        const env = envelope({ inputManifestHash: '' });
        expect(backend.validateEnvelope(env)).toContain('INPUTMANIFESTHASH_EMPTY');
    });
    test('envelope validation fails if approvedEvidenceSetHash is empty', () => {
        const env = envelope({ approvedEvidenceSetHash: '' });
        expect(backend.validateEnvelope(env)).toContain('APPROVEDEVIDENCESETHASH_EMPTY');
    });
    test('envelope validation fails if canonicalContentVersion is negative', () => {
        const env = envelope({ canonicalContentVersion: -1 });
        expect(backend.validateEnvelope(env)).toContain('CANONICAL_CONTENT_VERSION_NOT_POSITIVE');
    });
    test('envelope validation fails if sourceLocators is empty', () => {
        const env = envelope({ sourceLocators: [] });
        expect(backend.validateEnvelope(env)).toContain('SOURCE_LOCATORS_EMPTY');
    });
    test('envelope validation fails if evidenceExtractHashes is empty', () => {
        const env = envelope({ evidenceExtractHashes: [] });
        expect(backend.validateEnvelope(env)).toContain('EVIDENCE_EXTRACT_HASHES_EMPTY');
    });
    test('envelope validation fails if verificationJobAlias matches originalAmtnId', () => {
        const env = envelope({ verificationJobAlias: 'AMTN_CHEM_0001' });
        expect(backend.validateEnvelope(env)).toContain('ALIAS_MATCHES_ORIGINAL_AMTN_ID');
    });
    test('envelope validation fails if verificationJobAlias matches topicId', () => {
        const env = envelope({ verificationJobAlias: 'CHEM_QUAL_ANALYSIS_0001' });
        expect(backend.validateEnvelope(env)).toContain('ALIAS_MATCHES_CANONICAL_TOPIC_ID');
    });
    test('envelope validation fails if temporal claim has empty temporalVerifiedAsOfUtc', () => {
        const env = envelope({ riskClass: 'temporal', temporalVerifiedAsOfUtc: '' });
        expect(backend.validateEnvelope(env)).toContain('TEMPORALVERIFIEDASOFUTC_EMPTY');
    });
    test('primary finding mismatch on resultCanonicalContentVersion fails closed', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { resultCanonicalContentVersion: 99 }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('canonical-version');
    });
    test('primary finding mismatch on resultOriginalAmtnId fails closed', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { resultOriginalAmtnId: 'wrong_amtn' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('original-AMTN');
    });
    test('primary finding mismatch on resultCanonicalSemanticTopicId fails closed', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { resultCanonicalSemanticTopicId: 'wrong_topic' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('canonical-semantic-topic');
    });
    test('primary finding mismatch on sourcePackHash fails closed', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { sourcePackHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('source-pack-hash');
    });
    test('primary finding mismatch on inputManifestHash fails closed', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { inputManifestHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('input-manifest-hash');
    });
    test('primary finding mismatch on approvedEvidenceSetHash fails closed', () => {
        const env = envelope();
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env, { approvedEvidenceSetHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
        expect(decision.reason).toContain('approved-evidence-set');
    });
    test('secondary finding mismatch on resultCanonicalContentVersion fails closed', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { resultCanonicalContentVersion: 99 }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
    });
    test('secondary finding mismatch on resultOriginalAmtnId fails closed', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { resultOriginalAmtnId: 'wrong_amtn' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
    });
    test('secondary finding mismatch on resultCanonicalSemanticTopicId fails closed', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { resultCanonicalSemanticTopicId: 'wrong_topic' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
    });
    test('secondary finding mismatch on sourcePackHash fails closed', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { sourcePackHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
    });
    test('secondary finding mismatch on inputManifestHash fails closed', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { inputManifestHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
    });
    test('secondary finding mismatch on approvedEvidenceSetHash fails closed', () => {
        const env = envelope({ claimTypes: ['PROCEDURE'] });
        const decision = backend.decide({
            envelope: env,
            primaryFinding: finding(env),
            secondaryFinding: finding(env, { approvedEvidenceSetHash: 'wrong_hash' }),
            nowUtc: new Date('2026-08-17T08:00:00Z'),
        });
        expect(decision.verdict).toBe('unverified');
    });
});
//# sourceMappingURL=aafIndependentVerifierBackend.test.js.map