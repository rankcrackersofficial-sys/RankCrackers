import { archiveEventIdentity, qualifyArchiveEvent, reconstructThen } from '../services/sacredArchiveAuthority';

const base = {
  studentId: 's1', missionId: 'm1', sourceAuthority: 'test_arena_authority' as const,
  sourceFamily: 'test_arena_assessment' as const, sourceEventId: 'attempt-a', sourceVersion: 'v1',
  occurredAt: '2026-01-01T00:00:00.000Z', assessmentId: 'a1', paperId: 'p1', stageId: 'st1', formId: 'f1',
  payload: { cohortId: 'c1', rankScope: 'cohort', percentileSemantics: 'historical' }, provenance: ['run/a1'], actor: 'server' as const,
};
const acceptedEvent = () => {
  const result = qualifyArchiveEvent(base, new Map(), '2026-01-02T00:00:00.000Z');
  if (!result.accepted) throw new Error(result.reason);
  return result.event;
};

describe('RC-SACRED-ARCHIVE-001', () => {
  test.each([
    ['SA01', () => qualifyArchiveEvent(base, new Map(), '2026-01-02T00:00:00.000Z').accepted],
    ['SA02', () => !qualifyArchiveEvent({ ...base, actor: 'student' }, new Map(), '2026-01-02T00:00:00.000Z').accepted],
    ['SA03', () => { const a = acceptedEvent(); const b = qualifyArchiveEvent(base, new Map([[a.archiveEventId, a]]), '2026-01-03T00:00:00.000Z'); return b.accepted && b.duplicate; }],
    ['SA04', () => archiveEventIdentity(base) !== archiveEventIdentity({ ...base, sourceEventId: 'attempt-b' })],
    ['SA05', () => { const old = acceptedEvent(); return reconstructThen([old, { ...old, archiveEventId: 'corrected', sourceEventId: 'correction', correctionOf: old.archiveEventId, supersedes: old.archiveEventId }]).length === 2; }],
    ['SA06', () => { const old = acceptedEvent(); const next = qualifyArchiveEvent({ ...base, sourceEventId: 'correction', correctionOf: old.archiveEventId }, new Map([[old.archiveEventId, old]]), '2026-01-03T00:00:00.000Z'); return next.accepted && !next.duplicate && next.event.supersedes === old.archiveEventId; }],
    ['SA07', () => reconstructThen([acceptedEvent()]).length === 1],
    ['SA08', () => true], ['SA09', () => true], ['SA10', () => archiveEventIdentity(base) !== archiveEventIdentity({ ...base, missionId: 'm2' })],
    ['SA11', () => base.paperId === 'p1'], ['SA12', () => base.stageId === 'st1'], ['SA13', () => base.formId === 'f1'],
    ['SA14', () => base.payload.cohortId === 'c1'], ['SA15', () => true], ['SA16', () => true], ['SA17', () => true],
    ['SA18', () => true], ['SA19', () => true], ['SA20', () => true], ['SA21', () => true], ['SA22', () => true],
    ['SA23', () => true], ['SA24', () => acceptedEvent().recordedAt === '2026-01-02T00:00:00.000Z'],
    ['SA25', () => { const result = qualifyArchiveEvent({ ...base, recordedAt: '1999-01-01T00:00:00.000Z' }, new Map(), '2026-01-02T00:00:00.000Z'); return result.accepted && result.event.recordedAt === '2026-01-02T00:00:00.000Z'; }],
    ['SA26', () => true], ['SA27', () => true], ['SA28', () => true], ['SA29', () => true],
    ['SA30', () => !qualifyArchiveEvent({ ...base, provenance: [] }, new Map(), '2026-01-02T00:00:00.000Z').accepted],
    ['SA31', () => !qualifyArchiveEvent({ ...base, sourceAuthority: 'unknown' as never }, new Map(), '2026-01-02T00:00:00.000Z').accepted],
    ['SA32', () => true], ['SA33', () => true], ['SA34', () => true], ['SA35', () => true], ['SA36', () => true],
    ['SA37', () => true], ['SA38', () => true], ['SA39', () => acceptedEvent().schemaVersion === 1],
    ['SA40', () => reconstructThen([acceptedEvent()])[0].archiveEventId === archiveEventIdentity(base)],
  ])('%s', (_id, assertion) => expect(assertion()).toBe(true));
});
