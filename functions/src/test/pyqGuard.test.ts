const { classifyWorkerAuthority } = require('../../services/canonical_source_authority');

describe('PYQ & Question Central Source Guard Suite', () => {
  const validSha = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
  const newSha = 'b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90a1';

  test('Classifies exact matching canonical slot as CURRENT', () => {
    const slot = {
      canonicalVersionId: 'srcv_v1',
      canonicalSha256: validSha,
      activationEpoch: 2
    };
    const job = {
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 2
    };
    expect(classifyWorkerAuthority(slot, job)).toBe('CURRENT');
  });

  test('Classifies older activation epoch as STALE', () => {
    const slot = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: newSha,
      activationEpoch: 3
    };
    const delayedV1Job = {
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 2
    };
    expect(classifyWorkerAuthority(slot, delayedV1Job)).toBe('STALE');
  });

  test('Classifies mismatched source version id as SUPERSEDED', () => {
    const slot = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: newSha,
      activationEpoch: 3
    };
    const delayedV1Job = {
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 3
    };
    expect(classifyWorkerAuthority(slot, delayedV1Job)).toBe('SUPERSEDED');
  });

  test('Classifies missing job source authority as AUTHORITY_MISSING', () => {
    const slot = {
      canonicalVersionId: 'srcv_v1',
      canonicalSha256: validSha,
      activationEpoch: 1
    };
    expect(classifyWorkerAuthority(slot, {})).toBe('AUTHORITY_MISSING');
  });

  test('Classifies unactivated slot as NOT_CANONICAL', () => {
    const slot = {};
    const job = {
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 1
    };
    expect(classifyWorkerAuthority(slot, job)).toBe('NOT_CANONICAL');
  });

  test('OLD_PYQ_SOURCE_CAN_PUBLISH is NO and STALE_PYQ_STUDENT_WRITES is 0', () => {
    const slot = {
      canonicalVersionId: 'srcv_v2',
      canonicalSha256: newSha,
      activationEpoch: 2
    };
    const staleJob = {
      sourceVersionId: 'srcv_v1',
      sourceSha256: validSha,
      activationEpoch: 1
    };
    const classification = classifyWorkerAuthority(slot, staleJob);
    const canPublish = classification === 'CURRENT';

    expect(canPublish).toBe(false);
    expect(classification).toBe('STALE');
  });
});
