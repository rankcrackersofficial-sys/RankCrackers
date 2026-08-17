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
exports.AafLifecycleService = void 0;
const aafQueueRepository_1 = require("../repositories/aafQueueRepository");
const admin = __importStar(require("firebase-admin"));
/**
 * 🔱 AAF LIFECYCLE SERVICE
 * Governed authority for persistent state transitions.
 * Implements AAF-004C Logic.
 */
class AafLifecycleService {
    constructor() {
        this.repo = new aafQueueRepository_1.AafQueueRepository();
        this.db = admin.firestore();
    }
    /**
     * 🛡️ WAKE RETRY (retryWait -> ready)
     */
    async wakeRetry(idempotencyKey) {
        const doc = await this.db.collection('ai_queue').doc(idempotencyKey).get();
        if (!doc.exists)
            return false;
        const data = doc.data();
        if (data.state !== 'retryWait')
            return false;
        // Only wake if nextRetryAtUtc has passed
        const now = Date.now();
        if (data.nextRetryAtUtc && data.nextRetryAtUtc.toMillis() > now) {
            return false;
        }
        return await this.repo.wakeRetry(idempotencyKey);
    }
    /**
     * 🛡️ EXPIRED LEASE RECOVERY (leased/running expired -> ready)
     */
    async recoverExpiredLease(idempotencyKey) {
        return await this.repo.recoverExpiredLease(idempotencyKey);
    }
    /**
     * 🛡️ DEPENDENCY UNLOCK (waitingDependency -> ready)
     */
    async checkAndUnlockDependencies(idempotencyKey) {
        const doc = await this.db.collection('ai_queue').doc(idempotencyKey).get();
        if (!doc.exists)
            return false;
        const data = doc.data();
        if (data.state !== 'waitingDependency')
            return false;
        // Verify all dependencies are 'approved'
        if (!data.dependencyJobIds || data.dependencyJobIds.length === 0) {
            return await this.repo.unlockWaitingJob(idempotencyKey);
        }
        const depSnaps = await Promise.all(data.dependencyJobIds.map(id => this.db.collection('ai_queue').doc(id).get()));
        const allApproved = depSnaps.every(snap => snap.exists && snap.data()?.state === 'approved');
        if (allApproved) {
            return await this.repo.unlockWaitingJob(idempotencyKey);
        }
        return false;
    }
    /**
     * 🛡️ ROOT ACTIVATION (planned -> ready)
     */
    async activateRoot(idempotencyKey) {
        return await this.repo.activatePlannedRoot(idempotencyKey);
    }
    /**
     * 🛡️ GOVERNED APPROVAL (reviewing -> approved)
     */
    async approve(idempotencyKey) {
        return await this.repo.approveJob(idempotencyKey);
    }
    /**
     * 🛡️ MATERIALIZATION (approved -> materializing)
     */
    async markMaterializing(idempotencyKey) {
        return await this.repo.markMaterializing(idempotencyKey);
    }
    /**
     * 🛡️ PUBLICATION (materializing -> published)
     */
    async markPublished(idempotencyKey) {
        return await this.repo.markPublished(idempotencyKey);
    }
}
exports.AafLifecycleService = AafLifecycleService;
//# sourceMappingURL=aafLifecycleService.js.map