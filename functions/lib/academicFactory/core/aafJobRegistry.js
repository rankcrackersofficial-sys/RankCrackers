"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aafJobRegistry = void 0;
/**
 * 🔱 AAF CANONICAL JOB REGISTRY (FIXED CONTRACT)
 * Maps the 13 canonical AAF job types to specialized worker adapters.
 * Implements AAF-004D FIX1.
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
}
exports.aafJobRegistry = new AafJobRegistry();
/**
 * 🛡️ CANONICAL WORKER BINDINGS
 */
const sourceAcquisitionAafWorker_1 = require("../workers/sourceAcquisitionAafWorker");
const sourceValidationAafWorker_1 = require("../workers/sourceValidationAafWorker");
const digibookDraftAafWorker_1 = require("../workers/digibookDraftAafWorker");
const digibookRepairAafWorker_1 = require("../workers/digibookRepairAafWorker");
const digibookMaterializationAafWorker_1 = require("../workers/digibookMaterializationAafWorker");
const crucibleMaterializationAafWorker_1 = require("../workers/crucibleMaterializationAafWorker");
// 1. sourceAcquisition -> Sentinel Parsing
exports.aafJobRegistry.register('sourceAcquisition', sourceAcquisitionAafWorker_1.sourceAcquisitionAafWorker);
// 2. sourceValidation -> Truth Validation
exports.aafJobRegistry.register('sourceValidation', sourceValidationAafWorker_1.sourceValidationAafWorker);
// 3. digibookDraft -> Manifestation Pass 3
exports.aafJobRegistry.register('digibookDraft', digibookDraftAafWorker_1.digibookDraftAafWorker);
// 4. digibookRepair -> Canonical Repair
exports.aafJobRegistry.register('digibookRepair', digibookRepairAafWorker_1.digibookRepairAafWorker);
// 5. digibookMaterialization -> Promotion Worker
exports.aafJobRegistry.register('digibookMaterialization', digibookMaterializationAafWorker_1.digibookMaterializationAafWorker);
// 6. crucibleMaterialization -> Materialize Worker (Questions)
exports.aafJobRegistry.register('crucibleMaterialization', crucibleMaterializationAafWorker_1.crucibleMaterializationAafWorker);
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
//# sourceMappingURL=aafJobRegistry.js.map