"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AafDispatcher = void 0;
const aafQueueRepository_1 = require("../repositories/aafQueueRepository");
const aafJobRegistry_1 = require("./aafJobRegistry");
const admin = __importStar(require("firebase-admin"));
/**
 * 🔱 AAF GOVERNED DISPATCHER
 * Executes jobs via registered handlers with strict lifecycle guards.
 * Implements AAF-004C Hardened.
 */
class AafDispatcher {
    constructor() {
        this.repo = new aafQueueRepository_1.AafQueueRepository();
        this.db = admin.firestore();
    }
    /**
     * 🛡️ DISPATCH (The Persistent Loop)
     * Strictly follows ready -> leased -> running -> reviewing -> approved.
     */
    async dispatch(idempotencyKey, workerId) {
        // 1. ATOMIC CLAIM (ready -> leased)
        const claimed = await this.repo.claimReadyJob(idempotencyKey, workerId);
        if (!claimed)
            return;
        const docRef = this.db.collection('ai_queue').doc(idempotencyKey);
        const snap = await docRef.get();
        const job = snap.data();
        try {
            // 2. RESOLVE HANDLER
            const handler = aafJobRegistry_1.aafJobRegistry.getHandler(job.type);
            if (!handler) {
                throw new Error(`UNREGISTERED_HANDLER: No worker bound for type '${job.type}'.`);
            }
            // 3. START WORK (leased -> running)
            const started = await this.repo.startRunning(idempotencyKey, workerId);
            if (!started)
                throw new Error('STATE_CONCURRENCY_ERROR: Failed to transition to running.');
            // 4. EXECUTE HANDLER (Isolated)
            // Implementation MUST NOT call AI/LLM directly here; it calls the bound worker.
            const outputHash = await handler(job);
            // 5. SUBMIT FOR REVIEW (running -> reviewing)
            // This enforces the governed review path.
            await this.repo.submitForReview(idempotencyKey, workerId, outputHash);
            // Note: Approval/Materialization/Publication are handled via separate governance triggers or human-in-the-loop steps.
            console.log(`🔱 AAF DISPATCHER: Job ${idempotencyKey} submitted for review.`);
        }
        catch (error) {
            console.error(`🔱 AAF DISPATCHER FAILED [${job.type}]:`, error);
            await this.repo.fail(idempotencyKey, error instanceof Error ? error.message : 'Unknown dispatch error');
        }
    }
}
exports.AafDispatcher = AafDispatcher;
//# sourceMappingURL=aafDispatcher.js.map