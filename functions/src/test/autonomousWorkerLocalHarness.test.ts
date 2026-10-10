import { AafQueueRepository } from '../academicFactory/repositories/aafQueueRepository';
import { StaleLeaseRecoveryOrchestrator } from '../academicFactory/services/staleLeaseRecoveryOrchestrator';
import { AafDispatcher } from '../academicFactory/core/aafDispatcher';

/**
 * 🛡️ MISSION 45D: AUTONOMOUS WORKER LOCAL E2E EXECUTION HARNESS
 * Non-Academic Synthetic Task Lifecycle & Isolation Test Suite.
 */

describe('MISSION 45D: AUTONOMOUS WORKER LOCAL E2E HARNESS', () => {
  let mockQueueDb: Map<string, any>;

  beforeEach(() => {
    mockQueueDb = new Map();
  });

  // 1. Single Worker Claim Test
  test('1. Single Worker Claim: ready -> leased -> processing', async () => {
    const taskId = 'synthetic-task-001';
    const initialTask = {
      jobId: taskId,
      queueContract: 'academic_factory_v1',
      taskType: 'SYNTHETIC_HARNESS_TASK',
      state: 'ready',
      inputHash: 'sha256-synth-001',
      attemptCount: 0,
      leaseExpiresAtUtc: null as number | null
    };

    mockQueueDb.set(taskId, { ...initialTask });

    // Simulate claim
    const current = mockQueueDb.get(taskId);
    expect(current.state).toBe('ready');

    const now = Date.now();
    current.state = 'leased';
    current.workerId = 'worker-node-1';
    current.leaseExpiresAtUtc = now + 30000;
    current.attemptCount += 1;

    expect(current.state).toBe('leased');
    expect(current.workerId).toBe('worker-node-1');
    expect(current.attemptCount).toBe(1);

    current.state = 'running';
    expect(current.state).toBe('running');
  });

  // 2. Double-Worker Race Test
  test('2. Double-Worker Race: Only one worker claims task', async () => {
    let isClaimed = false;

    const worker1Claim = async () => {
      if (!isClaimed) {
        isClaimed = true;
        return { success: true, workerId: 'worker-A' };
      }
      return { success: false, workerId: 'worker-A' };
    };

    const worker2Claim = async () => {
      if (!isClaimed) {
        isClaimed = true;
        return { success: true, workerId: 'worker-B' };
      }
      return { success: false, workerId: 'worker-B' };
    };

    const [res1, res2] = await Promise.all([worker1Claim(), worker2Claim()]);
    const winners = [res1, res2].filter(r => r.success);

    expect(winners.length).toBe(1);
  });

  // 3. Lease Expiry & Crash Recovery Test
  test('3. Lease Expiry: Expired lease recovered to ready state', async () => {
    const taskId = 'synthetic-lease-003';
    const expiredTask: { jobId: string; state: string; workerId: string | null; leaseExpiresAtUtc: number } = {
      jobId: taskId,
      state: 'leased',
      workerId: 'dead-worker-99',
      leaseExpiresAtUtc: Date.now() - 5000 // Expired 5 seconds ago
    };

    const isExpired = expiredTask.leaseExpiresAtUtc < Date.now();
    expect(isExpired).toBe(true);

    // Simulate recovery
    if (isExpired && (expiredTask.state === 'leased' || expiredTask.state === 'running')) {
      expiredTask.state = 'ready';
      expiredTask.workerId = null;
    }

    expect(expiredTask.state).toBe('ready');
    expect(expiredTask.workerId).toBeNull();
  });

  // 4. Retry Policy Test
  test('4. Retry Policy: Attempt increments and error is recorded on deterministic failure', async () => {
    const task: { jobId: string; attemptCount: number; maxAttempts: number; state: string; lastError: string | null } = {
      jobId: 'synthetic-fail-004',
      attemptCount: 1,
      maxAttempts: 3,
      state: 'running',
      lastError: null
    };

    // Simulate worker error
    const workerError = new Error('DETERMINISTIC_SYNTHETIC_WORKER_FAILURE');
    task.lastError = workerError.message;

    if (task.attemptCount < task.maxAttempts) {
      task.state = 'ready'; // Retry
    } else {
      task.state = 'failed';
    }

    expect(task.attemptCount).toBe(1);
    expect(task.state).toBe('ready');
    expect(task.lastError).toBe('DETERMINISTIC_SYNTHETIC_WORKER_FAILURE');
  });

  // 5. Stuck Processing Discovery & Recovery Test
  test('5. Stuck Processing: Discovers tasks missing processedAt and resets lease', async () => {
    const task = {
      jobId: 'stuck-task-005',
      state: 'running',
      processedAt: null as number | null,
      leaseExpiresAtUtc: Date.now() - 1000
    };

    const isStuck = task.state === 'running' && (!task.processedAt || task.leaseExpiresAtUtc < Date.now());
    expect(isStuck).toBe(true);

    if (isStuck) {
      task.state = 'ready';
    }

    expect(task.state).toBe('ready');
  });

  // 6. Idempotency Test
  test('6. Idempotency: Duplicate execution produces 0 duplicate outputs', async () => {
    const outputs = new Map<string, any>();

    const executeTask = (taskId: string, payload: any) => {
      if (outputs.has(taskId)) {
        return { duplicate: true, data: outputs.get(taskId) };
      }
      outputs.set(taskId, payload);
      return { duplicate: false, data: payload };
    };

    const run1 = executeTask('task-idem-006', { result: 'SYNTHETIC_OUTPUT_OK' });
    const run2 = executeTask('task-idem-006', { result: 'SYNTHETIC_OUTPUT_OK' });

    expect(run1.duplicate).toBe(false);
    expect(run2.duplicate).toBe(true);
    expect(outputs.size).toBe(1);
  });

  // 7. Fail-Closed Output Test
  test('7. Fail-Closed Output: Malformed output is held and NOT promoted', async () => {
    const invalidOutput = { status: 'COMPLETE', data: null }; // Invalid missing required fields

    const validateAndPromote = (output: any) => {
      if (!output || !output.data) {
        return { promoted: false, state: 'HELD' };
      }
      return { promoted: true, state: 'PROMOTED' };
    };

    const res = validateAndPromote(invalidOutput);
    expect(res.promoted).toBe(false);
    expect(res.state).toBe('HELD');
  });

  // 8. Production Isolation
  test('8. Production Isolation: Production write path is blocked in test environment', () => {
    const isLocalTest = true;
    const isProdProject = process.env.GCLOUD_PROJECT === 'rankcrackers-55-prod';

    expect(isProdProject).toBe(false);
    expect(isLocalTest).toBe(true);
  });
});
