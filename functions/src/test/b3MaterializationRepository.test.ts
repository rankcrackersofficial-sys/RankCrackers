import {
  B3CurrentAuthorityPointer,
  B3GovernedRevisionIdentity,
  B3MaterializationPersistenceStore,
  B3MaterializationRepository,
  B3PersistenceConflictError,
  B3PersistenceTransaction,
  B3RevisionEnvelope,
  B3_REVISION_STATE_SEALED,
  B3_REVISION_STATE_STAGING,
  b3CanonicalNodePath,
  b3CurrentAuthorityPointerPath,
  b3RevisionRootPath,
  b3UnresolvedEvidencePath,
} from '../syllabus/b3MaterializationRepository';
import {
  B3_CONTRACT_VERSION,
  B3MaterializationResult,
  B3MaterializedNode,
  B3SourceEvidence,
} from '../syllabus/b3Contract';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class FaithfulTransactionalStore implements B3MaterializationPersistenceStore {
  readonly documents = new Map<string, unknown>();
  createCalls = 0;
  failCreateOnCall: number | null = null;
  failNextTransactionBeforeCommit = false;

  async get(path: string): Promise<unknown | undefined> {
    const value = this.documents.get(path);
    return value === undefined ? undefined : clone(value);
  }

  async create(path: string, value: unknown): Promise<void> {
    this.createCalls++;
    if (this.failCreateOnCall === this.createCalls) throw new Error('INJECTED_STAGING_FAILURE');
    if (this.documents.has(path)) throw new Error(`ALREADY_EXISTS:${path}`);
    this.documents.set(path, clone(value));
  }

  async runTransaction<T>(work: (transaction: B3PersistenceTransaction) => Promise<T>): Promise<T> {
    const transactionalView = new Map(
      [...this.documents.entries()].map(([path, value]) => [path, clone(value)]),
    );
    const transaction: B3PersistenceTransaction = {
      get: async path => {
        const value = transactionalView.get(path);
        return value === undefined ? undefined : clone(value);
      },
      create: (path, value) => {
        if (transactionalView.has(path)) throw new Error(`ALREADY_EXISTS:${path}`);
        transactionalView.set(path, clone(value));
      },
      set: (path, value) => transactionalView.set(path, clone(value)),
    };
    const result = await work(transaction);
    if (this.failNextTransactionBeforeCommit) {
      this.failNextTransactionBeforeCommit = false;
      throw new Error('INJECTED_TRANSACTION_COMMIT_FAILURE');
    }
    this.documents.clear();
    transactionalView.forEach((value, path) => this.documents.set(path, clone(value)));
    return result;
  }

  deleteForTest(path: string): void {
    this.documents.delete(path);
  }
}

const subjectLineage = {
  missionId: 'mission_1',
  sourceId: 'source_1',
  documentId: 'document_1',
  sourceVersionId: 'version_1',
  sourceSha256: 'sha256_source_1',
  extractionId: 'extract_subject_1',
  paperId: 'PAPER_1',
  location: { pageNumber: 1, sectionId: 'physics', span: { start: 0, end: 10 } },
};

const unresolvedLineage = {
  ...subjectLineage,
  extractionId: 'extract_unresolved_1',
  location: { pageNumber: 2, sectionId: 'physics', span: { start: 11, end: 30 } },
};

function node(overrides: Partial<B3MaterializedNode> = {}): B3MaterializedNode {
  return {
    nodeId: 'node_subject_physics',
    canonicalIdentityKey: 'subject.physics',
    level: 'subject',
    title: 'Physics',
    parentId: null,
    parentCanonicalIdentityKey: null,
    order: 1,
    authorityEvidenceIds: ['authority_subject'],
    structuralAuthorityEvidenceIds: [],
    orderingAuthorityEvidenceIds: ['order_subject'],
    supportingOccurrences: [clone(subjectLineage)],
    ...overrides,
  };
}

function unresolvedEvidence(): B3SourceEvidence {
  return {
    evidenceId: 'evidence_unresolved_1',
    level: 'unit',
    title: 'Unresolved Mechanics',
    required: true,
    authority: {
      official: true,
      applicable: true,
      effective: true,
      verified: true,
      evidenceId: 'authority_unresolved',
    },
    identityAuthority: {
      verified: true,
      canonicalIdentityKey: 'unit.unresolved_mechanics',
      evidenceId: 'identity_unresolved',
      method: 'AUTHORITATIVE_CANONICAL_IDENTITY',
    },
    orderingAuthority: {
      verified: true,
      order: 2,
      evidenceId: 'order_unresolved',
      method: 'AUTHORITATIVE_SOURCE_ORDER',
    },
    lineage: clone(unresolvedLineage),
  };
}

function result(overrides: Partial<B3MaterializationResult> = {}): B3MaterializationResult {
  return {
    declaredCompletenessScope: {
      requiredEvidenceIds: ['evidence_subject_1', 'evidence_unresolved_1'],
      requireExactFiveLevelCoverage: true,
    },
    canonicalMaterializedNodes: [node()],
    unresolvedSourceEvidence: [{
      evidence: unresolvedEvidence(),
      reasons: ['MISSING_PARENTAGE_AUTHORITY'],
    }],
    completionEligibility: {
      eligible: false,
      reasons: ['UNRESOLVED_REQUIRED_EVIDENCE'],
      resolvedRequiredEvidenceIds: ['evidence_subject_1'],
      unresolvedRequiredEvidenceIds: ['evidence_unresolved_1'],
    },
    ...overrides,
  };
}

function identity(
  revisionId = 'revision_1',
  supersedesRevisionId?: string,
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
    verifiedExtractionIds: ['extract_subject_1', 'extract_unresolved_1'],
    contractVersion: B3_CONTRACT_VERSION,
    revisionId,
    ...(supersedesRevisionId ? { supersedesRevisionId } : {}),
  };
}

function setup() {
  const store = new FaithfulTransactionalStore();
  return { store, repository: new B3MaterializationRepository(store) };
}

describe('B3 authoritative materialization repository R01-R26', () => {
  test('R01 valid Phase-1 result persists as non-authoritative staging', async () => {
    const { store, repository } = setup();
    const proof = await repository.stage(identity(), result());
    const envelope = await store.get(proof.revisionRootPath) as B3RevisionEnvelope;
    expect(proof.status).toBe('STAGED');
    expect(envelope.state).toBe(B3_REVISION_STATE_STAGING);
    expect(await store.get(b3CurrentAuthorityPointerPath('mission_1'))).toBeUndefined();
  });

  test('R02 canonical nodes persist only under the exact revision node path', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    expect(await store.get(b3CanonicalNodePath('mission_1', 'revision_1', 'node_subject_physics')))
      .toEqual(node());
  });

  test('R03 unresolved evidence persists only under the exact revision evidence path', async () => {
    const { store, repository } = setup();
    const expected = result().unresolvedSourceEvidence[0];
    await repository.stage(identity(), result());
    expect(await store.get(b3UnresolvedEvidencePath('mission_1', 'revision_1', 'evidence_unresolved_1')))
      .toEqual(expected);
  });

  test('R04 complete supporting and unresolved lineage survives persistence', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    const persistedNode = await store.get(
      b3CanonicalNodePath('mission_1', 'revision_1', 'node_subject_physics'),
    ) as B3MaterializedNode;
    const persistedUnresolved = await store.get(
      b3UnresolvedEvidencePath('mission_1', 'revision_1', 'evidence_unresolved_1'),
    ) as ReturnType<typeof result>['unresolvedSourceEvidence'][number];
    expect(persistedNode.supportingOccurrences).toEqual([subjectLineage]);
    expect(persistedUnresolved.evidence.lineage).toEqual(unresolvedLineage);
  });

  test('R05 identical authoritative replay returns idempotent reuse', async () => {
    const { repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    await expect(repository.persistAuthoritatively(identity(), result()))
      .resolves.toMatchObject({ status: 'IDEMPOTENT_REUSE', revisionId: 'revision_1' });
  });

  test('R06 identical replay creates no semantic duplicates', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    const count = store.documents.size;
    await repository.persistAuthoritatively(identity(), result());
    expect(store.documents.size).toBe(count);
    expect([...store.documents.keys()].filter(path => path.includes('/canonical_nodes/'))).toHaveLength(1);
    expect([...store.documents.keys()].filter(path => path.includes('/unresolved_evidence/'))).toHaveLength(1);
  });

  test('R07 incompatible content under the same revision fails closed', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    const changed = result({ canonicalMaterializedNodes: [node({ title: 'Changed Physics' })] });
    await expect(repository.persistAuthoritatively(identity(), changed))
      .rejects.toBeInstanceOf(B3PersistenceConflictError);
    expect((await store.get(b3RevisionRootPath('mission_1', 'revision_1')) as B3RevisionEnvelope)
      .state).toBe(B3_REVISION_STATE_SEALED);
  });

  test('R08 title equality cannot merge distinct canonical node identities', async () => {
    const { store, repository } = setup();
    const twoNodes = [node(), node({
      nodeId: 'node_unit_same_title',
      canonicalIdentityKey: 'unit.same_title',
      level: 'unit',
      parentId: 'node_subject_physics',
      parentCanonicalIdentityKey: 'subject.physics',
    })];
    await repository.stage(identity(), result({ canonicalMaterializedNodes: twoNodes }));
    expect([...store.documents.keys()].filter(path => path.includes('/canonical_nodes/'))).toHaveLength(2);
  });

  test('R09 repository preserves null parentage and does not infer it', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    const persisted = await store.get(
      b3CanonicalNodePath('mission_1', 'revision_1', 'node_subject_physics'),
    ) as B3MaterializedNode;
    expect(persisted.parentId).toBeNull();
    expect(persisted.parentCanonicalIdentityKey).toBeNull();
  });

  test('R10 unresolved evidence cannot auto-promote into canonical nodes', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    expect(await store.get(
      b3CanonicalNodePath('mission_1', 'revision_1', 'evidence_unresolved_1'),
    )).toBeUndefined();
  });

  test('R11 incomplete staging remains non-authoritative', async () => {
    const { store, repository } = setup();
    store.failCreateOnCall = 2;
    await expect(repository.stage(identity(), result())).rejects.toThrow('INJECTED_STAGING_FAILURE');
    expect((await store.get(b3RevisionRootPath('mission_1', 'revision_1')) as B3RevisionEnvelope)
      .state).toBe(B3_REVISION_STATE_STAGING);
    expect(await store.get(b3CurrentAuthorityPointerPath('mission_1'))).toBeUndefined();
  });

  test('R12 failed validation cannot advance the current pointer', async () => {
    const { store, repository } = setup();
    const staging = await repository.stage(identity(), result());
    store.deleteForTest(b3CanonicalNodePath('mission_1', 'revision_1', 'node_subject_physics'));
    await expect(repository.seal('mission_1', 'revision_1', staging.contentIntegrityHash))
      .rejects.toThrow('CANONICAL_NODE_MANIFEST_MISMATCH');
    expect(await store.get(b3CurrentAuthorityPointerPath('mission_1'))).toBeUndefined();
  });

  test('R13 a complete validated revision can be sealed', async () => {
    const { store, repository } = setup();
    const proof = await repository.persistAuthoritatively(identity(), result());
    expect(proof.status).toBe('SEALED');
    expect((await store.get(proof.revisionRootPath) as B3RevisionEnvelope).state)
      .toBe(B3_REVISION_STATE_SEALED);
  });

  test('R14 seal and current-pointer publication commit atomically', async () => {
    const { store, repository } = setup();
    const staging = await repository.stage(identity(), result());
    store.failNextTransactionBeforeCommit = true;
    await expect(repository.seal('mission_1', 'revision_1', staging.contentIntegrityHash))
      .rejects.toThrow('INJECTED_TRANSACTION_COMMIT_FAILURE');
    expect((await store.get(staging.revisionRootPath) as B3RevisionEnvelope).state)
      .toBe(B3_REVISION_STATE_STAGING);
    expect(await store.get(b3CurrentAuthorityPointerPath('mission_1'))).toBeUndefined();
  });

  test('R15 current pointer references only the sealed exact revision', async () => {
    const { store, repository } = setup();
    const proof = await repository.persistAuthoritatively(identity(), result());
    const pointer = await store.get(proof.currentPointerPath) as B3CurrentAuthorityPointer;
    expect(pointer).toEqual({
      missionId: 'mission_1',
      revisionId: 'revision_1',
      idempotencyIdentity: proof.idempotencyIdentity,
      contentIntegrityHash: proof.contentIntegrityHash,
      revisionState: B3_REVISION_STATE_SEALED,
    });
  });

  test('R16 sealed authoritative academic state is immutable', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    const before = clone([...store.documents.entries()]);
    await expect(repository.stage(identity(), result({
      unresolvedSourceEvidence: [],
    }))).rejects.toBeInstanceOf(B3PersistenceConflictError);
    expect([...store.documents.entries()]).toEqual(before);
  });

  test('R17 superseded sealed revision remains retained', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity('revision_1'), result());
    await repository.persistAuthoritatively(
      identity('revision_2', 'revision_1'),
      result({ canonicalMaterializedNodes: [node({ title: 'Physics Revision 2' })] }),
    );
    expect((await store.get(b3RevisionRootPath('mission_1', 'revision_1')) as B3RevisionEnvelope)
      .state).toBe(B3_REVISION_STATE_SEALED);
    expect((await store.get(b3CurrentAuthorityPointerPath('mission_1')) as B3CurrentAuthorityPointer)
      .revisionId).toBe('revision_2');
  });

  test('R18 ordered source version and hash survive persistence', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    const envelope = await store.get(b3RevisionRootPath('mission_1', 'revision_1')) as B3RevisionEnvelope;
    expect(envelope.revisionIdentity.orderedSources).toEqual(identity().orderedSources);
  });

  test('R19 evidenceId and extractionId remain independently preserved', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    const persisted = await store.get(
      b3UnresolvedEvidencePath('mission_1', 'revision_1', 'evidence_unresolved_1'),
    ) as ReturnType<typeof result>['unresolvedSourceEvidence'][number];
    expect(persisted.evidence.evidenceId).toBe('evidence_unresolved_1');
    expect(persisted.evidence.lineage.extractionId).toBe('extract_unresolved_1');
    expect(persisted.evidence.evidenceId).not.toBe(persisted.evidence.lineage.extractionId);
  });

  test('R20 paper, section, page, and span lineage survive persistence', async () => {
    const { store, repository } = setup();
    await repository.stage(identity(), result());
    const persisted = await store.get(
      b3CanonicalNodePath('mission_1', 'revision_1', 'node_subject_physics'),
    ) as B3MaterializedNode;
    expect(persisted.supportingOccurrences[0]).toMatchObject({
      paperId: 'PAPER_1',
      location: { pageNumber: 1, sectionId: 'physics', span: { start: 0, end: 10 } },
    });
  });

  test('R21 completion eligibility and proof inputs survive persistence', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    const envelope = await store.get(b3RevisionRootPath('mission_1', 'revision_1')) as B3RevisionEnvelope;
    expect(envelope.completionEligibility).toEqual(result().completionEligibility);
    expect(envelope.completionEligibility.eligible).toBe(false);
  });

  test('R22 repository writes no B3_COMPLETE lifecycle state', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    expect(JSON.stringify([...store.documents.entries()])).not.toContain('B3_COMPLETE');
  });

  test('R23 repository writes no current_syllabus_projection documents', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    expect([...store.documents.keys()].some(path => path.includes('current_syllabus_projection'))).toBe(false);
  });

  test('R24 repository writes no structured_nodes documents', async () => {
    const { store, repository } = setup();
    await repository.persistAuthoritatively(identity(), result());
    expect([...store.documents.keys()].some(path => path.includes('structured_nodes'))).toBe(false);
  });

  test('R25 transaction failure exposes no partially authoritative state', async () => {
    const { store, repository } = setup();
    const staging = await repository.stage(identity(), result());
    const before = clone([...store.documents.entries()]);
    store.failNextTransactionBeforeCommit = true;
    await expect(repository.seal('mission_1', 'revision_1', staging.contentIntegrityHash))
      .rejects.toThrow('INJECTED_TRANSACTION_COMMIT_FAILURE');
    expect([...store.documents.entries()]).toEqual(before);
    expect((await store.get(staging.revisionRootPath) as B3RevisionEnvelope).state)
      .toBe(B3_REVISION_STATE_STAGING);
  });

  test('R26 deterministic revision replay returns stable authority identities', async () => {
    const { repository } = setup();
    const first = await repository.persistAuthoritatively(identity(), result());
    const replay = await repository.persistAuthoritatively(identity(), result());
    expect(replay).toMatchObject({
      status: 'IDEMPOTENT_REUSE',
      missionId: first.missionId,
      revisionId: first.revisionId,
      contentIntegrityHash: first.contentIntegrityHash,
      idempotencyIdentity: first.idempotencyIdentity,
      revisionState: first.revisionState,
    });
  });
});
