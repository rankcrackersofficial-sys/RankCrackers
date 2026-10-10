export type CareerSignalEligibilityState =
  | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'MORE_INFORMATION_REQUIRED'
  | 'OFFICIAL_RULE_UNRESOLVED' | 'SOURCE_STALE_OR_SUPERSEDED' | 'INTEGRITY_HOLD';

export interface CareerSignalEvaluationReference {
  evaluationId: string;
  state: CareerSignalEligibilityState;
  recruitmentEventId?: string;
  postId?: string | null;
  profileSnapshotId?: string;
  ruleSetVersion?: string;
  sourceVersion?: string;
  missingRequiredFacts?: string[];
}

export interface CareerSignalInput {
  evaluation?: CareerSignalEvaluationReference | null;
  missionRelevance?: number;
  notificationRelevance?: number;
  legacyMatchScore?: number;
  legacyEligible?: boolean;
  rank?: number;
  mastery?: number;
  testArenaRank?: number;
  revisionDebt?: number;
}

export function buildCareerSignal(input: CareerSignalInput) {
  const evaluation = input.evaluation;
  if (!evaluation || !evaluation.evaluationId) {
    return { kind: 'CAREER_SIGNAL', eligibilityQualified: false, eligibilityState: 'INTEGRITY_HOLD' as const, reasonCode: 'AUTHORITY_MISSING' };
  }
  const positive = evaluation.state === 'ELIGIBLE';
  return {
    kind: 'CAREER_SIGNAL', eligibilityQualified: positive, eligibilityState: evaluation.state,
    evaluationId: evaluation.evaluationId, recruitmentEventId: evaluation.recruitmentEventId ?? null,
    postId: evaluation.postId ?? null, profileSnapshotId: evaluation.profileSnapshotId ?? null,
    ruleSetVersion: evaluation.ruleSetVersion ?? null, sourceVersion: evaluation.sourceVersion ?? null,
    missingRequiredFacts: evaluation.missingRequiredFacts ?? [],
    missionRelevance: input.missionRelevance ?? null,
    notificationRelevance: input.notificationRelevance ?? null,
  };
}
