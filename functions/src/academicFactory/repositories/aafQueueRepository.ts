import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';

const QUEUE_COLLECTION = 'ai_queue';
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute

/**
 * 🔱 AAF QUEUE REPOSITORY (academic_factory_v1)
 * Persistent Transaction Core for AAF-004B.
 * Enforces atomic state transitions and lease-based execution.
 */
export class AafQueueRepository {
  private db = admin.firestore();

  /**
   * 🛡️ IDEMPOTENT ENQUEUE
   * Inserts or merges an AAF job. Use idempotencyKey as Document ID.
   */
  async enqueue(job: Partial<AafJobMetadata>): Promise<string> {
    if (!job.idempotencyKey) throw new Error('AAF_QUEUE_ERROR: idempotencyKey required for enqueue.');

    const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);

    await docRef.set({
      ...job,
      queueContract: 'academic_factory_v1',
      status: job.status || 'ready',
      attempts: job.attempts || 0,
      maxAttempts: job.maxAttempts || 3,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    return job.idempotencyKey;
  }

  /**
   * 🛡️ ATOMIC CLAIM (START_RUNNING)
   * Claims a 'ready' or 'retry_pending' job for execution.
   */
  async claim(jobId: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;

      // Only claim if status is 'ready' or 'retry_pending'
      const isEligible = data.status === 'ready' || data.status === 'retry_pending';
      if (!isEligible) return false;

      // Check for valid lease (if any exists)
      const now = Date.now();
      if (data.leaseExpiry && data.leaseExpiry.toMillis() > now) {
        // Active lease still exists, concurrent claim blocked.
        return false;
      }

      const expiryDate = new Date(now + DEFAULT_LEASE_DURATION_MS);

      transaction.update(docRef, {
        status: 'running',
        leaseOwner: workerId,
        leaseExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
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
  async renewLease(jobId: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;
      if (data.status !== 'running' || data.leaseOwner !== workerId) return false;

      const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);

      transaction.update(docRef, {
        leaseExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });
  }

  /**
   * 🛡️ JOB COMPLETION
   */
  async complete(jobId: string, outputHash: string): Promise<void> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);

    await docRef.update({
      status: 'completed',
      outputHash: outputHash,
      leaseOwner: null,
      leaseExpiry: null,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * 🛡️ JOB FAILURE & RETRY LOGIC
   */
  async fail(jobId: string, error: string): Promise<void> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return;

      const data = snap.data() as AafJobMetadata;
      const canRetry = data.attempts < data.maxAttempts;

      const update: Partial<AafJobMetadata> & { updatedAt: any } = {
        status: canRetry ? 'retry_pending' : 'failed',
        lastError: error,
        leaseOwner: null,
        leaseExpiry: null,
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
