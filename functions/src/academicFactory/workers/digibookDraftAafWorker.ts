import { AafJobMetadata } from '../models/aafJob';
import { AafWorkerResult } from './aafWorkerResult';
import { createDraft } from '../services/digibookContentPipeline';

/**
 * DIGIBOOK DRAFT AAF WORKER ADAPTER
 * Maps to manifestation worker for DigiBook block creation.
 */
export async function digibookDraftAafWorker(job: AafJobMetadata): Promise<AafWorkerResult> {
  try {
    const result = await createDraft(job);
    return { success: true, outputHash: result.contentHash, metadata: { autoApprove: true, stage: 'draft', sourceBound: true } };
  } catch (error) {
    return { success: false, outputHash: '', error: (error as Error).message };
  }
}
