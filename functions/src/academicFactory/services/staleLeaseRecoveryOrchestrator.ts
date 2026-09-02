import { AafQueueRepository } from '../repositories/aafQueueRepository';

/**
 * 🔱 STALE LEASE RECOVERY ORCHESTRATOR
 * Scans the AAF queue for expired leases and resets them to 'ready' state.
 */
export class StaleLeaseRecoveryOrchestrator {
  private repo = new AafQueueRepository();

  /**
   * 🛡️ PERFORM RECOVERY
   * Identifies all expired leases and attempts to reset them.
   */
  async performRecovery(): Promise<{ recovered: number; errors: number }> {
    console.log('🔱 STALE LEASE RECOVERY: Scanning for expired leases...');

    try {
      const expiredKeys = await this.repo.findExpiredLeases();
      console.log(`🔱 STALE LEASE RECOVERY: Found ${expiredKeys.length} expired leases.`);

      let recovered = 0;
      let errors = 0;

      for (const key of expiredKeys) {
        try {
          const success = await this.repo.recoverExpiredLease(key);
          if (success) {
            recovered++;
            console.log(`🔱 STALE LEASE RECOVERY: Successfully reset job ${key}.`);
          } else {
            // Might have been claimed or finished since search
            console.log(`🔱 STALE LEASE RECOVERY: Job ${key} was not reset (state changed).`);
          }
        } catch (e) {
          errors++;
          console.error(`🔱 STALE LEASE RECOVERY: Error resetting job ${key}:`, e);
        }
      }

      return { recovered, errors };
    } catch (e) {
      console.error('🔱 STALE LEASE RECOVERY: Critical error during scan:', e);
      throw e;
    }
  }
}
