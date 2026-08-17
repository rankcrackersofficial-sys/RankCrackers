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
exports.AafQueueRepository = void 0;
const admin = __importStar(require("firebase-admin"));
const QUEUE_COLLECTION = 'ai_queue';
const DEFAULT_LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const RETRY_BACKOFF_BASE_MS = 60 * 1000; // 1 minute
/**
 * 🔱 AAF QUEUE REPOSITORY (academic_factory_v1)
 * Persistent Transaction Core for AAF-004B FIX4 FINAL.
 * Enforces strict domain parity, lease authority, and semantic idempotency.
 */
class AafQueueRepository {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * 🛡️ TRANSACTIONAL ENQUEUE
     * Uses planner-provided idempotencyKey.
     * Validates exact 9/9 locked immutable fields to prevent logical corruption.
     */
    async enqueue(job) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);
        await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (snap.exists) {
                const existing = snap.data();
                // 🛡️ LOCKED IMMUTABLE CONFLICT CHECK (9/9 Fields)
                const conflicts = [];
                if (existing.schemaVersion !== job.schemaVersion)
                    conflicts.push('schemaVersion');
                if (existing.jobId !== job.jobId)
                    conflicts.push('jobId');
                if (existing.runId !== job.runId)
                    conflicts.push('runId');
                if (existing.missionId !== job.missionId)
                    conflicts.push('missionId');
                if (existing.canonicalTargetId !== job.canonicalTargetId)
                    conflicts.push('canonicalTargetId');
                if (existing.type !== job.type)
                    conflicts.push('type');
                if (existing.maxAttempts !== job.maxAttempts)
                    conflicts.push('maxAttempts');
                if (existing.inputHash !== job.inputHash)
                    conflicts.push('inputHash');
                // Dependency Check (Deep equality required for arrays)
                const existingDeps = JSON.stringify([...(existing.dependencyJobIds || [])].sort());
                const jobDeps = JSON.stringify([...(job.dependencyJobIds || [])].sort());
                if (existingDeps !== jobDeps)
                    conflicts.push('dependencyJobIds');
                if (conflicts.length > 0) {
                    throw new Error(`AAF_IDENTITY_CONFLICT: Job ${job.idempotencyKey} mismatch on: ${conflicts.join(', ')}.`);
                }
                // 🛡️ IDEMPOTENT REUSE: Update fields that are allowed to change (state, payload etc)
                transaction.update(docRef, {
                    ...job,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            else {
                // 🛡️ INITIAL STATE PRESERVATION
                transaction.set(docRef, {
                    ...job,
                    queueContract: 'academic_factory_v1',
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        });
        return job.idempotencyKey;
    }
    /**
     * 🛡️ ATOMIC CLAIM (READY -> LEASED)
     * Strictly claims ONLY 'ready' jobs.
     * RETRYWAIT AND EXPIRED LEASES ARE NOT DIRECTLY CLAIMABLE.
     */
    async claimReadyJob(idempotencyKey, workerId) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            // 🛡️ STATE LOCK: ONLY 'ready' allowed for direct claim.
            if (data.state !== 'ready')
                return false;
            // 🛡️ LEASE GUARD: If already leased/running/metadata present, block.
            if (data.leaseOwner || data.leaseExpiresAtUtc)
                return false;
            const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);
            transaction.update(docRef, {
                state: 'leased',
                leaseOwner: workerId,
                leaseExpiresAtUtc: admin.firestore.Timestamp.fromDate(expiryDate),
                attempts: admin.firestore.FieldValue.increment(1),
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ WAKE RETRY (retryWait -> ready)
     * Explicit authority required to make a retryWait job claimable.
     */
    async wakeRetry(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'retryWait')
                return false;
            transaction.update(docRef, {
                state: 'ready',
                nextRetryAtUtc: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ LEASE RECOVERY (EXPIRED -> READY)
     */
    async recoverExpiredLease(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            const now = Date.now();
            const hasLease = !!data.leaseExpiresAtUtc;
            const isExpired = hasLease && data.leaseExpiresAtUtc.toMillis() < now;
            if (!isExpired)
                return false;
            transaction.update(docRef, {
                state: 'ready',
                leaseOwner: null,
                leaseExpiresAtUtc: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ HEARTBEAT
     */
    async renewLease(idempotencyKey, workerId) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'leased' && data.state !== 'running')
                return false;
            if (data.leaseOwner !== workerId)
                return false;
            const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);
            transaction.update(docRef, {
                leaseExpiresAtUtc: admin.firestore.Timestamp.fromDate(expiryDate),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ WORK START (LEASED -> RUNNING)
     */
    async startRunning(idempotencyKey, workerId) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'leased' || data.leaseOwner !== workerId)
                return false;
            transaction.update(docRef, {
                state: 'running',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ STATE TRANSITION (MANUAL/AUTO)
     */
    async updateState(idempotencyKey, newState, options = {}) {
        const update = {
            state: newState,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        if (options.error)
            update.lastError = options.error;
        if (options.outputHash)
            update.outputHash = options.outputHash;
        if (options.clearLease) {
            update.leaseOwner = null;
            update.leaseExpiresAtUtc = null;
        }
        if (newState === 'approved') {
            update.finishedAt = admin.firestore.FieldValue.serverTimestamp();
        }
        await this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey).update(update);
    }
    /**
     * 🛡️ DEPENDENCY UNLOCK (waitingDependency -> ready)
     */
    async unlockDependency(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'waitingDependency')
                return false;
            transaction.update(docRef, {
                state: 'ready',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ TERMINAL SUCCESS
     */
    async complete(idempotencyKey, outputHash) {
        await this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey).update({
            state: 'approved',
            outputHash: outputHash,
            leaseOwner: null,
            leaseExpiresAtUtc: null,
            finishedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    /**
     * 🛡️ FAILURE & RETRY
     */
    async fail(idempotencyKey, error) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return;
            const data = snap.data();
            const canRetry = data.attempts < data.maxAttempts;
            const update = {
                state: canRetry ? 'retryWait' : 'failedTerminal',
                lastError: error,
                leaseOwner: null,
                leaseExpiresAtUtc: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (canRetry) {
                const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, data.attempts - 1);
                update.nextRetryAtUtc = admin.firestore.Timestamp.fromMillis(Date.now() + backoff);
            }
            transaction.update(docRef, update);
        });
    }
}
exports.AafQueueRepository = AafQueueRepository;
//# sourceMappingURL=aafQueueRepository.js.map