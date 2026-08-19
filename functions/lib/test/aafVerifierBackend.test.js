"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aafVerifierBackend_1 = require("../academicFactory/services/aafVerifierBackend");
describe('AAF-006B compatibility verifier export', () => {
    test('legacy import resolves to the source-bound backend authority', () => {
        const backend = new aafVerifierBackend_1.SourceBoundIndependentVerifierBackend();
        expect(backend.usesAiTasksAsLifecycleAuthority).toBe(false);
        expect(backend.writesSentinelDrafts).toBe(false);
        expect(backend.verifierDirectAafStateWrites).toBe(0);
    });
    test('legacy provider adapter remains fail-closed with zero live calls', async () => {
        const adapter = new aafVerifierBackend_1.RealProviderExecutionDisabledAdapter();
        expect(adapter.liveExecutionAllowed).toBe(false);
        await expect(adapter.verify({})).rejects.toThrow('REAL_PROVIDER_EXECUTION_DISABLED');
    });
});
//# sourceMappingURL=aafVerifierBackend.test.js.map