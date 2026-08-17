import { AafQueueRepository } from '../repositories/aafQueueRepository';

/**
 * 🔱 AAF LIFECYCLE SERVICE
 * Governed authority for persistent state transitions.
 * Implements AAF-004C Logic.
 */
export class AafLifecycleService {
  private repo = new AafQueueRepository();

  /**
   * 🛡️ WAKE RETRY (retryWait -> ready)
   */
  async wakeRetry(idempotencyKey: string): Promise<boolean> {
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
  async unlockDependency(idempotencyKey: string): Promise<boolean> {
    return await this.repo.unlockDependency(idempotencyKey);
  }
}
