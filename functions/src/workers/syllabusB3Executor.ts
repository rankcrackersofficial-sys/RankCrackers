import { createHash } from 'crypto';
import {
  B3_CONTRACT_VERSION,
  B3MaterializationInput,
  B3MaterializationResult,
} from '../syllabus/b3Contract';
import { B3StructuralMaterializer } from '../syllabus/b3StructuralMaterializer';
import {
  B3GovernedRevisionIdentity,
  B3MaterializationRepository,
  B3PersistenceConflictError,
  B3SealedPersistenceProof,
  B3_REVISION_STATE_SEALED,
} from '../syllabus/b3MaterializationRepository';

export interface SyllabusB3ExecutorInput {
  revisionIdentity: B3GovernedRevisionIdentity;
  materializationInput: B3MaterializationInput;
}

export interface B3ExecutorCompletionProof {
  proofType: 'B3_EXECUTOR_COMPLETION_PROOF';
  missionId: string;
  revisionId: string;
  authoritativeSourceChainId: string;
  orderedSources: B3GovernedRevisionIdentity['orderedSources'];
  verifiedExtractionIds: string[];
  contractVersion: typeof B3_CONTRACT_VERSION;
  declaredCompletenessScope: B3MaterializationResult['declaredCompletenessScope'];
  sealedPersistenceStatus: 'SEALED' | 'IDEMPOTENT_REUSE';
  persistenceContentIntegrityHash: string;
  persistenceIdempotencyIdentity: string;
  canonicalNodeIds: string[];
  unresolvedEvidenceIds: string[];
  unresolvedRequiredEvidenceIds: string[];
  materializationManifestHash: string;
  lineageIntegrityHash: string;
  materializerCompletionEligibility: B3MaterializationResult['completionEligibility'];
}

export type B3ExecutorFailureStatus =
  | 'INVALID_AUTHORITY_INPUT'
  | 'MATERIALIZATION_INELIGIBLE'
  | 'PERSISTENCE_CONFLICT'
  | 'PERSISTENCE_FAILURE'
  | 'NON_AUTHORITATIVE_PERSISTENCE'
  | 'PROOF_BINDING_MISMATCH';

export type SyllabusB3ExecutorResult =
  | {
    completed: true;
    status: 'SEALED_AUTHORITATIVE' | 'IDEMPOTENT_SEALED_REUSE';
    materializationResult: B3MaterializationResult;
    completionProof: B3ExecutorCompletionProof;
  }
  | {
    completed: false;
    status: B3ExecutorFailureStatus;
    materializationResult?: B3MaterializationResult;
    reason: string;
  };

export interface B3MaterializerDependency {
  materialize(input: B3MaterializationInput): B3MaterializationResult;
}

export interface B3RepositoryDependency {
  persistAuthoritatively(
    identity: B3GovernedRevisionIdentity,
    result: B3MaterializationResult,
  ): Promise<B3SealedPersistenceProof>;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.keys(record).sort().reduce<Record<string, unknown>>((result, key) => {
      if (record[key] !== undefined) result[key] = stableValue(record[key]);
      return result;
    }, {});
  }
  return value;
}

function deterministicHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(stableValue(value))).digest('hex');
}

function nonEmpty(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (new Set(left).size !== left.length || new Set(right).size !== right.length) return false;
  return [...left].sort().join('|') === [...right].sort().join('|');
}

function validateAuthorityInput(input: SyllabusB3ExecutorInput): string | null {
  const { revisionIdentity, materializationInput } = input;
  if (!nonEmpty(revisionIdentity.missionId)) return 'MISSING_MISSION_ID';
  if (!nonEmpty(revisionIdentity.authoritativeSourceChainId)) return 'MISSING_SOURCE_CHAIN_ID';
  if (!nonEmpty(revisionIdentity.revisionId)) return 'MISSING_REVISION_ID';
  if (revisionIdentity.contractVersion !== B3_CONTRACT_VERSION
      || materializationInput.contractVersion !== B3_CONTRACT_VERSION
      || revisionIdentity.contractVersion !== materializationInput.contractVersion) {
    return 'CONTRACT_VERSION_MISMATCH';
  }
  if (revisionIdentity.orderedSources.length === 0) return 'MISSING_ORDERED_SOURCES';
  if (revisionIdentity.verifiedExtractionIds.length === 0) return 'MISSING_VERIFIED_EXTRACTIONS';
  if (materializationInput.evidence.length === 0) return 'MISSING_CANONICAL_EVIDENCE';
  if (materializationInput.declaredCompletenessScope.requiredEvidenceIds.length === 0) {
    return 'MISSING_DECLARED_MATERIALIZATION_SCOPE';
  }

  const sourceKeys = new Set<string>();
  for (const source of revisionIdentity.orderedSources) {
    if (!nonEmpty(source.sourceId)
        || !nonEmpty(source.documentId)
        || !nonEmpty(source.sourceVersionId)
        || !nonEmpty(source.sourceSha256)) {
      return 'INCOMPLETE_SOURCE_AUTHORITY';
    }
    const key = [
      source.sourceId,
      source.documentId,
      source.sourceVersionId,
      source.sourceSha256,
    ].join('|');
    if (sourceKeys.has(key)) return 'DUPLICATE_SOURCE_AUTHORITY';
    sourceKeys.add(key);
  }

  const evidenceExtractionIds: string[] = [];
  for (const evidence of materializationInput.evidence) {
    if (evidence.lineage.missionId !== revisionIdentity.missionId) return 'MISSION_BINDING_MISMATCH';
    const sourceKey = [
      evidence.lineage.sourceId,
      evidence.lineage.documentId,
      evidence.lineage.sourceVersionId,
      evidence.lineage.sourceSha256,
    ].join('|');
    if (!sourceKeys.has(sourceKey)) return 'SOURCE_BINDING_MISMATCH';
    if (!nonEmpty(evidence.lineage.extractionId)) return 'MISSING_EXTRACTION_ID';
    evidenceExtractionIds.push(evidence.lineage.extractionId);
  }
  if (!sameStringSet(revisionIdentity.verifiedExtractionIds, evidenceExtractionIds)) {
    return 'VERIFIED_EXTRACTION_SET_MISMATCH';
  }
  return null;
}

function materializationManifest(result: B3MaterializationResult) {
  return {
    canonicalNodes: result.canonicalMaterializedNodes.map(node => ({
      nodeId: node.nodeId,
      integrityHash: deterministicHash(node),
    })),
    unresolvedEvidence: result.unresolvedSourceEvidence.map(item => ({
      evidenceId: item.evidence.evidenceId,
      integrityHash: deterministicHash(item),
    })),
    completionEligibility: result.completionEligibility,
  };
}

function persistenceBindingError(
  identity: B3GovernedRevisionIdentity,
  proof: B3SealedPersistenceProof,
  result: B3MaterializationResult,
): string | null {
  if (proof.missionId !== identity.missionId) return 'PERSISTENCE_MISSION_MISMATCH';
  if (proof.revisionId !== identity.revisionId) return 'PERSISTENCE_REVISION_MISMATCH';
  if (proof.revisionState !== B3_REVISION_STATE_SEALED) return 'PERSISTENCE_NOT_SEALED';
  if (proof.status !== 'SEALED' && proof.status !== 'IDEMPOTENT_REUSE') {
    return 'PERSISTENCE_STATUS_NOT_AUTHORITATIVE';
  }
  if (!nonEmpty(proof.contentIntegrityHash)) return 'MISSING_PERSISTENCE_CONTENT_HASH';
  if (!nonEmpty(proof.idempotencyIdentity)) return 'MISSING_PERSISTENCE_IDEMPOTENCY_IDENTITY';
  const expectedContentIntegrityHash = deterministicHash({
    revisionIdentity: identity,
    declaredCompletenessScope: result.declaredCompletenessScope,
    canonicalMaterializedNodes: result.canonicalMaterializedNodes,
    unresolvedSourceEvidence: result.unresolvedSourceEvidence,
    completionEligibility: result.completionEligibility,
  });
  if (proof.contentIntegrityHash !== expectedContentIntegrityHash) {
    return 'PERSISTENCE_CONTENT_INTEGRITY_MISMATCH';
  }
  return null;
}

export class SyllabusB3Executor {
  constructor(
    private readonly materializer: B3MaterializerDependency,
    private readonly repository: B3RepositoryDependency,
  ) {}

  static usingCanonicalDependencies(
    repository: B3MaterializationRepository,
  ): SyllabusB3Executor {
    return new SyllabusB3Executor(new B3StructuralMaterializer(), repository);
  }

  async execute(input: SyllabusB3ExecutorInput): Promise<SyllabusB3ExecutorResult> {
    const authorityError = validateAuthorityInput(input);
    if (authorityError) {
      return {
        completed: false,
        status: 'INVALID_AUTHORITY_INPUT',
        reason: authorityError,
      };
    }

    let materializationResult: B3MaterializationResult;
    try {
      materializationResult = this.materializer.materialize(input.materializationInput);
    } catch (error) {
      return {
        completed: false,
        status: 'MATERIALIZATION_INELIGIBLE',
        reason: error instanceof Error ? error.message : 'MATERIALIZER_FAILURE',
      };
    }

    if (!materializationResult.completionEligibility.eligible
        || materializationResult.completionEligibility.unresolvedRequiredEvidenceIds.length > 0) {
      return {
        completed: false,
        status: 'MATERIALIZATION_INELIGIBLE',
        materializationResult,
        reason: 'CANONICAL_MATERIALIZATION_NOT_COMPLETION_ELIGIBLE',
      };
    }

    let persistenceProof: B3SealedPersistenceProof;
    try {
      persistenceProof = await this.repository.persistAuthoritatively(
        input.revisionIdentity,
        materializationResult,
      );
    } catch (error) {
      if (error instanceof B3PersistenceConflictError) {
        return {
          completed: false,
          status: 'PERSISTENCE_CONFLICT',
          materializationResult,
          reason: error.message,
        };
      }
      return {
        completed: false,
        status: 'PERSISTENCE_FAILURE',
        materializationResult,
        reason: error instanceof Error ? error.message : 'UNKNOWN_PERSISTENCE_FAILURE',
      };
    }

    const bindingError = persistenceBindingError(
      input.revisionIdentity,
      persistenceProof,
      materializationResult,
    );
    if (bindingError) {
      return {
        completed: false,
        status: bindingError === 'PERSISTENCE_NOT_SEALED'
          || bindingError === 'PERSISTENCE_STATUS_NOT_AUTHORITATIVE'
          ? 'NON_AUTHORITATIVE_PERSISTENCE'
          : 'PROOF_BINDING_MISMATCH',
        materializationResult,
        reason: bindingError,
      };
    }

    const manifest = materializationManifest(materializationResult);
    const completionProof: B3ExecutorCompletionProof = {
      proofType: 'B3_EXECUTOR_COMPLETION_PROOF',
      missionId: input.revisionIdentity.missionId,
      revisionId: input.revisionIdentity.revisionId,
      authoritativeSourceChainId: input.revisionIdentity.authoritativeSourceChainId,
      orderedSources: input.revisionIdentity.orderedSources,
      verifiedExtractionIds: input.revisionIdentity.verifiedExtractionIds,
      contractVersion: input.revisionIdentity.contractVersion,
      declaredCompletenessScope: materializationResult.declaredCompletenessScope,
      sealedPersistenceStatus: persistenceProof.status,
      persistenceContentIntegrityHash: persistenceProof.contentIntegrityHash,
      persistenceIdempotencyIdentity: persistenceProof.idempotencyIdentity,
      canonicalNodeIds: materializationResult.canonicalMaterializedNodes.map(node => node.nodeId),
      unresolvedEvidenceIds: materializationResult.unresolvedSourceEvidence
        .map(item => item.evidence.evidenceId),
      unresolvedRequiredEvidenceIds: materializationResult.completionEligibility
        .unresolvedRequiredEvidenceIds,
      materializationManifestHash: deterministicHash(manifest),
      lineageIntegrityHash: deterministicHash({
        canonicalOccurrences: materializationResult.canonicalMaterializedNodes
          .map(node => ({ nodeId: node.nodeId, occurrences: node.supportingOccurrences })),
        unresolvedEvidence: materializationResult.unresolvedSourceEvidence
          .map(item => ({ evidenceId: item.evidence.evidenceId, lineage: item.evidence.lineage })),
      }),
      materializerCompletionEligibility: materializationResult.completionEligibility,
    };

    return {
      completed: true,
      status: persistenceProof.status === 'IDEMPOTENT_REUSE'
        ? 'IDEMPOTENT_SEALED_REUSE'
        : 'SEALED_AUTHORITATIVE',
      materializationResult,
      completionProof,
    };
  }
}
