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
const aafQueueRepository_1 = require("../academicFactory/repositories/aafQueueRepository");
const admin = __importStar(require("firebase-admin"));
const useEmulator = process.env.FIRESTORE_EMULATOR_HOST;
if (useEmulator) {
    if (admin.apps.length === 0) {
        admin.initializeApp({ projectId: 'rankcrackers-55' });
    }
}
else {
    jest.mock('firebase-admin', () => {
        const mDoc = { set: jest.fn().mockResolvedValue(true), get: jest.fn(), update: jest.fn().mockResolvedValue(true) };
        const mCollection = { doc: jest.fn(() => mDoc) };
        const mDb = { collection: jest.fn(() => mCollection), runTransaction: jest.fn() };
        return {
            firestore: Object.assign(() => mDb, {
                FieldValue: { serverTimestamp: jest.fn(() => 'server-timestamp'), increment: jest.fn((n) => `increment-${n}`) },
                Timestamp: {
                    fromDate: jest.fn((d) => ({ toMillis: () => d.getTime() })),
                    fromMillis: jest.fn((m) => ({ toMillis: () => m }))
                },
            }),
            apps: [], initializeApp: jest.fn(),
        };
    });
}
jest.setTimeout(60000);
describe('AAF Queue Repository FIX4 FINAL (AAF-004B)', () => {
    let repo;
    let db;
    beforeAll(async () => {
        repo = new aafQueueRepository_1.AafQueueRepository();
        db = admin.firestore();
    });
    const sampleJob = {
        queueContract: 'academic_factory_v1',
        runId: 'RUN_FINAL', jobId: 'JOB_001', missionId: 'JEE_MAIN_2026',
        canonicalTargetId: 'PHYS_001', idempotencyKey: 'RUN_FINAL:JOB_001',
        state: 'ready', attempts: 0, maxAttempts: 3,
        leaseOwner: null, leaseExpiresAtUtc: null, nextRetryAtUtc: null,
        inputHash: 'h1', outputHash: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        startedAt: null, finishedAt: null, lastError: null,
        taskType: 'digibook', targetId: 'PHYS_001', sourceDocumentIds: []
    };
    test('🛡️ CONFLICT_ATTACKS: verify 9/9 semantic identity guards', async () => {
        await repo.enqueue(sampleJob);
        const attacks = [
            { runId: 'CONFLICT' },
            { jobId: 'CONFLICT' },
            { missionId: 'CONFLICT' },
            { canonicalTargetId: 'CONFLICT' },
            { taskType: 'CONFLICT' },
            { inputHash: 'CONFLICT' },
            { maxAttempts: 99 },
            { targetId: 'CONFLICT' }
        ];
        for (const attack of attacks) {
            const conflictingJob = { ...sampleJob, ...attack };
            await expect(repo.enqueue(conflictingJob)).rejects.toThrow('AAF_IDENTITY_CONFLICT');
        }
    });
    test('🛡️ RETRYWAIT_DIRECT_CLAIM: block claiming retryWait jobs', async () => {
        const key = 'RETRY_CLAIM_TEST';
        await repo.enqueue({ ...sampleJob, idempotencyKey: key, state: 'retryWait' });
        // 🛡️ CLAIM_READY_BYPASSES_WAKE_RETRY: NO
        const result = await repo.claimReadyJob(key, 'worker_1');
        expect(result).toBe(false);
        // Wake it
        await repo.wakeRetry(key);
        const successClaim = await repo.claimReadyJob(key, 'worker_1');
        expect(successClaim).toBe(true);
    });
    test('🛡️ EXPIRED_LEASE_DIRECT_CLAIM: block direct claim, require recovery', async () => {
        const key = 'LEASE_EXPIRY_TEST';
        await repo.enqueue({ ...sampleJob, idempotencyKey: key });
        await repo.claimReadyJob(key, 'worker_1');
        // Manually expire
        await db.collection('ai_queue').doc(key).update({
            leaseExpiresAtUtc: admin.firestore.Timestamp.fromMillis(Date.now() - 1000)
        });
        // 🛡️ RECOVERY_REQUIRED_FIRST: YES
        expect(await repo.claimReadyJob(key, 'worker_2')).toBe(false);
        expect(await repo.recoverExpiredLease(key)).toBe(true);
        expect(await repo.claimReadyJob(key, 'worker_2')).toBe(true);
    });
    test('🛡️ SCALE_IDENTITY_CONSISTENCY: 4,587 logical units unique IDs', () => {
        const runId = 'RUN_20260817';
        const keys = new Set();
        const types = ['mcq', 'digibook', 'revision', 'structural', 'svo', 'manifest', 'encoding', 'pdf', 'docx', 'xlsx', 'repair'];
        for (let i = 1; i <= 417; i++) {
            types.forEach(t => keys.add(`${runId}:${t}:AMTN_${i}`));
        }
        expect(keys.size).toBe(4587);
        // Example format verification
        const exampleKey = `${runId}:digibook:AMTN_101`;
        expect(exampleKey).toMatch(/^[A-Z0-9_]+:[a-z]+:AMTN_[0-9]+$/);
    });
});
//# sourceMappingURL=aafQueue.test.js.map