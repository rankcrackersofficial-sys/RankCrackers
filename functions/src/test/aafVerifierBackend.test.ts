import {
  RealProviderExecutionDisabledAdapter,
  SourceBoundIndependentVerifierBackend,
} from '../academicFactory/services/aafVerifierBackend';

describe('AAF-006B compatibility verifier export', () => {
  test('legacy import resolves to the source-bound backend authority', () => {
    const backend = new SourceBoundIndependentVerifierBackend();

    expect(backend.usesAiTasksAsLifecycleAuthority).toBe(false);
    expect(backend.writesSentinelDrafts).toBe(false);
    expect(backend.verifierDirectAafStateWrites).toBe(0);
  });

  test('legacy provider adapter remains fail-closed with zero live calls', async () => {
    const adapter = new RealProviderExecutionDisabledAdapter();

    expect(adapter.liveExecutionAllowed).toBe(false);
    await expect(adapter.verify({} as never)).rejects.toThrow(
      'REAL_PROVIDER_EXECUTION_DISABLED',
    );
  });
});
