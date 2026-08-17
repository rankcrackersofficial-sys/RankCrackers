import { AafJobMetadata } from '../models/aafJob';
import { AafWorkerResult } from './aafWorkerResult';

/**
 * 🔱 AAF WORKER INTERFACE
 * Adapters must implement this to bind existing capabilities to the AAF queue.
 */
export type AafWorker = (job: AafJobMetadata) => Promise<AafWorkerResult>;
