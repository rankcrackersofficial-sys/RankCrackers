import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import { StaleLeaseRecoveryOrchestrator } from '../academicFactory/services/staleLeaseRecoveryOrchestrator';
import * as admin from 'firebase-admin';

// Mock Firebase Admin
jest.mock('firebase-admin', () => {
  const mockFirestore = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    runTransaction: jest.fn(),
  };
  return {
    firestore: Object.assign(() => mockFirestore, {
      FieldValue: {
        serverTimestamp: jest.fn(),
        increment: jest.fn(),
      },
      Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() })),
        fromDate: jest.fn((d: Date) => ({ toMillis: () => d.getTime() })),
      },
    }),
  };
});

describe('🔱 STALE LEASE RECOVERY', () => {
  let orchestrator: StaleLeaseRecoveryOrchestrator;
  let mockDb: any;

  beforeEach(() => {
    orchestrator = new StaleLeaseRecoveryOrchestrator();
    mockDb = admin.firestore();
    jest.clearAllMocks();
  });

  test('🛡️ performRecovery identifies and resets expired leases', async () => {
    // 1. Setup mock data
    const expiredKeys = ['job-1', 'job-2'];
    mockDb.get.mockResolvedValueOnce({
      docs: expiredKeys.map(id => ({ id }))
    });

    // 2. Mock successful recovery for each key
    // AafQueueRepository.recoverExpiredLease uses runTransaction
    mockDb.runTransaction.mockResolvedValue(true);

    // 3. Execute orchestrator
    const result = await orchestrator.performRecovery();

    // 4. Assertions
    expect(result.recovered).toBe(2);
    expect(result.errors).toBe(0);
    expect(mockDb.collection).toHaveBeenCalledWith('ai_queue');
    expect(mockDb.where).toHaveBeenCalledWith('state', 'in', ['leased', 'running']);
  });

  test('🛡️ performRecovery handles state changes gracefully', async () => {
    // 1. Setup mock data (1 expired)
    mockDb.get.mockResolvedValueOnce({
      docs: [{ id: 'job-1' }]
    });

    // 2. Mock transaction returning false (e.g. lease already reset or claimed)
    mockDb.runTransaction.mockResolvedValue(false);

    // 3. Execute
    const result = await orchestrator.performRecovery();

    // 4. Assertions
    expect(result.recovered).toBe(0);
    expect(result.errors).toBe(0);
  });
});
