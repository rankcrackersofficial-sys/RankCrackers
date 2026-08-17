import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import * as admin from 'firebase-admin';

// 🛡️ Mock implementation for admin.firestore
jest.mock('firebase-admin', () => {
  const mDoc = {
    set: jest.fn().mockResolvedValue(true),
    get: jest.fn(),
    update: jest.fn().mockResolvedValue(true),
  };
  const mCollection = {
    doc: jest.fn(() => mDoc),
  };
  const mDb = {
    collection: jest.fn(() => mCollection),
    runTransaction: jest.fn(),
  };
  return {
    firestore: Object.assign(() => mDb, {
      FieldValue: {
        serverTimestamp: jest.fn(() => 'server-timestamp'),
        increment: jest.fn((n) => `increment-${n}`),
      },
      Timestamp: {
        fromDate: jest.fn((d: Date) => ({ toMillis: () => d.getTime() })),
        fromMillis: jest.fn((m: number) => ({ toMillis: () => m })),
      },
    }),
  };
});

describe('AAF Queue Repository FIX1 (AAF-004B)', () => {
  let repo: AafQueueRepository;
  let db: any;

  beforeEach(() => {
    repo = new AafQueueRepository();
    db = (admin.firestore as unknown as () => any)();
    jest.clearAllMocks();
  });

  test('🛡️ REPOSITORY_UNIT_TESTS: enqueue new job', async () => {
    const job = {
      idempotencyKey: 'run1:job1',
      runId: 'run1',
      jobId: 'job1',
      canonicalTargetId: 'atom1',
      taskType: 'test'
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue({ exists: false }),
      set: jest.fn()
    };
    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    await repo.enqueue(job as any);

    expect(mockTransaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        idempotencyKey: 'run1:job1',
        queueContract: 'academic_factory_v1',
        state: 'PLANNED'
      })
    );
  });

  test('🛡️ SCALE_IDENTITY_TESTS: enqueue should detect identity conflict', async () => {
    const job = {
      idempotencyKey: 'run1:job1',
      runId: 'run1',
      jobId: 'job1',
      canonicalTargetId: 'atom2' // CONFLICT: Same key, different target
    };

    const mockSnap = {
      exists: true,
      data: () => ({
        runId: 'run1',
        jobId: 'job1',
        canonicalTargetId: 'atom1'
      })
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockSnap),
      update: jest.fn()
    };
    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    await expect(repo.enqueue(job as any)).rejects.toThrow('AAF_SEMANTIC_CONFLICT');
  });

  test('🛡️ REPOSITORY_UNIT_TESTS: claim should transition READY -> RUNNING', async () => {
    const mockSnap = {
      exists: true,
      data: () => ({
        state: 'READY',
        attempts: 0
      })
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockSnap),
      update: jest.fn()
    };
    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    const result = await repo.claim('run1:job1', 'worker1');

    expect(result).toBe(true);
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        state: 'RUNNING',
        leaseOwner: 'worker1'
      })
    );
  });

  test('🛡️ EMULATOR_TRANSACTION_TESTS: concurrent claim blocked by active lease', async () => {
    const futureDate = Date.now() + 100000;
    const mockSnap = {
      exists: true,
      data: () => ({
        state: 'READY',
        leaseExpiresAtUtc: { toMillis: () => futureDate }
      })
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockSnap),
      update: jest.fn()
    };
    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    const result = await repo.claim('run1:job1', 'worker2');

    expect(result).toBe(false);
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });

  test('🛡️ REPOSITORY_UNIT_TESTS: fail should transition to REPAIR_PENDING if attempts < max', async () => {
    const mockSnap = {
      exists: true,
      data: () => ({
        attempts: 1,
        maxAttempts: 3
      })
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockSnap),
      update: jest.fn()
    };
    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    await repo.fail('run1:job1', 'Test Error');

    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        state: 'REPAIR_PENDING',
        lastError: 'Test Error'
      })
    );
  });
});
