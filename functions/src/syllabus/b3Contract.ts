export const B3_CONTRACT_VERSION = 'B3-CANONICAL-V1' as const;

export const B3_ACADEMIC_LEVELS = [
  'subject',
  'unit',
  'topic',
  'micro_topic',
  'atomic_level_topic',
] as const;

export type B3AcademicLevel = typeof B3_ACADEMIC_LEVELS[number];

export interface B3SourceSpan {
  start: number;
  end: number;
}

export interface B3SourceLocation {
  pageNumber: number;
  sectionId?: string;
  span: B3SourceSpan;
}

export interface B3Lineage {
  missionId: string;
  sourceId: string;
  documentId: string;
  sourceVersionId: string;
  sourceSha256: string;
  extractionId: string;
  paperId: string | null;
  location: B3SourceLocation;
}

export interface B3AuthorityProof {
  official: boolean;
  applicable: boolean;
  effective: boolean;
  verified: boolean;
  evidenceId: string;
}

export interface B3IdentityAuthority {
  verified: boolean;
  canonicalIdentityKey: string;
  evidenceId: string;
  method: 'AUTHORITATIVE_CANONICAL_IDENTITY';
}

export interface B3ParentageAuthority {
  verified: boolean;
  parentCanonicalIdentityKey: string;
  parentOccurrenceExtractionId: string;
  evidenceId: string;
  method: 'EXPLICIT_SOURCE_STRUCTURE';
  continuationAuthority?: B3BoundaryContinuationAuthority;
}

export interface B3OrderingAuthority {
  verified: boolean;
  order: number;
  evidenceId: string;
  method: 'AUTHORITATIVE_SOURCE_ORDER';
}

export type B3BoundaryType = 'PAGE' | 'SECTION' | 'DOCUMENT' | 'SOURCE_ARTIFACT';

export interface B3BoundaryContinuationAuthority {
  verified: boolean;
  boundaries: B3BoundaryType[];
  parentOccurrenceExtractionId: string;
  evidenceId: string;
  method: 'EXPLICIT_STRUCTURAL_CONTINUATION';
  applicableEffectiveSourceRelationshipEvidenceId?: string;
}

export interface B3AggregationAuthority {
  verified: boolean;
  canonicalIdentityKey: string;
  evidenceId: string;
  method: 'SAME_CANONICAL_NODE';
  boundary?: B3BoundaryType;
}

export interface B3SourceEvidence {
  evidenceId: string;
  level: B3AcademicLevel;
  title: string;
  content?: string;
  required: boolean;
  authority: B3AuthorityProof;
  identityAuthority: B3IdentityAuthority;
  parentageAuthority?: B3ParentageAuthority;
  orderingAuthority: B3OrderingAuthority;
  aggregationAuthority?: B3AggregationAuthority;
  lineage: B3Lineage;
}

export interface B3DeclaredCompletenessScope {
  requiredEvidenceIds: string[];
  requireExactFiveLevelCoverage: boolean;
}

export function canonicalizeB3DeclaredCompletenessScope(
  value: unknown,
): B3DeclaredCompletenessScope {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('B3_DECLARED_SCOPE_OBJECT_REQUIRED');
  }
  const candidate = value as Record<string, unknown>;
  if (!Array.isArray(candidate.requiredEvidenceIds)
      || candidate.requiredEvidenceIds.length === 0) {
    throw new Error('B3_DECLARED_SCOPE_REQUIRED_EVIDENCE_IDS_REQUIRED');
  }
  if (typeof candidate.requireExactFiveLevelCoverage !== 'boolean') {
    throw new Error('B3_DECLARED_SCOPE_FIVE_LEVEL_FLAG_BOOLEAN_REQUIRED');
  }
  const requiredEvidenceIds = candidate.requiredEvidenceIds.map((id, index) => {
    if (typeof id !== 'string' || id.length === 0 || id.trim().length === 0) {
      throw new Error(`B3_DECLARED_SCOPE_INVALID_EVIDENCE_ID:${index}`);
    }
    if (id !== id.trim()) {
      throw new Error(`B3_DECLARED_SCOPE_EVIDENCE_ID_WHITESPACE:${index}`);
    }
    return id;
  });
  if (new Set(requiredEvidenceIds).size !== requiredEvidenceIds.length) {
    throw new Error('B3_DECLARED_SCOPE_DUPLICATE_EVIDENCE_ID');
  }
  return {
    requiredEvidenceIds: [...requiredEvidenceIds].sort((left, right) => left.localeCompare(right)),
    requireExactFiveLevelCoverage: candidate.requireExactFiveLevelCoverage,
  };
}

export interface B3MaterializationInput {
  contractVersion: typeof B3_CONTRACT_VERSION;
  evidence: B3SourceEvidence[];
  declaredCompletenessScope: B3DeclaredCompletenessScope;
}

export interface B3MaterializedNode {
  nodeId: string;
  canonicalIdentityKey: string;
  level: B3AcademicLevel;
  title: string;
  content?: string;
  parentId: string | null;
  parentCanonicalIdentityKey: string | null;
  order: number;
  authorityEvidenceIds: string[];
  structuralAuthorityEvidenceIds: string[];
  orderingAuthorityEvidenceIds: string[];
  supportingOccurrences: B3Lineage[];
}

export type B3UnresolvedReason =
  | 'UNVERIFIED_AUTHORITY'
  | 'INVALID_ACADEMIC_LEVEL'
  | 'MISSING_IDENTITY_AUTHORITY'
  | 'MISSING_PARENTAGE_AUTHORITY'
  | 'MISSING_BOUNDARY_CONTINUATION_AUTHORITY'
  | 'PARENT_NOT_MATERIALIZED'
  | 'INVALID_HIERARCHY_RELATIONSHIP'
  | 'MISSING_LINEAGE'
  | 'INVALID_ORDERING_AUTHORITY'
  | 'UNPROVEN_AGGREGATION'
  | 'SCOPE_COLLISION';

export interface B3UnresolvedSourceEvidence {
  evidence: B3SourceEvidence;
  reasons: B3UnresolvedReason[];
}

export interface B3CompletionEligibility {
  eligible: boolean;
  reasons: string[];
  resolvedRequiredEvidenceIds: string[];
  unresolvedRequiredEvidenceIds: string[];
}

export interface B3MaterializationResult {
  declaredCompletenessScope: B3DeclaredCompletenessScope;
  canonicalMaterializedNodes: B3MaterializedNode[];
  unresolvedSourceEvidence: B3UnresolvedSourceEvidence[];
  completionEligibility: B3CompletionEligibility;
}
