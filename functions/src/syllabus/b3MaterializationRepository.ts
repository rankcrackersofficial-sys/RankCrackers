import { createHash } from 'crypto';
import {
  B3_CONTRACT_VERSION,
  B3CompletionEligibility,
  B3DeclaredCompletenessScope,
  B3MaterializationResult,
  B3MaterializedNode,
  B3UnresolvedSourceEvidence,
} from './b3Contract';

export const B3_REVISION_STATE_STAGING = 'STAGING_NON_AUTHORITATIVE' as const;
export const B3_REVISION_STATE_SEALED = 'SEALED_AUTHORITATIVE' as const;

export interface B3GovernedSourceIdentity {
  sourceId: string;
  documentId: string;
  sourceVersionId: string;
  sourceSha256: string;
}

export interface B3GovernedRevisionIdentity {
  missionId: string;
  authoritativeSourceChainId: string;
  orderedSources: B3GovernedSourceIdentity[];
  verifiedExtractionIds: string[];
  contractVersion: typeof B3_CONTRACT_VERSION;
  revisionId: string;
  supersedesRevisionId?: string;
}

export interface B3RevisionManifestEntry {
  id: string;
  integrityHash: string;
}

export interface B3RevisionEnvelope {
  missionId: string;
  revisionId: string;
  revisionIdentity: B3GovernedRevisionIdentity;
  declaredCompletenessScope: B3DeclaredCompletenessScope;
  idempotencyIdentity: string;
  contentIntegrityHash: string;
  canonicalNodeManifest: B3RevisionManifestEntry[];
  unresolvedEvidenceManifest: B3RevisionManifestEntry[];
  canonicalNodeCount: number;
  unresolvedEvidenceCount: number;
  completionEligibility: B3CompletionEligibility;
  state: typeof B3_REVISION_STATE_STAGING | typeof B3_REVISION_STATE_SEALED;
}

export interface B3CurrentAuthorityPointer {
  missionId: string;
  revisionId: string;
  idempotencyIdentity: string;
  contentIntegrityHash: string;
  revisionState: typeof B3_REVISION_STATE_SEALED;
}

export interface B3PersistenceTransaction {
  get(path: string): Promise<unknown | undefined>;
  create(path: string, value: unknown): void;
  set(path: string, value: unknown): void;
}

export interface B3MaterializationPersistenceStore {
  get(path: string): Promise<unknown | undefined>;
  create(path: string, value: unknown): Promise<void>;
  runTransaction<T>(work: (transaction: B3PersistenceTransaction) => Promise<T>): Promise<T>;
}

export type B3PersistenceStatus = 'STAGED' | 'SEALED' | 'IDEMPOTENT_REUSE';

export interface B3StagingProof {
  status: 'STAGED' | 'IDEMPOTENT_REUSE';
  missionId: string;
  revisionId: string;
  revisionRootPath: string;
  contentIntegrityHash: string;
  idempotencyIdentity: string;
}

export interface B3SealedPersistenceProof {
  status: 'SEALED' | 'IDEMPOTENT_REUSE';
  missionId: string;
  revisionId: string;
  revisionRootPath: string;
  currentPointerPath: string;
  contentIntegrityHash: string;
  idempotencyIdentity: string;
  revisionState: typeof B3_REVISION_STATE_SEALED;
}

export class B3PersistenceConflictError extends Error {
  constructor(
    public readonly path: string,
    public readonly conflictKind: string,
  ) {
    super(`B3_PERSISTENCE_CONFLICT:${conflictKind}:${path}`);
    this.name = 'B3PersistenceConflictError';
  }
}

export class B3PersistenceValidationError extends Error {
  constructor(public readonly reason: string) {
    super(`B3_PERSISTENCE_VALIDATION_FAILED:${reason}`);
    this.name = 'B3PersistenceValidationError';
  }
}

function assertNonEmpty(value: string, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new B3PersistenceValidationError(`MISSING_${field}`);
  }
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

function stableSerialize(value: unknown): string {
  return JSON.stringify(stableValue(value));
}

function integrityHash(value: unknown): string {
  return createHash('sha256').update(stableSerialize(value)).digest('hex');
}

function exactEqual(left: unknown, right: unknown): boolean {
  return stableSerialize(left) === stableSerialize(right);
}

export function b3RevisionRootPath(missionId: string, revisionId: string): string {
  return `mission_realms/${missionId}/b3_materialization_revisions/${revisionId}`;
}

export function b3CanonicalNodePath(missionId: string, revisionId: string, nodeId: string): string {
  return `${b3RevisionRootPath(missionId, revisionId)}/canonical_nodes/${nodeId}`;
}

export function b3UnresolvedEvidencePath(
  missionId: string,
  revisionId: string,
  evidenceId: string,
): string {
  return `${b3RevisionRootPath(missionId, revisionId)}/unresolved_evidence/${evidenceId}`;
}

export function b3CurrentAuthorityPointerPath(missionId: string): string {
  return `mission_realms/${missionId}/b3_materialization_authority/current`;
}

function validateRevisionIdentity(identity: B3GovernedRevisionIdentity): void {
  assertNonEmpty(identity.missionId, 'MISSION_ID');
  assertNonEmpty(identity.authoritativeSourceChainId, 'SOURCE_CHAIN_ID');
  assertNonEmpty(identity.revisionId, 'REVISION_ID');
  if (identity.contractVersion !== B3_CONTRACT_VERSION) {
    throw new B3PersistenceValidationError('UNSUPPORTED_B3_CONTRACT_VERSION');
  }
  if (identity.orderedSources.length === 0) {
    throw new B3PersistenceValidationError('MISSING_ORDERED_SOURCES');
  }
  identity.orderedSources.forEach((source, index) => {
    assertNonEmpty(source.sourceId, `SOURCE_ID_${index}`);
    assertNonEmpty(source.documentId, `DOCUMENT_ID_${index}`);
    assertNonEmpty(source.sourceVersionId, `SOURCE_VERSION_ID_${index}`);
    assertNonEmpty(source.sourceSha256, `SOURCE_SHA256_${index}`);
  });
  if (identity.verifiedExtractionIds.length === 0) {
    throw new B3PersistenceValidationError('MISSING_VERIFIED_EXTRACTION_IDS');
  }
  identity.verifiedExtractionIds.forEach((id, index) => assertNonEmpty(id, `EXTRACTION_ID_${index}`));
}

function assertUniqueIds(values: string[], kind: string): void {
  if (new Set(values).size !== values.length) {
    throw new B3PersistenceValidationError(`DUPLICATE_${kind}_ID`);
  }
}

function createEnvelope(
  identity: B3GovernedRevisionIdentity,
  result: B3MaterializationResult,
): B3RevisionEnvelope {
  validateRevisionIdentity(identity);
  assertUniqueIds(result.canonicalMaterializedNodes.map(node => node.nodeId), 'CANONICAL_NODE');
  assertUniqueIds(result.unresolvedSourceEvidence.map(item => item.evidence.evidenceId), 'UNRESOLVED_EVIDENCE');

  const canonicalNodeManifest = result.canonicalMaterializedNodes.map(node => ({
    id: node.nodeId,
    integrityHash: integrityHash(node),
  }));
  const unresolvedEvidenceManifest = result.unresolvedSourceEvidence.map(item => ({
    id: item.evidence.evidenceId,
    integrityHash: integrityHash(item),
  }));
  const idempotencyIdentity = integrityHash({
    missionId: identity.missionId,
    authoritativeSourceChainId: identity.authoritativeSourceChainId,
    orderedSources: identity.orderedSources,
    verifiedExtractionIds: identity.verifiedExtractionIds,
    contractVersion: identity.contractVersion,
    revisionId: identity.revisionId,
    declaredCompletenessScope: result.declaredCompletenessScope,
  });
  const contentIntegrityHash = integrityHash({
    revisionIdentity: identity,
    declaredCompletenessScope: result.declaredCompletenessScope,
    canonicalMaterializedNodes: result.canonicalMaterializedNodes,
    unresolvedSourceEvidence: result.unresolvedSourceEvidence,
    completionEligibility: result.completionEligibility,
  });

  return {
    missionId: identity.missionId,
    revisionId: identity.revisionId,
    revisionIdentity: identity,
    declaredCompletenessScope: result.declaredCompletenessScope,
    idempotencyIdentity,
    contentIntegrityHash,
    canonicalNodeManifest,
    unresolvedEvidenceManifest,
    canonicalNodeCount: canonicalNodeManifest.length,
    unresolvedEvidenceCount: unresolvedEvidenceManifest.length,
    completionEligibility: result.completionEligibility,
    state: B3_REVISION_STATE_STAGING,
  };
}

function asEnvelope(value: unknown): B3RevisionEnvelope | undefined {
  if (!value || typeof value !== 'object') return undefined;
  return value as B3RevisionEnvelope;
}

export class B3MaterializationRepository {
  constructor(private readonly store: B3MaterializationPersistenceStore) {}

  async stage(
    identity: B3GovernedRevisionIdentity,
    result: B3MaterializationResult,
  ): Promise<B3StagingProof> {
    const envelope = createEnvelope(identity, result);
    const rootPath = b3RevisionRootPath(identity.missionId, identity.revisionId);
    const existingRoot = asEnvelope(await this.store.get(rootPath));

    if (existingRoot) {
      if (existingRoot.idempotencyIdentity !== envelope.idempotencyIdentity
          || existingRoot.contentIntegrityHash !== envelope.contentIntegrityHash
          || !exactEqual(existingRoot.revisionIdentity, envelope.revisionIdentity)) {
        throw new B3PersistenceConflictError(rootPath, 'SAME_REVISION_INCOMPATIBLE_CONTENT');
      }
      if (existingRoot.state === B3_REVISION_STATE_SEALED) {
        return this.stagingProof(envelope, 'IDEMPOTENT_REUSE');
      }
      if (existingRoot.state !== B3_REVISION_STATE_STAGING) {
        throw new B3PersistenceConflictError(rootPath, 'INVALID_REVISION_STATE');
      }
    } else {
      await this.store.create(rootPath, envelope);
    }

    for (const node of result.canonicalMaterializedNodes) {
      await this.createExactOrReuse(
        b3CanonicalNodePath(identity.missionId, identity.revisionId, node.nodeId),
        node,
      );
    }
    for (const unresolved of result.unresolvedSourceEvidence) {
      await this.createExactOrReuse(
        b3UnresolvedEvidencePath(
          identity.missionId,
          identity.revisionId,
          unresolved.evidence.evidenceId,
        ),
        unresolved,
      );
    }

    await this.validatePersistedState(envelope);
    return this.stagingProof(envelope, 'STAGED');
  }

  async seal(
    missionId: string,
    revisionId: string,
    expectedContentIntegrityHash: string,
  ): Promise<B3SealedPersistenceProof> {
    const rootPath = b3RevisionRootPath(missionId, revisionId);
    const pointerPath = b3CurrentAuthorityPointerPath(missionId);

    return this.store.runTransaction(async transaction => {
      const envelope = asEnvelope(await transaction.get(rootPath));
      if (!envelope) throw new B3PersistenceValidationError('REVISION_NOT_STAGED');
      if (envelope.missionId !== missionId || envelope.revisionId !== revisionId) {
        throw new B3PersistenceConflictError(rootPath, 'REVISION_IDENTITY_MISMATCH');
      }
      if (envelope.contentIntegrityHash !== expectedContentIntegrityHash) {
        throw new B3PersistenceConflictError(rootPath, 'EXPECTED_CONTENT_HASH_MISMATCH');
      }

      await this.validateTransactionalState(transaction, envelope);
      const existingPointer = await transaction.get(pointerPath) as B3CurrentAuthorityPointer | undefined;

      if (envelope.state === B3_REVISION_STATE_SEALED) {
        return this.sealedProof(envelope, 'IDEMPOTENT_REUSE');
      }
      if (envelope.state !== B3_REVISION_STATE_STAGING) {
        throw new B3PersistenceValidationError('REVISION_NOT_STAGING');
      }

      if (existingPointer) {
        if (existingPointer.revisionId === revisionId) {
          if (existingPointer.contentIntegrityHash !== envelope.contentIntegrityHash) {
            throw new B3PersistenceConflictError(pointerPath, 'POINTER_HASH_MISMATCH');
          }
        } else if (envelope.revisionIdentity.supersedesRevisionId !== existingPointer.revisionId) {
          throw new B3PersistenceConflictError(pointerPath, 'SUPERSESSION_MISMATCH');
        }
      } else if (envelope.revisionIdentity.supersedesRevisionId) {
        throw new B3PersistenceConflictError(pointerPath, 'SUPERSEDED_REVISION_NOT_CURRENT');
      }

      const sealedEnvelope: B3RevisionEnvelope = {
        ...envelope,
        state: B3_REVISION_STATE_SEALED,
      };
      const pointer: B3CurrentAuthorityPointer = {
        missionId,
        revisionId,
        idempotencyIdentity: envelope.idempotencyIdentity,
        contentIntegrityHash: envelope.contentIntegrityHash,
        revisionState: B3_REVISION_STATE_SEALED,
      };
      transaction.set(rootPath, sealedEnvelope);
      transaction.set(pointerPath, pointer);
      return this.sealedProof(sealedEnvelope, 'SEALED');
    });
  }

  async persistAuthoritatively(
    identity: B3GovernedRevisionIdentity,
    result: B3MaterializationResult,
  ): Promise<B3SealedPersistenceProof> {
    const staging = await this.stage(identity, result);
    if (staging.status === 'IDEMPOTENT_REUSE') {
      const envelope = asEnvelope(await this.store.get(staging.revisionRootPath));
      if (!envelope || envelope.state !== B3_REVISION_STATE_SEALED) {
        throw new B3PersistenceValidationError('IDEMPOTENT_REVISION_NOT_SEALED');
      }
      return this.sealedProof(envelope, 'IDEMPOTENT_REUSE');
    }
    return this.seal(identity.missionId, identity.revisionId, staging.contentIntegrityHash);
  }

  private async createExactOrReuse(path: string, value: B3MaterializedNode | B3UnresolvedSourceEvidence) {
    const existing = await this.store.get(path);
    if (existing === undefined) {
      await this.store.create(path, value);
      return;
    }
    if (!exactEqual(existing, value)) {
      throw new B3PersistenceConflictError(path, 'IMMUTABLE_CHILD_CONFLICT');
    }
  }

  private async validatePersistedState(envelope: B3RevisionEnvelope): Promise<void> {
    for (const entry of envelope.canonicalNodeManifest) {
      const path = b3CanonicalNodePath(envelope.missionId, envelope.revisionId, entry.id);
      const value = await this.store.get(path);
      if (value === undefined || integrityHash(value) !== entry.integrityHash) {
        throw new B3PersistenceValidationError(`CANONICAL_NODE_MANIFEST_MISMATCH:${entry.id}`);
      }
    }
    for (const entry of envelope.unresolvedEvidenceManifest) {
      const path = b3UnresolvedEvidencePath(envelope.missionId, envelope.revisionId, entry.id);
      const value = await this.store.get(path);
      if (value === undefined || integrityHash(value) !== entry.integrityHash) {
        throw new B3PersistenceValidationError(`UNRESOLVED_EVIDENCE_MANIFEST_MISMATCH:${entry.id}`);
      }
    }
  }

  private async validateTransactionalState(
    transaction: B3PersistenceTransaction,
    envelope: B3RevisionEnvelope,
  ): Promise<void> {
    if (envelope.canonicalNodeCount !== envelope.canonicalNodeManifest.length
        || envelope.unresolvedEvidenceCount !== envelope.unresolvedEvidenceManifest.length) {
      throw new B3PersistenceValidationError('MANIFEST_COUNT_MISMATCH');
    }
    for (const entry of envelope.canonicalNodeManifest) {
      const value = await transaction.get(
        b3CanonicalNodePath(envelope.missionId, envelope.revisionId, entry.id),
      );
      if (value === undefined || integrityHash(value) !== entry.integrityHash) {
        throw new B3PersistenceValidationError(`CANONICAL_NODE_MANIFEST_MISMATCH:${entry.id}`);
      }
    }
    for (const entry of envelope.unresolvedEvidenceManifest) {
      const value = await transaction.get(
        b3UnresolvedEvidencePath(envelope.missionId, envelope.revisionId, entry.id),
      );
      if (value === undefined || integrityHash(value) !== entry.integrityHash) {
        throw new B3PersistenceValidationError(`UNRESOLVED_EVIDENCE_MANIFEST_MISMATCH:${entry.id}`);
      }
    }
  }

  private stagingProof(
    envelope: B3RevisionEnvelope,
    status: B3StagingProof['status'],
  ): B3StagingProof {
    return {
      status,
      missionId: envelope.missionId,
      revisionId: envelope.revisionId,
      revisionRootPath: b3RevisionRootPath(envelope.missionId, envelope.revisionId),
      contentIntegrityHash: envelope.contentIntegrityHash,
      idempotencyIdentity: envelope.idempotencyIdentity,
    };
  }

  private sealedProof(
    envelope: B3RevisionEnvelope,
    status: B3SealedPersistenceProof['status'],
  ): B3SealedPersistenceProof {
    return {
      status,
      missionId: envelope.missionId,
      revisionId: envelope.revisionId,
      revisionRootPath: b3RevisionRootPath(envelope.missionId, envelope.revisionId),
      currentPointerPath: b3CurrentAuthorityPointerPath(envelope.missionId),
      contentIntegrityHash: envelope.contentIntegrityHash,
      idempotencyIdentity: envelope.idempotencyIdentity,
      revisionState: B3_REVISION_STATE_SEALED,
    };
  }
}
