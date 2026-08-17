import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';

const QUEUE_COLLECTION = 'ai_queue';
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute

/**
 * 🔱 AAF QUEUE REPOSITORY (academic_factory_v1)
 * Persistent Transaction Core for AAF-004B FIX1.
 * Enforces atomic state transitions and lease-based execution.
 */
export class AafQueueRepository {
  private db = admin.firestore();

  /**
   * 🛡️ TRANSACTIONAL ENQUEUE
   * Inserts or updates an AAF job while checking for semantic conflicts.
   */
  async enqueue(job: Partial<AafJobMetadata>): Promise<string> {
    if (!job.idempotencyKey) throw new Error('AAF_QUEUE_ERROR: idempotencyKey required for enqueue.');

    const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (snap.exists) {
        const existing = snap.data() as AafJobMetadata;
        // Verify semantic identity parity (RunId, JobId, canonicalTargetId)
        if (existing.runId !== job.runId ||
            existing.jobId !== job.jobId ||
            existing.canonicalTargetId !== job.canonicalTargetId) {
          throw new Error(`AAF_SEMANTIC_CONFLICT: Job ${job.idempotencyKey} identity mismatch.`);
        }

        // If input changed, it might require a state reset depending on AAF phase (later logic)
        // For now, if it exists and matches identity, we merge updates.
        transaction.update(docRef, {
          ...job,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // Create new job
        transaction.set(docRef, {
          ...job,
          queueContract: 'academic_factory_v1',
          state: job.state || 'PLANNED',
          attempts: job.attempts || 0,
          maxAttempts: job.maxAttempts || 3,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    return job.idempotencyKey;
  }

  /**
   * 🛡️ ATOMIC CLAIM (START_RUNNING)
   * Claims a 'READY' or 'REPAIR_PENDING' job for execution.
   */
  async claim(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;

      // Only claim if state is 'READY' or 'REPAIR_PENDING'
      const isEligible = data.state === 'READY' || data.state === 'REPAIR_PENDING';
      if (!isEligible) return false;

      // Check for valid lease (if any exists)
      const now = Date.now();
      if (data.leaseExpiresAtUtc && data.leaseExpiresAtUtc.toMillis() > now) {
        // Active lease still exists, concurrent claim blocked.
        return false;
      }

      const expiryDate = new Date(now + DEFAULT_LEASE_DURATION_MS);

      transaction.update(docRef, {
        state: 'RUNNING',
        leaseOwner: workerId,
        leaseExpiresAtUtc: admin.firestore.Timestamp.fromDate(expiryDate),
        attempts: admin.firestore.FieldValue.increment(1),
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });
  }

  /**
   * 🛡️ LEASE RENEWAL (HEARTBEAT)
   */
  async renewLease(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'RUNNING' || data.leaseOwner !== workerId) return false;

      const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);

      transaction.update(docRef, {
        leaseExpiresAtUtc: admin.firestore.Timestamp.fromDate(expiryDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });
  }

  /**
   * 🛡️ JOB COMPLETION
   */
  async complete(idempotencyKey: string, outputHash: string): Promise<void> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    await docRef.update({
      state: 'COMPLETED',
      outputHash: outputHash,
      leaseOwner: null,
      leaseExpiresAtUtc: null,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * 🛡️ JOB FAILURE & RETRY LOGIC
   */
  async fail(idempotencyKey: string, error: string): Promise<void> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return;

      const data = snap.data() as AafJobMetadata;
      const canRetry = data.attempts < data.maxAttempts;

      const update: Partial<AafJobMetadata> & { updatedAt: any } = {
        state: canRetry ? 'REPAIR_PENDING' : 'FAILED',
        lastError: error,
        leaseOwner: null,
        leaseExpiresAtUtc: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (canRetry) {
        // Exponential backoff: base * (2 ^ (attempts - 1))
        const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, data.attempts - 1);
        update.nextRetryAt = admin.firestore.Timestamp.fromMillis(Date.now() + backoff);
      }

      transaction.update(docRef, update);
    });
  }
}
