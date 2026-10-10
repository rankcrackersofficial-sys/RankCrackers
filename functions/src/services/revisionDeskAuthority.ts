import { createHash } from 'crypto';
import { stableSerialize } from './profileSnapshotAuthority';
import { CanonicalLearningState, RecoveryStatus, canWriteCanonicalLearningState } from './learningStateAuthority';

export type RevisionCandidateStage = 'SIGNAL' | 'DIAGNOSIS' | 'REPAIR_ACTION' | 'VERIFICATION_REQUIREMENT';
export interface RevisionEvidence { evidenceId: string; missionId: string; knowledgeId: string; atomId?: string | null; reasonCode: string; source: string; }
export interface RevisionDeskCandidate { candidateId: string; studentId: string; missionId: string; knowledgeId: string; atomId: string | null; evidenceIds: string[]; reasons: string[]; stage: RevisionCandidateStage; recoveryStatus: RecoveryStatus; inferredPrerequisite: boolean; rootCauseConfirmed: boolean; nextAction: 'REPAIR' | 'VERIFY' | 'NONE'; canonicalStateId: string; historicalEpisodeIds: string[]; }

export function resolveRevisionCandidate(studentId: string, state: CanonicalLearningState, evidence: RevisionEvidence[], prerequisiteEdge = false): RevisionDeskCandidate | null {
  const scoped = evidence.filter(e => e.missionId === state.missionId && e.knowledgeId === state.knowledgeId);
  const actionableScoped = scoped.filter(e => e.source !== 'PYQ_PRACTICE');
  if (!state.revisionDebt.open && state.recoveryStatus === 'RECOVERED') return null;
  if (!state.revisionDebt.open && actionableScoped.length === 0 && !state.supersedesStateId) return null;
  const candidateId = createHash('sha256').update(stableSerialize({ studentId, missionId: state.missionId, knowledgeId: state.knowledgeId, atomId: state.atomId, stateId: state.stateId })).digest('hex');
  const status = state.recoveryStatus;
  return { candidateId, studentId, missionId: state.missionId, knowledgeId: state.knowledgeId, atomId: state.atomId, evidenceIds: [...new Set([...state.revisionDebt.evidenceIds, ...scoped.map(e => e.evidenceId)])], reasons: [...new Set(state.revisionDebt.reasonCodes)], stage: status === 'OPEN' ? 'SIGNAL' : status === 'REPAIR_IN_PROGRESS' ? 'REPAIR_ACTION' : 'VERIFICATION_REQUIREMENT', recoveryStatus: status, inferredPrerequisite: prerequisiteEdge, rootCauseConfirmed: state.revisionDebt.reasonCodes.length > 0, nextAction: status === 'VERIFICATION_PENDING' ? 'VERIFY' : status === 'RECOVERED' ? 'NONE' : 'REPAIR', canonicalStateId: state.stateId, historicalEpisodeIds: state.supersedesStateId ? [state.supersedesStateId] : [], };
}

export function compressRevisionCandidates(candidates: RevisionDeskCandidate[]): RevisionDeskCandidate[] { const map = new Map<string, RevisionDeskCandidate>(); for (const c of candidates) { const key = `${c.studentId}:${c.missionId}:${c.knowledgeId}:${c.atomId ?? ''}`; const prior = map.get(key); if (!prior) map.set(key, { ...c, evidenceIds: [...new Set(c.evidenceIds)], reasons: [...new Set(c.reasons)] }); else map.set(key, { ...prior, evidenceIds: [...new Set([...prior.evidenceIds, ...c.evidenceIds])], reasons: [...new Set([...prior.reasons, ...c.reasons])], canonicalStateId: c.canonicalStateId, recoveryStatus: c.recoveryStatus, stage: c.stage, nextAction: c.nextAction, historicalEpisodeIds: [...new Set([...prior.historicalEpisodeIds, ...c.historicalEpisodeIds])] }); } return [...map.values()]; }

export function transitionRecovery(state: CanonicalLearningState, action: 'START_REPAIR' | 'COMPLETE_REPAIR' | 'REQUEST_VERIFICATION' | 'VERIFY_SUCCESS' | 'VERIFY_FAILURE'): RecoveryStatus {
  if (action === 'START_REPAIR') return 'REPAIR_IN_PROGRESS';
  if (action === 'COMPLETE_REPAIR' || action === 'REQUEST_VERIFICATION') return 'VERIFICATION_PENDING';
  if (action === 'VERIFY_SUCCESS') return 'RECOVERED';
  return state.recoveryStatus === 'RECOVERED' ? 'VERIFICATION_PENDING' : state.recoveryStatus;
}

export function revisionDeskExplanation(candidate: RevisionDeskCandidate) { return { why: candidate.reasons.length ? 'QUALIFIED_EVIDENCE_DEBT' : 'SIGNAL_REQUIRES_DIAGNOSIS', evidenceIds: candidate.evidenceIds, stage: candidate.stage, nextAction: candidate.nextAction, recoveryStatus: candidate.recoveryStatus, inferredPrerequisite: candidate.inferredPrerequisite, rootCauseConfirmed: candidate.rootCauseConfirmed }; }
export function studentCanResolveCanonicalDebt(): boolean { return false; }
export function rankRadarCanAuthorRecovery(): boolean { return false; }
export function isCanonicalWriter(actor: 'STUDENT' | 'SERVER'): boolean { return canWriteCanonicalLearningState(actor); }
