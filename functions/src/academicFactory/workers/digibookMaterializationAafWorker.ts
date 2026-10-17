import { AafJobMetadata } from '../models/aafJob';
import { AafWorkerResult } from './aafWorkerResult';
import { materialize } from '../services/digibookContentPipeline';

/**
 * DIGIBOOK MATERIALIZATION AAF WORKER
 * Binds the Promotion Worker logic for DigiBook knowledge blocks.
 */
export async function digibookMaterializationAafWorker(job: AafJobMetadata): Promise<AafWorkerResult> {
  try {
    const result = await materialize(job);
    return { success: true, outputHash: `h_db_mat_${job.targetId}`, metadata: { autoApprove: true, stage: 'materialization', published: result.published } };
  } catch (error) {
    return { success: false, outputHash: '', error: (error as Error).message };
  }
}
