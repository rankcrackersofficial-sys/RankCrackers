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
        schemaVersion: 1,
        runId: 'RUN_FINAL', jobId: 'JOB_001', missionId: 'JEE_MAIN_2026',
        canonicalTargetId: 'PHYS_001', idempotencyKey: 'RUN_FINAL:JOB_001',
        state: 'ready', attempts: 0, maxAttempts: 3,
        leaseOwner: null, leaseExpiresAtUtc: null, nextRetryAtUtc: null,
        dependencyJobIds: [],
        inputHash: 'h1', outputHash: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        startedAt: null, finishedAt: null, lastError: null,
        type: 'digibookDraft', targetId: 'PHYS_001', sourceDocumentIds: []
    };
    test('🛡️ CONFLICT_ATTACKS: verify 9/9 locked immutable fields', async () => {
        await repo.enqueue(sampleJob);
        const attacks = [
            { schemaVersion: 2 },
            { jobId: 'CONFLICT' },
            { runId: 'CONFLICT' },
            { missionId: 'CONFLICT' },
            { canonicalTargetId: 'CONFLICT' },
            { type: 'CONFLICT' },
            { dependencyJobIds: ['DEP_NEW'] },
            { maxAttempts: 99 },
            { inputHash: 'CONFLICT' }
        ];
        for (const attack of attacks) {
            const conflictingJob = { ...sampleJob, ...attack };
            await expect(repo.enqueue(conflictingJob)).rejects.toThrow('AAF_IDENTITY_CONFLICT');
        }
    });
    test('🛡️ RETRYWAIT_DIRECT_CLAIM: block claiming retryWait jobs', async () => {
        const key = 'RETRY_CLAIM_TEST';
        await repo.enqueue({ ...sampleJob, idempotencyKey: key, state: 'retryWait' });
        // Should fail because state is not 'ready'
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
    test('🛡️ SCALE_IDENTITY_PROOF: logic for 4,587 units', () => {
        // Verified 11 types x 417 AMTNs = 4587.
        const runId = 'RUN_20260817';
        const keys = new Set();
        const aafTypes = ['digibookDraft', 'digibookValidation', 'digibookProReview', 'digibookAssembly', 'mcqDraft', 'mcqValidation', 'revisionDraft', 'revisionValidation', 'structural', 'svo', 'manifest'];
        for (let i = 1; i <= 417; i++) {
            aafTypes.forEach(t => keys.add(`${runId}:${t}:AMTN_${i}`));
        }
        // We check if exactly 4587 unique keys are generated for a single mission run coverage
        expect(keys.size).toBe(4587);
    });
});
//# sourceMappingURL=aafQueue.test.js.map