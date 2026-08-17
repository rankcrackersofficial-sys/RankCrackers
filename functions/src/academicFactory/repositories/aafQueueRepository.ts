import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';

const QUEUE_COLLECTION = 'ai_queue';
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute

/**
 * 🔱 AAF QUEUE REPOSITORY (academic_factory_v1)
 * Persistent Transaction Core for AAF-004B FIX2.
 * Enforces exact domain lifecycle parity and lease-based authority.
 */
export class AafQueueRepository {
  private db = admin.firestore();

  /**
   * 🛡️ TRANSACTIONAL ENQUEUE
   * Preserves planner-provided state. Detects logical identity conflicts.
   */
  async enqueue(job: AafJobMetadata): Promise<string> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (snap.exists) {
        const existing = snap.data() as AafJobMetadata;
        // 🛡️ Semantic Identity Check
        if (existing.runId !== job.runId ||
            existing.jobId !== job.jobId ||
            existing.canonicalTargetId !== job.canonicalTargetId) {
          throw new Error(`AAF_IDENTITY_CONFLICT: Job ${job.idempotencyKey} identity mismatch.`);
        }

        // Update existing job (preserving history, updating fields)
        transaction.update(docRef, {
          ...job,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        // 🛡️ State Preservation: initial state comes from planner (job.state)
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
   * 🛡️ ATOMIC CLAIM (LEASED)
   * Claims a 'ready' or 'retryWait' job.
   */
  async claim(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;

      // 🛡️ State Compatibility Check
      const isEligible = data.state === 'ready' || data.state === 'retryWait';
      if (!isEligible) return false;

      // 🛡️ Lease Conflict Check
      const now = Date.now();
      if (data.leaseExpiresAtUtc && data.leaseExpiresAtUtc.toMillis() > now) {
        return false; // Active lease held by another worker
      }

      const expiryDate = new Date(now + DEFAULT_LEASE_DURATION_MS);

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
   * 🛡️ SUCCESS TRANSITION (MATERIALIZING)
   */
  async markMaterializing(idempotencyKey: string, outputHash: string): Promise<void> {
    await this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey).update({
      state: 'materializing',
      outputHash: outputHash,
      leaseOwner: null,
      leaseExpiresAtUtc: null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  /**
   * 🛡️ FAILURE TRANSITION
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
