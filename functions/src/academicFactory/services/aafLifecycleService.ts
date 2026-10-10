import { AafQueueRepository } from '../repositories/aafQueueRepository';
import * as admin from 'firebase-admin';
import { AafJobMetadata } from '../models/aafJob';

/**
 * AAF LIFECYCLE SERVICE
 * Governed authority for persistent state transitions.
 * Implements AAF-004C Logic.
 */
export class AafLifecycleService {
  private repo = new AafQueueRepository();
  private _db?: admin.firestore.Firestore;

  private get db(): admin.firestore.Firestore {
    if (!this._db) {
      this._db = admin.firestore();
    }
    return this._db;
  }

  constructor() {}

  /**
   * 🛡️ WAKE RETRY (retryWait -> ready)
   */
  async wakeRetry(idempotencyKey: string): Promise<boolean> {
    const doc = await this.db.collection('ai_queue').doc(idempotencyKey).get();
    if (!doc.exists) return false;
    const data = doc.data() as AafJobMetadata;

    if (data.state !== 'retryWait') return false;

    // Only wake if nextRetryAtUtc has passed
    const now = Date.now();
    if (data.nextRetryAtUtc && data.nextRetryAtUtc.toMillis() > now) {
        return false;
    }

    return await this.repo.wakeRetry(idempotencyKey);
  }

  /**
   * 🛡️ EXPIRED LEASE RECOVERY (leased/running expired -> ready)
   */
  async recoverExpiredLease(idempotencyKey: string): Promise<boolean> {
    return await this.repo.recoverExpiredLease(idempotencyKey);
  }

  /**
   * 🛡️ DEPENDENCY UNLOCK (waitingDependency -> ready)
   */
  async checkAndUnlockDependencies(idempotencyKey: string): Promise<boolean> {
    const doc = await this.db.collection('ai_queue').doc(idempotencyKey).get();
    if (!doc.exists) return false;
    const data = doc.data() as AafJobMetadata;

    if (data.state !== 'waitingDependency') return false;

    // Verify all dependencies are 'approved'
    if (!data.dependencyJobIds || data.dependencyJobIds.length === 0) {
        return await this.repo.unlockWaitingJob(idempotencyKey);
    }

    const depSnaps = await Promise.all(
        data.dependencyJobIds.map(id => this.db.collection('ai_queue').doc(id).get())
    );

    const allApproved = depSnaps.every(snap => snap.exists && snap.data()?.state === 'approved');

    if (allApproved) {
        return await this.repo.unlockWaitingJob(idempotencyKey);
    }

    return false;
  }

  /**
   * 🛡️ ROOT ACTIVATION (planned -> ready)
   */
  async activateRoot(idempotencyKey: string): Promise<boolean> {
      return await this.repo.activatePlannedRoot(idempotencyKey);
  }

  /**
   * 🛡️ GOVERNED APPROVAL (reviewing -> approved)
   */
  async approve(idempotencyKey: string): Promise<boolean> {
      return await this.repo.approveJob(idempotencyKey);
  }

  /**
   * 🛡️ MATERIALIZATION (approved -> materializing)
   */
  async markMaterializing(idempotencyKey: string): Promise<boolean> {
      return await this.repo.markMaterializing(idempotencyKey);
  }

  /**
   * 🛡️ PUBLICATION (materializing -> published)
   */
  async markPublished(idempotencyKey: string): Promise<boolean> {
      return await this.repo.markPublished(idempotencyKey);
  }
}
