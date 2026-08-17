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

describe('AAF Queue Repository (AAF-004B)', () => {
  let repo: AafQueueRepository;
  let db: any;

  beforeEach(() => {
    repo = new AafQueueRepository();
    db = (admin.firestore as unknown as () => any)();
    jest.clearAllMocks();
  });

  test('🛡️ enqueue: should use idempotencyKey as document ID', async () => {
    const job = { idempotencyKey: 'key123', missionId: 'm1', taskType: 'test' };
    await repo.enqueue(job as any);

    expect(db.collection).toHaveBeenCalledWith('ai_queue');
    expect(db.collection().doc).toHaveBeenCalledWith('key123');
    expect(db.collection().doc().set).toHaveBeenCalledWith(
      expect.objectContaining({
        idempotencyKey: 'key123',
        queueContract: 'academic_factory_v1',
        status: 'ready'
      }),
      { merge: true }
    );
  });

  test('🛡️ complete: should update status to completed', async () => {
    await repo.complete('key123', 'hash456');

    expect(db.collection().doc().update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        outputHash: 'hash456',
        leaseOwner: null
      })
    );
  });

  test('🛡️ claim: should handle atomic claim via transaction', async () => {
    const mockSnap = {
      exists: true,
      data: () => ({
        status: 'ready',
        attempts: 0
      })
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockSnap),
      update: jest.fn()
    };

    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    const result = await repo.claim('key123', 'worker1');

    expect(result).toBe(true);
    expect(mockTransaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'running',
        leaseOwner: 'worker1'
      })
    );
  });

  test('🛡️ claim: should block concurrent claim if lease active', async () => {
    const futureDate = Date.now() + 100000;
    const mockSnap = {
      exists: true,
      data: () => ({
        status: 'ready',
        leaseExpiry: { toMillis: () => futureDate }
      })
    };

    const mockTransaction = {
      get: jest.fn().mockResolvedValue(mockSnap),
      update: jest.fn()
    };

    db.runTransaction.mockImplementation(async (cb: any) => cb(mockTransaction));

    const result = await repo.claim('key123', 'worker2');

    expect(result).toBe(false);
    expect(mockTransaction.update).not.toHaveBeenCalled();
  });
});
