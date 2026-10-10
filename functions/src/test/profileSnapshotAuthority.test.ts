import {
  extractMaterialFacts,
  materialFactsFingerprint,
  snapshotIdentity,
  PROFILE_SNAPSHOT_SCHEMA_VERSION,
  stableSerialize,
} from '../services/profileSnapshotAuthority';

describe('profile snapshot authority foundation', () => {
  const profile = {
    uid: 'student-1', dateOfBirth: '2000-01-01', category: 'General',
    domicileState: 'RJ', displayName: 'A', email: 'a@example.test',
    rank: 4, mastery: 0.8,
  };

  test('PS-T01 same material facts have a stable logical fingerprint', () => {
    const facts = extractMaterialFacts(profile);
    expect(materialFactsFingerprint(facts)).toBe(materialFactsFingerprint({ ...facts }));
    expect(facts).not.toHaveProperty('email');
    expect(facts).not.toHaveProperty('displayName');
    expect(facts).not.toHaveProperty('rank');
    expect(facts).not.toHaveProperty('mastery');
  });

  test('PS-T02 DOB change produces a new snapshot identity', () => {
    const first = materialFactsFingerprint(extractMaterialFacts(profile));
    const second = materialFactsFingerprint(extractMaterialFacts({ ...profile, dateOfBirth: '2001-01-01' }));
    expect(second).not.toBe(first);
    expect(snapshotIdentity('student-1', first)).not.toBe(snapshotIdentity('student-1', second));
  });

  test('PS-T03 category change produces a new snapshot identity', () => {
    const first = materialFactsFingerprint(extractMaterialFacts(profile));
    const second = materialFactsFingerprint(extractMaterialFacts({ ...profile, category: 'OBC' }));
    expect(second).not.toBe(first);
    expect(snapshotIdentity('student-1', first)).not.toBe(snapshotIdentity('student-1', second));
  });

  test('PS-T04 domicile change produces a new snapshot identity', () => {
    const first = materialFactsFingerprint(extractMaterialFacts(profile));
    const second = materialFactsFingerprint(extractMaterialFacts({ ...profile, domicileState: 'UP' }));
    expect(second).not.toBe(first);
  });

  test('PS-T05 email-only changes do not invalidate identity', () => {
    const first = materialFactsFingerprint(extractMaterialFacts(profile));
    const second = materialFactsFingerprint(extractMaterialFacts({ ...profile, email: 'b@example.test' }));
    expect(second).toBe(first);
  });

  test('PS-T06 display-name changes do not invalidate identity', () => {
    const first = materialFactsFingerprint(extractMaterialFacts(profile));
    const second = materialFactsFingerprint(extractMaterialFacts({ ...profile, displayName: 'B' }));
    expect(second).toBe(first);
  });

  test('PS-T07 missing material facts are not coerced to a false/default value', () => {
    const missing = extractMaterialFacts({ ...profile });
    const explicitFalse = extractMaterialFacts({ ...profile, isSAP: false });
    expect(missing.isSAP).toBeNull();
    expect(missing.isSAP).not.toBe(false);
    expect(materialFactsFingerprint(missing)).not.toBe(materialFactsFingerprint(explicitFalse));
  });

  test('PS-T13 object key ordering is deterministic', () => {
    expect(stableSerialize({ z: 1, a: { y: 2, b: 3 } })).toBe(stableSerialize({ a: { b: 3, y: 2 }, z: 1 }));
  });

  test('PS-T14 absent, null, and known values are deterministic and distinct', () => {
    const absent = extractMaterialFacts({ ...profile, category: undefined });
    const nil = extractMaterialFacts({ ...profile, category: null });
    const known = extractMaterialFacts({ ...profile, category: 'General' });
    expect(absent.category).toBeNull();
    expect(nil.category).toBeNull();
    expect(materialFactsFingerprint(absent)).toBe(materialFactsFingerprint(nil));
    expect(materialFactsFingerprint(nil)).not.toBe(materialFactsFingerprint(known));
  });

  test('PS-T15 rank, percentile, mastery, retention, revision, and Test Arena fields are excluded', () => {
    const base = materialFactsFingerprint(extractMaterialFacts(profile));
    const changed = materialFactsFingerprint(extractMaterialFacts({
      ...profile,
      rank: 999,
      percentile: 99.9,
      mastery: 0.01,
      retention: 0.2,
      revision: 'r2',
      testArena: { score: 100 },
    }));
    expect(changed).toBe(base);
  });

  test('PS-T20 retains governed material evidence needed for future explanation', () => {
    const facts = extractMaterialFacts({
      ...profile,
      subCategory: 'GEN-EWS',
      isSAP: true,
      educationLevel: 'graduate',
      professionalCredentialIds: ['credential-1'],
    });
    expect(facts).toMatchObject({
      dateOfBirth: '2000-01-01',
      category: 'General',
      subCategory: 'GEN-EWS',
      domicileState: 'RJ',
      isSAP: true,
      educationLevel: 'graduate',
      professionalCredentialIds: ['credential-1'],
    });
    expect(materialFactsFingerprint(facts)).toHaveLength(64);
    expect(PROFILE_SNAPSHOT_SCHEMA_VERSION).toBe('profile_snapshot_material_v1');
  });

  test('null remains distinct from a known value', () => {
    const missing = materialFactsFingerprint(extractMaterialFacts({ ...profile, category: null }));
    const known = materialFactsFingerprint(extractMaterialFacts({ ...profile, category: '' }));
    expect(missing).not.toBe(known);
  });
});
