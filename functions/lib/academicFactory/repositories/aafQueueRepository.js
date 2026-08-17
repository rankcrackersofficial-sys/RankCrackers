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
 * Persistent Transaction Core for AAF-004B.
 * Enforces atomic state transitions and lease-based execution.
 */
class AafQueueRepository {
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * 🛡️ IDEMPOTENT ENQUEUE
     * Inserts or merges an AAF job. Use idempotencyKey as Document ID.
     */
    async enqueue(job) {
        if (!job.idempotencyKey)
            throw new Error('AAF_QUEUE_ERROR: idempotencyKey required for enqueue.');
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(job.idempotencyKey);
        await docRef.set({
            ...job,
            queueContract: 'academic_factory_v1',
            status: job.status || 'ready',
            attempts: job.attempts || 0,
            maxAttempts: job.maxAttempts || 3,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return job.idempotencyKey;
    }
    /**
     * 🛡️ ATOMIC CLAIM (START_RUNNING)
     * Claims a 'ready' or 'retry_pending' job for execution.
     */
    async claim(jobId, workerId) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            // Only claim if status is 'ready' or 'retry_pending'
            const isEligible = data.status === 'ready' || data.status === 'retry_pending';
            if (!isEligible)
                return false;
            // Check for valid lease (if any exists)
            const now = Date.now();
            if (data.leaseExpiry && data.leaseExpiry.toMillis() > now) {
                // Active lease still exists, concurrent claim blocked.
                return false;
            }
            const expiryDate = new Date(now + DEFAULT_LEASE_DURATION_MS);
            transaction.update(docRef, {
                status: 'running',
                leaseOwner: workerId,
                leaseExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
                attempts: admin.firestore.FieldValue.increment(1),
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ LEASE RENEWAL (HEARTBEAT)
     */
    async renewLease(jobId, workerId) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);
        return await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return false;
            const data = snap.data();
            if (data.status !== 'running' || data.leaseOwner !== workerId)
                return false;
            const expiryDate = new Date(Date.now() + DEFAULT_LEASE_DURATION_MS);
            transaction.update(docRef, {
                leaseExpiry: admin.firestore.Timestamp.fromDate(expiryDate),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return true;
        });
    }
    /**
     * 🛡️ JOB COMPLETION
     */
    async complete(jobId, outputHash) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);
        await docRef.update({
            status: 'completed',
            outputHash: outputHash,
            leaseOwner: null,
            leaseExpiry: null,
            finishedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
    /**
     * 🛡️ JOB FAILURE & RETRY LOGIC
     */
    async fail(jobId, error) {
        const docRef = this.db.collection(QUEUE_COLLECTION).doc(jobId);
        await this.db.runTransaction(async (transaction) => {
            const snap = await transaction.get(docRef);
            if (!snap.exists)
                return;
            const data = snap.data();
            const canRetry = data.attempts < data.maxAttempts;
            const update = {
                status: canRetry ? 'retry_pending' : 'failed',
                lastError: error,
                leaseOwner: null,
                leaseExpiry: null,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            };
            if (canRetry) {
                // Exponential backoff: base * (2 ^ (attempts - 1))
                const backoff = RETRY_BACKOFF_BASE_MS * Math.pow(2, data.attempts - 1);
                update.nextRetryAt = admin.firestore.Timestamp.fromMillis(Date.now() + backoff);
            }
            transaction.update(docRef, update);
        });
    }
}
exports.AafQueueRepository = AafQueueRepository;
//# sourceMappingURL=aafQueueRepository.js.map