import { AafJobMetadata } from '../models/aafJob';

/**
 * 🔱 AAF JOB HANDLER INTERFACE
 */
export type AafJobHandler = (job: AafJobMetadata) => Promise<string>; // Returns outputHash

/**
 * 🔱 AAF JOB REGISTRY
 * Maps task types to specialized worker implementations.
 */
class AafJobRegistry {
  private handlers: Map<string, AafJobHandler> = new Map();

  register(type: string, handler: AafJobHandler) {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): AafJobHandler | undefined {
    return this.handlers.get(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const aafJobRegistry = new AafJobRegistry();

/**
 * 🛡️ BOOTSTRAP REGISTRY (REPRESENTATIVE)
 * Real worker bindings happen in AAF-005+.
 */
const stubHandler = async (job: AafJobMetadata) => `stub_hash_${job.idempotencyKey}`;

const AAF_JOB_TYPES = [
  'structural',
  'svo',
  'manifest',
  'digibookDraft',
  'digibookValidation',
  'digibookProReview',
  'digibookAssembly',
  'mcqDraft',
  'mcqValidation',
  'revisionDraft',
  'revisionValidation',
  'encoding',
  'repair'
];

AAF_JOB_TYPES.forEach(type => aafJobRegistry.register(type, stubHandler));
