const { classifySyllabusDelta, isJobCurrent } = require('../../services/canonical_source_authority');

describe('Reverse Delta Rollback & Stale Invalidation Suite', () => {
  const v1Sha = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const v2Sha = 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1';

  const v1Units = [
    { id: 'u1', semanticKey: 'kinematics_1d', title: 'Motion in 1D', parentKey: 'phys_01', contentDigest: 'd1' }
  ];

  const v2Units = [
    { id: 'u1', semanticKey: 'kinematics_1d', title: 'Motion in 1D', parentKey: 'phys_01', contentDigest: 'd1' },
    { id: 'u2', semanticKey: 'kinematics_2d', title: 'Motion in 2D', parentKey: 'phys_01', contentDigest: 'd2' }
  ];

  test('Generates valid reverse delta from current V2 to target V1', () => {
    // Current V2 -> Target V1
    const reverseDelta = classifySyllabusDelta(v2Units, v1Units);

    expect(reverseDelta).toBeDefined();
    expect(reverseDelta.items.length).toBeGreaterThan(0);
    // Node u2 in V2 is REMOVED in target V1
    const removedItem = reverseDelta.items.find(i => i.classification === 'REMOVED');
    expect(removedItem).toBeDefined();
    expect(removedItem.before.semanticKey).toBe('kinematics_2d');
  });

  test('Unverified ambiguity in reverse delta blocks rollback (Fail Closed)', () => {
    const ambiguousV1Units = [
      { id: 'u1_a', semanticKey: 'kinematics_1d', title: 'Motion in 1D', parentKey: 'phys_01', contentDigest: 'd1' },
      { id: 'u1_b', semanticKey: 'kinematics_1d', title: 'Motion in 1D Alt', parentKey: 'phys_01', contentDigest: 'd1' }
    ];

    const reverseDelta = classifySyllabusDelta(v2Units, ambiguousV1Units);
    expect(reverseDelta.activationBlocked).toBe(true);
    expect(reverseDelta.counts.AMBIGUOUS).toBeGreaterThan(0);
  });

  test('Rollback increments activation epoch and invalidates V2 stale jobs', () => {
    // Slot before rollback (V2 active at epoch 2)
    const slotV2 = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: v2Sha,
      activationEpoch: 2
    };

    // V2 worker job queued at epoch 2
    const v2Job = {
      sourceVersionId: 'srcv_v2',
      sourceSha256: v2Sha,
      activationEpoch: 2
    };
    expect(isJobCurrent(slotV2, v2Job)).toBe(true);

    // Rollback to V1 executed -> Slot updated to V1 at epoch 3
    const slotRollbackV1 = {
      canonicalVersionId: 'srcv_v1',
      canonicalSha256: v1Sha,
      activationEpoch: 3
    };

    // Late V2 worker attempting write after rollback
    expect(isJobCurrent(slotRollbackV1, v2Job)).toBe(false);
  });
});
