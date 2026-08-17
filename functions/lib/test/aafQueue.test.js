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
describe('AAF Queue Repository (AAF-004B)', () => {
    let repo;
    let db;
    beforeEach(() => {
        repo = new aafQueueRepository_1.AafQueueRepository();
        db = admin.firestore();
        jest.clearAllMocks();
    });
    test('🛡️ enqueue: should use idempotencyKey as document ID', async () => {
        const job = { idempotencyKey: 'key123', missionId: 'm1', taskType: 'test' };
        await repo.enqueue(job);
        expect(db.collection).toHaveBeenCalledWith('ai_queue');
        expect(db.collection().doc).toHaveBeenCalledWith('key123');
        expect(db.collection().doc().set).toHaveBeenCalledWith(expect.objectContaining({
            idempotencyKey: 'key123',
            queueContract: 'academic_factory_v1',
            status: 'ready'
        }), { merge: true });
    });
    test('🛡️ complete: should update status to completed', async () => {
        await repo.complete('key123', 'hash456');
        expect(db.collection().doc().update).toHaveBeenCalledWith(expect.objectContaining({
            status: 'completed',
            outputHash: 'hash456',
            leaseOwner: null
        }));
    });
    test('🛡️ claim: should handle atomic claim via transaction', async () => {
        const mockSnap = {
            exists: true,
            data: () => ({
                status: 'ready',
                attempts: 0
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        const result = await repo.claim('key123', 'worker1');
        expect(result).toBe(true);
        expect(mockTransaction.update).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            status: 'running',
            leaseOwner: 'worker1'
        }));
    });
    test('🛡️ claim: should block concurrent claim if lease active', async () => {
        const futureDate = Date.now() + 100000;
        const mockSnap = {
            exists: true,
            data: () => ({
                status: 'ready',
                leaseExpiry: { toMillis: () => futureDate }
            })
        };
        const mockTransaction = {
            get: jest.fn().mockResolvedValue(mockSnap),
            update: jest.fn()
        };
        db.runTransaction.mockImplementation(async (cb) => cb(mockTransaction));
        const result = await repo.claim('key123', 'worker2');
        expect(result).toBe(false);
        expect(mockTransaction.update).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=aafQueue.test.js.map