import { createHash } from 'crypto';

/**
 * ­ƒö▒ R3B2B HIERARCHY PROPOSAL & EVIDENCE CONTRACT
 * =============================================================================
 * Pure immutable data contract and cryptographic identity definitions
 * for Domain-A syllabus hierarchy proposals.
 *
 * Laws (Master Spec ┬º2, ┬º4, ┬º5, ┬º6, ┬º7, ┬º8, ┬º9, ┬º10, ┬º13, ┬º14):
 *   1. CANONICAL_LEVEL_COUNT = 5: Subject -> Unit -> Topic -> Micro Topic -> Atomic Level Topic.
 *   2. No sixth level. No collapsed level. No renamed level.
 *   3. SOURCE_EXPLICIT_NODE: officialWording=true, academicScopeHash=64-hex SHA-256.
 *   4. CANONICAL_STRUCTURAL_NODE: officialWording=false, academicScopeHash=null,
 *      boundedEvidenceSetHash required, zero independent assessable academic scope.
 *   5. Full 64-hex SHA-256 identities. Zero truncated 24-char digests.
 *   6. Review state vocabulary: PENDING_STRUCTURAL_REVIEW | HOLD_AMBIGUOUS_SCOPE.
 *   7. Materialization state: PROPOSED only.
 */

export const HIERARCHY_PROPOSAL_CONTRACT_VERSION = 'R3B2B-PROPOSAL-V1' as const;
export const HIERARCHY_NODE_CONTRACT_VERSION = 'R3B2B-NODE-V1' as const;
export const CANONICAL_LEVEL_COUNT = 5 as const;

export const CANONICAL_HIERARCHY_LEVELS = [
  'subject',
  'unit',
  'topic',
  'micro_topic',
  'atomic_level_topic',
] as const;

export type CanonicalHierarchyLevel = typeof CANONICAL_HIERARCHY_LEVELS[number];

export const NODE_AUTHORITY_TYPES = [
  'SOURCE_EXPLICIT_NODE',
  'CANONICAL_STRUCTURAL_NODE',
] as const;

export type NodeAuthorityType = typeof NODE_AUTHORITY_TYPES[number];

export const PROPOSAL_REVIEW_STATES = [
  'PENDING_STRUCTURAL_REVIEW',
  'HOLD_AMBIGUOUS_SCOPE',
] as const;

export type ProposalReviewState = typeof PROPOSAL_REVIEW_STATES[number];

export type ProposalMaterializationState = 'PROPOSED';

/**
 * ­ƒøí´©Å FROZEN R3B1 SOURCE-CLASS ENUMERATIONS
 * Consumed strictly from R3B1 frozen authority contracts.
 */
export const ELIGIBLE_SOURCE_CLASSES = [
  'OFFICIAL_SYLLABUS',
  'OFFICIAL_NOTIFICATION',
  'OFFICIAL_GAZETTE',
  'EXAM_NOTIFICATION',
  'SYLLABUS',
] as const;

export type EligibleSourceClass = typeof ELIGIBLE_SOURCE_CLASSES[number];

export const FORBIDDEN_SOURCE_CLASSES = [
  'PYQ',
  'QUESTION_PAPER',
  'ANSWER_KEY',
  'MOCK_TEST',
  'PRACTICE_SET',
  'COACHING_CONTENT',
  'USER_UPLOAD',
  'UNCLASSIFIED',
] as const;

export type ForbiddenSourceClass = typeof FORBIDDEN_SOURCE_CLASSES[number];

/**
 * ­ƒøí´©Å STRUCTURAL RULE VOCABULARY
 * 5 Declared rules: all 5 are vocabulary-only without persisted R3B1 continuation authority.
 * EXECUTABLE_DETERMINISTIC_RULE_COUNT = 0
 * VOCABULARY_ONLY_RULE_COUNT = 5
 * UNSAFE_SEMANTIC_RULE_COUNT = 0
 */
export const STRUCTURAL_RULE_DEFINITIONS = {
  RULE_EXPLICIT_PAGE_CONTINUATION_V1: {
    ruleId: 'RULE_EXPLICIT_PAGE_CONTINUATION_V1',
    ruleVersion: '1.0.0',
    ruleRevision: '1',
    description: 'Contiguous physical page continuation proven by cross-page clause (vocabulary-only without persisted R3B1 proof).',
    executableInR3B2B: false,
  },
  RULE_EXPLICIT_NUMBERED_LIST_V1: {
    ruleId: 'RULE_EXPLICIT_NUMBERED_LIST_V1',
    ruleVersion: '1.0.0',
    ruleRevision: '1',
    description: 'Deterministic numbered or lettered list markers in normalized text.',
    executableInR3B2B: false,
  },
  RULE_CONTENT_NEUTRAL_WRAPPER_V1: {
    ruleId: 'RULE_CONTENT_NEUTRAL_WRAPPER_V1',
    ruleVersion: '1.0.0',
    ruleRevision: '1',
    description: 'Content-neutral structural wrapper (vocabulary-only -> HOLD).',
    executableInR3B2B: false,
  },
  RULE_HEADING_SUBHEADING_V1: {
    ruleId: 'RULE_HEADING_SUBHEADING_V1',
    ruleVersion: '1.0.0',
    ruleRevision: '1',
    description: 'Typography/heading hierarchy (vocabulary-only -> HOLD).',
    executableInR3B2B: false,
  },
  RULE_SEMICOLON_SEPARABLE_LIST_V1: {
    ruleId: 'RULE_SEMICOLON_SEPARABLE_LIST_V1',
    ruleVersion: '1.0.0',
    ruleRevision: '1',
    description: 'Semantic semicolon list separation (vocabulary-only -> HOLD).',
    executableInR3B2B: false,
  },
} as const;

export type StructuralRuleId = keyof typeof STRUCTURAL_RULE_DEFINITIONS;

/**
 * ­ƒøí´©Å EVIDENCE SPAN REFERENCE
 */
export interface EvidenceSpanReference {
  readonly extractionId: string;
  readonly physicalPageNumber: number;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly normalizedSpanSha256: string;
  readonly pageIdentityHash: string;
}

/**
 * ­ƒøí´©Å AUTHORITATIVE PAGE EVIDENCE
 */
export interface AuthoritativePageEvidence {
  readonly extractionId: string;
  readonly pageIdentityHash: string;
  readonly physicalPageNumber: number;
  readonly normalizedText: string;
  readonly textSha256: string;
  readonly sourceSha256: string;
  readonly sourceVersionId: string;
  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly sourceId: string;
  readonly byteArtifactId: string;
  readonly provenanceId: string;
  readonly governanceId: string;
  readonly manifestId: string;
  readonly rawCharCount?: number;
  readonly normalizedCharCount?: number;
  readonly storageGeneration?: string;
  readonly parserVersion?: string;
  readonly readability?: string;
  readonly extractedAt?: string;
}

/**
 * ­ƒøí´©Å MULTI-PAGE EVIDENCE BUNDLE
 */
export interface MultiPageEvidenceBundle {
  readonly spans: EvidenceSpanReference[];
  readonly evidenceSetHash: string;
  readonly hasCrossPageContinuation: boolean;
  readonly continuationAuthorityRuleId: string | null;
}

/**
 * ­ƒøí´©Å PROPOSAL NODE MANIFEST ENTRY
 */
export interface ProposalNodeManifestEntry {
  readonly proposedNodeId: string;
  readonly canonicalLevel: CanonicalHierarchyLevel;
  readonly canonicalOrder: number;
  readonly nodeAuthorityType: NodeAuthorityType;
  readonly nodeIntegrityHash: string;
}

/**
 * ­ƒøí´©Å STRUCTURAL INTERPRETATION MANIFEST ENTRY
 */
export interface StructuralInterpretationManifestEntry {
  readonly interpretationRevisionId: string;
  readonly structuralRuleId: string;
  readonly structuralRuleVersion: string;
  readonly structuralRuleRevision: string;
  readonly rationale: string;
  readonly targetProposedNodeId: string;
  readonly boundEvidenceSpanHashes: string[];
  readonly executableInR3B2B: boolean;
}

/**
 * ­ƒøí´©Å PROPOSED HIERARCHY NODE
 */
export interface ProposedHierarchyNode {
  readonly proposedNodeId: string;
  readonly nodeContractVersion: typeof HIERARCHY_NODE_CONTRACT_VERSION;

  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly subjectId: string;

  readonly canonicalLevel: CanonicalHierarchyLevel;
  readonly parentProposedNodeId: string | null;
  readonly canonicalOrder: number;

  readonly displayLabel: string;
  readonly normalizedLabel: string;

  readonly officialWording: boolean;
  readonly nodeAuthorityType: NodeAuthorityType;

  /**
   * Independent assessable academic scope hash.
   * - SOURCE_EXPLICIT_NODE: exact lowercase 64-hex SHA-256 of verified evidence text.
   * - CANONICAL_STRUCTURAL_NODE: strictly null (zero independent scope).
   */
  readonly academicScopeHash: string | null;

  /**
   * Cryptographic digest binding all organizing / descendant evidence.
   * Required for both SOURCE_EXPLICIT_NODE and CANONICAL_STRUCTURAL_NODE.
   * A structural node without bounded evidence fails closed.
   */
  readonly boundedEvidenceSetHash: string;

  readonly sourceEvidenceRefs: string[];
  readonly sourcePageRefs: number[];
  readonly sourceSpanRefs: EvidenceSpanReference[];

  readonly sourceId: string;
  readonly sourceSha256: string;
  readonly sourceVersionId: string;
  readonly byteArtifactId: string;
  readonly provenanceId: string;
  readonly governanceId: string;
  readonly officialDocumentId: string;
  readonly extractionManifestId: string;
  readonly extractionManifestHash: string;
  readonly scopeAuthorityId: string;
  readonly scopeResolutionSha: string;

  readonly readabilityAssessmentIdentity: string;

  readonly structuralRuleId: string | null;
  readonly structuralRuleVersion: string | null;
  readonly structuralRuleRevision: string | null;
  readonly interpretationRevisionId: string | null;

  readonly reviewState: ProposalReviewState;
  readonly materializationState: ProposalMaterializationState;

  readonly hierarchyRevisionId: string;
  readonly revisionIdentityHash: string;
}

/**
 * ­ƒøí´©Å HIERARCHY PROPOSAL
 */
export interface HierarchyProposal {
  readonly proposalId: string;
  readonly proposalContractVersion: typeof HIERARCHY_PROPOSAL_CONTRACT_VERSION;

  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly subjectId: string;

  readonly officialDocumentId: string;
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceSha256: string;

  readonly extractionManifestId: string;
  readonly extractionManifestHash: string;

  readonly scopeAuthorityId: string;
  readonly scopeResolutionSha: string;

  readonly readabilityAssessmentIdentity: string;
  readonly hierarchyRevisionId: string;

  readonly proposalNodeManifest: ProposalNodeManifestEntry[];
  readonly proposalNodeCount: number;

  readonly requiredEvidenceSet: string[];
  readonly resolvedEvidenceSet: string[];
  readonly unresolvedEvidenceSet: string[];

  readonly structuralInterpretationManifest: StructuralInterpretationManifestEntry[];

  readonly proposalContentHash: string;
  readonly createdAt: string;
  readonly reviewState: ProposalReviewState;
  readonly materializationState: ProposalMaterializationState;
}

/**
 * ­ƒøí´©Å CANONICAL STABLE JSON & SHA-256 HELPERS
 */
function stableValue(val: unknown): unknown {
  if (val === null || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(stableValue);
  }
  if (val instanceof Map) {
    const entries = Array.from(val.entries()).sort(([a], [b]) => String(a).localeCompare(String(b)));
    const obj: Record<string, unknown> = {};
    for (const [k, v] of entries) {
      obj[String(k)] = stableValue(v);
    }
    return obj;
  }
  if (val instanceof Set) {
    return Array.from(val).map(stableValue).sort();
  }
  const record = val as Record<string, unknown>;
  const sortedKeys = Object.keys(record).sort();
  const result: Record<string, unknown> = {};
  for (const k of sortedKeys) {
    if (record[k] !== undefined) {
      result[k] = stableValue(record[k]);
    }
  }
  return result;
}

export function canonicalJson(val: unknown): string {
  return JSON.stringify(stableValue(val));
}

export function sha256Hex(val: unknown): string {
  const content = typeof val === 'string' ? val : canonicalJson(val);
  return createHash('sha256').update(content).digest('hex').toLowerCase();
}

export function computeEvidenceSpanHash(normalizedTextSlice: string): string {
  return createHash('sha256').update(normalizedTextSlice).digest('hex').toLowerCase();
}

export function computeEvidenceSetHash(spans: EvidenceSpanReference[]): string {
  const sorted = [...spans].sort((left, right) => {
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
  return sha256Hex(sorted.map(s => `${s.extractionId}:${s.physicalPageNumber}:${s.startOffset}:${s.endOffset}:${s.normalizedSpanSha256}:${s.pageIdentityHash}`));
}

/**
 * ­ƒøí´©Å COMPLETE NODE IDENTITY INPUT
 * Cryptographically binds all authoritative node, span, and governance dimensions.
 * Includes byteArtifactId, provenanceId, governanceId, and readabilityAssessmentIdentity.
 */
export interface NodeSemanticIdentityInput {
  readonly nodeContractVersion: string;
  readonly missionId: string;
  readonly cycleKey: string;
  readonly authorityKey: string;
  readonly hierarchyRevisionId: string;
  readonly canonicalLevel: CanonicalHierarchyLevel;
  readonly normalizedLabel: string;
  readonly parentProposedNodeId: string | null;
  readonly nodeAuthorityType: NodeAuthorityType;
  readonly academicScopeHash: string | null;
  readonly boundedEvidenceSetHash: string;
  readonly boundEvidenceSpans: Array<{
    readonly extractionId: string;
    readonly physicalPageNumber: number;
    readonly startOffset: number;
    readonly endOffset: number;
    readonly normalizedSpanSha256: string;
    readonly pageIdentityHash: string;
  }>;
  readonly sourceId: string;
  readonly sourceVersionId: string;
  readonly sourceSha256: string;
  readonly byteArtifactId: string;
  readonly provenanceId: string;
  readonly governanceId: string;
  readonly officialDocumentId: string;
  readonly extractionManifestId: string;
  readonly extractionManifestHash: string;
  readonly scopeAuthorityId: string;
  readonly scopeResolutionSha: string;
  readonly readabilityAssessmentIdentity: string;
  readonly structuralRuleId: string | null;
  readonly structuralRuleVersion: string | null;
  readonly structuralRuleRevision: string | null;
  readonly interpretationRevisionId: string | null;
}

export function computeProposedNodeId(nodeData: NodeSemanticIdentityInput): string {
  const hash = sha256Hex(nodeData);
  return `prop_node_${hash}`;
}

export function computeProposalContentHash(proposalData: {
  proposalContractVersion: string;
  missionId: string;
  cycleKey: string;
  authorityKey: string;
  subjectId: string;
  officialDocumentId: string;
  sourceId: string;
  sourceVersionId: string;
  sourceSha256: string;
  extractionManifestId: string;
  extractionManifestHash: string;
  scopeAuthorityId: string;
  scopeResolutionSha: string;
  hierarchyRevisionId: string;
  proposalNodeManifest: ProposalNodeManifestEntry[];
  requiredEvidenceSet: string[];
  resolvedEvidenceSet: string[];
  unresolvedEvidenceSet: string[];
  structuralInterpretationManifest: StructuralInterpretationManifestEntry[];
}): string {
  return sha256Hex(proposalData);
}

/**
 * ­ƒøí´©Å LEVEL SEQUENCE VALIDATION
 * Validates strictly parent-child transitions across exactly five canonical levels:
 * null -> subject -> unit -> topic -> micro_topic -> atomic_level_topic.
 * Rejects skipped/collapsed levels and any sixth level.
 */
export function validateCanonicalLevelSequence(
  parentLevel: CanonicalHierarchyLevel | null,
  childLevel: CanonicalHierarchyLevel,
): boolean {
  const expectedChild: Record<string, CanonicalHierarchyLevel> = {
    root: 'subject',
    subject: 'unit',
    unit: 'topic',
    topic: 'micro_topic',
    micro_topic: 'atomic_level_topic',
  };

  const key = parentLevel === null ? 'root' : parentLevel;
  return expectedChild[key] === childLevel;
}

/**
 * ­ƒøí´©Å COMPUTE PAGE EXTRACTION IDENTITY (R3B1 Specification)
 * Deterministic cryptographic page identity hash binding sourceId, sourceVersionId,
 * sourceSha256, physicalPageNumber, textSha256, and byteArtifactId.
 */
export function computePageExtractionIdentity(params: {
  sourceId: string;
  sourceVersionId: string;
  sourceSha256: string;
  physicalPageNumber: number;
  textSha256: string;
  byteArtifactId: string;
}): string {
  const identityString = `${params.sourceId}:${params.sourceVersionId}:${params.sourceSha256}:${params.physicalPageNumber}:${params.textSha256}:${params.byteArtifactId}`;
  return sha256Hex(identityString);
}

/**
 * ­ƒøí´©Å COMPUTE EXTRACTION ID (R3B1 Specification)
 */
export function computeExtractionId(pageIdentityHash: string): string {
  return `ext_page_${pageIdentityHash}`;
}

/**
 * ­ƒøí´©Å NORMALIZE TEXT (R3B1 Specification)
 * Normalizes extracted text cleanly without altering lexical tokens.
 */
export function normalizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * ­ƒøí´©Å COMPUTE MANIFEST IMMUTABLE IDENTITY (R3B1 Specification)
 * Computes deterministic immutable manifest identity hash.
 */
export function computeManifestImmutableIdentity(manifestData: {
  contractVersion?: string;
  manifestContractVersion?: string;
  missionId: string;
  cycleKey: string;
  authorityKey: string;
  sourceId: string;
  sourceVersionId: string;
  sourceSha256: string;
  byteArtifactId: string;
  provenanceId: string;
  governanceId: string;
  storageGeneration?: string;
  parserVersion?: string;
  classificationPolicyVersion?: string;
  assessmentHash?: string;
  readabilityAssessment?: { assessmentHash?: string; readability?: string };
  readability?: string;
  totalPhysicalPages: number;
  extractionIds: readonly string[];
  pageIdentityHashes: readonly string[];
  pagesSummary?: readonly { pageIdentityHash: string }[];
}): string {
  if (!Array.isArray(manifestData.extractionIds) || manifestData.extractionIds.length === 0) {
    throw new Error('MANIFEST_IDENTITY_INVALID: persisted extractionIds are required.');
  }
  if (!Array.isArray(manifestData.pageIdentityHashes) || manifestData.pageIdentityHashes.length === 0) {
    throw new Error('MANIFEST_IDENTITY_INVALID: persisted pageIdentityHashes are required.');
  }
  const extractionIds = [...manifestData.extractionIds].sort();
  const pageIdentityHashes = [...manifestData.pageIdentityHashes];

  const dataToHash = {
    contractVersion: manifestData.contractVersion || manifestData.manifestContractVersion || 'r3b1_v2',
    missionId: manifestData.missionId,
    cycleKey: manifestData.cycleKey,
    authorityKey: manifestData.authorityKey,
    sourceId: manifestData.sourceId,
    sourceVersionId: manifestData.sourceVersionId,
    sourceSha256: manifestData.sourceSha256,
    byteArtifactId: manifestData.byteArtifactId,
    provenanceId: manifestData.provenanceId,
    governanceId: manifestData.governanceId,
    storageGeneration: String(manifestData.storageGeneration || ''),
    parserVersion: manifestData.parserVersion || 'pdf-parse-v2',
    classificationPolicyVersion: manifestData.classificationPolicyVersion || 'r3b1_v2',
    assessmentHash: manifestData.assessmentHash || (manifestData.readabilityAssessment && manifestData.readabilityAssessment.assessmentHash) || '',
    readability: manifestData.readability || (manifestData.readabilityAssessment && manifestData.readabilityAssessment.readability),
    totalPhysicalPages: manifestData.totalPhysicalPages,
    extractionIds,
    pageIdentityHashes,
  };
  return sha256Hex(JSON.stringify(dataToHash));
}
