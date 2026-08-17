import { AafLifecycleService } from '../academicFactory/services/aafLifecycleService';
import { AafDispatcher } from '../academicFactory/core/aafDispatcher';
import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import { aafJobRegistry } from '../academicFactory/core/aafJobRegistry';
import { AafJobMetadata } from '../academicFactory/models/aafJob';
import * as admin from 'firebase-admin';

const useEmulator = process.env.FIRESTORE_EMULATOR_HOST;
if (useEmulator) {
    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId: 'rankcrackers-55' });
    }
}

jest.setTimeout(60000);

describe('AAF Full Governed Orchestration (AAF-004C Hardened)', () => {
  let repo: AafQueueRepository;
  let lifecycle: AafLifecycleService;
  let dispatcher: AafDispatcher;
  let db: admin.firestore.Firestore;

  beforeAll(() => {
    repo = new AafQueueRepository();
    lifecycle = new AafLifecycleService();
    dispatcher = new AafDispatcher();
    db = admin.firestore();
  });

  const baseJob: AafJobMetadata = {
    queueContract: 'academic_factory_v1',
    schemaVersion: 1,
    runId: 'RUN_004C_FIX', jobId: 'JOB_1', missionId: 'M1', canonicalTargetId: 'T1',
    idempotencyKey: 'RUN_004C_FIX:JOB_1',
    state: 'ready', attempts: 0, maxAttempts: 3,
    leaseOwner: null, leaseExpiresAtUtc: null, nextRetryAtUtc: null,
    dependencyJobIds: [], inputHash: 'h1', outputHash: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAt: null, finishedAt: null, lastError: null,
    type: 'digibookDraft', targetId: 'T1', sourceDocumentIds: []
  };

  test('🛡️ ONE_AMTN_STRUCTURAL_CLOSED_LOOP: ready -> leased -> running -> reviewing -> approved', async () => {
    const key = 'CLOSED_LOOP_HARDENED';
    await repo.enqueue({ ...baseJob, idempotencyKey: key, state: 'ready' });

    // Mock handler
    aafJobRegistry.register('digibookDraft', async () => 'artifact_h1');

    // 1. Dispatch: ready -> leased -> running -> (execute) -> reviewing
    await dispatcher.dispatch(key, 'worker_loop');

    let snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('reviewing');
    expect(snap.data()?.outputHash).toBe('artifact_h1');

    // 2. Approve: reviewing -> approved
    await lifecycle.approve(key);
    snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('approved');
    expect(snap.data()?.finishedAt).not.toBeNull();
  });

  test('🛡️ MATERIALIZING_TO_PUBLISHED flow', async () => {
    const key = 'PUB_FLOW';
    await repo.enqueue({ ...baseJob, idempotencyKey: key, state: 'approved' });

    // 1. Mark Materializing
    await lifecycle.markMaterializing(key);
    let snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('materializing');

    // 2. Mark Published
    await lifecycle.markPublished(key);
    snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('published');
  });

  test('🛡️ ILLEGAL_PUBLISH_TRANSITIONS: blocked', async () => {
    const key = 'ILLEGAL_PUB';
    await repo.enqueue({ ...baseJob, idempotencyKey: key, state: 'running' });

    // Cannot publish directly from running
    const ok = await lifecycle.markPublished(key);
    expect(ok).toBe(false);

    const snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('running');
  });

  test('🛡️ ROOT_ACTIVATION: planned -> ready only if no deps', async () => {
    const rootKey = 'ROOT_JOB';
    const leafKey = 'LEAF_JOB';

    await repo.enqueue({ ...baseJob, idempotencyKey: rootKey, state: 'planned', dependencyJobIds: [] });
    await repo.enqueue({ ...baseJob, idempotencyKey: leafKey, state: 'planned', dependencyJobIds: [rootKey] });

    // Activate root succeeds
    expect(await lifecycle.activateRoot(rootKey)).toBe(true);

    // Activate leaf fails (has deps)
    expect(await lifecycle.activateRoot(leafKey)).toBe(false);

    const rootSnap = await db.collection('ai_queue').doc(rootKey).get();
    expect(rootSnap.data()?.state).toBe('ready');
  });

  test('🛡️ DEPENDENCY_UNLOCK: waitingDependency -> ready only if approved', async () => {
    const depKey = 'DEP_1';
    const mainKey = 'MAIN_1';

    await repo.enqueue({ ...baseJob, idempotencyKey: depKey, state: 'ready' });
    await repo.enqueue({ ...baseJob, idempotencyKey: mainKey, state: 'waitingDependency', dependencyJobIds: [depKey] });

    // Unlock fails (dep not approved)
    expect(await lifecycle.checkAndUnlockDependencies(mainKey)).toBe(false);

    // Approve dep
    await repo.claimReadyJob(depKey, 'w');
    await repo.startRunning(depKey, 'w');
    await repo.submitForReview(depKey, 'w', 'h');
    await repo.approveJob(depKey);

    // Unlock succeeds
    expect(await lifecycle.checkAndUnlockDependencies(mainKey)).toBe(true);

    const mainSnap = await db.collection('ai_queue').doc(mainKey).get();
    expect(mainSnap.data()?.state).toBe('ready');
  });

  test('🛡️ RETRY_WAKE_TIMING: block early wake', async () => {
    const key = 'RETRY_TIMING';
    await repo.enqueue({ ...baseJob, idempotencyKey: key, state: 'ready' });
    await repo.claimReadyJob(key, 'w');
    await repo.fail(key, 'err');

    // Should be in retryWait with nextRetryAtUtc in future
    let snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('retryWait');

    // Early wake blocked
    expect(await lifecycle.wakeRetry(key)).toBe(false);

    // Mock time passing
    await db.collection('ai_queue').doc(key).update({
        nextRetryAtUtc: admin.firestore.Timestamp.fromMillis(Date.now() - 1000)
    });

    // Due wake succeeds
    expect(await lifecycle.wakeRetry(key)).toBe(true);
    snap = await db.collection('ai_queue').doc(key).get();
    expect(snap.data()?.state).toBe('ready');
  });
});
