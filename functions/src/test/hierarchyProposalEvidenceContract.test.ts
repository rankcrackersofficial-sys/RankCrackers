import {
  CANONICAL_HIERARCHY_LEVELS,
  CANONICAL_LEVEL_COUNT,
  computeEvidenceSpanHash,
  validateCanonicalLevelSequence,
  EvidenceSpanReference,
  AuthoritativePageEvidence,
  computeEvidenceSetHash,
  computeProposedNodeId,
  computePageExtractionIdentity,
  computeExtractionId,
  STRUCTURAL_RULE_DEFINITIONS,
  HIERARCHY_NODE_CONTRACT_VERSION,
  sha256Hex,
  canonicalJson,
  NodeSemanticIdentityInput,
  ProposedHierarchyNode,
} from '../syllabus/hierarchyProposalContract';
import {
  AuthoritativeExtractionManifestBundle,
  AuthoritativeLineageBundle,
  ResolvedScopeAuthorityBundle,
  buildCanonicalStructuralNode,
  buildHierarchyProposal,
  buildMultiPageEvidence,
  buildSourceExplicitNode,
  deriveAuthoritativePagesMap,
  validateEvidenceSpan,
  validateSourceClassification,
} from '../syllabus/hierarchyProposalBuilder';
import { aafJobRegistry } from '../academicFactory/core/aafJobRegistry';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ­ƒøí´©Å EXECUTION-LOCATION INDEPENDENT SOURCE RESOLUTION (R3-11)
 * Resolves source files whether running directly from src via ts-jest
 * or from lib/test after compilation.
 */
function findSourceFile(filename: string): string {
  const candidates = [
    path.resolve(__dirname, '../syllabus', filename),
    path.resolve(__dirname, '../../src/syllabus', filename),
    path.resolve(__dirname, '../../../src/syllabus', filename),
    path.resolve(process.cwd(), 'src/syllabus', filename),
    path.resolve(process.cwd(), 'functions/src/syllabus', filename),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      return fs.readFileSync(c, 'utf8');
    }
  }
  throw new Error(`SOURCE_FILE_NOT_FOUND: Could not resolve source file '${filename}' across candidates.`);
}

describe('P02B1-R3B2B-R3: Hierarchy Proposal & Evidence Authority Hardening Suite', () => {
  const missionId = 'ssc_cgl';
  const cycleKey = 'ssc_cgl_2026';
  const authorityKey = 'ssc';
  const sourceId = 'sentinel_cgl_official_notice';
  const sourceVersionId = 'src_ver_cgl_2026_v1';
  const officialDocumentId = 'doc_cgl_2026_official_notice';
  const sourceSha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
  const byteArtifactId = 'art_bytes_cgl_notice';
  const provenanceId = 'prov_cgl_notice';
  const governanceId = 'gov_cgl_notice';
  const manifestId = 'manif_cgl_2026_001';
  const manifestHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const scopeAuthorityId = 'scope_auth_cgl_2026';
  const scopeResolutionSha = 'f1e2d3c4b5a60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const assessmentHash = 'b1c2d3e4f5a60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const hierarchyRevisionId = 'rev_hierarchy_r3b2b_001';

  function createValidLineage(overrides: Partial<AuthoritativeLineageBundle> = {}): AuthoritativeLineageBundle {
    return {
      missionId,
      cycleKey,
      authorityKey,
      sourceId,
      sourceVersionId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      storageGeneration: '1720000000123456',
      sourceClass: 'OFFICIAL_SYLLABUS',
      officialDocumentId,
      ...overrides,
    };
  }

  function createValidManifest(overrides: Partial<AuthoritativeExtractionManifestBundle> = {}): AuthoritativeExtractionManifestBundle {
    return {
      manifestId,
      manifestHash,
      contractVersion: 'r3b1_v2',
      missionId,
      cycleKey,
      authorityKey,
      sourceId,
      sourceVersionId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      totalPhysicalPages: 2,
      extractionIds: ['ext_page_1', 'ext_page_2'],
      pageIdentityHashes: ['page_id_hash_1', 'page_id_hash_2'],
      readabilityAssessment: {
        readability: 'NATIVE_TEXT',
        assessmentHash,
        physicalPageCount: 2,
      },
      ...overrides,
    };
  }

  function createValidScopeAuthority(overrides: Partial<ResolvedScopeAuthorityBundle> = {}): ResolvedScopeAuthorityBundle {
    return {
      scopeAuthorityId,
      missionId,
      cycleKey,
      authorityKey,
      sourceId,
      sourceVersionId,
      officialDocumentId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      extractionManifestId: manifestId,
      reviewCandidateId: 'cand_cgl_001',
      decisionRevision: 1,
      policyVersion: '1.0.0',
      jurisdiction: 'CENTRAL_SSC',
      resolutionSha: scopeResolutionSha,
      status: 'RESOLVED',
      ...overrides,
    };
  }

  function createValidPage(pageNumber: number, text: string, extractionId: string, pageIdentityHash: string): AuthoritativePageEvidence {
    return {
      extractionId,
      pageIdentityHash,
      physicalPageNumber: pageNumber,
      normalizedText: text,
      textSha256: computeEvidenceSpanHash(text),
      sourceSha256,
      sourceVersionId,
      missionId,
      cycleKey,
      authorityKey,
      sourceId,
      byteArtifactId,
      provenanceId,
      governanceId,
      manifestId,
    };
  }

  function createValidSpan(
    extractionId: string,
    pageNumber: number,
    startOffset: number,
    endOffset: number,
    textSlice: string,
    pageIdentityHash: string,
  ): EvidenceSpanReference {
    return {
      extractionId,
      physicalPageNumber: pageNumber,
      startOffset,
      endOffset,
      normalizedSpanSha256: computeEvidenceSpanHash(textSlice),
      pageIdentityHash,
    };
  }

  // =========================================================================
  // CORE CONTRACT REQUIREMENTS (AÔÇôZ)
  // =========================================================================

  it('A. exact five canonical levels are recognized', () => {
    expect(CANONICAL_LEVEL_COUNT).toBe(5);
    expect(CANONICAL_HIERARCHY_LEVELS).toEqual([
      'subject',
      'unit',
      'topic',
      'micro_topic',
      'atomic_level_topic',
    ]);
  });

  it('B. sixth level rejected', () => {
    expect(validateCanonicalLevelSequence('atomic_level_topic' as any, 'sub_atomic_level_topic' as any)).toBe(false);
  });

  it('C. collapsed level edge rejected', () => {
    expect(validateCanonicalLevelSequence('subject', 'topic')).toBe(false);
    expect(validateCanonicalLevelSequence('unit', 'micro_topic')).toBe(false);
    expect(validateCanonicalLevelSequence('topic', 'atomic_level_topic')).toBe(false);
    expect(validateCanonicalLevelSequence('subject', 'unit')).toBe(true);
    expect(validateCanonicalLevelSequence('unit', 'topic')).toBe(true);
    expect(validateCanonicalLevelSequence('topic', 'micro_topic')).toBe(true);
    expect(validateCanonicalLevelSequence('micro_topic', 'atomic_level_topic')).toBe(true);
  });

  it('D. source-explicit node requires valid authoritative evidence', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pagesMap: Record<string, AuthoritativePageEvidence> = Object.freeze(Object.create(null));

    expect(() => {
      buildSourceExplicitNode({
        missionId,
        cycleKey,
        subjectId: 'general_intelligence_and_reasoning',
        canonicalLevel: 'subject',
        parentProposedNodeId: null,
        parentCanonicalLevel: null,
        canonicalOrder: 0,
        displayLabel: 'General Intelligence',
        spans: [],
        pagesMap,
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
      });
    }).toThrow('SOURCE_EXPLICIT_NODE_REQUIRES_EVIDENCE');
  });

  it('E. structural node cannot carry independent academic scope', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'Section 1: Mathematical Abilities';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 9, 'Section 1', 'page_id_hash_1');

    const structuralNode = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'mathematical_abilities',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'Section 1 (Mathematical Abilities)',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    expect(structuralNode.academicScopeHash).toBeNull();
    expect(structuralNode.officialWording).toBe(false);
    expect(structuralNode.nodeAuthorityType).toBe('CANONICAL_STRUCTURAL_NODE');
  });

  it('F. structural node requires structural rule/version/revision', () => {
    expect(Object.keys(STRUCTURAL_RULE_DEFINITIONS)).toHaveLength(5);
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'General Intelligence';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');

    expect(() => {
      buildCanonicalStructuralNode({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        canonicalLevel: 'subject',
        parentProposedNodeId: null,
        parentCanonicalLevel: null,
        canonicalOrder: 0,
        displayLabel: 'General',
        structuralRuleId: '' as any,
        structuralRuleVersion: '1.0.0',
        structuralRuleRevision: '1',
        interpretationRevisionId: 'interp_001',
        descendantSpans: [span],
        pagesMap,
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
      });
    }).toThrow('STRUCTURAL_NODE_MISSING_RULE_METADATA');
  });

  it('G. structural node officialWording must be false', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'General Intelligence';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');

    const node = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'General Intelligence',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    expect(node.officialWording).toBe(false);
  });

  it('H. page-less evidence rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = {
      extractionId: 'ext_page_1',
      physicalPageNumber: undefined as any,
      startOffset: 0,
      endOffset: 7,
      normalizedSpanSha256: 'hash',
      pageIdentityHash: 'page_id_hash_1',
    };
    expect(() => {
      validateEvidenceSpan(span, page, lineage);
    }).toThrow('PAGE_LESS_EVIDENCE_FORBIDDEN');
  });

  it('I. page 0/negative rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = {
      extractionId: 'ext_page_1',
      physicalPageNumber: 0,
      startOffset: 0,
      endOffset: 7,
      normalizedSpanSha256: 'hash',
      pageIdentityHash: 'page_id_hash_1',
    };
    expect(() => {
      validateEvidenceSpan(span, page, lineage);
    }).toThrow('INVALID_PHYSICAL_PAGE_NUMBER');
  });

  it('J. invalid offsets rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = {
      extractionId: 'ext_page_1',
      physicalPageNumber: 1,
      startOffset: 10,
      endOffset: 5,
      normalizedSpanSha256: 'hash',
      pageIdentityHash: 'page_id_hash_1',
    };
    expect(() => {
      validateEvidenceSpan(span, page, lineage);
    }).toThrow('INVALID_SPAN_OFFSET');
  });

  it('K. span outside page bounds rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'Short', 'ext_page_1', 'page_id_hash_1');
    const span = {
      extractionId: 'ext_page_1',
      physicalPageNumber: 1,
      startOffset: 0,
      endOffset: 50,
      normalizedSpanSha256: 'hash',
      pageIdentityHash: 'page_id_hash_1',
    };
    expect(() => {
      validateEvidenceSpan(span, page, lineage);
    }).toThrow('SPAN_EXCEEDS_PAGE_BOUNDS');
  });

  it('L. span hash tamper rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const tampered = { ...span, normalizedSpanSha256: '0000000000000000000000000000000000000000000000000000000000000000' };
    expect(() => {
      validateEvidenceSpan(tampered, page, lineage);
    }).toThrow('SPAN_HASH_MISMATCH');
  });

  it('M. page identity tamper rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const tampered = { ...span, pageIdentityHash: 'tampered_page_hash' };
    expect(() => {
      validateEvidenceSpan(tampered, page, lineage);
    }).toThrow('PAGE_IDENTITY_MISMATCH');
  });

  it('N. source SHA mismatch rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const mismatchedLineage = { ...lineage, sourceSha256: 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff' };
    expect(() => {
      validateEvidenceSpan(span, page, mismatchedLineage);
    }).toThrow('LINEAGE_SOURCE_SHA_MISMATCH');
  });

  it('O. source-version mismatch rejected', () => {
    const lineage = createValidLineage();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const mismatchedLineage = { ...lineage, sourceVersionId: 'src_ver_wrong_999' };
    expect(() => {
      validateEvidenceSpan(span, page, mismatchedLineage);
    }).toThrow('LINEAGE_SOURCE_VERSION_MISMATCH');
  });

  it('P. manifest mismatch rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest({ manifestId: 'manif_original' });
    const scope = createValidScopeAuthority({ extractionManifestId: 'manif_conflicting' });
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: ['ext_page_1'],
      });
    }).toThrow('R3B1_IDENTITY_CONFLICT');
  });

  it('Q. scope-resolution mismatch rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority({ resolutionSha: '' });
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: ['ext_page_1'],
      });
    }).toThrow('R3B1_IDENTITY_MISSING');
  });

  it('R. cross-mission replay rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority({ missionId: 'upsc_cse' });
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: ['ext_page_1'],
      });
    }).toThrow('R3B1_IDENTITY_CONFLICT');
  });

  it('S. cross-cycle replay rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority({ cycleKey: 'ssc_cgl_2025' });
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: ['ext_page_1'],
      });
    }).toThrow('R3B1_IDENTITY_CONFLICT');
  });

  it('T. PYQ-derived authority rejected', () => {
    expect(() => {
      validateSourceClassification('PYQ');
    }).toThrow('PYQ_AUTHORITY_FORBIDDEN');
    expect(() => {
      validateSourceClassification('QUESTION_PAPER');
    }).toThrow('FORBIDDEN_SOURCE_CLASS');
    expect(() => {
      validateSourceClassification('COACHING_CONTENT');
    }).toThrow('FORBIDDEN_SOURCE_CLASS');
  });

  it('U. full SHA identity deterministic', () => {
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const hash1 = computeEvidenceSetHash([span]);
    const hash2 = computeEvidenceSetHash([span]);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('V. no 24-character truncated node digest', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'General Intelligence';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const node = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    expect(node.proposedNodeId.startsWith('prop_node_')).toBe(true);
    const hexDigest = node.proposedNodeId.replace('prop_node_', '');
    expect(hexDigest).toHaveLength(64);
    expect(hexDigest.length).not.toBe(24);
  });

  it('W. evidence ordering deterministic', () => {
    const spanA = createValidSpan('ext_page_1', 1, 0, 5, 'Slice', 'page_id_hash_1');
    const spanB = createValidSpan('ext_page_1', 1, 10, 15, 'Slice', 'page_id_hash_1');
    const bundle1 = buildMultiPageEvidence([spanA, spanB]);
    const bundle2 = buildMultiPageEvidence([spanA, spanB]);
    expect(bundle1.evidenceSetHash).toBe(bundle2.evidenceSetHash);
    expect(bundle1.spans[0].startOffset).toBe(0);
    expect(bundle1.spans[1].startOffset).toBe(10);
  });

  it('X. multi-page continuation without authority rejected', () => {
    const spanA = createValidSpan('ext_page_1', 1, 0, 5, 'Slice', 'page_id_hash_1');
    const spanB = createValidSpan('ext_page_2', 2, 0, 5, 'Slice', 'page_id_hash_2');
    expect(() => {
      buildMultiPageEvidence([spanA, spanB], null);
    }).toThrow('MULTI_PAGE_CONTINUATION_UNSUPPORTED');
  });

  it('Y. ambiguous decomposition produces HOLD, not invented children', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'General Intelligence';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const node = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const proposal = buildHierarchyProposal({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      lineage,
      manifest,
      scopeAuthority: scope,
      pagesMap,
      hierarchyRevisionId,
      nodes: [node],
      requiredEvidenceSet: ['ext_page_1', 'ext_page_unresolved_2'],
      unresolvedEvidenceSet: ['ext_page_unresolved_2'],
    });

    expect(proposal.reviewState).toBe('HOLD_AMBIGUOUS_SCOPE');
    expect(proposal.proposalNodeCount).toBe(1);
  });

  it('Z. proposal cannot become STRUCTURALLY_ACCEPTED in R3B2B', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'General Intelligence';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const node = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const proposal = buildHierarchyProposal({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      lineage,
      manifest,
      scopeAuthority: scope,
      pagesMap,
      hierarchyRevisionId,
      nodes: [node],
      requiredEvidenceSet: ['ext_page_1'],
      unresolvedEvidenceSet: [],
    });

    expect(proposal.reviewState).toBe('PENDING_STRUCTURAL_REVIEW');
    expect((proposal.reviewState as string)).not.toBe('STRUCTURALLY_ACCEPTED');
  });

  // =========================================================================
  // REPAIRED BOUNDARY PROOFS (AAÔÇôAD) ÔÇö EXECUTION-LOCATION INDEPENDENT
  // =========================================================================

  it('AA. builder pure-function boundary test (no DB/Firestore imports, pure in-memory execution)', () => {
    const builderContent = findSourceFile('hierarchyProposalBuilder.ts');
    const contractContent = findSourceFile('hierarchyProposalContract.ts');

    expect(builderContent).not.toMatch(/@google-cloud\/firestore/);
    expect(builderContent).not.toMatch(/firebase-admin/);
    expect(builderContent).not.toMatch(/AafDispatcher/);
    expect(builderContent).not.toMatch(/AafQueueRepository/);
    expect(contractContent).not.toMatch(/@google-cloud\/firestore/);
    expect(contractContent).not.toMatch(/firebase-admin/);
  });

  it('AB. builder boundary test (zero canonicalSyllabusReady / readiness write capability)', () => {
    const builderContent = findSourceFile('hierarchyProposalBuilder.ts');

    expect(builderContent).not.toMatch(/canonicalSyllabusReady\s*=/);
    expect(builderContent).not.toMatch(/update\(\s*\{.*canonicalSyllabusReady/);
    expect(builderContent).not.toMatch(/set\(\s*\{.*canonicalSyllabusReady/);
  });

  it('AC. builder boundary test (zero B3 enqueue or AafDispatcher capability)', () => {
    const builderContent = findSourceFile('hierarchyProposalBuilder.ts');

    expect(builderContent).not.toMatch(/enqueueJob/);
    expect(builderContent).not.toMatch(/dispatchJob/);
    expect(builderContent).not.toMatch(/SYLLABUS_B3/);
  });

  it('AD. quarantined AAF registry remains without SYLLABUS_B3', () => {
    expect(aafJobRegistry.getHandler('SYLLABUS_B3' as any)).toBeUndefined();
    expect(aafJobRegistry.getRegisteredTypes()).not.toContain('SYLLABUS_B3');
    expect(aafJobRegistry.getCanonicalTypes()).not.toContain('SYLLABUS_B3');
  });

  // =========================================================================
  // 21 ADVERSARIAL TESTS COVERING RESIDUAL AUDIT GAPS (R3B2B-R3)
  // =========================================================================

  it('Adv-01. top-level params mission conflict rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    expect(() => {
      buildSourceExplicitNode({
        missionId: 'upsc_cse', // Mutate caller top-level missionId only
        cycleKey,
        subjectId: 'gen_intel',
        canonicalLevel: 'subject',
        parentProposedNodeId: null,
        parentCanonicalLevel: null,
        canonicalOrder: 0,
        spans: [span],
        pagesMap,
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
      });
    }).toThrow('TOP_LEVEL_MISSION_MISMATCH');
  });

  it('Adv-02. top-level params cycle conflict rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    expect(() => {
      buildSourceExplicitNode({
        missionId,
        cycleKey: 'ssc_cgl_2025', // Mutate caller top-level cycleKey only
        subjectId: 'gen_intel',
        canonicalLevel: 'subject',
        parentProposedNodeId: null,
        parentCanonicalLevel: null,
        canonicalOrder: 0,
        spans: [span],
        pagesMap,
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
      });
    }).toThrow('TOP_LEVEL_CYCLE_MISMATCH');
  });

  it('Adv-03. byteArtifactId identity mutation changes node ID', () => {
    const baseNodeInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject' as const,
      normalizedLabel: 'general intelligence',
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE' as const,
      academicScopeHash: 'scope_hash_1',
      boundedEvidenceSetHash: 'bounded_hash_1',
      boundEvidenceSpans: [{
        extractionId: 'ext_page_1',
        physicalPageNumber: 1,
        startOffset: 0,
        endOffset: 20,
        normalizedSpanSha256: 'span_hash_1',
        pageIdentityHash: 'page_id_hash_1',
      }],
      sourceId,
      sourceVersionId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      officialDocumentId,
      extractionManifestId: manifestId,
      extractionManifestHash: manifestHash,
      scopeAuthorityId,
      scopeResolutionSha,
      readabilityAssessmentIdentity: assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const id1 = computeProposedNodeId(baseNodeInput);
    const mutatedInput = { ...baseNodeInput, byteArtifactId: 'art_mutated_artifact' };
    const id2 = computeProposedNodeId(mutatedInput);
    expect(id1).not.toBe(id2);
  });

  it('Adv-04. provenanceId identity mutation changes node ID', () => {
    const baseNodeInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject' as const,
      normalizedLabel: 'general intelligence',
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE' as const,
      academicScopeHash: 'scope_hash_1',
      boundedEvidenceSetHash: 'bounded_hash_1',
      boundEvidenceSpans: [],
      sourceId,
      sourceVersionId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      officialDocumentId,
      extractionManifestId: manifestId,
      extractionManifestHash: manifestHash,
      scopeAuthorityId,
      scopeResolutionSha,
      readabilityAssessmentIdentity: assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const id1 = computeProposedNodeId(baseNodeInput);
    const mutatedInput = { ...baseNodeInput, provenanceId: 'prov_mutated' };
    const id2 = computeProposedNodeId(mutatedInput);
    expect(id1).not.toBe(id2);
  });

  it('Adv-05. governanceId identity mutation changes node ID', () => {
    const baseNodeInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject' as const,
      normalizedLabel: 'general intelligence',
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE' as const,
      academicScopeHash: 'scope_hash_1',
      boundedEvidenceSetHash: 'bounded_hash_1',
      boundEvidenceSpans: [],
      sourceId,
      sourceVersionId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      officialDocumentId,
      extractionManifestId: manifestId,
      extractionManifestHash: manifestHash,
      scopeAuthorityId,
      scopeResolutionSha,
      readabilityAssessmentIdentity: assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const id1 = computeProposedNodeId(baseNodeInput);
    const mutatedInput = { ...baseNodeInput, governanceId: 'gov_mutated' };
    const id2 = computeProposedNodeId(mutatedInput);
    expect(id1).not.toBe(id2);
  });

  it('Adv-06. readability identity mutation changes node ID', () => {
    const baseNodeInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject' as const,
      normalizedLabel: 'general intelligence',
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE' as const,
      academicScopeHash: 'scope_hash_1',
      boundedEvidenceSetHash: 'bounded_hash_1',
      boundEvidenceSpans: [],
      sourceId,
      sourceVersionId,
      sourceSha256,
      byteArtifactId,
      provenanceId,
      governanceId,
      officialDocumentId,
      extractionManifestId: manifestId,
      extractionManifestHash: manifestHash,
      scopeAuthorityId,
      scopeResolutionSha,
      readabilityAssessmentIdentity: assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const id1 = computeProposedNodeId(baseNodeInput);
    const mutatedInput = { ...baseNodeInput, readabilityAssessmentIdentity: 'readability_mutated_hash' };
    const id2 = computeProposedNodeId(mutatedInput);
    expect(id1).not.toBe(id2);
  });

  it('Adv-07. duplicate required evidence rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: ['ext_page_1', 'ext_page_1'], // Exact duplicate
        unresolvedEvidenceSet: ['ext_page_1'],
      });
    }).toThrow('DUPLICATE_REQUIRED_EVIDENCE_REJECTED');
  });

  it('Adv-08. duplicate resolved evidence within node rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span1 = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const span2 = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1'); // Exact duplicate span

    expect(() => {
      buildSourceExplicitNode({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        canonicalLevel: 'subject',
        parentProposedNodeId: null,
        parentCanonicalLevel: null,
        canonicalOrder: 0,
        spans: [span1, span2],
        pagesMap,
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
      });
    }).toThrow('DUPLICATE_EVIDENCE_SPAN_REJECTED');
  });

  it('Adv-09. duplicate unresolved evidence rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: ['ext_page_1', 'ext_page_1'], // Duplicate unresolved
      });
    }).toThrow('DUPLICATE_UNRESOLVED_EVIDENCE_REJECTED');
  });

  it('Adv-10. duplicate bounded structural evidence rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span1 = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');
    const span2 = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1'); // Exact duplicate span

    expect(() => {
      buildCanonicalStructuralNode({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        canonicalLevel: 'subject',
        parentProposedNodeId: null,
        parentCanonicalLevel: null,
        canonicalOrder: 0,
        displayLabel: 'Section Wrapper',
        structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
        structuralRuleVersion: '1.0.0',
        structuralRuleRevision: '1',
        interpretationRevisionId: 'interp_001',
        descendantSpans: [span1, span2],
        pagesMap,
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
      });
    }).toThrow('DUPLICATE_BOUNDED_EVIDENCE_REJECTED');
  });

  it('Adv-11. empty proposal rejected (zero nodes and zero required evidence)', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: [],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('EMPTY_PROPOSAL_REJECTED');
  });

  it('Adv-12. forged node proposedNodeId rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode = { ...validNode, proposedNodeId: 'prop_node_forged_000000000000000000000000000000000000000000000000000000000000' };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_IDENTITY_MISMATCH');
  });

  it('Adv-13. forged node revisionIdentityHash rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode = { ...validNode, revisionIdentityHash: 'forged_revision_hash_00000000000000000000000000000000000000000000' };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_REVISION_HASH_MISMATCH');
  });

  it('Adv-14. forged node mission rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode = { ...validNode, missionId: 'upsc_cse' };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_MISSION_MISMATCH');
  });

  it('Adv-15. forged node cycle rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode = { ...validNode, cycleKey: 'ssc_cgl_2025' };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_CYCLE_MISMATCH');
  });

  it('Adv-16. forged node source SHA/version rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNodeVersion = { ...validNode, sourceVersionId: 'src_ver_forged' };
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNodeVersion],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_SOURCE_VERSION_MISMATCH');

    const forgedNodeSha = { ...validNode, sourceSha256: '0000000000000000000000000000000000000000000000000000000000000000' };
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNodeSha],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_SOURCE_SHA_MISMATCH');
  });

  it('Adv-17. forged node manifest/scope rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNodeManifest = { ...validNode, extractionManifestId: 'manif_forged_999' };
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNodeManifest],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_MANIFEST_MISMATCH');

    const forgedNodeScope = { ...validNode, scopeResolutionSha: '0000000000000000000000000000000000000000000000000000000000000000' };
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNodeScope],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_SCOPE_MISMATCH');
  });

  it('Adv-18. noncontiguous multi-page rejected', () => {
    const span1 = createValidSpan('ext_page_1', 1, 0, 5, 'Slice', 'page_id_hash_1');
    const span3 = createValidSpan('ext_page_3', 3, 0, 5, 'Slice', 'page_id_hash_3'); // Skips page 2

    expect(() => {
      buildMultiPageEvidence([span1, span3]);
    }).toThrow('NONCONTIGUOUS_CONTINUATION_REJECTED');
  });

  it('Adv-19. reversed multi-page rejected', () => {
    const span1 = createValidSpan('ext_page_1', 1, 0, 5, 'Slice', 'page_id_hash_1');
    const span2 = createValidSpan('ext_page_2', 2, 0, 5, 'Slice', 'page_id_hash_2');

    expect(() => {
      buildMultiPageEvidence([span2, span1]); // Scrambled/reversed order
    }).toThrow('REVERSED_CONTINUATION_REJECTED');
  });

  it('Adv-20. structural arbitrary label does not become authoritative and forces HOLD', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const pageText = 'General Intelligence';
    const page = createValidPage(1, pageText, 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');

    const node = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'Arbitrary Structural Routing Header',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    expect(node.officialWording).toBe(false);
    expect(node.academicScopeHash).toBeNull();
    expect(node.reviewState).toBe('HOLD_AMBIGUOUS_SCOPE');

    const proposal = buildHierarchyProposal({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      lineage,
      manifest,
      scopeAuthority: scope,
      pagesMap,
      hierarchyRevisionId,
      nodes: [node],
      requiredEvidenceSet: ['ext_page_1'],
      unresolvedEvidenceSet: [],
    });

    expect(proposal.reviewState).toBe('HOLD_AMBIGUOUS_SCOPE');
  });

  it('Adv-21. proposal node evidence not in REQUIRED rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const node = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [node], // Claims ext_page_1
        requiredEvidenceSet: ['ext_page_2'], // But required is ext_page_2!
        unresolvedEvidenceSet: ['ext_page_2'],
      });
    }).toThrow('UNAUTHORIZED_EXTRA_RESOLVED_EVIDENCE');
  });

  it('Adv-22. self-consistent source wording forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    // Attacker crafts forged labels and recomputes hashes to be internally consistent
    const forgedWording = 'Invented Topic From Nowhere';
    const forgedNormalized = 'invented topic from nowhere';
    const forgedScopeHash = sha256Hex(forgedWording);

    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: forgedNormalized,
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: forgedScopeHash,
      boundedEvidenceSetHash: validNode.boundedEvidenceSetHash,
      boundEvidenceSpans: validNode.sourceSpanRefs.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      })),
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      displayLabel: forgedWording,
      normalizedLabel: forgedNormalized,
      academicScopeHash: forgedScopeHash,
      proposedNodeId: computeProposedNodeId(forgedPayload),
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('PROPOSAL_NODE_WORDING_MISMATCH');
  });

  it('Adv-23. self-consistent source academicScopeHash forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedScopeHash = sha256Hex('Different Unauthorized Academic Scope');

    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: validNode.normalizedLabel,
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: forgedScopeHash,
      boundedEvidenceSetHash: validNode.boundedEvidenceSetHash,
      boundEvidenceSpans: validNode.sourceSpanRefs.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      })),
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      academicScopeHash: forgedScopeHash,
      proposedNodeId: computeProposedNodeId(forgedPayload),
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('PROPOSAL_NODE_SCOPE_HASH_MISMATCH');
  });

  it('Adv-24. self-consistent source evidence-ref forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      sourceEvidenceRefs: ['ext_page_1', 'ext_page_2'],
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1', 'ext_page_2'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('SOURCE_EVIDENCE_REF_MISMATCH');
  });

  it('Adv-25. self-consistent source span forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    // Forged span slice hash
    const forgedSpan: EvidenceSpanReference = {
      extractionId: 'ext_page_1',
      physicalPageNumber: 1,
      startOffset: 0,
      endOffset: 20,
      normalizedSpanSha256: '0000000000000000000000000000000000000000000000000000000000000000',
      pageIdentityHash: 'page_id_hash_1',
    };

    const forgedEvidenceSetHash = computeEvidenceSetHash([forgedSpan]);
    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: 'general intelligence',
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: sha256Hex('General Intelligence'),
      boundedEvidenceSetHash: forgedEvidenceSetHash,
      boundEvidenceSpans: [forgedSpan],
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const forgedNode: ProposedHierarchyNode = {
      proposedNodeId: computeProposedNodeId(forgedPayload),
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      canonicalOrder: 0,
      displayLabel: 'General Intelligence',
      normalizedLabel: 'general intelligence',
      officialWording: true,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: sha256Hex('General Intelligence'),
      boundedEvidenceSetHash: forgedEvidenceSetHash,
      sourceEvidenceRefs: ['ext_page_1'],
      sourcePageRefs: [1],
      sourceSpanRefs: [forgedSpan],
      sourceId: lineage.sourceId,
      sourceSha256: lineage.sourceSha256,
      sourceVersionId: lineage.sourceVersionId,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
      reviewState: 'PENDING_STRUCTURAL_REVIEW',
      materializationState: 'PROPOSED',
      hierarchyRevisionId,
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('SPAN_HASH_MISMATCH');
  });

  it('Adv-26. self-consistent structural bounded-hash forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');

    const validNode = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'Section Wrapper',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedBoundedHash = sha256Hex('forged_descendant_evidence_set_hash');
    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: validNode.normalizedLabel,
      parentProposedNodeId: null,
      nodeAuthorityType: 'CANONICAL_STRUCTURAL_NODE',
      academicScopeHash: null,
      boundedEvidenceSetHash: forgedBoundedHash,
      boundEvidenceSpans: validNode.sourceSpanRefs.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      })),
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
    };

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      boundedEvidenceSetHash: forgedBoundedHash,
      proposedNodeId: computeProposedNodeId(forgedPayload),
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('PROPOSAL_NODE_BOUNDED_HASH_MISMATCH');
  });

  it('Adv-27. self-consistent structural foreign-span forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });

    const foreignSpan: EvidenceSpanReference = {
      extractionId: 'ext_foreign_page_999',
      physicalPageNumber: 999,
      startOffset: 0,
      endOffset: 10,
      normalizedSpanSha256: sha256Hex('Foreign'),
      pageIdentityHash: 'foreign_page_hash_999',
    };

    const forgedBoundedHash = computeEvidenceSetHash([foreignSpan]);
    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: 'section wrapper',
      parentProposedNodeId: null,
      nodeAuthorityType: 'CANONICAL_STRUCTURAL_NODE',
      academicScopeHash: null,
      boundedEvidenceSetHash: forgedBoundedHash,
      boundEvidenceSpans: [foreignSpan],
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
    };

    const forgedNode: ProposedHierarchyNode = {
      proposedNodeId: computeProposedNodeId(forgedPayload),
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      canonicalOrder: 0,
      displayLabel: 'Section Wrapper',
      normalizedLabel: 'section wrapper',
      officialWording: false,
      nodeAuthorityType: 'CANONICAL_STRUCTURAL_NODE',
      academicScopeHash: null,
      boundedEvidenceSetHash: forgedBoundedHash,
      sourceEvidenceRefs: ['ext_foreign_page_999'],
      sourcePageRefs: [999],
      sourceSpanRefs: [foreignSpan],
      sourceId: lineage.sourceId,
      sourceSha256: lineage.sourceSha256,
      sourceVersionId: lineage.sourceVersionId,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      reviewState: 'HOLD_AMBIGUOUS_SCOPE',
      materializationState: 'PROPOSED',
      hierarchyRevisionId,
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_foreign_page_999'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('PAGE_EVIDENCE_NOT_FOUND');
  });

  it('Adv-28. self-consistent structural evidence-ref forgery rejected by assembly authority', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');

    const validNode = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'Section Wrapper',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      sourceEvidenceRefs: ['ext_page_1', 'ext_page_2'],
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1', 'ext_page_2'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('SOURCE_EVIDENCE_REF_MISMATCH');
  });

  it('Adv-29. proposedNodeId recomputed over forged source data rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    // Recompute proposedNodeId over altered payload
    const alteredPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: 'tampered label',
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: validNode.academicScopeHash,
      boundedEvidenceSetHash: validNode.boundedEvidenceSetHash,
      boundEvidenceSpans: validNode.sourceSpanRefs.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      })),
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      proposedNodeId: computeProposedNodeId(alteredPayload),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_IDENTITY_MISMATCH');
  });

  it('Adv-30. revisionIdentityHash recomputed over forged source data rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      revisionIdentityHash: sha256Hex('forged_revision_payload'),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('FORGED_NODE_REVISION_HASH_MISMATCH');
  });

  it('Adv-31. both identities recomputed over forged structural data rejected', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 7, 'General', 'page_id_hash_1');

    const validNode = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'Section Wrapper',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    // Attacker crafts forged rule revision and recomputes BOTH identities
    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: validNode.normalizedLabel,
      parentProposedNodeId: null,
      nodeAuthorityType: 'CANONICAL_STRUCTURAL_NODE',
      academicScopeHash: null,
      boundedEvidenceSetHash: validNode.boundedEvidenceSetHash,
      boundEvidenceSpans: validNode.sourceSpanRefs.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      })),
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '999_forged', // Tampered revision
      interpretationRevisionId: 'interp_001',
    };

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      structuralRuleRevision: '999_forged',
      proposedNodeId: computeProposedNodeId(forgedPayload),
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('STRUCTURAL_RULE_REVISION_MISMATCH');
  });

  it('Adv-32. authority vs hash reconciliation: hash integrity passes but authority reconciliation fails -> REJECTED', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    // Attacker crafts a completely self-consistent forged node
    const forgedWording = 'Forged Academic Topic';
    const forgedNormalized = 'forged academic topic';
    const forgedScope = sha256Hex(forgedWording);

    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: forgedNormalized,
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: forgedScope,
      boundedEvidenceSetHash: validNode.boundedEvidenceSetHash,
      boundEvidenceSpans: validNode.sourceSpanRefs.map(s => ({
        extractionId: s.extractionId,
        physicalPageNumber: s.physicalPageNumber,
        startOffset: s.startOffset,
        endOffset: s.endOffset,
        normalizedSpanSha256: s.normalizedSpanSha256,
        pageIdentityHash: s.pageIdentityHash,
      })),
      sourceId: lineage.sourceId,
      sourceVersionId: lineage.sourceVersionId,
      sourceSha256: lineage.sourceSha256,
      byteArtifactId: lineage.byteArtifactId,
      provenanceId: lineage.provenanceId,
      governanceId: lineage.governanceId,
      officialDocumentId: scope.officialDocumentId,
      extractionManifestId: manifest.manifestId,
      extractionManifestHash: manifest.manifestHash,
      scopeAuthorityId: scope.scopeAuthorityId,
      scopeResolutionSha: scope.resolutionSha,
      readabilityAssessmentIdentity: manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const forgedNode: ProposedHierarchyNode = {
      ...validNode,
      displayLabel: forgedWording,
      normalizedLabel: forgedNormalized,
      academicScopeHash: forgedScope,
      proposedNodeId: computeProposedNodeId(forgedPayload),
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    // 1. Cryptographic hash self-consistency passes:
    const hashIntegrityPass =
      forgedNode.proposedNodeId === computeProposedNodeId(forgedPayload) &&
      forgedNode.revisionIdentityHash === sha256Hex(canonicalJson(forgedPayload));
    expect(hashIntegrityPass).toBe(true);

    // 2. But authority reconciliation MUST FAIL:
    let authorityReconciliationPass = true;
    let finalResult = 'ACCEPTED';
    try {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        pagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    } catch {
      authorityReconciliationPass = false;
      finalResult = 'REJECTED';
    }

    expect(authorityReconciliationPass).toBe(false);
    expect(finalResult).toBe('REJECTED');
  });

  it('Adv-33. pagesMap required when proposal nodes are present', () => {
    const lineage = createValidLineage();
    const manifest = createValidManifest();
    const scope = createValidScopeAuthority();
    const page = createValidPage(1, 'General Intelligence', 'ext_page_1', 'page_id_hash_1');
    const pagesMap = Object.freeze({ [page.extractionId]: page });
    const span = createValidSpan('ext_page_1', 1, 0, 20, 'General Intelligence', 'page_id_hash_1');

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      pagesMap,
      lineage,
      manifest,
      scopeAuthority: scope,
      hierarchyRevisionId,
    });

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage,
        manifest,
        scopeAuthority: scope,
        // pagesMap omitted!
        hierarchyRevisionId,
        nodes: [validNode],
        requiredEvidenceSet: ['ext_page_1'],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('PAGES_MAP_REQUIRED');
  });

  // =========================================================================
  // R7: R3B1-ROOTED PAGESMAP AUTHORITY CLOSURE (Adv-34 .. Adv-45)
  // =========================================================================

  function createRealR3B1Fixture(docSuffix = 'a') {
    const docSourceId = `official_syllabus_${docSuffix}`;
    const docSourceVersionId = `v2026_${docSuffix}`;
    const docSourceSha256 = sha256Hex(`pdf_raw_bytes_${docSuffix}`);
    const docByteArtifactId = `art_pdf_${docSuffix}`;
    const docProvenanceId = `prov_${docSuffix}`;
    const docGovernanceId = `gov_${docSuffix}`;
    const docOfficialDocumentId = `doc_${docSuffix}`;
    const docStorageGeneration = '1720000000999999';
    const docParserVersion = 'pdf_native_v1';

    const p1Text = `Section 1: General Intelligence and Reasoning\nAnalogies, similarities and differences, spatial visualization.`;
    const p1NormText = p1Text.replace(/\r\n/g, '\n');
    const p1TextSha = sha256Hex(p1NormText);
    const p1PageHash = computePageExtractionIdentity({
      sourceId: docSourceId,
      sourceVersionId: docSourceVersionId,
      sourceSha256: docSourceSha256,
      physicalPageNumber: 1,
      textSha256: p1TextSha,
      byteArtifactId: docByteArtifactId,
    });
    const p1ExtId = computeExtractionId(p1PageHash);

    const p2Text = `Section 2: General Awareness\nHistory, Culture, Geography, Economic Scene, General Policy.`;
    const p2NormText = p2Text.replace(/\r\n/g, '\n');
    const p2TextSha = sha256Hex(p2NormText);
    const p2PageHash = computePageExtractionIdentity({
      sourceId: docSourceId,
      sourceVersionId: docSourceVersionId,
      sourceSha256: docSourceSha256,
      physicalPageNumber: 2,
      textSha256: p2TextSha,
      byteArtifactId: docByteArtifactId,
    });
    const p2ExtId = computeExtractionId(p2PageHash);

    const fixtureLineage: AuthoritativeLineageBundle = {
      missionId,
      cycleKey,
      authorityKey,
      sourceId: docSourceId,
      sourceVersionId: docSourceVersionId,
      sourceSha256: docSourceSha256,
      byteArtifactId: docByteArtifactId,
      provenanceId: docProvenanceId,
      governanceId: docGovernanceId,
      storageGeneration: docStorageGeneration,
      sourceClass: 'OFFICIAL_SYLLABUS',
      officialDocumentId: docOfficialDocumentId,
    };

    const fixtureManifestId = `manif_${docSuffix}_001`;
    const fixtureManifestHash = sha256Hex(`manifest_content_${docSuffix}`);
    const fixtureAssessmentHash = sha256Hex(`assessment_${docSuffix}`);

    const fixtureManifest: AuthoritativeExtractionManifestBundle = {
      manifestId: fixtureManifestId,
      manifestHash: fixtureManifestHash,
      contractVersion: 'r3b1_v2',
      missionId,
      cycleKey,
      authorityKey,
      sourceId: docSourceId,
      sourceVersionId: docSourceVersionId,
      sourceSha256: docSourceSha256,
      byteArtifactId: docByteArtifactId,
      provenanceId: docProvenanceId,
      governanceId: docGovernanceId,
      totalPhysicalPages: 2,
      extractionIds: [p1ExtId, p2ExtId],
      pageIdentityHashes: [p1PageHash, p2PageHash],
      storageGeneration: docStorageGeneration,
      parserVersion: docParserVersion,
      readabilityAssessment: {
        readability: 'NATIVE_TEXT',
        assessmentHash: fixtureAssessmentHash,
        physicalPageCount: 2,
      },
      pagesSummary: [
        { physicalPageNumber: 1, extractionId: p1ExtId, pageIdentityHash: p1PageHash, textSha256: p1TextSha, charCount: p1NormText.length },
        { physicalPageNumber: 2, extractionId: p2ExtId, pageIdentityHash: p2PageHash, textSha256: p2TextSha, charCount: p2NormText.length },
      ],
    };

    const fixtureScopeAuthority: ResolvedScopeAuthorityBundle = {
      scopeAuthorityId: `scope_auth_${docSuffix}`,
      missionId,
      cycleKey,
      authorityKey,
      sourceId: docSourceId,
      sourceVersionId: docSourceVersionId,
      officialDocumentId: docOfficialDocumentId,
      sourceSha256: docSourceSha256,
      byteArtifactId: docByteArtifactId,
      provenanceId: docProvenanceId,
      governanceId: docGovernanceId,
      extractionManifestId: fixtureManifestId,
      reviewCandidateId: `cand_${docSuffix}_001`,
      decisionRevision: 1,
      policyVersion: '1.0.0',
      jurisdiction: 'CENTRAL_SSC',
      resolutionSha: sha256Hex(`resolution_${docSuffix}`),
      status: 'RESOLVED',
    };

    const pageRecords: AuthoritativePageEvidence[] = [
      {
        extractionId: p1ExtId,
        pageIdentityHash: p1PageHash,
        physicalPageNumber: 1,
        normalizedText: p1NormText,
        textSha256: p1TextSha,
        sourceSha256: docSourceSha256,
        sourceVersionId: docSourceVersionId,
        missionId,
        cycleKey,
        authorityKey,
        sourceId: docSourceId,
        byteArtifactId: docByteArtifactId,
        provenanceId: docProvenanceId,
        governanceId: docGovernanceId,
        manifestId: fixtureManifestId,
        storageGeneration: docStorageGeneration,
        parserVersion: docParserVersion,
        readability: 'NATIVE_TEXT',
      },
      {
        extractionId: p2ExtId,
        pageIdentityHash: p2PageHash,
        physicalPageNumber: 2,
        normalizedText: p2NormText,
        textSha256: p2TextSha,
        sourceSha256: docSourceSha256,
        sourceVersionId: docSourceVersionId,
        missionId,
        cycleKey,
        authorityKey,
        sourceId: docSourceId,
        byteArtifactId: docByteArtifactId,
        provenanceId: docProvenanceId,
        governanceId: docGovernanceId,
        manifestId: fixtureManifestId,
        storageGeneration: docStorageGeneration,
        parserVersion: docParserVersion,
        readability: 'NATIVE_TEXT',
      },
    ];

    const p1Slice = 'Section 1: General Intelligence and Reasoning';

    return {
      lineage: fixtureLineage,
      manifest: fixtureManifest,
      scopeAuthority: fixtureScopeAuthority,
      pageRecords,
      p1ExtId,
      p1PageHash,
      p1NormText,
      p1Slice,
      p2ExtId,
      p2PageHash,
      p2NormText,
    };
  }

  it('Adv-34. Persisted frozen R3B1 fixture -> deriveAuthoritativePagesMap -> proposal assembly succeeds', () => {
    const fixture = createRealR3B1Fixture('cgl_notice_a');
    const derivedPagesMap = deriveAuthoritativePagesMap({
      lineage: fixture.lineage,
      manifest: fixture.manifest,
      scopeAuthority: fixture.scopeAuthority,
      authoritativePageRecords: fixture.pageRecords,
    });

    expect(Object.keys(derivedPagesMap).length).toBe(2);
    expect(derivedPagesMap[fixture.p1ExtId]).toBeDefined();
    expect(derivedPagesMap[fixture.p2ExtId]).toBeDefined();

    const span = createValidSpan(
      fixture.p1ExtId,
      1,
      0,
      fixture.p1Slice.length,
      fixture.p1Slice,
      fixture.p1PageHash
    );

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span],
      authoritativePageRecords: fixture.pageRecords,
      lineage: fixture.lineage,
      manifest: fixture.manifest,
      scopeAuthority: fixture.scopeAuthority,
      hierarchyRevisionId,
    });

    const proposal = buildHierarchyProposal({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      lineage: fixture.lineage,
      manifest: fixture.manifest,
      scopeAuthority: fixture.scopeAuthority,
      authoritativePageRecords: fixture.pageRecords,
      hierarchyRevisionId,
      nodes: [validNode],
      requiredEvidenceSet: [fixture.p1ExtId],
      unresolvedEvidenceSet: [],
    });

    expect(proposal.proposalContractVersion).toBe('R3B2B-PROPOSAL-V1');
    expect(proposal.proposalNodeManifest.length).toBe(1);
    expect(proposal.proposalNodeManifest[0].proposedNodeId).toBe(validNode.proposedNodeId);
    expect(proposal.proposalId).toBeDefined();
    expect(proposal.proposalId.startsWith('prop_')).toBe(true);
    expect(proposal.proposalId.length).toBe(69);
    expect(proposal.proposalContentHash.length).toBe(64);
  });

  it('Adv-35. Synthetic pagesMap rejection: caller tries to synthesize page text / forged page identities and pass to buildHierarchyProposal with recomputed node identities', () => {
    const fixture = createRealR3B1Fixture('cgl_notice_a');

    // Attacker crafts synthetic page with forged text
    const forgedText = 'Synthetic Syllabus Text Forged By Caller';
    const forgedTextSha = sha256Hex(forgedText);
    const forgedPageHash = computePageExtractionIdentity({
      sourceId: fixture.lineage.sourceId,
      sourceVersionId: fixture.lineage.sourceVersionId,
      sourceSha256: fixture.lineage.sourceSha256,
      physicalPageNumber: 1,
      textSha256: forgedTextSha,
      byteArtifactId: fixture.lineage.byteArtifactId,
    });
    const forgedExtId = computeExtractionId(forgedPageHash);

    const syntheticPage: AuthoritativePageEvidence = {
      ...fixture.pageRecords[0],
      extractionId: forgedExtId,
      pageIdentityHash: forgedPageHash,
      normalizedText: forgedText,
      textSha256: forgedTextSha,
    };

    const syntheticPagesMap: Record<string, AuthoritativePageEvidence> = Object.freeze({
      [forgedExtId]: Object.freeze(syntheticPage),
      [fixture.p2ExtId]: Object.freeze(fixture.pageRecords[1]),
    });

    const forgedSpan = createValidSpan(forgedExtId, 1, 0, forgedText.length, forgedText, forgedPageHash);

    // Attacker constructs a self-consistent forged node
    const forgedPayload: NodeSemanticIdentityInput = {
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      hierarchyRevisionId,
      canonicalLevel: 'subject',
      normalizedLabel: forgedText.toLowerCase(),
      parentProposedNodeId: null,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: sha256Hex(forgedText),
      boundedEvidenceSetHash: computeEvidenceSetHash([forgedSpan]),
      boundEvidenceSpans: [forgedSpan],
      sourceId: fixture.lineage.sourceId,
      sourceVersionId: fixture.lineage.sourceVersionId,
      sourceSha256: fixture.lineage.sourceSha256,
      byteArtifactId: fixture.lineage.byteArtifactId,
      provenanceId: fixture.lineage.provenanceId,
      governanceId: fixture.lineage.governanceId,
      officialDocumentId: fixture.scopeAuthority.officialDocumentId,
      extractionManifestId: fixture.manifest.manifestId,
      extractionManifestHash: fixture.manifest.manifestHash,
      scopeAuthorityId: fixture.scopeAuthority.scopeAuthorityId,
      scopeResolutionSha: fixture.scopeAuthority.resolutionSha,
      readabilityAssessmentIdentity: fixture.manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
    };

    const forgedNode: ProposedHierarchyNode = {
      proposedNodeId: computeProposedNodeId(forgedPayload),
      nodeContractVersion: HIERARCHY_NODE_CONTRACT_VERSION,
      missionId,
      cycleKey,
      authorityKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      canonicalOrder: 0,
      displayLabel: forgedText,
      normalizedLabel: forgedText.toLowerCase(),
      officialWording: true,
      nodeAuthorityType: 'SOURCE_EXPLICIT_NODE',
      academicScopeHash: sha256Hex(forgedText),
      boundedEvidenceSetHash: computeEvidenceSetHash([forgedSpan]),
      sourceEvidenceRefs: [forgedExtId],
      sourcePageRefs: [1],
      sourceSpanRefs: [forgedSpan],
      sourceId: fixture.lineage.sourceId,
      sourceSha256: fixture.lineage.sourceSha256,
      sourceVersionId: fixture.lineage.sourceVersionId,
      byteArtifactId: fixture.lineage.byteArtifactId,
      provenanceId: fixture.lineage.provenanceId,
      governanceId: fixture.lineage.governanceId,
      officialDocumentId: fixture.scopeAuthority.officialDocumentId,
      extractionManifestId: fixture.manifest.manifestId,
      extractionManifestHash: fixture.manifest.manifestHash,
      scopeAuthorityId: fixture.scopeAuthority.scopeAuthorityId,
      scopeResolutionSha: fixture.scopeAuthority.resolutionSha,
      readabilityAssessmentIdentity: fixture.manifest.readabilityAssessment.assessmentHash,
      structuralRuleId: null,
      structuralRuleVersion: null,
      structuralRuleRevision: null,
      interpretationRevisionId: null,
      reviewState: 'PENDING_STRUCTURAL_REVIEW',
      materializationState: 'PROPOSED',
      hierarchyRevisionId,
      revisionIdentityHash: sha256Hex(canonicalJson(forgedPayload)),
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage: fixture.lineage,
        manifest: fixture.manifest,
        scopeAuthority: fixture.scopeAuthority,
        pagesMap: syntheticPagesMap,
        hierarchyRevisionId,
        nodes: [forgedNode],
        requiredEvidenceSet: [forgedExtId],
        unresolvedEvidenceSet: [],
      });
    }).toThrow('R3B1_IDENTITY_CONFLICT');
  });

  it('Adv-36. Valid-but-wrong evidence A vs B rejection for SOURCE_EXPLICIT_NODE', () => {
    const docA = createRealR3B1Fixture('doc_a');
    const docB = createRealR3B1Fixture('doc_b');

    // Build node using docB's valid evidence
    const spanB = createValidSpan(
      docB.p1ExtId,
      1,
      0,
      docB.p1Slice.length,
      docB.p1Slice,
      docB.p1PageHash
    );

    const nodeFromDocB = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [spanB],
      authoritativePageRecords: docB.pageRecords,
      lineage: docB.lineage,
      manifest: docB.manifest,
      scopeAuthority: docB.scopeAuthority,
      hierarchyRevisionId,
    });

    // Attacker attempts to assemble proposal for docA using nodeFromDocB
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: docA.pageRecords,
        hierarchyRevisionId,
        nodes: [nodeFromDocB],
        requiredEvidenceSet: [docA.p1ExtId],
        unresolvedEvidenceSet: [],
      });
    }).toThrow();
  });

  it('Adv-37. Valid-but-wrong evidence A vs B rejection for CANONICAL_STRUCTURAL_NODE', () => {
    const docA = createRealR3B1Fixture('doc_a');
    const docB = createRealR3B1Fixture('doc_b');

    const spanB = createValidSpan(
      docB.p1ExtId,
      1,
      0,
      docB.p1Slice.length,
      docB.p1Slice,
      docB.p1PageHash
    );

    const structuralNodeFromDocB = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'General Intelligence Section',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_b_001',
      descendantSpans: [spanB],
      authoritativePageRecords: docB.pageRecords,
      lineage: docB.lineage,
      manifest: docB.manifest,
      scopeAuthority: docB.scopeAuthority,
      hierarchyRevisionId,
    });

    // Attacker attempts to assemble proposal for docA using structuralNodeFromDocB
    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: docA.pageRecords,
        hierarchyRevisionId,
        nodes: [structuralNodeFromDocB],
        requiredEvidenceSet: [docA.p1ExtId],
        unresolvedEvidenceSet: [],
      });
    }).toThrow();
  });

  it('Adv-38. Same-document wrong page / span bounds mismatch strictly rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');

    // Span claims page 2, but carries page 1's extractionId
    const mismatchedSpan: EvidenceSpanReference = {
      extractionId: docA.p1ExtId,
      physicalPageNumber: 2, // Mismatch: extractionId belongs to page 1
      startOffset: 0,
      endOffset: 10,
      normalizedSpanSha256: sha256Hex('test'),
      pageIdentityHash: docA.p1PageHash,
    };

    expect(() => {
      validateEvidenceSpan(
        mismatchedSpan,
        docA.pageRecords[0],
        docA.lineage,
        docA.manifest,
        docA.scopeAuthority
      );
    }).toThrow('PAGE_NUMBER_MISMATCH');
  });

  it('Adv-39. Interpretation span mismatch strictly rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');

    const span1 = createValidSpan(
      docA.p1ExtId,
      1,
      0,
      docA.p1Slice.length,
      docA.p1Slice,
      docA.p1PageHash
    );

    const structuralNode = buildCanonicalStructuralNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      displayLabel: 'General Intelligence Section',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      interpretationRevisionId: 'interp_001',
      descendantSpans: [span1],
      authoritativePageRecords: docA.pageRecords,
      lineage: docA.lineage,
      manifest: docA.manifest,
      scopeAuthority: docA.scopeAuthority,
      hierarchyRevisionId,
    });

    // Interpretation declares mismatching span hash (from page 2 or different text)
    const mismatchedInterp = {
      interpretationRevisionId: 'interp_001',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      rationale: 'Legitimate structural node',
      targetProposedNodeId: structuralNode.proposedNodeId,
      boundEvidenceSpanHashes: [sha256Hex('Mismatching Span Text')],
      executableInR3B2B: true,
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: docA.pageRecords,
        hierarchyRevisionId,
        nodes: [structuralNode],
        requiredEvidenceSet: [docA.p1ExtId],
        unresolvedEvidenceSet: [],
        structuralInterpretations: [mismatchedInterp],
      });
    }).toThrow('INTERPRETATION_SPAN_HASH_MISMATCH');
  });

  it('Adv-40. Page count mismatch in deriveAuthoritativePagesMap strictly rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');
    // Pass only 1 page record when manifest.totalPhysicalPages is 2
    expect(() => {
      deriveAuthoritativePagesMap({
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: [docA.pageRecords[0]],
      });
    }).toThrow('PAGE_COUNT_MISMATCH');
  });

  it('Adv-41. Duplicate physical page number in deriveAuthoritativePagesMap strictly rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');
    const duplicatePage = { ...docA.pageRecords[1], physicalPageNumber: 1 };
    expect(() => {
      deriveAuthoritativePagesMap({
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: [docA.pageRecords[0], duplicatePage],
      });
    }).toThrow('DUPLICATE_PAGE_NUMBER_REJECTED');
  });

  it('Adv-42. Non-contiguous page numbers in deriveAuthoritativePagesMap strictly rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');
    // Manifest expects 2 pages. Page numbers provided are 1 and 3 (missing page 2).
    const outOfBoundsPage = { ...docA.pageRecords[1], physicalPageNumber: 3 };
    expect(() => {
      deriveAuthoritativePagesMap({
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: [docA.pageRecords[0], outOfBoundsPage],
      });
    }).toThrow('INVALID_PHYSICAL_PAGE_NUMBER');
  });

  it('Adv-43. Storage generation mismatch strictly rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');
    const alteredPage = { ...docA.pageRecords[0], storageGeneration: '9999999999999999' };
    expect(() => {
      deriveAuthoritativePagesMap({
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: [alteredPage, docA.pageRecords[1]],
      });
    }).toThrow('STORAGE_GENERATION_MISMATCH');
  });

  it('Adv-44. Caller map disagreement with derived authoritative pages rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');
    const alteredCallerPage = { ...docA.pageRecords[0], textSha256: '0000000000000000000000000000000000000000000000000000000000000000' };
    const conflictingCallerMap: Record<string, AuthoritativePageEvidence> = Object.freeze({
      [docA.p1ExtId]: Object.freeze(alteredCallerPage),
      [docA.p2ExtId]: Object.freeze(docA.pageRecords[1]),
    });

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: docA.pageRecords,
        pagesMap: conflictingCallerMap,
        hierarchyRevisionId,
        nodes: [],
        requiredEvidenceSet: [docA.p1ExtId],
        unresolvedEvidenceSet: [docA.p1ExtId],
      });
    }).toThrow('CALLER_PAGES_MAP_DISAGREEMENT');
  });

  it('Adv-45. Orphaned structural interpretation targeting non-existent node rejected', () => {
    const docA = createRealR3B1Fixture('doc_a');
    const span1 = createValidSpan(
      docA.p1ExtId,
      1,
      0,
      docA.p1Slice.length,
      docA.p1Slice,
      docA.p1PageHash
    );

    const validNode = buildSourceExplicitNode({
      missionId,
      cycleKey,
      subjectId: 'gen_intel',
      canonicalLevel: 'subject',
      parentProposedNodeId: null,
      parentCanonicalLevel: null,
      canonicalOrder: 0,
      spans: [span1],
      authoritativePageRecords: docA.pageRecords,
      lineage: docA.lineage,
      manifest: docA.manifest,
      scopeAuthority: docA.scopeAuthority,
      hierarchyRevisionId,
    });

    const orphanedInterp = {
      interpretationRevisionId: 'interp_orphan_001',
      structuralRuleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
      structuralRuleVersion: '1.0.0',
      structuralRuleRevision: '1',
      rationale: 'Orphaned interpretation',
      targetProposedNodeId: 'non_existent_node_id_123',
      boundEvidenceSpanHashes: [span1.normalizedSpanSha256],
      executableInR3B2B: true,
    };

    expect(() => {
      buildHierarchyProposal({
        missionId,
        cycleKey,
        subjectId: 'gen_intel',
        lineage: docA.lineage,
        manifest: docA.manifest,
        scopeAuthority: docA.scopeAuthority,
        authoritativePageRecords: docA.pageRecords,
        hierarchyRevisionId,
        nodes: [validNode],
        requiredEvidenceSet: [docA.p1ExtId],
        unresolvedEvidenceSet: [],
        structuralInterpretations: [orphanedInterp],
      });
    }).toThrow('ORPHANED_INTERPRETATION_REJECTED');
  });
});
