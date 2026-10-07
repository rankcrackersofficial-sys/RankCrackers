import { createHash } from 'crypto';
import {
  B3_ACADEMIC_LEVELS,
  B3_CONTRACT_VERSION,
  B3AcademicLevel,
  B3BoundaryType,
  B3Lineage,
  B3MaterializationInput,
  B3MaterializationResult,
  B3MaterializedNode,
  B3SourceEvidence,
  B3UnresolvedReason,
  B3UnresolvedSourceEvidence,
  canonicalizeB3DeclaredCompletenessScope,
} from './b3Contract';

const LEVEL_INDEX = new Map<string, number>(
  B3_ACADEMIC_LEVELS.map((level, index) => [level, index]),
);

function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasCompleteLineage(lineage: B3Lineage | undefined): lineage is B3Lineage {
  if (!lineage) return false;
  const location = lineage.location;
  return isNonEmpty(lineage.missionId)
    && isNonEmpty(lineage.sourceId)
    && isNonEmpty(lineage.documentId)
    && isNonEmpty(lineage.sourceVersionId)
    && isNonEmpty(lineage.sourceSha256)
    && isNonEmpty(lineage.extractionId)
    && !!location
    && Number.isInteger(location.pageNumber)
    && location.pageNumber > 0
    && Number.isInteger(location.span?.start)
    && Number.isInteger(location.span?.end)
    && location.span.start >= 0
    && location.span.end >= location.span.start;
}

function scopeKey(evidence: B3SourceEvidence): string {
  const lineage = evidence.lineage;
  return [
    lineage.missionId,
    lineage.sourceId,
    lineage.documentId,
    lineage.sourceVersionId,
    lineage.sourceSha256,
    lineage.paperId ?? '',
  ].join('|');
}

function nodeKey(evidence: B3SourceEvidence): string {
  return [
    scopeKey(evidence),
    evidence.identityAuthority.canonicalIdentityKey,
    evidence.parentageAuthority?.parentCanonicalIdentityKey ?? '',
    evidence.level,
  ].join('|');
}

function deterministicNodeId(key: string): string {
  return `b3_${createHash('sha256').update(key).digest('hex').slice(0, 24)}`;
}

function compareEvidence(left: B3SourceEvidence, right: B3SourceEvidence): number {
  const leftLevel = LEVEL_INDEX.get(left.level) ?? Number.MAX_SAFE_INTEGER;
  const rightLevel = LEVEL_INDEX.get(right.level) ?? Number.MAX_SAFE_INTEGER;
  if (leftLevel !== rightLevel) return leftLevel - rightLevel;
  if (left.orderingAuthority.order !== right.orderingAuthority.order) {
    return left.orderingAuthority.order - right.orderingAuthority.order;
  }
  const aggregationDifference = Number(!!left.aggregationAuthority) - Number(!!right.aggregationAuthority);
  if (aggregationDifference !== 0) return aggregationDifference;
  return left.evidenceId.localeCompare(right.evidenceId);
}

function validateBaseEvidence(evidence: B3SourceEvidence): B3UnresolvedReason[] {
  const reasons: B3UnresolvedReason[] = [];
  if (!LEVEL_INDEX.has(evidence.level)) reasons.push('INVALID_ACADEMIC_LEVEL');
  if (!evidence.authority?.verified
      || !evidence.authority.official
      || !evidence.authority.applicable
      || !evidence.authority.effective
      || !isNonEmpty(evidence.authority.evidenceId)) {
    reasons.push('UNVERIFIED_AUTHORITY');
  }
  if (!evidence.identityAuthority?.verified
      || evidence.identityAuthority.method !== 'AUTHORITATIVE_CANONICAL_IDENTITY'
      || !isNonEmpty(evidence.identityAuthority.canonicalIdentityKey)
      || !isNonEmpty(evidence.identityAuthority.evidenceId)) {
    reasons.push('MISSING_IDENTITY_AUTHORITY');
  }
  if (!evidence.orderingAuthority?.verified
      || evidence.orderingAuthority.method !== 'AUTHORITATIVE_SOURCE_ORDER'
      || !Number.isFinite(evidence.orderingAuthority.order)
      || !isNonEmpty(evidence.orderingAuthority.evidenceId)) {
    reasons.push('INVALID_ORDERING_AUTHORITY');
  }
  if (!hasCompleteLineage(evidence.lineage)) reasons.push('MISSING_LINEAGE');
  return reasons;
}

function parentLevelFor(level: B3AcademicLevel): B3AcademicLevel | null {
  const index = LEVEL_INDEX.get(level);
  return index === undefined || index === 0 ? null : B3_ACADEMIC_LEVELS[index - 1];
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function lineageKey(lineage: B3Lineage): string {
  return JSON.stringify([
    lineage.missionId,
    lineage.sourceId,
    lineage.documentId,
    lineage.sourceVersionId,
    lineage.sourceSha256,
    lineage.extractionId,
    lineage.paperId,
    lineage.location.pageNumber,
    lineage.location.sectionId ?? '',
    lineage.location.span.start,
    lineage.location.span.end,
  ]);
}

function uniqueSortedLineage(values: B3Lineage[]): B3Lineage[] {
  const byKey = new Map<string, B3Lineage>();
  for (const value of values) byKey.set(lineageKey(value), value);
  return Array.from(byKey.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, lineage]) => lineage);
}

function authorityIdentityKey(evidence: B3SourceEvidence, identity: string): string {
  return [evidence.lineage.missionId, evidence.lineage.paperId ?? '', identity].join('|');
}

function relationshipBoundaries(parent: B3Lineage, child: B3Lineage): B3BoundaryType[] {
  const boundaries: B3BoundaryType[] = [];
  if (parent.sourceId !== child.sourceId
      || parent.sourceVersionId !== child.sourceVersionId
      || parent.sourceSha256 !== child.sourceSha256) {
    boundaries.push('SOURCE_ARTIFACT');
  }
  if (parent.documentId !== child.documentId) boundaries.push('DOCUMENT');
  if ((parent.location.sectionId ?? '') !== (child.location.sectionId ?? '')) boundaries.push('SECTION');
  if (parent.location.pageNumber !== child.location.pageNumber) boundaries.push('PAGE');
  return boundaries;
}

function continuationCovers(
  evidence: B3SourceEvidence,
  parentOccurrence: B3Lineage,
  boundaries: B3BoundaryType[],
): boolean {
  if (boundaries.length === 0) return true;
  const continuation = evidence.parentageAuthority?.continuationAuthority;
  if (!continuation?.verified
      || continuation.method !== 'EXPLICIT_STRUCTURAL_CONTINUATION'
      || !isNonEmpty(continuation.evidenceId)
      || continuation.parentOccurrenceExtractionId !== parentOccurrence.extractionId
      || !boundaries.every(boundary => continuation.boundaries.includes(boundary))) {
    return false;
  }
  const crossesDocumentOrSource = boundaries.includes('DOCUMENT') || boundaries.includes('SOURCE_ARTIFACT');
  return !crossesDocumentOrSource
    || isNonEmpty(continuation.applicableEffectiveSourceRelationshipEvidenceId);
}

export class B3StructuralMaterializer {
  materialize(input: B3MaterializationInput): B3MaterializationResult {
    if (input.contractVersion !== B3_CONTRACT_VERSION) {
      throw new Error(`B3_CONTRACT_VERSION_UNSUPPORTED: ${input.contractVersion}`);
    }
    const canonicalScope = canonicalizeB3DeclaredCompletenessScope(
      input.declaredCompletenessScope,
    );

    const unresolved: B3UnresolvedSourceEvidence[] = [];
    const nodesByKey = new Map<string, B3MaterializedNode>();
    const nodeByScopedIdentity = new Map<string, B3MaterializedNode>();
    const nodesByAuthorityIdentity = new Map<string, B3MaterializedNode[]>();
    const materializedEvidenceIds = new Set<string>();
    const sortedEvidence = [...input.evidence].sort(compareEvidence);

    for (const evidence of sortedEvidence) {
      const reasons = validateBaseEvidence(evidence);
      const level = evidence.level;
      const parentLevel = LEVEL_INDEX.has(level) ? parentLevelFor(level) : null;
      let resolvedParent: B3MaterializedNode | undefined;

      if (LEVEL_INDEX.has(level) && parentLevel !== null) {
        const parentage = evidence.parentageAuthority;
        if (!parentage?.verified
            || parentage.method !== 'EXPLICIT_SOURCE_STRUCTURE'
            || !isNonEmpty(parentage.parentCanonicalIdentityKey)
            || !isNonEmpty(parentage.parentOccurrenceExtractionId)
            || !isNonEmpty(parentage.evidenceId)) {
          reasons.push('MISSING_PARENTAGE_AUTHORITY');
        } else if (hasCompleteLineage(evidence.lineage)) {
          const candidates = nodesByAuthorityIdentity.get(
            authorityIdentityKey(evidence, parentage.parentCanonicalIdentityKey),
          ) ?? [];
          resolvedParent = candidates.find(candidate => candidate.supportingOccurrences.some(
            occurrence => occurrence.extractionId === parentage.parentOccurrenceExtractionId,
          ));
          const parentOccurrence = resolvedParent?.supportingOccurrences.find(
            occurrence => occurrence.extractionId === parentage.parentOccurrenceExtractionId,
          );
          if (!resolvedParent || !parentOccurrence) {
            reasons.push('PARENT_NOT_MATERIALIZED');
          } else if (resolvedParent.level !== parentLevel) {
            reasons.push('INVALID_HIERARCHY_RELATIONSHIP');
          } else if (!continuationCovers(
            evidence,
            parentOccurrence,
            relationshipBoundaries(parentOccurrence, evidence.lineage),
          )) {
            reasons.push('MISSING_BOUNDARY_CONTINUATION_AUTHORITY');
          }
        }
      }

      if (reasons.length > 0) {
        unresolved.push({ evidence, reasons: uniqueSorted(reasons) as B3UnresolvedReason[] });
        continue;
      }

      const key = nodeKey(evidence);
      const existing = nodesByKey.get(key);
      if (existing) {
        const aggregation = evidence.aggregationAuthority;
        if (!aggregation?.verified
            || aggregation.method !== 'SAME_CANONICAL_NODE'
            || aggregation.canonicalIdentityKey !== evidence.identityAuthority.canonicalIdentityKey
            || !isNonEmpty(aggregation.evidenceId)) {
          unresolved.push({ evidence, reasons: ['UNPROVEN_AGGREGATION'] });
          continue;
        }
        existing.supportingOccurrences = uniqueSortedLineage([
          ...existing.supportingOccurrences,
          evidence.lineage,
        ]);
        existing.authorityEvidenceIds = uniqueSorted([
          ...existing.authorityEvidenceIds,
          evidence.authority.evidenceId,
          evidence.identityAuthority.evidenceId,
          aggregation.evidenceId,
        ]);
        existing.structuralAuthorityEvidenceIds = uniqueSorted([
          ...existing.structuralAuthorityEvidenceIds,
          ...(evidence.parentageAuthority ? [evidence.parentageAuthority.evidenceId] : []),
        ]);
        existing.orderingAuthorityEvidenceIds = uniqueSorted([
          ...existing.orderingAuthorityEvidenceIds,
          evidence.orderingAuthority.evidenceId,
        ]);
        materializedEvidenceIds.add(evidence.evidenceId);
        continue;
      }

      const scopedIdentity = `${scopeKey(evidence)}|${evidence.identityAuthority.canonicalIdentityKey}`;
      if (nodeByScopedIdentity.has(scopedIdentity)) {
        unresolved.push({ evidence, reasons: ['SCOPE_COLLISION'] });
        continue;
      }

      const parentIdentity = evidence.parentageAuthority?.parentCanonicalIdentityKey ?? null;
      const node: B3MaterializedNode = {
        nodeId: deterministicNodeId(key),
        canonicalIdentityKey: evidence.identityAuthority.canonicalIdentityKey,
        level,
        title: evidence.title,
        ...(evidence.content === undefined ? {} : { content: evidence.content }),
        parentId: resolvedParent?.nodeId ?? null,
        parentCanonicalIdentityKey: parentIdentity,
        order: evidence.orderingAuthority.order,
        authorityEvidenceIds: uniqueSorted([
          evidence.authority.evidenceId,
          evidence.identityAuthority.evidenceId,
        ]),
        structuralAuthorityEvidenceIds: evidence.parentageAuthority
          ? uniqueSorted([
            evidence.parentageAuthority.evidenceId,
            ...(evidence.parentageAuthority.continuationAuthority
              ? [evidence.parentageAuthority.continuationAuthority.evidenceId]
              : []),
          ])
          : [],
        orderingAuthorityEvidenceIds: [evidence.orderingAuthority.evidenceId],
        supportingOccurrences: [evidence.lineage],
      };
      nodesByKey.set(key, node);
      nodeByScopedIdentity.set(scopedIdentity, node);
      const authorityKey = authorityIdentityKey(evidence, evidence.identityAuthority.canonicalIdentityKey);
      nodesByAuthorityIdentity.set(authorityKey, [...(nodesByAuthorityIdentity.get(authorityKey) ?? []), node]);
      materializedEvidenceIds.add(evidence.evidenceId);
    }

    const canonicalMaterializedNodes = Array.from(nodesByKey.values()).sort((left, right) => {
      const levelDifference = (LEVEL_INDEX.get(left.level) ?? 0) - (LEVEL_INDEX.get(right.level) ?? 0);
      if (levelDifference !== 0) return levelDifference;
      if (left.order !== right.order) return left.order - right.order;
      return left.nodeId.localeCompare(right.nodeId);
    });
    unresolved.sort((left, right) => left.evidence.evidenceId.localeCompare(right.evidence.evidenceId));

    const requiredIds = canonicalScope.requiredEvidenceIds;
    const unresolvedIdSet = new Set(unresolved.map(item => item.evidence.evidenceId));
    const suppliedEvidenceIds = new Set(input.evidence.map(evidence => evidence.evidenceId));
    const unresolvedRequiredEvidenceIds = requiredIds.filter(id => {
      if (!suppliedEvidenceIds.has(id) || unresolvedIdSet.has(id)) return true;
      return !materializedEvidenceIds.has(id);
    });
    const resolvedRequiredEvidenceIds = requiredIds.filter(id => !unresolvedRequiredEvidenceIds.includes(id));
    const levelsPresent = new Set(canonicalMaterializedNodes.map(node => node.level));
    const exactLevelsPresent = B3_ACADEMIC_LEVELS.every(level => levelsPresent.has(level));
    const completionReasons: string[] = [];
    if (unresolvedRequiredEvidenceIds.length > 0) completionReasons.push('UNRESOLVED_REQUIRED_EVIDENCE');
    if (canonicalScope.requireExactFiveLevelCoverage && !exactLevelsPresent) {
      completionReasons.push('EXACT_FIVE_LEVEL_COVERAGE_INCOMPLETE');
    }

    return {
      declaredCompletenessScope: canonicalScope,
      canonicalMaterializedNodes,
      unresolvedSourceEvidence: unresolved,
      completionEligibility: {
        eligible: completionReasons.length === 0,
        reasons: completionReasons,
        resolvedRequiredEvidenceIds,
        unresolvedRequiredEvidenceIds,
      },
    };
  }
}
