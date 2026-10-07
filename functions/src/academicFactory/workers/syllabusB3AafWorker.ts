import { createHash } from 'crypto';
import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';
import { AafWorkerResult } from './aafWorkerResult';
import {
  B3ExecutorCompletionProof,
  SyllabusB3Executor,
  SyllabusB3ExecutorInput,
  SyllabusB3ExecutorResult,
} from '../../workers/syllabusB3Executor';
import { B3MaterializationRepository } from '../../syllabus/b3MaterializationRepository';
import { FirestoreB3MaterializationPersistenceStore } from '../../syllabus/firestoreB3MaterializationRepository';
import { B3_CONTRACT_VERSION } from '../../syllabus/b3Contract';

export interface SyllabusB3AafJob extends AafJobMetadata {
  queueContract: 'academic_factory_v1';
  type: 'SYLLABUS_B3';
  b3ExecutorInput: SyllabusB3ExecutorInput;
  b3CompletionProof?: B3ExecutorCompletionProof;
  b3CompletionProofHash?: string;
}

interface B3ExecutorPort {
  execute(input: SyllabusB3ExecutorInput): Promise<SyllabusB3ExecutorResult>;
}

export interface B3CompletionProofStore {
  persist(
    job: SyllabusB3AafJob,
    proof: B3ExecutorCompletionProof,
    proofHash: string,
  ): Promise<void>;
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

export function deterministicB3CompletionProofHash(proof: B3ExecutorCompletionProof): string {
  return createHash('sha256').update(JSON.stringify(stableValue(proof))).digest('hex');
}

function nonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateJob(job: AafJobMetadata): asserts job is SyllabusB3AafJob {
  const candidate = job as Partial<SyllabusB3AafJob>;
  if (candidate.queueContract !== 'academic_factory_v1') throw new Error('B3_INVALID_QUEUE_CONTRACT');
  if (candidate.type !== 'SYLLABUS_B3') throw new Error('B3_INVALID_JOB_TYPE');
  const input = candidate.b3ExecutorInput;
  if (!input || !input.revisionIdentity || !input.materializationInput) {
    throw new Error('B3_MISSING_EXECUTOR_INPUT');
  }
  const identity = input.revisionIdentity;
  if (!nonEmpty(identity.missionId) || identity.missionId !== candidate.missionId) {
    throw new Error('B3_MISSION_AUTHORITY_MISMATCH');
  }
  if (!nonEmpty(identity.authoritativeSourceChainId)) throw new Error('B3_MISSING_SOURCE_CHAIN_AUTHORITY');
  if (!nonEmpty(identity.revisionId)) throw new Error('B3_MISSING_REVISION_IDENTITY');
  if (identity.contractVersion !== B3_CONTRACT_VERSION
      || input.materializationInput.contractVersion !== B3_CONTRACT_VERSION) {
    throw new Error('B3_CONTRACT_VERSION_MISMATCH');
  }
  if (!Array.isArray(identity.orderedSources) || identity.orderedSources.length === 0
      || identity.orderedSources.some(source => !nonEmpty(source.sourceId)
        || !nonEmpty(source.documentId)
        || !nonEmpty(source.sourceVersionId)
        || !nonEmpty(source.sourceSha256))) {
    throw new Error('B3_INCOMPLETE_SOURCE_AUTHORITY');
  }
  const orderedDocumentIds = identity.orderedSources.map(source => source.documentId);
  if (!Array.isArray(candidate.sourceDocumentIds)
      || JSON.stringify(candidate.sourceDocumentIds) !== JSON.stringify(orderedDocumentIds)) {
    throw new Error('B3_OPERATIONAL_SOURCE_BINDING_MISMATCH');
  }
  if (!Array.isArray(identity.verifiedExtractionIds) || identity.verifiedExtractionIds.length === 0) {
    throw new Error('B3_MISSING_VERIFIED_EXTRACTIONS');
  }
  if (!Array.isArray(input.materializationInput.evidence)
      || input.materializationInput.evidence.length === 0) {
    throw new Error('B3_MISSING_MATERIALIZATION_EVIDENCE');
  }
  const scope = input.materializationInput.declaredCompletenessScope;
  if (!scope || !Array.isArray(scope.requiredEvidenceIds) || scope.requiredEvidenceIds.length === 0) {
    throw new Error('B3_MISSING_COMPLETENESS_SCOPE');
  }
}

function exactEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

export class FirestoreB3CompletionProofStore implements B3CompletionProofStore {
  constructor(private readonly db: admin.firestore.Firestore) {}

  async persist(
    job: SyllabusB3AafJob,
    proof: B3ExecutorCompletionProof,
    proofHash: string,
  ): Promise<void> {
    const ref = this.db.collection('ai_queue').doc(job.idempotencyKey);
    await this.db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new Error('B3_AAF_JOB_NOT_FOUND');
      const current = snapshot.data() as Partial<SyllabusB3AafJob>;
      if (current.queueContract !== 'academic_factory_v1'
          || current.type !== 'SYLLABUS_B3'
          || current.idempotencyKey !== job.idempotencyKey
          || current.state !== 'running'
          || !nonEmpty(current.leaseOwner)
          || current.leaseOwner !== job.leaseOwner) {
        throw new Error('B3_PROOF_HANDOFF_NOT_LEASE_OWNED_RUNNING');
      }
      if (current.b3CompletionProof !== undefined || current.b3CompletionProofHash !== undefined) {
        if (current.b3CompletionProofHash === proofHash
            && exactEqual(current.b3CompletionProof, proof)) return;
        throw new Error('B3_COMPLETION_PROOF_CONFLICT');
      }
      transaction.update(ref, {
        b3CompletionProof: proof,
        b3CompletionProofHash: proofHash,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
}

export function createSyllabusB3AafWorker(
  executor: B3ExecutorPort,
  proofStore: B3CompletionProofStore,
): (job: AafJobMetadata) => Promise<AafWorkerResult> {
  return async job => {
    try {
      validateJob(job);
      const result = await executor.execute(job.b3ExecutorInput);
      if (!result.completed) {
        return { success: false, outputHash: '', error: `${result.status}: ${result.reason}` };
      }
      const proofHash = deterministicB3CompletionProofHash(result.completionProof);
      await proofStore.persist(job, result.completionProof, proofHash);
      return {
        success: true,
        outputHash: proofHash,
        metadata: { completionProofHash: proofHash },
      };
    } catch (error) {
      return {
        success: false,
        outputHash: '',
        error: error instanceof Error ? error.message : 'B3_AAF_WORKER_FAILURE',
      };
    }
  };
}

export const syllabusB3AafWorker = async (job: AafJobMetadata): Promise<AafWorkerResult> => {
  const db = admin.firestore();
  const repository = new B3MaterializationRepository(
    new FirestoreB3MaterializationPersistenceStore(db),
  );
  const executor = SyllabusB3Executor.usingCanonicalDependencies(repository);
  return createSyllabusB3AafWorker(
    executor,
    new FirestoreB3CompletionProofStore(db),
  )(job);
};
