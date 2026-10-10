import { AafWorker } from '../workers/aafWorkerTypes';

/**
 * AAF CANONICAL JOB REGISTRY (FIXED CONTRACT)
 * Maps the 13 canonical AAF job types to specialized worker adapters.
 * Implements AAF-004D FIX4 FINAL.
 */
class AafJobRegistry {
  private handlers: Map<string, AafWorker> = new Map();

  register(type: string, handler: AafWorker) {
    this.handlers.set(type, handler);
  }

  getHandler(type: string): AafWorker | undefined {
    return this.handlers.get(type);
  }

  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 🛡️ CANONICAL 13-TYPE UNIVERSE (AAF-V1)
   */
  getCanonicalTypes(): string[] {
    return [
      'sourceAcquisition',
      'sourceValidation',
      'digibookDraft',
      'digibookValidation',
      'digibookProReview',
      'digibookRepair',
      'digibookAssembly',
      'digibookMaterialization',
      'crucibleDraft',
      'crucibleValidation',
      'crucibleProReview',
      'crucibleRepair',
      'crucibleMaterialization'
    ];
  }
}

export const aafJobRegistry = new AafJobRegistry();

/**
 * 🛡️ CANONICAL WORKER BINDINGS (13/13)
 */
import { sourceAcquisitionAafWorker } from '../workers/sourceAcquisitionAafWorker';
import { sourceValidationAafWorker } from '../workers/sourceValidationAafWorker';
import { digibookDraftAafWorker } from '../workers/digibookDraftAafWorker';
import { digibookValidationAafWorker } from '../workers/digibookValidationAafWorker';
import { digibookProReviewAafWorker } from '../workers/digibookProReviewAafWorker';
import { digibookRepairAafWorker } from '../workers/digibookRepairAafWorker';
import { digibookAssemblyAafWorker } from '../workers/digibookAssemblyAafWorker';
import { digibookMaterializationAafWorker } from '../workers/digibookMaterializationAafWorker';
import { crucibleDraftAafWorker } from '../workers/crucibleDraftAafWorker';
import { crucibleValidationAafWorker } from '../workers/crucibleValidationAafWorker';
import { crucibleProReviewAafWorker } from '../workers/crucibleProReviewAafWorker';
import { crucibleRepairAafWorker } from '../workers/crucibleRepairAafWorker';
import { crucibleMaterializationAafWorker } from '../workers/crucibleMaterializationAafWorker';

// 1. sourceAcquisition -> Sentinel Fetch/OCR Logic (REAL-BOUND)
aafJobRegistry.register('sourceAcquisition', sourceAcquisitionAafWorker);

// 2. sourceValidation -> Syllabus Source Worker Logic (REAL-BOUND)
aafJobRegistry.register('sourceValidation', sourceValidationAafWorker);

// 3. digibookDraft -> Knowledge Manifestation Pass 3 (REAL-BOUND)
aafJobRegistry.register('digibookDraft', digibookDraftAafWorker);

// 4. digibookValidation -> Automated consistency/coverage logic (REAL-BOUND)
aafJobRegistry.register('digibookValidation', digibookValidationAafWorker);

// 5. digibookProReview -> DeepReasoningPro logic (REAL-BOUND)
aafJobRegistry.register('digibookProReview', digibookProReviewAafWorker);

// 6. digibookRepair -> Sentinel Canonical Repair (REAL-BOUND)
aafJobRegistry.register('digibookRepair', digibookRepairAafWorker);

// 7. digibookAssembly -> Assembly Orchestration Logic (REAL-BOUND)
aafJobRegistry.register('digibookAssembly', digibookAssemblyAafWorker);

// 8. digibookMaterialization -> Promotion Worker (REAL-BOUND)
aafJobRegistry.register('digibookMaterialization', digibookMaterializationAafWorker);

// 9. crucibleDraft -> Crucible/MCQ generation (REAL-BOUND)
aafJobRegistry.register('crucibleDraft', crucibleDraftAafWorker);

// 10. crucibleValidation -> Crucible review schema logic (REAL-BOUND)
aafJobRegistry.register('crucibleValidation', crucibleValidationAafWorker);

// 11. crucibleProReview -> run_crucible_macro1_pro_review.js (REAL-BOUND)
aafJobRegistry.register('crucibleProReview', crucibleProReviewAafWorker);

// 12. crucibleRepair -> repair_crucible.js (REAL-BOUND)
aafJobRegistry.register('crucibleRepair', crucibleRepairAafWorker);

// 13. crucibleMaterialization -> Materialize Worker logic (REAL-BOUND)
aafJobRegistry.register('crucibleMaterialization', crucibleMaterializationAafWorker);
