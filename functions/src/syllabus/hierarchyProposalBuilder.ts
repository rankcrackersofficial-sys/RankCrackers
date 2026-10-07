import {
  AuthoritativePageEvidence,
  CANONICAL_HIERARCHY_LEVELS,
  CanonicalHierarchyLevel,
  ELIGIBLE_SOURCE_CLASSES,
  EvidenceSpanReference,
  FORBIDDEN_SOURCE_CLASSES,
  HIERARCHY_NODE_CONTRACT_VERSION,
  HIERARCHY_PROPOSAL_CONTRACT_VERSION,
  HierarchyProposal,
  MultiPageEvidenceBundle,
  NodeSemanticIdentityInput,
  ProposalNodeManifestEntry,
  ProposalReviewState,
  ProposedHierarchyNode,
  STRUCTURAL_RULE_DEFINITIONS,
  StructuralInterpretationManifestEntry,
  StructuralRuleId,
  canonicalJson,
  computeEvidenceSetHash,
  computeEvidenceSpanHash,
  computeProposalContentHash,
  computeProposedNodeId,
  sha256Hex,
  validateCanonicalLevelSequence,
  computePageExtractionIdentity,
  computeExtractionId,
} from './hierarchyProposalContract';

export interface AuthoritativeLineageBundle {
  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceSha256: string;
  readonly byteArtifactId: string;
  readonly provenanceId: string;
  readonly governanceId: string;
  readonly storageGeneration: string;
  readonly sourceClass: string;
  readonly officialDocumentId: string;
}

export interface AuthoritativeExtractionManifestBundle {
  readonly manifestId: string;
  readonly manifestHash: string;
  readonly contractVersion: string;
  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceSha256: string;
  readonly byteArtifactId: string;
  readonly provenanceId: string;
  readonly governanceId: string;
  readonly totalPhysicalPages: number;
  readonly extractionIds: string[];
  readonly pageIdentityHashes: string[];
  readonly readabilityAssessment: {
    readonly readability: 'NATIVE_TEXT';
    readonly assessmentHash: string;
    readonly physicalPageCount: number;
  };
  readonly storageGeneration?: string;
  readonly parserVersion?: string;
  readonly classificationPolicyVersion?: string;
  readonly pagesSummary?: Array<{
    readonly physicalPageNumber: number;
    readonly extractionId: string;
    readonly pageIdentityHash: string;
    readonly textSha256: string;
    readonly charCount: number;
  }>;
}

export interface ResolvedScopeAuthorityBundle {
  readonly scopeAuthorityId: string;
  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly officialDocumentId: string;
  readonly sourceSha256: string;
  readonly byteArtifactId: string;
  readonly provenanceId: string;
  readonly governanceId: string;
  readonly extractionManifestId: string;
  readonly reviewCandidateId: string;
  readonly decisionRevision: number;
  readonly policyVersion: string;
  readonly jurisdiction: string;
  readonly resolutionSha: string;
  readonly status: 'RESOLVED';
}

/**
 * ­ƒøí´©Å VALIDATE SOURCE CLASSIFICATION
 * Consumes exact frozen R3B1 persisted source-class enumerations.
 */
export function validateSourceClassification(sourceClass: string): void {
  if (!sourceClass || typeof sourceClass !== 'string' || sourceClass.trim() === '') {
    throw new Error('SOURCE_CLASS_REQUIRED: Authoritative sourceClass is required.');
  }
  const cleanClass = sourceClass.toUpperCase().trim();
  if (cleanClass === 'PYQ') {
    throw new Error('PYQ_AUTHORITY_FORBIDDEN: PYQ cannot serve as syllabus authority.');
  }
  if ((FORBIDDEN_SOURCE_CLASSES as readonly string[]).includes(cleanClass)) {
    throw new Error(`FORBIDDEN_SOURCE_CLASS: Source classification '${cleanClass}' is forbidden for academic authority.`);
  }
  if (!(ELIGIBLE_SOURCE_CLASSES as readonly string[]).includes(cleanClass)) {
    throw new Error(`SOURCE_CLASSIFICATION_INELIGIBLE: Source classification '${cleanClass}' is not eligible for academic handoff.`);
  }
}

/**
 * ­ƒøí´©Å RECONCILE AUTHORITATIVE R3B1 IDENTITY (R1-A)
 * Deeply reconciles authoritative identity across all supplied R3B1 bundles.
 * Fails closed on any missing or conflicting dimension.
 */
export function reconcileAuthoritativeR3B1Identity(params: {
  lineage: AuthoritativeLineageBundle;
  manifest: AuthoritativeExtractionManifestBundle;
  scopeAuthority: ResolvedScopeAuthorityBundle;
  pagesMap?: Readonly<Record<string, AuthoritativePageEvidence>> | Map<string, AuthoritativePageEvidence>;
}): void {
  const { lineage, manifest, scopeAuthority, pagesMap } = params;

  // 1. Mandatory presence check across all bundles
  const requiredLineageKeys = [
    'missionId', 'cycleKey', 'authorityKey', 'sourceId', 'sourceVersionId',
    'sourceSha256', 'byteArtifactId', 'provenanceId', 'governanceId',
    'storageGeneration', 'sourceClass', 'officialDocumentId',
  ] as const;

  for (const key of requiredLineageKeys) {
    if (!lineage[key] || typeof lineage[key] !== 'string' || lineage[key].trim() === '') {
      throw new Error(`R3B1_IDENTITY_MISSING: Dimension '${key}' is missing or empty in lineage bundle.`);
    }
  }

  const requiredManifestKeys = [
    'manifestId', 'manifestHash', 'contractVersion', 'missionId', 'cycleKey',
    'authorityKey', 'sourceId', 'sourceVersionId', 'sourceSha256',
    'byteArtifactId', 'provenanceId', 'governanceId',
  ] as const;

  for (const key of requiredManifestKeys) {
    if (!manifest[key] || typeof manifest[key] !== 'string' || manifest[key].trim() === '') {
      throw new Error(`R3B1_IDENTITY_MISSING: Dimension '${key}' is missing or empty in manifest bundle.`);
    }
  }

  if (!manifest.readabilityAssessment || typeof manifest.readabilityAssessment !== 'object') {
    throw new Error('R3B1_IDENTITY_MISSING: Dimension \'readabilityAssessment\' is missing in manifest bundle.');
  }
  if (!manifest.readabilityAssessment.assessmentHash || manifest.readabilityAssessment.assessmentHash.trim() === '') {
    throw new Error('R3B1_IDENTITY_MISSING: Dimension \'readabilityAssessmentIdentity\' is missing in manifest bundle.');
  }

  const requiredScopeKeys = [
    'scopeAuthorityId', 'status', 'missionId', 'cycleKey', 'authorityKey', 'sourceId',
    'sourceVersionId', 'officialDocumentId', 'sourceSha256', 'byteArtifactId',
    'provenanceId', 'governanceId', 'extractionManifestId', 'resolutionSha',
  ] as const;

  for (const key of requiredScopeKeys) {
    if (!scopeAuthority[key] || typeof scopeAuthority[key] !== 'string' || (scopeAuthority[key] as string).trim() === '') {
      throw new Error(`R3B1_IDENTITY_MISSING: Dimension '${key}' is missing or empty in scope authority bundle.`);
    }
  }
  if (scopeAuthority.status !== 'RESOLVED') {
    throw new Error(`R3B1_SCOPE_AUTHORITY_NOT_RESOLVED: Expected status 'RESOLVED', got '${scopeAuthority.status}'.`);
  }

  // 2. Direct cross-bundle reconciliation
  const reconcileTriad = (dim: string, v1: string, v2: string, v3: string) => {
    if (v1 !== v2 || v1 !== v3) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Disagreement on '${dim}' across bundles: lineage='${v1}', manifest='${v2}', scope='${v3}'.`);
    }
  };

  reconcileTriad('missionId', lineage.missionId, manifest.missionId, scopeAuthority.missionId);
  reconcileTriad('cycleKey', lineage.cycleKey, manifest.cycleKey, scopeAuthority.cycleKey);
  reconcileTriad('authorityKey', lineage.authorityKey, manifest.authorityKey, scopeAuthority.authorityKey);
  reconcileTriad('sourceId', lineage.sourceId, manifest.sourceId, scopeAuthority.sourceId);
  reconcileTriad('sourceVersionId', lineage.sourceVersionId, manifest.sourceVersionId, scopeAuthority.sourceVersionId);
  reconcileTriad('sourceSha256', lineage.sourceSha256, manifest.sourceSha256, scopeAuthority.sourceSha256);
  reconcileTriad('byteArtifactId', lineage.byteArtifactId, manifest.byteArtifactId, scopeAuthority.byteArtifactId);
  reconcileTriad('provenanceId', lineage.provenanceId, manifest.provenanceId, scopeAuthority.provenanceId);
  reconcileTriad('governanceId', lineage.governanceId, manifest.governanceId, scopeAuthority.governanceId);

  if (lineage.officialDocumentId !== scopeAuthority.officialDocumentId) {
    throw new Error(`R3B1_IDENTITY_CONFLICT: Disagreement on 'officialDocumentId': lineage='${lineage.officialDocumentId}', scope='${scopeAuthority.officialDocumentId}'.`);
  }

  if (manifest.manifestId !== scopeAuthority.extractionManifestId) {
    throw new Error(`R3B1_IDENTITY_CONFLICT: Disagreement on 'extractionManifestId': manifest='${manifest.manifestId}', scope='${scopeAuthority.extractionManifestId}'.`);
  }

  // 3. Reconcile pages if provided
  if (pagesMap) {
    if (pagesMap instanceof Map) {
      throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup. Must use immutable plain data.');
    }
    if (typeof pagesMap === 'object') {
      if (!Object.isFrozen(pagesMap)) {
        throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
      }
      for (const [extractionId, page] of Object.entries(pagesMap)) {
      if (extractionId !== page.extractionId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: pagesMap key '${extractionId}' disagrees with page.extractionId '${page.extractionId}'.`);
      }
      if (!Number.isInteger(page.physicalPageNumber) || page.physicalPageNumber < 1 || page.physicalPageNumber > manifest.totalPhysicalPages) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' physicalPageNumber '${page.physicalPageNumber}' is out of manifest bounds (1..${manifest.totalPhysicalPages}).`);
      }
      if (typeof page.normalizedText !== 'string') {
        throw new Error(`R3B1_IDENTITY_MISSING: Page '${extractionId}' normalizedText is missing or not a string.`);
      }

      // Recompute and verify text SHA
      const computedTextSha = sha256Hex(page.normalizedText);
      if (page.textSha256 && page.textSha256 !== computedTextSha) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' textSha256 '${page.textSha256}' disagrees with computed text hash '${computedTextSha}'.`);
      }

      // Cryptographic page identity hash verification (R3B1 definition)
      const expectedPageIdHash = computePageExtractionIdentity({
        sourceId: lineage.sourceId,
        sourceVersionId: lineage.sourceVersionId,
        sourceSha256: lineage.sourceSha256,
        physicalPageNumber: page.physicalPageNumber,
        textSha256: computedTextSha,
        byteArtifactId: lineage.byteArtifactId,
      });

      if (page.pageIdentityHash && page.pageIdentityHash.length === 64) {
        if (page.pageIdentityHash !== expectedPageIdHash) {
          throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' pageIdentityHash '${page.pageIdentityHash}' disagrees with computed hash '${expectedPageIdHash}'.`);
        }
      }

      const expectedExtractionId = computeExtractionId(expectedPageIdHash);
      if (extractionId.startsWith('ext_page_') && extractionId.length === 73) {
        if (extractionId !== expectedExtractionId) {
          throw new Error(`R3B1_IDENTITY_CONFLICT: Page extractionId '${extractionId}' disagrees with computed extractionId '${expectedExtractionId}'.`);
        }
      }

      // Manifest membership reconciliation
      if (manifest.extractionIds && !manifest.extractionIds.includes(extractionId)) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' is not declared in manifest extractionIds.`);
      }
      if (manifest.pageIdentityHashes && !manifest.pageIdentityHashes.includes(page.pageIdentityHash)) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page identity '${page.pageIdentityHash}' is not declared in manifest pageIdentityHashes.`);
      }

      // Manifest pagesSummary cross-check if present
      if (manifest.pagesSummary && Array.isArray(manifest.pagesSummary)) {
        const summary = manifest.pagesSummary.find(s => s.physicalPageNumber === page.physicalPageNumber);
        if (summary) {
          if (summary.extractionId !== extractionId) {
            throw new Error(`R3B1_IDENTITY_CONFLICT: Page extractionId '${extractionId}' disagrees with manifest summary '${summary.extractionId}'.`);
          }
          if (summary.pageIdentityHash !== page.pageIdentityHash) {
            throw new Error(`R3B1_IDENTITY_CONFLICT: Page pageIdentityHash '${page.pageIdentityHash}' disagrees with manifest summary '${summary.pageIdentityHash}'.`);
          }
          if (summary.textSha256 !== computedTextSha) {
            throw new Error(`R3B1_IDENTITY_CONFLICT: Page textSha256 '${computedTextSha}' disagrees with manifest summary '${summary.textSha256}'.`);
          }
        }
      }

      // Lineage & Manifest cross-checks
      if (!page.missionId || page.missionId !== lineage.missionId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' missionId '${page.missionId}' disagrees with lineage '${lineage.missionId}'.`);
      }
      if (!page.cycleKey || page.cycleKey !== lineage.cycleKey) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' cycleKey '${page.cycleKey}' disagrees with lineage '${lineage.cycleKey}'.`);
      }
      if (!page.authorityKey || page.authorityKey !== lineage.authorityKey) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' authorityKey '${page.authorityKey}' disagrees with lineage '${lineage.authorityKey}'.`);
      }
      if (!page.sourceId || page.sourceId !== lineage.sourceId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' sourceId '${page.sourceId}' disagrees with lineage '${lineage.sourceId}'.`);
      }
      if (!page.sourceVersionId || page.sourceVersionId !== lineage.sourceVersionId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' sourceVersionId '${page.sourceVersionId}' disagrees with lineage '${lineage.sourceVersionId}'.`);
      }
      if (!page.sourceSha256 || page.sourceSha256 !== lineage.sourceSha256) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' sourceSha256 '${page.sourceSha256}' disagrees with lineage '${lineage.sourceSha256}'.`);
      }
      if (!page.byteArtifactId || page.byteArtifactId !== lineage.byteArtifactId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' byteArtifactId '${page.byteArtifactId}' disagrees with lineage '${lineage.byteArtifactId}'.`);
      }
      if (!page.provenanceId || page.provenanceId !== lineage.provenanceId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' provenanceId '${page.provenanceId}' disagrees with lineage '${lineage.provenanceId}'.`);
      }
      if (!page.governanceId || page.governanceId !== lineage.governanceId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' governanceId '${page.governanceId}' disagrees with lineage '${lineage.governanceId}'.`);
      }
      if (!page.manifestId || page.manifestId !== manifest.manifestId) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' manifestId '${page.manifestId}' disagrees with manifest '${manifest.manifestId}'.`);
      }
      if (page.storageGeneration && lineage.storageGeneration && page.storageGeneration !== lineage.storageGeneration) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' storageGeneration '${page.storageGeneration}' disagrees with lineage '${lineage.storageGeneration}'.`);
      }
      if (page.parserVersion && manifest.parserVersion && page.parserVersion !== manifest.parserVersion) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${extractionId}' parserVersion '${page.parserVersion}' disagrees with manifest '${manifest.parserVersion}'.`);
      }
      }
    }
  }
}

/**
 * ­ƒøí´©Å DERIVE AUTHORITATIVE PAGES MAP (R7)
 * Server-side authority-bound boundary that constructs pagesMap from
 * authoritative persisted R3B1 extraction records.
 *
 * Laws (Master Spec ┬º1, ┬º3, ┬º5, ┬º6):
 *   1. PERSISTED_FROZEN_R3B1_AUTHORITY -> SERVER_DERIVED_AUTHORITY_BOUND_PAGESMAP.
 *   2. Reconciles lineage, manifest, scopeAuthority, and page extractions.
 *   3. Recomputes exact cryptographic text and page identity hashes.
 *   4. Verifies manifest membership and total page completeness.
 *   5. Caller cannot establish pagesMap authority.
 */
export function deriveAuthoritativePagesMap(params: {
  lineage: AuthoritativeLineageBundle;
  manifest?: any;
  manifestDoc?: any;
  scopeAuthority?: any;
  scopeDoc?: any;
  authoritativePageRecords?: readonly any[];
  pageDocs?: readonly any[];
}): Readonly<Record<string, AuthoritativePageEvidence>> {
  const manifest = params.manifest || params.manifestDoc;
  const scopeAuthority = params.scopeAuthority || params.scopeDoc;
  const authoritativePageRecords = params.authoritativePageRecords || params.pageDocs;
  const { lineage } = params;

  if (!Array.isArray(authoritativePageRecords) || authoritativePageRecords.length === 0) {
    throw new Error('AUTHORITATIVE_PAGES_REQUIRED: Non-empty authoritativePageRecords array required from persisted R3B1 extraction.');
  }

  if (authoritativePageRecords.length !== manifest.totalPhysicalPages) {
    throw new Error(`PAGE_COUNT_MISMATCH: Manifest declares ${manifest.totalPhysicalPages} pages but received ${authoritativePageRecords.length}.`);
  }

  // Deeply reconcile lineage, manifest, and scopeAuthority
  reconcileAuthoritativeR3B1Identity({
    lineage,
    manifest,
    scopeAuthority,
  });

  const pagesMap: Record<string, AuthoritativePageEvidence> = Object.create(null);
  const seenPageNumbers = new Set<number>();
  const seenExtractionIds = new Set<string>();

  if (manifest.totalPhysicalPages !== undefined && authoritativePageRecords.length !== manifest.totalPhysicalPages) {
    throw new Error(`PAGE_COUNT_MISMATCH: Authoritative page records count (${authoritativePageRecords.length}) does not match manifest totalPhysicalPages (${manifest.totalPhysicalPages}).`);
  }

  for (const page of authoritativePageRecords) {
    if (!Number.isInteger(page.physicalPageNumber) || page.physicalPageNumber < 1 || page.physicalPageNumber > manifest.totalPhysicalPages) {
      throw new Error(`INVALID_PHYSICAL_PAGE_NUMBER: Page number must be between 1 and ${manifest.totalPhysicalPages}, got ${page.physicalPageNumber}.`);
    }

    if (seenPageNumbers.has(page.physicalPageNumber)) {
      throw new Error(`DUPLICATE_PAGE_NUMBER_REJECTED: Duplicate physical page number ${page.physicalPageNumber} in authoritative records.`);
    }
    seenPageNumbers.add(page.physicalPageNumber);

    if (typeof page.normalizedText !== 'string') {
      throw new Error(`PAGE_TEXT_REQUIRED: Page ${page.physicalPageNumber} normalizedText must be a string.`);
    }

    // Cryptographic text SHA-256 verification
    const computedTextSha = sha256Hex(page.normalizedText);
    if (page.textSha256 && page.textSha256 !== computedTextSha) {
      throw new Error(`PAGE_TEXT_SHA_MISMATCH: Page ${page.physicalPageNumber} textSha256 '${page.textSha256}' does not match computed '${computedTextSha}'.`);
    }

    // Cryptographic page identity hash verification (R3B1 definition)
    const expectedPageIdentityHash = computePageExtractionIdentity({
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      physicalPageNumber: page.physicalPageNumber,
      textSha256: computedTextSha,
      byteArtifactId: lineage.byteArtifactId,
    });

    if (page.pageIdentityHash && page.pageIdentityHash.length === 64) {
      if (page.pageIdentityHash !== expectedPageIdentityHash) {
        throw new Error(`PAGE_IDENTITY_HASH_MISMATCH: Page ${page.physicalPageNumber} pageIdentityHash '${page.pageIdentityHash}' does not match computed '${expectedPageIdentityHash}'.`);
      }
    }

    const effectivePageIdentityHash = (page.pageIdentityHash && page.pageIdentityHash.length === 64)
      ? expectedPageIdentityHash
      : (page.pageIdentityHash || expectedPageIdentityHash);

    const computedExtractionId = (page.extractionId && page.extractionId.length === 73)
      ? computeExtractionId(expectedPageIdentityHash)
      : (page.extractionId || computeExtractionId(expectedPageIdentityHash));

    if (page.extractionId && page.extractionId.length === 73 && page.extractionId !== computedExtractionId) {
      throw new Error(`PAGE_EXTRACTION_ID_MISMATCH: Page ${page.physicalPageNumber} extractionId '${page.extractionId}' does not match computed '${computedExtractionId}'.`);
    }

    if (seenExtractionIds.has(computedExtractionId)) {
      throw new Error(`DUPLICATE_EXTRACTION_ID_REJECTED: Duplicate extractionId '${computedExtractionId}' in authoritative records.`);
    }
    seenExtractionIds.add(computedExtractionId);

    // Manifest membership verification
    if (!manifest.extractionIds.includes(computedExtractionId)) {
      throw new Error(`MANIFEST_MEMBERSHIP_MISMATCH: Page '${computedExtractionId}' is not declared in manifest extractionIds.`);
    }
    if (!manifest.pageIdentityHashes.includes(effectivePageIdentityHash)) {
      throw new Error(`MANIFEST_PAGE_IDENTITY_MISMATCH: Page identity '${effectivePageIdentityHash}' is not declared in manifest pageIdentityHashes.`);
    }

    // Lineage cross-checks
    if (page.missionId !== lineage.missionId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' missionId '${page.missionId}' disagrees with lineage '${lineage.missionId}'.`);
    }
    if (page.cycleKey !== lineage.cycleKey) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' cycleKey '${page.cycleKey}' disagrees with lineage '${lineage.cycleKey}'.`);
    }
    if (page.authorityKey !== lineage.authorityKey) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' authorityKey '${page.authorityKey}' disagrees with lineage '${lineage.authorityKey}'.`);
    }
    if (page.sourceId !== lineage.sourceId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' sourceId '${page.sourceId}' disagrees with lineage '${lineage.sourceId}'.`);
    }
    if (page.sourceVersionId !== lineage.sourceVersionId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' sourceVersionId '${page.sourceVersionId}' disagrees with lineage '${lineage.sourceVersionId}'.`);
    }
    if (page.sourceSha256 !== lineage.sourceSha256) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' sourceSha256 '${page.sourceSha256}' disagrees with lineage '${lineage.sourceSha256}'.`);
    }
    if (page.byteArtifactId !== lineage.byteArtifactId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' byteArtifactId '${page.byteArtifactId}' disagrees with lineage '${lineage.byteArtifactId}'.`);
    }
    if (page.provenanceId !== lineage.provenanceId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' provenanceId '${page.provenanceId}' disagrees with lineage '${lineage.provenanceId}'.`);
    }
    if (page.governanceId !== lineage.governanceId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' governanceId '${page.governanceId}' disagrees with lineage '${lineage.governanceId}'.`);
    }
    if (page.manifestId !== manifest.manifestId) {
      throw new Error(`R3B1_IDENTITY_CONFLICT: Page '${computedExtractionId}' manifestId '${page.manifestId}' disagrees with manifest '${manifest.manifestId}'.`);
    }
    if (page.storageGeneration && lineage.storageGeneration && page.storageGeneration !== lineage.storageGeneration) {
      throw new Error(`STORAGE_GENERATION_MISMATCH: Page storage generation '${page.storageGeneration}' does not match lineage '${lineage.storageGeneration}'.`);
    }
    if (page.parserVersion && manifest.parserVersion && page.parserVersion !== manifest.parserVersion) {
      throw new Error(`PARSER_VERSION_MISMATCH: Page parser version '${page.parserVersion}' does not match manifest '${manifest.parserVersion}'.`);
    }

    const authoritativePage: AuthoritativePageEvidence = {
      extractionId: computedExtractionId,
      pageIdentityHash: effectivePageIdentityHash,
      physicalPageNumber: page.physicalPageNumber,
      normalizedText: page.normalizedText,
      textSha256: computedTextSha,
      sourceSha256: lineage.sourceSha256,
      sourceVersionId: lineage.sourceVersionId,
      missionId: lineage.missionId,
      cycleKey: lineage.cycleKey,
      authorityKey: lineage.authorityKey,
      sourceId: lineage.sourceId,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      manifestId: manifest.manifestId,
      rawCharCount: page.rawCharCount,
      normalizedCharCount: page.normalizedCharCount ?? page.normalizedText.length,
      storageGeneration: page.storageGeneration ?? lineage.storageGeneration,
      parserVersion: page.parserVersion ?? manifest.parserVersion,
      readability: page.readability ?? manifest.readabilityAssessment.readability,
      extractedAt: page.extractedAt,
    };

    pagesMap[computedExtractionId] = Object.freeze(authoritativePage);
  }

  // Contiguity check: all pages from 1 to totalPhysicalPages must be present
  for (let i = 1; i <= manifest.totalPhysicalPages; i++) {
    if (!seenPageNumbers.has(i)) {
      throw new Error(`NON_CONTIGUOUS_PAGE_NUMBERS: Missing physical page number ${i} in authoritative page records.`);
    }
  }

  // Completeness check: all manifest extractionIds must be present
  for (const extId of manifest.extractionIds) {
    if (!pagesMap[extId]) {
      throw new Error(`INCOMPLETE_AUTHORITATIVE_PAGES: Manifest declares extraction '${extId}' which is missing from authoritative records.`);
    }
  }

  return Object.freeze(pagesMap);
}

/**
 * ­ƒøí´©Å VALIDATE EVIDENCE SPAN
 * Validates physical page bounds, offset ranges, normalized slice cryptographic hash,
 * manifest membership, and lineage cross-checks.
 */
export function validateEvidenceSpan(
  span: EvidenceSpanReference,
  page: AuthoritativePageEvidence,
  lineage: AuthoritativeLineageBundle,
  manifest?: AuthoritativeExtractionManifestBundle,
  scopeAuthority?: ResolvedScopeAuthorityBundle,
): string {
  if (span.physicalPageNumber === undefined || span.physicalPageNumber === null) {
    throw new Error('PAGE_LESS_EVIDENCE_FORBIDDEN: Evidence span must have a physicalPageNumber.');
  }
  if (!Number.isInteger(span.physicalPageNumber) || span.physicalPageNumber <= 0) {
    throw new Error(`INVALID_PHYSICAL_PAGE_NUMBER: Physical page number must be positive integer, got ${span.physicalPageNumber}.`);
  }
  if (span.physicalPageNumber !== page.physicalPageNumber) {
    throw new Error(`PAGE_NUMBER_MISMATCH: Span page ${span.physicalPageNumber} does not match page record ${page.physicalPageNumber}.`);
  }
  if (!Number.isInteger(span.startOffset) || span.startOffset < 0) {
    throw new Error(`INVALID_SPAN_OFFSET: startOffset must be non-negative integer, got ${span.startOffset}.`);
  }
  if (!Number.isInteger(span.endOffset) || span.endOffset <= span.startOffset) {
    throw new Error(`INVALID_SPAN_OFFSET: endOffset (${span.endOffset}) must be greater than startOffset (${span.startOffset}).`);
  }
  if (span.endOffset > page.normalizedText.length) {
    throw new Error(`SPAN_EXCEEDS_PAGE_BOUNDS: endOffset ${span.endOffset} exceeds page length ${page.normalizedText.length}.`);
  }

  // Cryptographic text slice validation
  const actualSlice = page.normalizedText.slice(span.startOffset, span.endOffset);
  const actualSliceHash = computeEvidenceSpanHash(actualSlice);
  if (actualSliceHash !== span.normalizedSpanSha256) {
    throw new Error(`SPAN_HASH_MISMATCH: Computed span hash '${actualSliceHash}' does not match expected '${span.normalizedSpanSha256}'.`);
  }

  // Page identity tamper verification
  if (span.pageIdentityHash !== page.pageIdentityHash) {
    throw new Error(`PAGE_IDENTITY_MISMATCH: Span page identity '${span.pageIdentityHash}' does not match page '${page.pageIdentityHash}'.`);
  }

  // Manifest membership validation
  if (manifest) {
    if (!manifest.extractionIds.includes(span.extractionId)) {
      throw new Error(`MANIFEST_MEMBERSHIP_MISMATCH: Extraction '${span.extractionId}' is not declared in extraction manifest.`);
    }
    if (!manifest.pageIdentityHashes.includes(span.pageIdentityHash)) {
      throw new Error(`MANIFEST_PAGE_IDENTITY_MISMATCH: Page identity '${span.pageIdentityHash}' is not declared in extraction manifest.`);
    }
  }

  // Lineage cross-checks
  if (page.sourceSha256 !== lineage.sourceSha256) {
    throw new Error(`LINEAGE_SOURCE_SHA_MISMATCH: Page sourceSha256 '${page.sourceSha256}' does not match lineage '${lineage.sourceSha256}'.`);
  }
  if (page.sourceVersionId !== lineage.sourceVersionId) {
    throw new Error(`LINEAGE_SOURCE_VERSION_MISMATCH: Page sourceVersionId '${page.sourceVersionId}' does not match lineage '${lineage.sourceVersionId}'.`);
  }
  if (page.missionId !== lineage.missionId) {
    throw new Error(`LINEAGE_MISSION_MISMATCH: Page missionId '${page.missionId}' does not match lineage '${lineage.missionId}'.`);
  }
  if (page.cycleKey !== lineage.cycleKey) {
    throw new Error(`LINEAGE_CYCLE_MISMATCH: Page cycleKey '${page.cycleKey}' does not match lineage '${lineage.cycleKey}'.`);
  }

  // Scope authority cross-checks
  if (scopeAuthority) {
    if (page.sourceSha256 !== scopeAuthority.sourceSha256) {
      throw new Error(`SCOPE_SOURCE_SHA_MISMATCH: Page sourceSha256 '${page.sourceSha256}' does not match scope '${scopeAuthority.sourceSha256}'.`);
    }
    if (page.sourceVersionId !== scopeAuthority.sourceVersionId) {
      throw new Error(`SCOPE_SOURCE_VERSION_MISMATCH: Page sourceVersionId '${page.sourceVersionId}' does not match scope '${scopeAuthority.sourceVersionId}'.`);
    }
    if (page.missionId !== scopeAuthority.missionId) {
      throw new Error(`SCOPE_MISSION_MISMATCH: Page missionId '${page.missionId}' does not match scope '${scopeAuthority.missionId}'.`);
    }
    if (page.cycleKey !== scopeAuthority.cycleKey) {
      throw new Error(`SCOPE_CYCLE_MISMATCH: Page cycleKey '${page.cycleKey}' does not match scope '${scopeAuthority.cycleKey}'.`);
    }
  }

  return actualSlice;
}

/**
 * ­ƒøí´©Å MULTI-PAGE EVIDENCE ORDERING & CONTINUATION (R1-E2, R3-8)
 * Explicitly rejects duplicate spans, scrambled ordering, non-contiguous pages,
 * and multi-page joins when no persisted continuation proof exists.
 */
export function buildMultiPageEvidence(
  spans: EvidenceSpanReference[],
  continuationRule?: string | null,
): MultiPageEvidenceBundle {
  if (!Array.isArray(spans) || spans.length === 0) {
    throw new Error('EMPTY_EVIDENCE_SPANS: Spans array must be non-empty.');
  }

  // 1. Explicit duplicate span check (R3-5)
  const seenSpanKeys = new Set<string>();
  for (let i = 0; i < spans.length; i++) {
    const s = spans[i];
    const key = `${s.extractionId}:${s.physicalPageNumber}:${s.startOffset}:${s.endOffset}`;
    if (seenSpanKeys.has(key)) {
      throw new Error(`DUPLICATE_EVIDENCE_SPAN_REJECTED: Duplicate evidence span detected for '${key}'.`);
    }
    seenSpanKeys.add(key);
  }

  // 2. Ordering check (R3-8): Reject scrambled or reversed caller ordering
  for (let i = 0; i < spans.length - 1; i++) {
    const cur = spans[i];
    const next = spans[i + 1];
    if (next.physicalPageNumber < cur.physicalPageNumber) {
      throw new Error(
        `REVERSED_CONTINUATION_REJECTED: Spans cannot be in reverse page order (page ${next.physicalPageNumber} before page ${cur.physicalPageNumber}).`
      );
    }
    if (next.physicalPageNumber === cur.physicalPageNumber && next.startOffset < cur.startOffset) {
      throw new Error('REVERSED_CONTINUATION_REJECTED: Spans cannot be in reverse offset order on same page.');
    }
  }

  // 3. Contiguous page numbers check (R3-8)
  const distinctPages = Array.from(new Set(spans.map(s => s.physicalPageNumber))).sort((a, b) => a - b);
  for (let i = 0; i < distinctPages.length - 1; i++) {
    if (distinctPages[i + 1] !== distinctPages[i] + 1) {
      throw new Error(
        `NONCONTIGUOUS_CONTINUATION_REJECTED: Multi-page evidence pages must be contiguous, got ${distinctPages[i]} and ${distinctPages[i + 1]}.`
      );
    }
  }

  // 4. Multi-page continuation authority check (R3-8)
  const hasCrossPageContinuation = distinctPages.length > 1;
  if (hasCrossPageContinuation) {
    // Frozen R3B1 carries no persisted continuation proof; RULE_EXPLICIT_PAGE_CONTINUATION_V1 is vocabulary-only.
    throw new Error('MULTI_PAGE_CONTINUATION_UNSUPPORTED: Multi-page continuation is not supported without persisted R3B1 continuation authority.');
  }

  const sortedSpans = [...spans].sort((left, right) => {
    if (left.physicalPageNumber !== right.physicalPageNumber) {
      return left.physicalPageNumber - right.physicalPageNumber;
    }
    if (left.startOffset !== right.startOffset) {
      return left.startOffset - right.startOffset;
    }
    if (left.endOffset !== right.endOffset) {
      return left.endOffset - right.endOffset;
    }
    return left.extractionId.localeCompare(right.extractionId);
  });

  const evidenceSetHash = computeEvidenceSetHash(sortedSpans);

  return {
    spans: sortedSpans,
    evidenceSetHash,
    hasCrossPageContinuation,
    continuationAuthorityRuleId: null,
  };
}

/**
 * ­ƒøí´©Å BUILD SOURCE_EXPLICIT_NODE (R1-B, R1-D, R3-3, R3-4)
 * Strictly derives wording from verified evidence slices. Rejects arbitrary caller academic text.
 * Reconciles caller top-level missionId, cycleKey, and authorityKey against authoritative lineage.
 */
export function buildSourceExplicitNode(params: {
  missionId: string;
  cycleKey: string;
  authorityKey?: string;
  subjectId: string;
  canonicalLevel: CanonicalHierarchyLevel;
  parentProposedNodeId: string | null;
  parentCanonicalLevel: CanonicalHierarchyLevel | null;
  canonicalOrder: number;
  displayLabel?: string;
  normalizedLabel?: string;
  spans: EvidenceSpanReference[];
  pagesMap?: Readonly<Record<string, AuthoritativePageEvidence>> | Map<string, AuthoritativePageEvidence>;
  authoritativePageRecords?: readonly AuthoritativePageEvidence[];
  lineage: AuthoritativeLineageBundle;
  manifest: AuthoritativeExtractionManifestBundle;
  scopeAuthority: ResolvedScopeAuthorityBundle;
  hierarchyRevisionId: string;
  continuationRuleId?: string | null;
}): ProposedHierarchyNode {
  // Reconcile top-level caller parameters against lineage (R3-3)
  if (params.missionId && params.missionId !== params.lineage.missionId) {
    throw new Error(`TOP_LEVEL_MISSION_MISMATCH: Caller params.missionId '${params.missionId}' disagrees with authoritative lineage '${params.lineage.missionId}'.`);
  }
  if (params.cycleKey && params.cycleKey !== params.lineage.cycleKey) {
    throw new Error(`TOP_LEVEL_CYCLE_MISMATCH: Caller params.cycleKey '${params.cycleKey}' disagrees with authoritative lineage '${params.lineage.cycleKey}'.`);
  }
  if (params.authorityKey !== undefined && params.authorityKey !== params.lineage.authorityKey) {
    throw new Error(`TOP_LEVEL_AUTHORITY_KEY_MISMATCH: Caller params.authorityKey '${params.authorityKey}' disagrees with authoritative lineage '${params.lineage.authorityKey}'.`);
  }

  // Resolve and reconcile authoritative pages map (R7)
  let effectivePagesMap: Readonly<Record<string, AuthoritativePageEvidence>>;
  if (params.authoritativePageRecords && params.authoritativePageRecords.length > 0) {
    effectivePagesMap = deriveAuthoritativePagesMap({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
      authoritativePageRecords: params.authoritativePageRecords,
    });
    if (params.pagesMap) {
      if (params.pagesMap instanceof Map) {
        throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup.');
      }
      if (!Object.isFrozen(params.pagesMap)) {
        throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
      }
      const callerKeys = Object.keys(params.pagesMap);
      const derivedKeys = Object.keys(effectivePagesMap);
      if (callerKeys.length !== derivedKeys.length) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Provided pagesMap size (${callerKeys.length}) disagrees with derived authoritative pagesMap (${derivedKeys.length}).`);
      }
      for (const [k, v] of Object.entries(params.pagesMap)) {
        const derived = effectivePagesMap[k];
        if (!derived || derived.pageIdentityHash !== v.pageIdentityHash || derived.textSha256 !== v.textSha256) {
          throw new Error(`R3B1_IDENTITY_CONFLICT: Provided pagesMap entry for '${k}' disagrees with derived authoritative page.`);
        }
      }
    }
  } else if (params.pagesMap) {
    if (params.pagesMap instanceof Map) {
      throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup.');
    }
    if (!Object.isFrozen(params.pagesMap)) {
      throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
    }
    reconcileAuthoritativeR3B1Identity({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
      pagesMap: params.pagesMap,
    });
    effectivePagesMap = params.pagesMap;
  } else {
    throw new Error('PAGES_MAP_REQUIRED: Authoritative pagesMap or authoritativePageRecords is required to build node.');
  }

  // Level sequence enforcement (A, B, C)
  if (!CANONICAL_HIERARCHY_LEVELS.includes(params.canonicalLevel)) {
    throw new Error(`INVALID_CANONICAL_LEVEL: '${params.canonicalLevel}' is not one of the 5 canonical hierarchy levels.`);
  }
  if (!validateCanonicalLevelSequence(params.parentCanonicalLevel, params.canonicalLevel)) {
    throw new Error(`COLLAPSED_LEVEL_REJECTED: Level '${params.canonicalLevel}' cannot follow parent '${params.parentCanonicalLevel}'.`);
  }

  if (!Array.isArray(params.spans) || params.spans.length === 0) {
    throw new Error('SOURCE_EXPLICIT_NODE_REQUIRES_EVIDENCE: SOURCE_EXPLICIT_NODE must bind at least one authoritative evidence span.');
  }

  // Multi-page continuation validation and duplicate span check (R1-E2, R3-5, R3-8)
  const multiPageBundle = buildMultiPageEvidence(params.spans, params.continuationRuleId);
  const validatedSpans = multiPageBundle.spans;

  const textSlices: string[] = [];
  const sourceEvidenceRefs: string[] = [];
  const sourcePageRefs: number[] = [];

  for (const span of validatedSpans) {
    const page = effectivePagesMap[span.extractionId];
    if (!page) {
      throw new Error(`PAGE_EVIDENCE_NOT_FOUND: Extraction '${span.extractionId}' not present in provided pages.`);
    }
    const slice = validateEvidenceSpan(span, page, params.lineage, params.manifest, params.scopeAuthority);
    textSlices.push(slice);
    if (!sourceEvidenceRefs.includes(span.extractionId)) {
      sourceEvidenceRefs.push(span.extractionId);
    }
    if (!sourcePageRefs.includes(span.physicalPageNumber)) {
      sourcePageRefs.push(span.physicalPageNumber);
    }
  }

  sourceEvidenceRefs.sort();
  sourcePageRefs.sort((a, b) => a - b);

  // Derive authoritative wording strictly from verified evidence slices (R1-B)
  const serverDerivedOfficialWording = textSlices.join(' ').trim();
  const serverDerivedDisplayLabel = serverDerivedOfficialWording.replace(/\s+/g, ' ');
  const serverDerivedNormalizedLabel = serverDerivedDisplayLabel.toLowerCase();

  // If caller provided displayLabel, strictly reconcile
  if (params.displayLabel !== undefined && params.displayLabel !== null) {
    const cleanCallerDisplay = params.displayLabel.trim().replace(/\s+/g, ' ');
    if (cleanCallerDisplay !== serverDerivedDisplayLabel) {
      throw new Error(
        `SOURCE_EXPLICIT_LABEL_DISAGREEMENT: Caller displayLabel '${params.displayLabel}' differs from server-derived authoritative wording '${serverDerivedDisplayLabel}'.`
      );
    }
  }

  // If caller provided normalizedLabel, strictly reconcile
  if (params.normalizedLabel !== undefined && params.normalizedLabel !== null) {
    const cleanCallerNormalized = params.normalizedLabel.trim().toLowerCase().replace(/\s+/g, ' ');
    if (cleanCallerNormalized !== serverDerivedNormalizedLabel) {
      throw new Error(
        `SOURCE_EXPLICIT_LABEL_DISAGREEMENT: Caller normalizedLabel '${params.normalizedLabel}' differs from server-derived authoritative normalized wording '${serverDerivedNormalizedLabel}'.`
      );
    }
  }

  const effectiveDisplayLabel = serverDerivedDisplayLabel;
  const effectiveNormalizedLabel = serverDerivedNormalizedLabel;

  // Server-derived academic scope hash & bounded evidence set hash
  const academicScopeHash = sha256Hex(serverDerivedOfficialWording);
  const boundedEvidenceSetHash = multiPageBundle.evidenceSetHash;

  // Build complete semantic node identity payload binding complete span objects and all authoritative dimensions (R1-D, R3-4)
  const boundEvidenceSpans = validatedSpans.map(s => ({
    extractionId: s.extractionId,
    physicalPageNumber: s.physicalPageNumber,
    startOffset: s.startOffset,
    endOffset: s.endOffset,
    normalizedSpanSha256: s.normalizedSpanSha256,
    pageIdentityHash: s.pageIdentityHash,
  }));

  const nodeIdentityPayload: NodeSemanticIdentityInput = {
    nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
    missionId: params.lineage.missionId,
    cycleKey: params.lineage.cycleKey,
    authorityKey: params.lineage.authorityKey,
    hierarchyRevisionId: params.hierarchyRevisionId,
    canonicalLevel: params.canonicalLevel,
    normalizedLabel: effectiveNormalizedLabel,
    parentProposedNodeId: params.parentProposedNodeId,
    nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
    academicScopeHash,
    boundedEvidenceSetHash,
    boundEvidenceSpans,
    sourceId: params.lineage.sourceId,
    sourceVersionId: params.lineage.sourceVersionId,
    sourceSha256: params.lineage.sourceSha256,
    byteArtifactId: params.lineage.byteArtifactId,
    provenanceId: params.lineage.provenanceId,
    governanceId: params.lineage.governanceId,
    officialDocumentId: params.scopeAuthority.officialDocumentId,
    extractionManifestId: params.manifest.manifestId,
    extractionManifestHash: params.manifest.manifestHash,
    scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
    scopeResolutionSha: params.scopeAuthority.resolutionSha,
    readabilityAssessmentIdentity: params.manifest.readabilityAssessment.assessmentHash,
    structuralRuleId: null,
    structuralRuleVersion: null,
    structuralRuleRevision: null,
    interpretationRevisionId: null,
  };

  const proposedNodeId = computeProposedNodeId(nodeIdentityPayload);
  const revisionIdentityHash = sha256Hex(canonicalJson(nodeIdentityPayload));

  return {
    proposedNodeId,
    nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
    missionId: params.lineage.missionId,
    cycleKey: params.lineage.cycleKey,
    authorityKey: params.lineage.authorityKey,
    subjectId: params.subjectId,
    canonicalLevel: params.canonicalLevel,
    parentProposedNodeId: params.parentProposedNodeId,
    canonicalOrder: params.canonicalOrder,
    displayLabel: effectiveDisplayLabel,
    normalizedLabel: effectiveNormalizedLabel,
    officialWording: true,
    nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
    academicScopeHash,
    boundedEvidenceSetHash,
    sourceEvidenceRefs,
    sourcePageRefs,
    sourceSpanRefs: validatedSpans,
    sourceId: params.lineage.sourceId,
    sourceSha256: params.lineage.sourceSha256,
    sourceVersionId: params.lineage.sourceVersionId,
    byteArtifactId: params.lineage.byteArtifactId,
    provenanceId: params.lineage.provenanceId,
    governanceId: params.lineage.governanceId,
    officialDocumentId: params.scopeAuthority.officialDocumentId,
    extractionManifestId: params.manifest.manifestId,
    extractionManifestHash: params.manifest.manifestHash,
    scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
    scopeResolutionSha: params.scopeAuthority.resolutionSha,
    readabilityAssessmentIdentity: params.manifest.readabilityAssessment.assessmentHash,
    structuralRuleId: null,
    structuralRuleVersion: null,
    structuralRuleRevision: null,
    interpretationRevisionId: null,
    reviewState: 'PENDING_STRUCTURAL_REVIEW',
    materializationState: 'PROPOSED',
    hierarchyRevisionId: params.hierarchyRevisionId,
    revisionIdentityHash,
  };
}

/**
 * ­ƒøí´©Å BUILD CANONICAL_STRUCTURAL_NODE (R1-C, R1-D, R3-3, R3-4, R3-5, R3-8, R3-9)
 * Structural nodes carry academicScopeHash=null, officialWording=false,
 * but MUST validate organizing descendant evidence against authoritative pages.
 */
export function buildCanonicalStructuralNode(params: {
  missionId: string;
  cycleKey: string;
  authorityKey?: string;
  subjectId: string;
  canonicalLevel: CanonicalHierarchyLevel;
  parentProposedNodeId: string | null;
  parentCanonicalLevel: CanonicalHierarchyLevel | null;
  canonicalOrder: number;
  displayLabel: string;
  structuralRuleId: StructuralRuleId;
  structuralRuleVersion: string;
  structuralRuleRevision: string;
  interpretationRevisionId: string;
  descendantSpans: EvidenceSpanReference[];
  pagesMap?: Readonly<Record<string, AuthoritativePageEvidence>> | Map<string, AuthoritativePageEvidence>;
  authoritativePageRecords?: readonly AuthoritativePageEvidence[];
  lineage: AuthoritativeLineageBundle;
  manifest: AuthoritativeExtractionManifestBundle;
  scopeAuthority: ResolvedScopeAuthorityBundle;
  hierarchyRevisionId: string;
  callerBoundedEvidenceSetHash?: string;
  continuationRuleId?: string | null;
}): ProposedHierarchyNode {
  // Reconcile top-level caller parameters against lineage (R3-3)
  if (params.missionId && params.missionId !== params.lineage.missionId) {
    throw new Error(`TOP_LEVEL_MISSION_MISMATCH: Caller params.missionId '${params.missionId}' disagrees with authoritative lineage '${params.lineage.missionId}'.`);
  }
  if (params.cycleKey && params.cycleKey !== params.lineage.cycleKey) {
    throw new Error(`TOP_LEVEL_CYCLE_MISMATCH: Caller params.cycleKey '${params.cycleKey}' disagrees with authoritative lineage '${params.lineage.cycleKey}'.`);
  }
  if (params.authorityKey !== undefined && params.authorityKey !== params.lineage.authorityKey) {
    throw new Error(`TOP_LEVEL_AUTHORITY_KEY_MISMATCH: Caller params.authorityKey '${params.authorityKey}' disagrees with authoritative lineage '${params.lineage.authorityKey}'.`);
  }

  // Resolve and reconcile authoritative pages map (R7)
  let effectivePagesMap: Readonly<Record<string, AuthoritativePageEvidence>>;
  if (params.authoritativePageRecords && params.authoritativePageRecords.length > 0) {
    effectivePagesMap = deriveAuthoritativePagesMap({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
      authoritativePageRecords: params.authoritativePageRecords,
    });
    if (params.pagesMap) {
      if (params.pagesMap instanceof Map) {
        throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup.');
      }
      if (!Object.isFrozen(params.pagesMap)) {
        throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
      }
      const callerKeys = Object.keys(params.pagesMap);
      const derivedKeys = Object.keys(effectivePagesMap);
      if (callerKeys.length !== derivedKeys.length) {
        throw new Error(`R3B1_IDENTITY_CONFLICT: Provided pagesMap size (${callerKeys.length}) disagrees with derived authoritative pagesMap (${derivedKeys.length}).`);
      }
      for (const [k, v] of Object.entries(params.pagesMap)) {
        const derived = effectivePagesMap[k];
        if (!derived || derived.pageIdentityHash !== v.pageIdentityHash || derived.textSha256 !== v.textSha256) {
          throw new Error(`R3B1_IDENTITY_CONFLICT: Provided pagesMap entry for '${k}' disagrees with derived authoritative page.`);
        }
      }
    }
  } else if (params.pagesMap) {
    if (params.pagesMap instanceof Map) {
      throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup.');
    }
    if (!Object.isFrozen(params.pagesMap)) {
      throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
    }
    reconcileAuthoritativeR3B1Identity({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
      pagesMap: params.pagesMap,
    });
    effectivePagesMap = params.pagesMap;
  } else {
    throw new Error('PAGES_MAP_REQUIRED: Authoritative pagesMap or authoritativePageRecords is required to build node.');
  }

  // Level sequence enforcement (A, B, C)
  if (!CANONICAL_HIERARCHY_LEVELS.includes(params.canonicalLevel)) {
    throw new Error(`INVALID_CANONICAL_LEVEL: '${params.canonicalLevel}' is not one of the 5 canonical hierarchy levels.`);
  }
  if (!validateCanonicalLevelSequence(params.parentCanonicalLevel, params.canonicalLevel)) {
    throw new Error(`COLLAPSED_LEVEL_REJECTED: Level '${params.canonicalLevel}' cannot follow parent '${params.parentCanonicalLevel}'.`);
  }

  // Structural node rule validation (R1-F)
  if (!params.structuralRuleId || !STRUCTURAL_RULE_DEFINITIONS[params.structuralRuleId]) {
    throw new Error(`STRUCTURAL_NODE_MISSING_RULE_METADATA: Valid structuralRuleId required, got '${params.structuralRuleId}'.`);
  }
  const ruleDef = STRUCTURAL_RULE_DEFINITIONS[params.structuralRuleId];

  if (!params.structuralRuleVersion || params.structuralRuleVersion.trim() === '') {
    throw new Error('STRUCTURAL_NODE_MISSING_RULE_METADATA: structuralRuleVersion required.');
  }
  if (params.structuralRuleVersion !== ruleDef.ruleVersion) {
    throw new Error(
      `STRUCTURAL_RULE_VERSION_MISMATCH: Rule version '${params.structuralRuleVersion}' does not match declared '${ruleDef.ruleVersion}'.`
    );
  }

  if (!params.structuralRuleRevision || params.structuralRuleRevision.trim() === '') {
    throw new Error('STRUCTURAL_NODE_MISSING_RULE_METADATA: structuralRuleRevision required.');
  }
  if (params.structuralRuleRevision !== ruleDef.ruleRevision) {
    throw new Error(
      `STRUCTURAL_RULE_REVISION_MISMATCH: Rule revision '${params.structuralRuleRevision}' does not match declared '${ruleDef.ruleRevision}'.`
    );
  }

  if (!params.interpretationRevisionId || params.interpretationRevisionId.trim() === '') {
    throw new Error('STRUCTURAL_NODE_MISSING_RULE_METADATA: interpretationRevisionId required.');
  }

  // EVIDENCE_FREE_STRUCTURAL_NODE_ALLOWED = false (R1-C)
  if (!Array.isArray(params.descendantSpans) || params.descendantSpans.length === 0) {
    throw new Error('STRUCTURAL_NODE_MISSING_BOUNDED_EVIDENCE: A structural node without bounded authoritative descendant evidence must fail.');
  }

  // Duplicate span check on descendant spans (R3-5)
  const seenSpanKeys = new Set<string>();
  for (let i = 0; i < params.descendantSpans.length; i++) {
    const s = params.descendantSpans[i];
    const key = `${s.extractionId}:${s.physicalPageNumber}:${s.startOffset}:${s.endOffset}`;
    if (seenSpanKeys.has(key)) {
      throw new Error(`DUPLICATE_BOUNDED_EVIDENCE_REJECTED: Duplicate bounded structural span detected for '${key}'.`);
    }
    seenSpanKeys.add(key);
  }

  // Multi-page continuation validation (R1-E2, R3-8)
  const multiPageBundle = buildMultiPageEvidence(params.descendantSpans, params.continuationRuleId);
  const validatedSpans = multiPageBundle.spans;

  // Validate every descendant span against authoritative pages (R1-C)
  const sourceEvidenceRefs: string[] = [];
  const sourcePageRefs: number[] = [];

  for (const span of validatedSpans) {
    const page = effectivePagesMap[span.extractionId];
    if (!page) {
      throw new Error(`PAGE_EVIDENCE_NOT_FOUND: Extraction '${span.extractionId}' not present in provided pages.`);
    }
    validateEvidenceSpan(span, page, params.lineage, params.manifest, params.scopeAuthority);
    if (!sourceEvidenceRefs.includes(span.extractionId)) {
      sourceEvidenceRefs.push(span.extractionId);
    }
    if (!sourcePageRefs.includes(span.physicalPageNumber)) {
      sourcePageRefs.push(span.physicalPageNumber);
    }
  }

  sourceEvidenceRefs.sort();
  sourcePageRefs.sort((a, b) => a - b);

  // Server-derived bounded evidence set hash (R1-C)
  const serverDerivedBoundedEvidenceSetHash = multiPageBundle.evidenceSetHash;

  // If caller provided boundedEvidenceSetHash, strictly compare
  if (params.callerBoundedEvidenceSetHash !== undefined && params.callerBoundedEvidenceSetHash !== null) {
    if (params.callerBoundedEvidenceSetHash !== serverDerivedBoundedEvidenceSetHash) {
      throw new Error(
        `BOUNDED_EVIDENCE_HASH_MISMATCH: Caller boundedEvidenceSetHash '${params.callerBoundedEvidenceSetHash}' does not match server-derived '${serverDerivedBoundedEvidenceSetHash}'.`
      );
    }
  }

  const boundedEvidenceSetHash = serverDerivedBoundedEvidenceSetHash;
  const normalizedLabel = params.displayLabel.trim().toLowerCase().replace(/\s+/g, ' ');

  // Structural labels remain non-official routing metadata only. Always HOLD_AMBIGUOUS_SCOPE (R3-9).
  const reviewState: ProposalReviewState = 'HOLD_AMBIGUOUS_SCOPE';

  // Build complete semantic node identity binding full span objects and all authoritative dimensions (R1-D, R3-4)
  const boundEvidenceSpans = validatedSpans.map(s => ({
    extractionId: s.extractionId,
    physicalPageNumber: s.physicalPageNumber,
    startOffset: s.startOffset,
    endOffset: s.endOffset,
    normalizedSpanSha256: s.normalizedSpanSha256,
    pageIdentityHash: s.pageIdentityHash,
  }));

  const nodeIdentityPayload: NodeSemanticIdentityInput = {
    nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
    missionId: params.lineage.missionId,
    cycleKey: params.lineage.cycleKey,
    authorityKey: params.lineage.authorityKey,
    hierarchyRevisionId: params.hierarchyRevisionId,
    canonicalLevel: params.canonicalLevel,
    normalizedLabel,
    parentProposedNodeId: params.parentProposedNodeId,
    nodeAuthorityType: 'CANONICAL_STRUCTURAL_NODE',
    academicScopeHash: null, // Strictly null: zero independent assessable scope
    boundedEvidenceSetHash,
    boundEvidenceSpans,
    sourceId: params.lineage.sourceId,
    sourceVersionId: params.lineage.sourceVersionId,
    sourceSha256: params.lineage.sourceSha256,
    byteArtifactId: params.lineage.byteArtifactId,
    provenanceId: params.lineage.provenanceId,
    governanceId: params.lineage.governanceId,
    officialDocumentId: params.scopeAuthority.officialDocumentId,
    extractionManifestId: params.manifest.manifestId,
    extractionManifestHash: params.manifest.manifestHash,
    scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
    scopeResolutionSha: params.scopeAuthority.resolutionSha,
    readabilityAssessmentIdentity: params.manifest.readabilityAssessment.assessmentHash,
    structuralRuleId: params.structuralRuleId,
    structuralRuleVersion: params.structuralRuleVersion,
    structuralRuleRevision: params.structuralRuleRevision,
    interpretationRevisionId: params.interpretationRevisionId,
  };

  const proposedNodeId = computeProposedNodeId(nodeIdentityPayload);
  const revisionIdentityHash = sha256Hex(canonicalJson(nodeIdentityPayload));

  return {
    proposedNodeId,
    nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
    missionId: params.lineage.missionId,
    cycleKey: params.lineage.cycleKey,
    authorityKey: params.lineage.authorityKey,
    subjectId: params.subjectId,
    canonicalLevel: params.canonicalLevel,
    parentProposedNodeId: params.parentProposedNodeId,
    canonicalOrder: params.canonicalOrder,
    displayLabel: params.displayLabel,
    normalizedLabel,
    officialWording: false, // Mandatory Law: false for structural nodes
    nodeAuthorityType: 'CANONICAL_STRUCTURAL_NODE',
    academicScopeHash: null, // Strictly null: zero independent assessable scope
    boundedEvidenceSetHash,
    sourceEvidenceRefs,
    sourcePageRefs,
    sourceSpanRefs: validatedSpans,
    sourceId: params.lineage.sourceId,
    sourceSha256: params.lineage.sourceSha256,
    sourceVersionId: params.lineage.sourceVersionId,
    byteArtifactId: params.lineage.byteArtifactId,
    provenanceId: params.lineage.provenanceId,
    governanceId: params.lineage.governanceId,
    officialDocumentId: params.scopeAuthority.officialDocumentId,
    extractionManifestId: params.manifest.manifestId,
    extractionManifestHash: params.manifest.manifestHash,
    scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
    scopeResolutionSha: params.scopeAuthority.resolutionSha,
    readabilityAssessmentIdentity: params.manifest.readabilityAssessment.assessmentHash,
    structuralRuleId: params.structuralRuleId,
    structuralRuleVersion: params.structuralRuleVersion,
    structuralRuleRevision: params.structuralRuleRevision,
    interpretationRevisionId: params.interpretationRevisionId,
    reviewState,
    materializationState: 'PROPOSED',
    hierarchyRevisionId: params.hierarchyRevisionId,
    revisionIdentityHash,
  };
}

/**
 * ­ƒøí´©Å BUILD HIERARCHY PROPOSAL (R1-A, R1-E, R1-F, R3-3, R3-5, R3-6, R3-7, R3-10)
 * Assembles the complete immutable proposal record.
 * Pure deterministic function with zero database writes, zero readiness changes,
 * zero B3 enqueuing.
 */
export function buildHierarchyProposal(params: {
  missionId: string;
  cycleKey: string;
  subjectId: string;
  lineage: AuthoritativeLineageBundle;
  manifest: AuthoritativeExtractionManifestBundle;
  scopeAuthority: ResolvedScopeAuthorityBundle;
  authoritativePageRecords?: readonly AuthoritativePageEvidence[];
  pagesMap?: Readonly<Record<string, AuthoritativePageEvidence>> | Map<string, AuthoritativePageEvidence>;
  hierarchyRevisionId: string;
  nodes: ProposedHierarchyNode[];
  requiredEvidenceSet: string[];
  unresolvedEvidenceSet?: string[];
  structuralInterpretations?: StructuralInterpretationManifestEntry[];
  continuationRuleId?: string | null;
}): HierarchyProposal {
  // 1. Empty proposal check (R3-6): zero proposed nodes and zero required evidence cannot advance
  const safeNodes = params.nodes || [];
  const safeReq = params.requiredEvidenceSet || [];
  if (safeNodes.length === 0 && safeReq.length === 0) {
    throw new Error('EMPTY_PROPOSAL_REJECTED: Proposal cannot have zero proposed nodes and zero required evidence.');
  }

  // 2. Reconcile top-level caller parameters against lineage (R3-3)
  if (params.missionId !== params.lineage.missionId) {
    throw new Error(`TOP_LEVEL_MISSION_MISMATCH: Proposal missionId '${params.missionId}' disagrees with lineage '${params.lineage.missionId}'.`);
  }
  if (params.cycleKey !== params.lineage.cycleKey) {
    throw new Error(`TOP_LEVEL_CYCLE_MISMATCH: Proposal cycleKey '${params.cycleKey}' disagrees with lineage '${params.lineage.cycleKey}'.`);
  }

  // 3. Validate source classification (R3B1 vocabulary)
  validateSourceClassification(params.lineage.sourceClass);

  // 4. Derive or reconcile authority-bound pagesMap (R1-A, R7)
  let effectivePagesMap: Readonly<Record<string, AuthoritativePageEvidence>> | undefined;

  if (params.authoritativePageRecords && params.authoritativePageRecords.length > 0) {
    effectivePagesMap = deriveAuthoritativePagesMap({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
      authoritativePageRecords: params.authoritativePageRecords,
    });
    if (params.pagesMap) {
      if (params.pagesMap instanceof Map) {
        throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup.');
      }
      if (!Object.isFrozen(params.pagesMap)) {
        throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
      }
      const callerKeys = Object.keys(params.pagesMap);
      const derivedKeys = Object.keys(effectivePagesMap);
      if (callerKeys.length !== derivedKeys.length) {
        throw new Error('CALLER_PAGES_MAP_DISAGREEMENT: Caller pagesMap size disagrees with authoritative server-derived pagesMap.');
      }
      for (const [k, v] of Object.entries(params.pagesMap)) {
        const auth = effectivePagesMap[k];
        if (!auth || auth.pageIdentityHash !== v.pageIdentityHash || auth.normalizedText !== v.normalizedText || auth.textSha256 !== v.textSha256) {
          throw new Error(`CALLER_PAGES_MAP_DISAGREEMENT: Caller pagesMap page '${k}' disagrees with authoritative server-derived record.`);
        }
      }
    }
  } else if (params.pagesMap) {
    if (params.pagesMap instanceof Map) {
      throw new Error('MUTABLE_AUTHORITY_MAP_PROHIBITED: Mutable Map cannot be used as authority transport lookup.');
    }
    if (!Object.isFrozen(params.pagesMap)) {
      throw new Error('PAGES_MAP_MUTABLE_REJECTED: Authoritative pagesMap must be an immutable frozen plain data record.');
    }
    reconcileAuthoritativeR3B1Identity({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
      pagesMap: params.pagesMap,
    });
    effectivePagesMap = params.pagesMap;
  } else {
    reconcileAuthoritativeR3B1Identity({
      lineage: params.lineage,
      manifest: params.manifest,
      scopeAuthority: params.scopeAuthority,
    });
  }

  if (params.manifest.readabilityAssessment.readability !== 'NATIVE_TEXT') {
    throw new Error(`READABILITY_INVALID: Expected NATIVE_TEXT, got '${params.manifest.readabilityAssessment.readability}'.`);
  }

  // 5. Duplicate checks on required and unresolved evidence sets (R3-5)
  const seenRequired = new Set<string>();
  for (const id of params.requiredEvidenceSet) {
    if (seenRequired.has(id)) {
      throw new Error(`DUPLICATE_REQUIRED_EVIDENCE_REJECTED: Duplicate evidence '${id}' in requiredEvidenceSet.`);
    }
    seenRequired.add(id);
  }

  const seenUnresolved = new Set<string>();
  for (const id of params.unresolvedEvidenceSet || []) {
    if (seenUnresolved.has(id)) {
      throw new Error(`DUPLICATE_UNRESOLVED_EVIDENCE_REJECTED: Duplicate evidence '${id}' in unresolvedEvidenceSet.`);
    }
    seenUnresolved.add(id);
  }

  // 6. FORGED NODE REVALIDATION (R3-7, R5, R7):
  // Incoming nodes are untrusted claims. Independently reconstruct and revalidate
  // every node against authoritative proposal context and server-reconciled pagesMap.
  if (params.nodes.length > 0 && (!effectivePagesMap || Object.keys(effectivePagesMap).length === 0)) {
    throw new Error('PAGES_MAP_REQUIRED: Authoritative pagesMap or authoritativePageRecords is required to revalidate proposed nodes.');
  }

  for (const node of params.nodes) {
    if (node.nodeContractVersion !== HIERARCHY_NODE_CONTRACT_VERSION) {
      throw new Error(`CONTRACT_VERSION_MISMATCH: Node contract version '${node.nodeContractVersion}' does not match expected '${HIERARCHY_NODE_CONTRACT_VERSION}'.`);
    }
    if (!CANONICAL_HIERARCHY_LEVELS.includes(node.canonicalLevel)) {
      throw new Error(`INVALID_CANONICAL_LEVEL: Node level '${node.canonicalLevel}' is not a valid canonical level.`);
    }

    if (node.missionId !== params.lineage.missionId) {
      throw new Error(`FORGED_NODE_MISSION_MISMATCH: Node '${node.proposedNodeId}' missionId '${node.missionId}' does not match proposal '${params.lineage.missionId}'.`);
    }
    if (node.cycleKey !== params.lineage.cycleKey) {
      throw new Error(`FORGED_NODE_CYCLE_MISMATCH: Node '${node.proposedNodeId}' cycleKey '${node.cycleKey}' does not match proposal '${params.lineage.cycleKey}'.`);
    }
    if (node.authorityKey !== params.lineage.authorityKey) {
      throw new Error(`FORGED_NODE_AUTHORITY_KEY_MISMATCH: Node '${node.proposedNodeId}' authorityKey '${node.authorityKey}' does not match proposal '${params.lineage.authorityKey}'.`);
    }
    if (node.sourceId !== params.lineage.sourceId) {
      throw new Error(`FORGED_NODE_SOURCE_ID_MISMATCH: Node '${node.proposedNodeId}' sourceId '${node.sourceId}' does not match proposal '${params.lineage.sourceId}'.`);
    }
    if (node.sourceVersionId !== params.lineage.sourceVersionId) {
      throw new Error(`FORGED_NODE_SOURCE_VERSION_MISMATCH: Node '${node.proposedNodeId}' sourceVersionId '${node.sourceVersionId}' does not match proposal '${params.lineage.sourceVersionId}'.`);
    }
    if (node.sourceSha256 !== params.lineage.sourceSha256) {
      throw new Error(`FORGED_NODE_SOURCE_SHA_MISMATCH: Node '${node.proposedNodeId}' sourceSha256 '${node.sourceSha256}' does not match proposal '${params.lineage.sourceSha256}'.`);
    }
    if (node.byteArtifactId !== params.lineage.byteArtifactId) {
      throw new Error(`FORGED_NODE_BYTE_ARTIFACT_MISMATCH: Node '${node.proposedNodeId}' byteArtifactId '${node.byteArtifactId}' does not match proposal '${params.lineage.byteArtifactId}'.`);
    }
    if (node.provenanceId !== params.lineage.provenanceId) {
      throw new Error(`FORGED_NODE_PROVENANCE_MISMATCH: Node '${node.proposedNodeId}' provenanceId '${node.provenanceId}' does not match proposal '${params.lineage.provenanceId}'.`);
    }
    if (node.governanceId !== params.lineage.governanceId) {
      throw new Error(`FORGED_NODE_GOVERNANCE_MISMATCH: Node '${node.proposedNodeId}' governanceId '${node.governanceId}' does not match proposal '${params.lineage.governanceId}'.`);
    }
    if (node.officialDocumentId !== params.scopeAuthority.officialDocumentId) {
      throw new Error(`FORGED_NODE_OFFICIAL_DOC_MISMATCH: Node '${node.proposedNodeId}' officialDocumentId '${node.officialDocumentId}' does not match proposal '${params.scopeAuthority.officialDocumentId}'.`);
    }
    if (node.extractionManifestId !== params.manifest.manifestId) {
      throw new Error(`FORGED_NODE_MANIFEST_MISMATCH: Node '${node.proposedNodeId}' extractionManifestId '${node.extractionManifestId}' does not match proposal '${params.manifest.manifestId}'.`);
    }
    if (node.scopeAuthorityId !== params.scopeAuthority.scopeAuthorityId) {
      throw new Error(`FORGED_NODE_SCOPE_AUTH_MISMATCH: Node '${node.proposedNodeId}' scopeAuthorityId '${node.scopeAuthorityId}' does not match proposal '${params.scopeAuthority.scopeAuthorityId}'.`);
    }
    if (node.scopeResolutionSha !== params.scopeAuthority.resolutionSha) {
      throw new Error(`FORGED_NODE_SCOPE_MISMATCH: Node '${node.proposedNodeId}' scopeResolutionSha '${node.scopeResolutionSha}' does not match proposal '${params.scopeAuthority.resolutionSha}'.`);
    }
    if (node.readabilityAssessmentIdentity !== params.manifest.readabilityAssessment.assessmentHash) {
      throw new Error(`FORGED_NODE_READABILITY_MISMATCH: Node '${node.proposedNodeId}' readabilityAssessmentIdentity '${node.readabilityAssessmentIdentity}' does not match proposal.`);
    }
    if (node.hierarchyRevisionId !== params.hierarchyRevisionId) {
      throw new Error(`FORGED_NODE_REVISION_MISMATCH: Node '${node.proposedNodeId}' hierarchyRevisionId '${node.hierarchyRevisionId}' does not match proposal '${params.hierarchyRevisionId}'.`);
    }
    if (node.materializationState !== 'PROPOSED') {
      throw new Error(`INVALID_MATERIALIZATION_STATE: Expected PROPOSED, got '${node.materializationState}'.`);
    }

    // Verify node evidence is in required evidence set (R3-10)
    for (const ref of node.sourceEvidenceRefs) {
      if (!seenRequired.has(ref)) {
        throw new Error(`UNAUTHORIZED_EXTRA_RESOLVED_EVIDENCE: Node '${node.proposedNodeId}' claims evidence '${ref}' not declared in requiredEvidenceSet.`);
      }
    }

    // Independent authoritative reconstruction from pagesMap
    let authoritativeDisplayLabel: string;
    let authoritativeNormalizedLabel: string;
    let authoritativeAcademicScopeHash: string | null = null;
    let authoritativeBoundedEvidenceSetHash: string;
    let authoritativeBoundEvidenceSpans: Array<{
      readonly extractionId: string;
      readonly physicalPageNumber: number;
      readonly startOffset: number;
      readonly endOffset: number;
      readonly normalizedSpanSha256: string;
      readonly pageIdentityHash: string;
    }>;

    if (node.nodeAuthorityType === 'SOURCE_EXPLICIT_NODE') {
      if (node.officialWording !== true) {
        throw new Error(`PROPOSAL_NODE_OFFICIAL_WORDING_REQUIRED: SOURCE_EXPLICIT_NODE '${node.proposedNodeId}' must have officialWording=true.`);
      }
      if (!Array.isArray(node.sourceSpanRefs) || node.sourceSpanRefs.length === 0) {
        throw new Error(`SOURCE_EXPLICIT_NODE_REQUIRES_EVIDENCE: SOURCE_EXPLICIT_NODE '${node.proposedNodeId}' must bind at least one authoritative evidence span.`);
      }
      if (node.academicScopeHash === null || typeof node.academicScopeHash !== 'string' || node.academicScopeHash.length !== 64) {
        throw new Error(`PROPOSAL_NODE_SCOPE_HASH_REQUIRED: SOURCE_EXPLICIT_NODE '${node.proposedNodeId}' must carry 64-hex academicScopeHash.`);
      }

      const multiPageBundle = buildMultiPageEvidence(node.sourceSpanRefs, params.continuationRuleId);
      const textSlices: string[] = [];
      const derivedSourceEvidenceRefs: string[] = [];
      const derivedSourcePageRefs: number[] = [];

      for (const span of multiPageBundle.spans) {
        const page = effectivePagesMap![span.extractionId];
        if (!page) {
          throw new Error(`PAGE_EVIDENCE_NOT_FOUND: Extraction '${span.extractionId}' not present in provided pages.`);
        }
        const slice = validateEvidenceSpan(span, page, params.lineage, params.manifest, params.scopeAuthority);
        textSlices.push(slice);
        if (!derivedSourceEvidenceRefs.includes(span.extractionId)) {
          derivedSourceEvidenceRefs.push(span.extractionId);
        }
        if (!derivedSourcePageRefs.includes(span.physicalPageNumber)) {
          derivedSourcePageRefs.push(span.physicalPageNumber);
        }
      }
      derivedSourceEvidenceRefs.sort();
      derivedSourcePageRefs.sort((a, b) => a - b);

      const authoritativeOfficialWording = textSlices.join(' ').trim();
      authoritativeDisplayLabel = authoritativeOfficialWording.replace(/\s+/g, ' ');
      authoritativeNormalizedLabel = authoritativeDisplayLabel.toLowerCase();
      authoritativeAcademicScopeHash = sha256Hex(authoritativeOfficialWording);
      authoritativeBoundedEvidenceSetHash = multiPageBundle.evidenceSetHash;

      const callerDisplay = (node.displayLabel || '').trim().replace(/\s+/g, ' ');
      if (callerDisplay !== authoritativeDisplayLabel) {
        throw new Error(
          `PROPOSAL_NODE_WORDING_MISMATCH: Node '${node.proposedNodeId}' displayLabel '${node.displayLabel}' differs from authoritative wording '${authoritativeDisplayLabel}'.`
        );
      }
      const callerNormalized = (node.normalizedLabel || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (callerNormalized !== authoritativeNormalizedLabel) {
        throw new Error(
          `PROPOSAL_NODE_WORDING_MISMATCH: Node '${node.proposedNodeId}' normalizedLabel '${node.normalizedLabel}' differs from authoritative normalized label '${authoritativeNormalizedLabel}'.`
        );
      }
      if (node.academicScopeHash !== authoritativeAcademicScopeHash) {
        throw new Error(
          `PROPOSAL_NODE_SCOPE_HASH_MISMATCH: Node '${node.proposedNodeId}' academicScopeHash '${node.academicScopeHash}' differs from authoritative scope hash '${authoritativeAcademicScopeHash}'.`
        );
      }
      if (node.boundedEvidenceSetHash !== authoritativeBoundedEvidenceSetHash) {
        throw new Error(
          `PROPOSAL_NODE_BOUNDED_HASH_MISMATCH: Node '${node.proposedNodeId}' boundedEvidenceSetHash '${node.boundedEvidenceSetHash}' differs from authoritative evidence set hash '${authoritativeBoundedEvidenceSetHash}'.`
        );
      }

      const callerEvidenceRefsSorted = [...(node.sourceEvidenceRefs || [])].sort();
      if (canonicalJson(callerEvidenceRefsSorted) !== canonicalJson(derivedSourceEvidenceRefs)) {
        throw new Error(
          `SOURCE_EVIDENCE_REF_MISMATCH: Node '${node.proposedNodeId}' sourceEvidenceRefs differs from authoritative derived evidence refs.`
        );
      }
      const callerPageRefsSorted = [...(node.sourcePageRefs || [])].sort((a, b) => a - b);
      if (canonicalJson(callerPageRefsSorted) !== canonicalJson(derivedSourcePageRefs)) {
        throw new Error(
          `SOURCE_PAGE_REF_MISMATCH: Node '${node.proposedNodeId}' sourcePageRefs differs from authoritative derived page refs.`
        );
      }

      if (node.structuralRuleId !== null || node.structuralRuleVersion !== null || node.structuralRuleRevision !== null || node.interpretationRevisionId !== null) {
        throw new Error(`SOURCE_EXPLICIT_NODE_STRUCTURAL_RULE_FORBIDDEN: SOURCE_EXPLICIT_NODE '${node.proposedNodeId}' cannot carry structural rule fields.`);
      }

      authoritativeBoundEvidenceSpans = multiPageBundle.spans.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      }));
    } else if (node.nodeAuthorityType === 'CANONICAL_STRUCTURAL_NODE') {
      if (node.officialWording !== false) {
        throw new Error(`STRUCTURAL_NODE_OFFICIAL_WORDING_FORBIDDEN: CANONICAL_STRUCTURAL_NODE '${node.proposedNodeId}' must have officialWording=false.`);
      }
      if (node.academicScopeHash !== null) {
        throw new Error(`STRUCTURAL_NODE_ACADEMIC_SCOPE_FORBIDDEN: CANONICAL_STRUCTURAL_NODE '${node.proposedNodeId}' must have academicScopeHash=null (zero independent scope).`);
      }
      if (!Array.isArray(node.sourceSpanRefs) || node.sourceSpanRefs.length === 0) {
        throw new Error(`STRUCTURAL_NODE_MISSING_BOUNDED_EVIDENCE: CANONICAL_STRUCTURAL_NODE '${node.proposedNodeId}' must bind descendant evidence spans.`);
      }

      const seenSpanKeys = new Set<string>();
      for (let i = 0; i < node.sourceSpanRefs.length; i++) {
        const s = node.sourceSpanRefs[i];
        const key = `${s.extractionId}:${s.physicalPageNumber}:${s.startOffset}:${s.endOffset}`;
        if (seenSpanKeys.has(key)) {
          throw new Error(`DUPLICATE_BOUNDED_EVIDENCE_REJECTED: Duplicate bounded structural span detected for '${key}'.`);
        }
        seenSpanKeys.add(key);
      }

      const multiPageBundle = buildMultiPageEvidence(node.sourceSpanRefs, params.continuationRuleId);
      const derivedSourceEvidenceRefs: string[] = [];
      const derivedSourcePageRefs: number[] = [];

      for (const span of multiPageBundle.spans) {
        const page = effectivePagesMap![span.extractionId];
        if (!page) {
          throw new Error(`PAGE_EVIDENCE_NOT_FOUND: Extraction '${span.extractionId}' not present in provided pages.`);
        }
        validateEvidenceSpan(span, page, params.lineage, params.manifest, params.scopeAuthority);
        if (!derivedSourceEvidenceRefs.includes(span.extractionId)) {
          derivedSourceEvidenceRefs.push(span.extractionId);
        }
        if (!derivedSourcePageRefs.includes(span.physicalPageNumber)) {
          derivedSourcePageRefs.push(span.physicalPageNumber);
        }
      }
      derivedSourceEvidenceRefs.sort();
      derivedSourcePageRefs.sort((a, b) => a - b);

      authoritativeBoundedEvidenceSetHash = multiPageBundle.evidenceSetHash;
      if (node.boundedEvidenceSetHash !== authoritativeBoundedEvidenceSetHash) {
        throw new Error(
          `PROPOSAL_NODE_BOUNDED_HASH_MISMATCH: Node '${node.proposedNodeId}' boundedEvidenceSetHash '${node.boundedEvidenceSetHash}' differs from authoritative derived bounded hash '${authoritativeBoundedEvidenceSetHash}'.`
        );
      }

      const callerEvidenceRefsSorted = [...(node.sourceEvidenceRefs || [])].sort();
      if (canonicalJson(callerEvidenceRefsSorted) !== canonicalJson(derivedSourceEvidenceRefs)) {
        throw new Error(
          `SOURCE_EVIDENCE_REF_MISMATCH: Node '${node.proposedNodeId}' sourceEvidenceRefs differs from authoritative derived evidence refs.`
        );
      }
      const callerPageRefsSorted = [...(node.sourcePageRefs || [])].sort((a, b) => a - b);
      if (canonicalJson(callerPageRefsSorted) !== canonicalJson(derivedSourcePageRefs)) {
        throw new Error(
          `SOURCE_PAGE_REF_MISMATCH: Node '${node.proposedNodeId}' sourcePageRefs differs from authoritative derived page refs.`
        );
      }

      authoritativeDisplayLabel = node.displayLabel;
      authoritativeNormalizedLabel = node.displayLabel.trim().toLowerCase().replace(/\s+/g, ' ');
      if (node.normalizedLabel !== authoritativeNormalizedLabel) {
        throw new Error(
          `STRUCTURAL_LABEL_NORMALIZATION_MISMATCH: Node '${node.proposedNodeId}' normalizedLabel '${node.normalizedLabel}' does not match normalized displayLabel '${authoritativeNormalizedLabel}'.`
        );
      }

      const ruleId = node.structuralRuleId as StructuralRuleId;
      if (!ruleId || !STRUCTURAL_RULE_DEFINITIONS[ruleId]) {
        throw new Error(`STRUCTURAL_NODE_MISSING_RULE_METADATA: Node '${node.proposedNodeId}' has invalid structuralRuleId '${node.structuralRuleId}'.`);
      }
      const ruleDef = STRUCTURAL_RULE_DEFINITIONS[ruleId];
      if (node.structuralRuleVersion !== ruleDef.ruleVersion) {
        throw new Error(
          `STRUCTURAL_RULE_VERSION_MISMATCH: Rule version '${node.structuralRuleVersion}' does not match declared '${ruleDef.ruleVersion}'.`
        );
      }
      if (node.structuralRuleRevision !== ruleDef.ruleRevision) {
        throw new Error(
          `STRUCTURAL_RULE_REVISION_MISMATCH: Rule revision '${node.structuralRuleRevision}' does not match declared '${ruleDef.ruleRevision}'.`
        );
      }
      if (!node.interpretationRevisionId || node.interpretationRevisionId.trim() === '') {
        throw new Error(`STRUCTURAL_NODE_MISSING_RULE_METADATA: Node '${node.proposedNodeId}' requires interpretationRevisionId.`);
      }
      if (node.reviewState !== 'HOLD_AMBIGUOUS_SCOPE') {
        throw new Error(`STRUCTURAL_NODE_REVIEW_STATE_INVALID: CANONICAL_STRUCTURAL_NODE must be HOLD_AMBIGUOUS_SCOPE, got '${node.reviewState}'.`);
      }

      // Reconcile against structural interpretations manifest if provided
      if (params.structuralInterpretations && params.structuralInterpretations.length > 0) {
        const matchingInterp = params.structuralInterpretations.find(
          i => i.interpretationRevisionId === node.interpretationRevisionId
        );
        if (!matchingInterp) {
          throw new Error(`INTERPRETATION_NOT_FOUND: Structural node '${node.proposedNodeId}' references interpretationRevisionId '${node.interpretationRevisionId}' which is missing from structuralInterpretations.`);
        }
        if (matchingInterp.targetProposedNodeId !== node.proposedNodeId) {
          throw new Error(`INTERPRETATION_TARGET_MISMATCH: Interpretation '${matchingInterp.interpretationRevisionId}' targets '${matchingInterp.targetProposedNodeId}' but node is '${node.proposedNodeId}'.`);
        }
        if (matchingInterp.structuralRuleId !== node.structuralRuleId) {
          throw new Error(`INTERPRETATION_RULE_MISMATCH: Interpretation '${matchingInterp.interpretationRevisionId}' rule '${matchingInterp.structuralRuleId}' does not match node rule '${node.structuralRuleId}'.`);
        }
        if (matchingInterp.structuralRuleVersion !== node.structuralRuleVersion) {
          throw new Error(`INTERPRETATION_VERSION_MISMATCH: Interpretation '${matchingInterp.interpretationRevisionId}' version '${matchingInterp.structuralRuleVersion}' does not match node version '${node.structuralRuleVersion}'.`);
        }
        if (matchingInterp.structuralRuleRevision !== node.structuralRuleRevision) {
          throw new Error(`INTERPRETATION_REVISION_MISMATCH: Interpretation '${matchingInterp.interpretationRevisionId}' revision '${matchingInterp.structuralRuleRevision}' does not match node revision '${node.structuralRuleRevision}'.`);
        }
        const nodeSpanHashes = node.sourceSpanRefs.map(s => s.normalizedSpanSha256).sort();
        const interpSpanHashes = [...matchingInterp.boundEvidenceSpanHashes].sort();
        if (canonicalJson(nodeSpanHashes) !== canonicalJson(interpSpanHashes)) {
          throw new Error(`INTERPRETATION_SPAN_HASH_MISMATCH: Interpretation '${matchingInterp.interpretationRevisionId}' boundEvidenceSpanHashes does not match node span hashes.`);
        }
      }

      authoritativeBoundEvidenceSpans = multiPageBundle.spans.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      }));
    } else {
      throw new Error(`UNRECOGNIZED_NODE_AUTHORITY_TYPE: Node authority type '${node.nodeAuthorityType}' is invalid.`);
    }

    // Recompute semantic identity from authoritative reconstructed values
    const authoritativePayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId: params.lineage.missionId,
      cycleKey: params.lineage.cycleKey,
      authorityKey: params.lineage.authorityKey,
      hierarchyRevisionId: params.hierarchyRevisionId,
      canonicalLevel: node.canonicalLevel,
      normalizedLabel: authoritativeNormalizedLabel,
      parentProposedNodeId: node.parentProposedNodeId,
      nodeAuthorityType: node.nodeAuthorityType,
      academicScopeHash: authoritativeAcademicScopeHash,
      boundedEvidenceSetHash: authoritativeBoundedEvidenceSetHash,
      boundEvidenceSpans: authoritativeBoundEvidenceSpans,
      sourceId: params.lineage.sourceId,
      sourceVersionId: params.lineage.sourceVersionId,
      sourceSha256: params.lineage.sourceSha256,
      byteArtifactId: params.lineage.byteArtifactId,
      provenanceId: params.lineage.provenanceId,
      governanceId: params.lineage.governanceId,
      officialDocumentId: params.scopeAuthority.officialDocumentId,
      extractionManifestId: params.manifest.manifestId,
      extractionManifestHash: params.manifest.manifestHash,
      scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
      scopeResolutionSha: params.scopeAuthority.resolutionSha,
      readabilityAssessmentIdentity: params.manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: node.structuralRuleId,
      structuralRuleVersion: node.structuralRuleVersion,
      structuralRuleRevision: node.structuralRuleRevision,
      interpretationRevisionId: node.interpretationRevisionId,
    };

    const authoritativeProposedNodeId = computeProposedNodeId(authoritativePayload);
    const authoritativeRevisionIdentityHash = sha256Hex(canonicalJson(authoritativePayload));

    if (node.proposedNodeId !== authoritativeProposedNodeId) {
      throw new Error(`FORGED_NODE_IDENTITY_MISMATCH: Node proposedNodeId '${node.proposedNodeId}' does not match recomputed '${authoritativeProposedNodeId}'.`);
    }
    if (node.revisionIdentityHash !== authoritativeRevisionIdentityHash) {
      throw new Error(`FORGED_NODE_REVISION_HASH_MISMATCH: Node revisionIdentityHash '${node.revisionIdentityHash}' does not match recomputed '${authoritativeRevisionIdentityHash}'.`);
    }
  }

  // Verify structural interpretations completeness: every interpretation must target a present structural node
  if (params.structuralInterpretations && params.structuralInterpretations.length > 0) {
    const structuralNodes = params.nodes.filter(n => n.nodeAuthorityType === 'CANONICAL_STRUCTURAL_NODE');
    const structuralNodeIds = new Set(structuralNodes.map(n => n.proposedNodeId));
    for (const interp of params.structuralInterpretations) {
      if (!structuralNodeIds.has(interp.targetProposedNodeId)) {
        throw new Error(`ORPHANED_INTERPRETATION_REJECTED: Structural interpretation '${interp.interpretationRevisionId}' targets non-existent or non-structural node '${interp.targetProposedNodeId}'.`);
      }
    }
  }

  // 7. EVIDENCE CONSERVATION (R1-E, R3-10)
  // Let: REQUIRED = authoritative evidence required by proposal
  //      RESOLVED = evidence represented by valid proposed nodes
  //      UNRESOLVED = authoritative evidence explicitly held unresolved
  const resolvedEvidenceSet = Array.from(new Set(
    params.nodes.flatMap(n => n.sourceEvidenceRefs)
  )).sort();

  const requiredEvidenceSet = Array.from(seenRequired).sort();
  const unresolvedEvidenceSet = Array.from(seenUnresolved).sort();

  // A. RESOLVED Ôèå REQUIRED
  for (const id of resolvedEvidenceSet) {
    if (!seenRequired.has(id)) {
      throw new Error(`UNAUTHORIZED_EXTRA_RESOLVED_EVIDENCE: Resolved evidence '${id}' is not in requiredEvidenceSet.`);
    }
  }

  // B. UNRESOLVED Ôèå REQUIRED
  for (const id of unresolvedEvidenceSet) {
    if (!seenRequired.has(id)) {
      throw new Error(`UNAUTHORIZED_EXTRA_UNRESOLVED_EVIDENCE: Unresolved evidence '${id}' is not in requiredEvidenceSet.`);
    }
  }

  // C. RESOLVED Ôê® UNRESOLVED = Ôêà
  for (const id of resolvedEvidenceSet) {
    if (seenUnresolved.has(id)) {
      throw new Error(`RESOLVED_UNRESOLVED_OVERLAP: Evidence '${id}' is both resolved and unresolved.`);
    }
  }

  // D. REQUIRED = RESOLVED Ôê¬ UNRESOLVED
  for (const id of requiredEvidenceSet) {
    if (!resolvedEvidenceSet.includes(id) && !seenUnresolved.has(id)) {
      throw new Error(`MISSING_REQUIRED_EVIDENCE: Required evidence '${id}' is neither resolved nor explicitly held unresolved.`);
    }
  }

  // 8. REVIEW STATE COMPUTATION (R1-F, R3-6)
  let reviewState: ProposalReviewState = 'PENDING_STRUCTURAL_REVIEW';

  // If there are zero nodes or unresolved evidence exists, fail closed to HOLD_AMBIGUOUS_SCOPE
  if (params.nodes.length === 0 || unresolvedEvidenceSet.length > 0) {
    reviewState = 'HOLD_AMBIGUOUS_SCOPE';
  }

  // Check any node holding ambiguous scope or non-executable rule
  for (const node of params.nodes) {
    if (node.reviewState === 'HOLD_AMBIGUOUS_SCOPE') {
      reviewState = 'HOLD_AMBIGUOUS_SCOPE';
      break;
    }
  }

  // Check structural interpretations for non-executable rules or ambiguous markers
  const interpretations = params.structuralInterpretations || [];
  for (const interp of interpretations) {
    if (!interp.executableInR3B2B || interp.rationale.includes('AMBIGUOUS') || interp.rationale.includes('HOLD')) {
      reviewState = 'HOLD_AMBIGUOUS_SCOPE';
      break;
    }
  }

  const proposalNodeManifest: ProposalNodeManifestEntry[] = params.nodes.map(n => ({
    proposedNodeId: n.proposedNodeId,
    canonicalLevel: n.canonicalLevel,
    canonicalOrder: n.canonicalOrder,
    nodeAuthorityType: n.nodeAuthorityType,
    nodeIntegrityHash: n.revisionIdentityHash,
  }));

  const proposalPayload = {
    proposalContractVersion: HIERARCHY_PROPOSAL_CONTRACT_VERSION,
    missionId: params.lineage.missionId,
    cycleKey: params.lineage.cycleKey,
    authorityKey: params.lineage.authorityKey,
    subjectId: params.subjectId,
    officialDocumentId: params.scopeAuthority.officialDocumentId,
    sourceId: params.lineage.sourceId,
    sourceVersionId: params.lineage.sourceVersionId,
    sourceSha256: params.lineage.sourceSha256,
    extractionManifestId: params.manifest.manifestId,
    extractionManifestHash: params.manifest.manifestHash,
    scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
    scopeResolutionSha: params.scopeAuthority.resolutionSha,
    hierarchyRevisionId: params.hierarchyRevisionId,
    proposalNodeManifest,
    requiredEvidenceSet,
    resolvedEvidenceSet,
    unresolvedEvidenceSet,
    structuralInterpretationManifest: interpretations,
  };

  const proposalContentHash = computeProposalContentHash(proposalPayload);
  const proposalId = `prop_${proposalContentHash}`;

  return {
    proposalId,
    proposalContractVersion: HIERARCHY_PROPOSAL_CONTRACT_VERSION,
    missionId: params.lineage.missionId,
    cycleKey: params.lineage.cycleKey,
    authorityKey: params.lineage.authorityKey,
    subjectId: params.subjectId,
    officialDocumentId: params.scopeAuthority.officialDocumentId,
    sourceId: params.lineage.sourceId,
    sourceVersionId: params.lineage.sourceVersionId,
    sourceSha256: params.lineage.sourceSha256,
    extractionManifestId: params.manifest.manifestId,
    extractionManifestHash: params.manifest.manifestHash,
    scopeAuthorityId: params.scopeAuthority.scopeAuthorityId,
    scopeResolutionSha: params.scopeAuthority.resolutionSha,
    readabilityAssessmentIdentity: params.manifest.readabilityAssessment.assessmentHash,
    hierarchyRevisionId: params.hierarchyRevisionId,
    proposalNodeManifest,
    proposalNodeCount: params.nodes.length,
    requiredEvidenceSet,
    resolvedEvidenceSet,
    unresolvedEvidenceSet,
    structuralInterpretationManifest: interpretations,
    proposalContentHash,
    createdAt: new Date().toISOString(),
    reviewState,
    materializationState: 'PROPOSED',
  };
}

/**
 * ­ƒøí´©Å PURE INTERNAL RECONSTRUCTION ENTRY POINT
 * Used strictly for pure in-memory Domain-A unit testing.
 * NOT an authorized production authority entry point.
 */
export const buildHierarchyProposalPureInternal = buildHierarchyProposal;
