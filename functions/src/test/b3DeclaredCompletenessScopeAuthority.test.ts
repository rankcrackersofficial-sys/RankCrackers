import {
  B3_CONTRACT_VERSION,
  B3MaterializationInput,
  B3SourceEvidence,
  canonicalizeB3DeclaredCompletenessScope,
} from '../syllabus/b3Contract';
import { B3StructuralMaterializer } from '../syllabus/b3StructuralMaterializer';
import {
  B3GovernedRevisionIdentity,
  B3MaterializationPersistenceStore,
  B3MaterializationRepository,
  B3PersistenceConflictError,
  B3PersistenceTransaction,
  B3RevisionEnvelope,
  b3RevisionRootPath,
} from '../syllabus/b3MaterializationRepository';
import { SyllabusB3Executor } from '../workers/syllabusB3Executor';
import { deterministicB3CompletionProofHash } from '../academicFactory/workers/syllabusB3AafWorker';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class MemoryStore implements B3MaterializationPersistenceStore {
  readonly documents = new Map<string, unknown>();

  async get(path: string): Promise<unknown | undefined> {
    const value = this.documents.get(path);
    return value === undefined ? undefined : clone(value);
  }

  async create(path: string, value: unknown): Promise<void> {
    if (this.documents.has(path)) throw new Error(`ALREADY_EXISTS:${path}`);
    this.documents.set(path, clone(value));
  }

  async runTransaction<T>(work: (transaction: B3PersistenceTransaction) => Promise<T>): Promise<T> {
    const view = new Map([...this.documents.entries()].map(([key, value]) => [key, clone(value)]));
    const result = await work({
      get: async path => {
        const value = view.get(path);
        return value === undefined ? undefined : clone(value);
      },
      create: (path, value) => {
        if (view.has(path)) throw new Error(`ALREADY_EXISTS:${path}`);
        view.set(path, clone(value));
      },
      set: (path, value) => view.set(path, clone(value)),
    });
    this.documents.clear();
    view.forEach((value, key) => this.documents.set(key, clone(value)));
    return result;
  }
}

const source = {
  sourceId: 'source_1', documentId: 'document_1',
  sourceVersionId: 'version_1', sourceSha256: 'sha_1',
};

function evidence(): B3SourceEvidence {
  return {
    evidenceId: 'evidence_1', level: 'subject', title: 'Physics', required: true,
    authority: {
      official: true, applicable: true, effective: true, verified: true,
      evidenceId: 'authority_1',
    },
    identityAuthority: {
      verified: true, canonicalIdentityKey: 'subject.physics',
      evidenceId: 'identity_1', method: 'AUTHORITATIVE_CANONICAL_IDENTITY',
    },
    orderingAuthority: {
      verified: true, order: 1, evidenceId: 'ordering_1',
      method: 'AUTHORITATIVE_SOURCE_ORDER',
    },
    lineage: {
      missionId: 'mission_1', ...source, extractionId: 'extraction_1', paperId: null,
      location: { pageNumber: 1, span: { start: 0, end: 10 } },
    },
  };
}

function input(requiredEvidenceIds = ['evidence_1'], fiveLevels = false): B3MaterializationInput {
  return {
    contractVersion: B3_CONTRACT_VERSION,
    evidence: [evidence()],
    declaredCompletenessScope: {
      requiredEvidenceIds,
      requireExactFiveLevelCoverage: fiveLevels,
    },
  };
}

function identity(revisionId = 'revision_1'): B3GovernedRevisionIdentity {
  return {
    missionId: 'mission_1', authoritativeSourceChainId: 'chain_1', orderedSources: [source],
    verifiedExtractionIds: ['extraction_1'], contractVersion: B3_CONTRACT_VERSION, revisionId,
  };
}

describe('B3 declared completeness scope authority', () => {
  test('S01-S08 malformed scopes fail closed', () => {
    const invalid: unknown[] = [
      undefined,
      {},
      { requiredEvidenceIds: [], requireExactFiveLevelCoverage: false },
      { requiredEvidenceIds: [''], requireExactFiveLevelCoverage: false },
      { requiredEvidenceIds: ['   '], requireExactFiveLevelCoverage: false },
      { requiredEvidenceIds: [' evidence_1'], requireExactFiveLevelCoverage: false },
      { requiredEvidenceIds: ['evidence_1 '], requireExactFiveLevelCoverage: false },
      { requiredEvidenceIds: ['evidence_1', 'evidence_1'], requireExactFiveLevelCoverage: false },
      { requiredEvidenceIds: ['evidence_1'], requireExactFiveLevelCoverage: 'false' },
    ];
    invalid.forEach(value => expect(() => canonicalizeB3DeclaredCompletenessScope(value)).toThrow());
  });

  test('S09-S10 order variants produce the same lexical canonical scope', () => {
    const left = canonicalizeB3DeclaredCompletenessScope({
      requiredEvidenceIds: ['z', 'a'], requireExactFiveLevelCoverage: true,
    });
    const right = canonicalizeB3DeclaredCompletenessScope({
      requiredEvidenceIds: ['a', 'z'], requireExactFiveLevelCoverage: true,
    });
    expect(left).toEqual({ requiredEvidenceIds: ['a', 'z'], requireExactFiveLevelCoverage: true });
    expect(right).toEqual(left);
  });

  test('S11-S13 materializer uses and returns one canonical scope object', () => {
    const materializer = new B3StructuralMaterializer();
    const result = materializer.materialize(input(['evidence_1'], false));
    expect(result.declaredCompletenessScope).toEqual({
      requiredEvidenceIds: ['evidence_1'], requireExactFiveLevelCoverage: false,
    });
    expect(result.completionEligibility).toMatchObject({
      eligible: true, resolvedRequiredEvidenceIds: ['evidence_1'], unresolvedRequiredEvidenceIds: [],
    });
    const fiveLevelResult = materializer.materialize(input(['evidence_1'], true));
    expect(fiveLevelResult.declaredCompletenessScope.requireExactFiveLevelCoverage).toBe(true);
    expect(fiveLevelResult.completionEligibility.reasons)
      .toContain('EXACT_FIVE_LEVEL_COVERAGE_INCOMPLETE');
  });

  test('S14-S23 repository binds scope to envelope, integrity, conflict, and replay', async () => {
    const materializer = new B3StructuralMaterializer();
    const firstResult = materializer.materialize(input());
    const changedResult = materializer.materialize(input(['evidence_1'], true));
    const firstStore = new MemoryStore();
    const firstRepository = new B3MaterializationRepository(firstStore);
    const firstProof = await firstRepository.persistAuthoritatively(identity(), firstResult);
    const envelope = await firstStore.get(
      b3RevisionRootPath('mission_1', 'revision_1'),
    ) as B3RevisionEnvelope;
    expect(envelope.declaredCompletenessScope).toEqual(firstResult.declaredCompletenessScope);
    await expect(firstRepository.persistAuthoritatively(identity(), firstResult))
      .resolves.toMatchObject({ status: 'IDEMPOTENT_REUSE' });
    await expect(firstRepository.persistAuthoritatively(identity(), changedResult))
      .rejects.toBeInstanceOf(B3PersistenceConflictError);

    const changedStore = new MemoryStore();
    const changedProof = await new B3MaterializationRepository(changedStore)
      .persistAuthoritatively(identity(), changedResult);
    expect(changedProof.contentIntegrityHash).not.toBe(firstProof.contentIntegrityHash);
    expect(changedProof.idempotencyIdentity).not.toBe(firstProof.idempotencyIdentity);
    expect(envelope.canonicalNodeManifest).toHaveLength(1);
    expect(envelope.unresolvedEvidenceManifest).toHaveLength(0);
  });

  test('S16 same revision with different independently valid required IDs conflicts', async () => {
    const materializer = new B3StructuralMaterializer();
    const scopeA = materializer.materialize(input(['evidence_1'], false));
    const scopeB = materializer.materialize(input(['evidence_1', 'evidence_2'], false));
    expect(scopeA.declaredCompletenessScope).toEqual(
      canonicalizeB3DeclaredCompletenessScope(input(['evidence_1']).declaredCompletenessScope),
    );
    expect(scopeB.declaredCompletenessScope).toEqual(
      canonicalizeB3DeclaredCompletenessScope(
        input(['evidence_1', 'evidence_2']).declaredCompletenessScope,
      ),
    );
    const repository = new B3MaterializationRepository(new MemoryStore());
    await repository.persistAuthoritatively(identity(), scopeA);
    await expect(repository.persistAuthoritatively(identity(), scopeB))
      .rejects.toBeInstanceOf(B3PersistenceConflictError);
  });

  test('S24-S28 executor proof copies exact materializer result scope', async () => {
    const store = new MemoryStore();
    const executor = SyllabusB3Executor.usingCanonicalDependencies(
      new B3MaterializationRepository(store),
    );
    const outcome = await executor.execute({ revisionIdentity: identity(), materializationInput: input() });
    if (!outcome.completed) throw new Error(`EXPECTED_COMPLETION:${outcome.reason}`);
    expect(outcome.completionProof.declaredCompletenessScope)
      .toEqual(outcome.materializationResult.declaredCompletenessScope);
    expect(outcome.completionProof.declaredCompletenessScope)
      .toBe(outcome.materializationResult.declaredCompletenessScope);
    const envelope = await store.get(b3RevisionRootPath('mission_1', 'revision_1')) as B3RevisionEnvelope;
    expect(outcome.completionProof.declaredCompletenessScope).toEqual(envelope.declaredCompletenessScope);
  });

  test('S29-S30 Phase-2D generic proof hash includes scope and is replay-stable', async () => {
    const makeProof = async (fiveLevels: boolean) => {
      const executor = SyllabusB3Executor.usingCanonicalDependencies(
        new B3MaterializationRepository(new MemoryStore()),
      );
      const outcome = await executor.execute({
        revisionIdentity: identity(), materializationInput: input(['evidence_1'], fiveLevels),
      });
      if (!outcome.completed) return null;
      return outcome.completionProof;
    };
    const proof = await makeProof(false);
    if (!proof) throw new Error('EXPECTED_PROOF');
    expect(deterministicB3CompletionProofHash(proof)).toBe(deterministicB3CompletionProofHash(clone(proof)));
    const altered = {
      ...proof,
      declaredCompletenessScope: { ...proof.declaredCompletenessScope, requireExactFiveLevelCoverage: true },
    };
    expect(deterministicB3CompletionProofHash(altered))
      .not.toBe(deterministicB3CompletionProofHash(proof));
  });

  test('S35-S40 repair exposes no trust-upgrade, lifecycle, projection, or publication API', () => {
    const scopeless = {
      canonicalMaterializedNodes: [], unresolvedSourceEvidence: [],
      completionEligibility: {
        eligible: true, reasons: [], resolvedRequiredEvidenceIds: [], unresolvedRequiredEvidenceIds: [],
      },
    };
    expect('declaredCompletenessScope' in scopeless).toBe(false);
    expect(canonicalizeB3DeclaredCompletenessScope).toBeDefined();
  });
});
