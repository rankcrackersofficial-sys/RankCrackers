"use strict";
/**
 * AAF-006B real independent verifier backend surface.
 *
 * This module is intentionally source-bounded and provider-neutral. It does not
 * call Gemini, Claude, Firebase, ai_tasks, sentinel_drafts, queues, or any
 * publication surface. Live providers may only plug in through the explicit
 * IndependentVerifierProviderAdapter interface after benchmark qualification.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceBoundIndependentVerifierBackend = exports.RealProviderExecutionDisabledAdapter = void 0;
class RealProviderExecutionDisabledAdapter {
    constructor() {
        this.adapterId = 'real_provider_execution_disabled';
        this.materialVersion = 'AAF-006B-R2-production-contract';
        this.liveExecutionAllowed = false;
    }
    async verify(_envelope) {
        throw new Error('REAL_PROVIDER_EXECUTION_DISABLED: AAF-006B-R1 does not call live models.');
    }
}
exports.RealProviderExecutionDisabledAdapter = RealProviderExecutionDisabledAdapter;
class SourceBoundIndependentVerifierBackend {
    constructor() {
        this.usesAiTasksAsLifecycleAuthority = false;
        this.writesSentinelDrafts = false;
        this.verifierDirectAafStateWrites = 0;
        this.modelMemoryIsEvidence = false;
        this.aiMajorityVotingAllowed = false;
    }
    validateLaunchBundle(bundle) {
        const failures = [];
        if (bundle.benchmarkCases !== 112) {
            failures.push('BENCHMARK_CASES_NOT_112');
        }
        if (bundle.zeroToleranceCases !== 63) {
            failures.push('ZERO_TOLERANCE_CASES_NOT_63');
        }
        if (bundle.providerRequestEnvelopes !== 112) {
            failures.push('PROVIDER_REQUEST_ENVELOPES_NOT_112');
        }
        if (bundle.uniqueCaseIds !== 112) {
            failures.push('UNIQUE_CASE_IDS_NOT_112');
        }
        if (bundle.missingCases !== 0) {
            failures.push('MISSING_CASES_PRESENT');
        }
        if (bundle.duplicateCases !== 0) {
            failures.push('DUPLICATE_CASES_PRESENT');
        }
        if (bundle.oracleLeakedToProvider !== 'NO') {
            failures.push('ORACLE_LEAKED_TO_PROVIDER');
        }
        if (bundle.evaluatorExpectationLeakedToProvider !== 'NO') {
            failures.push('EVALUATOR_EXPECTATION_LEAKED_TO_PROVIDER');
        }
        if (bundle.qualificationResultLeakedToProvider !== 'NO') {
            failures.push('QUALIFICATION_RESULT_LEAKED_TO_PROVIDER');
        }
        if (bundle.requestSetHashDeterminism !== 'PASS') {
            failures.push('REQUEST_SET_HASH_NOT_DETERMINISTIC');
        }
        return {
            compatible: failures.length === 0,
            requestEnvelopesCompatible: failures.length === 0 ? '112/112' : 'BLOCKED',
            failures,
        };
    }
    validateEnvelope(envelope) {
        const failures = [];
        this.requireNonEmpty(envelope.caseId, 'caseId', failures);
        this.requireNonEmpty(envelope.verificationJobAlias, 'verificationJobAlias', failures);
        this.requireNonEmpty(envelope.originalAmtnId, 'originalAmtnId', failures);
        this.requireNonEmpty(envelope.canonicalSemanticTopicId, 'canonicalSemanticTopicId', failures);
        this.requireNonEmpty(envelope.canonicalClaimId, 'canonicalClaimId', failures);
        this.requireNonEmpty(envelope.claimHash, 'claimHash', failures);
        this.requireNonEmpty(envelope.sourcePackHash, 'sourcePackHash', failures);
        this.requireNonEmpty(envelope.inputManifestHash, 'inputManifestHash', failures);
        this.requireNonEmpty(envelope.approvedEvidenceSetHash, 'approvedEvidenceSetHash', failures);
        if (envelope.canonicalContentVersion <= 0) {
            failures.push('CANONICAL_CONTENT_VERSION_NOT_POSITIVE');
        }
        if (envelope.sourceLocators.length === 0) {
            failures.push('SOURCE_LOCATORS_EMPTY');
        }
        if (envelope.evidenceExtractHashes.length === 0) {
            failures.push('EVIDENCE_EXTRACT_HASHES_EMPTY');
        }
        if (envelope.verificationJobAlias === envelope.canonicalClaimId) {
            failures.push('ALIAS_MATCHES_CANONICAL_CLAIM_ID');
        }
        if (envelope.verificationJobAlias === envelope.originalAmtnId) {
            failures.push('ALIAS_MATCHES_ORIGINAL_AMTN_ID');
        }
        if (envelope.verificationJobAlias === envelope.canonicalSemanticTopicId) {
            failures.push('ALIAS_MATCHES_CANONICAL_TOPIC_ID');
        }
        if (envelope.riskClass === 'temporal') {
            this.requireNonEmpty(envelope.temporalVerifiedAsOfUtc ?? '', 'temporalVerifiedAsOfUtc', failures);
        }
        return failures;
    }
    requiresCrossProvider(envelope) {
        return (envelope.claimTypes.includes('REACTION_OR_EQUATION') ||
            envelope.claimTypes.includes('PROCEDURE') ||
            envelope.riskClass === 'standardSensitive');
    }
    decide({ envelope, primaryFinding, secondaryFinding, nowUtc, temporalFreshnessDays = 30, }) {
        const envelopeFailures = this.validateEnvelope(envelope);
        if (envelopeFailures.length > 0) {
            return this.block('Envelope failed source-bound validation.');
        }
        const primaryBindingFailure = this.providerBindingFailure(envelope, primaryFinding);
        if (primaryBindingFailure) {
            return this.block(primaryBindingFailure);
        }
        if (primaryFinding.providerUsedModelMemoryAsEvidence) {
            return this.block('Model memory cannot be evidence.');
        }
        if (envelope.hasSourceConflict || primaryFinding.providerObservedSourceConflict) {
            return {
                ...this.block('Source conflict overrides provider pass.'),
                verdict: 'conflicting',
            };
        }
        if (envelope.repairedAfterResult) {
            return this.block('Stale pre-repair result cannot verify repaired claim.');
        }
        if (envelope.riskClass === 'temporal' && envelope.temporalVerifiedAsOfUtc) {
            const verifiedAt = new Date(envelope.temporalVerifiedAsOfUtc);
            const ageMs = nowUtc.getTime() - verifiedAt.getTime();
            if (ageMs > temporalFreshnessDays * 24 * 60 * 60 * 1000) {
                return {
                    ...this.block('Temporal claim is stale.'),
                    verdict: 'stale',
                };
            }
        }
        if (primaryFinding.finding === 'fail') {
            return this.block('Primary provider rejected the claim.');
        }
        if (primaryFinding.finding === 'disputed') {
            return {
                ...this.block('Primary provider disputed the claim.'),
                verdict: 'disputed',
                escalationRequired: true,
            };
        }
        if (this.requiresCrossProvider(envelope)) {
            if (!secondaryFinding) {
                return {
                    ...this.block('Cross-provider verification is required.'),
                    verdict: 'disputed',
                    escalationRequired: true,
                };
            }
            const secondaryBindingFailure = this.providerBindingFailure(envelope, secondaryFinding);
            if (secondaryBindingFailure) {
                return this.block(secondaryBindingFailure);
            }
            if (secondaryFinding.finding !== 'pass') {
                return {
                    ...this.block('Provider disagreement cannot auto-pass.'),
                    verdict: 'disputed',
                    escalationRequired: true,
                };
            }
        }
        return {
            verdict: 'verified',
            publicationEligible: false,
            escalationRequired: false,
            providerFindingSeparateFromGovernedDecision: true,
            sourceConflictOverridesProviderPass: true,
            providerDisagreementCanAutoPass: false,
            stalePreRepairResultCanVerifyRepairedClaim: false,
            staleTemporalClaimCanVerify: false,
            reason: 'Provider finding is source-bound and governed; publication remains separately locked.',
        };
    }
    providerBindingFailure(envelope, finding) {
        if (finding.resultClaimHash !== envelope.claimHash) {
            return 'Provider result is not claim-hash bound.';
        }
        if (finding.resultCanonicalContentVersion !== envelope.canonicalContentVersion) {
            return 'Provider result is not canonical-version bound.';
        }
        if (finding.resultOriginalAmtnId !== envelope.originalAmtnId) {
            return 'Provider result is not original-AMTN bound.';
        }
        if (finding.resultCanonicalSemanticTopicId !==
            envelope.canonicalSemanticTopicId) {
            return 'Provider result is not canonical-semantic-topic bound.';
        }
        if (finding.sourcePackHash !== envelope.sourcePackHash) {
            return 'Provider result is not source-pack-hash bound.';
        }
        if (finding.inputManifestHash !== envelope.inputManifestHash) {
            return 'Provider result is not input-manifest-hash bound.';
        }
        if (finding.approvedEvidenceSetHash !== envelope.approvedEvidenceSetHash) {
            return 'Provider result is not approved-evidence-set bound.';
        }
        return null;
    }
    block(reason) {
        return {
            verdict: 'unverified',
            publicationEligible: false,
            escalationRequired: false,
            providerFindingSeparateFromGovernedDecision: true,
            sourceConflictOverridesProviderPass: true,
            providerDisagreementCanAutoPass: false,
            stalePreRepairResultCanVerifyRepairedClaim: false,
            staleTemporalClaimCanVerify: false,
            reason,
        };
    }
    requireNonEmpty(value, field, failures) {
        if (value.trim().length === 0) {
            failures.push(`${field.toUpperCase()}_EMPTY`);
        }
    }
}
exports.SourceBoundIndependentVerifierBackend = SourceBoundIndependentVerifierBackend;
//# sourceMappingURL=independentFactVerifierBackend.js.map