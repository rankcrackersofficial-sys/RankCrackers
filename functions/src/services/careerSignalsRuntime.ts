import { createHash } from 'crypto';
import { stableSerialize } from './profileSnapshotAuthority';
import { CareerSignalEligibilityState, CareerSignalEvaluationReference, buildCareerSignal } from './careerSignalAuthority';

export type CareerSignalType = 'NEW_VERIFIED_OPPORTUNITY' | 'APPLICATION_OPEN' | 'APPLICATION_CLOSING' | 'OFFICIAL_CORRIGENDUM' | 'ELIGIBILITY_CHANGED' | 'MORE_INFORMATION_REQUIRED' | 'EXAM_DATE_UPDATED' | 'ADMIT_CARD_UPDATE' | 'ANSWER_KEY_UPDATE' | 'RESULT_UPDATE';

export interface RecruitmentAuthorityInput {
  recruitmentEventId: string; postId?: string; postGroupId?: string; missionId?: string;
  examName?: string; authority?: string; sourceDocumentId?: string; sourceVersion?: string;
  ruleSetId?: string; ruleSetVersion?: string; officialFacts?: Record<string, unknown>;
  guidance?: Record<string, string>; eligibility: CareerSignalEvaluationReference;
}

export function buildPersonalizedRecruitmentDossier(input: RecruitmentAuthorityInput) {
  const hasSource = Boolean(input.sourceDocumentId && input.sourceVersion);
  const eligibility = hasSource ? buildCareerSignal({ evaluation: input.eligibility }) : buildCareerSignal({});
  return {
    kind: 'PERSONALIZED_RECRUITMENT_DOSSIER', examName: input.examName ?? null,
    recruitmentEventId: input.recruitmentEventId, postId: input.postId ?? null, postGroupId: input.postGroupId ?? null,
    missionId: input.missionId ?? null, authority: input.authority ?? null,
    officialFacts: input.officialFacts ?? {}, guidance: input.guidance ?? {},
    sourceDocumentId: input.sourceDocumentId ?? null, sourceVersion: input.sourceVersion ?? null,
    ruleSetId: input.ruleSetId ?? null, ruleSetVersion: input.ruleSetVersion ?? null,
    eligibilityState: hasSource ? input.eligibility.state : 'INTEGRITY_HOLD' as CareerSignalEligibilityState,
    eligibilityEvaluationId: hasSource ? input.eligibility.evaluationId : null,
    missingRequiredFacts: hasSource ? input.eligibility.missingRequiredFacts ?? [] : [],
    careerSignal: eligibility,
  };
}

export function buildDeliveryDecision(signal: ReturnType<typeof buildCareerSignal>, email?: string | null) {
  return { eligibility: signal.eligibilityState, deliveryChannel: email ? 'EMAIL_AVAILABLE' : 'INCOMPLETE', deliverable: Boolean(email), eligibilityQualified: signal.eligibilityQualified };
}

export function careerSignalIdentity(studentId: string, input: { recruitmentEventId: string; postId?: string; sourceVersion?: string; evaluationId: string; type: CareerSignalType }) {
  return createHash('sha256').update(stableSerialize(input)).update(studentId).digest('hex');
}

export function isCurrentEvaluation(currentFingerprint: string, evaluation: { profileMaterialFactsFingerprint?: string; profileSnapshotId?: string }, currentSnapshotId: string) {
  return evaluation.profileSnapshotId === currentSnapshotId && evaluation.profileMaterialFactsFingerprint === currentFingerprint;
}

export function buildDiscoverySignal(stream: 'MISSION_SIGNAL' | 'PROFILE_OPPORTUNITY_SIGNAL', input: RecruitmentAuthorityInput) {
  const dossier = buildPersonalizedRecruitmentDossier(input);
  return { stream, dossier, authoritative: dossier.eligibilityState === 'ELIGIBLE', missionRelevanceOnly: stream === 'MISSION_SIGNAL' && dossier.eligibilityState !== 'ELIGIBLE' };
}
