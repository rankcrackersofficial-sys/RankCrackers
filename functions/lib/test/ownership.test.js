"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const queueWorker_1 = require("../workers/queueWorker");
describe('AI Queue Ownership Classification (FIX2)', () => {
    test('should accept legacy generic tasks only', () => {
        queueWorker_1.LEGACY_GENERIC_TYPES.forEach(type => {
            expect((0, queueWorker_1.isLegacyGenericTask)({ type })).toBe(true);
        });
        expect((0, queueWorker_1.isLegacyGenericTask)({ type: 'mcq' })).toBe(true);
        expect((0, queueWorker_1.isLegacyGenericTask)({ type: 'random' })).toBe(false);
    });
    test('should identify AAF tasks via queueContract', () => {
        const aafTask = { queueContract: 'academic_factory_v1' };
        expect((0, queueWorker_1.isAafTask)(aafTask)).toBe(true);
        expect((0, queueWorker_1.isLegacyGenericTask)(aafTask)).toBe(false);
    });
    test('should identify specialized tasks', () => {
        queueWorker_1.SPECIALIZED_TASK_TYPES.forEach(type => {
            expect((0, queueWorker_1.isSpecializedTask)({ type })).toBe(true);
            expect((0, queueWorker_1.isLegacyGenericTask)({ type })).toBe(false);
        });
    });
    test('should fail-closed for missing types', () => {
        expect((0, queueWorker_1.isLegacyGenericTask)({})).toBe(false);
        expect((0, queueWorker_1.isSpecializedTask)({})).toBe(false);
    });
    test('one owner per supported type invariant', () => {
        // Check if any generic type is also specialized
        const overlap = queueWorker_1.LEGACY_GENERIC_TYPES.filter(type => queueWorker_1.SPECIALIZED_TASK_TYPES.includes(type));
        expect(overlap.length).toBe(0);
    });
});
//# sourceMappingURL=ownership.test.js.map