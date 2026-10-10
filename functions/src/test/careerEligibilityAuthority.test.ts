import { buildEligibilityEvaluation, evaluationIdentity, resolveEligibilityState } from '../services/careerEligibilityAuthority';

const base = {
  studentId: 'student-1', recruitmentEventId: 'recruitment-1', postId: 'post-1', profileSnapshotId: 'snap-1',
  profileMaterialFactsFingerprint: 'fp-1', ruleSetId: 'rules-1', ruleSetVersion: 'v1', sourceDocumentId: 'doc-1', sourceVersion: 'src-v1',
};
const pass = { ruleId: 'age', outcome: 'PASS' as const, reasonCode: 'AGE_OK', evidenceRef: 'official-rule-age' };

describe('career eligibility authority', () => {
  test('CE01 verified rules pass -> ELIGIBLE', () => expect(resolveEligibilityState({ rules: [pass] })).toBe('ELIGIBLE'));
  test('CE02 definitive failure -> NOT_ELIGIBLE', () => expect(resolveEligibilityState({ rules: [{ ...pass, outcome: 'FAIL', reasonCode: 'AGE_FAIL' }] })).toBe('NOT_ELIGIBLE'));
  test('CE03-05 missing required facts -> MORE_INFORMATION_REQUIRED', () => expect(resolveEligibilityState({ rules: [{ ...pass, outcome: 'MISSING_FACT', requiredFact: 'dateOfBirth', reasonCode: 'DOB_REQUIRED' }] })).toBe('MORE_INFORMATION_REQUIRED'));
  test('CE06 unresolved rule -> OFFICIAL_RULE_UNRESOLVED', () => expect(resolveEligibilityState({ rules: [{ ...pass, outcome: 'UNRESOLVED', reasonCode: 'RULE_UNRESOLVED' }] })).toBe('OFFICIAL_RULE_UNRESOLVED'));
  test('CE07 stale source -> SOURCE_STALE_OR_SUPERSEDED', () => expect(resolveEligibilityState({ rules: [pass], sourceStale: true })).toBe('SOURCE_STALE_OR_SUPERSEDED'));
  test('CE08 broken binding -> INTEGRITY_HOLD', () => expect(resolveEligibilityState({ rules: [pass], integrityValid: false })).toBe('INTEGRITY_HOLD'));
  test('CE09 precedence is deterministic', () => expect(resolveEligibilityState({ rules: [{ ...pass, outcome: 'FAIL' }, { ...pass, outcome: 'MISSING_FACT' }, { ...pass, outcome: 'UNRESOLVED' }], sourceStale: true, integrityValid: false })).toBe('INTEGRITY_HOLD'));
  test('CE10 same authoritative inputs are idempotent', () => expect(evaluationIdentity(base)).toBe(evaluationIdentity({ ...base })));
  test('CE11-13 changed snapshot/rule/source create new identities', () => {
    expect(evaluationIdentity(base)).not.toBe(evaluationIdentity({ ...base, profileSnapshotId: 'snap-2' }));
    expect(evaluationIdentity(base)).not.toBe(evaluationIdentity({ ...base, ruleSetVersion: 'v2' }));
    expect(evaluationIdentity(base)).not.toBe(evaluationIdentity({ ...base, sourceVersion: 'src-v2' }));
  });
  test('CE14-15 client-owned state/time are absent from the model', () => {
    const result = buildEligibilityEvaluation({ ...base, rules: [pass] }) as Record<string, unknown>;
    expect(result.state).toBe('ELIGIBLE'); expect(result).not.toHaveProperty('evaluatedAt');
  });
  test('CE16-18 no opportunity, probability, rank, or mastery authority is produced', () => {
    const result = buildEligibilityEvaluation({ ...base, rules: [pass] }) as Record<string, unknown>;
    expect(result).not.toHaveProperty('opportunity_matches'); expect(result).not.toHaveProperty('selectionProbability');
    expect(result).not.toHaveProperty('rank'); expect(result).not.toHaveProperty('mastery');
  });
});
