import { buildCareerSignal } from '../services/careerSignalAuthority';

const evaluation = {
  evaluationId: 'eval-1', state: 'ELIGIBLE' as const, recruitmentEventId: 'recruitment-1',
  postId: 'post-1', profileSnapshotId: 'snap-1', ruleSetVersion: 'rules-v1', sourceVersion: 'source-v1',
};

describe('career signal authority handoff', () => {
  test('CS01 eligible evaluation permits qualified signal', () => expect(buildCareerSignal({ evaluation }).eligibilityQualified).toBe(true));
  test.each(['NOT_ELIGIBLE', 'MORE_INFORMATION_REQUIRED', 'OFFICIAL_RULE_UNRESOLVED', 'SOURCE_STALE_OR_SUPERSEDED', 'INTEGRITY_HOLD'] as const)('CS02-CS06 %s cannot become eligible', state => {
    const signal = buildCareerSignal({ evaluation: { ...evaluation, state }, legacyEligible: true, legacyMatchScore: 100 });
    expect(signal.eligibilityQualified).toBe(false); expect(signal.eligibilityState).toBe(state);
  });
  test('CS07 legacy match score cannot override authoritative state', () => expect(buildCareerSignal({ evaluation: { ...evaluation, state: 'NOT_ELIGIBLE' }, legacyMatchScore: 100 }).eligibilityQualified).toBe(false));
  test('CS08 opportunity_matches is not an authority input', () => expect(buildCareerSignal({ evaluation }).eligibilityQualified).toBe(true));
  test('CS09 signal does not recompute eligibility', () => expect(buildCareerSignal({ evaluation: { ...evaluation, state: 'MORE_INFORMATION_REQUIRED' }, rank: 1, mastery: 1 }).eligibilityState).toBe('MORE_INFORMATION_REQUIRED'));
  test('CS10 missing evaluation fails closed', () => expect(buildCareerSignal({ legacyEligible: true, legacyMatchScore: 100 }).eligibilityQualified).toBe(false));
  test('CS11 signal remains traceable to evaluation identity', () => expect(buildCareerSignal({ evaluation })).toMatchObject({ evaluationId: 'eval-1', profileSnapshotId: 'snap-1', sourceVersion: 'source-v1' }));
  test('CS12 rank, mastery, Test Arena, and revision cannot alter authority', () => {
    const normal = buildCareerSignal({ evaluation, missionRelevance: 1 });
    const noisy = buildCareerSignal({ evaluation, rank: 1, mastery: 1, testArenaRank: 1, revisionDebt: 999, missionRelevance: 1 });
    expect(noisy.eligibilityQualified).toBe(normal.eligibilityQualified); expect(noisy.eligibilityState).toBe(normal.eligibilityState);
  });
});
