"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aafJobRegistry = void 0;
/**
 * 🔱 AAF CANONICAL JOB REGISTRY (FIXED CONTRACT)
 * Maps the 13 canonical AAF job types to specialized worker adapters.
 * Implements AAF-004D FIX4 FINAL.
 */
class AafJobRegistry {
    constructor() {
        this.handlers = new Map();
    }
    register(type, handler) {
        this.handlers.set(type, handler);
    }
    getHandler(type) {
        return this.handlers.get(type);
    }
    getRegisteredTypes() {
        return Array.from(this.handlers.keys());
    }
    /**
     * 🛡️ CANONICAL 13-TYPE UNIVERSE (AAF-V1)
     */
    getCanonicalTypes() {
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
exports.aafJobRegistry = new AafJobRegistry();
/**
 * 🛡️ CANONICAL WORKER BINDINGS (13/13)
 */
const sourceAcquisitionAafWorker_1 = require("../workers/sourceAcquisitionAafWorker");
const sourceValidationAafWorker_1 = require("../workers/sourceValidationAafWorker");
const digibookDraftAafWorker_1 = require("../workers/digibookDraftAafWorker");
const digibookValidationAafWorker_1 = require("../workers/digibookValidationAafWorker");
const digibookProReviewAafWorker_1 = require("../workers/digibookProReviewAafWorker");
const digibookRepairAafWorker_1 = require("../workers/digibookRepairAafWorker");
const digibookAssemblyAafWorker_1 = require("../workers/digibookAssemblyAafWorker");
const digibookMaterializationAafWorker_1 = require("../workers/digibookMaterializationAafWorker");
const crucibleDraftAafWorker_1 = require("../workers/crucibleDraftAafWorker");
const crucibleValidationAafWorker_1 = require("../workers/crucibleValidationAafWorker");
const crucibleProReviewAafWorker_1 = require("../workers/crucibleProReviewAafWorker");
const crucibleRepairAafWorker_1 = require("../workers/crucibleRepairAafWorker");
const crucibleMaterializationAafWorker_1 = require("../workers/crucibleMaterializationAafWorker");
// 1. sourceAcquisition -> Sentinel Fetch/OCR Logic (REAL-BOUND)
exports.aafJobRegistry.register('sourceAcquisition', sourceAcquisitionAafWorker_1.sourceAcquisitionAafWorker);
// 2. sourceValidation -> Syllabus Source Worker Logic (REAL-BOUND)
exports.aafJobRegistry.register('sourceValidation', sourceValidationAafWorker_1.sourceValidationAafWorker);
// 3. digibookDraft -> Knowledge Manifestation Pass 3 (REAL-BOUND)
exports.aafJobRegistry.register('digibookDraft', digibookDraftAafWorker_1.digibookDraftAafWorker);
// 4. digibookValidation -> Automated consistency/coverage logic (REAL-BOUND)
exports.aafJobRegistry.register('digibookValidation', digibookValidationAafWorker_1.digibookValidationAafWorker);
// 5. digibookProReview -> DeepReasoningPro logic (REAL-BOUND)
exports.aafJobRegistry.register('digibookProReview', digibookProReviewAafWorker_1.digibookProReviewAafWorker);
// 6. digibookRepair -> Sentinel Canonical Repair (REAL-BOUND)
exports.aafJobRegistry.register('digibookRepair', digibookRepairAafWorker_1.digibookRepairAafWorker);
// 7. digibookAssembly -> Assembly Orchestration Logic (REAL-BOUND)
exports.aafJobRegistry.register('digibookAssembly', digibookAssemblyAafWorker_1.digibookAssemblyAafWorker);
// 8. digibookMaterialization -> Promotion Worker (REAL-BOUND)
exports.aafJobRegistry.register('digibookMaterialization', digibookMaterializationAafWorker_1.digibookMaterializationAafWorker);
// 9. crucibleDraft -> Crucible/MCQ generation (REAL-BOUND)
exports.aafJobRegistry.register('crucibleDraft', crucibleDraftAafWorker_1.crucibleDraftAafWorker);
// 10. crucibleValidation -> Crucible review schema logic (REAL-BOUND)
exports.aafJobRegistry.register('crucibleValidation', crucibleValidationAafWorker_1.crucibleValidationAafWorker);
// 11. crucibleProReview -> run_crucible_macro1_pro_review.js (REAL-BOUND)
exports.aafJobRegistry.register('crucibleProReview', crucibleProReviewAafWorker_1.crucibleProReviewAafWorker);
// 12. crucibleRepair -> repair_crucible.js (REAL-BOUND)
exports.aafJobRegistry.register('crucibleRepair', crucibleRepairAafWorker_1.crucibleRepairAafWorker);
// 13. crucibleMaterialization -> Materialize Worker logic (REAL-BOUND)
exports.aafJobRegistry.register('crucibleMaterialization', crucibleMaterializationAafWorker_1.crucibleMaterializationAafWorker);
//# sourceMappingURL=aafJobRegistry.js.map