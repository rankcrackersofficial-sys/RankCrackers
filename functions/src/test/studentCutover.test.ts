const { projectSyllabusToStudentReader } = require('../workers/projectionAdapterWorker');

describe('Student Reader V1 -> V2 Cutover Suite', () => {
  const v1Sha = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const v2Sha = 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1';

  test('Cutover rejected while downstream verification is incomplete', async () => {
    const slotDataIncomplete = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: v2Sha,
      activationEpoch: 2,
      downstreamVerificationComplete: false
    };

    const mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => slotDataIncomplete
          })
        }))
      }))
    };

    const res = await projectSyllabusToStudentReader(mockDb as any, {
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v2',
      sourceSha256: v2Sha,
      activationEpoch: 2
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe('DOWNSTREAM_VERIFICATION_INCOMPLETE');
    expect(res.projectedNodesCount).toBe(0);
  });

  test('Cutover succeeds atomically when downstream verification is complete', async () => {
    const slotDataComplete = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: v2Sha,
      activationEpoch: 2,
      downstreamVerificationComplete: true
    };

    const mockProjDocs = [
      { id: 'sub_phys', data: () => ({ id: 'sub_phys', nodeType: 'subject', canonicalTitle: 'Physics', subjectId: 'Physics' }) },
      { id: 'unit_01', data: () => ({ id: 'unit_01', nodeType: 'unit', canonicalTitle: 'Kinematics', subjectId: 'Physics' }) },
      { id: 'top_01', data: () => ({ id: 'top_01', nodeType: 'topic', canonicalTitle: 'Motion in 1D', subjectId: 'Physics', parentId: 'unit_01' }) }
    ];

    const batchSetFn = jest.fn();
    const batchCommitFn = jest.fn().mockResolvedValue(true);

    const mockDb = {
      collection: jest.fn((coll: string) => ({
        doc: jest.fn(() => ({
          get: jest.fn().mockResolvedValue({
            exists: true,
            data: () => slotDataComplete
          })
        })),
        where: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue({
            empty: false,
            docs: mockProjDocs
          })
        })
      })),
      batch: jest.fn(() => ({
        set: batchSetFn,
        commit: batchCommitFn
      }))
    };

    const res = await projectSyllabusToStudentReader(mockDb as any, {
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v2',
      sourceSha256: v2Sha,
      activationEpoch: 2
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe('STUDENT_READER_CUTOVER_COMPLETE');
    expect(res.projectedNodesCount).toBe(3);

    // Verify all projected nodes receive exact expected Student reader shape
    expect(batchSetFn).toHaveBeenCalledTimes(3);
    const projectedSample = batchSetFn.mock.calls[0][1];
    expect(projectedSample.paperId).toBe('PAPER_1');
    expect(projectedSample.runId).toBe('run_jee_full_materialization');
    expect(projectedSample.sourceVersionId).toBe('srcv_v2');
  });
});
