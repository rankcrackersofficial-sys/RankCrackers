import { createHash } from 'crypto';
import { stableSerialize } from './profileSnapshotAuthority';

export type LearningEvidenceSource = 'CRUCIBLE_MICRO' | 'CRUCIBLE_MACRO' | 'CRUCIBLE_REBUILD' | 'TEST_ARENA' | 'PYQ_PRACTICE';
export type RecoveryStatus = 'OPEN' | 'REPAIR_IN_PROGRESS' | 'VERIFICATION_PENDING' | 'RECOVERED';
export interface QualifiedLearningEvidence { evidenceId: string; source: LearningEvidenceSource; studentId: string; missionId: string; knowledgeId: string; atomId?: string; evidenceVersion: string; taught: boolean; qualified: boolean; outcome?: 'CORRECT' | 'INCORRECT' | 'STABLE' | 'UNSTABLE'; occurredAt?: string; correctedFromEvidenceId?: string; }
export interface LearningStateInput { studentId: string; missionId: string; knowledgeId: string; atomId?: string; evidence: QualifiedLearningEvidence[]; recoveryStatus?: RecoveryStatus; verificationEvidenceIds?: string[]; priorState?: CanonicalLearningState; }
export interface CanonicalLearningState { stateId: string; schemaVersion: 'learning_state_v1'; studentId: string; missionId: string; knowledgeId: string; atomId: string | null; masteryEvidence: QualifiedLearningEvidence[]; retentionEvidence: QualifiedLearningEvidence[]; revisionDebt: { open: boolean; reasonCodes: string[]; evidenceIds: string[] }; recoveryStatus: RecoveryStatus; recoveryEvidenceIds: string[]; sourceEvidenceIds: string[]; supersedesStateId: string | null; immutable: true; }

export function learningStateIdentity(input: Pick<LearningStateInput, 'studentId' | 'missionId' | 'knowledgeId' | 'atomId' | 'evidence'>): string { return createHash('sha256').update(stableSerialize({ studentId: input.studentId, missionId: input.missionId, knowledgeId: input.knowledgeId, atomId: input.atomId ?? null, evidence: input.evidence.map(e => ({ id: e.evidenceId, version: e.evidenceVersion, outcome: e.outcome })) })).digest('hex'); }
export function deriveCanonicalLearningState(input: LearningStateInput): CanonicalLearningState {
  const eligible = input.evidence.filter(e => e.studentId === input.studentId && e.missionId === input.missionId && e.knowledgeId === input.knowledgeId && e.taught && e.qualified);
  const masteryEvidence = eligible.filter(e => e.outcome === 'CORRECT' || e.outcome === 'STABLE');
  const retentionEvidence = eligible.filter(e => e.source === 'TEST_ARENA' || e.outcome === 'STABLE');
  const debtEvidence = eligible.filter(e => e.outcome === 'INCORRECT' || e.outcome === 'UNSTABLE');
  const verified = (input.verificationEvidenceIds ?? []).filter(id => eligible.some(e => e.evidenceId === id));
  const recovered = input.recoveryStatus === 'RECOVERED' && verified.length > 0;
  const recoveryStatus = recovered ? 'RECOVERED' : (input.recoveryStatus === 'RECOVERED' ? 'VERIFICATION_PENDING' : (input.recoveryStatus ?? (debtEvidence.length ? 'OPEN' : 'OPEN')));
  return { stateId: learningStateIdentity(input), schemaVersion: 'learning_state_v1', studentId: input.studentId, missionId: input.missionId, knowledgeId: input.knowledgeId, atomId: input.atomId ?? null, masteryEvidence, retentionEvidence, revisionDebt: { open: debtEvidence.length > 0 && !recovered, reasonCodes: debtEvidence.map(e => e.outcome === 'INCORRECT' ? 'QUALIFIED_INCORRECT_RESPONSE' : 'QUALIFIED_INSTABILITY'), evidenceIds: debtEvidence.map(e => e.evidenceId) }, recoveryStatus, recoveryEvidenceIds: verified, sourceEvidenceIds: eligible.map(e => e.evidenceId), supersedesStateId: input.priorState?.stateId ?? null, immutable: true };
}
export function canWriteCanonicalLearningState(actor: 'STUDENT' | 'FOUNDER_CLIENT' | 'SERVER'): boolean { return actor === 'SERVER'; }
export function preserveAcrossRollover(state: CanonicalLearningState): CanonicalLearningState { return { ...state, masteryEvidence: [...state.masteryEvidence], retentionEvidence: [...state.retentionEvidence], revisionDebt: { ...state.revisionDebt }, recoveryEvidenceIds: [...state.recoveryEvidenceIds], sourceEvidenceIds: [...state.sourceEvidenceIds] }; }
export function isRootCauseProven(reasonCodes: string[]): boolean { return reasonCodes.includes('QUALIFIED_INCORRECT_RESPONSE') || reasonCodes.includes('QUALIFIED_INSTABILITY'); }
