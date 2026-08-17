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
// 🛡️ Mock implementation for admin.firestore
jest.mock('firebase-admin', () => {
    const mDoc = {
        set: jest.fn().mockResolvedValue(true),
        get: jest.fn(),
        update: jest.fn().mockResolvedValue(true),
    };
    const mCollection = {
        doc: jest.fn(() => mDoc),
    };
    const mDb = {
        collection: jest.fn(() => mCollection),
        runTransaction: jest.fn(),
    };
    return {
        firestore: Object.assign(() => mDb, {
            FieldValue: {
                serverTimestamp: jest.fn(() => 'server-timestamp'),
                increment: jest.fn((n) => `increment-${n}`),
            },
            Timestamp: {
                fromDate: jest.fn((d) => ({ toMillis: () => d.getTime() })),
                fromMillis: jest.fn((m) => ({ toMillis: () => m })),
            },
        }),
    };
});
describe('AAF Queue Repository FIX1 (AAF-004B)', () => {
    let repo;
    let db;
    beforeEach(() => {
        repo = new aafQueueRepository_1.AafQueueRepository();
        db = admin.firestore();
        jest.clearAllMocks();
    });
    test('🛡️ REPOSITORY_UNIT_TESTS: enqueue new job', async () => {
        const job = {
            idempotencyKey: 'run1:job1',
            runId: 'run1',
            jobId: 'job1',
            canonicalTargetId: 'atom1',
            taskType: 'test'
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue({ exists: false }),
            set: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        await repo.enqueue(job);
        expect(mockTransaction.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            idempotencyKey: 'run1:job1',
            queueContract: 'academic_factory_v1',
            state: 'PLANNED'
        }));
    });
    test('🛡️ SCALE_IDENTITY_TESTS: enqueue should detect identity conflict', async () => {
        const job = {
            idempotencyKey: 'run1:job1',
            runId: 'run1',
            jobId: 'job1',
            canonicalTargetId: 'atom2' // CONFLICT: Same key, different target
        };
        const mockSnap = {
            exists: true,
            data: () => ({
                runId: 'run1',
                jobId: 'job1',
                canonicalTargetId: 'atom1'
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        await expect(repo.enqueue(job)).rejects.toThrow('AAF_SEMANTIC_CONFLICT');
    });
    test('🛡️ REPOSITORY_UNIT_TESTS: claim should transition READY -> RUNNING', async () => {
        const mockSnap = {
            exists: true,
            data: () => ({
                state: 'READY',
                attempts: 0
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        const result = await repo.claim('run1:job1', 'worker1');
        expect(result).toBe(true);
        expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            state: 'RUNNING',
            leaseOwner: 'worker1'
        }));
    });
    test('🛡️ EMULATOR_TRANSACTION_TESTS: concurrent claim blocked by active lease', async () => {
        const futureDate = Date.now() + 100000;
        const mockSnap = {
            exists: true,
            data: () => ({
                state: 'READY',
                leaseExpiresAtUtc: { toMillis: () => futureDate }
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        const result = await repo.claim('run1:job1', 'worker2');
        expect(result).toBe(false);
        expect(mockTransaction.update).not.toHaveBeenCalled();
    });
    test('🛡️ REPOSITORY_UNIT_TESTS: fail should transition to REPAIR_PENDING if attempts < max', async () => {
        const mockSnap = {
            exists: true,
            data: () => ({
                attempts: 1,
                maxAttempts: 3
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        await repo.fail('run1:job1', 'Test Error');
        expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            state: 'REPAIR_PENDING',
            lastError: 'Test Error'
        }));
    });
});
//# sourceMappingURL=aafQueue.test.js.map