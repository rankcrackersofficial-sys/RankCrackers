"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aafJobRegistry = void 0;
/**
 * 🔱 AAF JOB REGISTRY
 * Maps task types to specialized worker implementations.
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
 * 🛡️ BOOTSTRAP REGISTRY (REPRESENTATIVE)
 * Real worker bindings happen in AAF-005+.
 */
const stubHandler = async (job) => `stub_hash_${job.idempotencyKey}`;
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
AAF_JOB_TYPES.forEach(type => exports.aafJobRegistry.register(type, stubHandler));
//# sourceMappingURL=aafJobRegistry.js.map