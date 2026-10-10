import { AafQueueRepository } from '../repositories/aafQueueRepository';
import { aafJobRegistry } from './aafJobRegistry';
import { AafJobMetadata } from '../models/aafJob';
import * as admin from 'firebase-admin';

/**
 * AAF GOVERNED DISPATCHER
 * Executes jobs via registered handlers with strict lifecycle guards.
 * Implements AAF-004C Hardened.
 */
export class AafDispatcher {
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
   * 🛡️ DISPATCH (The Persistent Loop)
   * Strictly follows ready -> leased -> running -> reviewing -> approved.
   */
  async dispatch(idempotencyKey: string, workerId: string): Promise<void> {
    // 1. ATOMIC CLAIM (ready -> leased)
    const claimed = await this.repo.claimReadyJob(idempotencyKey, workerId);
    if (!claimed) return;

    const docRef = this.db.collection('ai_queue').doc(idempotencyKey);
    const snap = await docRef.get();
    const job = snap.data() as AafJobMetadata;

    try {
      // 2. RESOLVE HANDLER
      const handler = aafJobRegistry.getHandler(job.type);
      if (!handler) {
        throw new Error(`UNREGISTERED_HANDLER: No worker bound for type '${job.type}'.`);
      }

      // 3. START WORK (leased -> running)
      const started = await this.repo.startRunning(idempotencyKey, workerId);
      if (!started) throw new Error('STATE_CONCURRENCY_ERROR: Failed to transition to running.');

      // 4. EXECUTE HANDLER (Isolated)
      const result = await handler(job);

      if (!result.success) {
          throw new Error(result.error || 'WORKER_FAILED');
      }

      // 5. SUBMIT FOR REVIEW (running -> reviewing)
      await this.repo.submitForReview(idempotencyKey, workerId, result.outputHash);

      // Note: Approval/Materialization/Publication are handled via separate governance triggers or human-in-the-loop steps.
      console.log(`AAF DISPATCHER: Job ${idempotencyKey} submitted for review.`);

    } catch (error) {
      console.error(`AAF DISPATCHER FAILED [${job.type}]:`, error);
      await this.repo.fail(idempotencyKey, error instanceof Error ? error.message : 'Unknown dispatch error');
    }
  }
}
