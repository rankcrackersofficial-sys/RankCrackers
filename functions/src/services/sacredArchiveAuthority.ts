import { createHash } from 'crypto';

export const SACRED_ARCHIVE_ARCHITECTURE_ID = 'RC-SACRED-ARCHIVE-001';
export const SACRED_ARCHIVE_SCHEMA_VERSION = 1;

export type ArchiveSourceFamily =
  | 'taught_content'
  | 'crucible_assessment'
  | 'test_arena_assessment'
  | 'qualified_ranking'
  | 'learning_state'
  | 'revision_desk'
  | 'career_academic';

export type ArchiveEventInput = {
  studentId: string;
  sourceAuthority: string;
  sourceFamily: ArchiveSourceFamily;
  sourceEventId: string;
  sourceVersion: string;
  occurredAt: string;
  recordedAt?: string;
  missionId?: string;
  recruitmentEventId?: string;
  assessmentId?: string;
  paperId?: string;
  stageId?: string;
  formId?: string;
  knowledgeId?: string;
  atomId?: string;
  payload: Record<string, unknown>;
  provenance: string[];
  actor?: 'server' | 'student' | 'founder';
  correctionOf?: string;
};

export type ArchiveEvent = Omit<ArchiveEventInput, 'recordedAt' | 'actor'> & {
  archiveEventId: string;
  schemaVersion: number;
  recordedAt: string;
  actor: 'server';
  supersedes?: string;
};

export type ArchiveDecision =
  | { accepted: true; event: ArchiveEvent; duplicate: false }
  | { accepted: true; event: ArchiveEvent; duplicate: true }
  | { accepted: false; reason: string };

const REQUIRED_SOURCE_AUTHORITIES: Record<ArchiveSourceFamily, string[]> = {
  taught_content: ['taught_content_authority'],
  crucible_assessment: ['crucible_authority'],
  test_arena_assessment: ['test_arena_authority'],
  qualified_ranking: ['qualified_ranking_authority'],
  learning_state: ['learning_state_authority'],
  revision_desk: ['revision_desk_authority'],
  career_academic: ['career_eligibility_authority', 'career_signal_authority'],
};

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

function idFor(input: ArchiveEventInput): string {
  const identity = {
    studentId: input.studentId,
    missionId: input.missionId ?? null,
    sourceAuthority: input.sourceAuthority,
    sourceFamily: input.sourceFamily,
    sourceEventId: input.sourceEventId,
    sourceVersion: input.sourceVersion,
  };
  return `sa_${createHash('sha256').update(canonical(identity)).digest('hex')}`;
}

export function archiveEventIdentity(input: ArchiveEventInput): string {
  return idFor(input);
}

export function qualifyArchiveEvent(
  input: ArchiveEventInput,
  existing: ReadonlyMap<string, ArchiveEvent> = new Map(),
  serverRecordedAt: string,
): ArchiveDecision {
  if (input.actor === 'student') return { accepted: false, reason: 'student_cannot_author_archive' };
  if (input.actor === 'founder') return { accepted: false, reason: 'founder_client_cannot_mutate_archive' };
  if (input.actor !== 'server') return { accepted: false, reason: 'server_authority_required' };
  if (!input.studentId || !input.sourceEventId || !input.sourceVersion) return { accepted: false, reason: 'missing_identity' };
  if (!input.provenance.length) return { accepted: false, reason: 'missing_provenance' };
  if (!REQUIRED_SOURCE_AUTHORITIES[input.sourceFamily].includes(input.sourceAuthority)) {
    return { accepted: false, reason: 'unknown_source_authority' };
  }
  if (!Number.isFinite(Date.parse(serverRecordedAt))) return { accepted: false, reason: 'invalid_server_recorded_time' };
  const archiveEventId = idFor(input);
  const prior = existing.get(archiveEventId);
  if (prior) return { accepted: true, event: prior, duplicate: true };
  const event: ArchiveEvent = {
    ...input,
    archiveEventId,
    schemaVersion: SACRED_ARCHIVE_SCHEMA_VERSION,
    recordedAt: serverRecordedAt,
    actor: 'server',
    ...(input.correctionOf ? { supersedes: input.correctionOf } : {}),
  };
  return { accepted: true, event, duplicate: false };
}

export function reconstructThen(events: readonly ArchiveEvent[]): ArchiveEvent[] {
  return [...events].sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
}

export function isCurrentAuthorityField(field: string): boolean {
  return !['eligibility', 'rank', 'mastery', 'retention', 'revisionDebt', 'recovery', 'taughtStatus', 'answerCorrectness', 'selectionStatus'].includes(field);
}

