import { AafQueueRepository } from '../repositories/aafQueueRepository';
import { aafJobRegistry } from './aafJobRegistry';
import { AafJobMetadata } from '../models/aafJob';
import * as admin from 'firebase-admin';

/**
 * 🔱 AAF GOVERNED DISPATCHER
 * Executes jobs via registered handlers with strict lifecycle guards.
 */
export class AafDispatcher {
  private repo = new AafQueueRepository();
  private db = admin.firestore();

  /**
   * 🛡️ DISPATCH (The Persistent Loop)
   */
  async dispatch(idempotencyKey: string, workerId: string): Promise<void> {
    // 1. ATOMIC CLAIM
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
      // Note: No legacy dispatchers or prompt factory calls allowed here.
      const outputHash = await handler(job);

      // 5. COMPLETE
      await this.repo.complete(idempotencyKey, outputHash);

    } catch (error) {
      console.error(`🔱 AAF DISPATCHER FAILED [${job.type}]:`, error);
      await this.repo.fail(idempotencyKey, error instanceof Error ? error.message : 'Unknown dispatch error');
    }
  }
}
