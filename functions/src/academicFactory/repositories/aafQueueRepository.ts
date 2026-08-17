import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';

const QUEUE_COLLECTION = 'ai_queue';
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute

/**
 * 🔱 AAF QUEUE REPOSITORY (academic_factory_v1)
 * Persistent Transaction Core for AAF-004C.
 * Enforces strict domain parity, lease authority, and semantic idempotency.
 */
export class AafQueueRepository {
  private db = admin.firestore();

  /**
   * 🛡️ TRANSACTIONAL ENQUEUE
   */
  async enqueue(job: AafJobMetadata): Promise<string> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);

    await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);

      if (snap.exists) {
        const existing = snap.data() as AafJobMetadata;

        const conflicts = [];
        if (existing.schemaVersion !== job.schemaVersion) conflicts.push('schemaVersion');
        if (existing.jobId !== job.jobId) conflicts.push('jobId');
        if (existing.runId !== job.runId) conflicts.push('runId');
        if (existing.missionId !== job.missionId) conflicts.push('missionId');
        if (existing.canonicalTargetId !== job.canonicalTargetId) conflicts.push('canonicalTargetId');
        if (existing.type !== job.type) conflicts.push('type');
        if (existing.maxAttempts !== job.maxAttempts) conflicts.push('maxAttempts');
        if (existing.inputHash !== job.inputHash) conflicts.push('inputHash');

        const existingDeps = JSON.stringify([...(existing.dependencyJobIds || [])].sort());
        const jobDeps = JSON.stringify([...(job.dependencyJobIds || [])].sort());
        if (existingDeps !== jobDeps) conflicts.push('dependencyJobIds');

        if (conflicts.length > 0) {
          throw new Error(`AAF_IDENTITY_CONFLICT: Job ${job.idempotencyKey} mismatch on: ${conflicts.join(', ')}.`);
        }

        transaction.update(docRef, {
          ...job,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
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
   * 🛡️ INITIAL ROOT ACTIVATION (planned -> ready)
   */
  async activatePlannedRoot(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'planned') return false;
      if (data.dependencyJobIds && data.dependencyJobIds.length > 0) return false;

      transaction.update(docRef, {
        state: 'ready',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ DEPENDENCY UNLOCK (waitingDependency -> ready)
   */
  async unlockWaitingJob(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'waitingDependency') return false;

      transaction.update(docRef, {
        state: 'ready',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ ATOMIC CLAIM (ready -> leased)
   */
  async claimReadyJob(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);

    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;

      const data = snap.data() as AafJobMetadata;

      if (data.state !== 'ready') return false;
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
   * 🛡️ START WORK (leased -> running)
   */
  async startRunning(idempotencyKey: string, workerId: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'leased' || data.leaseOwner !== workerId) return false;

      transaction.update(docRef, {
        state: 'running',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ SUBMIT FOR REVIEW (running -> reviewing)
   */
  async submitForReview(idempotencyKey: string, workerId: string, outputHash: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'running' || data.leaseOwner !== workerId) return false;

      transaction.update(docRef, {
        state: 'reviewing',
        outputHash: outputHash,
        leaseOwner: null,
        leaseExpiresAtUtc: null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ APPROVE (reviewing -> approved)
   */
  async approveJob(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'reviewing') return false;

      transaction.update(docRef, {
        state: 'approved',
        finishedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ MARK MATERIALIZING (approved -> materializing)
   */
  async markMaterializing(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'approved') return false;

      transaction.update(docRef, {
        state: 'materializing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ MARK PUBLISHED (materializing -> published)
   */
  async markPublished(idempotencyKey: string): Promise<boolean> {
    const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
    return await this.db.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      if (!snap.exists) return false;
      const data = snap.data() as AafJobMetadata;
      if (data.state !== 'materializing') return false;

      transaction.update(docRef, {
        state: 'published',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return true;
    });
  }

  /**
   * 🛡️ WAKE RETRY (retryWait -> ready)
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
   * 🛡️ LEASE RECOVERY (leased/running expired -> ready)
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
