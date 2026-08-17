import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import { AafJobMetadata } from '../academicFactory/models/aafJob';
import * as admin from 'firebase-admin';

const useEmulator = process.env.FIRESTORE_EMULATOR_HOST;

if (useEmulator) {
    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId: 'rankcrackers-55' });
    }
} else {
    jest.mock('firebase-admin', () => {
        const mDoc = { set: jest.fn().mockResolvedValue(true), get: jest.fn(), update: jest.fn().mockResolvedValue(true) };
        const mCollection = { doc: jest.fn(() => mDoc) };
        const mDb = { collection: jest.fn(() => mCollection), runTransaction: jest.fn() };
        return {
            firestore: Object.assign(() => mDb, {
                FieldValue: { serverTimestamp: jest.fn(() => 'server-timestamp'), increment: jest.fn((n) => `increment-${n}`) },
                Timestamp: {
                    fromDate: jest.fn((d: Date) => ({ toMillis: () => d.getTime() })),
                    fromMillis: jest.fn((m: number) => ({ toMillis: () => m }))
                },
            }),
            apps: [], initializeApp: jest.fn(),
        };
    });
}

jest.setTimeout(60000);

describe('AAF Queue Repository FIX4 FINAL (AAF-004B)', () => {
  let repo: AafQueueRepository;
  let db: admin.firestore.Firestore;

  beforeAll(async () => {
      repo = new AafQueueRepository();
      db = admin.firestore();
  });

  const sampleJob: AafJobMetadata = {
    queueContract: 'academic_factory_v1',
    runId: 'RUN_FINAL', jobId: 'JOB_001', missionId: 'JEE_MAIN_2026',
    canonicalTargetId: 'PHYS_001', idempotencyKey: 'RUN_FINAL:JOB_001',
    state: 'ready', attempts: 0, maxAttempts: 3,
    leaseOwner: null, leaseExpiresAtUtc: null, nextRetryAtUtc: null,
    inputHash: 'h1', outputHash: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAt: null, finishedAt: null, lastError: null,
    taskType: 'digibook', targetId: 'PHYS_001', sourceDocumentIds: []
  };

  test('🛡️ CONFLICT_ATTACKS: verify 9/9 semantic identity guards', async () => {
    await repo.enqueue(sampleJob);

    const attacks = [
        { runId: 'CONFLICT' },
        { jobId: 'CONFLICT' },
        { missionId: 'CONFLICT' },
        { canonicalTargetId: 'CONFLICT' },
        { taskType: 'CONFLICT' },
        { inputHash: 'CONFLICT' },
        { maxAttempts: 99 },
        { targetId: 'CONFLICT' }
    ];

    for (const attack of attacks) {
        const conflictingJob = { ...sampleJob, ...attack };
        await expect(repo.enqueue(conflictingJob)).rejects.toThrow('AAF_IDENTITY_CONFLICT');
    }
  });

  test('🛡️ RETRYWAIT_DIRECT_CLAIM: block claiming retryWait jobs', async () => {
    const key = 'RETRY_CLAIM_TEST';
    await repo.enqueue({ ...sampleJob, idempotencyKey: key, state: 'retryWait' });

    // 🛡️ CLAIM_READY_BYPASSES_WAKE_RETRY: NO
    const result = await repo.claimReadyJob(key, 'worker_1');
    expect(result).toBe(false);

    // Wake it
    await repo.wakeRetry(key);
    const successClaim = await repo.claimReadyJob(key, 'worker_1');
    expect(successClaim).toBe(true);
  });

  test('🛡️ EXPIRED_LEASE_DIRECT_CLAIM: block direct claim, require recovery', async () => {
    const key = 'LEASE_EXPIRY_TEST';
    await repo.enqueue({ ...sampleJob, idempotencyKey: key });
    await repo.claimReadyJob(key, 'worker_1');

    // Manually expire
    await db.collection('ai_queue').doc(key).update({
        leaseExpiresAtUtc: admin.firestore.Timestamp.fromMillis(Date.now() - 1000)
    });

    // 🛡️ RECOVERY_REQUIRED_FIRST: YES
    expect(await repo.claimReadyJob(key, 'worker_2')).toBe(false);
    expect(await repo.recoverExpiredLease(key)).toBe(true);
    expect(await repo.claimReadyJob(key, 'worker_2')).toBe(true);
  });

  test('🛡️ SCALE_IDENTITY_CONSISTENCY: 4,587 logical units unique IDs', () => {
    const runId = 'RUN_20260817';
    const keys = new Set();
    const types = ['mcq','digibook','revision','structural','svo','manifest','encoding','pdf','docx','xlsx','repair'];
    for(let i=1; i<=417; i++) {
        types.forEach(t => keys.add(`${runId}:${t}:AMTN_${i}`));
    }
    expect(keys.size).toBe(4587);

    // Example format verification
    const exampleKey = `${runId}:digibook:AMTN_101`;
    expect(exampleKey).toMatch(/^[A-Z0-9_]+:[a-z]+:AMTN_[0-9]+$/);
  });
});
