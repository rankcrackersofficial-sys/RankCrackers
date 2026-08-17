"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AafLifecycleService = void 0;
const aafQueueRepository_1 = require("../repositories/aafQueueRepository");
/**
 * 🔱 AAF LIFECYCLE SERVICE
 * Governed authority for persistent state transitions.
 * Implements AAF-004C Logic.
 */
class AafLifecycleService {
    constructor() {
        this.repo = new aafQueueRepository_1.AafQueueRepository();
    }
    /**
     * 🛡️ WAKE RETRY (retryWait -> ready)
     */
    async wakeRetry(idempotencyKey) {
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
    async unlockDependency(idempotencyKey) {
        return await this.repo.unlockDependency(idempotencyKey);
    }
}
exports.AafLifecycleService = AafLifecycleService;
//# sourceMappingURL=aafLifecycleService.js.map