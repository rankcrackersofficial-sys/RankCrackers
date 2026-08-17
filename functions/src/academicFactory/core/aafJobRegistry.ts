import { AafWorker } from '../workers/aafWorkerTypes';

/**
 * 🔱 AAF CANONICAL JOB REGISTRY (FIXED CONTRACT)
 * Maps the 13 canonical AAF job types to specialized worker adapters.
 * Implements AAF-004D FIX1.
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
}

export const aafJobRegistry = new AafJobRegistry();

/**
 * 🛡️ CANONICAL WORKER BINDINGS
 */
import { sourceAcquisitionAafWorker } from '../workers/sourceAcquisitionAafWorker';
import { sourceValidationAafWorker } from '../workers/sourceValidationAafWorker';
import { digibookDraftAafWorker } from '../workers/digibookDraftAafWorker';
import { digibookRepairAafWorker } from '../workers/digibookRepairAafWorker';
import { digibookMaterializationAafWorker } from '../workers/digibookMaterializationAafWorker';
import { crucibleMaterializationAafWorker } from '../workers/crucibleMaterializationAafWorker';

// 1. sourceAcquisition -> Sentinel Parsing
aafJobRegistry.register('sourceAcquisition', sourceAcquisitionAafWorker);

// 2. sourceValidation -> Truth Validation
aafJobRegistry.register('sourceValidation', sourceValidationAafWorker);

// 3. digibookDraft -> Manifestation Pass 3
aafJobRegistry.register('digibookDraft', digibookDraftAafWorker);

// 4. digibookRepair -> Canonical Repair
aafJobRegistry.register('digibookRepair', digibookRepairAafWorker);

// 5. digibookMaterialization -> Promotion Worker
aafJobRegistry.register('digibookMaterialization', digibookMaterializationAafWorker);

// 6. crucibleMaterialization -> Materialize Worker (Questions)
aafJobRegistry.register('crucibleMaterialization', crucibleMaterializationAafWorker);

/**
 * 🛡️ BLOCKED_MISSING_WORKER_CAPABILITY
 * The following job types are currently unmapped to governed Cloud Functions:
 *
 * - digibookValidation
 * - digibookProReview (Human/Gate)
 * - digibookAssembly
 * - crucibleDraft (MCQ/Revision logic migration pending)
 * - crucibleValidation
 * - crucibleProReview (Human/Gate)
 * - crucibleRepair
 */
