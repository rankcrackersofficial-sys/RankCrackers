import 'package:flutter_test/flutter_test.dart';
import 'package:rank_crackers/features/academic_factory/domain/engines/academic_fact_verification_core.dart';

void main() {
  const core = AcademicFactVerificationCore();
  final now = DateTime.utc(2026, 8, 17, 8);

  AcademicClaim claim({
    String id = 'CLAIM_0001',
    String originalAmtnId = 'AMTN_0001',
    String canonicalSemanticTopicId = 'CHEM_ORG_TEST_0001',
    String verificationJobAlias = 'WAVE1_CHEM_PRACTICAL_01',
    FactRiskClass riskClass = FactRiskClass.stable,
    bool reaction = false,
    bool procedure = false,
    bool provisionalCrossProvider = false,
    DateTime? verifiedAsOfUtc,
    int canonicalContentVersion = 3,
  }) {
    return AcademicClaim(
      id: id,
      text: 'A source-grounded chemistry claim.',
      riskClass: riskClass,
      originalAmtnId: originalAmtnId,
      canonicalSemanticTopicId: canonicalSemanticTopicId,
      verificationJobAlias: verificationJobAlias,
      canonicalClaimHash: 'claim-hash-$id',
      canonicalContentVersion: canonicalContentVersion,
      evidenceExtractHash: 'extract-hash-$id',
      sourceId: 'NCERT_CHEM_LAB_MANUAL',
      sourceHash: 'source-hash',
      sourceLocator: 'section qualitative analysis',
      verifiedAsOfUtc: verifiedAsOfUtc ?? now,
      version: 1,
      isReactionOrEquation: reaction,
      isProcedure: procedure,
      isProvisionalCrossProviderCandidate: provisionalCrossProvider,
    );
  }

  VerificationEvidence evidence(
    AcademicClaim claim, {
    ProviderFinding primaryFinding = ProviderFinding.pass,
    ProviderFinding? secondaryFinding,
    bool sourceHashMatches = true,
    bool evidenceExtractHashMatches = true,
    bool hasSourceConflict = false,
    bool repairedAfterResult = false,
    String? resultCanonicalClaimHash,
    int? resultCanonicalContentVersion,
    String? resultOriginalAmtnId,
    String? resultCanonicalSemanticTopicId,
  }) {
    return VerificationEvidence(
      sourceHashMatches: sourceHashMatches,
      evidenceExtractHashMatches: evidenceExtractHashMatches,
      resultCanonicalClaimHash:
          resultCanonicalClaimHash ?? claim.canonicalClaimHash,
      resultCanonicalContentVersion:
          resultCanonicalContentVersion ?? claim.canonicalContentVersion,
      resultOriginalAmtnId: resultOriginalAmtnId ?? claim.originalAmtnId,
      resultCanonicalSemanticTopicId:
          resultCanonicalSemanticTopicId ?? claim.canonicalSemanticTopicId,
      primaryFinding: primaryFinding,
      secondaryFinding: secondaryFinding,
      hasSourceConflict: hasSourceConflict,
      repairedAfterResult: repairedAfterResult,
    );
  }

  group('AcademicFactVerificationCore - AAF-006A fail-closed gates', () {
    test('missing source material is rejected at construction', () {
      expect(
        () => AcademicClaim(
          id: 'CLAIM_BAD',
          text: 'Unsupported claim.',
          riskClass: FactRiskClass.stable,
          originalAmtnId: 'AMTN_BAD',
          canonicalSemanticTopicId: 'TOPIC_BAD',
          verificationJobAlias: 'WAVE1_BAD',
          canonicalClaimHash: 'hash',
          canonicalContentVersion: 1,
          evidenceExtractHash: 'extract',
          sourceId: '',
          sourceHash: 'source-hash',
          sourceLocator: 'page 1',
          verifiedAsOfUtc: now,
          version: 1,
        ),
        throwsFormatException,
      );
    });

    test('source conflict overrides provider pass', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, hasSourceConflict: true),
      );

      expect(result.verdict, VerificationVerdict.conflicting);
      expect(result.publicationEligible, isFalse);
      expect(result.reason, contains('Source conflict'));
    });

    test('source or evidence hash mismatch cannot verify a claim', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, evidenceExtractHashMatches: false),
      );

      expect(result.verdict, VerificationVerdict.unverified);
      expect(result.stage, VerificationStage.sourceIngestion);
      expect(result.publicationEligible, isFalse);
    });

    test('temporal claims stale outside freshness window', () {
      final c = claim(
        riskClass: FactRiskClass.temporal,
        verifiedAsOfUtc: now.subtract(const Duration(days: 31)),
      );
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c),
      );

      expect(result.verdict, VerificationVerdict.stale);
      expect(result.publicationEligible, isFalse);
    });

    test('verification job alias cannot replace canonical identity', () {
      final c = claim(
        verificationJobAlias: 'CHEM_ORG_TEST_0001',
      );
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c),
      );

      expect(result.verdict, VerificationVerdict.unverified);
      expect(result.stage, VerificationStage.claimIdentity);
      expect(result.publicationEligible, isFalse);
    });

    test('stale result cannot verify repaired canonical content', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(
          c,
          resultCanonicalContentVersion: c.canonicalContentVersion - 1,
        ),
      );

      expect(result.verdict, VerificationVerdict.unverified);
      expect(result.stage, VerificationStage.claimIdentity);
      expect(result.reason, contains('stale'));
    });

    test('repair requires new result binding', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, repairedAfterResult: true),
      );

      expect(result.verdict, VerificationVerdict.unverified);
      expect(result.stage, VerificationStage.repairAndReVerify);
      expect(result.publicationEligible, isFalse);
    });

    test('primary verifier failure remains unverified', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, primaryFinding: ProviderFinding.fail),
      );

      expect(result.verdict, VerificationVerdict.unverified);
      expect(result.stage, VerificationStage.primaryVerifier);
    });

    test('primary dispute requires cross-provider escalation', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, primaryFinding: ProviderFinding.disputed),
      );

      expect(result.verdict, VerificationVerdict.disputed);
      expect(result.escalationRequired, isTrue);
      expect(
          result.crossProviderDisposition, CrossProviderDisposition.required);
    });

    test('reaction/procedure/standard-sensitive claims require second provider',
        () {
      final claims = [
        claim(id: 'CLAIM_REACTION', reaction: true),
        claim(id: 'CLAIM_PROCEDURE', procedure: true),
        claim(
          id: 'CLAIM_STANDARD',
          riskClass: FactRiskClass.standardSensitive,
        ),
      ];

      for (final c in claims) {
        final result = core.verifyClaim(
          c,
          currentUtcTime: now,
          evidence: evidence(c),
        );
        expect(result.verdict, VerificationVerdict.disputed);
        expect(result.stage, VerificationStage.crossProviderPolicy);
        expect(result.publicationEligible, isFalse);
      }
    });

    test('cross-provider pass verifies high-risk claim', () {
      final c = claim(reaction: true, procedure: true);
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, secondaryFinding: ProviderFinding.pass),
      );

      expect(result.verdict, VerificationVerdict.verified);
      expect(result.verifiedByProvider, 'primary_and_cross_provider');
      expect(result.publicationEligible, isTrue);
    });

    test('cross-provider disagreement cannot auto-pass', () {
      final c = claim(procedure: true);
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c, secondaryFinding: ProviderFinding.disputed),
      );

      expect(result.verdict, VerificationVerdict.disputed);
      expect(result.publicationEligible, isFalse);
    });

    test('stable low-risk claim can pass with source-bound primary result', () {
      final c = claim();
      final result = core.verifyClaim(
        c,
        currentUtcTime: now,
        evidence: evidence(c),
      );

      expect(result.verdict, VerificationVerdict.verified);
      expect(result.verifiedByProvider, 'primary_provider');
      expect(result.publicationEligible, isTrue);
    });

    test('policy reconciles 221 provisional cross-provider claims as required',
        () {
      final claims = List.generate(552, (index) {
        final sequence = index + 1;
        return claim(
          id: 'CLAIM_${sequence.toString().padLeft(4, '0')}',
          originalAmtnId: 'AMTN_${sequence.toString().padLeft(4, '0')}',
          canonicalSemanticTopicId:
              'CHEM_TOPIC_${sequence.toString().padLeft(4, '0')}',
          verificationJobAlias: 'WAVE1_CHEM_PRACTICAL_${(index % 10) + 1}',
          provisionalCrossProvider: index < 221,
        );
      });

      final report = core.reconcilePolicy(claims: claims);

      expect(report.totalClaims, 552);
      expect(report.provisionalCrossProviderClaimsInput, 221);
      expect(report.finalCrossProviderRequiredClaims, 221);
      expect(report.finalCrossProviderConditionalClaims, 0);
      expect(report.aliasIsCanonicalId, isFalse);
      expect(report.originalAmtnIdPreserved, isTrue);
      expect(report.canonicalSemanticTopicIdPreserved, isTrue);
      expect(report.crossProviderPolicyReconciled, isTrue);
    });

    test('post-assembly integrity rejects missing, extra, or invalid claims',
        () {
      final valid = VerificationResult(
        verdict: VerificationVerdict.verified,
        stage: VerificationStage.prePublicationFactGate,
        verifiedByProvider: 'primary_provider',
        escalationRequired: false,
        verifiedAtUtc: now,
        crossProviderDisposition: CrossProviderDisposition.notRequired,
        publicationEligible: true,
        reason: 'ok',
      );
      final invalid = VerificationResult(
        verdict: VerificationVerdict.unverified,
        stage: VerificationStage.sourceIngestion,
        verifiedByProvider: 'core_system',
        escalationRequired: false,
        verifiedAtUtc: now,
        crossProviderDisposition: CrossProviderDisposition.notRequired,
        publicationEligible: false,
        reason: 'bad',
      );

      final result = core.verifyAssembledPayload(
        assembledClaimIds: {'CLAIM_1', 'CLAIM_EXTRA'},
        verifiedResultsByClaimId: {
          'CLAIM_1': valid,
          'CLAIM_2': valid,
          'CLAIM_3': invalid,
        },
      );

      expect(result.valid, isFalse);
      expect(result.missingClaimIds, ['CLAIM_2', 'CLAIM_3']);
      expect(result.extraClaimIds, ['CLAIM_EXTRA']);
      expect(result.staleOrInvalidClaimIds, ['CLAIM_3']);
    });
  });
}
