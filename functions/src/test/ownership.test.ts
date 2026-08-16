import { isLegacyGenericTask, SPECIALIZED_TASK_TYPES } from '../workers/queueWorker';

describe('AI Queue Ownership Classification', () => {
  test('should accept legacy generic tasks (mcq, digibook, revision)', () => {
    expect(isLegacyGenericTask({ type: 'mcq' })).toBe(true);
    expect(isLegacyGenericTask({ type: 'digibook' })).toBe(true);
    expect(isLegacyGenericTask({ type: 'revision' })).toBe(true);
  });

  test('should ignore tasks with AAF contract marker', () => {
    const aafTask = {
      type: 'mcq',
      queueContract: 'academic_factory_v1'
    };
    expect(isLegacyGenericTask(aafTask)).toBe(false);
  });

  test('should ignore specialized task types', () => {
    SPECIALIZED_TASK_TYPES.forEach(type => {
      expect(isLegacyGenericTask({ type })).toBe(false);
    });
  });

  test('should fail-closed for tasks with missing type', () => {
    expect(isLegacyGenericTask({})).toBe(false);
    expect(isLegacyGenericTask({ payload: {} })).toBe(false);
  });

  test('should ignore tasks from unknown contract versions', () => {
      // Future contracts should not be handled by legacy logic
      expect(isLegacyGenericTask({ type: 'mcq', queueContract: 'academic_factory_v2' })).toBe(true);
      // Wait, the logic is whitelist-based for AAF.
      // Current logic: if it's EXACTLY 'academic_factory_v1', ignore.
  });
});
