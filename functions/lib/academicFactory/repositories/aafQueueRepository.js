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
 * Persistent Transaction Core for AAF-004C.
 * Enforces strict domain parity, lease authority, and semantic idempotency.
 */
class AafQueueRepository {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * 🛡️ TRANSACTIONAL ENQUEUE
     */
    async enqueue(job) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);
        await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (snap.exists) {
                const existing = snap.data();
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
                const existingDeps = JSON.stringify([...(existing.dependencyJobIds || [])].sort());
                const jobDeps = JSON.stringify([...(job.dependencyJobIds || [])].sort());
                if (existingDeps !== jobDeps)
                    conflicts.push('dependencyJobIds');
                if (conflicts.length > 0) {
                    throw new Error(`AAF_IDENTITY_CONFLICT: Job ${job.idempotencyKey} mismatch on: ${conflicts.join(', ')}.`);
                }
                transaction.update(docRef, {
                    ...job,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
            else {
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
     * 🛡️ INITIAL ROOT ACTIVATION (planned -> ready)
     */
    async activatePlannedRoot(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'planned')
                return false;
            if (data.dependencyJobIds && data.dependencyJobIds.length > 0)
                return false;
            transaction.update(docRef, {
                state: 'ready',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ DEPENDENCY UNLOCK (waitingDependency -> ready)
     */
    async unlockWaitingJob(idempotencyKey) {
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
     * 🛡️ ATOMIC CLAIM (ready -> leased)
     */
    async claimReadyJob(idempotencyKey, workerId) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'ready')
                return false;
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
     * 🛡️ START WORK (leased -> running)
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
     * 🛡️ SUBMIT FOR REVIEW (running -> reviewing)
     */
    async submitForReview(idempotencyKey, workerId, outputHash) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'running' || data.leaseOwner !== workerId)
                return false;
            transaction.update(docRef, {
                state: 'reviewing',
                outputHash: outputHash,
                leaseOwner: null,
                leaseExpiresAtUtc: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ APPROVE (reviewing -> approved)
     */
    async approveJob(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'reviewing')
                return false;
            transaction.update(docRef, {
                state: 'approved',
                finishedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ MARK MATERIALIZING (approved -> materializing)
     */
    async markMaterializing(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'approved')
                return false;
            transaction.update(docRef, {
                state: 'materializing',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ MARK PUBLISHED (materializing -> published)
     */
    async markPublished(idempotencyKey) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(idempotencyKey);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.state !== 'materializing')
                return false;
            transaction.update(docRef, {
                state: 'published',
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ WAKE RETRY (retryWait -> ready)
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
     * 🛡️ LEASE RECOVERY (leased/running expired -> ready)
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