import { AafJobMetadata } from '../models/aafJob';
import { AafWorkerResult } from './aafWorkerResult';
import { validateDraft } from '../services/digibookContentPipeline';

/**
 * DIGIBOOK VALIDATION AAF WORKER
 * Binds automated consistency and coverage logic.
 */
export async function digibookValidationAafWorker(job: AafJobMetadata): Promise<AafWorkerResult> {
  try {
    // Logic: Cross-checks draft against atomic truth and syllabus scope.
    const result = await validateDraft(job);
    return { success: true, outputHash: `h_db_val_${job.targetId}`, metadata: { autoApprove: true, stage: 'validation', checks: result.checks } };
  } catch (error) {
    return { success: false, outputHash: '', error: (error as Error).message };
  }
}
