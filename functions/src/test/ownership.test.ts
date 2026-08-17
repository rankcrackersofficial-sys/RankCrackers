import { isLegacyGenericTask, isSpecializedTask, isAafTask, LEGACY_GENERIC_TYPES, SPECIALIZED_TASK_TYPES } from '../workers/queueWorker';

describe('AI Queue Ownership Classification (FIX2)', () => {
  test('should accept legacy generic tasks only', () => {
    LEGACY_GENERIC_TYPES.forEach(type => {
      expect(isLegacyGenericTask({ type })).toBe(true);
    });
    expect(isLegacyGenericTask({ type: 'mcq' })).toBe(true);
    expect(isLegacyGenericTask({ type: 'random' })).toBe(false);
  });

  test('should identify AAF tasks via queueContract', () => {
    const aafTask = { queueContract: 'academic_factory_v1' };
    expect(isAafTask(aafTask)).toBe(true);
    expect(isLegacyGenericTask(aafTask)).toBe(false);
  });

  test('should identify specialized tasks', () => {
    SPECIALIZED_TASK_TYPES.forEach(type => {
      expect(isSpecializedTask({ type })).toBe(true);
      expect(isLegacyGenericTask({ type })).toBe(false);
    });
  });

  test('should fail-closed for missing types', () => {
    expect(isLegacyGenericTask({})).toBe(false);
    expect(isSpecializedTask({})).toBe(false);
  });

  test('one owner per supported type invariant', () => {
    // Check if any generic type is also specialized
    const overlap = LEGACY_GENERIC_TYPES.filter(type => SPECIALIZED_TASK_TYPES.includes(type));
    expect(overlap.length).toBe(0);
  });
});
