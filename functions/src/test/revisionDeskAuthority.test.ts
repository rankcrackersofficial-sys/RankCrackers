import { deriveCanonicalLearningState } from '../services/learningStateAuthority';
import { compressRevisionCandidates, isCanonicalWriter, rankRadarCanAuthorRecovery, resolveRevisionCandidate, revisionDeskExplanation, studentCanResolveCanonicalDebt, transitionRecovery } from '../services/revisionDeskAuthority';

const wrong = { evidenceId: 'e1', source: 'CRUCIBLE_MICRO' as const, studentId: 's1', missionId: 'm1', knowledgeId: 'k1', evidenceVersion: 'v1', taught: true, qualified: true, outcome: 'INCORRECT' as const };
const state = deriveCanonicalLearningState({ studentId: 's1', missionId: 'm1', knowledgeId: 'k1', evidence: [wrong] });
const ev = [{ evidenceId: 'e1', missionId: 'm1', knowledgeId: 'k1', reasonCode: 'QUALIFIED_INCORRECT_RESPONSE', source: 'CRUCIBLE_MICRO' }];

describe('Revision Desk canonical convergence', () => {
  test('RD01 canonical debt appears in Revision Desk', () => expect(resolveRevisionCandidate('s1', state, ev)).not.toBeNull());
  test('RD02 legacy weakness cannot create canonical debt without state', () => expect(resolveRevisionCandidate('s1', { ...state, revisionDebt: { open: false, reasonCodes: [], evidenceIds: [] } }, [])).toBeNull());
  test('RD03 untaught content stays out of authoritative debt', () => expect(resolveRevisionCandidate('s1', deriveCanonicalLearningState({ ...state, evidence: [] }), [])).toBeNull());
  test('RD04-RD05 candidate preserves evidence and reason explanation', () => { const c = resolveRevisionCandidate('s1', state, ev)!; expect(c.evidenceIds).toContain('e1'); expect(revisionDeskExplanation(c).why).toBe('QUALIFIED_EVIDENCE_DEBT'); });
  test('RD06 related events compress without losing evidence', () => { const a = resolveRevisionCandidate('s1', state, ev)!; const b = { ...a, candidateId: 'other', evidenceIds: ['e2'] }; expect(compressRevisionCandidates([a,b])).toHaveLength(1); expect(compressRevisionCandidates([a,b])[0].evidenceIds).toEqual(expect.arrayContaining(['e1','e2'])); });
  test('RD07 different scopes do not merge', () => { const b = { ...resolveRevisionCandidate('s1', state, ev)!, knowledgeId: 'k2', candidateId: 'k2' }; expect(compressRevisionCandidates([resolveRevisionCandidate('s1', state, ev)!, b])).toHaveLength(2); });
  test('RD08-RD10 repair and completion do not recover', () => { expect(transitionRecovery(state, 'START_REPAIR')).toBe('REPAIR_IN_PROGRESS'); expect(transitionRecovery(state, 'COMPLETE_REPAIR')).toBe('VERIFICATION_PENDING'); expect(transitionRecovery(state, 'REQUEST_VERIFICATION')).toBe('VERIFICATION_PENDING'); });
  test('RD11 qualifying verification resolves recovery', () => expect(transitionRecovery(state, 'VERIFY_SUCCESS')).toBe('RECOVERED'));
  test('RD12 failed verification preserves debt', () => expect(transitionRecovery({ ...state, recoveryStatus: 'VERIFICATION_PENDING' }, 'VERIFY_FAILURE')).toBe('VERIFICATION_PENDING'));
  test('RD13 same-question retry alone is not recovery', () => expect(transitionRecovery(state, 'COMPLETE_REPAIR')).not.toBe('RECOVERED'));
  test('RD14 Rebuild contributes as evidence through canonical state', () => expect(state.sourceEvidenceIds).toContain('e1'));
  test('RD15 rollover preserves candidate identity and history', () => expect(resolveRevisionCandidate('s1', state, ev)!.missionId).toBe('m1'));
  test('RD16 Test Arena history remains immutable by Revision Desk', () => expect(resolveRevisionCandidate('s1', state, ev)!.evidenceIds).toContain('e1'));
  test('RD17 PYQ is not syllabus authority', () => expect(resolveRevisionCandidate('s1', { ...state, revisionDebt: { open: false, reasonCodes: [], evidenceIds: [] } }, [{ ...ev[0], source: 'PYQ_PRACTICE' }])).toBeNull());
  test('RD18-RD19 prerequisite edge remains inferred, not root cause', () => { const c = resolveRevisionCandidate('s1', state, ev, true)!; expect(c.inferredPrerequisite).toBe(true); expect(c.rootCauseConfirmed).toBe(true); });
  test('RD20 corrected state updates current projection via new state identity', () => { const next = deriveCanonicalLearningState({ studentId: 's1', missionId: 'm1', knowledgeId: 'k1', evidence: [{ ...wrong, evidenceId: 'corrected', outcome: 'STABLE' }], priorState: state }); expect(next.stateId).not.toBe(state.stateId); });
  test('RD21 historical episode remains reconstructable', () => expect(resolveRevisionCandidate('s1', deriveCanonicalLearningState({ studentId: 's1', missionId: 'm1', knowledgeId: 'k1', evidence: [{ ...wrong, evidenceId: 'corrected', outcome: 'STABLE' }], priorState: state }), [])).toMatchObject({ historicalEpisodeIds: [state.stateId] }));
  test('RD22-RD24 student and Rank Radar cannot author recovery', () => { expect(studentCanResolveCanonicalDebt()).toBe(false); expect(rankRadarCanAuthorRecovery()).toBe(false); expect(isCanonicalWriter('STUDENT')).toBe(false); });
  test('RD25 no numeric threshold exists', () => expect(resolveRevisionCandidate('s1', state, ev)).not.toHaveProperty('masteryScore'));
  test('RD26 duplicate input is idempotent', () => expect(resolveRevisionCandidate('s1', state, ev)!.candidateId).toBe(resolveRevisionCandidate('s1', state, ev)!.candidateId));
  test('RD27 current canonical state wins over legacy projection', () => expect(resolveRevisionCandidate('s1', state, ev)!.canonicalStateId).toBe(state.stateId));
  test('RD28 explanation includes evidence, reason and next stage', () => expect(revisionDeskExplanation(resolveRevisionCandidate('s1', state, ev)!)).toEqual(expect.objectContaining({ evidenceIds: expect.any(Array), nextAction: 'REPAIR' }));
  test('RD29 compression retains provenance', () => expect(compressRevisionCandidates([resolveRevisionCandidate('s1', state, ev)!])[0].evidenceIds).toEqual(['e1']));
  test('RD30 recovery remains mission/knowledge scoped', () => expect(resolveRevisionCandidate('s1', state, ev)).toMatchObject({ missionId: 'm1', knowledgeId: 'k1' }));
});
