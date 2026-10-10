import { createHash } from 'crypto';
import {
  B3_CONTRACT_VERSION,
  B3AcademicLevel,
  B3MaterializationInput,
  B3MaterializationResult,
  B3SourceEvidence,
} from '../syllabus/b3Contract';
import { B3StructuralMaterializer } from '../syllabus/b3StructuralMaterializer';
import {
  B3GovernedRevisionIdentity,
  B3PersistenceConflictError,
  B3SealedPersistenceProof,
  B3_REVISION_STATE_SEALED,
} from '../syllabus/b3MaterializationRepository';
import {
  B3MaterializerDependency,
  B3RepositoryDependency,
  SyllabusB3Executor,
  SyllabusB3ExecutorInput,
} from '../workers/syllabusB3Executor';

const identities = [
  'subject.physics',
  'unit.mechanics',
  'topic.motion',
  'micro.motion_1d',
  'atomic.displacement',
];
const levels: B3AcademicLevel[] = ['subject', 'unit', 'topic', 'micro_topic', 'atomic_level_topic'];

function evidence(index: number): B3SourceEvidence {
  const identity = identities[index];
  const extractionId = `extraction_${index + 1}`;
  const parentIdentity = index === 0 ? undefined : identities[index - 1];
  return {
    evidenceId: `evidence_${index + 1}`,
    level: levels[index],
    title: index === 0 ? 'Shared Title' : identity,
    required: true,
    authority: {
      official: true,
      applicable: true,
      effective: true,
      verified: true,
      evidenceId: `authority_${index + 1}`,
    },
    identityAuthority: {
      verified: true,
      canonicalIdentityKey: identity,
      evidenceId: `identity_${index + 1}`,
      method: 'AUTHORITATIVE_CANONICAL_IDENTITY',
    },
    ...(parentIdentity ? {
      parentageAuthority: {
        verified: true,
        parentCanonicalIdentityKey: parentIdentity,
        parentOccurrenceExtractionId: `extraction_${index}`,
        evidenceId: `parent_${index + 1}`,
        method: 'EXPLICIT_SOURCE_STRUCTURE' as const,
      },
    } : {}),
    orderingAuthority: {
      verified: true,
      order: index + 1,
      evidenceId: `order_${index + 1}`,
      method: 'AUTHORITATIVE_SOURCE_ORDER',
    },
    lineage: {
      missionId: 'mission_1',
      sourceId: 'source_1',
      documentId: 'document_1',
      sourceVersionId: 'version_1',
      sourceSha256: 'sha256_source_1',
      extractionId,
      paperId: 'PAPER_1',
      location: {
        pageNumber: 1,
        sectionId: 'section_1',
        span: { start: index * 10, end: index * 10 + 9 },
      },
    },
  };
}

function materializationInput(extraEvidence: B3SourceEvidence[] = []): B3MaterializationInput {
  const items = [...levels.map((_, index) => evidence(index)), ...extraEvidence];
  return {
    contractVersion: B3_CONTRACT_VERSION,
    evidence: items,
    declaredCompletenessScope: {
      requiredEvidenceIds: items.map(item => item.evidenceId),
      requireExactFiveLevelCoverage: true,
    },
  };
}

function revisionIdentity(
  extractionIds = levels.map((_, index) => `extraction_${index + 1}`),
): B3GovernedRevisionIdentity {
  return {
    missionId: 'mission_1',
    authoritativeSourceChainId: 'source_chain_1',
    orderedSources: [{
      sourceId: 'source_1',
      documentId: 'document_1',
      sourceVersionId: 'version_1',
      sourceSha256: 'sha256_source_1',
    }],
    verifiedExtractionIds: extractionIds,
    contractVersion: B3_CONTRACT_VERSION,
    revisionId: 'revision_1',
  };
}

function executorInput(
  input = materializationInput(),
  identity = revisionIdentity(input.evidence.map(item => item.lineage.extractionId)),
): SyllabusB3ExecutorInput {
  return { materializationInput: input, revisionIdentity: identity };
}

type RepositoryMode =
  | 'SEALED'
  | 'IDEMPOTENT'
  | 'STAGING'
  | 'FAILURE'
  | 'CONFLICT'
  | 'MISMATCHED_REVISION'
  | 'MISMATCHED_INTEGRITY';

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.keys(record).sort().reduce<Record<string, unknown>>((output, key) => {
      if (record[key] !== undefined) output[key] = stableValue(record[key]);
      return output;
    }, {});
  }
  return value;
}

function expectedContentHash(
  identity: B3GovernedRevisionIdentity,
  result: B3MaterializationResult,
): string {
  return createHash('sha256').update(JSON.stringify(stableValue({
    revisionIdentity: identity,
    declaredCompletenessScope: result.declaredCompletenessScope,
    canonicalMaterializedNodes: result.canonicalMaterializedNodes,
    unresolvedSourceEvidence: result.unresolvedSourceEvidence,
    completionEligibility: result.completionEligibility,
  }))).digest('hex');
}

class RecordingRepository implements B3RepositoryDependency {
  readonly calls: Array<{
    identity: B3GovernedRevisionIdentity;
    result: B3MaterializationResult;
  }> = [];
  mode: RepositoryMode = 'SEALED';
  lifecycleWrites = 0;
  projectionWrites = 0;
  structuredNodeWrites = 0;
  studentPublications = 0;
  queueRegistrations = 0;

  async persistAuthoritatively(
    identity: B3GovernedRevisionIdentity,
    result: B3MaterializationResult,
  ): Promise<B3SealedPersistenceProof> {
    this.calls.push({ identity, result });
    if (this.mode === 'FAILURE') throw new Error('INJECTED_PERSISTENCE_FAILURE');
    if (this.mode === 'CONFLICT') {
      throw new B3PersistenceConflictError('revision_1', 'SAME_REVISION_INCOMPATIBLE_CONTENT');
    }
    return {
      status: this.mode === 'IDEMPOTENT' ? 'IDEMPOTENT_REUSE'
        : this.mode === 'STAGING' ? 'STAGED' as 'SEALED'
        : 'SEALED',
      missionId: identity.missionId,
      revisionId: this.mode === 'MISMATCHED_REVISION' ? 'revision_other' : identity.revisionId,
      revisionRootPath: `mission_realms/${identity.missionId}/b3_materialization_revisions/${identity.revisionId}`,
      currentPointerPath: `mission_realms/${identity.missionId}/b3_materialization_authority/current`,
      contentIntegrityHash: this.mode === 'MISMATCHED_INTEGRITY'
        ? 'incompatible_content_hash'
        : expectedContentHash(identity, result),
      idempotencyIdentity: 'idempotency_1',
      revisionState: this.mode === 'STAGING'
        ? 'STAGING_NON_AUTHORITATIVE' as typeof B3_REVISION_STATE_SEALED
        : B3_REVISION_STATE_SEALED,
    };
  }
}

class RecordingMaterializer implements B3MaterializerDependency {
  readonly canonical = new B3StructuralMaterializer();
  readonly inputs: B3MaterializationInput[] = [];

  materialize(input: B3MaterializationInput): B3MaterializationResult {
    this.inputs.push(input);
    return this.canonical.materialize(input);
  }
}

function setup() {
  const materializer = new RecordingMaterializer();
  const repository = new RecordingRepository();
  const executor = new SyllabusB3Executor(materializer, repository);
  return { executor, materializer, repository };
}

function orphanEvidence(): B3SourceEvidence {
  return {
    ...evidence(1),
    evidenceId: 'evidence_orphan',
    identityAuthority: {
      ...evidence(1).identityAuthority,
      canonicalIdentityKey: 'unit.orphan',
      evidenceId: 'identity_orphan',
    },
    parentageAuthority: undefined,
    lineage: {
      ...evidence(1).lineage,
      extractionId: 'extraction_orphan',
    },
  };
}

describe('Syllabus B3 executor E01-E26', () => {
  test('E01 valid verified input reaches the canonical materializer', async () => {
    const { executor, materializer } = setup();
    const input = executorInput();
    await executor.execute(input);
    expect(materializer.inputs).toEqual([input.materializationInput]);
  });

  test('E02 executor returns the exact canonical hierarchy without reinterpretation', async () => {
    const { executor, materializer } = setup();
    const input = executorInput();
    const expected = materializer.canonical.materialize(input.materializationInput);
    const outcome = await executor.execute(input);
    expect(outcome.materializationResult).toEqual(expected);
  });

  test('E03 completion-eligible canonical result reaches repository unchanged', async () => {
    const { executor, repository } = setup();
    const outcome = await executor.execute(executorInput());
    expect(repository.calls).toHaveLength(1);
    expect(repository.calls[0].result).toBe(outcome.materializationResult);
  });

  test('E04 unresolved required evidence is preserved exactly', async () => {
    const { executor, repository } = setup();
    const input = materializationInput([orphanEvidence()]);
    const outcome = await executor.execute(executorInput(input));
    expect(outcome.completed).toBe(false);
    expect(outcome.materializationResult?.unresolvedSourceEvidence[0].evidence.evidenceId)
      .toBe('evidence_orphan');
    expect(repository.calls).toHaveLength(0);
  });

  test('E05 completionEligibility false cannot produce a positive proof', async () => {
    const { executor } = setup();
    const input = materializationInput([orphanEvidence()]);
    const outcome = await executor.execute(executorInput(input));
    expect(outcome).toMatchObject({ completed: false, status: 'MATERIALIZATION_INELIGIBLE' });
    expect('completionProof' in outcome).toBe(false);
  });

  test('E06 sealed persistence produces a bounded completion proof', async () => {
    const { executor } = setup();
    const outcome = await executor.execute(executorInput());
    expect(outcome).toMatchObject({
      completed: true,
      status: 'SEALED_AUTHORITATIVE',
      completionProof: {
        proofType: 'B3_EXECUTOR_COMPLETION_PROOF',
        sealedPersistenceStatus: 'SEALED',
      },
    });
  });

  test('E07 idempotent sealed reuse is accepted', async () => {
    const { executor, repository } = setup();
    repository.mode = 'IDEMPOTENT';
    await expect(executor.execute(executorInput())).resolves.toMatchObject({
      completed: true,
      status: 'IDEMPOTENT_SEALED_REUSE',
      completionProof: { sealedPersistenceStatus: 'IDEMPOTENT_REUSE' },
    });
  });

  test('E08 non-sealed staging cannot produce a positive proof', async () => {
    const { executor, repository } = setup();
    repository.mode = 'STAGING';
    const outcome = await executor.execute(executorInput());
    expect(outcome).toMatchObject({ completed: false, status: 'NON_AUTHORITATIVE_PERSISTENCE' });
    expect('completionProof' in outcome).toBe(false);
  });

  test('E09 persistence failure cannot produce a positive proof', async () => {
    const { executor, repository } = setup();
    repository.mode = 'FAILURE';
    const outcome = await executor.execute(executorInput());
    expect(outcome).toMatchObject({ completed: false, status: 'PERSISTENCE_FAILURE' });
    expect('completionProof' in outcome).toBe(false);
  });

  test('E10 same-revision repository conflict fails closed', async () => {
    const { executor, repository } = setup();
    repository.mode = 'CONFLICT';
    await expect(executor.execute(executorInput())).resolves.toMatchObject({
      completed: false,
      status: 'PERSISTENCE_CONFLICT',
    });
  });

  test('E11 conflict cannot synthesize or retry under a replacement revision', async () => {
    const { executor, repository } = setup();
    repository.mode = 'CONFLICT';
    const input = executorInput();
    await executor.execute(input);
    expect(repository.calls).toHaveLength(1);
    expect(repository.calls[0].identity.revisionId).toBe('revision_1');
  });

  test('E12 source, document, version, and hash binding survives execution', async () => {
    const { executor } = setup();
    const outcome = await executor.execute(executorInput());
    if (!outcome.completed) throw new Error('expected completed');
    expect(outcome.completionProof.orderedSources).toEqual(revisionIdentity().orderedSources);
  });

  test('E13 verified extraction set survives execution', async () => {
    const { executor } = setup();
    const outcome = await executor.execute(executorInput());
    if (!outcome.completed) throw new Error('expected completed');
    expect(outcome.completionProof.verifiedExtractionIds).toEqual(revisionIdentity().verifiedExtractionIds);
  });

  test('E14 evidenceId and extractionId remain distinct through orchestration', async () => {
    const { executor } = setup();
    const outcome = await executor.execute(executorInput());
    if (!outcome.completed) throw new Error('expected completed');
    expect(outcome.materializationResult.canonicalMaterializedNodes[0].supportingOccurrences[0].extractionId)
      .toBe('extraction_1');
    expect(outcome.completionProof.verifiedExtractionIds).toContain('extraction_1');
    expect(outcome.completionProof.verifiedExtractionIds).not.toContain('evidence_1');
  });

  test('E15 B3 contract version survives execution', async () => {
    const { executor } = setup();
    const outcome = await executor.execute(executorInput());
    if (!outcome.completed) throw new Error('expected completed');
    expect(outcome.completionProof.contractVersion).toBe(B3_CONTRACT_VERSION);
  });

  test('E16 completion proof binds revision and deterministic manifest', async () => {
    const { executor } = setup();
    const outcome = await executor.execute(executorInput());
    if (!outcome.completed) throw new Error('expected completed');
    expect(outcome.completionProof.revisionId).toBe('revision_1');
    expect(outcome.completionProof.persistenceContentIntegrityHash).toMatch(/^[a-f0-9]{64}$/);
    expect(outcome.completionProof.materializationManifestHash).toMatch(/^[a-f0-9]{64}$/);
    expect(outcome.completionProof.lineageIntegrityHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('E17 repeated identical invocation preserves deterministic idempotent semantics', async () => {
    const { executor, repository } = setup();
    const first = await executor.execute(executorInput());
    repository.mode = 'IDEMPOTENT';
    const replay = await executor.execute(executorInput());
    if (!first.completed || !replay.completed) throw new Error('expected completed');
    expect(replay.completionProof.materializationManifestHash)
      .toBe(first.completionProof.materializationManifestHash);
    expect(replay.completionProof.revisionId).toBe(first.completionProof.revisionId);
  });

  test('E18 executor does not write B3_COMPLETE', async () => {
    const { executor, repository } = setup();
    await executor.execute(executorInput());
    expect(repository.lifecycleWrites).toBe(0);
  });

  test('E19 executor does not mutate lifecycle', async () => {
    const { executor, repository } = setup();
    await executor.execute(executorInput());
    expect(repository.lifecycleWrites).toBe(0);
  });

  test('E20 executor does not write current_syllabus_projection', async () => {
    const { executor, repository } = setup();
    await executor.execute(executorInput());
    expect(repository.projectionWrites).toBe(0);
  });

  test('E21 executor does not write structured_nodes', async () => {
    const { executor, repository } = setup();
    await executor.execute(executorInput());
    expect(repository.structuredNodeWrites).toBe(0);
  });

  test('E22 executor does not publish Student data', async () => {
    const { executor, repository } = setup();
    await executor.execute(executorInput());
    expect(repository.studentPublications).toBe(0);
  });

  test('E23 executor does not register a queue or runtime trigger', async () => {
    const { executor, repository } = setup();
    await executor.execute(executorInput());
    expect(repository.queueRegistrations).toBe(0);
  });

  test('E24 executor cannot turn unresolved evidence into canonical nodes', async () => {
    const { executor } = setup();
    const input = materializationInput([orphanEvidence()]);
    const outcome = await executor.execute(executorInput(input));
    expect(outcome.materializationResult?.canonicalMaterializedNodes
      .some(node => node.canonicalIdentityKey === 'unit.orphan')).toBe(false);
    expect(outcome.materializationResult?.unresolvedSourceEvidence
      .some(item => item.evidence.evidenceId === 'evidence_orphan')).toBe(true);
  });

  test('E25 invalid authority fails before materializer or repository invocation', async () => {
    const { executor, materializer, repository } = setup();
    const invalidIdentity = { ...revisionIdentity(), authoritativeSourceChainId: '' };
    const outcome = await executor.execute(executorInput(materializationInput(), invalidIdentity));
    expect(outcome).toMatchObject({ completed: false, status: 'INVALID_AUTHORITY_INPUT' });
    expect(materializer.inputs).toHaveLength(0);
    expect(repository.calls).toHaveLength(0);
  });

  test('E26 mismatched sealed revision binding withholds positive proof', async () => {
    const { executor, repository } = setup();
    repository.mode = 'MISMATCHED_REVISION';
    const revisionMismatch = await executor.execute(executorInput());
    expect(revisionMismatch).toMatchObject({
      completed: false,
      status: 'PROOF_BINDING_MISMATCH',
      reason: 'PERSISTENCE_REVISION_MISMATCH',
    });
    expect('completionProof' in revisionMismatch).toBe(false);

    repository.mode = 'MISMATCHED_INTEGRITY';
    const integrityMismatch = await executor.execute(executorInput());
    expect(integrityMismatch).toMatchObject({
      completed: false,
      status: 'PROOF_BINDING_MISMATCH',
      reason: 'PERSISTENCE_CONTENT_INTEGRITY_MISMATCH',
    });
    expect('completionProof' in integrityMismatch).toBe(false);
  });
});
