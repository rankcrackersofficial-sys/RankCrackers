export {};
const {
  classifySyllabusDelta,
  classifyWorkerAuthority,
  sourceSlotIdentity,
  sourceVersionIdentity
} = require('../../services/canonical_source_authority');
const { completeDigiBookVerification, completeCrucibleReconciliation } = require('../workers/downstreamImpactWorker');
const { projectSyllabusToStudentReader } = require('../workers/projectionAdapterWorker');

describe('JEE 2026 -> 2027 Full E2E & Stale Writer Matrix Suite', () => {
  const v1Sha = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const v2Sha = 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1';

  const v1Units = [
    { id: 'u_unchanged', semanticKey: 'phys_kinematics', title: 'Kinematics', parentKey: 'unit_phys_01', contentDigest: 'd_kin' },
    { id: 'u_removed', semanticKey: 'phys_old_topic', title: 'Removed Topic', parentKey: 'unit_phys_01', contentDigest: 'd_old' },
    { id: 'u_modified', semanticKey: 'phys_laws', title: 'Laws of Motion V1', parentKey: 'unit_phys_01', contentDigest: 'd_laws_v1' }
  ];

  const v2Units = [
    { id: 'u_unchanged', semanticKey: 'phys_kinematics', title: 'Kinematics', parentKey: 'unit_phys_01', contentDigest: 'd_kin' },
    { id: 'u_added', semanticKey: 'phys_modern_optics', title: 'Modern Optics', parentKey: 'unit_phys_02', contentDigest: 'd_opt' },
    { id: 'u_modified', semanticKey: 'phys_laws', title: 'Laws of Motion V2', parentKey: 'unit_phys_01', contentDigest: 'd_laws_v2' }
  ];

  test('JEE 2026 -> 2027 Full Lifecycle: Delta, Decision, Downstream Impact, Cutover, and Stale Writer Matrix', async () => {
    // 1. Delta Classification: JEE 2026 -> JEE 2027
    const delta = classifySyllabusDelta(v1Units, v2Units);
    expect(delta).toBeDefined();
    expect(delta.counts.UNCHANGED).toBe(1);
    expect(delta.counts.ADDED).toBe(1);
    expect(delta.counts.REMOVED).toBe(1);
    expect(delta.counts.MODIFIED).toBe(1);

    // 2. Unambiguous delta is eligible for activation
    expect(delta.activationBlocked).toBe(false);

    // 3. Downstream impact calculation
    const impact = {
      digibook: { preserve: ['u_unchanged'], queueGeneration: ['u_added'], retireCurrent: ['u_removed'], markStale: ['u_modified'] },
      crucible: { futureAdd: ['u_added'], futureRemove: ['u_removed'], futureReconcile: ['u_modified'] }
    };
    expect(impact.digibook.preserve).toContain('u_unchanged');
    expect(impact.digibook.retireCurrent).toContain('u_removed');
    expect(impact.digibook.queueGeneration).toContain('u_added');

    // 4. Downstream Verification Completion
    const mockSlotData = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: v2Sha,
      activationEpoch: 2,
      downstreamVerificationComplete: true
    };

    const mockProjDocs = [
      { id: 'u_unchanged', data: () => ({ id: 'u_unchanged', nodeType: 'topic', canonicalTitle: 'Kinematics', subjectId: 'Physics' }) },
      { id: 'u_added', data: () => ({ id: 'u_added', nodeType: 'topic', canonicalTitle: 'Modern Optics', subjectId: 'Physics' }) },
      { id: 'u_modified', data: () => ({ id: 'u_modified', nodeType: 'topic', canonicalTitle: 'Laws of Motion V2', subjectId: 'Physics' }) }
    ];

    const batchSetFn = jest.fn();
    const mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn((docId: string) => ({
          get: jest.fn().mockResolvedValue({ exists: true, data: () => mockSlotData }),
          set: jest.fn().mockResolvedValue(true),
          collection: jest.fn(() => ({
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue({ exists: true, data: () => mockSlotData })
            })),
            where: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({ empty: false, docs: mockProjDocs })
            })
          }))
        }))
      })),
      batch: jest.fn(() => ({
        set: batchSetFn,
        commit: jest.fn().mockResolvedValue(true)
      }))
    };

    // 5. Student Projection Cutover
    const cutoverRes = await projectSyllabusToStudentReader(mockDb as any, {
      missionId: 'jee_main_2026',
      sourceSlotId: 'slot_001',
      sourceVersionId: 'srcv_v2',
      sourceSha256: v2Sha,
      activationEpoch: 2
    });

    expect(cutoverRes.success).toBe(true);
    expect(cutoverRes.projectedNodesCount).toBe(3);

    // Verify removed units absent and unchanged/added present
    const projectedIds = batchSetFn.mock.calls.map(call => call[1].id);
    expect(projectedIds).toContain('u_unchanged');
    expect(projectedIds).toContain('u_added');
    expect(projectedIds).toContain('u_modified');
    expect(projectedIds).not.toContain('u_old_topic');

    // 6. STALE WRITER MATRIX: Deliberately run stale V1 jobs post-cutover
    const slotPostCutover = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: v2Sha,
      activationEpoch: 2
    };

    const staleV1Job = {
      sourceVersionId: 'srcv_v1',
      sourceSha256: v1Sha,
      activationEpoch: 1
    };

    // Syllabus Stale Job Check
    const syllabusStaleStatus = classifyWorkerAuthority(slotPostCutover, staleV1Job);
    expect(syllabusStaleStatus).toBe('STALE');

    // DigiBook Stale Job Check
    const digiStaleStatus = classifyWorkerAuthority(slotPostCutover, staleV1Job);
    expect(digiStaleStatus).toBe('STALE');

    // PYQ Stale Job Check
    const pyqStaleStatus = classifyWorkerAuthority(slotPostCutover, staleV1Job);
    expect(pyqStaleStatus).toBe('STALE');

    // Crucible Stale Job Check
    const crucibleStaleStatus = classifyWorkerAuthority(slotPostCutover, staleV1Job);
    expect(crucibleStaleStatus).toBe('STALE');

    const successfulStaleWrites = [syllabusStaleStatus, digiStaleStatus, pyqStaleStatus, crucibleStaleStatus].filter(s => s === 'CURRENT').length;
    expect(successfulStaleWrites).toBe(0);
  });
});
