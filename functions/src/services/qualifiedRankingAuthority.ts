import { createHash } from 'crypto';
import { stableSerialize } from './profileSnapshotAuthority';

export type RankingQualification = 'QUALIFIED' | 'MISSING_COHORT' | 'MISSING_POLICY' | 'INSUFFICIENT_EVIDENCE' | 'FORM_COMPARISON_UNRESOLVED' | 'HISTORICAL' | 'SUPERSEDED' | 'INTEGRITY_HOLD';
export interface ArenaResult { resultId: string; studentId: string; missionId: string; eventId: string; assessmentId: string; paperId: string; stageId: string; formId: string; cohortId?: string; rankingPolicyVersion?: string; score: number; scoreMax: number; status: 'QUALIFIED' | 'HISTORICAL' | 'SUPERSEDED'; }
export interface QualifiedCompetitiveEvidence { evidenceId: string; resultId: string; studentId: string; missionId: string; eventId: string; assessmentId: string; paperId: string; stageId: string; formId: string; cohortId: string; rankingPolicyVersion: string; rawMarks: number; percentage: number; rank: number | null; percentile: number | null; qualification: RankingQualification; snapshotId: string; supersedesSnapshotId: string | null; immutable: true; }

export function qualifyRanking(result: ArenaResult, cohort: ArenaResult[], policyVersion?: string): RankingQualification {
  if (result.status !== 'QUALIFIED') return result.status === 'SUPERSEDED' ? 'SUPERSEDED' : 'HISTORICAL';
  if (!result.cohortId || !cohort.length) return 'MISSING_COHORT';
  if (!policyVersion || !result.rankingPolicyVersion || result.rankingPolicyVersion !== policyVersion) return 'MISSING_POLICY';
  if (cohort.some(r => r.status !== 'QUALIFIED' || r.formId !== result.formId || r.paperId !== result.paperId || r.stageId !== result.stageId)) return 'FORM_COMPARISON_UNRESOLVED';
  return 'QUALIFIED';
}

export function standardCompetitionRanks(results: ArenaResult[]): Map<string, number> {
  const sorted = [...results].sort((a, b) => b.score - a.score || a.studentId.localeCompare(b.studentId)); const ranks = new Map<string, number>(); let lastScore: number | undefined; let rank = 0;
  sorted.forEach((r, index) => { if (lastScore !== r.score) rank = index + 1; ranks.set(r.resultId, rank); lastScore = r.score; }); return ranks;
}

export function createQualifiedEvidence(result: ArenaResult, cohort: ArenaResult[], policyVersion: string, priorSnapshotId?: string): QualifiedCompetitiveEvidence {
  const qualification = qualifyRanking(result, cohort, policyVersion); const valid = qualification === 'QUALIFIED'; const ranks = valid ? standardCompetitionRanks(cohort) : new Map<string, number>(); const rank = valid ? ranks.get(result.resultId) ?? null : null; const percentage = result.scoreMax > 0 ? result.score / result.scoreMax * 100 : 0;
  const identity = { resultId: result.resultId, eventId: result.eventId, assessmentId: result.assessmentId, paperId: result.paperId, stageId: result.stageId, formId: result.formId, cohortId: result.cohortId ?? null, rankingPolicyVersion: policyVersion, qualification };
  const snapshotId = createHash('sha256').update(stableSerialize(identity)).digest('hex');
  return { evidenceId: `rank_${snapshotId}`, resultId: result.resultId, studentId: result.studentId, missionId: result.missionId, eventId: result.eventId, assessmentId: result.assessmentId, paperId: result.paperId, stageId: result.stageId, formId: result.formId, cohortId: result.cohortId ?? '', rankingPolicyVersion: policyVersion, rawMarks: result.score, percentage, rank, percentile: rank === null ? null : percentileFor(result, cohort), qualification, snapshotId, supersedesSnapshotId: priorSnapshotId ?? null, immutable: true };
}

function percentileFor(result: ArenaResult, cohort: ArenaResult[]): number { const below = cohort.filter(r => r.score < result.score).length; return cohort.length ? below / cohort.length * 100 : 0; }
export function buildRankRadarProjection(evidence: QualifiedCompetitiveEvidence | null) { if (!evidence || evidence.qualification !== 'QUALIFIED') return { available: false, reason: evidence?.qualification ?? 'MISSING_EVIDENCE', selectionProbability: undefined }; return { available: true, evidenceId: evidence.evidenceId, qualification: evidence.qualification, rank: evidence.rank, percentile: evidence.percentile, scope: { missionId: evidence.missionId, eventId: evidence.eventId, paperId: evidence.paperId, stageId: evidence.stageId, formId: evidence.formId, cohortId: evidence.cohortId }, selectionProbability: undefined }; }
export function compatibleTrajectory(a: QualifiedCompetitiveEvidence, b: QualifiedCompetitiveEvidence): boolean { return a.qualification === 'QUALIFIED' && b.qualification === 'QUALIFIED' && a.missionId === b.missionId && a.eventId === b.eventId && a.assessmentId === b.assessmentId && a.paperId === b.paperId && a.stageId === b.stageId && a.formId === b.formId && a.rankingPolicyVersion === b.rankingPolicyVersion; }
export function canClientAuthorQualifiedRank(): boolean { return false; }
