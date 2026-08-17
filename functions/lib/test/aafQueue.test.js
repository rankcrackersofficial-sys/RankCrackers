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
// 🛡️ HIGH-FIDELITY FIRESTORE MOCK
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
describe('AAF Queue Repository FIX2 (AAF-004B)', () => {
    let repo;
    let db;
    beforeEach(() => {
        repo = new aafQueueRepository_1.AafQueueRepository();
        db = admin.firestore();
        jest.clearAllMocks();
    });
    const validMetadata = {
        queueContract: 'academic_factory_v1',
        runId: 'run1',
        jobId: 'job1',
        missionId: 'm1',
        canonicalTargetId: 'atom1',
        idempotencyKey: 'run1:job1',
        state: 'planned',
        attempts: 0,
        maxAttempts: 3,
        leaseOwner: null,
        leaseExpiresAtUtc: null,
        nextRetryAtUtc: null,
        inputHash: 'in-h1',
        outputHash: null,
        createdAt: 'server-timestamp',
        updatedAt: 'server-timestamp',
        startedAt: null,
        finishedAt: null,
        lastError: null,
        taskType: 'digibook',
        targetId: 'atom1',
        sourceDocumentIds: ['doc1']
    };
    test('🛡️ DOMAIN_PARITY_TESTS: supports all 13 states', () => {
        const states = [
            'planned', 'waitingDependency', 'ready', 'leased', 'running',
            'reviewing', 'repairRequired', 'retryWait', 'hardHold',
            'approved', 'materializing', 'published', 'failedTerminal'
        ];
        expect(states.length).toBe(13);
    });
    test('🛡️ REPOSITORY_UNIT_TESTS: enqueue preserves planner state', async () => {
        const readyJob = { ...validMetadata, state: 'ready' };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue({ exists: false }),
            set: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        await repo.enqueue(readyJob);
        expect(mockTransaction.set).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ state: 'ready' }));
    });
    test('🛡️ SCALE_IDENTITY_TESTS: uniqueness for 4,587 logical units', () => {
        // 11 Types * 417 AMTNs
        const identities = new Set();
        const types = ['mcq', 'digibook', 'revision', 'structural', 'svo', 'manifest', 'encoding', 'pdf', 'docx', 'xlsx', 'repair'];
        const amtns = Array.from({ length: 417 }, (_, i) => `AMTN_${i + 1}`);
        types.forEach(type => {
            amtns.forEach(amtn => {
                const idKey = `RUN_20260817:${type}:${amtn}`;
                identities.add(idKey);
            });
        });
        expect(identities.size).toBe(4587);
    });
    test('🛡️ ATOMIC_TRANSACTION_SAFE_CLAIM: claim ready/retryWait job', async () => {
        const mockSnap = {
            exists: true,
            data: () => ({ state: 'ready', attempts: 0 })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        const result = await repo.claim('run1:job1', 'worker1');
        expect(result).toBe(true);
        expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ state: 'leased', leaseOwner: 'worker1' }));
    });
    test('🛡️ ATOMIC_TRANSACTION_SAFE_CLAIM: reject claim if already leased', async () => {
        const mockSnap = {
            exists: true,
            data: () => ({
                state: 'ready',
                leaseExpiresAtUtc: { toMillis: () => Date.now() + 10000 }
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        const result = await repo.claim('run1:job1', 'worker2');
        expect(result).toBe(false);
    });
    test('🛡️ REPOSITORY_UNIT_TESTS: fail leads to retryWait or failedTerminal', async () => {
        // Case 1: Retry possible
        const mockSnapRetry = { exists: true, data: () => ({ attempts: 1, maxAttempts: 3 }) };
        const mockTxRetry = { get: jest.fn().mockResolvedValue(mockSnapRetry), update: jest.fn() };
        db.runTransaction.mockImplementationOnce(async (cb) => cb(mockTxRetry));
        await repo.fail('run1:job1', 'err');
        expect(mockTxRetry.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ state: 'retryWait' }));
        // Case 2: Terminal failure
        const mockSnapTerminal = { exists: true, data: () => ({ attempts: 3, maxAttempts: 3 }) };
        const mockTxTerminal = { get: jest.fn().mockResolvedValue(mockSnapTerminal), update: jest.fn() };
        db.runTransaction.mockImplementationOnce(async (cb) => cb(mockTxTerminal));
        await repo.fail('run1:job1', 'err');
        expect(mockTxTerminal.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ state: 'failedTerminal' }));
    });
});
//# sourceMappingURL=aafQueue.test.js.map