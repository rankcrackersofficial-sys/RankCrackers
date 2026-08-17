/// Deterministic independent fact-verification policy core for the
/// RankCrackers Autonomous Academic Factory.
///
/// CODE: AAF-006A
///
/// This layer is pure Dart. It does not call Firebase, queues, Gemini,
/// Claude, Vertex, HTTP clients, or publication surfaces.
library;

enum FactRiskClass {
  stable,
  temporal,
  standardSensitive,
}

enum VerificationStage {
  sourceIngestion,
  claimIdentity,
  claimValidation,
  primaryVerifier,
  crossProviderPolicy,
  repairAndReVerify,
  postAssemblyIntegrity,
  prePublicationFactGate,
}

enum VerificationVerdict {
  verified,
  unverified,
  disputed,
  stale,
  conflicting,
  hardHold,
}

enum ProviderFinding {
  pass,
  fail,
  disputed,
}

enum CrossProviderDisposition {
  notRequired,
  conditional,
  required,
}

final class AcademicClaim {
  AcademicClaim({
    required this.id,
    required this.text,
    required this.riskClass,
    required this.originalAmtnId,
    required this.canonicalSemanticTopicId,
    required this.verificationJobAlias,
    required this.canonicalClaimHash,
    required this.canonicalContentVersion,
    required this.evidenceExtractHash,
    required this.sourceId,
    required this.sourceHash,
    required this.sourceLocator,
    required this.verifiedAsOfUtc,
    required this.version,
    this.isReactionOrEquation = false,
    this.isProcedure = false,
    this.isProvisionalCrossProviderCandidate = false,
  }) {
    validate();
  }

  final String id;
  final String text;
  final FactRiskClass riskClass;
  final String originalAmtnId;
  final String canonicalSemanticTopicId;
  final String verificationJobAlias;
  final String canonicalClaimHash;
  final int canonicalContentVersion;
  final String evidenceExtractHash;
  final String sourceId;
  final String sourceHash;
  final String sourceLocator;
  final DateTime verifiedAsOfUtc;
  final int version;
  final bool isReactionOrEquation;
  final bool isProcedure;
  final bool isProvisionalCrossProviderCandidate;

  bool get isStandardSensitive => riskClass == FactRiskClass.standardSensitive;

  bool get requiresCrossProviderVerification =>
      isReactionOrEquation ||
      isProcedure ||
      isStandardSensitive ||
      isProvisionalCrossProviderCandidate;

  void validate() {
    _requireNonEmpty(id, 'id');
    _requireNonEmpty(text, 'text');
    _requireNonEmpty(originalAmtnId, 'originalAmtnId');
    _requireNonEmpty(canonicalSemanticTopicId, 'canonicalSemanticTopicId');
    _requireNonEmpty(verificationJobAlias, 'verificationJobAlias');
    _requireNonEmpty(canonicalClaimHash, 'canonicalClaimHash');
    _requireNonEmpty(evidenceExtractHash, 'evidenceExtractHash');
    _requireNonEmpty(sourceId, 'sourceId');
    _requireNonEmpty(sourceHash, 'sourceHash');
    _requireNonEmpty(sourceLocator, 'sourceLocator');

    if (!verifiedAsOfUtc.isUtc) {
      throw const FormatException(
        'AcademicClaim.verifiedAsOfUtc must be UTC.',
      );
    }

    if (version <= 0) {
      throw const FormatException('AcademicClaim.version must be positive.');
    }

    if (canonicalContentVersion <= 0) {
      throw const FormatException(
        'AcademicClaim.canonicalContentVersion must be positive.',
      );
    }
  }
}

final class VerificationEvidence {
  const VerificationEvidence({
    required this.sourceHashMatches,
    required this.evidenceExtractHashMatches,
    required this.resultCanonicalClaimHash,
    required this.resultCanonicalContentVersion,
    required this.resultOriginalAmtnId,
    required this.resultCanonicalSemanticTopicId,
    required this.primaryFinding,
    this.secondaryFinding,
    this.hasSourceConflict = false,
    this.repairedAfterResult = false,
  });

  final bool sourceHashMatches;
  final bool evidenceExtractHashMatches;
  final String resultCanonicalClaimHash;
  final int resultCanonicalContentVersion;
  final String resultOriginalAmtnId;
  final String resultCanonicalSemanticTopicId;
  final ProviderFinding primaryFinding;
  final ProviderFinding? secondaryFinding;
  final bool hasSourceConflict;
  final bool repairedAfterResult;
}

final class VerificationResult {
  const VerificationResult({
    required this.verdict,
    required this.stage,
    required this.verifiedByProvider,
    required this.escalationRequired,
    required this.verifiedAtUtc,
    required this.crossProviderDisposition,
    required this.publicationEligible,
    required this.reason,
  });

  final VerificationVerdict verdict;
  final VerificationStage stage;
  final String verifiedByProvider;
  final bool escalationRequired;
  final DateTime verifiedAtUtc;
  final CrossProviderDisposition crossProviderDisposition;
  final bool publicationEligible;
  final String reason;
}

final class VerificationPolicyReport {
  const VerificationPolicyReport({
    required this.totalClaims,
    required this.provisionalCrossProviderClaimsInput,
    required this.finalCrossProviderRequiredClaims,
    required this.finalCrossProviderConditionalClaims,
    required this.aliasIsCanonicalId,
    required this.originalAmtnIdPreserved,
    required this.canonicalSemanticTopicIdPreserved,
    required this.crossProviderPolicyReconciled,
  });

  final int totalClaims;
  final int provisionalCrossProviderClaimsInput;
  final int finalCrossProviderRequiredClaims;
  final int finalCrossProviderConditionalClaims;
  final bool aliasIsCanonicalId;
  final bool originalAmtnIdPreserved;
  final bool canonicalSemanticTopicIdPreserved;
  final bool crossProviderPolicyReconciled;
}

final class PostAssemblyIntegrityResult {
  const PostAssemblyIntegrityResult({
    required this.valid,
    required this.missingClaimIds,
    required this.extraClaimIds,
    required this.staleOrInvalidClaimIds,
  });

  final bool valid;
  final List<String> missingClaimIds;
  final List<String> extraClaimIds;
  final List<String> staleOrInvalidClaimIds;
}

final class AcademicFactVerificationCore {
  const AcademicFactVerificationCore({
    this.temporalFreshnessWindow = const Duration(days: 30),
  });

  final Duration temporalFreshnessWindow;

  VerificationPolicyReport reconcilePolicy({
    required List<AcademicClaim> claims,
  }) {
    final canonicalTopicIds = <String>{};
    final originalAmtnIds = <String>{};
    var provisionalInput = 0;
    var finalRequired = 0;
    var aliasIsCanonical = false;

    for (final claim in claims) {
      claim.validate();
      canonicalTopicIds.add(claim.canonicalSemanticTopicId);
      originalAmtnIds.add(claim.originalAmtnId);

      if (claim.isProvisionalCrossProviderCandidate) {
        provisionalInput++;
      }
      if (claim.requiresCrossProviderVerification) {
        finalRequired++;
      }
      if (claim.verificationJobAlias == claim.id ||
          claim.verificationJobAlias == claim.canonicalSemanticTopicId ||
          claim.verificationJobAlias == claim.originalAmtnId) {
        aliasIsCanonical = true;
      }
    }

    return VerificationPolicyReport(
      totalClaims: claims.length,
      provisionalCrossProviderClaimsInput: provisionalInput,
      finalCrossProviderRequiredClaims: finalRequired,
      finalCrossProviderConditionalClaims: 0,
      aliasIsCanonicalId: aliasIsCanonical,
      originalAmtnIdPreserved: originalAmtnIds.length == claims.length,
      canonicalSemanticTopicIdPreserved:
          canonicalTopicIds.length == claims.length,
      crossProviderPolicyReconciled: !aliasIsCanonical,
    );
  }

  VerificationResult verifyClaim(
    AcademicClaim claim, {
    required DateTime currentUtcTime,
    required VerificationEvidence evidence,
  }) {
    if (!currentUtcTime.isUtc) {
      throw const FormatException('currentUtcTime must be UTC.');
    }

    claim.validate();

    final identityFailure = _identityFailureReason(claim, evidence);
    if (identityFailure != null) {
      return _result(
        verdict: VerificationVerdict.unverified,
        stage: VerificationStage.claimIdentity,
        at: currentUtcTime,
        reason: identityFailure,
      );
    }

    if (!evidence.sourceHashMatches || !evidence.evidenceExtractHashMatches) {
      return _result(
        verdict: VerificationVerdict.unverified,
        stage: VerificationStage.sourceIngestion,
        at: currentUtcTime,
        reason: 'Source or evidence extract hash mismatch.',
      );
    }

    if (evidence.hasSourceConflict) {
      return _result(
        verdict: VerificationVerdict.conflicting,
        stage: VerificationStage.claimValidation,
        at: currentUtcTime,
        reason: 'Source conflict cannot be hidden by provider pass.',
      );
    }

    if (evidence.repairedAfterResult) {
      return _result(
        verdict: VerificationVerdict.unverified,
        stage: VerificationStage.repairAndReVerify,
        at: currentUtcTime,
        reason: 'Repair requires new result binding.',
      );
    }

    if (claim.riskClass == FactRiskClass.temporal) {
      final age = currentUtcTime.difference(claim.verifiedAsOfUtc);
      if (age > temporalFreshnessWindow) {
        return _result(
          verdict: VerificationVerdict.stale,
          stage: VerificationStage.claimValidation,
          at: currentUtcTime,
          reason: 'Temporal claim exceeded freshness window.',
        );
      }
    }

    if (evidence.primaryFinding == ProviderFinding.fail) {
      return _result(
        verdict: VerificationVerdict.unverified,
        stage: VerificationStage.primaryVerifier,
        at: currentUtcTime,
        reason: 'Primary verifier rejected the claim.',
      );
    }

    if (evidence.primaryFinding == ProviderFinding.disputed) {
      return _result(
        verdict: VerificationVerdict.disputed,
        stage: VerificationStage.primaryVerifier,
        at: currentUtcTime,
        escalationRequired: true,
        crossProviderDisposition: CrossProviderDisposition.required,
        reason: 'Primary verifier disputed the claim.',
      );
    }

    if (claim.requiresCrossProviderVerification) {
      final secondary = evidence.secondaryFinding;
      if (secondary == null) {
        return _result(
          verdict: VerificationVerdict.disputed,
          stage: VerificationStage.crossProviderPolicy,
          at: currentUtcTime,
          escalationRequired: true,
          crossProviderDisposition: CrossProviderDisposition.required,
          reason: 'Cross-provider verification is required.',
        );
      }

      if (secondary != ProviderFinding.pass) {
        return _result(
          verdict: VerificationVerdict.disputed,
          stage: VerificationStage.crossProviderPolicy,
          at: currentUtcTime,
          escalationRequired: true,
          crossProviderDisposition: CrossProviderDisposition.required,
          reason: 'Cross-provider verifier did not pass the claim.',
        );
      }
    }

    return VerificationResult(
      verdict: VerificationVerdict.verified,
      stage: VerificationStage.prePublicationFactGate,
      verifiedByProvider: claim.requiresCrossProviderVerification
          ? 'primary_and_cross_provider'
          : 'primary_provider',
      escalationRequired: false,
      verifiedAtUtc: currentUtcTime,
      crossProviderDisposition: claim.requiresCrossProviderVerification
          ? CrossProviderDisposition.required
          : CrossProviderDisposition.notRequired,
      publicationEligible: true,
      reason: 'Claim passed deterministic fact gate.',
    );
  }

  PostAssemblyIntegrityResult verifyAssembledPayload({
    required Set<String> assembledClaimIds,
    required Map<String, VerificationResult> verifiedResultsByClaimId,
  }) {
    final verifiedIds = verifiedResultsByClaimId.keys.toSet();
    final missingClaimIds = verifiedIds.difference(assembledClaimIds).toList()
      ..sort();
    final extraClaimIds = assembledClaimIds.difference(verifiedIds).toList()
      ..sort();
    final staleOrInvalidClaimIds = <String>[];

    for (final entry in verifiedResultsByClaimId.entries) {
      if (entry.value.verdict != VerificationVerdict.verified ||
          !entry.value.publicationEligible) {
        staleOrInvalidClaimIds.add(entry.key);
      }
    }
    staleOrInvalidClaimIds.sort();

    return PostAssemblyIntegrityResult(
      valid: missingClaimIds.isEmpty &&
          extraClaimIds.isEmpty &&
          staleOrInvalidClaimIds.isEmpty,
      missingClaimIds: List<String>.unmodifiable(missingClaimIds),
      extraClaimIds: List<String>.unmodifiable(extraClaimIds),
      staleOrInvalidClaimIds: List<String>.unmodifiable(staleOrInvalidClaimIds),
    );
  }

  String? _identityFailureReason(
    AcademicClaim claim,
    VerificationEvidence evidence,
  ) {
    if (claim.verificationJobAlias == claim.id ||
        claim.verificationJobAlias == claim.canonicalSemanticTopicId ||
        claim.verificationJobAlias == claim.originalAmtnId) {
      return 'Verification job alias cannot replace canonical claim identity.';
    }

    if (evidence.resultCanonicalClaimHash != claim.canonicalClaimHash) {
      return 'Result canonical claim hash does not match current claim.';
    }

    if (evidence.resultCanonicalContentVersion !=
        claim.canonicalContentVersion) {
      return 'Result canonical content version is stale.';
    }

    if (evidence.resultOriginalAmtnId != claim.originalAmtnId) {
      return 'Result original AMTN binding does not match claim.';
    }

    if (evidence.resultCanonicalSemanticTopicId !=
        claim.canonicalSemanticTopicId) {
      return 'Result canonical semantic topic binding does not match claim.';
    }

    return null;
  }

  VerificationResult _result({
    required VerificationVerdict verdict,
    required VerificationStage stage,
    required DateTime at,
    required String reason,
    bool escalationRequired = false,
    CrossProviderDisposition crossProviderDisposition =
        CrossProviderDisposition.notRequired,
  }) {
    return VerificationResult(
      verdict: verdict,
      stage: stage,
      verifiedByProvider: 'core_system',
      escalationRequired: escalationRequired,
      verifiedAtUtc: at,
      crossProviderDisposition: crossProviderDisposition,
      publicationEligible: false,
      reason: reason,
    );
  }
}

void _requireNonEmpty(String value, String field) {
  if (value.trim().isEmpty) {
    throw FormatException('AcademicClaim.$field must not be empty.');
  }
}
