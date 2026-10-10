import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { stableSerialize } from './profileSnapshotAuthority';

export const ELIGIBILITY_SCHEMA_VERSION = 'eligibility_evaluation_v1';
export const ELIGIBILITY_STATES = ['ELIGIBLE', 'NOT_ELIGIBLE', 'MORE_INFORMATION_REQUIRED', 'OFFICIAL_RULE_UNRESOLVED', 'SOURCE_STALE_OR_SUPERSEDED', 'INTEGRITY_HOLD'] as const;
export type EligibilityState = typeof ELIGIBILITY_STATES[number];
export type RuleOutcome = 'PASS' | 'FAIL' | 'MISSING_FACT' | 'UNRESOLVED';

export interface EligibilityRule { ruleId: string; requiredFact?: string; outcome: RuleOutcome; reasonCode: string; evidenceRef: string; }
export interface EligibilityInput {
  studentId: string; recruitmentEventId: string; postId?: string; postGroupId?: string;
  profileSnapshotId: string; profileMaterialFactsFingerprint: string; ruleSetId: string; ruleSetVersion: string;
  sourceDocumentId: string; sourceVersion: string; rules: EligibilityRule[];
  sourceStale?: boolean; integrityValid?: boolean;
}

const precedence: EligibilityState[] = ['INTEGRITY_HOLD', 'SOURCE_STALE_OR_SUPERSEDED', 'OFFICIAL_RULE_UNRESOLVED', 'MORE_INFORMATION_REQUIRED', 'NOT_ELIGIBLE', 'ELIGIBLE'];

export function resolveEligibilityState(input: Pick<EligibilityInput, 'rules' | 'sourceStale' | 'integrityValid'>): EligibilityState {
  if (input.integrityValid === false) return 'INTEGRITY_HOLD';
  if (input.sourceStale) return 'SOURCE_STALE_OR_SUPERSEDED';
  if (input.rules.some(r => r.outcome === 'UNRESOLVED')) return 'OFFICIAL_RULE_UNRESOLVED';
  if (input.rules.some(r => r.outcome === 'MISSING_FACT')) return 'MORE_INFORMATION_REQUIRED';
  if (input.rules.some(r => r.outcome === 'FAIL')) return 'NOT_ELIGIBLE';
  return 'ELIGIBLE';
}

export function evaluationIdentity(input: Omit<EligibilityInput, 'rules' | 'sourceStale' | 'integrityValid'>): string {
  return createHash('sha256').update(stableSerialize({
    schemaVersion: ELIGIBILITY_SCHEMA_VERSION, studentId: input.studentId, recruitmentEventId: input.recruitmentEventId,
    postId: input.postId ?? null, postGroupId: input.postGroupId ?? null, profileSnapshotId: input.profileSnapshotId,
    profileMaterialFactsFingerprint: input.profileMaterialFactsFingerprint, ruleSetId: input.ruleSetId,
    ruleSetVersion: input.ruleSetVersion, sourceDocumentId: input.sourceDocumentId, sourceVersion: input.sourceVersion,
  })).digest('hex');
}

export function buildEligibilityEvaluation(input: EligibilityInput) {
  if (!input.studentId || !input.profileSnapshotId || !input.profileMaterialFactsFingerprint || !input.ruleSetVersion || !input.sourceVersion) {
    return { state: 'INTEGRITY_HOLD' as const, reasonCodes: ['MISSING_AUTHORITY_BINDING'], missingRequiredFacts: [], unresolvedRules: [], ruleResults: input.rules };
  }
  const state = resolveEligibilityState(input);
  return {
    evaluationId: evaluationIdentity(input), schemaVersion: ELIGIBILITY_SCHEMA_VERSION, studentId: input.studentId,
    recruitmentEventId: input.recruitmentEventId, postId: input.postId ?? null, postGroupId: input.postGroupId ?? null,
    profileSnapshotId: input.profileSnapshotId, profileMaterialFactsFingerprint: input.profileMaterialFactsFingerprint,
    ruleSetId: input.ruleSetId, ruleSetVersion: input.ruleSetVersion, sourceDocumentId: input.sourceDocumentId,
    sourceVersion: input.sourceVersion, state, ruleResults: input.rules,
    missingRequiredFacts: input.rules.filter(r => r.outcome === 'MISSING_FACT').map(r => r.requiredFact).filter((fact): fact is string => Boolean(fact)),
    unresolvedRules: input.rules.filter(r => r.outcome === 'UNRESOLVED').map(r => r.ruleId),
    reasonCodes: input.rules.map(r => r.reasonCode), immutable: true,
  };
}

export async function persistEligibilityEvaluation(input: EligibilityInput) {
  const db = admin.firestore();
  const evaluation = buildEligibilityEvaluation(input);
  const ref = db.collection('eligibility_evaluations').doc(evaluation.evaluationId ?? evaluationIdentity(input));
  await db.runTransaction(async tx => {
    const existing = await tx.get(ref);
    if (!existing.exists) tx.create(ref, { ...evaluation, evaluatedAt: admin.firestore.FieldValue.serverTimestamp() });
  });
  return evaluation;
}
