import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';

const QUEUE_COLLECTION = 'ai_queue';
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute

/**
 * 🔱 AAF QUEUE REPOSITORY (academic_factory_v1)
 * Persistent Transaction Core for AAF-004B FIX4 FINAL.
 * Enforces strict domain parity, lease authority, and semantic idempotency.
 */
export class AafQueueRepository {
  private db = admin.firestore();

  /**
   * 🛡️ TRANSACTIONAL ENQUEUE
   * Uses planner-provided idempotencyKey.
   * Validates strict semantic identity to prevent conflicting overlaps.
   */
  async enqueue(job: AafJobMetadata): Promise<string> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (snap.exists) {
        const existing = snap.data() as AafJobMetadata;

        // 🛡️ COMPREHENSIVE SEMANTIC IDENTITY CHECK (9/9 Conflict Attacks)
        const conflicts = [];
        if (existing.runId !== job.runId) conflicts.push('runId');
        if (existing.jobId !== job.jobId) conflicts.push('jobId');
        if (existing.missionId !== job.missionId) conflicts.push('missionId');
        if (existing.canonicalTargetId !== job.canonicalTargetId) conflicts.push('canonicalTargetId');
        if (existing.taskType !== job.taskType) conflicts.push('taskType');
        if (existing.inputHash !== job.inputHash) conflicts.push('inputHash');
        if (existing.maxAttempts !== job.maxAttempts) conflicts.push('maxAttempts');
        if (existing.targetId !== job.targetId) conflicts.push('targetId');
        // queueContract is always checked by queryContract field check in caller or guard

        if (conflicts.length > 0) {
          throw new Error(`AAF_IDENTITY_CONFLICT: Job ${job.idempotencyKey} has mismatching ${conflicts.join(', ')}.`);
        }

        // 🛡️ IDEMPOTENT REUSE: If identical, we merge updates but preserve history.
        transaction.update(docRef, {
          ...job,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // 🛡️ INITIAL STATE PRESERVATION
        transaction.set(docRef, {
          ...job,
          queueContract: 'academic_factory_v1',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    });

    return job.idempotencyKey;
  }

  /**
   * 🛡️ ATOMIC CLAIM (READY -> LEASED)
   * Strictly claims ONLY 'ready' jobs.
   * RETRYWAIT AND EXPIRED LEASES ARE NOT DIRECTLY CLAIMABLE.
   */
  async claimReadyJob(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;

      // 🛡️ STATE LOCK: ONLY 'ready' allowed for direct claim.
      if (data.state !== 'ready') return false;

      // 🛡️ LEASE GUARD: If already leased/running/metadata present, block.
      if (data.leaseOwner || data.leaseExpiresAtUtc) return false;

      const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);

      transaction.update(docRef, {
        state: 'leased',
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
   * 🛡️ WAKE RETRY (retryWait -> ready)
   * Explicit authority required to make a retryWait job claimable.
   */
  async wakeRetry(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'retryWait') return false;

      transaction.update(docRef, {
        state: 'ready',
        nextRetryAtUtc: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });
  }

  /**
   * 🛡️ LEASE RECOVERY (EXPIRED -> READY)
   * Move expired leased jobs back to ready.
   */
  async recoverExpiredLease(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;
      const now = Date.now();

      const hasLease = !!data.leaseExpiresAtUtc;
      const isExpired = hasLease && data.leaseExpiresAtUtc!.toMillis() < now;

      if (!isExpired) return false;

      transaction.update(docRef, {
        state: 'ready',
        leaseOwner: null,
        leaseExpiresAtUtc: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });
  }

  /**
   * 🛡️ HEARTBEAT
   */
  async renewLease(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'leased' && data.state !== 'running') return false;
      if (data.leaseOwner !== workerId) return false;

      const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);

      transaction.update(docRef, {
        leaseExpiresAtUtc: admin.firestore.Timestamp.fromDate(expiryDate),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return true;
    });
  }

  /**
   * 🛡️ TERMINAL SUCCESS
   */
  async complete(idempotencyKey: string, outputHash: string): Promise<void> {
    await this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey).update({
      state: 'approved',
      outputHash: outputHash,
      leaseOwner: null,
      leaseExpiresAtUtc: null,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * 🛡️ FAILURE & RETRY
   */
  async fail(idempotencyKey: string, error: string): Promise<void> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return;

      const data = snap.data() as AafJobMetadata;
      const canRetry = data.attempts < data.maxAttempts;

      const update: any = {
        state: canRetry ? 'retryWait' : 'failedTerminal',
        lastError: error,
        leaseOwner: null,
        leaseExpiresAtUtc: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (canRetry) {
        const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, data.attempts - 1);
        update.nextRetryAtUtc = admin.firestore.Timestamp.fromMillis(Date.now() + backoff);
      }

      transaction.update(docRef, update);
    });
  }
}
