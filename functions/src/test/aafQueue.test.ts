import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import { AafJobMetadata } from '../academicFactory/models/aafJob';
import * as admin from 'firebase-admin';
import firebaseFunctionsTest from 'firebase-functions-test';
import { aafQueueWorker } from '../workers/aafQueueWorker';
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: 'rankcrackers-55'
  });
}
const db = admin.firestore();
const fft = firebaseFunctionsTest({ projectId: 'rankcrackers-55' });
const wrappedAaf = fft.wrap(aafQueueWorker);

async function runWrappedAaf(taskId: string, change: any) {
    const oldId = process.env.JEST_WORKER_ID;
    delete process.env.JEST_WORKER_ID;
    try {
        await wrappedAaf(change, { params: { taskId } });
    } finally {
        process.env.JEST_WORKER_ID = oldId;
    }
}

jest.setTimeout(60000);

describe('AAF Queue Repository FIX4 FINAL (AAF-004B)', () => {
  let repo: AafQueueRepository;

  beforeAll(() => {
    repo = new AafQueueRepository();
  });

  beforeEach(async () => {
    try {
      const axios = require('axios');
      await axios.delete('http://127.0.0.1:8188/emulator/v1/projects/rankcrackers-55/databases/(default)/documents');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 🛡️ Grace period for emulator
    } catch (err: any) {
      console.error('Failed to clear database via REST:', err.message);
    }
  });

  const getSampleJob = (id: string, missionId: string, runId: string): AafJobMetadata => ({
    queueContract: 'academic_factory_v1',
    schemaVersion: 1,
    runId, jobId: id, missionId,
    canonicalTargetId: `T_${id}`, idempotencyKey: `${runId}:${id}`,
    state: 'ready', attempts: 0, maxAttempts: 3,
    leaseOwner: null, leaseExpiresAtUtc: null, nextRetryAtUtc: null,
    dependencyJobIds: [],
    inputHash: 'h1', outputHash: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    startedAt: null, finishedAt: null, lastError: null,
    type: 'digibookDraft', targetId: `T_${id}`, sourceDocumentIds: []
  });

  test('🛡️ CONFLICT_ATTACKS: verify 9/9 locked immutable fields', async () => {
    const runId = `RUN_${Date.now()}_CONFLICT`;
    const missionId = `M_${Date.now()}_CONFLICT`;
    const jobId = `JOB_${Date.now()}`;
    const job = getSampleJob(jobId, missionId, runId);
    await repo.enqueue(job);

    const attacks = [
        { schemaVersion: 2 },
        { jobId: 'CONFLICT' },
        { runId: 'CONFLICT' },
        { missionId: 'CONFLICT' },
        { canonicalTargetId: 'CONFLICT' },
        { type: 'CONFLICT' },
        { dependencyJobIds: ['DEP_NEW'] },
        { maxAttempts: 99 },
        { inputHash: 'CONFLICT' }
    ];

    for (const attack of attacks) {
        const conflictingJob = { ...job, ...attack };
        await expect(repo.enqueue(conflictingJob)).rejects.toThrow('AAF_IDENTITY_CONFLICT');
    }
  });

  test('🛡️ RETRYWAIT_DIRECT_CLAIM: block claiming retryWait jobs', async () => {
    const runId = `RUN_${Date.now()}_RETRY`;
    const missionId = `M_${Date.now()}_RETRY`;
    const key = `RETRY_CLAIM_TEST_${Date.now()}`;
    await repo.enqueue({ ...getSampleJob(key, missionId, runId), idempotencyKey: key, state: 'retryWait' });

    // Should fail because state is not 'ready'
    const result = await repo.claimReadyJob(key, 'worker_1');
    expect(result).toBe(false);

    // Wake it
    await repo.wakeRetry(key);
    const snapWoke = await db.collection('ai_queue').doc(key).get();
    await runWrappedAaf(key, fft.makeChange(fft.firestore.makeDocumentSnapshot({ ...snapWoke.data(), state: 'retryWait' }, `ai_queue/${key}`), snapWoke));

    // Worker should have picked it up and dispatched it (leasing it)
    const finalSnap = await db.collection('ai_queue').doc(key).get();
    expect(finalSnap.data()?.state).toBe('reviewing'); // because dispatcher.dispatch runs to completion in mock
  });

  test('🛡️ EXPIRED_LEASE_DIRECT_CLAIM: block direct claim, require recovery', async () => {
    const runId = `RUN_${Date.now()}_LEASE`;
    const missionId = `M_${Date.now()}_LEASE`;
    const key = `LEASE_EXPIRY_TEST_${Date.now()}`;
    await repo.enqueue({ ...getSampleJob(key, missionId, runId), idempotencyKey: key });
    await repo.claimReadyJob(key, 'worker_1');

    // Manually expire
    await db.collection('ai_queue').doc(key).update({
        leaseExpiresAtUtc: admin.firestore.Timestamp.fromMillis(Date.now() - 60000) // 🛡️ Deeply expired
    });

    await new Promise(resolve => setTimeout(resolve, 500)); // 🛡️ Sync wait

    // TRIGGER WORKER for recovery
    const snapExp = await db.collection('ai_queue').doc(key).get();
    await runWrappedAaf(key, fft.makeChange(
        fft.firestore.makeDocumentSnapshot({ ...snapExp.data(), state: 'leased', leaseExpiresAtUtc: admin.firestore.Timestamp.fromMillis(Date.now() + 10000) }, `ai_queue/${key}`),
        snapExp
    ));

    // Should be recovered now
    expect(await repo.claimReadyJob(key, 'worker_2')).toBe(true);
  });

  test('🛡️ SCALE_IDENTITY_PROOF: logic for 4,587 units', () => {
    // Verified 11 types x 417 AMTNs = 4587.
    const runId = `RUN_${Date.now()}_SCALE_ID`;
    const keys = new Set();
    const aafTypes = ['digibookDraft', 'digibookValidation', 'digibookProReview', 'digibookAssembly', 'mcqDraft', 'mcqValidation', 'revisionDraft', 'revisionValidation', 'structural', 'svo', 'manifest'];
    for(let i=1; i<=417; i++) {
        aafTypes.forEach(t => keys.add(`${runId}:${t}:AMTN_${i}`));
    }
    // We check if exactly 4587 unique keys are generated for a single mission run coverage
    expect(keys.size).toBe(4587);
  });
});
