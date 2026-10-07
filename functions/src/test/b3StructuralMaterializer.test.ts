import { B3StructuralMaterializer } from '../syllabus/b3StructuralMaterializer';
import {
  B3_CONTRACT_VERSION,
  B3AcademicLevel,
  B3MaterializationInput,
  B3SourceEvidence,
} from '../syllabus/b3Contract';

const materializer = new B3StructuralMaterializer();
const levels: B3AcademicLevel[] = ['subject', 'unit', 'topic', 'micro_topic', 'atomic_level_topic'];

const defaultExtractionIdByIdentity: Record<string, string> = {
  'subject.physics': 'ev_subject.physics_1',
  'unit.mechanics': 'ev_unit.mechanics_2',
  'topic.motion': 'ev_topic.motion_3',
  'micro.motion_1d': 'ev_micro.motion_1d_4',
  'atomic.displacement': 'ev_atomic.displacement_5',
};

function evidence(
  level: B3AcademicLevel,
  identity: string,
  order: number,
  parentIdentity?: string,
  overrides: Partial<B3SourceEvidence> = {},
): B3SourceEvidence {
  const evidenceId = overrides.evidenceId ?? `ev_${identity}_${order}`;
  return {
    evidenceId,
    level,
    title: overrides.title ?? identity,
    required: overrides.required ?? true,
    authority: overrides.authority ?? {
      official: true,
      applicable: true,
      effective: true,
      verified: true,
      evidenceId: `authority_${evidenceId}`,
    },
    identityAuthority: overrides.identityAuthority ?? {
      verified: true,
      canonicalIdentityKey: identity,
      evidenceId: `identity_${evidenceId}`,
      method: 'AUTHORITATIVE_CANONICAL_IDENTITY',
    },
    ...(parentIdentity ? {
      parentageAuthority: overrides.parentageAuthority ?? {
        verified: true,
        parentCanonicalIdentityKey: parentIdentity,
        parentOccurrenceExtractionId: defaultExtractionIdByIdentity[parentIdentity],
        evidenceId: `parent_${evidenceId}`,
        method: 'EXPLICIT_SOURCE_STRUCTURE',
      },
    } : {}),
    orderingAuthority: overrides.orderingAuthority ?? {
      verified: true,
      order,
      evidenceId: `order_${evidenceId}`,
      method: 'AUTHORITATIVE_SOURCE_ORDER',
    },
    lineage: overrides.lineage ?? {
      missionId: 'mission_1',
      sourceId: 'source_1',
      documentId: 'document_1',
      sourceVersionId: 'version_1',
      sourceSha256: 'sha256_verified_1',
      extractionId: evidenceId,
      paperId: 'PAPER_1',
      location: { pageNumber: 1, sectionId: 'section_main', span: { start: 0, end: 10 } },
    },
    ...overrides,
  };
}

function fiveLevelEvidence(): B3SourceEvidence[] {
  return [
    evidence('subject', 'subject.physics', 1),
    evidence('unit', 'unit.mechanics', 2, 'subject.physics'),
    evidence('topic', 'topic.motion', 3, 'unit.mechanics'),
    evidence('micro_topic', 'micro.motion_1d', 4, 'topic.motion'),
    evidence('atomic_level_topic', 'atomic.displacement', 5, 'micro.motion_1d'),
  ];
}

function input(items: B3SourceEvidence[], requiredIds = items.map(item => item.evidenceId)): B3MaterializationInput {
  return {
    contractVersion: B3_CONTRACT_VERSION,
    evidence: items,
    declaredCompletenessScope: {
      requiredEvidenceIds: requiredIds,
      requireExactFiveLevelCoverage: true,
    },
  };
}

describe('Canonical B3 structural materializer T01-T18', () => {
  test('T01 exact five-level hierarchy accepted', () => {
    const result = materializer.materialize(input(fiveLevelEvidence()));
    expect(result.canonicalMaterializedNodes.map(node => node.level)).toEqual(levels);
  });

  test('T02 sixth canonical level rejected fail-closed', () => {
    const items = fiveLevelEvidence();
    const invalid = {
      ...evidence('topic', 'sixth.level', 6, 'atomic.displacement'),
      level: 'sixth_level',
    } as unknown as B3SourceEvidence;
    const result = materializer.materialize(input([...items, invalid]));
    expect(result.unresolvedSourceEvidence[0].reasons).toContain('INVALID_ACADEMIC_LEVEL');
    expect(result.completionEligibility.eligible).toBe(false);
  });

  test('T03 verified parentage materializes', () => {
    const result = materializer.materialize(input(fiveLevelEvidence()));
    const unit = result.canonicalMaterializedNodes.find(node => node.level === 'unit');
    const subject = result.canonicalMaterializedNodes.find(node => node.level === 'subject');
    expect(unit?.parentId).toBe(subject?.nodeId);
  });

  test('T04 previous-page state alone cannot establish parentage', () => {
    const subject = evidence('subject', 'subject.physics', 1);
    const unit = evidence('unit', 'unit.orphan', 2, undefined, {
      lineage: { ...subject.lineage, extractionId: 'ev_orphan', location: { pageNumber: 2, span: { start: 0, end: 4 } } },
    });
    const result = materializer.materialize(input([subject, unit]));
    expect(result.unresolvedSourceEvidence[0].reasons).toContain('MISSING_PARENTAGE_AUTHORITY');
  });

  test('T05 evidence-qualified cross-page continuation accepted', () => {
    const items = fiveLevelEvidence();
    const continuation = evidence('topic', 'topic.motion', 3, 'unit.mechanics', {
      evidenceId: 'ev_topic_page_2',
      parentageAuthority: {
        verified: true,
        parentCanonicalIdentityKey: 'unit.mechanics',
        parentOccurrenceExtractionId: items[1].lineage.extractionId,
        evidenceId: 'parent_topic_page_2',
        method: 'EXPLICIT_SOURCE_STRUCTURE',
        continuationAuthority: {
          verified: true,
          boundaries: ['PAGE'],
          parentOccurrenceExtractionId: items[1].lineage.extractionId,
          evidenceId: 'continuation_topic_page_2',
          method: 'EXPLICIT_STRUCTURAL_CONTINUATION',
        },
      },
      aggregationAuthority: {
        verified: true,
        canonicalIdentityKey: 'topic.motion',
        evidenceId: 'aggregation_cross_page',
        method: 'SAME_CANONICAL_NODE',
        boundary: 'PAGE',
      },
      lineage: { ...items[2].lineage, extractionId: 'ev_topic_page_2', location: { pageNumber: 8, sectionId: 'section_main', span: { start: 0, end: 12 } } },
    });
    const result = materializer.materialize(input([...items, continuation]));
    const topic = result.canonicalMaterializedNodes.find(node => node.level === 'topic');
    expect(topic?.supportingOccurrences).toHaveLength(2);
  });

  test('T06 title-only duplicate does not merge', () => {
    const items = fiveLevelEvidence();
    const duplicateTitle = evidence('topic', 'topic.different_identity', 6, 'unit.mechanics', { title: items[2].title });
    const result = materializer.materialize(input([...items, duplicateTitle]));
    expect(result.canonicalMaterializedNodes.filter(node => node.level === 'topic')).toHaveLength(2);
  });

  test('T07 proven same canonical identity aggregates provenance', () => {
    const items = fiveLevelEvidence();
    const occurrence = evidence('topic', 'topic.motion', 3, 'unit.mechanics', {
      evidenceId: 'ev_topic_second_occurrence',
      parentageAuthority: {
        verified: true,
        parentCanonicalIdentityKey: 'unit.mechanics',
        parentOccurrenceExtractionId: items[1].lineage.extractionId,
        evidenceId: 'parent_topic_second_occurrence',
        method: 'EXPLICIT_SOURCE_STRUCTURE',
        continuationAuthority: {
          verified: true,
          boundaries: ['PAGE'],
          parentOccurrenceExtractionId: items[1].lineage.extractionId,
          evidenceId: 'continuation_topic_second_occurrence',
          method: 'EXPLICIT_STRUCTURAL_CONTINUATION',
        },
      },
      aggregationAuthority: {
        verified: true,
        canonicalIdentityKey: 'topic.motion',
        evidenceId: 'aggregation_proof',
        method: 'SAME_CANONICAL_NODE',
      },
      lineage: { ...items[2].lineage, extractionId: 'ev_topic_second_occurrence', location: { pageNumber: 9, sectionId: 'section_main', span: { start: 2, end: 20 } } },
    });
    const result = materializer.materialize(input([...items, occurrence]));
    expect(result.canonicalMaterializedNodes.find(node => node.level === 'topic')?.supportingOccurrences).toHaveLength(2);
  });

  test('T08 paper transition prevents inherited hierarchy leakage', () => {
    const items = fiveLevelEvidence();
    const paperTwoUnit = evidence('unit', 'unit.paper_2', 6, 'subject.physics', {
      lineage: { ...items[0].lineage, extractionId: 'ev_paper_2_unit', paperId: 'PAPER_2' },
    });
    const result = materializer.materialize(input([...items, paperTwoUnit]));
    expect(result.unresolvedSourceEvidence[0].reasons).toContain('PARENT_NOT_MATERIALIZED');
  });

  test('T09 orphan unresolved evidence is preserved', () => {
    const orphan = evidence('unit', 'unit.orphan', 1);
    const result = materializer.materialize(input([orphan]));
    expect(result.unresolvedSourceEvidence[0].evidence).toEqual(orphan);
  });

  test('T10 orphan is not silently dropped', () => {
    const orphan = evidence('unit', 'unit.orphan', 1);
    const result = materializer.materialize(input([orphan]));
    expect(result.canonicalMaterializedNodes).toHaveLength(0);
    expect(result.unresolvedSourceEvidence).toHaveLength(1);
  });

  test('T11 similarity and proximity cannot establish parentage', () => {
    const subject = evidence('subject', 'subject.physics', 1, undefined, { title: 'Motion Physics' });
    const unit = evidence('unit', 'unit.motion', 2, undefined, {
      title: 'Motion Physics',
      lineage: { ...subject.lineage, extractionId: 'ev_nearby', location: { pageNumber: 1, span: { start: 11, end: 20 } } },
    });
    const result = materializer.materialize(input([subject, unit]));
    expect(result.unresolvedSourceEvidence[0].reasons).toContain('MISSING_PARENTAGE_AUTHORITY');
  });

  test('T12 authoritative ordering preserved', () => {
    const items = fiveLevelEvidence();
    const secondUnit = evidence('unit', 'unit.second', 20, 'subject.physics');
    const firstUnit = evidence('unit', 'unit.first', 10, 'subject.physics');
    const result = materializer.materialize(input([...items, secondUnit, firstUnit]));
    expect(result.canonicalMaterializedNodes.filter(node => node.level === 'unit').map(node => node.canonicalIdentityKey))
      .toEqual(['unit.mechanics', 'unit.first', 'unit.second']);
  });

  test('T13 lineage survives materialization and aggregation', () => {
    const items = fiveLevelEvidence();
    const occurrence = evidence('topic', 'topic.motion', 3, 'unit.mechanics', {
      evidenceId: 'ev_lineage_2',
      parentageAuthority: {
        verified: true,
        parentCanonicalIdentityKey: 'unit.mechanics',
        parentOccurrenceExtractionId: items[1].lineage.extractionId,
        evidenceId: 'parent_lineage_2',
        method: 'EXPLICIT_SOURCE_STRUCTURE',
        continuationAuthority: {
          verified: true,
          boundaries: ['PAGE'],
          parentOccurrenceExtractionId: items[1].lineage.extractionId,
          evidenceId: 'continuation_lineage_2',
          method: 'EXPLICIT_STRUCTURAL_CONTINUATION',
        },
      },
      aggregationAuthority: {
        verified: true,
        canonicalIdentityKey: 'topic.motion',
        evidenceId: 'aggregation_lineage',
        method: 'SAME_CANONICAL_NODE',
      },
      lineage: { ...items[2].lineage, extractionId: 'ev_lineage_2', location: { pageNumber: 10, sectionId: 'section_main', span: { start: 4, end: 18 } } },
    });
    const result = materializer.materialize(input([...items, occurrence]));
    expect(result.canonicalMaterializedNodes.find(node => node.level === 'topic')?.supportingOccurrences)
      .toEqual(expect.arrayContaining([items[2].lineage, occurrence.lineage]));
  });

  test('T14 identical authoritative input produces deterministic identical result', () => {
    const governedInput = input(fiveLevelEvidence());
    expect(materializer.materialize(governedInput)).toEqual(materializer.materialize(governedInput));
  });

  test('T15 unresolved required evidence makes completion eligibility false', () => {
    const items = fiveLevelEvidence();
    const orphan = evidence('unit', 'unit.required_orphan', 7);
    const result = materializer.materialize(input([...items, orphan]));
    expect(result.completionEligibility.eligible).toBe(false);
    expect(result.completionEligibility.unresolvedRequiredEvidenceIds).toContain(orphan.evidenceId);
  });

  test('T16 fully valid bounded input may produce completion eligibility true', () => {
    expect(materializer.materialize(input(fiveLevelEvidence())).completionEligibility).toEqual({
      eligible: true,
      reasons: [],
      resolvedRequiredEvidenceIds: expect.any(Array),
      unresolvedRequiredEvidenceIds: [],
    });
  });

  test('T17 same-title Subject under distinct paper scope does not collapse', () => {
    const paperOne = evidence('subject', 'subject.mathematics', 1, undefined, { title: 'Mathematics' });
    const paperTwo = evidence('subject', 'subject.mathematics', 1, undefined, {
      evidenceId: 'ev_math_paper_2',
      title: 'Mathematics',
      lineage: { ...paperOne.lineage, extractionId: 'ev_math_paper_2', paperId: 'PAPER_2' },
    });
    const result = materializer.materialize(input([paperOne, paperTwo], [paperOne.evidenceId, paperTwo.evidenceId]));
    expect(result.canonicalMaterializedNodes).toHaveLength(2);
    expect(new Set(result.canonicalMaterializedNodes.map(node => node.nodeId)).size).toBe(2);
  });

  test('T18 normalized-title equality alone cannot establish identity', () => {
    const first = evidence('subject', 'subject.physics.primary', 1, undefined, { title: 'Physics' });
    const second = evidence('subject', 'subject.physics.secondary', 2, undefined, { title: '  PHYSICS  ' });
    const result = materializer.materialize(input([first, second], [first.evidenceId, second.evidenceId]));
    expect(result.canonicalMaterializedNodes).toHaveLength(2);
  });
});

describe('Phase-1 boundary-continuation authority repair', () => {
  test('B01 cross-page parentage is rejected without explicit continuation authority', () => {
    const subject = evidence('subject', 'subject.physics', 1);
    const unit = evidence('unit', 'unit.mechanics', 2, 'subject.physics', {
      lineage: {
        ...subject.lineage,
        extractionId: 'ev_unit.mechanics_2',
        location: { pageNumber: 2, sectionId: 'section_main', span: { start: 0, end: 10 } },
      },
    });
    const result = materializer.materialize(input([subject, unit]));
    expect(result.unresolvedSourceEvidence[0].reasons).toContain('MISSING_BOUNDARY_CONTINUATION_AUTHORITY');
    expect(result.completionEligibility.eligible).toBe(false);
  });

  test('B02 cross-page parentage is accepted with occurrence-bound continuation authority', () => {
    const subject = evidence('subject', 'subject.physics', 1);
    const unit = evidence('unit', 'unit.mechanics', 2, 'subject.physics', {
      parentageAuthority: {
        verified: true,
        parentCanonicalIdentityKey: 'subject.physics',
        parentOccurrenceExtractionId: subject.lineage.extractionId,
        evidenceId: 'parent_cross_page',
        method: 'EXPLICIT_SOURCE_STRUCTURE',
        continuationAuthority: {
          verified: true,
          boundaries: ['PAGE'],
          parentOccurrenceExtractionId: subject.lineage.extractionId,
          evidenceId: 'continuation_cross_page',
          method: 'EXPLICIT_STRUCTURAL_CONTINUATION',
        },
      },
      lineage: {
        ...subject.lineage,
        extractionId: 'ev_unit.mechanics_2',
        location: { pageNumber: 2, sectionId: 'section_main', span: { start: 0, end: 10 } },
      },
    });
    const result = materializer.materialize(input([subject, unit]));
    expect(result.unresolvedSourceEvidence).toHaveLength(0);
    expect(result.canonicalMaterializedNodes.map(node => node.canonicalIdentityKey))
      .toEqual(['subject.physics', 'unit.mechanics']);
  });

  test('B03 section boundary requires explicit section continuation authority', () => {
    const subject = evidence('subject', 'subject.physics', 1);
    const unproven = evidence('unit', 'unit.mechanics', 2, 'subject.physics', {
      lineage: {
        ...subject.lineage,
        extractionId: 'ev_unit.mechanics_2',
        location: { pageNumber: 1, sectionId: 'section_next', span: { start: 0, end: 10 } },
      },
    });
    expect(materializer.materialize(input([subject, unproven])).unresolvedSourceEvidence[0].reasons)
      .toContain('MISSING_BOUNDARY_CONTINUATION_AUTHORITY');

    const proven = evidence('unit', 'unit.mechanics', 2, 'subject.physics', {
      lineage: unproven.lineage,
      parentageAuthority: {
        ...unproven.parentageAuthority!,
        continuationAuthority: {
          verified: true,
          boundaries: ['SECTION'],
          parentOccurrenceExtractionId: subject.lineage.extractionId,
          evidenceId: 'continuation_section',
          method: 'EXPLICIT_STRUCTURAL_CONTINUATION',
        },
      },
    });
    expect(materializer.materialize(input([subject, proven])).unresolvedSourceEvidence).toHaveLength(0);
  });

  test('B04 document and source-artifact boundaries require applicable relationship evidence', () => {
    const subject = evidence('subject', 'subject.physics', 1);
    const boundaryLineage = {
      ...subject.lineage,
      sourceId: 'source_2',
      documentId: 'document_2',
      sourceVersionId: 'version_2',
      sourceSha256: 'sha256_verified_2',
      extractionId: 'ev_unit.mechanics_2',
    };
    const unproven = evidence('unit', 'unit.mechanics', 2, 'subject.physics', { lineage: boundaryLineage });
    expect(materializer.materialize(input([subject, unproven])).unresolvedSourceEvidence[0].reasons)
      .toContain('MISSING_BOUNDARY_CONTINUATION_AUTHORITY');

    const proven = evidence('unit', 'unit.mechanics', 2, 'subject.physics', {
      lineage: boundaryLineage,
      parentageAuthority: {
        verified: true,
        parentCanonicalIdentityKey: 'subject.physics',
        parentOccurrenceExtractionId: subject.lineage.extractionId,
        evidenceId: 'parent_cross_source',
        method: 'EXPLICIT_SOURCE_STRUCTURE',
        continuationAuthority: {
          verified: true,
          boundaries: ['DOCUMENT', 'SOURCE_ARTIFACT'],
          parentOccurrenceExtractionId: subject.lineage.extractionId,
          evidenceId: 'continuation_cross_source',
          method: 'EXPLICIT_STRUCTURAL_CONTINUATION',
          applicableEffectiveSourceRelationshipEvidenceId: 'relationship_source_1_to_source_2',
        },
      },
    });
    expect(materializer.materialize(input([subject, proven])).unresolvedSourceEvidence).toHaveLength(0);
  });

  test('B05 evidence-id completion is independent from extraction-id identity', () => {
    const items = fiveLevelEvidence();
    items[4] = evidence('atomic_level_topic', 'atomic.displacement', 5, 'micro.motion_1d', {
      evidenceId: 'required_atomic_evidence',
      lineage: { ...items[4].lineage, extractionId: 'distinct_atomic_extraction' },
    });
    const result = materializer.materialize(input(items));
    expect(result.completionEligibility.eligible).toBe(true);
    expect(result.completionEligibility.resolvedRequiredEvidenceIds).toContain('required_atomic_evidence');
    expect(result.completionEligibility.resolvedRequiredEvidenceIds).not.toContain('distinct_atomic_extraction');
  });
});
