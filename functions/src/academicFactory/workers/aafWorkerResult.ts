/**
 * AAF WORKER RESULT
 * Contract for worker output to the dispatcher.
 */
export interface AafWorkerResult {
  success: boolean;
  outputHash: string; // Deterministic hash of the generated artifact
  error?: string;
  metadata?: any;
}
