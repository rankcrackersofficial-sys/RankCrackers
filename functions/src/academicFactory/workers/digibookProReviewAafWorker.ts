import { AafJobMetadata } from '../models/aafJob';
import { AafWorkerResult } from './aafWorkerResult';
import { proReview } from '../services/digibookContentPipeline';

/**
 * DIGIBOOK PRO REVIEW AAF WORKER
 * Binds the LLM-based Pro DigiBook Reviewer capability.
 * Actor: "RankCrackers Pro DigiBook reviewer"
 */
export async function digibookProReviewAafWorker(job: AafJobMetadata): Promise<AafWorkerResult> {
  try {
    // Logic: Invokes DeepReasoningPro model with review prompt
    const result = await proReview(job);
    return { success: true, outputHash: `h_db_pro_${job.targetId}`, metadata: { autoApprove: true, stage: 'proReview', review: result.review } };
  } catch (error) {
    return { success: false, outputHash: '', error: (error as Error).message };
  }
}
