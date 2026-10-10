import { StaleLeaseRecoveryOrchestrator } from './staleLeaseRecoveryOrchestrator';

/**
 * STALE LEASE RECOVERY (Entry Point)
 */
export class StaleLeaseRecovery {
  static async recoverStaleLeases(): Promise<void> {
    const orchestrator = new StaleLeaseRecoveryOrchestrator();
    const result = await orchestrator.performRecovery();
    console.log(`STALE LEASE RECOVERY COMPLETE: ${result.recovered} recovered, ${result.errors} errors.`);
  }
}
