jest.mock('firebase-admin', () => {
  const firestore = Object.assign(jest.fn(() => ({})), {
    FieldValue: { serverTimestamp: jest.fn(() => 'server-time') },
  });
  return { apps: [{}], initializeApp: jest.fn(), firestore };
});

import { aafJobRegistry } from '../academicFactory/core/aafJobRegistry';
import {
  B3CompletionProofStore,
  createSyllabusB3AafWorker,
  deterministicB3CompletionProofHash,
  FirestoreB3CompletionProofStore,
  SyllabusB3AafJob,
} from '../academicFactory/workers/syllabusB3AafWorker';
import { routeAafTask, isLegacyGenericTask } from '../workers/queueWorker';
import { B3_CONTRACT_VERSION } from '../syllabus/b3Contract';

const proof: any = {
  proofType: 'B3_EXECUTOR_COMPLETION_PROOF',
  missionId: 'mission_1',
  revisionId: 'revision_1',
  authoritativeSourceChainId: 'chain_1',
  orderedSources: [{
    sourceId: 'source_1', documentId: 'document_1',
    sourceVersionId: 'version_1', sourceSha256: 'sha_1',
  }],
  verifiedExtractionIds: ['extraction_1'],
  contractVersion: B3_CONTRACT_VERSION,
  sealedPersistenceStatus: 'SEALED',
  persistenceContentIntegrityHash: 'content_hash',
  persistenceIdempotencyIdentity: 'persistence_identity',
  canonicalNodeIds: ['node_1'],
  unresolvedEvidenceIds: [],
  unresolvedRequiredEvidenceIds: [],
  materializationManifestHash: 'manifest_hash',
  lineageIntegrityHash: 'lineage_hash',
  materializerCompletionEligibility: { eligible: true, unresolvedRequiredEvidenceIds: [] },
};

function validJob(): SyllabusB3AafJob {
  return {
    queueContract: 'academic_factory_v1', schemaVersion: 1,
    runId: 'run_1', jobId: 'queue_job_1', missionId: 'mission_1',
    canonicalTargetId: 'target_1', idempotencyKey: 'idem_1', state: 'running',
    attempts: 2, maxAttempts: 3, leaseOwner: 'worker_1', leaseExpiresAtUtc: null,
    nextRetryAtUtc: null, dependencyJobIds: [], inputHash: 'input_hash', outputHash: null,
    createdAt: new Date() as any, updatedAt: new Date() as any,
    startedAt: null, finishedAt: null, lastError: null,
    type: 'SYLLABUS_B3', targetId: 'target_1', sourceDocumentIds: ['document_1'],
    b3ExecutorInput: {
      revisionIdentity: {
        missionId: 'mission_1', authoritativeSourceChainId: 'chain_1',
        orderedSources: [{
          sourceId: 'source_1', documentId: 'document_1',
          sourceVersionId: 'version_1', sourceSha256: 'sha_1',
        }],
        verifiedExtractionIds: ['extraction_1'], contractVersion: B3_CONTRACT_VERSION,
        revisionId: 'revision_1',
      },
      materializationInput: {
        contractVersion: B3_CONTRACT_VERSION,
        evidence: [{ evidenceId: 'evidence_1' }] as any,
        declaredCompletenessScope: {
          requiredEvidenceIds: ['evidence_1'],
          requireExactFiveLevelCoverage: false,
        },
      },
    },
  };
}

function successfulExecutor(inputCapture: any[] = []) {
  return {
    execute: jest.fn(async input => {
      inputCapture.push(input);
      return { completed: true, status: 'SEALED_AUTHORITATIVE', materializationResult: {}, completionProof: proof } as any;
    }),
  };
}

function memoryProofStore(): B3CompletionProofStore & { calls: any[] } {
  const calls: any[] = [];
  return { calls, persist: async (...args: any[]) => { calls.push(args); } };
}

describe('Phase-2D R2 governed AAF runtime bridge', () => {
  test('R01-R06 AAF route is exclusive and legacy classification remains disjoint', async () => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    expect(await routeAafTask({ queueContract: 'academic_factory_v1', type: 'mcq' }, 'id', 'worker', { dispatch }))
      .toBe(true);
    expect(dispatch).toHaveBeenCalledWith('id', 'worker');
    expect(isLegacyGenericTask({ queueContract: 'academic_factory_v1', type: 'mcq' })).toBe(false);
    expect(await routeAafTask({ type: 'mcq' }, 'id', 'worker', { dispatch })).toBe(false);
    for (const type of ['mcq', 'digibook', 'revision']) expect(isLegacyGenericTask({ type })).toBe(true);
  });

  test('R07-R08 SYLLABUS_B3 handler is quarantined / unreachable until R3B2 launch authority', () => {
    expect(aafJobRegistry.getHandler('SYLLABUS_B3')).toBeUndefined();
    expect(aafJobRegistry.getHandler('SYLLABUS_B3_PREPARE')).toBeUndefined();
    expect(aafJobRegistry.getHandler('SYLLABUS_B3_EXECUTE')).toBeUndefined();
    expect(aafJobRegistry.getHandler('SYLLABUS_B3_COMPLETE')).toBeUndefined();
  });

  test('R09-R14 typed authority validation fails closed before executor', async () => {
    const mutations: Array<(job: any) => void> = [
      job => { delete job.b3ExecutorInput; },
      job => { job.b3ExecutorInput.revisionIdentity.missionId = ''; },
      job => { job.b3ExecutorInput.revisionIdentity.orderedSources = []; },
      job => { job.b3ExecutorInput.revisionIdentity.verifiedExtractionIds = []; },
      job => { job.b3ExecutorInput.revisionIdentity.contractVersion = 'wrong'; },
      job => { job.b3ExecutorInput.revisionIdentity.revisionId = ''; },
    ];
    for (const mutate of mutations) {
      const executor = successfulExecutor();
      const job: any = validJob();
      mutate(job);
      expect((await createSyllabusB3AafWorker(executor, memoryProofStore())(job)).success).toBe(false);
      expect(executor.execute).not.toHaveBeenCalled();
    }
  });

  test('R15-R24 authority is not inferred and exact executor input is reused unchanged', async () => {
    const captured: any[] = [];
    const executor = successfulExecutor(captured);
    const job = validJob();
    (job as any).title = 'different revision title';
    const result = await createSyllabusB3AafWorker(executor, memoryProofStore())(job);
    expect(result.success).toBe(true);
    expect(captured[0]).toBe(job.b3ExecutorInput);
    expect(job.b3ExecutorInput.revisionIdentity.revisionId).toBe('revision_1');
    expect(job.jobId).not.toBe(job.b3ExecutorInput.revisionIdentity.revisionId);
    expect(job.attempts.toString()).not.toBe(job.b3ExecutorInput.revisionIdentity.revisionId);
  });

  test('R25-R28 retry/redelivery preserves revision and deterministic exact-proof hash', async () => {
    const job = validJob();
    const store = memoryProofStore();
    const worker = createSyllabusB3AafWorker(successfulExecutor(), store);
    const first = await worker(job);
    const replay = await worker({ ...job, attempts: job.attempts + 1 });
    expect(first.outputHash).toBe(replay.outputHash);
    expect(first.outputHash).toBe(deterministicB3CompletionProofHash(proof));
    expect(store.calls[0][1]).toBe(proof);
    expect(store.calls[1][0].b3ExecutorInput.revisionIdentity.revisionId).toBe('revision_1');
  });

  test('R29 identical existing proof is reused without a write', async () => {
    const update = jest.fn();
    const job = { ...validJob(), b3CompletionProof: proof, b3CompletionProofHash: deterministicB3CompletionProofHash(proof) };
    const db: any = fakeDb(job, update);
    await expect(new FirestoreB3CompletionProofStore(db).persist(job, proof, job.b3CompletionProofHash))
      .resolves.toBeUndefined();
    expect(update).not.toHaveBeenCalled();
  });

  test('R30 incompatible existing proof fails closed', async () => {
    const update = jest.fn();
    const job = { ...validJob(), b3CompletionProof: { ...proof, revisionId: 'other' }, b3CompletionProofHash: 'other' };
    const db: any = fakeDb(job, update);
    await expect(new FirestoreB3CompletionProofStore(db).persist(job, proof, deterministicB3CompletionProofHash(proof)))
      .rejects.toThrow('B3_COMPLETION_PROOF_CONFLICT');
    expect(update).not.toHaveBeenCalled();
  });

  test('R31-R33 proof handoff writes proof only; dispatcher owns reviewing transition', async () => {
    const update = jest.fn();
    const job = validJob();
    const db: any = fakeDb(job, update);
    const hash = deterministicB3CompletionProofHash(proof);
    await new FirestoreB3CompletionProofStore(db).persist(job, proof, hash);
    expect(update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      b3CompletionProof: proof, b3CompletionProofHash: hash,
    }));
    expect(update.mock.calls[0][1]).not.toHaveProperty('state');
    expect(JSON.stringify(update.mock.calls[0][1])).not.toContain('B3_COMPLETE');
  });

  test('R43-R46 AAF dispatcher remains the exclusive route dependency', async () => {
    const dispatch = jest.fn().mockResolvedValue(undefined);
    await routeAafTask(validJob(), 'idem_1', 'worker_1', { dispatch });
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  test('R47-R50 executor or proof failure cannot become operational success', async () => {
    const failedExecutor = { execute: jest.fn(async () => ({ completed: false, status: 'PERSISTENCE_CONFLICT', reason: 'conflict' } as any)) };
    expect(await createSyllabusB3AafWorker(failedExecutor, memoryProofStore())(validJob()))
      .toMatchObject({ success: false, outputHash: '' });
    const rejectingStore: B3CompletionProofStore = { persist: async () => { throw new Error('firestore failure'); } };
    expect(await createSyllabusB3AafWorker(successfulExecutor(), rejectingStore)(validJob()))
      .toMatchObject({ success: false, error: 'firestore failure' });
  });
});

function fakeDb(current: any, update: jest.Mock) {
  const ref = { id: current.idempotencyKey };
  return {
    collection: () => ({ doc: () => ref }),
    runTransaction: async (work: any) => work({
      get: async () => ({ exists: true, data: () => current }),
      update,
    }),
  };
}
