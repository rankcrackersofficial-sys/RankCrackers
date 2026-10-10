const { completeDigiBookVerification, completeCrucibleReconciliation } = require('../workers/downstreamImpactWorker');

describe('DigiBook & Crucible Downstream Impact Completion Suite', () => {
  const validSha = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';

  function createMockDb(mockSlotData: any) {
    const docMock = (docId: string) => ({
      get: jest.fn().mockResolvedValue({
        exists: true,
        data: () => (docId.includes('slot') ? mockSlotData : { status: 'RECONCILED_COMPLETE' })
      }),
      set: jest.fn().mockResolvedValue(true),
      collection: jest.fn((subColl: string) => ({
        doc: docMock
      }))
    });

    return {
      collection: jest.fn((coll: string) => ({
        doc: docMock
      }))
    };
  }

  test('DigiBook verification completion is source guarded', async () => {
    const mockSlotData = {
      canonicalVersionId: 'srcv_v1',
      canonicalSha256: validSha,
      activationEpoch: 1
    };

    const mockDb = createMockDb(mockSlotData);

    const res = await completeDigiBookVerification(mockDb as any, {
      eventId: 'evt_001',
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 1,
      verificationStatus: 'VERIFIED',
      verifiedBy: 'founder_01'
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('VERIFIED_COMPLETE');
  });

  test('Failed DigiBook verification cannot unlock publish', async () => {
    const mockSlotData = {
      canonicalVersionId: 'srcv_v1',
      canonicalSha256: validSha,
      activationEpoch: 1
    };

    const mockDb = createMockDb(mockSlotData);

    const res = await completeDigiBookVerification(mockDb as any, {
      eventId: 'evt_001',
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 1,
      verificationStatus: 'FAILED',
      verifiedBy: 'sme_01'
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('VERIFICATION_FAILED');
    expect(res.downstreamUnlocked).toBe(false);
  });

  test('Unsafe Crucible historical rewrite is blocked', async () => {
    const mockSlotData = {
      canonicalVersionId: 'srcv_v1',
      canonicalSha256: validSha,
      activationEpoch: 1
    };

    const mockDb = createMockDb(mockSlotData);

    const res = await completeCrucibleReconciliation(mockDb as any, {
      eventId: 'evt_001',
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 1,
      mutatedHistoryAttempted: true,
      reconciliationStatus: 'SUCCESS',
      reconciledBy: 'sme_01'
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('UNSAFE_REWRITE_BLOCKED');
    expect(res.downstreamUnlocked).toBe(false);
  });

  test('Stale DigiBook or Crucible completion callback is rejected', async () => {
    const mockSlotData = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: validSha,
      activationEpoch: 2
    };

    const mockDb = createMockDb(mockSlotData);

    const res = await completeDigiBookVerification(mockDb as any, {
      eventId: 'evt_001',
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 1,
      verificationStatus: 'VERIFIED',
      verifiedBy: 'sme_01'
    });

    expect(res.success).toBe(false);
    expect(res.status).toContain('STALE_AUTHORITY');
  });
});
